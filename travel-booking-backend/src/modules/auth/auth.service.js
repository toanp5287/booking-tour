import { da } from "zod/locales";
import prisma from "../../config/postgres.js";
import { hashPassword, comparePassword } from "../../utils/bcrypt.js";
import { email } from "zod";

import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
export const getAllPermissionsService = async () => {
  return await prisma.permissions.findMany();
};
export const getAllusers = async () => {
  return await prisma.users.findMany();
};
export const login = async (email, password) => {
  const user = await prisma.users.findUnique({
    where: {
      email,
      status: "active",
      deleted_at: null,
    },
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
  };
};
export const register = async (
  full_name,
  email,
  password,
  phone,
  date_of_birth,
  gender,
  address,
) => {
  const existingUser = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("Email đã được sử dụng");
  }

  const customerRole = await prisma.roles.findUnique({
    where: {
      name: "CUSTOMER",
    },
  });

  if (!customerRole) {
    throw new Error("Role CUSTOMER chưa tồn tại");
  }

  const password_hash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.users.create({
      data: {
        full_name,
        email,
        password_hash,
        phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        gender,
        address,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
      },
    });

    await tx.user_roles.create({
      data: {
        user_id: newUser.id,
        role_id: customerRole.id,
      },
    });

    return newUser;
  });

  return {
    ...user,
    id: user.id.toString(),
  };
};

// thay mật khẩu

export const updatePasswordService = async (
  userId,
  old_password,
  new_password,
) => {
  // 1. Tìm user
  const user = await prisma.users.findUnique({
    where: {
      id: BigInt(userId),
    },
  });

  if (!user) {
    throw new Error("Tài khoản không tồn tại");
  }

  // 2. Kiểm tra mật khẩu cũ
  const isPasswordValid = await comparePassword(
    old_password,
    user.password_hash,
  );

  if (!isPasswordValid) {
    throw new Error("Mật khẩu cũ không đúng");
  }

  // 3. Hash mật khẩu mới
  const password_hashNew = await hashPassword(new_password);

  // 4. Cập nhật mật khẩu
  const updatedUser = await prisma.users.update({
    where: {
      id: BigInt(userId),
    },
    data: {
      password_hash: password_hashNew,
    },
    select: {
      id: true,
      email: true,
      full_name: true,
    },
  });

  return {
    ...updatedUser,
    id: updatedUser.id.toString(),
  };
};

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);
export const googleLogin = async (code) => {
  // 1. Đổi code Google lấy token
  const { tokens } = await googleClient.getToken(code);

  // 2. Kiểm tra ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  // 3. Lấy thông tin người dùng từ Google
  const payload = ticket.getPayload();

  const email = payload.email;
  const full_name = payload.name;
  const avatar_url = payload.picture;

  if (!email) {
    throw new Error("Google không trả về email");
  }

  // 4. Tìm user theo email
  let user = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  // 5. Nếu chưa có → tạo tài khoản
  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");

    const password_hash = await hashPassword(randomPassword);

    const customerRole = await prisma.roles.findUnique({
      where: {
        name: "CUSTOMER",
      },
    });

    if (!customerRole) {
      throw new Error("Role CUSTOMER chưa tồn tại");
    }

    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          full_name: full_name || "Google User",
          email,
          password_hash,
          avatar_url: avatar_url || null,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: newUser.id,
          role_id: customerRole.id,
        },
      });

      return newUser;
    });
  }

  // 6. Tìm role của user
  const userRole = await prisma.user_roles.findFirst({
    where: {
      user_id: user.id,
    },
    include: {
      role: true,
    },
  });

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url,
    role: userRole?.role?.name || "CUSTOMER",
  };
};
