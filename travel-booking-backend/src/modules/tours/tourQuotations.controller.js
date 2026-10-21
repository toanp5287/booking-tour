import prisma from "../../config/postgres.js";
import { createPaymentHold } from "../bookings/bookings.controller.js";

// =================================================================
// TIỆN ÍCH
// =================================================================

const serializeBigInt = (value) => {
  if (typeof value === "bigint") return value.toString();

  if (Array.isArray(value)) return value.map(serializeBigInt);

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeBigInt(val)]),
    );
  }

  return value;
};

const toBigInt = (value) => {
  try {
    return BigInt(String(value));
  } catch {
    return null;
  }
};

const parseDateOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Tính toán tiền hoàn toàn ở backend.
const computePricing = (details) => {
  const items = Array.isArray(details?.items) ? details.items : [];

  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0,
  );
  const surcharge = Number(details?.surcharge || 0);
  const discount = Number(details?.discount || 0);
  const total = Math.max(subtotal + surcharge - discount, 0);
  const depositPercentage = clamp(
    Number(details?.deposit_percentage ?? 30),
    0,
    100,
  );
  const depositAmount = Math.round((total * depositPercentage) / 100);

  return {
    subtotal,
    surcharge,
    discount,
    total,
    depositPercentage,
    depositAmount,
  };
};

const buildDetailsWithPricing = (details) => {
  const pricing = computePricing(details);

  return {
    raw: details,
    value: {
      ...details,
      pricing: {
        subtotal: pricing.subtotal,
        surcharge: pricing.surcharge,
        discount: pricing.discount,
        total: pricing.total,
        deposit_percentage: pricing.depositPercentage,
        deposit_amount: pricing.depositAmount,
      },
    },
    pricing,
  };
};

const formatQuotation = (quotation) => serializeBigInt(quotation);

// =================================================================
// QUẢN TRỊ: TẠO / SỬA / GỬI BÁO GIÁ
// =================================================================

export const createQuotation = async (req, res, next) => {
  try {
    const requestId = toBigInt(req.body.request_id);
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Mã yêu cầu tour không hợp lệ",
      });
    }

    const request = await prisma.custom_tour_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu tour đoàn",
      });
    }

    const tourId = toBigInt(req.body.details.tour_id);
    const tour = await prisma.tours.findFirst({
      where: { id: tourId, deleted_at: null, status: "active" },
      select: { id: true },
    });
    if (!tour) {
      return res.status(400).json({
        success: false,
        message: "Tour không tồn tại hoặc đã ngừng hoạt động",
      });
    }

    const scheduleId = req.body.details.schedule_id
      ? toBigInt(req.body.details.schedule_id)
      : null;
    if (scheduleId) {
      const schedule = await prisma.tour_schedules.findFirst({
        where: { id: scheduleId, tour_id: tourId, deleted_at: null },
        select: { id: true },
      });
      if (!schedule) {
        return res.status(400).json({
          success: false,
          message: "Lịch khởi hành không thuộc tour đã chọn",
        });
      }
    }

    const { value: detailsValue, pricing } = buildDetailsWithPricing(
      req.body.details,
    );

    if (!Number.isFinite(pricing.total) || pricing.total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Tổng tiền báo giá không hợp lệ",
      });
    }

    const baseData = {
      request_id: requestId,
      created_by: BigInt(req.user.id),
      title: req.body.title?.trim() || null,
      status: "draft",
      currency: req.body.currency?.trim() || "VND",
      total_amount: pricing.total,
      deposit_amount: pricing.depositAmount,
      valid_until: parseDateOrNull(req.body.valid_until),
      details: detailsValue,
      terms: req.body.terms?.trim() || null,
      notes: req.body.notes?.trim() || null,
    };

    // Tạo phiên bản mới an toàn dựa trên unique (request_id, version).
    let created = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await prisma.$transaction(async (tx) => {
          const agg = await tx.tour_quotations.aggregate({
            where: { request_id: requestId },
            _max: { version: true },
          });
          const version = (agg._max.version ?? 0) + 1;

          return tx.tour_quotations.create({
            data: { ...baseData, version },
          });
        });
        break;
      } catch (error) {
        if (error?.code === "P2002") continue;
        throw error;
      }
    }

    if (!created) {
      return res.status(409).json({
        success: false,
        message: "Không thể tạo phiên bản báo giá, vui lòng thử lại",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Tạo báo giá thành công",
      data: formatQuotation(created),
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotationsByRequest = async (req, res, next) => {
  try {
    const requestId = toBigInt(req.params.request_id);
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Mã yêu cầu tour không hợp lệ",
      });
    }

    const quotations = await prisma.tour_quotations.findMany({
      where: { request_id: requestId },
      orderBy: { version: "desc" },
      include: {
        creator: { select: { id: true, full_name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách báo giá thành công",
      data: quotations.map(formatQuotation),
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotation = async (req, res, next) => {
  try {
    const id = toBigInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Mã báo giá không hợp lệ",
      });
    }

    const quotation = await prisma.tour_quotations.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, full_name: true, email: true } },
        request: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo giá",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết báo giá thành công",
      data: formatQuotation(quotation),
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const id = toBigInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Mã báo giá không hợp lệ",
      });
    }

    const quotation = await prisma.tour_quotations.findUnique({
      where: { id },
    });
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo giá",
      });
    }

    if (quotation.status !== "draft") {
      return res.status(409).json({
        success: false,
        message: "Chỉ có thể sửa báo giá khi còn ở trạng thái nháp",
      });
    }

    const data = {};

    if (req.body.title !== undefined)
      data.title = req.body.title?.trim() || null;
    if (req.body.currency !== undefined)
      data.currency = req.body.currency?.trim() || "VND";
    if (req.body.valid_until !== undefined)
      data.valid_until = parseDateOrNull(req.body.valid_until);
    if (req.body.terms !== undefined)
      data.terms = req.body.terms?.trim() || null;
    if (req.body.notes !== undefined)
      data.notes = req.body.notes?.trim() || null;

    if (req.body.details) {
      const tourId = toBigInt(req.body.details.tour_id);
      const tour = await prisma.tours.findFirst({
        where: { id: tourId, deleted_at: null, status: "active" },
        select: { id: true },
      });
      if (!tour) {
        return res.status(400).json({
          success: false,
          message: "Tour không tồn tại hoặc đã ngừng hoạt động",
        });
      }

      const scheduleId = req.body.details.schedule_id
        ? toBigInt(req.body.details.schedule_id)
        : null;
      if (scheduleId) {
        const schedule = await prisma.tour_schedules.findFirst({
          where: { id: scheduleId, tour_id: tourId, deleted_at: null },
          select: { id: true },
        });
        if (!schedule) {
          return res.status(400).json({
            success: false,
            message: "Lịch khởi hành không thuộc tour đã chọn",
          });
        }
      }

      const { value: detailsValue, pricing } = buildDetailsWithPricing(
        req.body.details,
      );
      if (!Number.isFinite(pricing.total) || pricing.total <= 0) {
        return res.status(400).json({
          success: false,
          message: "Tổng tiền báo giá không hợp lệ",
        });
      }

      data.details = detailsValue;
      data.total_amount = pricing.total;
      data.deposit_amount = pricing.depositAmount;
    }

    const updated = await prisma.tour_quotations.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật báo giá thành công",
      data: formatQuotation(updated),
    });
  } catch (error) {
    next(error);
  }
};

export const sendQuotation = async (req, res, next) => {
  try {
    const id = toBigInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Mã báo giá không hợp lệ",
      });
    }

    const quotation = await prisma.tour_quotations.findUnique({
      where: { id },
    });
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo giá",
      });
    }

    if (quotation.status !== "draft") {
      return res.status(409).json({
        success: false,
        message: "Chỉ có thể gửi báo giá đang ở trạng thái nháp",
      });
    }

    const validUntil =
      quotation.valid_until ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tour_quotations.update({
        where: { id },
        data: { status: "sent", valid_until: validUntil },
      });

      await tx.custom_tour_requests.update({
        where: { id: quotation.request_id },
        data: { status: "quoted" },
      });

      await tx.tour_negotiation_messages.create({
        data: {
          request_id: quotation.request_id,
          quotation_id: quotation.id,
          sender_id: BigInt(req.user.id),
          message: `Đã gửi báo giá phiên bản ${quotation.version} cho khách hàng.`,
          message_type: "quotation_sent",
        },
      });

      return result;
    });

    return res.status(200).json({
      success: true,
      message: "Gửi báo giá thành công",
      data: formatQuotation(updated),
    });
  } catch (error) {
    next(error);
  }
};

// =================================================================
// KHÁCH HÀNG: YÊU CẦU & BÁO GIÁ CỦA CHÍNH MÌNH
// =================================================================

export const getMyGroupRequests = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);

    const requests = await prisma.custom_tour_requests.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        quotations: { orderBy: { version: "desc" } },
        tour: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách yêu cầu của bạn thành công",
      data: requests.map(formatQuotation),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyQuotation = async (req, res, next) => {
  try {
    const id = toBigInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Mã báo giá không hợp lệ",
      });
    }

    const quotation = await prisma.tour_quotations.findUnique({
      where: { id },
      include: {
        request: { include: { tour: { select: { id: true, name: true } } } },
        negotiation_messages: {
          orderBy: { created_at: "asc" },
          include: {
            sender: { select: { id: true, full_name: true, email: true } },
          },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo giá",
      });
    }

    if (String(quotation.request.user_id) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem báo giá này",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết báo giá thành công",
      data: formatQuotation(quotation),
    });
  } catch (error) {
    next(error);
  }
};

export const respondQuotation = async (req, res, next) => {
  try {
    const id = toBigInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Mã báo giá không hợp lệ",
      });
    }

    const quotation = await prisma.tour_quotations.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo giá",
      });
    }

    if (String(quotation.request.user_id) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền phản hồi báo giá này",
      });
    }

    const { action, message } = req.body;

    if (action === "accept") {
      // Ủy quyền tạo hold + URL VNPAY cho createPaymentHold (nhánh báo giá).
      req.body = {
        quotation_id: String(quotation.id),
        payment_method: "VNPAY",
      };
      return createPaymentHold(req, res, next);
    }

    if (quotation.status !== "sent") {
      return res.status(409).json({
        success: false,
        message: "Báo giá không còn ở trạng thái có thể phản hồi",
      });
    }

    const fallbackMessage =
      action === "reject"
        ? `Khách đã từ chối báo giá phiên bản ${quotation.version}.`
        : `Khách yêu cầu chỉnh sửa báo giá phiên bản ${quotation.version}.`;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tour_quotations.update({
        where: { id: quotation.id },
        data:
          action === "reject"
            ? { status: "rejected", rejected_at: new Date() }
            : { status: "revision_requested" },
      });

      await tx.custom_tour_requests.update({
        where: { id: quotation.request_id },
        data: { status: action === "reject" ? "rejected" : "quoting" },
      });

      await tx.tour_negotiation_messages.create({
        data: {
          request_id: quotation.request_id,
          quotation_id: quotation.id,
          sender_id: BigInt(req.user.id),
          message: message?.trim() || fallbackMessage,
          message_type:
            action === "reject" ? "quotation_rejected" : "quotation_revision",
        },
      });

      return result;
    });

    return res.status(200).json({
      success: true,
      message:
        action === "reject"
          ? "Đã từ chối báo giá"
          : "Đã gửi yêu cầu chỉnh sửa báo giá",
      data: formatQuotation(updated),
    });
  } catch (error) {
    next(error);
  }
};
