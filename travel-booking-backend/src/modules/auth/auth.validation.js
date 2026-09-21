import { email, z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ"),

  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
export const registerValidate = z.object({
  full_name: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").max(100, "Họ tên không được quá 100 ký tự"),
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().trim().min(6, "Mật khẩu phải ít nhất 6 ký tự").max(100, "Mật khẩu không được quá 100 ký tự"),
  phone: z.string().trim().regex(/^(0|\+84)[0-9]{9}$/, "Số điện thoại không hợp lệ"),
  date_of_birth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  address: z.string().trim().max(255, "Địa chỉ không được quá 255 ký tự").optional(),
});

export const validateUpdatePassword = z.object({
  old_password: z
    .string()
    .min(6, "Mật khẩu cũ phải có ít nhất 6 ký tự"),

  new_password: z
    .string()
    .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

