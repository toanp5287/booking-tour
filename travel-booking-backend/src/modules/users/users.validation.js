
import { z } from "zod";

export const validateCreateUser = z.object({
    full_name: z
        .string()
        .min(2, "Họ tên phải có ít nhất 2 ký tự")
        .max(100, "Họ tên không được quá 100 ký tự"),

    email: z
        .string()
        .email("Email không hợp lệ")
        .max(150, "Email không được quá 150 ký tự"),

    password: z
        .string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .max(100, "Mật khẩu không được quá 100 ký tự"),

    phone: z
        .string()
        .regex(
            /^(0|\+84)[0-9]{9}$/,
            "Số điện thoại không hợp lệ"
        )
        .optional(),

    date_of_birth: z
        .string()
        .refine(
            (value) => !isNaN(Date.parse(value)),
            "Ngày sinh không hợp lệ"
        )
        .optional(),

    gender: z
        .string()
        .max(20, "Giới tính không hợp lệ")
        .optional(),

    address: z
        .string()
        .max(255, "Địa chỉ không được quá 255 ký tự")
        .optional(),

    role_id: z
        .coerce
        .bigint()
        .positive("role_id phải lớn hơn 0"),
});

