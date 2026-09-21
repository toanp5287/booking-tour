
import { z } from "zod";

export const validateRole = z.object({
    name: z
        .string()
        .min(2, "Tên role phải có ít nhất 2 ký tự")
        .max(50, "Tên role không được quá 50 ký tự"),

    description: z
        .string()
        .max(255, "Mô tả không được quá 255 ký tự")
        .optional(),
});

