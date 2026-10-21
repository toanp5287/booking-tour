import { verifyJwt } from "../utils/jwt.js";

export const optionalToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Không có token → coi là khách chưa đăng nhập
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // Có Authorization nhưng không đúng Bearer
    if (!authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    // Không có token
    if (!token) {
      req.user = null;
      return next();
    }

    // Có token → xác thực
    const decoded = verifyJwt(token);

    req.user = decoded;

    next();
  } catch (error) {
    // Token hết hạn / không hợp lệ
    // Với optionalToken thì coi như khách chưa đăng nhập
    req.user = null;
    next();
  }
};
