
import { z } from "zod";

export const validateCreatePermission = z.object({
    name: z
        .string()
        .min(3, "Tên permission phải có ít nhất 3 ký tự")
        .max(100, "Tên permission không được quá 100 ký tự"),

    description: z
        .string()
        .max(255, "Mô tả không được quá 255 ký tự")
        .optional(),

    module: z
        .string()
        .min(2, "Module phải có ít nhất 2 ký tự")
        .max(50, "Module không được quá 50 ký tự"),

    action: z
        .string()
        .min(2, "Action phải có ít nhất 2 ký tự")
        .max(50, "Action không được quá 50 ký tự"),
});
