import prisma from "../../config/postgres.js";

// ==========================================================
// MIDDLEWARE PHÂN QUYỀN MODULE BOOKINGS
// ------------------------------------------------------------
// Kiểm tra quyền ngay trên server, không tin vào bất kỳ thông tin
// nào do frontend gửi lên.
//
// Dùng hệ thống phân quyền sẵn có: bảng roles + user_roles.
// ADMIN / STAFF được phép thao tác quản lý booking.
// ==========================================================

const ALLOWED_ROLE_NAMES = ["ADMIN", "STAFF"];

export const requireBookingManage = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    const userId = BigInt(req.user.id);

    const userRoles = await prisma.user_roles.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        role: {
          deleted_at: null,
        },
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    const roleNames = userRoles
      .map((item) => String(item?.role?.name ?? "").trim().toUpperCase())
      .filter(Boolean);

    const isAllowed = roleNames.some((name) =>
      ALLOWED_ROLE_NAMES.includes(name),
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác quản lý booking",
      });
    }

    req.userRoleNames = roleNames;

    next();
  } catch (error) {
    next(error);
  }
};
