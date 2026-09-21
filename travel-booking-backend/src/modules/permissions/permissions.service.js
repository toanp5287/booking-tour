import prisma from "../../config/postgres.js";


export const createPermission = async (name, description, module, action) => {
    const role = await prisma.permissions.create({ data: { name, description, module, action } });
    return { ...role, id: role.id.toString() }
}