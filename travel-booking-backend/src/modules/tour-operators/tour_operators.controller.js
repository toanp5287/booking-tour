import prisma from "../../config/postgres.js";

// dang  ky thanh nha cung cap tour

export const tourOperator = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);

    const { company_name, description, phone, email, address, license_number } =
      req.body;

    // =========================
    // VALIDATE COMPANY NAME
    // =========================
    if (!company_name || typeof company_name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Tên nhà cung cấp là bắt buộc",
      });
    }

    const companyName = company_name.trim();

    if (companyName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Tên nhà cung cấp phải có ít nhất 2 ký tự",
      });
    }

    if (companyName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Tên nhà cung cấp không được quá 150 ký tự",
      });
    }

    // =========================
    // VALIDATE DESCRIPTION
    // =========================
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Mô tả phải là chuỗi",
      });
    }

    if (phone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại không hợp lệ",
        });
      }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }
    }

    if (!address || typeof address !== "string") {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ là bắt buộc",
      });
    }

    if (address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ phải có ít nhất 5 ký tự",
      });
    }

    // =========================
    // VALIDATE LICENSE NUMBER
    // =========================
    if (!license_number || typeof license_number !== "string") {
      return res.status(400).json({
        success: false,
        message: "Số giấy phép kinh doanh là bắt buộc",
      });
    }

    if (license_number.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Số giấy phép không hợp lệ",
      });
    }

    // =========================
    // KIỂM TRA USER
    // =========================
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || user.deleted_at !== null) {
      return res.status(403).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    const existingOperator = await prisma.tour_operators.findFirst({
      where: {
        user_id: userId,
        deleted_at: null,
      },
    });

    if (existingOperator) {
      return res.status(409).json({
        success: false,
        message: "User đã đăng ký làm nhà cung cấp tour",
      });
    }

    const userOperator = await prisma.tour_operators.create({
      data: {
        user_id: userId,
        company_name: companyName,
        description: description?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        address: address.trim(),
        license_number: license_number.trim(),
        status: "pending",
      },

      select: {
        id: true,
        user_id: true,
        company_name: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        license_number: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký nhà cung cấp tour thành công",
      data: {
        ...userOperator,
        id: userOperator.id.toString(),
        user_id: userOperator.user_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin xem yêu cầu đăng ký nhà cung cấp tour

export const getPendingOperators = async (req, res, next) => {
  try {
    const operatorsPending = await prisma.tour_operators.findMany({
      where: {
        status: "pending",
      },
      include: {
        user: true,
      },
    });

    const data = operatorsPending.map((operator) => ({
      ...operator,
      id: operator.id.toString(),
      user_id: operator.user_id.toString(),
      user: operator.user
        ? {
            ...operator.user,
            id: operator.user.id.toString(),
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// dueyt cung cap tour

export const duyetOperator = async (req, res, next) => {
  try {
    const idOperator = BigInt(req.params.id);
    const { status } = req.body;

    // Chỉ cho phép approved hoặc rejected
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status chỉ được là approved hoặc rejected",
      });
    }

    // Tìm đơn đăng ký
    const tourOperator = await prisma.tour_operators.findUnique({
      where: {
        id: idOperator,
      },
    });

    if (!tourOperator) {
      return res.status(404).json({
        success: false,
        message: "Đơn xin đăng ký không tồn tại",
      });
    }

    // Chỉ xử lý đơn đang pending
    if (tourOperator.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký này đã được xử lý",
      });
    }

    // Nếu duyệt → cập nhật status + cấp role
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái nhà cung cấp
      const operator = await tx.tour_operators.update({
        where: {
          id: idOperator,
        },
        data: {
          status: status,
        },
        select: {
          id: true,
          user_id: true,
          company_name: true,
          description: true,
          phone: true,
          email: true,
          status: true,
        },
      });

      // Chỉ cấp role khi được duyệt
      if (status === "approved") {
        // Tìm role TOUR_OPERATOR_OWNER
        const role = await tx.roles.findUnique({
          where: {
            name: "TOUR_OPERATOR_OWNER",
          },
        });

        if (!role) {
          throw new Error("Role TOUR_OPERATOR_OWNER không tồn tại");
        }

        // Kiểm tra user đã có role chưa
        const existingRole = await tx.user_roles.findFirst({
          where: {
            user_id: tourOperator.user_id,
            role_id: role.id,
            deleted_at: null,
          },
        });

        // Nếu chưa có thì cấp role
        if (!existingRole) {
          await tx.user_roles.create({
            data: {
              user_id: tourOperator.user_id,
              role_id: role.id,
            },
          });
        }
      }

      return operator;
    });

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "Duyệt nhà cung cấp tour và cấp quyền thành công"
          : "Từ chối nhà cung cấp tour thành công",
      data: {
        ...result,
        id: result.id.toString(),
        user_id: result.user_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOperators = async (req, res, next) => {
  try {
    const operators = await prisma.tour_operators.findMany({
      where: { status: "approved", deleted_at: null },
    });
    const dataOperators = operators.map((operator) => ({
      id: operator.id.toString(),
      user_id: operator.user_id.toString(),
      company_name: operator.company_name,
      description: operator.description,
      phone: operator.phone,
      email: operator.email,
      address: operator.address,
      logo_url: operator.logo_url,
      status: operator.status,
    }));
    return res.status(200).json({
      message: "lay tat ca nha cung cap tour thanh cong",
      data: dataOperators,
    });
  } catch (error) {
    next(error);
  }
};
