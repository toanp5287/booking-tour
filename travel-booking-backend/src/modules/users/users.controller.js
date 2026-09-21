import { generateToken } from "../../utils/jwt.js";
import prisma from "../../config/postgres.js";
import { createUser } from "./users.service.js";

export const getAllUser = async (req, res, next) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        user_roles: {
          where: {
            deleted_at: null,
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const data = users.map((user) => {
      const { password_hash, user_roles, ...userWithoutPassword } = user;

      const roles = user_roles.map((ur) => ur.role?.name).filter(Boolean);

      return {
        ...userWithoutPassword,
        id: user.id.toString(),
        role_name: roles[0] || "customer",
        roles: roles,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const getOne = async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id);

    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...userRole.user,

        id: userRole.user.id.toString(),

        role_id: userRole.role.id.toString(),
        role_name: userRole.role.name,
        role_description: userRole.role.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

// tao theem usser
export const controllerCreateUser = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      address,
      role_id,
    } = req.body;

    const data = await createUser(
      full_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      address,
      role_id,
    );

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// xoa

export const deleteUser = async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id);

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // 2. Xóa user
    const deletedUser = await prisma.users.delete({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
      },
    });

    // 3. Trả kết quả
    return res.status(200).json({
      success: true,
      message: "Xóa user thành công",
      data: {
        ...deletedUser,
        id: deletedUser.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// xoa meem

export const softDeleteUser = async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id);

    const user = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        status: "inactive",
        deleted_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        status: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khóa tài khoản thành công",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const inactiveUser = async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id);

    const user = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        status: "inactive",
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        status: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khóa tài khoản thành công",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// khoi phuc

export const restoreUser = async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id);

    const user = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục user thành công",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// cap nhat user
export const updateUser = async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id);

    const { full_name, email, phone, date_of_birth, gender, address, status } =
      req.body;

    const user = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        full_name,
        email,
        phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        gender,
        address,
        status,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        date_of_birth: true,
        gender: true,
        address: true,
        status: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật user thành công",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
