import prisma from "../../config/postgres.js";
import crypto from "crypto";
import qs from "qs";
import {
  createVNPayUrl,
  verifyVNPayReturn,
} from "../payments/vnpay.service.js";
import {
  ALLOWED_BOOKING_TRANSITIONS,
  BOOKING_KIND,
  BOOKING_KIND_LABEL,
  BOOKING_STATUS,
  REFUND_STATE,
  VALID_TARGET_STATUSES,
  calcRefundPolicy,
  canTransitionBooking,
  classifyBookingKind,
  distributeRefundAmount,
  getCheckinWindow,
  getCollectedAmount,
  getPaidAmount,
  getPaidPayments,
  getRefundAmount,
  getRefundState,
  isTerminalBookingStatus,
  normalizeBookingStatus,
} from "./bookings.service.js";

const serializeBigInt = (value) => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeBigInt(val)]),
    );
  }

  return value;
};

export const getAll = async (req, res, next) => {
  try {
    const idUser = BigInt(req.user.id);

    // ========================================
    // LẤY ROLE USER
    // ========================================

    const user = await prisma.user_roles.findFirst({
      where: {
        user_id: idUser,
        deleted_at: null,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: "Không xác định được quyền người dùng",
      });
    }

    // ========================================
    // INCLUDE CÁC QUAN HỆ BOOKING
    // ========================================

    const includeBooking = {
      payments: true,
      refunds: true,

      ticket_items: true,
      tickets: true,
      details: true,
      addons: true,
      coupons: true,
      status_histories: true,
      installments: true,

      pickup_point: true,
      custom_request: true,

      schedule: true,
      tour: true,
      user: true,

      wallet_transactions: true,
      review: true,
    };

    let result = [];

    // ========================================
    // ADMIN + STAFF
    // LẤY TẤT CẢ BOOKING
    // ========================================

    if (user.role.name === "ADMIN" || user.role.name === "STAFF") {
      result = await prisma.bookings.findMany({
        include: includeBooking,

        orderBy: {
          created_at: "desc",
        },
      });
    }

    // ========================================
    // TOUR OPERATOR OWNER
    // CHỈ LẤY BOOKING CỦA USER
    // ========================================
    else if (user.role.name === "TOUR_OPERATOR_OWNER") {
      result = await prisma.bookings.findMany({
        where: {
          user_id: idUser,
        },

        include: includeBooking,

        orderBy: {
          created_at: "desc",
        },
      });
    }

    // ========================================
    // ROLE KHÁC
    // ========================================
    else {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem booking",
      });
    }

    // ========================================
    // FORMAT DATA
    // ========================================

    const dataResult = result.map((booking) => {
      // --------------------------------------
      // TỔNG TIỀN BOOKING
      // --------------------------------------

      const totalAmount = Number(booking.total_amount || 0);

      // --------------------------------------
      // TÍNH TIỀN ĐÃ THANH TOÁN
      // CHỈ PAYMENT CÓ STATUS = PAID
      // --------------------------------------

      const paidAmount = getPaidAmount(booking.payments);

      // --------------------------------------
      // TIỀN CÒN LẠI
      // --------------------------------------

      const remainingAmount = Math.max(totalAmount - paidAmount, 0);

      // --------------------------------------
      // TRẠNG THÁI THANH TOÁN
      // --------------------------------------

      let paymentStatus = "unpaid";

      if (paidAmount <= 0) {
        paymentStatus = "unpaid";
      } else if (paidAmount < totalAmount) {
        paymentStatus = "partial";
      } else {
        paymentStatus = "paid";
      }

      // --------------------------------------
      // LOẠI THANH TOÁN
      // --------------------------------------

      let paymentType = null;

      if (paymentStatus === "partial") {
        paymentType = "deposit";
      }

      if (paymentStatus === "paid") {
        paymentType = "full";
      }

      const bookingKind = classifyBookingKind(booking);
      const refundState = getRefundState(booking);

      // --------------------------------------
      // RETURN
      // --------------------------------------

      return {
        ...booking,

        total_amount: totalAmount.toString(),

        paid_amount: paidAmount.toString(),

        remaining_amount: remainingAmount.toString(),

        payment_status: paymentStatus,

        payment_type: paymentType,

        booking_kind: bookingKind,
        booking_kind_label: BOOKING_KIND_LABEL[bookingKind],

        refund_status: refundState,
        refund_amount: getRefundAmount(booking.refunds).toString(),
      };
    });

    // ========================================
    // BIGINT -> STRING
    // ========================================

    const data = serializeBigInt(dataResult);

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ALL BOOKING ERROR:", error);

    next(error);
  }
};
// TẠO BOOKING

export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      tour_id,
      schedule_id,
      selected_tour_type = "SIC",
      total_people,
      adult_count = 0,
      child_count = 0,
      infant_count = 0,
      booker_name,
      booker_phone,
      booker_email,
      booker_identity_number,
      pickup_point_id,
      pickup_note,
      company_name,
      tax_code,
      custom_departure_date,
      original_amount,
      discount_amount = 0,
      ticket_items = [],
      details = [],
      payment_method = "VNPAY",
      payment_type = "full",
      special_request,
    } = req.body;

    const paymentType = String(payment_type || "full")
      .toLowerCase()
      .trim();
    if (!["full", "deposit"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "payment_type chỉ được là full hoặc deposit",
      });
    }

    const paymentMethod = String(payment_method || "VNPAY")
      .toUpperCase()
      .trim();
    if (paymentMethod !== "VNPAY") {
      return res.status(400).json({
        success: false,
        message: "Chỉ hỗ trợ thanh toán VNPAY",
      });
    }

    if (!tour_id || !schedule_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tour_id hoặc schedule_id",
      });
    }

    const people = Number(total_people);
    if (!Number.isInteger(people) || people <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng người không hợp lệ",
      });
    }

    let adults = Number(adult_count);
    let children = Number(child_count);
    let infants = Number(infant_count);

    if (
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      !Number.isInteger(infants) ||
      adults < 0 ||
      children < 0 ||
      infants < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Số lượng hành khách chi tiết không hợp lệ",
      });
    }

    if (
      !booker_name?.trim() ||
      !booker_phone?.trim() ||
      !booker_email?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, số điện thoại và email",
      });
    }

    if (!Array.isArray(ticket_items) || ticket_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách vé không được để trống",
      });
    }

    let tourId, scheduleId, userIdBigInt;
    try {
      tourId = BigInt(tour_id);
      scheduleId = BigInt(schedule_id);
      userIdBigInt = BigInt(userId);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID tour, schedule hoặc user không hợp lệ",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const tour = await tx.tours.findFirst({
        where: { id: tourId, deleted_at: null, status: "active" },
      });
      if (!tour)
        throw new Error("Không tìm thấy tour hoặc tour đã ngừng hoạt động");

      const schedule = await tx.tour_schedules.findFirst({
        where: {
          id: scheduleId,
          tour_id: tourId,
          deleted_at: null,
          status: { in: ["open", "active", "OPEN", "ACTIVE"] },
        },
      });
      if (!schedule)
        throw new Error("Lịch khởi hành không tồn tại hoặc đã đóng");

      if (Number(schedule.available_slots) < people) {
        throw new Error(
          `Lịch trình chỉ còn ${schedule.available_slots} chỗ trống`,
        );
      }

      const ticketTypeIds = ticket_items.map((item) => {
        try {
          return BigInt(item.ticket_type_id);
        } catch {
          throw new Error("ticket_type_id không hợp lệ");
        }
      });

      const ticketTypes = await tx.ticket_types.findMany({
        where: {
          id: { in: ticketTypeIds },
          tour_id: tourId,
          deleted_at: null,
          status: "active",
        },
      });

      if (ticketTypes.length !== ticketTypeIds.length) {
        throw new Error(
          "Một hoặc nhiều loại vé không tồn tại hoặc không thuộc tour",
        );
      }

      let calculatedOriginalAmount = 0;
      let calculatedPeople = 0;
      const bookingItemsData = [];

      for (const item of ticket_items) {
        const ticketType = ticketTypes.find(
          (t) => t.id.toString() === String(item.ticket_type_id),
        );
        if (!ticketType) throw new Error("Không tìm thấy loại vé");

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(`Số lượng vé "${ticketType.name}" không hợp lệ`);
        }

        const minQuantity = Number(ticketType.min_quantity ?? 1);
        if (quantity < minQuantity) {
          throw new Error(`Vé "${ticketType.name}" tối thiểu ${minQuantity}`);
        }

        if (
          ticketType.max_quantity !== null &&
          ticketType.max_quantity !== undefined &&
          quantity > Number(ticketType.max_quantity)
        ) {
          throw new Error(`Vé "${ticketType.name}" vượt quá số lượng tối đa`);
        }

        const unitPrice = Number(ticketType.price);
        const paxPerItem = Number(ticketType.total_pax ?? 1);
        const totalPrice = unitPrice * quantity;
        const itemPeople = paxPerItem * quantity;

        calculatedOriginalAmount += totalPrice;
        calculatedPeople += itemPeople;

        bookingItemsData.push({
          ticket_type_id: ticketType.id,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          pax_per_item: paxPerItem,
        });
      }

      if (calculatedPeople !== people) {
        throw new Error(
          `Số người không khớp. Vé tương ứng ${calculatedPeople} người nhưng booking có ${people} người`,
        );
      }

      const tourTypeNormalized = String(selected_tour_type || "SIC")
        .toUpperCase()
        .trim();
      let passengerBreakdown = adults + children + infants;

      const hasPackageTicket = ticketTypes.some((ticketType) => {
        const category = String(ticketType.category || "")
          .toUpperCase()
          .trim();
        const totalPax = Number(ticketType.total_pax ?? 1);
        return (
          ["VEHICLE", "PACKAGE", "GROUP"].includes(category) || totalPax > 1
        );
      });

      const isGroupOrFamily =
        ["GROUP", "FAMILY", "PRIVATE"].includes(tourTypeNormalized) ||
        hasPackageTicket;

      if (Array.isArray(details) && details.length > 0) {
        let detailAdults = 0,
          detailChildren = 0,
          detailInfants = 0;
        for (const passenger of details) {
          const type = String(
            passenger.passenger_type || passenger.type || "adult",
          )
            .toLowerCase()
            .trim();
          if (["child", "children"].includes(type)) detailChildren++;
          else if (["infant", "baby"].includes(type)) detailInfants++;
          else detailAdults++;
        }
        if (detailAdults + detailChildren + detailInfants === people) {
          adults = detailAdults;
          children = detailChildren;
          infants = detailInfants;
          passengerBreakdown = people;
        }
      }

      if (isGroupOrFamily) {
        if (passengerBreakdown === 0) {
          adults = people;
          passengerBreakdown = people;
        }
        if (passengerBreakdown > people) {
          throw new Error("Tổng số phân bổ hành khách vượt quá tổng số người");
        }
      } else {
        if (passengerBreakdown === 0) {
          adults = people;
          passengerBreakdown = people;
        }
        if (passengerBreakdown !== people) {
          throw new Error(
            "Tổng người lớn + trẻ em + sơ sinh không khớp tổng số người",
          );
        }
      }

      const discountAmountNumber = Number(discount_amount || 0);
      const originalAmountNumber = calculatedOriginalAmount;

      if (
        original_amount !== undefined &&
        original_amount !== null &&
        original_amount !== ""
      ) {
        const clientOriginalAmount = Number(original_amount);
        if (Math.abs(clientOriginalAmount - originalAmountNumber) > 100) {
          throw new Error("Giá gốc không khớp với hệ thống");
        }
      }

      const calculatedTotalAmount = originalAmountNumber - discountAmountNumber;
      if (
        !Number.isFinite(calculatedTotalAmount) ||
        calculatedTotalAmount <= 0
      ) {
        throw new Error("Tổng tiền booking không hợp lệ");
      }

      const paymentAmount =
        paymentType === "deposit"
          ? Math.round(calculatedTotalAmount * 0.3)
          : calculatedTotalAmount;
      const remainingAmount = calculatedTotalAmount - paymentAmount;

      const booking = await tx.bookings.create({
        data: {
          user_id: userIdBigInt,
          tour_id: tourId,
          schedule_id: scheduleId,
          selected_tour_type,
          pickup_point_id: pickup_point_id ? BigInt(pickup_point_id) : null,
          custom_departure_date: custom_departure_date
            ? new Date(custom_departure_date)
            : null,
          company_name: company_name?.trim() || null,
          tax_code: tax_code?.trim() || null,
          booker_name: booker_name.trim(),
          booker_phone: booker_phone.trim(),
          booker_email: booker_email.trim(),
          pickup_note: pickup_note?.trim() || null,
          total_people: people,
          adult_count: adults,
          child_count: children,
          infant_count: infants,
          original_amount: originalAmountNumber,
          discount_amount: discountAmountNumber,
          total_amount: calculatedTotalAmount,
          paid_amount: 0,
          remaining_amount: calculatedTotalAmount,
          status: "pending",
          payment_status: "unpaid",
          special_request: special_request?.trim() || null,
        },
      });

      await tx.booking_ticket_items.createMany({
        data: bookingItemsData.map((item) => ({
          booking_id: booking.id,
          ticket_type_id: item.ticket_type_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          pax_per_item: item.pax_per_item,
        })),
      });

      let passengersToInsert = [];
      if (isGroupOrFamily && details.length === 0) {
        passengersToInsert.push({
          booking_id: booking.id,
          full_name: booker_name.trim(),
          phone: booker_phone.trim(),
          email: booker_email.trim(),
          date_of_birth: null,
          gender: null,
          identity_number: booker_identity_number?.trim() || null,
          special_request: special_request?.trim() || null,
          passenger_type: "adult",
        });
      } else if (details.length > 0) {
        passengersToInsert = details.map((d) => ({
          booking_id: booking.id,
          full_name: d.full_name?.trim() || booker_name.trim(),
          phone: d.phone?.trim() || null,
          email: d.email?.trim() || null,
          date_of_birth: d.date_of_birth ? new Date(d.date_of_birth) : null,
          gender: d.gender || null,
          identity_number: d.identity_number?.trim() || null,
          special_request: d.special_request?.trim() || null,
          passenger_type: d.passenger_type || "adult",
        }));
      }

      if (passengersToInsert.length > 0) {
        await tx.booking_details.createMany({ data: passengersToInsert });
      }

      const updatedSchedule = await tx.tour_schedules.updateMany({
        where: { id: scheduleId, available_slots: { gte: people } },
        data: { available_slots: { decrement: people } },
      });

      if (updatedSchedule.count === 0) {
        throw new Error("Không đủ chỗ hoặc vừa có người khác đặt trước");
      }

      const installment1 = await tx.payment_installments.create({
        data: {
          booking_id: booking.id,
          installment_number: 1,
          title:
            paymentType === "deposit" ? "Đặt cọc 30%" : "Thanh toán đủ 100%",
          percentage: paymentType === "deposit" ? 30 : 100,
          amount_due: paymentAmount,
          amount_paid: 0,
          due_date: new Date(),
          status: "pending",
        },
      });

      let installment2 = null;
      if (paymentType === "deposit") {
        installment2 = await tx.payment_installments.create({
          data: {
            booking_id: booking.id,
            installment_number: 2,
            title: "Thanh toán phần còn lại 70%",
            percentage: 70,
            amount_due: remainingAmount,
            amount_paid: 0,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "pending",
          },
        });
      }

      // Mã gọn gàng <= 20 ký tự (VNPAY chuẩn quy định vnp_TxnRef)
      const pfx = paymentType === "deposit" ? "DEP" : "FUL";
      const paymentCode = `${pfx}${Date.now().toString().slice(-8)}${booking.id}`;

      const payment = await tx.payments.create({
        data: {
          booking_id: booking.id,
          installment_id: installment1.id,
          payment_code: paymentCode,
          amount: paymentAmount,
          payment_method: "VNPAY",
          payment_type: paymentType,
          status: "pending",
        },
      });

      return {
        booking,
        payment,
        installment1,
        installment2,
        paymentAmount,
        remainingAmount,
      };
    });

    return res.status(201).json({
      success: true,
      message:
        paymentType === "deposit"
          ? "Đã tạo đơn đặt cọc 30% thành công"
          : "Đã tạo đơn thanh toán toàn bộ thành công",
      data: {
        booking_id: result.booking.id.toString(),
        payment_code: result.payment.payment_code,
        payment_amount: result.payment.amount.toString(),
        total_amount: result.booking.total_amount.toString(),
        remaining_amount: result.remainingAmount.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. CREATE PAYMENT HOLD (Giữ chỗ 15 phút & tạo URL thanh toán VNPAY)
// =========================================================================
// =========================================================================
// 2b. TẠO HOLD TỪ BÁO GIÁ TOUR ĐOÀN (Phương án B)
// Chỉ chạy khi body có quotation_id; không ảnh hưởng nhánh tour thông thường.
// =========================================================================
const buildClientIp = (req) => {
  let ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  if (ipAddress.includes(":") || ipAddress === "localhost") {
    ipAddress = "127.0.0.1";
  }

  return ipAddress;
};

const handleQuotationHold = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    let quotationId;
    try {
      quotationId = BigInt(String(req.body.quotation_id));
    } catch {
      quotationId = null;
    }
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        message: "Mã báo giá không hợp lệ",
      });
    }

    const quotation = await prisma.tour_quotations.findUnique({
      where: { id: quotationId },
      include: { request: true },
    });
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo giá",
      });
    }

    if (String(quotation.request.user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán báo giá này",
      });
    }

    if (quotation.status !== "sent") {
      return res.status(409).json({
        success: false,
        message: `Báo giá đang ở trạng thái "${quotation.status}", không thể thanh toán.`,
      });
    }

    if (quotation.valid_until && new Date() > new Date(quotation.valid_until)) {
      await prisma.tour_quotations.updateMany({
        where: { id: quotationId, status: "sent" },
        data: { status: "expired" },
      });
      return res.status(410).json({
        success: false,
        message: "Báo giá đã hết hạn",
      });
    }

    const existingBooking = await prisma.bookings.findFirst({
      where: { quotation_id: quotationId },
      select: { id: true },
    });
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Báo giá này đã có booking",
      });
    }

    const existingHold = await prisma.payment_holds.findFirst({
      where: {
        status: "pending",
        expires_at: { gt: new Date() },
        booking_payload: {
          path: ["quotation_id"],
          equals: String(quotationId),
        },
      },
    });
    if (existingHold) {
      const resumeUrl = createVNPayUrl({
        paymentCode: existingHold.payment_code,
        amount: Number(existingHold.total_amount),
        ipAddr: buildClientIp(req),
      });

      return res.status(200).json({
        success: true,
        message: "Đang có giao dịch chờ thanh toán cho báo giá này",
        data: {
          hold_id: existingHold.id.toString(),
          payment_code: existingHold.payment_code,
          payment_type: existingHold.payment_code.startsWith("HLD")
            ? "deposit"
            : "full",
          total_amount: Number(existingHold.total_amount).toString(),
          payment_amount: Number(existingHold.total_amount).toString(),
          expires_at: existingHold.expires_at,
          payment_url: resumeUrl,
        },
      });
    }

    const details =
      quotation.details && typeof quotation.details === "object"
        ? quotation.details
        : {};

    const tourIdRaw =
      details.tour_id ?? quotation.request.tour_id ?? null;
    if (tourIdRaw === null || tourIdRaw === undefined) {
      return res.status(400).json({
        success: false,
        message: "Báo giá chưa gắn tour, không thể tạo thanh toán",
      });
    }

    let tourId;
    try {
      tourId = BigInt(String(tourIdRaw));
    } catch {
      return res.status(400).json({
        success: false,
        message: "Tour của báo giá không hợp lệ",
      });
    }

    let scheduleId = null;
    if (details.schedule_id) {
      try {
        scheduleId = BigInt(String(details.schedule_id));
      } catch {
        return res.status(400).json({
          success: false,
          message: "Lịch khởi hành của báo giá không hợp lệ",
        });
      }
    }

    const pax = details.pax || {};
    const people = Number(pax.total ?? quotation.request.estimated_pax);
    if (!Number.isInteger(people) || people <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng khách của báo giá không hợp lệ",
      });
    }

    const totalAmount = Number(quotation.total_amount);
    const depositAmount =
      quotation.deposit_amount !== null &&
      quotation.deposit_amount !== undefined
        ? Number(quotation.deposit_amount)
        : 0;
    const isDeposit = depositAmount > 0 && depositAmount < totalAmount;
    const paymentAmount = isDeposit ? depositAmount : totalAmount;

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền thanh toán của báo giá không hợp lệ",
      });
    }

    const depositPercentage = Number(
      details.pricing?.deposit_percentage ??
        (isDeposit && totalAmount > 0
          ? Math.round((depositAmount / totalAmount) * 100)
          : 100),
    );

    const bookerName = (
      req.body.booker_name ||
      quotation.request.contact_name ||
      ""
    ).trim();
    const bookerPhone = (
      req.body.booker_phone ||
      quotation.request.contact_phone ||
      ""
    ).trim();
    const bookerEmail = (
      req.body.booker_email ||
      quotation.request.contact_email ||
      ""
    ).trim();

    if (!bookerName || !bookerPhone || !bookerEmail) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin người liên hệ của yêu cầu",
      });
    }

    const adults = 0;
    const children = 0;
    const infants = 0;

    const result = await prisma.$transaction(async (tx) => {
      const tour = await tx.tours.findFirst({
        where: { id: tourId, deleted_at: null, status: "active" },
      });
      if (!tour) {
        throw new Error("Không tìm thấy tour hoặc tour đã ngừng hoạt động");
      }

      // Tour đoàn: schedule_id chỉ dùng làm lịch tham chiếu.
      // Không kiểm tra trạng thái lịch, không chặn khi thiếu chỗ và không trừ slot.
      if (scheduleId) {
        const schedule = await tx.tour_schedules.findFirst({
          where: {
            id: scheduleId,
            tour_id: tourId,
            deleted_at: null,
          },
        });
        if (!schedule) throw new Error("Không tìm thấy lịch khởi hành");
      }

      const pfx = isDeposit ? "HLD" : "HLF";
      const paymentCode = `${pfx}${Date.now().toString().slice(-8)}${Math.floor(
        1000 + Math.random() * 9000,
      )}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const bookingPayload = {
        source: "quotation",
        quotation_id: String(quotationId),
        custom_request_id: String(quotation.request_id),
        deposit_percentage: depositPercentage,
        selected_tour_type: details.tour_type || "GROUP",
        adult_count: adults,
        child_count: children,
        infant_count: infants,
        original_amount: totalAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        payment_amount: paymentAmount,
        remaining_amount: totalAmount - paymentAmount,
        ticket_items: [],
        details: [],
        custom_departure_date: details.departure_date || null,
        company_name: quotation.request.company_name || null,
      };

      const hold = await tx.payment_holds.create({
        data: {
          user_id: BigInt(userId),
          tour_id: tourId,
          schedule_id: scheduleId,
          payment_code: paymentCode,
          total_people: people,
          total_amount: paymentAmount,
          booker_name: bookerName,
          booker_phone: bookerPhone,
          booker_email: bookerEmail,
          special_request: quotation.request.special_requirements || null,
          booking_payload: bookingPayload,
          status: "pending",
          expires_at: expiresAt,
        },
      });

      return { hold, totalAmount, paymentAmount };
    });

    let paymentUrl;
    try {
      paymentUrl = createVNPayUrl({
        paymentCode: result.hold.payment_code,
        amount: result.paymentAmount,
        ipAddr: buildClientIp(req),
      });
    } catch (error) {
      // Sinh URL thất bại: hủy hold. Nhánh báo giá không giữ slot nên không hoàn chỗ.
      await prisma.payment_holds.updateMany({
        where: { id: result.hold.id, status: "pending" },
        data: { status: "cancelled" },
      });
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: isDeposit
        ? "Đã giữ chỗ và tạo URL thanh toán tiền cọc"
        : "Đã giữ chỗ và tạo URL thanh toán 100%",
      data: {
        hold_id: result.hold.id.toString(),
        payment_code: result.hold.payment_code,
        payment_type: isDeposit ? "deposit" : "full",
        total_amount: result.totalAmount.toString(),
        payment_amount: result.paymentAmount.toString(),
        remaining_amount: (result.totalAmount - result.paymentAmount).toString(),
        expires_at: result.hold.expires_at,
        payment_url: paymentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPaymentHold = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Nhánh báo giá tour đoàn: chỉ chạy khi body có quotation_id.
    if (req.body && req.body.quotation_id) {
      return handleQuotationHold(req, res, next);
    }

    const {
      tour_id,
      schedule_id,
      selected_tour_type = "SIC",
      total_people,
      adult_count = 0,
      child_count = 0,
      infant_count = 0,
      booker_name,
      booker_phone,
      booker_email,
      booker_identity_number,
      pickup_point_id,
      pickup_note,
      company_name,
      tax_code,
      custom_departure_date,
      original_amount,
      discount_amount = 0,
      special_request,
      ticket_items = [],
      details = [],
      payment_method = "VNPAY",
      payment_type = "full",
    } = req.body;

    const paymentMethod = String(payment_method || "")
      .toUpperCase()
      .trim();
    if (paymentMethod !== "VNPAY") {
      return res.status(400).json({
        success: false,
        message: "API này chỉ dùng cho thanh toán VNPAY",
      });
    }

    const paymentType = String(payment_type || "full")
      .toLowerCase()
      .trim();
    if (!["full", "deposit"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "payment_type chỉ được là full hoặc deposit",
      });
    }

    if (!tour_id || !schedule_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tour_id hoặc schedule_id",
      });
    }

    const people = Number(total_people);
    if (!Number.isInteger(people) || people <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng người không hợp lệ",
      });
    }

    let adults = Number(adult_count);
    let children = Number(child_count);
    let infants = Number(infant_count);

    if (
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      !Number.isInteger(infants) ||
      adults < 0 ||
      children < 0 ||
      infants < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Số lượng hành khách chi tiết không hợp lệ",
      });
    }

    if (
      !booker_name?.trim() ||
      !booker_phone?.trim() ||
      !booker_email?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin người liên hệ",
      });
    }

    if (!Array.isArray(ticket_items) || ticket_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách vé không được để trống",
      });
    }

    let tourId, scheduleId, userIdBigInt;
    try {
      tourId = BigInt(tour_id);
      scheduleId = BigInt(schedule_id);
      userIdBigInt = BigInt(userId);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID tour, schedule hoặc user không hợp lệ",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const tour = await tx.tours.findFirst({
        where: { id: tourId, deleted_at: null, status: "active" },
      });
      if (!tour)
        throw new Error("Không tìm thấy tour hoặc tour đã ngừng hoạt động");

      const schedule = await tx.tour_schedules.findFirst({
        where: {
          id: scheduleId,
          tour_id: tourId,
          deleted_at: null,
          status: { in: ["open", "active", "OPEN", "ACTIVE"] },
        },
      });
      if (!schedule) throw new Error("Không tìm thấy lịch khởi hành");

      if (Number(schedule.available_slots) < people) {
        throw new Error(`Chỉ còn ${schedule.available_slots} chỗ trống`);
      }

      const ticketTypeIds = ticket_items.map((item) => {
        try {
          return BigInt(item.ticket_type_id);
        } catch {
          throw new Error("ticket_type_id không hợp lệ");
        }
      });

      const ticketTypes = await tx.ticket_types.findMany({
        where: {
          id: { in: ticketTypeIds },
          tour_id: tourId,
          deleted_at: null,
          status: "active",
        },
      });

      if (ticketTypes.length !== ticketTypeIds.length) {
        throw new Error(
          "Một hoặc nhiều loại vé không tồn tại hoặc không thuộc tour",
        );
      }

      let calculatedOriginalAmount = 0;
      let calculatedPeople = 0;
      const bookingItemsData = [];

      for (const item of ticket_items) {
        const ticketType = ticketTypes.find(
          (t) => t.id.toString() === String(item.ticket_type_id),
        );
        if (!ticketType) throw new Error("Không tìm thấy loại vé");

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(`Số lượng vé "${ticketType.name}" không hợp lệ`);
        }

        const minQuantity = Number(ticketType.min_quantity ?? 1);
        if (quantity < minQuantity) {
          throw new Error(
            `Vé "${ticketType.name}" phải mua tối thiểu ${minQuantity}`,
          );
        }

        if (
          ticketType.max_quantity !== null &&
          ticketType.max_quantity !== undefined &&
          quantity > Number(ticketType.max_quantity)
        ) {
          throw new Error(`Vé "${ticketType.name}" vượt quá số lượng tối đa`);
        }

        const unitPrice = Number(ticketType.price);
        const paxPerItem = Number(ticketType.total_pax ?? 1);
        const totalPrice = unitPrice * quantity;
        const itemPeople = paxPerItem * quantity;

        calculatedOriginalAmount += totalPrice;
        calculatedPeople += itemPeople;

        bookingItemsData.push({
          ticket_type_id: ticketType.id.toString(),
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          pax_per_item: paxPerItem,
        });
      }

      if (calculatedPeople !== people) {
        throw new Error(
          `Danh sách vé tương ứng ${calculatedPeople} người nhưng booking gửi ${people} người`,
        );
      }

      const tourTypeNormalized = String(selected_tour_type || "")
        .toUpperCase()
        .trim();
      const isGroupOrFamily =
        tourTypeNormalized === "GROUP" ||
        tourTypeNormalized === "FAMILY" ||
        ticket_items.some(
          (item) => Number(item.total_pax || item.pax_per_item || 1) > 1,
        );

      if (!isGroupOrFamily && adults + children + infants !== people) {
        if (adults + children + infants === 0) {
          adults = people;
        } else {
          throw new Error(
            "Tổng người lớn + trẻ em + sơ sinh không khớp tổng số người",
          );
        }
      }

      if (isGroupOrFamily && adults + children + infants === 0) {
        adults = people;
      }

      const discountAmountNumber = Number(discount_amount || 0);
      const originalAmountNumber = calculatedOriginalAmount;

      if (
        original_amount !== undefined &&
        original_amount !== null &&
        original_amount !== ""
      ) {
        const clientOriginal = Number(original_amount);
        if (Math.abs(clientOriginal - calculatedOriginalAmount) > 100) {
          throw new Error("Giá gốc không khớp với hệ thống");
        }
      }

      const calculatedTotalAmount = originalAmountNumber - discountAmountNumber;
      if (
        !Number.isFinite(calculatedTotalAmount) ||
        calculatedTotalAmount <= 0
      ) {
        throw new Error("Tổng tiền booking không hợp lệ");
      }

      const paymentAmount =
        paymentType === "deposit"
          ? Math.round(calculatedTotalAmount * 0.3)
          : calculatedTotalAmount;
      const remainingAmount = calculatedTotalAmount - paymentAmount;

      // Mã TxnRef tinh gọn <= 20 ký tự (tránh lỗi VNPAY quá ký tự)
      const pfx = paymentType === "deposit" ? "HLD" : "HLF";
      const paymentCode = `${pfx}${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Trừ chỗ tạm thời
      const updatedSchedule = await tx.tour_schedules.updateMany({
        where: { id: scheduleId, available_slots: { gte: people } },
        data: { available_slots: { decrement: people } },
      });

      if (updatedSchedule.count === 0) {
        throw new Error("Không đủ chỗ để giữ chỗ");
      }

      const bookingPayload = {
        selected_tour_type,
        adult_count: adults,
        child_count: children,
        infant_count: infants,
        booker_identity_number: booker_identity_number?.trim() || null,
        pickup_point_id: pickup_point_id ? String(pickup_point_id) : null,
        pickup_note: pickup_note?.trim() || null,
        company_name: company_name?.trim() || null,
        tax_code: tax_code?.trim() || null,
        custom_departure_date: custom_departure_date || null,
        original_amount: originalAmountNumber,
        discount_amount: discountAmountNumber,
        total_amount: calculatedTotalAmount,
        payment_amount: paymentAmount,
        remaining_amount: remainingAmount,
        ticket_items: bookingItemsData,
        details,
      };

      const hold = await tx.payment_holds.create({
        data: {
          user_id: userIdBigInt,
          tour_id: tourId,
          schedule_id: scheduleId,
          payment_code: paymentCode,
          total_people: people,
          total_amount: paymentAmount,
          booker_name: booker_name.trim(),
          booker_phone: booker_phone.trim(),
          booker_email: booker_email.trim(),
          special_request: special_request?.trim() || null,
          booking_payload: bookingPayload,
          status: "pending",
          expires_at: expiresAt,
        },
      });

      return {
        hold,
        totalAmount: calculatedTotalAmount,
        paymentAmount,
        remainingAmount,
        paymentType,
        originalAmount: originalAmountNumber,
        discountAmount: discountAmountNumber,
      };
    });

    // Lấy IP Client chuẩn IPv4 cho VNPAY
    let ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    if (ipAddress.includes(":") || ipAddress === "localhost") {
      ipAddress = "127.0.0.1";
    }

    const paymentUrl = createVNPayUrl({
      paymentCode: result.hold.payment_code,
      amount: result.paymentAmount,
      ipAddr: ipAddress,
    });

    return res.status(201).json({
      success: true,
      message:
        result.paymentType === "deposit"
          ? "Đã giữ chỗ và tạo URL thanh toán cọc 30%"
          : "Đã giữ chỗ và tạo URL thanh toán 100%",
      data: {
        hold_id: result.hold.id.toString(),
        payment_code: result.hold.payment_code,
        payment_type: result.paymentType,
        total_amount: result.totalAmount.toString(),
        payment_amount: result.paymentAmount.toString(),
        remaining_amount: result.remainingAmount.toString(),
        expires_at: result.hold.expires_at,
        payment_url: paymentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 3. VNPAY RETURN (Callback từ VNPAY sau khi khách thực hiện thanh toán)
// =========================================================================
export const vnpayReturn = async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const vnpParams = { ...req.query };

    // 1. Kiểm tra chữ ký VNPAY trả về
    const isValidSignature = verifyVNPayReturn(vnpParams);
    if (!isValidSignature) {
      return res.redirect(`${frontendUrl}/payment/result?status=invalid`);
    }

    const responseCode = String(vnpParams.vnp_ResponseCode || "");
    const transactionStatus = String(vnpParams.vnp_TransactionStatus || "");
    const paymentCode = String(vnpParams.vnp_TxnRef || "");
    const vnpAmount = Number(vnpParams.vnp_Amount || 0) / 100;
    const transactionCode = vnpParams.vnp_TransactionNo
      ? String(vnpParams.vnp_TransactionNo)
      : null;

    if (!paymentCode) {
      return res.redirect(`${frontendUrl}/payment/result?status=invalid`);
    }

    const isSuccess = responseCode === "00" && transactionStatus === "00";
    const isRemaining =
      paymentCode.includes("-REMAIN-") || paymentCode.startsWith("REM");

    // =====================================================================
    // TRƯỜNG HỢP A: THANH TOÁN TIẾP PHẦN CÒN LẠI (REMAINING PAYMENT)
    // =====================================================================
    if (isRemaining) {
      const remainingPayment = await prisma.payments.findUnique({
        where: { payment_code: paymentCode },
        include: { booking: true, installment: true },
      });

      if (!remainingPayment) {
        return res.redirect(`${frontendUrl}/payment/result?status=notfound`);
      }

      if (remainingPayment.status !== "pending") {
        return res.redirect(
          `${frontendUrl}/payment/result?status=${remainingPayment.status}&payment_code=${paymentCode}&booking_id=${remainingPayment.booking_id.toString()}`,
        );
      }

      if (vnpAmount !== Number(remainingPayment.amount)) {
        return res.redirect(
          `${frontendUrl}/payment/result?status=invalid_amount&payment_code=${paymentCode}`,
        );
      }

      if (!isSuccess) {
        await prisma.payments.update({
          where: { id: remainingPayment.id },
          data: { status: "failed" },
        });
        return res.redirect(
          `${frontendUrl}/payment/result?status=failed&payment_code=${paymentCode}`,
        );
      }

      // Xử lý thành công phần còn lại
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: remainingPayment.id },
          data: {
            status: "paid",
            paid_at: new Date(),
            transaction_code: transactionCode,
            gateway_response: vnpParams,
          },
        });

        const currentBooking = await tx.bookings.findUnique({
          where: { id: remainingPayment.booking_id },
        });
        if (!currentBooking) throw new Error("Không tìm thấy booking");

        const totalPaid =
          Number(currentBooking.paid_amount) + Number(remainingPayment.amount);
        const newRemaining = Math.max(
          Number(currentBooking.total_amount) - totalPaid,
          0,
        );

        // Trạng thái booking được cập nhật độc lập với trạng thái thanh toán:
        // chỉ xác nhận khi đơn còn ở bước chờ/xác nhận, không hạ cấp các bước sau.
        const currentStatusNorm = String(currentBooking.status ?? "")
          .trim()
          .toUpperCase();
        const nextBookingStatus = [
          "PENDING",
          "CONFIRMED",
          "READY",
          "PAID",
        ].includes(currentStatusNorm)
          ? "CONFIRMED"
          : currentBooking.status;

        await tx.bookings.update({
          where: { id: currentBooking.id },
          data: {
            paid_amount: totalPaid,
            remaining_amount: newRemaining,
            payment_status: newRemaining <= 0 ? "paid" : "partial",
            status: nextBookingStatus,
          },
        });

        await tx.payment_installments.updateMany({
          where: {
            booking_id: currentBooking.id,
            installment_number: 2,
            status: "pending",
          },
          data: {
            amount_paid: Number(remainingPayment.amount),
            status: "paid",
          },
        });

        // Nạp tiền ví chủ tour
        const tour = await tx.tours.findUnique({
          where: { id: currentBooking.tour_id },
          include: { operator: { select: { user_id: true } } },
        });

        if (tour?.operator?.user_id) {
          const ownerId = tour.operator.user_id;
          const amount = Number(remainingPayment.amount);

          let ownerWallet = await tx.wallets.findUnique({
            where: { user_id: ownerId },
          });
          if (!ownerWallet) {
            ownerWallet = await tx.wallets.create({
              data: { user_id: ownerId, balance: 0 },
            });
          }

          const balanceBefore = Number(ownerWallet.balance);
          const balanceAfter = balanceBefore + amount;

          await tx.wallets.update({
            where: { id: ownerWallet.id },
            data: { balance: { increment: amount } },
          });

          await tx.wallet_transactions.create({
            data: {
              wallet_id: ownerWallet.id,
              user_id: ownerId,
              from_user_id: currentBooking.user_id,
              to_user_id: ownerId,
              booking_id: currentBooking.id,
              amount,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              type: "payment",
              description: `Nhận tiền VNPAY phần còn lại booking #${currentBooking.id}`,
            },
          });
        }
      });

      return res.redirect(
        `${frontendUrl}/payment/result?status=success&payment_code=${paymentCode}&booking_id=${remainingPayment.booking_id.toString()}`,
      );
    }

    // =====================================================================
    // TRƯỜNG HỢP B: THANH TOÁN LẦN 1 TỪ PAYMENT_HOLD
    // =====================================================================
    const hold = await prisma.payment_holds.findUnique({
      where: { payment_code: paymentCode },
    });

    if (!hold) {
      return res.redirect(`${frontendUrl}/payment/result?status=notfound`);
    }

    // Hold từ báo giá tour đoàn không giữ slot nên không được hoàn slot.
    const holdPayload =
      hold.booking_payload && typeof hold.booking_payload === "object"
        ? hold.booking_payload
        : {};
    const isQuotationHold = holdPayload.source === "quotation";

    if (hold.status !== "pending") {
      return res.redirect(
        `${frontendUrl}/payment/result?status=${hold.status === "completed" ? "success" : hold.status}&payment_code=${paymentCode}`,
      );
    }

    // Kiểm tra hết hạn hold
    if (new Date() > new Date(hold.expires_at)) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.payment_holds.updateMany({
          where: { id: hold.id, status: "pending" },
          data: { status: "expired" },
        });
        if (updated.count > 0 && hold.schedule_id && !isQuotationHold) {
          await tx.tour_schedules.update({
            where: { id: hold.schedule_id },
            data: { available_slots: { increment: hold.total_people } },
          });
        }
      });
      return res.redirect(
        `${frontendUrl}/payment/result?status=expired&payment_code=${paymentCode}`,
      );
    }

    // Kiểm tra số tiền khớp
    if (vnpAmount !== Number(hold.total_amount)) {
      return res.redirect(
        `${frontendUrl}/payment/result?status=invalid_amount&payment_code=${paymentCode}`,
      );
    }

    // Thanh toán thất bại hoặc người dùng bấm Hủy
    if (!isSuccess) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.payment_holds.updateMany({
          where: { id: hold.id, status: "pending" },
          data: { status: "cancelled" },
        });
        if (updated.count > 0 && hold.schedule_id && !isQuotationHold) {
          await tx.tour_schedules.update({
            where: { id: hold.schedule_id },
            data: { available_slots: { increment: hold.total_people } },
          });
        }
      });
      return res.redirect(
        `${frontendUrl}/payment/result?status=failed&payment_code=${paymentCode}`,
      );
    }

    // THANH TOÁN THÀNH CÔNG -> Chuyển Hold thành Booking chính thức
    const finalResult = await prisma.$transaction(async (tx) => {
      const updatedHold = await tx.payment_holds.updateMany({
        where: { id: hold.id, status: "pending" },
        data: { status: "completed" },
      });
      if (updatedHold.count === 0) {
        throw new Error("Giao dịch đã được xử lý trước đó");
      }

      const payload =
        hold.booking_payload && typeof hold.booking_payload === "object"
          ? hold.booking_payload
          : {};

      const isDeposit =
        hold.payment_code.startsWith("HLD") ||
        hold.payment_code.includes("-DEPOSIT-");
      const paymentType = isDeposit ? "deposit" : "full";

      const bookingTotalAmount = Number(
        payload.total_amount || hold.total_amount,
      );
      const paidAmount = Number(hold.total_amount);
      const remainingAmount =
        paymentType === "deposit"
          ? Math.max(bookingTotalAmount - paidAmount, 0)
          : 0;

      const booking = await tx.bookings.create({
        data: {
          user_id: hold.user_id,
          tour_id: hold.tour_id,
          schedule_id: hold.schedule_id,
          quotation_id: payload.quotation_id
            ? BigInt(payload.quotation_id)
            : null,
          custom_request_id: payload.custom_request_id
            ? BigInt(payload.custom_request_id)
            : null,
          selected_tour_type: payload.selected_tour_type || "SIC",
          pickup_point_id: payload.pickup_point_id
            ? BigInt(payload.pickup_point_id)
            : null,
          custom_departure_date: payload.custom_departure_date
            ? new Date(payload.custom_departure_date)
            : null,
          company_name: payload.company_name || null,
          tax_code: payload.tax_code || null,
          booker_name: hold.booker_name,
          booker_phone: hold.booker_phone,
          booker_email: hold.booker_email,
          pickup_note: payload.pickup_note || null,
          total_people: hold.total_people,
          adult_count: Number(payload.adult_count || 0),
          child_count: Number(payload.child_count || 0),
          infant_count: Number(payload.infant_count || 0),
          original_amount: Number(
            payload.original_amount || bookingTotalAmount,
          ),
          discount_amount: Number(payload.discount_amount || 0),
          total_amount: bookingTotalAmount,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          status: "CONFIRMED",
          payment_status: paymentType === "full" ? "paid" : "partial",
          special_request: hold.special_request || null,
        },
      });

      const ticketItems = Array.isArray(payload.ticket_items)
        ? payload.ticket_items
        : [];
      if (ticketItems.length > 0) {
        await tx.booking_ticket_items.createMany({
          data: ticketItems.map((item) => ({
            booking_id: booking.id,
            ticket_type_id: BigInt(item.ticket_type_id),
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total_price: Number(item.total_price),
            pax_per_item: Number(item.pax_per_item || 1),
          })),
        });
      }

      const rawDetails = Array.isArray(payload.details) ? payload.details : [];
      let passengersToInsert = rawDetails.map((detail) => ({
        booking_id: booking.id,
        full_name: detail.full_name?.trim() || hold.booker_name,
        phone: detail.phone?.trim() || null,
        email: detail.email?.trim() || null,
        date_of_birth: detail.date_of_birth
          ? new Date(detail.date_of_birth)
          : null,
        gender: detail.gender || null,
        identity_number: detail.identity_number?.trim() || null,
        special_request: detail.special_request?.trim() || null,
        passenger_type: detail.passenger_type || "adult",
      }));

      if (passengersToInsert.length === 0) {
        passengersToInsert = [
          {
            booking_id: booking.id,
            full_name: hold.booker_name,
            phone: hold.booker_phone,
            email: hold.booker_email,
            date_of_birth: null,
            gender: null,
            identity_number: payload.booker_identity_number || null,
            special_request: hold.special_request || null,
            passenger_type: "adult",
          },
        ];
      }

      await tx.booking_details.createMany({ data: passengersToInsert });

      // Đồng bộ trạng thái báo giá / yêu cầu khi booking từ báo giá được tạo.
      if (payload.quotation_id && payload.custom_request_id) {
        await tx.tour_quotations.updateMany({
          where: {
            id: BigInt(payload.quotation_id),
            status: { in: ["sent", "draft"] },
          },
          data: { status: "accepted", accepted_at: new Date() },
        });

        await tx.custom_tour_requests.updateMany({
          where: { id: BigInt(payload.custom_request_id) },
          data: {
            status: "confirmed",
            quotation_amount: bookingTotalAmount,
            quoted_at: new Date(),
          },
        });

        await tx.tour_negotiation_messages.create({
          data: {
            request_id: BigInt(payload.custom_request_id),
            quotation_id: BigInt(payload.quotation_id),
            sender_id: null,
            message: `Khách đã thanh toán thành công và xác nhận báo giá của yêu cầu #${payload.custom_request_id}.`,
            message_type: "quotation_accepted",
          },
        });
      }

      const depositPercentage =
        paymentType === "deposit"
          ? Number(payload.deposit_percentage || 30)
          : 100;

      const installment1 = await tx.payment_installments.create({
        data: {
          booking_id: booking.id,
          installment_number: 1,
          title:
            paymentType === "deposit"
              ? `Đặt cọc ${depositPercentage}%`
              : "Thanh toán đủ 100%",
          percentage: depositPercentage,
          amount_due: paidAmount,
          amount_paid: paidAmount,
          due_date: new Date(),
          status: "paid",
        },
      });

      if (paymentType === "deposit") {
        await tx.payment_installments.create({
          data: {
            booking_id: booking.id,
            installment_number: 2,
            title: `Thanh toán phần còn lại ${100 - depositPercentage}%`,
            percentage: 100 - depositPercentage,
            amount_due: remainingAmount,
            amount_paid: 0,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "pending",
          },
        });
      }

      const payment = await tx.payments.create({
        data: {
          booking_id: booking.id,
          installment_id: installment1.id,
          payment_code: hold.payment_code,
          transaction_code: transactionCode,
          amount: paidAmount,
          payment_method: "VNPAY",
          payment_type: paymentType,
          status: "paid",
          paid_at: new Date(),
          gateway_response: vnpParams,
        },
      });

      // Nạp tiền ví chủ tour
      const tour = await tx.tours.findUnique({
        where: { id: hold.tour_id },
        include: { operator: { select: { user_id: true } } },
      });

      if (tour?.operator?.user_id) {
        const ownerId = tour.operator.user_id;
        let ownerWallet = await tx.wallets.findUnique({
          where: { user_id: ownerId },
        });
        if (!ownerWallet) {
          ownerWallet = await tx.wallets.create({
            data: { user_id: ownerId, balance: 0 },
          });
        }

        const balanceBefore = Number(ownerWallet.balance);
        const balanceAfter = balanceBefore + paidAmount;

        await tx.wallets.update({
          where: { id: ownerWallet.id },
          data: { balance: { increment: paidAmount } },
        });

        await tx.wallet_transactions.create({
          data: {
            wallet_id: ownerWallet.id,
            user_id: ownerId,
            from_user_id: hold.user_id,
            to_user_id: ownerId,
            booking_id: booking.id,
            amount: paidAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            type: "payment",
            description: `Nhận tiền VNPAY booking #${booking.id}`,
          },
        });
      }

      return { booking, payment };
    });

    return res.redirect(
      `${frontendUrl}/payment/result?status=success&payment_code=${finalResult.payment.payment_code}&booking_id=${finalResult.booking.id.toString()}`,
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CUSTOMER XEM DANH SÁCH BOOKING
// =====================================================

export const getBookingCustomer = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);

    const bookings = await prisma.bookings.findMany({
      where: {
        user_id: userId,
      },

      include: {
        details: true,

        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            price: true,
          },
        },

        schedule: {
          select: {
            id: true,
            departure_date: true,
            departure_time: true,
            return_date: true,
            return_time: true,
            status: true,
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    const result = bookings.map((booking) => ({
      id: booking.id.toString(),

      // Người đặt
      booker_name: booking.booker_name,

      booker_phone: booking.booker_phone,

      booker_email: booking.booker_email,

      booker_identity_number: booking.booker_identity_number,

      departure: booking.departure,

      // Booking
      total_people: booking.total_people,

      total_amount: booking.total_amount.toString(),

      status: booking.status,

      special_request: booking.special_request,

      created_at: booking.created_at,

      updated_at: booking.updated_at,

      // Tour
      tour: {
        id: booking.tour.id.toString(),

        name: booking.tour.name,

        slug: booking.tour.slug,

        thumbnail: booking.tour.thumbnail,

        price: booking.tour.price.toString(),
      },

      // Lịch
      schedule: {
        id: booking.schedule.id.toString(),

        departure_date: booking.schedule.departure_date,

        departure_time: booking.schedule.departure_time,

        return_date: booking.schedule.return_date,

        return_time: booking.schedule.return_time,

        status: booking.schedule.status,
      },

      // Người đi
      details: booking.details.map((detail) => ({
        id: detail.id.toString(),

        full_name: detail.full_name,

        phone: detail.phone,

        email: detail.email,

        date_of_birth: detail.date_of_birth,

        gender: detail.gender,

        identity_number: detail.identity_number,

        special_request: detail.special_request,
      })),
    }));

    return res.status(200).json({
      success: true,

      message: "Lấy danh sách booking thành công",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// my booking
export const myBooking = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);

    const bookings = await prisma.bookings.findMany({
      where: {
        user_id: userId,
      },

      include: {
        // =====================================================
        // TOUR
        // =====================================================
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            thumbnail: true,
            base_price: true,
            supported_tour_types: true,
            is_customizable: true,
            min_people: true,
            max_people: true,
            duration_days: true,
            duration_nights: true,
            difficulty_level: true,
            transportation: true,
            status: true,
          },
        },

        // =====================================================
        // SCHEDULE
        // =====================================================
        schedule: {
          select: {
            id: true,
            tour_type: true,
            departure_date: true,
            departure_time: true,
            return_date: true,
            return_time: true,
            total_slots: true,
            available_slots: true,
            is_private: true,
            custom_departure_allowed: true,
            status: true,
          },
        },

        // =====================================================
        // PICKUP POINT
        // =====================================================
        pickup_point: {
          select: {
            id: true,
            name: true,
            address: true,
            pickup_time: true,
            surcharge: true,
          },
        },

        // =====================================================
        // CUSTOM REQUEST
        // =====================================================
        custom_request: {
          select: {
            id: true,
            company_name: true,
            contact_name: true,
            contact_phone: true,
            contact_email: true,
            estimated_pax: true,
            departure_date: true,
            duration_days: true,
            budget_per_pax: true,
            special_requirements: true,
            status: true,
            quotation_amount: true,
            quotation_notes: true,
            quoted_at: true,
          },
        },

        // =====================================================
        // PAYMENT
        // =====================================================
        payments: {
          select: {
            id: true,
            booking_id: true,
            installment_id: true,
            payment_code: true,
            transaction_code: true,
            amount: true,
            payment_method: true,
            payment_type: true,
            status: true,
            paid_at: true,
            gateway_response: true,
            created_at: true,
            updated_at: true,
          },

          orderBy: {
            created_at: "desc",
          },
        },

        // =====================================================
        // INSTALLMENTS
        // =====================================================
        installments: {
          select: {
            id: true,
            booking_id: true,
            installment_number: true,
            title: true,
            percentage: true,
            amount_due: true,
            amount_paid: true,
            due_date: true,
            status: true,
            created_at: true,
            updated_at: true,
          },

          orderBy: {
            installment_number: "asc",
          },
        },

        // =====================================================
        // PASSENGERS / BOOKING DETAILS
        // =====================================================
        details: {
          select: {
            id: true,
            booking_id: true,
            full_name: true,
            phone: true,
            email: true,
            date_of_birth: true,
            gender: true,
            identity_number: true,
            special_request: true,
            passenger_type: true,
            created_at: true,
          },

          orderBy: {
            id: "asc",
          },
        },

        // =====================================================
        // TICKET ITEMS
        // =====================================================
        ticket_items: {
          select: {
            id: true,
            booking_id: true,
            ticket_type_id: true,
            quantity: true,
            unit_price: true,
            total_price: true,
            pax_per_item: true,

            ticket_type: {
              select: {
                id: true,
                tour_id: true,
                tour_type: true,
                category: true,
                name: true,
                code: true,
                description: true,
                price: true,
                total_pax: true,
                adult_pax: true,
                child_pax: true,
                infant_pax: true,
                min_quantity: true,
                max_quantity: true,
                status: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        },

        // =====================================================
        // E-TICKETS
        // =====================================================
        tickets: {
          select: {
            id: true,
            booking_id: true,
            booking_detail_id: true,
            ticket_code: true,
            qr_code: true,
            status: true,
            issued_at: true,
            used_at: true,
            checkin_by: true,
          },

          orderBy: {
            id: "asc",
          },
        },

        // =====================================================
        // ADDONS
        // =====================================================
        addons: {
          select: {
            id: true,
            booking_id: true,
            addon_id: true,
            quantity: true,
            unit_price: true,
            total_price: true,

            addon: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                charge_type: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        },

        // =====================================================
        // COUPONS
        // =====================================================
        coupons: {
          select: {
            id: true,
            booking_id: true,
            coupon_id: true,
            discount_amount: true,
            applied_at: true,

            coupon: {
              select: {
                id: true,
                code: true,
                title: true,
                discount_type: true,
                discount_value: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        },

        // =====================================================
        // STATUS HISTORY
        // =====================================================
        status_histories: {
          select: {
            id: true,
            booking_id: true,
            old_status: true,
            new_status: true,
            changed_by: true,
            reason: true,
            created_at: true,
          },

          orderBy: {
            created_at: "desc",
          },
        },

        // =====================================================
        // REVIEW
        // =====================================================
        review: {
          select: {
            id: true,
            user_id: true,
            tour_id: true,
            booking_id: true,
            rating: true,
            title: true,
            comment: true,
            images: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        },

        // =====================================================
        // REFUNDS
        // =====================================================
        refunds: {
          select: {
            id: true,
            booking_id: true,
            payment_id: true,
            amount: true,
            status: true,
            reason: true,
            refund_method: true,
            requested_at: true,
            processed_at: true,
            note: true,
          },
          orderBy: {
            requested_at: "desc",
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    // =========================================================
    // FORMAT DATA
    // =========================================================

    const data = bookings.map((booking) => ({
      // =======================================================
      // BOOKING
      // =======================================================

      id: booking.id.toString(),

      user_id: booking.user_id.toString(),

      tour_id: booking.tour_id.toString(),

      schedule_id: booking.schedule_id ? booking.schedule_id.toString() : null,

      pickup_point_id: booking.pickup_point_id
        ? booking.pickup_point_id.toString()
        : null,

      custom_request_id: booking.custom_request_id
        ? booking.custom_request_id.toString()
        : null,

      // =======================================================
      // TOUR TYPE
      // =======================================================

      selected_tour_type: booking.selected_tour_type,

      custom_departure_date: booking.custom_departure_date,

      // =======================================================
      // BOOKER
      // =======================================================

      booker_name: booking.booker_name,

      booker_phone: booking.booker_phone,

      booker_email: booking.booker_email,

      pickup_note: booking.pickup_note,

      company_name: booking.company_name,

      tax_code: booking.tax_code,

      // =======================================================
      // PEOPLE
      // =======================================================

      total_people: booking.total_people,

      adult_count: booking.adult_count,

      child_count: booking.child_count,

      infant_count: booking.infant_count,

      // =======================================================
      // MONEY
      // =======================================================

      original_amount: booking.original_amount?.toString() ?? "0",

      discount_amount: booking.discount_amount?.toString() ?? "0",

      total_amount: booking.total_amount?.toString() ?? "0",

      paid_amount: booking.paid_amount?.toString() ?? "0",

      remaining_amount: booking.remaining_amount?.toString() ?? "0",

      // =======================================================
      // STATUS
      // =======================================================

      status: booking.status,

      payment_status: booking.payment_status,

      special_request: booking.special_request,

      created_at: booking.created_at,

      updated_at: booking.updated_at,

      // =======================================================
      // TOUR
      // =======================================================

      tour: booking.tour
        ? {
            id: booking.tour.id.toString(),

            name: booking.tour.name,

            slug: booking.tour.slug,

            description: booking.tour.description,

            thumbnail: booking.tour.thumbnail,

            base_price: booking.tour.base_price?.toString() ?? "0",

            supported_tour_types: booking.tour.supported_tour_types,

            is_customizable: booking.tour.is_customizable,

            min_people: booking.tour.min_people,

            max_people: booking.tour.max_people,

            duration_days: booking.tour.duration_days,

            duration_nights: booking.tour.duration_nights,

            difficulty_level: booking.tour.difficulty_level,

            transportation: booking.tour.transportation,

            status: booking.tour.status,
          }
        : null,

      // =======================================================
      // SCHEDULE
      // =======================================================

      schedule: booking.schedule
        ? {
            id: booking.schedule.id.toString(),

            tour_type: booking.schedule.tour_type,

            departure_date: booking.schedule.departure_date,

            departure_time: booking.schedule.departure_time,

            return_date: booking.schedule.return_date,

            return_time: booking.schedule.return_time,

            total_slots: booking.schedule.total_slots,

            available_slots: booking.schedule.available_slots,

            is_private: booking.schedule.is_private,

            custom_departure_allowed: booking.schedule.custom_departure_allowed,

            status: booking.schedule.status,
          }
        : null,

      // =======================================================
      // PICKUP POINT
      // =======================================================

      pickup_point: booking.pickup_point
        ? {
            id: booking.pickup_point.id.toString(),

            name: booking.pickup_point.name,

            address: booking.pickup_point.address,

            pickup_time: booking.pickup_point.pickup_time,

            surcharge: booking.pickup_point.surcharge?.toString() ?? "0",
          }
        : null,

      // =======================================================
      // CUSTOM REQUEST
      // =======================================================

      custom_request: booking.custom_request
        ? {
            id: booking.custom_request.id.toString(),

            company_name: booking.custom_request.company_name,

            contact_name: booking.custom_request.contact_name,

            contact_phone: booking.custom_request.contact_phone,

            contact_email: booking.custom_request.contact_email,

            estimated_pax: booking.custom_request.estimated_pax,

            departure_date: booking.custom_request.departure_date,

            duration_days: booking.custom_request.duration_days,

            budget_per_pax:
              booking.custom_request.budget_per_pax?.toString() ?? "0",

            special_requirements: booking.custom_request.special_requirements,

            status: booking.custom_request.status,

            quotation_amount:
              booking.custom_request.quotation_amount?.toString() ?? null,

            quotation_notes: booking.custom_request.quotation_notes,

            quoted_at: booking.custom_request.quoted_at,
          }
        : null,

      // =======================================================
      // PAYMENTS
      // =======================================================

      payments: booking.payments.map((payment) => ({
        id: payment.id.toString(),

        booking_id: payment.booking_id.toString(),

        installment_id: payment.installment_id
          ? payment.installment_id.toString()
          : null,

        payment_code: payment.payment_code,

        transaction_code: payment.transaction_code,

        amount: payment.amount?.toString() ?? "0",

        payment_method: payment.payment_method,

        payment_type: payment.payment_type,

        status: payment.status,

        paid_at: payment.paid_at,

        gateway_response: payment.gateway_response,

        created_at: payment.created_at,

        updated_at: payment.updated_at,
      })),

      // =======================================================
      // INSTALLMENTS
      // =======================================================

      installments: booking.installments.map((item) => ({
        id: item.id.toString(),

        booking_id: item.booking_id.toString(),

        installment_number: item.installment_number,

        title: item.title,

        percentage: item.percentage?.toString() ?? null,

        amount_due: item.amount_due?.toString() ?? "0",

        amount_paid: item.amount_paid?.toString() ?? "0",

        due_date: item.due_date,

        status: item.status,

        created_at: item.created_at,

        updated_at: item.updated_at,
      })),

      // =======================================================
      // PASSENGERS
      // =======================================================

      passengers: booking.details.map((detail) => ({
        id: detail.id.toString(),

        booking_id: detail.booking_id.toString(),

        full_name: detail.full_name,

        phone: detail.phone,

        email: detail.email,

        date_of_birth: detail.date_of_birth,

        gender: detail.gender,

        identity_number: detail.identity_number,

        special_request: detail.special_request,

        passenger_type: detail.passenger_type,

        created_at: detail.created_at,
      })),

      // =======================================================
      // TICKET ITEMS
      // =======================================================

      ticket_items: booking.ticket_items.map((item) => ({
        id: item.id.toString(),

        booking_id: item.booking_id.toString(),

        ticket_type_id: item.ticket_type_id.toString(),

        quantity: item.quantity,

        unit_price: item.unit_price?.toString() ?? "0",

        total_price: item.total_price?.toString() ?? "0",

        pax_per_item: item.pax_per_item,

        ticket_type: item.ticket_type
          ? {
              id: item.ticket_type.id.toString(),

              tour_id: item.ticket_type.tour_id.toString(),

              tour_type: item.ticket_type.tour_type,

              category: item.ticket_type.category,

              name: item.ticket_type.name,

              code: item.ticket_type.code,

              description: item.ticket_type.description,

              price: item.ticket_type.price?.toString() ?? "0",

              total_pax: item.ticket_type.total_pax,

              adult_pax: item.ticket_type.adult_pax,

              child_pax: item.ticket_type.child_pax,

              infant_pax: item.ticket_type.infant_pax,

              min_quantity: item.ticket_type.min_quantity,

              max_quantity: item.ticket_type.max_quantity,

              status: item.ticket_type.status,
            }
          : null,
      })),

      // =======================================================
      // E-TICKETS
      // =======================================================

      tickets: booking.tickets.map((ticket) => ({
        id: ticket.id.toString(),

        booking_id: ticket.booking_id.toString(),

        booking_detail_id: ticket.booking_detail_id.toString(),

        ticket_code: ticket.ticket_code,

        qr_code: ticket.qr_code,

        status: ticket.status,

        issued_at: ticket.issued_at,

        used_at: ticket.used_at,

        checkin_by: ticket.checkin_by ? ticket.checkin_by.toString() : null,
      })),

      // =======================================================
      // ADDONS
      // =======================================================

      addons: booking.addons.map((item) => ({
        id: item.id.toString(),

        booking_id: item.booking_id.toString(),

        addon_id: item.addon_id.toString(),

        quantity: item.quantity,

        unit_price: item.unit_price?.toString() ?? "0",

        total_price: item.total_price?.toString() ?? "0",

        addon: item.addon
          ? {
              id: item.addon.id.toString(),

              name: item.addon.name,

              description: item.addon.description,

              price: item.addon.price?.toString() ?? "0",

              charge_type: item.addon.charge_type,
            }
          : null,
      })),

      // =======================================================
      // COUPONS
      // =======================================================

      coupons: booking.coupons.map((item) => ({
        id: item.id.toString(),

        booking_id: item.booking_id.toString(),

        coupon_id: item.coupon_id.toString(),

        discount_amount: item.discount_amount?.toString() ?? "0",

        applied_at: item.applied_at,

        coupon: item.coupon
          ? {
              id: item.coupon.id.toString(),

              code: item.coupon.code,

              title: item.coupon.title,

              discount_type: item.coupon.discount_type,

              discount_value: item.coupon.discount_value?.toString() ?? "0",
            }
          : null,
      })),

      // =======================================================
      // STATUS HISTORY
      // =======================================================

      status_histories: booking.status_histories.map((history) => ({
        id: history.id.toString(),

        booking_id: history.booking_id.toString(),

        old_status: history.old_status,

        new_status: history.new_status,

        changed_by: history.changed_by ? history.changed_by.toString() : null,

        reason: history.reason,

        created_at: history.created_at,
      })),

      // =======================================================
      // REVIEW
      // =======================================================

      review: booking.review
        ? {
            id: booking.review.id.toString(),

            user_id: booking.review.user_id.toString(),

            tour_id: booking.review.tour_id.toString(),

            booking_id: booking.review.booking_id.toString(),

            rating: booking.review.rating,

            title: booking.review.title,

            comment: booking.review.comment,

            images: booking.review.images,

            status: booking.review.status,

            created_at: booking.review.created_at,

            updated_at: booking.review.updated_at,
          }
        : null,

      // =======================================================
      // REFUNDS
      // =======================================================
      refunds: (booking.refunds || []).map((r) => ({
        id: r.id.toString(),
        booking_id: r.booking_id.toString(),
        payment_id: r.payment_id.toString(),
        amount: r.amount?.toString() ?? "0",
        status: r.status,
        reason: r.reason,
        refund_method: r.refund_method,
        requested_at: r.requested_at,
        processed_at: r.processed_at,
        note: r.note,
      })),

      refund_status: getRefundState(booking),

      refund_amount: getRefundAmount(booking.refunds).toString(),
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách chuyến đi thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================
// ADMIN XEM TẤT CẢ BOOKING
// =====================================================

export const getBookingAdmin = async (req, res, next) => {
  try {
    const result = await prisma.bookings.findMany({
      include: {
        tour: {
          select: {
            id: true,
            name: true,
          },
        },

        schedule: {
          select: {
            id: true,
            departure_date: true,
            departure_time: true,
            status: true,
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    const dataResult = result.map((x) => ({
      id: x.id.toString(),

      user_id: x.user_id.toString(),

      tour_id: x.tour_id.toString(),

      schedule_id: x.schedule_id.toString(),

      // Người đặt
      booker_name: x.booker_name,

      booker_phone: x.booker_phone,

      booker_email: x.booker_email,

      booker_identity_number: x.booker_identity_number,

      departure: x.departure,

      // Booking
      total_people: x.total_people,

      total_amount: x.total_amount.toString(),

      status: x.status,

      special_request: x.special_request,

      created_at: x.created_at,

      updated_at: x.updated_at,

      tour: x.tour
        ? {
            id: x.tour.id.toString(),
            name: x.tour.name,
          }
        : null,

      schedule: x.schedule
        ? {
            id: x.schedule.id.toString(),
            departure_date: x.schedule.departure_date,
            departure_time: x.schedule.departure_time,
            status: x.schedule.status,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,

      message: "Lấy tất cả booking thành công",

      data: dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// XEM CHI TIẾT BOOKING
// =====================================================

export const getDetailBooking = async (req, res, next) => {
  try {
    const idBooking = BigInt(req.params.id);

    const booking = await prisma.bookings.findUnique({
      where: {
        id: idBooking,
      },
      include: {
        // Danh sách người đi cùng
        details: true,

        // Tài khoản khách (nếu có)
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },

        // Thông tin tour
        tour: {
          include: {
            operator: {
              select: { user_id: true },
            },
          },
        },

        // Lịch khởi hành
        schedule: {
          select: {
            id: true,
            departure_date: true,
            departure_time: true,
            return_date: true,
            return_time: true,
            status: true,
          },
        },

        // Lịch sử thanh toán
        payments: {
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            booking_id: true,
            payment_code: true,
            transaction_code: true,
            amount: true,
            payment_method: true,
            status: true,
            paid_at: true,
            gateway_response: true,
            created_at: true,
            updated_at: true,
          },
        },

        // Lịch sử hoàn tiền
        refunds: {
          orderBy: {
            requested_at: "desc",
          },
        },

        // Lịch sử thay đổi trạng thái
        status_histories: {
          orderBy: {
            created_at: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking không tồn tại",
      });
    }

    const bookingKind = classifyBookingKind(booking);
    const refundState = getRefundState(booking);
    const paidAmount = getPaidAmount(booking.payments);
    const totalAmount = Number(booking.total_amount || 0);
    const collectedAmount = getCollectedAmount(booking.payments);
    const refundAmount = getRefundAmount(booking.refunds);
    const netPaid = Math.max(collectedAmount - refundAmount, 0);

    const dataResult = {
      id: booking.id.toString(),

      // Người đặt đại diện
      booker_name: booking.booker_name,
      booker_phone: booking.booker_phone,
      booker_email: booking.booker_email,
      booker_identity_number: booking.booker_identity_number,
      departure: booking.departure,

      // Thông số Booking
      total_people: booking.total_people,
      total_amount: booking.total_amount
        ? booking.total_amount.toString()
        : "0",
      original_amount: booking.original_amount ? booking.original_amount.toString() : "0",
      discount_amount: booking.discount_amount ? booking.discount_amount.toString() : "0",
      paid_amount: netPaid.toString(),
      remaining_amount: Math.max(totalAmount - netPaid, 0).toString(),
      status: booking.status,
      payment_status: booking.payment_status,
      selected_tour_type: booking.selected_tour_type,
      quotation_id: booking.quotation_id ? booking.quotation_id.toString() : null,
      custom_request_id: booking.custom_request_id ? booking.custom_request_id.toString() : null,
      booking_kind: bookingKind,
      booking_kind_label: BOOKING_KIND_LABEL[bookingKind],
      refund_status: refundState,
      refund_amount: refundAmount.toString(),
      special_request: booking.special_request,
      created_at: booking.created_at,
      updated_at: booking.updated_at,

      // Tài khoản (an toàn khi user = null)
      user: booking.user
        ? {
            id: booking.user.id.toString(),
            full_name: booking.user.full_name,
            email: booking.user.email,
            phone: booking.user.phone,
          }
        : null,

      // Thông tin Tour (an toàn khi tour = null)
      tour: booking.tour
        ? {
            id: booking.tour.id.toString(),
            name: booking.tour.name,
            thumbnail: booking.tour.thumbnail,
            price: booking.tour.price ? booking.tour.price.toString() : "0",
          }
        : null,

      // Lịch khởi hành (an toàn khi schedule = null)
      schedule: booking.schedule
        ? {
            id: booking.schedule.id.toString(),
            departure_date: booking.schedule.departure_date,
            departure_time: booking.schedule.departure_time,
            return_date: booking.schedule.return_date,
            return_time: booking.schedule.return_time,
            status: booking.schedule.status,
          }
        : null,

      // Danh sách người đi chi tiết
      details: (booking.details || []).map((detail) => ({
        id: detail.id.toString(),
        full_name: detail.full_name,
        phone: detail.phone,
        email: detail.email,
        date_of_birth: detail.date_of_birth,
        gender: detail.gender,
        identity_number: detail.identity_number,
        special_request: detail.special_request,
      })),

      // Lịch sử thanh toán
      payments: (booking.payments || []).map((p) => ({
        id: p.id.toString(),
        booking_id: p.booking_id ? p.booking_id.toString() : null,
        payment_code: p.payment_code,
        transaction_code: p.transaction_code,
        amount: p.amount ? p.amount.toString() : "0",
        payment_method: p.payment_method,
        status: p.status,
        paid_at: p.paid_at,
        gateway_response: p.gateway_response,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),

      // Lịch sử hoàn tiền
      refunds: (booking.refunds || []).map((r) => ({
        id: r.id.toString(),
        payment_id: r.payment_id ? r.payment_id.toString() : null,
        booking_id: r.booking_id ? r.booking_id.toString() : null,
        amount: r.amount ? r.amount.toString() : "0",
        reason: r.reason,
        refund_method: r.refund_method,
        transaction_code: r.transaction_code,
        status: r.status,
        requested_at: r.requested_at,
        processed_at: r.processed_at,
        note: r.note,
      })),

      // Lịch sử thay đổi trạng thái
      status_histories: (booking.status_histories || []).map((h) => ({
        id: h.id.toString(),
        booking_id: h.booking_id ? h.booking_id.toString() : null,
        old_status: h.old_status,
        new_status: h.new_status,
        changed_by: h.changed_by ? h.changed_by.toString() : null,
        changed_by_user: h.user
          ? {
              id: h.user.id.toString(),
              full_name: h.user.full_name,
              email: h.user.email,
            }
          : null,
        reason: h.reason,
        created_at: h.created_at,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết booking thành công",
      data: dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// lay booking theo id tour
// Lấy 3 booking gần nhất theo tour_id
export const getLatestBookingsByTour = async (req, res, next) => {
  try {
    const tourId = BigInt(req.params.tour_id);

    const bookings = await prisma.bookings.findMany({
      where: {
        tour_id: tourId,
      },

      orderBy: {
        created_at: "desc",
      },

      take: 3,

      include: {
        details: true,

        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },

        tour: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            price: true,
          },
        },

        schedule: {
          select: {
            id: true,
            departure_date: true,
            departure_time: true,
            return_date: true,
            return_time: true,
            status: true,
          },
        },
      },
    });
    if (bookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Tour này chưa có booking nào",
        data: [],
      });
    }

    const dataResult = bookings.map((booking) => ({
      id: booking.id.toString(),

      // Người đặt
      booker_name: booking.booker_name,
      booker_phone: booking.booker_phone,
      booker_email: booking.booker_email,
      booker_identity_number: booking.booker_identity_number,

      departure: booking.departure,

      // Booking
      total_people: booking.total_people,
      total_amount: booking.total_amount.toString(),
      status: booking.status,
      special_request: booking.special_request,

      created_at: booking.created_at,
      updated_at: booking.updated_at,

      // Tài khoản
      user: {
        id: booking.user.id.toString(),
        full_name: booking.user.full_name,
        email: booking.user.email,
        phone: booking.user.phone,
      },

      // Tour
      tour: {
        id: booking.tour.id.toString(),
        name: booking.tour.name,
        thumbnail: booking.tour.thumbnail,
        price: booking.tour.price.toString(),
      },

      // Lịch
      schedule: {
        id: booking.schedule.id.toString(),
        departure_date: booking.schedule.departure_date,
        departure_time: booking.schedule.departure_time,
        return_date: booking.schedule.return_date,
        return_time: booking.schedule.return_time,
        status: booking.schedule.status,
      },

      // Người đi
      details: booking.details.map((detail) => ({
        id: detail.id.toString(),
        full_name: detail.full_name,
        phone: detail.phone,
        email: detail.email,
        date_of_birth: detail.date_of_birth,
        gender: detail.gender,
        identity_number: detail.identity_number,
        special_request: detail.special_request,
      })),
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy 3 booking gần nhất của tour thành công",
      data: dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// HELPER CHO LUỒNG QUẢN LÝ BOOKING
// ==========================================

// Lỗi nghiệp vụ có mã HTTP, dùng để trả lỗi nghiệp vụ ra ngoài
class BookingFlowError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "BookingFlowError";
    this.status = status;
  }
}

const formatCheckinWindow = (checkinWindow) => {
  const format = (date) =>
    date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return `${format(checkinWindow.open)} - ${format(checkinWindow.close)}`;
};

const defaultReasonForStatus = (status) => {
  const reasons = {
    [BOOKING_STATUS.CONFIRMED]: "Admin xác nhận chuyến đi",
    [BOOKING_STATUS.CHECKED_IN]: "Khách đã có mặt tại điểm tập trung",
    [BOOKING_STATUS.IN_PROGRESS]: "Bắt đầu chuyến đi",
    [BOOKING_STATUS.COMPLETED]: "Chuyến đi đã kết thúc",
    [BOOKING_STATUS.NO_SHOW]: "Khách không có mặt trong thời gian điểm danh",
    [BOOKING_STATUS.CANCELLED]: "Admin hủy booking",
    [BOOKING_STATUS.REFUND_PENDING]: "Gửi yêu cầu xử lý hoàn tiền",
    [BOOKING_STATUS.REFUNDED]: "Xác nhận đã hoàn tiền",
  };

  return reasons[status] || null;
};

const buildSuccessMessage = (targetStatus, refundSummary) => {
  if (targetStatus === BOOKING_STATUS.CANCELLED) {
    if (refundSummary?.status === REFUND_STATE.COMPLETED) {
      return `Đã hủy booking và hoàn ${refundSummary.refundAmount.toLocaleString("vi-VN")}đ (${refundSummary.refundPercent}%) vào ví khách hàng`;
    }

    if (refundSummary?.status === REFUND_STATE.REJECTED) {
      return "Đã hủy booking. Đơn không đủ điều kiện hoàn tiền theo chính sách";
    }

    return "Đã hủy booking";
  }

  if (targetStatus === BOOKING_STATUS.REFUNDED) {
    return (
      refundSummary?.message ||
      "Đã hoàn tiền vào ví khách hàng"
    );
  }

  if (targetStatus === BOOKING_STATUS.NO_SHOW) {
    return "Đã đánh dấu khách vắng mặt. Khách mất khoản tiền đã thanh toán và không được hoàn tiền";
  }

  const messages = {
    [BOOKING_STATUS.CONFIRMED]: "Đã xác nhận chuyến đi",
    [BOOKING_STATUS.CHECKED_IN]: "Đã check-in khách",
    [BOOKING_STATUS.IN_PROGRESS]: "Đã bắt đầu chuyến đi",
    [BOOKING_STATUS.COMPLETED]: "Đã hoàn thành chuyến đi",
  };

  return messages[targetStatus] || `Đã chuyển đơn sang trạng thái "${targetStatus}"`;
};

// Cập nhật lại paid_amount / remaining_amount / payment_status của booking
// sau khi xử lý tiền (hủy + hoàn).
const syncBookingPaymentTotals = async ({ tx, booking, refundAmount = 0 }) => {
  const totalAmount = Number(booking.total_amount || 0);
  const collectedAmount = getCollectedAmount(booking.payments);
  const netAmount = Math.max(collectedAmount - refundAmount, 0);

  let paymentStatus = "unpaid";

  if (refundAmount > 0) {
    paymentStatus = "refunded";
  } else if (netAmount <= 0) {
    paymentStatus = "unpaid";
  } else if (netAmount < totalAmount) {
    paymentStatus = "partial";
  } else {
    paymentStatus = "paid";
  }

  await tx.bookings.update({
    where: { id: booking.id },
    data: {
      paid_amount: netAmount,
      remaining_amount: Math.max(totalAmount - netAmount, 0),
      payment_status: paymentStatus,
    },
  });
};

// ==========================================
// XỬ LÝ HOÀN TIỀN VÀO VÍ
// ------------------------------------------------------------
// Dùng chung cho:
//  - Hủy booking của Admin (hủy + hoàn tiền trong 1 transaction)
//  - Xác nhận hoàn tiền cho đơn đang chờ hoàn (REFUND_PENDING -> REFUNDED)
//
// Số tiền hoàn luôn được tính từ các giao dịch thanh toán THÀNH CÔNG,
// không dùng tổng giá trị booking.
// ==========================================

const executeWalletRefund = async ({
  tx,
  booking,
  refundablePayments = [],
  reason = null,
}) => {
  if (!refundablePayments || refundablePayments.length === 0) {
    return {
      status: REFUND_STATE.NONE,
      refundAmount: 0,
      refundPercent: 0,
      refunds: [],
      message: "Booking không có giao dịch thanh toán thành công nào để hoàn",
    };
  }

  // Chống hoàn tiền hai lần: đã có bản ghi hoàn COMPLETED thì dừng lại
  const completedRefund = await tx.refunds.findFirst({
    where: {
      booking_id: booking.id,
      status: "COMPLETED",
    },
  });

  if (completedRefund) {
    throw new BookingFlowError(
      "Đơn này đã được hoàn tiền trước đó, không thể hoàn thêm lần nữa",
      409,
    );
  }

  // Chặn tạo giao dịch ví hoàn tiền trùng cho cùng booking
  const completedWalletTx = await tx.wallet_transactions.findFirst({
    where: {
      booking_id: booking.id,
      type: "REFUND",
    },
  });

  if (completedWalletTx) {
    throw new BookingFlowError(
      "Giao dịch ví cho khoản hoàn tiền này đã tồn tại trong hệ thống",
      409,
    );
  }

  // Áp dụng chính sách hoàn tiền từ dữ liệu thực tế
  const policy = calcRefundPolicy({
    createdAt: booking.created_at,
    departureDate: booking.schedule?.departure_date,
    now: new Date(),
  });

  const { totalPaid, refundTotal: calculatedRefundTotal, items } = distributeRefundAmount(
    refundablePayments,
    policy.percent,
  );

  // Không hoàn vượt quá tổng số tiền thực tế đã thanh toán trừ đi số tiền đã hoàn trước đó
  const alreadyRefunded = (
    await tx.refunds.findMany({
      where: {
        booking_id: booking.id,
        status: "COMPLETED",
      },
    })
  ).reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const maxRefundable = Math.max(totalPaid - alreadyRefunded, 0);
  const refundTotal = Math.min(calculatedRefundTotal, maxRefundable);

  // Không đủ điều kiện hoàn (0%): ghi nhận để tra cứu, KHÔNG đụng ví
  if (refundTotal <= 0 || policy.percent <= 0) {
    for (const payment of refundablePayments) {
      const existingRefund = await tx.refunds.findFirst({
        where: {
          booking_id: booking.id,
          payment_id: payment.id,
        },
      });

      if (existingRefund) {
        await tx.refunds.update({
          where: { id: existingRefund.id },
          data: {
            amount: 0,
            status: "REJECTED",
            processed_at: new Date(),
            note: `Không đủ điều kiện hoàn tiền theo chính sách (đặt trước ${policy.hoursSinceBooking.toFixed(1)}h, còn ${policy.diffDays} ngày trước ngày đi)`,
          },
        });
      } else {
        await tx.refunds.create({
          data: {
            payment_id: payment.id,
            booking_id: booking.id,
            amount: 0,
            reason: reason
              ? `Hủy đơn #${booking.id}: ${reason}`
              : `Hủy đơn #${booking.id}`,
            refund_method: "WALLET",
            status: "REJECTED",
            processed_at: new Date(),
            note: `Không đủ điều kiện hoàn tiền (đặt trước ${policy.hoursSinceBooking.toFixed(1)}h, còn ${policy.diffDays} ngày trước ngày đi)`,
          },
        });
      }
    }

    return {
      status: REFUND_STATE.REJECTED,
      refundAmount: 0,
      refundPercent: policy.percent,
      totalPaid,
      refunds: [],
      message: "Đơn không đủ điều kiện hoàn tiền theo chính sách",
    };
  }

  // Xác định ví nhận tiền từ chủ sở hữu booking trong database
  let customerWallet = await tx.wallets.findUnique({
    where: { user_id: booking.user_id },
  });

  if (!customerWallet) {
    customerWallet = await tx.wallets.create({
      data: {
        user_id: booking.user_id,
        balance: 0,
      },
    });
  }

  const customerBalanceBefore = Number(customerWallet.balance || 0);

  // Chủ tour / nhà điều hành (nguồn hoàn nếu có)
  const ownerId = booking.tour?.operator?.user_id || booking.tour?.operator_id || null;
  let ownerWallet = null;
  let ownerBalanceBefore = 0;

  if (ownerId) {
    ownerWallet = await tx.wallets.findUnique({
      where: { user_id: ownerId },
    });

    if (!ownerWallet) {
      ownerWallet = await tx.wallets.create({
        data: { user_id: ownerId, balance: 0 },
      });
    }

    ownerBalanceBefore = Number(ownerWallet.balance || 0);
  }

  // Tạo hoặc cập nhật bản ghi hoàn tiền cho từng giao dịch
  const refunds = [];

  for (const item of items) {
    if (item.refundAmount <= 0) continue;

    const existingPending = await tx.refunds.findFirst({
      where: {
        booking_id: booking.id,
        payment_id: item.payment.id,
      },
    });

    let refundRecord;
    if (existingPending) {
      refundRecord = await tx.refunds.update({
        where: { id: existingPending.id },
        data: {
          amount: item.refundAmount,
          reason: reason
            ? `Hoàn tiền ${policy.percent}% do hủy đơn #${booking.id}: ${reason}`
            : `Hoàn tiền ${policy.percent}% do hủy đơn #${booking.id}`,
          refund_method: "WALLET",
          status: "COMPLETED",
          processed_at: new Date(),
          note: `Đặt tour ${policy.hoursSinceBooking.toFixed(1)}h trước; còn ${policy.diffDays} ngày trước khởi hành`,
        },
      });
    } else {
      refundRecord = await tx.refunds.create({
        data: {
          payment_id: item.payment.id,
          booking_id: booking.id,
          amount: item.refundAmount,
          reason: reason
            ? `Hoàn tiền ${policy.percent}% do hủy đơn #${booking.id}: ${reason}`
            : `Hoàn tiền ${policy.percent}% do hủy đơn #${booking.id}`,
          refund_method: "WALLET",
          status: "COMPLETED",
          processed_at: new Date(),
          note: `Đặt tour ${policy.hoursSinceBooking.toFixed(1)}h trước; còn ${policy.diffDays} ngày trước khởi hành`,
        },
      });
    }

    refunds.push(refundRecord);
  }

  if (refunds.length === 0) {
    throw new BookingFlowError("Không thể khởi tạo bản ghi hoàn tiền", 400);
  }

  // Trừ tiền ví chủ tour nếu có ví chủ tour
  if (ownerWallet) {
    await tx.wallets.update({
      where: { id: ownerWallet.id },
      data: {
        balance: {
          decrement: refundTotal,
        },
      },
    });
  }

  // Cộng tiền vào ví khách hàng
  await tx.wallets.update({
    where: { id: customerWallet.id },
    data: {
      balance: {
        increment: refundTotal,
      },
    },
  });

  // Lịch sử giao dịch ví chủ tour (tiền ra nếu có chủ tour)
  if (ownerWallet && ownerId) {
    await tx.wallet_transactions.create({
      data: {
        wallet_id: ownerWallet.id,
        user_id: ownerId,
        from_user_id: ownerId,
        to_user_id: booking.user_id,
        booking_id: booking.id,
        refund_id: refunds[0].id,
        amount: -refundTotal,
        balance_before: ownerBalanceBefore,
        balance_after: ownerBalanceBefore - refundTotal,
        type: "REFUND",
        description: `Hoàn tiền ${policy.percent}% cho khách hàng từ đơn tour #${booking.id}`,
      },
    });
  }

  // Lịch sử giao dịch ví khách hàng (tiền vào)
  await tx.wallet_transactions.create({
    data: {
      wallet_id: customerWallet.id,
      user_id: booking.user_id,
      from_user_id: ownerId || null,
      to_user_id: booking.user_id,
      booking_id: booking.id,
      refund_id: refunds[0].id,
      amount: refundTotal,
      balance_before: customerBalanceBefore,
      balance_after: customerBalanceBefore + refundTotal,
      type: "REFUND",
      description: `Nhận hoàn tiền ${policy.percent}% từ đơn tour #${booking.id}`,
    },
  });

  // Cập nhật trạng thái các giao dịch đã hoàn -> REFUNDED
  await tx.payments.updateMany({
    where: {
      id: { in: items.map((item) => item.payment.id) },
    },
    data: { status: "REFUNDED" },
  });

  return {
    status: REFUND_STATE.COMPLETED,
    refundAmount: refundTotal,
    refundPercent: policy.percent,
    totalPaid,
    refunds,
    message: `Đã hoàn trả thành công ${policy.percent}% (${refundTotal.toLocaleString("vi-VN")}đ) vào ví khách hàng.`,
  };
};

export const duyetDon = async (req, res, next) => {
  try {
    // 1. Kiểm tra ID booking
    let bookingId;

    try {
      const rawId = String(req.params.id ?? "").trim();

      if (!/^\d+$/.test(rawId) || BigInt(rawId) <= 0n) {
        throw new Error("Invalid booking ID");
      }

      bookingId = BigInt(rawId);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    // 2. Kiểm tra trạng thái đầu vào
    if (!req.body?.status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng truyền trạng thái cần cập nhật",
      });
    }

    const inputStatus = String(req.body.status).trim().toUpperCase();

    // Chuẩn hóa trạng thái (bao gồm cả các trạng thái cũ: READY/PAID/LOCKED/...)
    const targetStatus = normalizeBookingStatus(inputStatus);

    if (!VALID_TARGET_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái "${inputStatus}" không hợp lệ`,
      });
    }

    // Lý do thao tác (bắt buộc khi hủy booking)
    const reason = String(req.body?.reason ?? "").trim();

    // Người thực hiện (lấy từ token, không tin frontend)
    const actorId = BigInt(req.user.id);

    // 3. Lấy thông tin booking và thanh toán
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        refunds: true,
        schedule: true,
        tour: {
          include: {
            operator: {
              select: { user_id: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt tour",
      });
    }

    // Trạng thái thô đang lưu trong DB (dùng cho điều kiện chống thao tác trùng)
    const rawStoredStatus = booking.status;
    const currentStatus = normalizeBookingStatus(rawStoredStatus);

    // 4. Không cập nhật nếu trạng thái không thay đổi
    if (currentStatus === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Đơn đã ở trạng thái ${currentStatus}`,
      });
    }

    // 5. Các trạng thái kết thúc: không được chuyển ngược
    if (isTerminalBookingStatus(currentStatus)) {
      // Ngoại lệ: CANCELLED được phép chuyển sang REFUND_PENDING nếu có thanh toán cần hoàn tiền
      if (!(currentStatus === BOOKING_STATUS.CANCELLED && targetStatus === BOOKING_STATUS.REFUND_PENDING)) {
        return res.status(400).json({
          success: false,
          message: `Đơn đã kết thúc (${currentStatus}), không thể cập nhật`,
        });
      }
    }

    // 6. Từ chối hoàn tiền với booking NO_SHOW
    if (
      currentStatus === BOOKING_STATUS.NO_SHOW ||
      (targetStatus === BOOKING_STATUS.REFUNDED && currentStatus === BOOKING_STATUS.NO_SHOW)
    ) {
      return res.status(400).json({
        success: false,
        message: "Từ chối hoàn tiền với booking NO_SHOW",
      });
    }

    // 7. Yêu cầu chuyển sang REFUNDED bắt buộc đơn đang ở REFUND_PENDING
    if (targetStatus === BOOKING_STATUS.REFUNDED && currentStatus !== BOOKING_STATUS.REFUND_PENDING) {
      return res.status(400).json({
        success: false,
        message: `Chỉ được xác nhận hoàn tiền khi đơn ở trạng thái chờ hoàn tiền (${BOOKING_STATUS.REFUND_PENDING})`,
      });
    }

    // 8. Ma trận chuyển trạng thái
    if (!canTransitionBooking(currentStatus, targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển đơn từ "${currentStatus}" sang "${targetStatus}"`,
      });
    }

    // 9. Kiểm tra thanh toán thành công
    const paidPayments = getPaidPayments(booking.payments);
    const hasPaid = paidPayments.length > 0;

    // Booking phải thanh toán thành công trước khi xác nhận chuyến đi
    if (targetStatus === BOOKING_STATUS.CONFIRMED && !hasPaid) {
      return res.status(400).json({
        success: false,
        message: "Booking chưa có giao dịch thanh toán thành công",
      });
    }

    // Điều kiện riêng cho bước điểm danh (check-in / vắng mặt)
    if (
      targetStatus === BOOKING_STATUS.CHECKED_IN ||
      targetStatus === BOOKING_STATUS.NO_SHOW
    ) {
      if (!hasPaid) {
        return res.status(400).json({
          success: false,
          message:
            "Booking chưa có giao dịch thanh toán thành công nên không thể thực hiện thao tác này",
        });
      }
    }

    if (targetStatus === BOOKING_STATUS.NO_SHOW) {
      // Chỉ áp dụng cho booking mua vé thông thường
      const bookingKind = classifyBookingKind(booking);

      if (bookingKind !== BOOKING_KIND.REGULAR) {
        return res.status(400).json({
          success: false,
          message: `Chỉ áp dụng đánh dấu vắng mặt cho booking mua vé thông thường. Đơn này thuộc nhóm "${BOOKING_KIND_LABEL[bookingKind]}".`,
        });
      }

      // Chỉ cho phép trong khoảng thời gian điểm danh hợp lệ
      const checkinWindow = getCheckinWindow(booking.schedule);

      if (!checkinWindow) {
        return res.status(400).json({
          success: false,
          message:
            "Không xác định được lịch khởi hành nên không thể kiểm tra thời gian điểm danh",
        });
      }

      if (!checkinWindow.isOpen) {
        return res.status(400).json({
          success: false,
          message: `Chỉ được đánh dấu vắng mặt trong khung giờ điểm danh (${formatCheckinWindow(checkinWindow)})`,
        });
      }
    }

    if (targetStatus === BOOKING_STATUS.CHECKED_IN) {
      // Booking có lịch khởi hành thì bắt buộc nằm trong khung giờ điểm danh
      const checkinWindow = getCheckinWindow(booking.schedule);

      if (checkinWindow && !checkinWindow.isOpen) {
        return res.status(400).json({
          success: false,
          message: `Chỉ check-in trong khung giờ điểm danh (${formatCheckinWindow(checkinWindow)})`,
        });
      }
    }

    // Hủy booking bắt buộc có lý do
    if (targetStatus === BOOKING_STATUS.CANCELLED && !reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập lý do hủy booking",
      });
    }

    // 10. CẬP NHẬT TRẠNG THÁI + GHI LỊCH SỬ + XỬ LÝ TIỀN
    // Toàn bộ nằm trong 1 transaction:
    //  - Claim trạng thái bằng updateMany có điều kiện (chống thao tác trùng/song song)
    //  - Ghi lịch sử thay đổi trạng thái (lý do + người thực hiện + thời gian)
    //  - Hủy booking: hoàn slot + hoàn tiền theo chính sách hiện có vào ví
    //  - Vắng mặt: KHÔNG hoàn tiền, KHÔNG đụng ví
    let transactionResult;

    try {
      transactionResult = await prisma.$transaction(async (tx) => {
        // 10.1 Claim trạng thái: chống race condition giữa 2 Admin
        const claimCondition =
          targetStatus === BOOKING_STATUS.REFUNDED
            ? { id: bookingId, status: { in: ["REFUND_PENDING", "refund_pending"] } }
            : { id: bookingId, status: rawStoredStatus };

        const claimed = await tx.bookings.updateMany({
          where: claimCondition,
          data: { status: targetStatus },
        });

        if (claimed.count !== 1) {
          throw new BookingFlowError(
            "Đơn đặt tour vừa được cập nhật bởi quản trị viên khác. Vui lòng tải lại trang.",
            409,
          );
        }

        // 10.2 Ghi lịch sử thay đổi trạng thái
        await tx.booking_status_histories.create({
          data: {
            booking_id: bookingId,
            old_status: currentStatus,
            new_status: targetStatus,
            changed_by: actorId,
            reason: reason || defaultReasonForStatus(targetStatus),
          },
        });

        // 10.3 Lấy các giao dịch có thể hoàn (case-insensitive)
        const refundablePayments = await tx.payments.findMany({
          where: {
            booking_id: bookingId,
            status: { in: ["PAID", "paid", "REFUND_PENDING", "refund_pending"] },
          },
          orderBy: { paid_at: "asc" },
        });

        // 10.4 Hủy booking: hoàn lại chỗ trống cho tour
        if (
          targetStatus === BOOKING_STATUS.CANCELLED &&
          booking.schedule_id &&
          booking.total_people > 0 &&
          !booking.quotation_id
        ) {
          await tx.tour_schedules.update({
            where: { id: booking.schedule_id },
            data: {
              available_slots: {
                increment: booking.total_people,
              },
            },
          });
        }

        // 10.5 Đưa các giao dịch đã thanh toán vào hàng đợi hoàn tiền
        if (
          targetStatus === BOOKING_STATUS.REFUND_PENDING &&
          refundablePayments.length > 0
        ) {
          await tx.payments.updateMany({
            where: { id: { in: refundablePayments.map((p) => p.id) } },
            data: { status: "REFUND_PENDING" },
          });

          // Tạo hoặc cập nhật bản ghi refunds chờ duyệt
          const policy = calcRefundPolicy({
            createdAt: booking.created_at,
            departureDate: booking.schedule?.departure_date,
            now: new Date(),
          });

          const { items } = distributeRefundAmount(refundablePayments, policy.percent);

          for (const item of items) {
            const existingPending = await tx.refunds.findFirst({
              where: {
                booking_id: bookingId,
                payment_id: item.payment.id,
                status: "pending",
              },
            });

            if (existingPending) {
              await tx.refunds.update({
                where: { id: existingPending.id },
                data: {
                  amount: item.refundAmount,
                  reason: reason || "Admin chuyển sang chờ hoàn tiền",
                  requested_at: new Date(),
                  note: `Đặt tour ${policy.hoursSinceBooking.toFixed(1)}h trước; còn ${policy.diffDays} ngày trước khởi hành`,
                },
              });
            } else {
              await tx.refunds.create({
                data: {
                  booking_id: bookingId,
                  payment_id: item.payment.id,
                  amount: item.refundAmount,
                  reason: reason || "Admin chuyển sang chờ hoàn tiền",
                  refund_method: "WALLET",
                  status: "pending",
                  requested_at: new Date(),
                  note: `Đặt tour ${policy.hoursSinceBooking.toFixed(1)}h trước; còn ${policy.diffDays} ngày trước khởi hành`,
                },
              });
            }
          }
        }

        // 10.6 Xử lý tiền
        let refundSummary = null;

        if (targetStatus === BOOKING_STATUS.CANCELLED) {
          // Admin chủ động hủy booking: nếu đã thanh toán thì hoàn tiền vào ví trong cùng transaction
          refundSummary = await executeWalletRefund({
            tx,
            booking,
            refundablePayments,
            reason,
          });
        }

        if (targetStatus === BOOKING_STATUS.REFUNDED) {
          // Admin duyệt hoàn tiền cho đơn đang chờ hoàn (REFUND_PENDING -> REFUNDED)
          refundSummary = await executeWalletRefund({
            tx,
            booking,
            refundablePayments,
            reason,
          });
        }

        // 10.7 Cập nhật lại số liệu tiền của booking
        if (
          targetStatus === BOOKING_STATUS.CANCELLED ||
          targetStatus === BOOKING_STATUS.REFUNDED
        ) {
          await syncBookingPaymentTotals({
            tx,
            booking,
            refundAmount: refundSummary?.refundAmount || 0,
          });
        }

        return { refundSummary };
      });
    } catch (error) {
      if (error instanceof BookingFlowError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      throw error;
    }

    const refundSummary = transactionResult.refundSummary;
    const successMessage = buildSuccessMessage(targetStatus, refundSummary);

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        booking_id: bookingId.toString(),
        old_status: currentStatus,
        status: targetStatus,
        booking_kind: classifyBookingKind(booking),
        refund_status: refundSummary?.status || REFUND_STATE.NONE,
        refund_amount: refundSummary?.refundAmount || 0,
        refund_percent: refundSummary?.refundPercent || 0,
      },
    });
  } catch (error) {
    console.error("DUYET DON ERROR:", error);
    next(error);
  }
};

// ==========================================
// KHÁCH HÀNG TỰ HỦY BOOKING / YÊU CẦU HOÀN TIỀN
// ==========================================

const handleCustomerCancellationOrRefund = async ({
  req,
  res,
  next,
  isDirectRefundRequest = false,
}) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    let bookingId;

    try {
      const rawId = String(req.params.id ?? "").trim();
      if (!/^\d+$/.test(rawId) || BigInt(rawId) <= 0n) {
        throw new Error("Invalid booking ID");
      }
      bookingId = BigInt(rawId);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const userId = BigInt(req.user.id);
    const reason = String(req.body?.reason ?? "").trim();

    // Lấy thông tin booking cùng các giao dịch
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        refunds: true,
        schedule: true,
        tour: {
          include: {
            operator: {
              select: { user_id: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt tour",
      });
    }

    // 1. Kiểm tra booking thuộc người dùng đang đăng nhập
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thao tác trên đơn đặt tour này",
      });
    }

    const rawStoredStatus = booking.status;
    const currentStatus = normalizeBookingStatus(rawStoredStatus);

    // 2. Chặn thao tác với đơn đã kết thúc
    if (["COMPLETED", "NO_SHOW", "REFUNDED"].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Đơn đã ở trạng thái kết thúc (${currentStatus}), không thể hủy hoặc yêu cầu hoàn tiền`,
      });
    }

    // Chặn gửi yêu cầu trùng khi đơn đã chờ duyệt hoàn tiền
    if (currentStatus === BOOKING_STATUS.REFUND_PENDING) {
      return res.status(409).json({
        success: false,
        message: "Đơn đặt tour đang trong quá trình chờ hoàn tiền, vui lòng không gửi lại yêu cầu",
      });
    }

    // Lọc các khoản thanh toán thành công (case-insensitive)
    const paidPayments = (booking.payments || []).filter((p) =>
      ["PAID", "paid"].includes(String(p?.status ?? "").trim().toUpperCase())
    );
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p?.amount || 0), 0);

    // ==========================================
    // TRƯỜNG HỢP 1: CHƯA THANH TOÁN (Unpaid)
    // ==========================================
    if (totalPaid <= 0) {
      if (currentStatus === BOOKING_STATUS.CANCELLED) {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt tour đã được hủy trước đó",
        });
      }

      let result;
      try {
        result = await prisma.$transaction(async (tx) => {
          const claimed = await tx.bookings.updateMany({
            where: { id: bookingId, user_id: userId, status: rawStoredStatus },
            data: { status: BOOKING_STATUS.CANCELLED },
          });

          if (claimed.count !== 1) {
            throw new BookingFlowError(
              "Đơn đặt tour vừa được cập nhật bởi thao tác khác. Vui lòng tải lại trang.",
              409,
            );
          }

          if (
            booking.schedule_id &&
            booking.total_people > 0 &&
            !booking.quotation_id
          ) {
            await tx.tour_schedules.update({
              where: { id: booking.schedule_id },
              data: {
                available_slots: {
                  increment: booking.total_people,
                },
              },
            });
          }

          await tx.booking_status_histories.create({
            data: {
              booking_id: bookingId,
              old_status: currentStatus,
              new_status: BOOKING_STATUS.CANCELLED,
              changed_by: userId,
              reason: reason || "Khách hàng tự hủy đơn (chưa thanh toán)",
            },
          });

          return { status: BOOKING_STATUS.CANCELLED };
        });
      } catch (err) {
        if (err instanceof BookingFlowError) {
          return res.status(err.status).json({ success: false, message: err.message });
        }
        throw err;
      }

      return res.status(200).json({
        success: true,
        message: "Đã hủy đơn đặt tour thành công.",
        data: {
          booking_id: bookingId.toString(),
          old_status: currentStatus,
          status: result.status,
          refund_amount: 0,
          refund_percent: 0,
        },
      });
    }

    // ==========================================
    // TRƯỜNG HỢP 2: ĐÃ THANH TOÁN (Paid > 0)
    // Backend tự xác định từ dữ liệu đã lưu, không tin frontend
    // ==========================================
    const policy = calcRefundPolicy({
      createdAt: booking.created_at,
      departureDate: booking.schedule?.departure_date,
      now: new Date(),
    });

    const { refundTotal, items } = distributeRefundAmount(paidPayments, policy.percent);

    // Không đủ điều kiện hoàn tiền (0%): Hủy đơn, ghi nhận từ chối hoàn tiền
    if (refundTotal <= 0 || policy.percent <= 0) {
      let result;
      try {
        result = await prisma.$transaction(async (tx) => {
          const claimed = await tx.bookings.updateMany({
            where: { id: bookingId, user_id: userId, status: rawStoredStatus },
            data: { status: BOOKING_STATUS.CANCELLED },
          });

          if (claimed.count !== 1) {
            throw new BookingFlowError(
              "Đơn đặt tour vừa được cập nhật bởi thao tác khác. Vui lòng tải lại trang.",
              409,
            );
          }

          if (
            booking.schedule_id &&
            booking.total_people > 0 &&
            !booking.quotation_id &&
            currentStatus !== BOOKING_STATUS.CANCELLED
          ) {
            await tx.tour_schedules.update({
              where: { id: booking.schedule_id },
              data: {
                available_slots: {
                  increment: booking.total_people,
                },
              },
            });
          }

          for (const payment of paidPayments) {
            await tx.refunds.create({
              data: {
                payment_id: payment.id,
                booking_id: bookingId,
                amount: 0,
                reason: reason
                  ? `Khách hủy đơn #${bookingId}: ${reason}`
                  : `Khách hủy đơn #${bookingId}`,
                refund_method: "WALLET",
                status: "REJECTED",
                processed_at: new Date(),
                note: `Không đủ điều kiện hoàn tiền (đặt trước ${policy.hoursSinceBooking.toFixed(1)}h, còn ${policy.diffDays} ngày trước ngày đi)`,
              },
            });
          }

          await tx.booking_status_histories.create({
            data: {
              booking_id: bookingId,
              old_status: currentStatus,
              new_status: BOOKING_STATUS.CANCELLED,
              changed_by: userId,
              reason: reason || "Khách hàng hủy đơn (không đủ điều kiện hoàn tiền theo chính sách)",
            },
          });

          return { status: BOOKING_STATUS.CANCELLED };
        });
      } catch (err) {
        if (err instanceof BookingFlowError) {
          return res.status(err.status).json({ success: false, message: err.message });
        }
        throw err;
      }

      return res.status(200).json({
        success: true,
        message: "Đã hủy đơn đặt tour. Đơn không đủ điều kiện hoàn tiền theo chính sách.",
        data: {
          booking_id: bookingId.toString(),
          old_status: currentStatus,
          status: result.status,
          refund_amount: 0,
          refund_percent: 0,
        },
      });
    }

    // Đủ điều kiện hoàn tiền (> 0%): Chuyển sang REFUND_PENDING chờ Admin duyệt
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // Chặn gửi trùng
        const existingCompleted = await tx.refunds.findFirst({
          where: { booking_id: bookingId, status: "COMPLETED" },
        });
        if (existingCompleted) {
          throw new BookingFlowError("Đơn đặt tour đã được hoàn tiền trước đó", 409);
        }

        const claimed = await tx.bookings.updateMany({
          where: { id: bookingId, user_id: userId, status: rawStoredStatus },
          data: { status: BOOKING_STATUS.REFUND_PENDING },
        });

        if (claimed.count !== 1) {
          throw new BookingFlowError(
            "Đơn đặt tour vừa được cập nhật bởi thao tác khác. Vui lòng tải lại trang.",
            409,
          );
        }

        // Hoàn slot nếu trước đó chưa hủy
        if (
          currentStatus !== BOOKING_STATUS.CANCELLED &&
          booking.schedule_id &&
          booking.total_people > 0 &&
          !booking.quotation_id
        ) {
          await tx.tour_schedules.update({
            where: { id: booking.schedule_id },
            data: {
              available_slots: {
                increment: booking.total_people,
              },
            },
          });
        }

        // Cập nhật các giao dịch thành REFUND_PENDING
        await tx.payments.updateMany({
          where: { id: { in: paidPayments.map((p) => p.id) } },
          data: { status: "REFUND_PENDING" },
        });

        // Tạo hoặc cập nhật bản ghi refunds chờ duyệt
        for (const item of items) {
          const existingPending = await tx.refunds.findFirst({
            where: {
              booking_id: bookingId,
              payment_id: item.payment.id,
              status: "pending",
            },
          });

          if (existingPending) {
            await tx.refunds.update({
              where: { id: existingPending.id },
              data: {
                amount: item.refundAmount,
                reason: reason || "Khách hàng yêu cầu hoàn tiền",
                requested_at: new Date(),
                note: `Đặt tour ${policy.hoursSinceBooking.toFixed(1)}h trước; còn ${policy.diffDays} ngày trước khởi hành`,
              },
            });
          } else {
            await tx.refunds.create({
              data: {
                booking_id: bookingId,
                payment_id: item.payment.id,
                amount: item.refundAmount,
                reason: reason || "Khách hàng yêu cầu hoàn tiền",
                refund_method: "WALLET",
                status: "pending",
                requested_at: new Date(),
                note: `Đặt tour ${policy.hoursSinceBooking.toFixed(1)}h trước; còn ${policy.diffDays} ngày trước khởi hành`,
              },
            });
          }
        }

        await tx.booking_status_histories.create({
          data: {
            booking_id: bookingId,
            old_status: currentStatus,
            new_status: BOOKING_STATUS.REFUND_PENDING,
            changed_by: userId,
            reason: reason || `Khách hàng gửi yêu cầu hoàn tiền (${policy.percent}%)`,
          },
        });

        return {
          status: BOOKING_STATUS.REFUND_PENDING,
          refundAmount: refundTotal,
          refundPercent: policy.percent,
        };
      });
    } catch (err) {
      if (err instanceof BookingFlowError) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      throw err;
    }

    return res.status(200).json({
      success: true,
      message: `Đã gửi yêu cầu hoàn tiền (${result.refundPercent}% ~ ${result.refundAmount.toLocaleString("vi-VN")}đ), đang chờ ban quản trị duyệt.`,
      data: {
        booking_id: bookingId.toString(),
        old_status: currentStatus,
        status: result.status,
        refund_amount: result.refundAmount,
        refund_percent: result.refundPercent,
      },
    });
  } catch (error) {
    console.error("CUSTOMER CANCEL/REFUND ERROR:", error);
    next(error);
  }
};

export const cancelBookingCustomer = async (req, res, next) => {
  return handleCustomerCancellationOrRefund({
    req,
    res,
    next,
    isDirectRefundRequest: false,
  });
};

export const refund_pending = async (req, res, next) => {
  return handleCustomerCancellationOrRefund({
    req,
    res,
    next,
    isDirectRefundRequest: true,
  });
};
// ==========================================
// XỬ LÝ HOÀN TIỀN
// ==========================================

export const hoanTien = async (bookingId, tx) => {
  // 1. Tự mở transaction nếu hàm được gọi độc lập
  if (!tx) {
    return prisma.$transaction((transaction) =>
      hoanTien(bookingId, transaction),
    );
  }

  const prismaClient = tx;

  // 2. Lấy booking, lịch khởi hành, các khoản thanh toán chờ hoàn và thông tin chủ tour
  const booking = await prismaClient.bookings.findUnique({
    where: { id: bookingId },
    include: {
      schedule: true,
      payments: {
        where: {
          status: { in: ["REFUND_PENDING", "refund_pending"] },
        },
        orderBy: { paid_at: "asc" },
      },
      tour: {
        include: {
          operator: {
            select: { user_id: true },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Không tìm thấy thông tin đơn đặt tour");
  }

  const currentBookingStatus = String(booking.status ?? "")
    .trim()
    .toUpperCase();

  if (currentBookingStatus !== "REFUND_PENDING") {
    throw new Error(
      `Booking đang ở trạng thái "${booking.status}", không phải chờ hoàn tiền (REFUND_PENDING)`,
    );
  }

  if ((booking.payments || []).length === 0) {
    throw new Error(
      "Không tìm thấy giao dịch thanh toán nào đang ở trạng thái chờ hoàn tiền",
    );
  }

  // 3. Dùng chung logic hoàn tiền với luồng hủy booking của Admin
  const result = await executeWalletRefund({
    tx: prismaClient,
    booking,
    refundablePayments: booking.payments,
    reason: null,
  });

  return {
    refund: result.refunds,
    refunds: result.refunds,
    refundAmount: result.refundAmount,
    refundPercent: result.refundPercent,
    totalPaid: result.totalPaid,
    status: result.status,
    customerId: booking.user_id,
    ownerId: booking.tour?.operator?.user_id,
    message: result.message,
  };
};

export const thanhToanHet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    if (!bookingId || isNaN(Number(bookingId))) {
      return res.status(400).json({
        success: false,
        message: "Mã đơn đặt tour không hợp lệ.",
      });
    }

    let bookingIdBigInt;
    let userIdBigInt;
    try {
      bookingIdBigInt = BigInt(bookingId);
      userIdBigInt = BigInt(userId);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID tour hoặc user không hợp lệ",
      });
    }

    // 1. TÌM BOOKING
    const booking = await prisma.bookings.findFirst({
      where: {
        id: bookingIdBigInt,
        user_id: userIdBigInt,
      },
      include: {
        tour: true,
        schedule: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt tour.",
      });
    }

    const currentStatusNorm = String(booking.status ?? "")
      .trim()
      .toUpperCase();
    if (
      ["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(currentStatusNorm)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Đơn đặt tour đã bị hủy hoặc đã hoàn tiền, không thể tiếp tục thanh toán.",
      });
    }

    // 2. TÍNH SỐ TIỀN CÒN LẠI (Ép kiểu Number an toàn giống createPaymentHold)
    const totalAmount = Number(booking.total_amount || 0);
    const paidAmount = Number(booking.paid_amount || 0);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Đơn đặt tour đã được thanh toán đầy đủ.",
      });
    }

    // 3. TẠO PAYMENT CODE (Chuẩn format giống hệt createPaymentHold)
    const paymentCode = `VNPAY-REMAIN-${Date.now()}-${Math.floor(
      Math.random() * 100000,
    )}`;

    // 4. LẤY IP (Xử lý giống hệt createPaymentHold)
    let ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    if (ipAddress.includes("::") || ipAddress === "localhost") {
      ipAddress = "127.0.0.1";
    }

    // 5. TẠO BẢN GHI THANH TOÁN
    const payment = await prisma.payments.create({
      data: {
        booking_id: booking.id,
        payment_code: paymentCode,
        amount: remainingAmount,
        payment_method: "VNPAY",
        status: "pending",
      },
    });

    // 6. GỌI TẠO URL VNPAY
    const paymentUrl = createVNPayUrl({
      paymentCode: paymentCode,
      amount: remainingAmount,
      ipAddr: ipAddress,
    });

    // 7. TRẢ VỀ RESPONSE
    return res.status(200).json({
      success: true,
      message: "Đã tạo yêu cầu thanh toán số tiền còn lại.",
      data: {
        booking_id: booking.id.toString(),
        payment_id: payment.id.toString(),
        payment_code: paymentCode,
        total_amount: totalAmount.toString(),
        paid_amount: paidAmount.toString(),
        remaining_amount: remainingAmount.toString(),
        payment_method: "VNPAY",
        payment_url: paymentUrl,
      },
    });
  } catch (error) {
    console.error("THANH TOAN HET ERROR:", error);
    next(error);
  }
};
