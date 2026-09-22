import {
  getAllPermissionsService,
  getAllusers,
  login,
  register,
  updatePasswordService,
  googleLogin,
} from "./auth.service.js";
import { generateToken } from "../../utils/jwt.js";
import prisma from "../../config/postgres.js";

export const googleAuth = async (req, res, next) => {
  try {
    const googleUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&access_type=offline`;

    return res.redirect(googleUrl);
  } catch (error) {
    next(error);
  }
};
export const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Không nhận được code từ Google",
      });
    }

    const user = await googleLogin(code);

    const token = generateToken({
      id: user.id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/login?token=${encodeURIComponent(token)}`,
    );
  } catch (error) {
    next(error);
  }
};

export const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await getAllPermissionsService();

    const data = permissions.map((permission) => ({
      ...permission,
      id: permission.id.toString(),
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const getAll = async (req, res, next) => {
  try {
    const users = await getAllusers();
    const data = users.map((user) => ({ ...user, id: user.id.toString() }));
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
export const controllerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await login(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng hoặc không tồn tại",
      });
    }

    const token = generateToken({
      id: user.id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
    });
  } catch (error) {
    next(error);
  }
};
export const registerController = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      address,
    } = req.body;

    const user = await register(
      full_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      address,
    );

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updaePassworld = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;
    const user = await updatePasswordService(
      userId,
      old_password,
      new_password,
    );
    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// get me
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const me = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
    return res.status(200).json({
      success: true,
      data: { ...me, id: me.id.toString() },
    });
  } catch (error) {
    next(error);
  }
};
