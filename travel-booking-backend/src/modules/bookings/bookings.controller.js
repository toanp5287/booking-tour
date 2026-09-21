import prisma from "../../config/postgres.js";
import crypto from "crypto";
import qs from "qs";
import {
  createVNPayUrl,
  verifyVNPayReturn,
} from "../payments/vnpay.service.js";

export const getAll = async (req, res, next) => {
  try {
    const idUser = BigInt(req.user.id);

    // Lấy role của user
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

    let result = [];

    // ========================================
    // ADMIN + STAFF
    // Lấy tất cả booking
    // ========================================
    if (user.role.name === "ADMIN" || user.role.name === "STAFF") {
      result = await prisma.bookings.findMany({
        include: {
          payments: true,
          refunds: true,
          ticket: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    }

    // ========================================
    // TOUR_OPERATOR_OWNER
    // Chỉ lấy booking của user
    // ========================================
    else if (user.role.name === "TOUR_OPERATOR_OWNER") {
      result = await prisma.bookings.findMany({
        where: {
          user_id: idUser,
        },
        include: {
          payments: true,
          refunds: true,
          ticket: true,
        },
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
    const dataResult = result.map((x) => ({
      // -------------------------
      // BOOKING
      // -------------------------
      id: x.id.toString(),
      user_id: x.user_id.toString(),
      tour_id: x.tour_id.toString(),
      schedule_id: x.schedule_id.toString(),

      booker_name: x.booker_name,
      booker_phone: x.booker_phone,
      booker_email: x.booker_email,
      booker_identity_number: x.booker_identity_number,

      departure: x.departure,

      total_people: x.total_people,
      total_amount: x.total_amount.toString(),

      status: x.status,
      special_request: x.special_request,

      created_at: x.created_at,
      updated_at: x.updated_at,

      // -------------------------
      // PAYMENTS
      // -------------------------
      payments: x.payments.map((payment) => ({
        id: payment.id.toString(),
        booking_id: payment.booking_id.toString(),

        payment_code: payment.payment_code,
        transaction_code: payment.transaction_code,

        amount: payment.amount.toString(),

        payment_method: payment.payment_method,
        status: payment.status,

        paid_at: payment.paid_at,
        gateway_response: payment.gateway_response,

        created_at: payment.created_at,
        updated_at: payment.updated_at,
      })),

      // -------------------------
      // REFUNDS
      // -------------------------
      refunds: x.refunds.map((refund) => ({
        id: refund.id.toString(),
        payment_id: refund.payment_id.toString(),
        booking_id: refund.booking_id.toString(),

        amount: refund.amount.toString(),

        reason: refund.reason,
        refund_method: refund.refund_method,
        transaction_code: refund.transaction_code,

        status: refund.status,

        requested_at: refund.requested_at,
        processed_at: refund.processed_at,

        note: refund.note,
      })),

      // -------------------------
      // TICKET
      // -------------------------
      ticket: x.ticket
        ? {
            id: x.ticket.id.toString(),
            booking_id: x.ticket.booking_id.toString(),

            ticket_code: x.ticket.ticket_code,
            qr_code: x.ticket.qr_code,

            status: x.ticket.status,

            issued_at: x.ticket.issued_at,
            used_at: x.ticket.used_at,
          }
        : null,
    }));

    // ========================================
    // RESPONSE
    // ========================================
    return res.status(200).json({
      success: true,
      data: dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// TẠO BOOKING

// =====================================================
// 1. TẠO BOOKING - COD
// =====================================================
// Tạo booking - COD trả sau
export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      tour_id,
      schedule_id,
      total_people,
      booker_name,
      booker_phone,
      booker_email,
      booker_identity_number,
      departure,
      special_request,
      details = [],
      payment_method,
    } = req.body;

    // =================================================
    // 1. Kiểm tra phương thức thanh toán
    // =================================================
    const paymentMethod = String(payment_method || "")
      .toLowerCase()
      .trim();

    if (paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "API này chỉ dùng cho thanh toán COD",
      });
    }

    // =================================================
    // 2. Kiểm tra dữ liệu bắt buộc
    // =================================================
    if (!tour_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tour_id",
      });
    }

    if (!schedule_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu schedule_id",
      });
    }

    const people = Number(total_people);

    if (!Number.isInteger(people) || people <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng người không hợp lệ",
      });
    }

    if (!booker_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên",
      });
    }

    if (!booker_phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số điện thoại",
      });
    }

    if (!booker_email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email",
      });
    }

    if (!Array.isArray(details)) {
      return res.status(400).json({
        success: false,
        message: "Danh sách hành khách không hợp lệ",
      });
    }

    // =================================================
    // 3. Convert ID
    // =================================================
    let tourId;
    let scheduleId;
    let userIdBigInt;

    try {
      tourId = BigInt(tour_id);
      scheduleId = BigInt(schedule_id);
      userIdBigInt = BigInt(userId);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID tour, lịch khởi hành hoặc người dùng không hợp lệ",
      });
    }

    // =================================================
    // 4. Transaction
    // =================================================
    const result = await prisma.$transaction(async (tx) => {
      // -------------------------------------------------
      // 4.1. Tìm tour
      // -------------------------------------------------
      const tour = await tx.tours.findFirst({
        where: {
          id: tourId,
          deleted_at: null,
        },
      });

      if (!tour) {
        throw new Error("Không tìm thấy tour");
      }

      // -------------------------------------------------
      // 4.2. Tìm lịch khởi hành
      // -------------------------------------------------
      const schedule = await tx.tour_schedules.findFirst({
        where: {
          id: scheduleId,
          tour_id: tourId,
          deleted_at: null,
          status: {
            in: ["open", "active", "OPEN", "ACTIVE"],
          },
        },
      });

      if (!schedule) {
        throw new Error("Lịch khởi hành không tồn tại");
      }

      // -------------------------------------------------
      // 4.3. Kiểm tra số chỗ
      // -------------------------------------------------
      if (schedule.available_slots < people) {
        throw new Error(`Chỉ còn ${schedule.available_slots} chỗ`);
      }

      // -------------------------------------------------
      // 4.4. Tính tổng tiền
      // -------------------------------------------------
      const totalAmount = Number(tour.price) * people;

      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new Error("Giá tour không hợp lệ");
      }

      // -------------------------------------------------
      // 4.5. Tạo booking
      // -------------------------------------------------
      const booking = await tx.bookings.create({
        data: {
          user_id: userIdBigInt,
          tour_id: tourId,
          schedule_id: scheduleId,

          booker_name: booker_name.trim(),
          booker_phone: booker_phone.trim(),
          booker_email: booker_email.trim(),

          booker_identity_number: booker_identity_number?.trim() || null,

          departure: departure?.trim() || null,

          special_request: special_request?.trim() || null,

          total_people: people,
          total_amount: totalAmount,

          // COD chưa thanh toán
          status: "confirmed",
        },
      });

      // -------------------------------------------------
      // 4.6. Tạo booking details
      // -------------------------------------------------
      if (details.length > 0) {
        await tx.booking_details.createMany({
          data: details.map((detail) => ({
            booking_id: booking.id,

            full_name: detail.full_name?.trim() || booker_name.trim(),

            phone: detail.phone?.trim() || null,

            email: detail.email?.trim() || null,

            date_of_birth: detail.date_of_birth
              ? new Date(detail.date_of_birth)
              : null,

            gender: detail.gender || null,

            identity_number: detail.identity_number?.trim() || null,

            special_request: detail.special_request?.trim() || null,
          })),
        });
      }

      // -------------------------------------------------
      // 4.7. Trừ số chỗ
      // -------------------------------------------------
      const updatedSchedule = await tx.tour_schedules.updateMany({
        where: {
          id: scheduleId,

          // Đảm bảo vẫn còn đủ chỗ
          available_slots: {
            gte: people,
          },
        },

        data: {
          available_slots: {
            decrement: people,
          },
        },
      });

      if (updatedSchedule.count === 0) {
        throw new Error("Không đủ chỗ hoặc số chỗ đã thay đổi");
      }

      // -------------------------------------------------
      // 4.8. Tạo payment COD
      // -------------------------------------------------
      const paymentCode = `PAY-COD-${Date.now()}-${booking.id}`;

      const payment = await tx.payments.create({
        data: {
          booking_id: booking.id,

          payment_code: paymentCode,

          amount: totalAmount,

          payment_method: "COD",

          // COD = trả sau
          status: "pending",
        },
      });

      // -------------------------------------------------
      // QUAN TRỌNG:
      // KHÔNG cộng tiền vào wallet ở đây.
      //
      // Vì COD chưa thanh toán.
      //
      // Khi payment chuyển sang "paid":
      // mới cộng tiền vào wallet chủ tour.
      // -------------------------------------------------

      return {
        booking,
        payment,
      };
    });

    // =================================================
    // 5. Response
    // =================================================
    return res.status(201).json({
      success: true,

      message: "Đặt tour thành công, vui lòng thanh toán sau",

      data: {
        id: result.booking.id.toString(),

        user_id: result.booking.user_id.toString(),

        tour_id: result.booking.tour_id.toString(),

        schedule_id: result.booking.schedule_id.toString(),

        booker_name: result.booking.booker_name,

        booker_phone: result.booking.booker_phone,

        booker_email: result.booking.booker_email,

        total_people: result.booking.total_people,

        total_amount: result.booking.total_amount.toString(),

        status: result.booking.status,

        payment_id: result.payment.id.toString(),

        payment_code: result.payment.payment_code,

        payment_method: "cod",

        payment_status: result.payment.status,

        payment_url: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 2. TẠO PAYMENT HOLD - VNPAY
// =====================================================
export const createPaymentHold = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      tour_id,
      schedule_id,
      total_people,
      booker_name,
      booker_phone,
      booker_email,
      booker_identity_number,
      departure,
      special_request,
      details = [],
      payment_method,
    } = req.body;

    // =================================================
    // 1. Kiểm tra payment method
    // =================================================
    const paymentMethod = String(payment_method || "")
      .toLowerCase()
      .trim();

    if (paymentMethod !== "vnpay") {
      return res.status(400).json({
        success: false,
        message: "API này chỉ dùng cho thanh toán VNPAY",
      });
    }

    // =================================================
    // 2. Kiểm tra dữ liệu
    // =================================================
    if (!tour_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tour_id",
      });
    }

    if (!schedule_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu schedule_id",
      });
    }

    const people = Number(total_people);

    if (!Number.isInteger(people) || people <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng người không hợp lệ",
      });
    }

    if (!booker_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên",
      });
    }

    if (!booker_phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số điện thoại",
      });
    }

    if (!booker_email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email",
      });
    }

    if (!Array.isArray(details)) {
      return res.status(400).json({
        success: false,
        message: "Danh sách hành khách không hợp lệ",
      });
    }

    const tourId = BigInt(tour_id);
    const scheduleId = BigInt(schedule_id);
    const userIdBigInt = BigInt(userId);

    // =================================================
    // 3. Transaction giữ chỗ
    // =================================================
    const result = await prisma.$transaction(async (tx) => {
      // ---------------------------------------------
      // Tìm tour
      // ---------------------------------------------
      const tour = await tx.tours.findFirst({
        where: {
          id: tourId,
          deleted_at: null,
        },
      });

      if (!tour) {
        throw new Error("Không tìm thấy tour");
      }

      // ---------------------------------------------
      // Tìm schedule
      // ---------------------------------------------
      const schedule = await tx.tour_schedules.findFirst({
        where: {
          id: scheduleId,
          tour_id: tourId,
          deleted_at: null,
          status: {
            in: ["open", "active", "OPEN", "ACTIVE"],
          },
        },
      });

      if (!schedule) {
        throw new Error("Không tìm thấy lịch khởi hành");
      }

      // ---------------------------------------------
      // Kiểm tra slot
      // ---------------------------------------------
      if (schedule.available_slots < people) {
        throw new Error(`Chỉ còn ${schedule.available_slots} chỗ`);
      }

      // ---------------------------------------------
      // Tính tiền
      // ---------------------------------------------
      const totalAmount = Number(tour.price) * people;

      // ---------------------------------------------
      // Tạo payment code
      // ---------------------------------------------
      const paymentCode = `VNPAY-${Date.now()}-${Math.floor(
        Math.random() * 100000,
      )}`;

      // ---------------------------------------------
      // Giữ chỗ 15 phút
      // ---------------------------------------------
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // ---------------------------------------------
      // Trừ slot để giữ chỗ
      // ---------------------------------------------
      const updatedSchedule = await tx.tour_schedules.updateMany({
        where: {
          id: scheduleId,
          available_slots: {
            gte: people,
          },
        },

        data: {
          available_slots: {
            decrement: people,
          },
        },
      });

      if (updatedSchedule.count === 0) {
        throw new Error("Không đủ chỗ để giữ chỗ");
      }

      // ---------------------------------------------
      // Tạo payment hold
      // ---------------------------------------------
      const hold = await tx.payment_holds.create({
        data: {
          user_id: userIdBigInt,

          tour_id: tourId,

          schedule_id: scheduleId,

          payment_code: paymentCode,

          total_people: people,

          total_amount: totalAmount,

          booker_name: booker_name.trim(),

          booker_phone: booker_phone.trim(),

          booker_email: booker_email.trim(),

          booker_identity_number: booker_identity_number?.trim() || null,

          departure: departure?.trim() || null,

          special_request: special_request?.trim() || null,

          booking_details: details,

          status: "pending",

          expires_at: expiresAt,
        },
      });

      return {
        hold,
        totalAmount,
      };
    });

    // =================================================
    // 4. Lấy IP
    // =================================================
    let ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    if (ipAddress.includes("::") || ipAddress === "localhost") {
      ipAddress = "127.0.0.1";
    }

    // =================================================
    // 5. Tạo URL VNPAY
    // =================================================
    const paymentUrl = createVNPayUrl({
      paymentCode: result.hold.payment_code,

      amount: result.totalAmount,

      ipAddr: ipAddress,
    });

    // =================================================
    // 6. Response
    // =================================================
    return res.status(201).json({
      success: true,

      message: "Đã giữ chỗ, vui lòng thanh toán VNPAY",

      data: {
        hold_id: result.hold.id.toString(),

        payment_code: result.hold.payment_code,

        total_amount: result.hold.total_amount.toString(),

        expires_at: result.hold.expires_at,

        payment_url: paymentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 3. VNPAY RETURN
// =====================================================

// =====================================================
// 3. VNPAY RETURN
// =====================================================
export const vnpayReturn = async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const vnpParams = { ...req.query };

    // 1. VERIFY CHỮ KÝ VNPAY
    const isValidSignature = verifyVNPayReturn(req.query);
    if (!isValidSignature) {
      return res.redirect(`${frontendUrl}/payment/result?status=invalid`);
    }

    // 2. LẤY DỮ LIỆU VNPAY
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

    // 3. TÌM PAYMENT HOLD
    const hold = await prisma.payment_holds.findUnique({
      where: { payment_code: paymentCode },
    });

    if (!hold) {
      return res.redirect(`${frontendUrl}/payment/result?status=notfound`);
    }

    // 4. HOLD ĐÃ XỬ LÝ
    if (hold.status !== "pending") {
      if (hold.status === "completed") {
        return res.redirect(
          `${frontendUrl}/payment/result?status=success&payment_code=${paymentCode}`,
        );
      }
      return res.redirect(
        `${frontendUrl}/payment/result?status=${hold.status}&payment_code=${paymentCode}`,
      );
    }

    // 5. KIỂM TRA HẾT HẠN
    if (new Date() > new Date(hold.expires_at)) {
      await prisma.$transaction(async (tx) => {
        const updatedHold = await tx.payment_holds.updateMany({
          where: { id: hold.id, status: "pending" },
          data: { status: "expired" },
        });

        if (updatedHold.count === 0) return;

        await tx.tour_schedules.updateMany({
          where: { id: hold.schedule_id },
          data: {
            available_slots: { increment: hold.total_people },
          },
        });
      });

      return res.redirect(
        `${frontendUrl}/payment/result?status=expired&payment_code=${paymentCode}`,
      );
    }

    // 6. KIỂM TRA SỐ TIỀN
    const holdAmount = Number(hold.total_amount);
    if (vnpAmount !== holdAmount) {
      return res.redirect(
        `${frontendUrl}/payment/result?status=invalid_amount&payment_code=${paymentCode}`,
      );
    }

    // 7. KIỂM TRA KẾT QUẢ VNPAY
    const isSuccess = responseCode === "00" && transactionStatus === "00";

    // 8. VNPAY THẤT BẠI / HỦY
    if (!isSuccess) {
      await prisma.$transaction(async (tx) => {
        const updatedHold = await tx.payment_holds.updateMany({
          where: { id: hold.id, status: "pending" },
          data: { status: "cancelled" },
        });

        if (updatedHold.count === 0) return;

        await tx.tour_schedules.updateMany({
          where: { id: hold.schedule_id },
          data: {
            available_slots: { increment: hold.total_people },
          },
        });
      });

      return res.redirect(
        `${frontendUrl}/payment/result?status=failed&payment_code=${paymentCode}`,
      );
    }

    // 9. VNPAY THÀNH CÔNG
    const result = await prisma.$transaction(async (tx) => {
      // 9.1. Đánh dấu hold completed
      const updatedHold = await tx.payment_holds.updateMany({
        where: { id: hold.id, status: "pending" },
        data: { status: "completed" },
      });

      if (updatedHold.count === 0) {
        throw new Error("Giao dịch đã được xử lý trước đó");
      }

      // 9.2. Tạo booking với status "paid"
      const booking = await tx.bookings.create({
        data: {
          user_id: hold.user_id,
          tour_id: hold.tour_id,
          schedule_id: hold.schedule_id,
          booker_name: hold.booker_name,
          booker_phone: hold.booker_phone,
          booker_email: hold.booker_email,
          booker_identity_number: hold.booker_identity_number,
          departure: hold.departure,
          special_request: hold.special_request,
          total_people: hold.total_people,
          total_amount: hold.total_amount,
          status: "paid", // ĐÃ SỬA: Đã trả tiền qua cổng thì lưu paid
        },
      });

      // 9.3. Tạo booking details
      const details = Array.isArray(hold.booking_details)
        ? hold.booking_details
        : [];
      if (details.length > 0) {
        await tx.booking_details.createMany({
          data: details.map((detail) => ({
            booking_id: booking.id,
            full_name:
              detail.full_name?.trim() || hold.booker_name || "Khách hàng",
            phone: detail.phone?.trim() || null,
            email: detail.email?.trim() || null,
            date_of_birth: detail.date_of_birth
              ? new Date(detail.date_of_birth)
              : null,
            gender: detail.gender || null,
            identity_number: detail.identity_number?.trim() || null,
            special_request: detail.special_request?.trim() || null,
          })),
        });
      }

      // 9.4. Tạo payment VNPAY
      const payment = await tx.payments.create({
        data: {
          booking_id: booking.id,
          payment_code: hold.payment_code,
          transaction_code: transactionCode,
          amount: hold.total_amount,
          payment_method: "VNPAY",
          status: "paid",
          paid_at: new Date(),
          gateway_response: vnpParams,
        },
      });

      // 9.5. Lấy thông tin chủ tour
      const tour = await tx.tours.findUnique({
        where: { id: hold.tour_id },
        include: {
          operator: { select: { user_id: true } },
        },
      });

      if (!tour?.operator?.user_id) {
        throw new Error("Không xác định được chủ tour");
      }

      const ownerId = tour.operator.user_id;
      const amount = Number(payment.amount);

      // 9.6. Cộng tiền vào ví chủ tour
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

      // 9.7. Ghi log giao dịch
      await tx.wallet_transactions.create({
        data: {
          wallet_id: ownerWallet.id,
          user_id: ownerId,
          from_user_id: hold.user_id,
          to_user_id: ownerId,
          booking_id: booking.id,
          amount: amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          type: "payment",
          description: `Nhận tiền VNPAY booking #${booking.id}`,
        },
      });

      return { booking, payment };
    });

    return res.redirect(
      `${frontendUrl}/payment/result?status=success&payment_code=${result.payment.payment_code}&booking_id=${result.booking.id.toString()}`,
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
    let paymentUrl = null;

    if (paymentMethod === "vnpay") {
      const date = new Date();

      const createDate =
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, "0") +
        String(date.getDate()).padStart(2, "0") +
        String(date.getHours()).padStart(2, "0") +
        String(date.getMinutes()).padStart(2, "0") +
        String(date.getSeconds()).padStart(2, "0");
      const expireDate = new Date(now.getTime() + 15 * 60 * 1000);

      const vnp_ExpireDate =
        expireDate.getFullYear().toString() +
        String(expireDate.getMonth() + 1).padStart(2, "0") +
        String(expireDate.getDate()).padStart(2, "0") +
        String(expireDate.getHours()).padStart(2, "0") +
        String(expireDate.getMinutes()).padStart(2, "0") +
        String(expireDate.getSeconds()).padStart(2, "0");
      const vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: process.env.VNP_TMNCODE,
        vnp_Amount: Math.round(Number(booking.total_amount) * 100),
        vnp_CurrCode: "VND",
        vnp_TxnRef: booking.id.toString(),
        vnp_OrderInfo: `Thanh toan booking ${booking.id}`,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: process.env.VNP_RETURN_URL,
        vnp_IpAddr:
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.socket.remoteAddress ||
          "127.0.0.1",
        vnp_CreateDate: createDate,
        vnp_ExpireDate: vnp_ExpireDate,
      };

      const sortedParams = Object.keys(vnpParams)
        .sort()
        .reduce((result, key) => {
          result[key] = vnpParams[key];
          return result;
        }, {});

      const signData = qs.stringify(sortedParams, {
        encode: false,
      });

      const secureHash = crypto
        .createHmac("sha512", process.env.VNP_HASH_SECRET)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

      paymentUrl =
        `${process.env.VNP_URL}?` +
        qs.stringify(sortedParams, { encode: false }) +
        `&vnp_SecureHash=${secureHash}`;
    }
    return res.status(200).json({
      success: true,

      message: "Lấy danh sách booking thành công",

      data: result,
      payment_url: paymentUrl,
    });
  } catch (error) {
    next(error);
  }
};

// my booking

export const myBooking = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);

    const result = await prisma.bookings.findMany({
      where: {
        user_id: userId,
      },

      include: {
        // =========================
        // TOUR
        // =========================
        tour: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            price: true,
          },
        },

        // =========================
        // SCHEDULE
        // =========================
        schedule: {
          select: {
            id: true,
            departure_date: true,
            departure_time: true,
            return_date: true,
            return_time: true,
            total_slots: true,
            available_slots: true,
          },
        },

        // =========================
        // PAYMENT
        // =========================
        payments: {
          select: {
            id: true,
            booking_id: true,
            amount: true,
            payment_code: true,
            payment_method: true,
            status: true,
            gateway_response: true,
            created_at: true,
            updated_at: true,
          },

          orderBy: {
            created_at: "desc",
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách chuyến đi thành công",

      data: result.map((x) => ({
        // =========================
        // BOOKING
        // =========================
        id: x.id.toString(),
        user_id: x.user_id.toString(),
        tour_id: x.tour_id.toString(),
        schedule_id: x.schedule_id.toString(),

        booker_name: x.booker_name,
        booker_phone: x.booker_phone,
        booker_email: x.booker_email,
        booker_identity_number: x.booker_identity_number,

        departure: x.departure,

        total_people: x.total_people,
        adult_count: x.adult_count,
        child_count: x.child_count,
        infant_count: x.infant_count,

        total_amount: x.total_amount.toString(),

        status: x.status,

        special_request: x.special_request,

        created_at: x.created_at,
        updated_at: x.updated_at,

        // =========================
        // TOUR
        // =========================
        tour: x.tour
          ? {
              id: x.tour.id.toString(),
              name: x.tour.name,
              thumbnail: x.tour.thumbnail,
              price: x.tour.price.toString(),
            }
          : null,

        // =========================
        // SCHEDULE
        // =========================
        schedule: x.schedule
          ? {
              id: x.schedule.id.toString(),
              departure_date: x.schedule.departure_date,
              departure_time: x.schedule.departure_time,
              return_date: x.schedule.return_date,
              return_time: x.schedule.return_time,
            }
          : null,

        // =========================
        // PAYMENTS
        // =========================
        payments: Array.isArray(x.payments)
          ? x.payments.map((payment) => ({
              id: payment.id.toString(),

              booking_id: payment.booking_id.toString(),

              amount: payment.amount?.toString() ?? "0",

              payment_code: payment.payment_code,

              payment_method: payment.payment_method,

              status: payment.status,

              gateway_response: payment.gateway_response,

              created_at: payment.created_at,
              updated_at: payment.updated_at,
            }))
          : [],
      })),
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
          select: {
            id: true,
            name: true,
            thumbnail: true,
            price: true,
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
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking không tồn tại",
      });
    }

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
      status: booking.status,
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

//pending (Chờ duyệt),
//  confirmed (Đã duyệt),
// paid (Đã thanh toán), ready (Sắp khởi hành - Khóa sổ), ongoing (Đang đi tour),
// completed (Hoàn thành) và cancelled (Đã hủy).
// Duyệt / cập nhật trạng thái booking
export const duyetDon = async (req, res, next) => {
  try {
    const idBooking = req.params.id;
    console.log(req.body);
    const { status } = req.body;

    // 1. KIỂM TRA ID BOOKING
    let bookingId;
    try {
      bookingId = BigInt(idBooking);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    // 2. DANH SÁCH STATUS HỢP LỆ
    const statusDcDuyet = [
      "pending",
      "confirmed",
      "paid",
      "ready",
      "ongoing",
      "completed",
      "cancelled",
      "refund_pending",
      "refunded",
    ];

    if (!statusDcDuyet.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái duyệt đơn không hợp lệ",
      });
    }

    // 3. TÌM BOOKING
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const statusHienTai = booking.status;

    if (statusHienTai === "completed") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đã hoàn thành, không thể thay đổi",
      });
    }

    if (statusHienTai === "cancelled" || statusHienTai === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đã đóng (đã hủy/đã hoàn tiền), không thể thay đổi",
      });
    }

    // 4. HỦY ĐƠN (Chưa hoàn tiền hoặc hủy đơn thường)
    if (status === "cancelled") {
      const allowedToCancel = ["pending", "confirmed", "paid"];
      if (!allowedToCancel.includes(statusHienTai)) {
        return res.status(400).json({
          success: false,
          message: `Không thể hủy đơn khi đang ở trạng thái ${statusHienTai}`,
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const bookingResult = await tx.bookings.update({
          where: { id: bookingId },
          data: { status: "cancelled" },
        });

        await tx.tour_schedules.update({
          where: { id: bookingResult.schedule_id },
          data: {
            available_slots: { increment: bookingResult.total_people },
          },
        });

        return bookingResult;
      });

      return res.status(200).json({
        success: true,
        message: "Hủy đơn thành công",
        data: {
          booking_id: result.id.toString(),
          status: result.status,
        },
      });
    }

    // 5. HOÀN TIỀN (Chấp nhận cả 'paid' và 'refund_pending')
    if (status === "refunded") {
      if (!["paid", "refund_pending", "confirmed"].includes(statusHienTai)) {
        return res.status(400).json({
          success: false,
          message:
            "Chỉ có thể hoàn tiền cho booking đã thanh toán hoặc đang chờ hoàn tiền",
        });
      }

      // Xử lý hoàn tiền và đổi status booking trong cùng transaction
      const refundProcess = await prisma.$transaction(async (tx) => {
        const result = await hoanTien(bookingId, tx);

        if (!result?.refund) {
          throw new Error(
            result?.message || "Booking không đủ điều kiện hoàn tiền",
          );
        }

        const bookingUpdated = await tx.bookings.update({
          where: { id: bookingId },
          data: { status: "refunded" },
        });

        return { result, bookingUpdated };
      });

      return res.status(200).json({
        success: true,
        message: "Hoàn tiền thành công",
        data: {
          booking_id: refundProcess.bookingUpdated.id.toString(),
          status: refundProcess.bookingUpdated.status,
          refund_amount: refundProcess.result.refundAmount,
          refund_percent: refundProcess.result.refundPercent,
        },
      });
    }

    // 6. CẬP NHẬT TRẠNG THÁI KHÁC
    const bookingUpdated = await prisma.bookings.update({
      where: { id: bookingId },
      data: { status: status },
    });

    return res.status(200).json({
      success: true,
      message: "Duyệt đơn thành công",
      data: {
        booking_id: bookingUpdated.id.toString(),
        old_status: statusHienTai,
        status: bookingUpdated.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// chuyen trang thai cho hoan tien
export const refund_pending = async (req, res, next) => {
  try {
    let idBooking;
    try {
      idBooking = BigInt(req.params.id);
    } catch {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const booking = await prisma.bookings.findUnique({
      where: { id: idBooking },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Chỉ cho phép đưa vào hàng chờ hoàn tiền nếu đơn đã thanh toán hoặc confirmed
    if (!["paid", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể yêu cầu hoàn tiền cho đơn đang ở trạng thái ${booking.status}`,
      });
    }

    await prisma.bookings.update({
      where: { id: idBooking },
      data: { status: "refund_pending" },
    });

    return res.status(200).json({
      success: true,
      message: "Chuyển trạng thái chờ hoàn tiền thành công",
    });
  } catch (error) {
    next(error);
  }
};
// huỷ đơn -> hoàn lại số lượng -->
const hoanTien = async (bookingId, tx) => {
  // Dùng prisma instance nếu không truyền tx từ transaction ngoài vào
  const prismaClient = tx || prisma;

  // 1. Lấy booking
  const booking = await prismaClient.bookings.findUnique({
    where: { id: bookingId },
    include: {
      schedule: true,
      payments: {
        where: { status: "paid" },
        orderBy: { paid_at: "desc" },
        take: 1,
      },
      tour: {
        include: {
          operator: { select: { user_id: true } },
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Không tìm thấy booking");
  }

  // 2. Kiểm tra payment đã hoàn thành chưa
  const payment = booking.payments[0];
  if (!payment) {
    throw new Error("Đơn hàng chưa thanh toán nên không có tiền để hoàn");
  }

  const ownerId = booking.tour?.operator?.user_id;
  if (!ownerId) {
    throw new Error("Không xác định được chủ tour");
  }

  // 3. Tính số ngày còn lại trước khởi hành
  const departureDate = new Date(booking.schedule.departure_date);
  const today = new Date();
  departureDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = departureDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 4. Xác định % hoàn tiền
  let refundPercent = 0;
  if (diffDays >= 7) {
    refundPercent = 100;
  } else if (diffDays >= 3) {
    refundPercent = 50;
  } else {
    refundPercent = 0;
  }

  const totalPaid = Number(payment.amount);
  const refundAmount = (totalPaid * refundPercent) / 100;

  // Nếu không đủ điều kiện hoàn tiền
  if (refundAmount <= 0) {
    return {
      refund: null,
      refundAmount: 0,
      refundPercent: 0,
      message: `Hủy đơn cách ngày khởi hành ${diffDays} ngày (dưới 3 ngày) nên không đủ điều kiện hoàn tiền`,
    };
  }

  // 5. Kiểm tra ví chủ tour
  const ownerWallet = await prismaClient.wallets.findUnique({
    where: { user_id: ownerId },
  });

  if (!ownerWallet) {
    throw new Error("Chủ tour chưa có ví");
  }

  const ownerBalanceBefore = Number(ownerWallet.balance);
  if (ownerBalanceBefore < refundAmount) {
    throw new Error(
      `Ví chủ tour không đủ số dư để hoàn (cần ${refundAmount.toLocaleString()}đ, hiện có ${ownerBalanceBefore.toLocaleString()}đ)`,
    );
  }

  // 6. Lấy/Tạo ví khách
  let customerWallet = await prismaClient.wallets.findUnique({
    where: { user_id: booking.user_id },
  });

  if (!customerWallet) {
    customerWallet = await prismaClient.wallets.create({
      data: { user_id: booking.user_id, balance: 0 },
    });
  }

  const customerBalanceBefore = Number(customerWallet.balance);

  // 7. Tạo bản ghi hoàn tiền (refunds)
  const refund = await prismaClient.refunds.create({
    data: {
      payment_id: payment.id,
      booking_id: booking.id,
      amount: refundAmount,
      reason: `Hoàn tiền ${refundPercent}% do hủy booking`,
      refund_method: "wallet",
      status: "completed",
      processed_at: new Date(),
      note: `Còn ${diffDays} ngày trước ngày khởi hành`,
    },
  });

  // 8. Trừ ví chủ tour & Cộng ví khách
  await prismaClient.wallets.update({
    where: { id: ownerWallet.id },
    data: { balance: { decrement: refundAmount } },
  });

  await prismaClient.wallets.update({
    where: { id: customerWallet.id },
    data: { balance: { increment: refundAmount } },
  });

  // 9. Ghi lịch sử giao dịch 2 bên
  await prismaClient.wallet_transactions.create({
    data: {
      wallet_id: ownerWallet.id,
      user_id: ownerId,
      from_user_id: ownerId,
      to_user_id: booking.user_id,
      booking_id: booking.id,
      refund_id: refund.id,
      amount: -refundAmount,
      balance_before: ownerBalanceBefore,
      balance_after: ownerBalanceBefore - refundAmount,
      type: "refund",
      description: `Hoàn tiền ${refundPercent}% cho khách từ đơn #${booking.id}`,
    },
  });

  await prismaClient.wallet_transactions.create({
    data: {
      wallet_id: customerWallet.id,
      user_id: booking.user_id,
      from_user_id: ownerId,
      to_user_id: booking.user_id,
      booking_id: booking.id,
      refund_id: refund.id,
      amount: refundAmount,
      balance_before: customerBalanceBefore,
      balance_after: customerBalanceBefore + refundAmount,
      type: "refund",
      description: `Nhận hoàn tiền ${refundPercent}% từ đơn #${booking.id}`,
    },
  });

  // 10. Hoàn lại số chỗ cho lịch khởi hành
  await prismaClient.tour_schedules.update({
    where: { id: booking.schedule_id },
    data: {
      available_slots: { increment: booking.total_people },
    },
  });

  return {
    refund,
    refundAmount,
    refundPercent,
    customerId: booking.user_id,
    ownerId,
    message: `Đã hoàn ${refundPercent}% = ${refundAmount} vào ví khách`,
  };
};
