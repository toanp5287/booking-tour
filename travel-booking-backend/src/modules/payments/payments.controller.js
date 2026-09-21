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
