import prisma from "../../config/postgres.js";

// ==========================================
// LẤY PAYMENT THEO BOOKING
// ==========================================
export const getPaymentByBooking = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    // ==========================================
    // 1. Kiểm tra booking_id
    // ==========================================
    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "booking_id là bắt buộc",
      });
    }

    const bookingId = BigInt(booking_id);
    const userId = BigInt(req.user.id);

    // ==========================================
    // 2. Tìm booking
    // ==========================================
    const booking = await prisma.bookings.findUnique({
      where: {
        id: bookingId,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // ==========================================
    // 3. Kiểm tra quyền sở hữu
    // ==========================================
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem payment này",
      });
    }

    // ==========================================
    // 4. Lấy payment mới nhất
    // ==========================================
    const payment = await prisma.payments.findFirst({
      where: {
        booking_id: bookingId,
      },

      orderBy: {
        created_at: "desc",
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Booking chưa có payment",
      });
    }

    // ==========================================
    // 5. Response
    // ==========================================
    return res.json({
      success: true,

      data: {
        id: payment.id.toString(),

        booking_id: payment.booking_id.toString(),

        payment_code: payment.payment_code,

        transaction_code: payment.transaction_code,

        amount: payment.amount.toString(),

        payment_method: payment.payment_method,

        status: payment.status,

        paid_at: payment.paid_at,

        created_at: payment.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get ví và lịch sử giao dịch
export const getWalletUser = async (req, res, next) => {
  try {
    // 1. Lấy ID user đang đăng nhập
    const userId = BigInt(req.user.id);

    // 2. Tìm ví của user
    const wallet = await prisma.wallets.findUnique({
      where: {
        user_id: userId,
      },

      include: {
        transactions: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    // 3. Không có ví
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Người dùng chưa có ví",
      });
    }

    // 4. Format dữ liệu trả về
    const walletData = {
      id: wallet.id.toString(),

      user_id: wallet.user_id.toString(),

      // Số tiền hiện tại
      balance: Number(wallet.balance),

      // Lịch sử giao dịch
      transactions: wallet.transactions.map((item) => ({
        id: item.id.toString(),

        wallet_id: item.wallet_id.toString(),

        user_id: item.user_id.toString(),

        from_user_id: item.from_user_id ? item.from_user_id.toString() : null,

        to_user_id: item.to_user_id ? item.to_user_id.toString() : null,

        booking_id: item.booking_id ? item.booking_id.toString() : null,

        refund_id: item.refund_id ? item.refund_id.toString() : null,

        amount: Number(item.amount),

        balance_before: Number(item.balance_before),

        balance_after: Number(item.balance_after),

        type: item.type,

        description: item.description,

        created_at: item.created_at,
      })),
    };

    // 5. Response
    return res.status(200).json({
      success: true,
      message: "Lấy ví người dùng thành công",
      data: walletData,
    });
  } catch (error) {
    next(error);
  }
};

import { createVNPayUrl } from "./vnpay.service.js";

// ==========================================
// THANH TOÁN SAU - THANH TOÁN BOOKING ĐÃ TỒN TẠI
// ==========================================
export const payBooking = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    // ==========================================
    // 1. Kiểm tra booking_id
    // ==========================================
    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "booking_id là bắt buộc",
      });
    }

    const bookingId = BigInt(booking_id);
    const userId = BigInt(req.user.id);

    // ==========================================
    // 2. Tìm booking
    // ==========================================
    const booking = await prisma.bookings.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        schedule: true,

        payments: {
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // ==========================================
    // 3. Kiểm tra quyền sở hữu
    // ==========================================
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán booking này",
      });
    }

    // ==========================================
    // 4. Kiểm tra trạng thái booking
    // ==========================================
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking này đã bị hủy",
      });
    }

    if (booking.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking này đã được thanh toán",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Booking hiện tại không thể thanh toán",
      });
    }

    // ==========================================
    // 5. Lấy payment mới nhất
    // ==========================================
    const payment = booking.payments?.[0];

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Booking chưa có payment",
      });
    }

    // ==========================================
    // 6. Kiểm tra payment
    // ==========================================
    if (payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Khoản thanh toán này đã được thanh toán",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Khoản thanh toán này không thể thanh toán",
      });
    }

    // ==========================================
    // 7. Kiểm tra phương thức thanh toán
    // ==========================================
    if (payment.payment_method !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Booking này không phải thanh toán sau",
      });
    }

    // ==========================================
    // 8. Tính hạn thanh toán
    //    Hạn = ngày khởi hành - 7 ngày
    // ==========================================
    const departureDate = new Date(booking.schedule.departure_date);

    const paymentDeadline = new Date(departureDate);
    paymentDeadline.setDate(paymentDeadline.getDate() - 7);

    const now = new Date();

    // ==========================================
    // 9. Kiểm tra quá hạn
    // ==========================================
    if (now >= paymentDeadline) {
      return res.status(400).json({
        success: false,
        message: "Booking đã quá hạn thanh toán",
        payment_deadline: paymentDeadline,
      });
    }

    // ==========================================
    // 10. Tạo payment code
    // ==========================================
    const paymentCode =
      payment.payment_code || `PAYLATER_${booking.id}_${Date.now()}`;

    // ==========================================
    // 11. Lưu payment_code nếu chưa có
    // ==========================================
    if (!payment.payment_code) {
      await prisma.payments.update({
        where: {
          id: payment.id,
        },
        data: {
          payment_code: paymentCode,
        },
      });
    }

    // ==========================================
    // 12. Lấy IP người dùng
    // ==========================================
    let ipAddr =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    if (Array.isArray(ipAddr)) {
      ipAddr = ipAddr[0];
    }

    if (typeof ipAddr === "string" && ipAddr.includes(",")) {
      ipAddr = ipAddr.split(",")[0].trim();
    }

    // ==========================================
    // 13. Tạo URL VNPAY
    // ==========================================
    const paymentUrl = createVNPayUrl({
      paymentCode,
      amount: Number(payment.amount),
      ipAddr,
    });

    // ==========================================
    // 14. Trả kết quả
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Tạo link thanh toán thành công",
      data: {
        booking_id: booking.id.toString(),
        payment_id: payment.id.toString(),
        payment_code: paymentCode,
        amount: Number(payment.amount),
        payment_deadline: paymentDeadline,
        payment_url: paymentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
