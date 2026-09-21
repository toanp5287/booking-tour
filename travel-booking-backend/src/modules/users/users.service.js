
import { hashPassword } from "../../utils/bcrypt.js";
import prisma from "../../config/postgres.js";

export const createUser = async (
    full_name,
    email,
    password,
    phone,
    date_of_birth,
    gender,
    address,
    role_id
) => {
    // 1. Kiểm tra email
    const existingUser = await prisma.users.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        throw new Error("Email đã được sử dụng");
    }

    // 2. Tìm role được chọn
    const role = await prisma.roles.findUnique({
        where: {
            id: BigInt(role_id),
        },
    });

    if (!role) {
        throw new Error("Role không tồn tại");
    }

    // 3. Hash mật khẩu
    const password_hash = await hashPassword(password);

    // 4. Tạo user + gán role
    const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.users.create({
            data: {
                full_name,
                email,
                password_hash,
                phone,
                date_of_birth: date_of_birth
                    ? new Date(date_of_birth)
                    : null,
                gender,
                address,
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

        await tx.user_roles.create({
            data: {
                user_id: newUser.id,
                role_id: role.id,
            },
        });

        return newUser;
    });


    return {
        ...user,
        id: user.id.toString(),
    };
};

