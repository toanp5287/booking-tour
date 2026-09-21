import prisma from "../../config/postgres.js";

export const createRole = async (name, description) => {
  const role = await prisma.roles.create({ data: { name, description } });
  return { ...role, id: role.id.toString() };
};

// gan quyen
export const assignPermissionsToRole = async (roleId, permissionIds) => {
  const permission_Ids = permissionIds.map((permission) => BigInt(permission));
  const permissions = await prisma.permissions.findMany({
    where: {
      id: {
        in: permission_Ids,
      },
      deleted_at: null,
    },
  });
  if (permission_Ids.length !== permissions.length) {
    throw Error("loi co quyen ko ton tai ");
  }

  // gan cac quyen
  await prisma.role_permissions.createMany({
    data: permission_Ids.map((permissionId) => ({
      role_id: BigInt(roleId),
      permission_id: permissionId,
    })),
    skipDuplicates: true,
  });

  // lay ra tat ca cac quyen thuoc roleId do
  const permissionRoleId = await prisma.role_permissions.findMany({
    where: {
      role_id: BigInt(roleId),
    },
    include: {
      permission: true,
    },
  });
  return permissionRoleId.map((item) => ({
    role_id: item.role_id.toString(),
    permission_id: item.permission_id.toString(),

    permission: {
      id: item.permission.id.toString(),
      name: item.permission.name,
      description: item.permission.description,
      module: item.permission.module,
      action: item.permission.action,
      deleted_at: item.permission.deleted_at,
    },
  }));
};
