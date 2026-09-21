import prisma from "../../config/postgres.js";
import { createRole, assignPermissionsToRole } from "./roles.service.js";
export const getAllRoles = async (req, res, next) => {
  try {
    const data = await prisma.roles.findMany({
      where: {
        deleted_at: null,
      },
    });

    const roles = data.map((role) => ({
      ...role,
      id: role.id.toString(),
    }));

    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const roleId = req.params.id;
    const role = await prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(401).json({ message: "khong tim thay role" });
    }
    return res.status(200).json({ data: { ...role, id: role.id.toString() } });
  } catch (error) {
    next(error);
  }
};

export const ControllerCreateRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const role = await createRole(name, description);
    return res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

export const softDeleteRole = async (req, res, next) => {
  try {
    const roleId = BigInt(req.params.id);

    const role = await prisma.roles.update({
      where: {
        id: roleId,
      },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ẩn user thành công",
      data: {
        ...role,
        id: role.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// khoi phuc

export const restoreRole = async (req, res, next) => {
  try {
    const roleId = BigInt(req.params.id);

    const role = await prisma.roles.update({
      where: {
        id: roleId,
      },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục role thành công",
      data: {
        ...role,
        id: role.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// cap nhat role

export const updateRole = async (req, res, next) => {
  try {
    const roleId = BigInt(req.params.id);
    const { name, description } = req.body;
    const role = await prisma.roles.update({
      where: {
        id: roleId,
      },
      data: {
        name,
        description,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    return res.status(200).json({
      ...role,
      id: role.id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

// gan quyen-- cập nhật các quyền

export const assignPermissionsController = async (req, res, next) => {
  try {
    const changes = req.body;

    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu thay đổi không hợp lệ",
      });
    }

    const toAdd = changes.filter((item) => item.checked === true);
    const toDelete = changes.filter((item) => item.checked === false);

    await prisma.$transaction(async (tx) => {
      for (const item of toDelete) {
        await tx.role_permissions.deleteMany({
          where: {
            role_id: BigInt(item.role_id),
            permission_id: BigInt(item.permission_id),
          },
        });
      }

      for (const item of toAdd) {
        const roleId = BigInt(item.role_id);
        const permId = BigInt(item.permission_id);

        await tx.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: roleId,
              permission_id: permId,
            },
          },
          update: {},
          create: {
            role_id: roleId,
            permission_id: permId,
          },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật quyền thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Xem quyền của role
export const viewPermissionsRole = async (req, res, next) => {
  try {
    const rolePermissions = await prisma.role_permissions.findMany({
      include: {
        permission: true,
        role: true,
      },
    });

    const data = rolePermissions.map((item) => ({
      role_id: item.role_id.toString(),
      role_name: item.role.name,

      permission_id: item.permission.id.toString(),
      permission_name: item.permission.name,

      module: item.permission.module,
      action: item.permission.action,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// lay ten role và id theo userid
export const getUserRole = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);

    // Lấy role của user
    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: userId,
      },
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: "User chưa có role",
      });
    }

    // Lấy thông tin role
    const role = await prisma.roles.findUnique({
      where: {
        id: userRole.role_id,
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        role_id: role.id.toString(),
        role_name: role.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
