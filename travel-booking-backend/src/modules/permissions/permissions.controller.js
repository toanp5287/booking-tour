import { ro } from "zod/locales";
import prisma from "../../config/postgres.js";
import { createPermission } from "./permissions.service.js";
export const getAllPermissions = async (req, res, next) => {
  try {
    const data = await prisma.permissions.findMany({
      where: {
        deleted_at: null,
      },
      orderBy: {
        id: "asc",
      },
    });

    // Gom nhóm theo chức năng (lấy từ cột module/model, nếu không có thì lấy tiền tố của name ví dụ: 'users.read' -> 'users')
    const grouped = data.reduce((acc, item) => {
      const feature =
        item.module ||
        item.model ||
        item.permission_name?.split(".")[0] ||
        item.name?.split(".")[0] ||
        "other";

      if (!acc[feature]) {
        acc[feature] = [];
      }

      acc[feature].push({
        ...item,
        id: item.id.toString(),
      });

      return acc;
    }, {});

    // Chuyển sang dạng mảng [{ group: 'users', permissions: [...] }]
    const formattedData = Object.keys(grouped).map((groupName) => ({
      group: groupName,
      permissions: grouped[groupName],
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const permissionId = req.params.id;
    const permission = await prisma.permissions.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      return res.status(401).json({ message: "khong tim thay permissions" });
    }
    return res
      .status(200)
      .json({ data: { ...permission, id: permission.id.toString() } });
  } catch (error) {
    next(error);
  }
};

export const ControllerCreatePermission = async (req, res, next) => {
  try {
    const { name, description, module, action } = req.body;
    const role = await createPermission(name, description, module, action);
    return res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

// xoa meem
export const softDeletePermission = async (req, res, next) => {
  try {
    const permissionId = BigInt(req.params.id);

    const permission = await prisma.permissions.update({
      where: {
        id: permissionId,
      },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        module: true,
        action: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ẩn permission thành công",
      data: {
        ...permission,
        id: permission.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// // khoi phuc

export const restorePermission = async (req, res, next) => {
  try {
    const permissionId = BigInt(req.params.id);

    const permission = await prisma.permissions.update({
      where: {
        id: permissionId,
      },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        module: true,
        action: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục permisson thành công",
      data: {
        ...permission,
        id: permission.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// // cap nhat role

export const updatePermission = async (req, res, next) => {
  try {
    const permissionId = BigInt(req.params.id);
    const { name, description, module, action } = req.body;
    const permission = await prisma.permissions.update({
      where: {
        id: permissionId,
      },
      data: {
        name,
        description,
        module,
        action,
      },
      select: {
        id: true,
        name: true,
        description: true,
        module: true,
        action: true,
        deleted_at: true,
      },
    });
    return res.status(200).json({
      ...permission,
      id: permission.id.toString(),
    });
  } catch (error) {
    next(error);
  }
};
