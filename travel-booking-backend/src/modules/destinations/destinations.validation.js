import { z } from "zod";

export const createDestinationSchema = z.object({
  category_id: z
    .string()
    .regex(/^\d+$/, "category_id phải là số")
    .optional()
    .or(z.literal("")),

  name: z
    .string()
    .trim()
    .min(2, "Tên địa điểm phải có ít nhất 2 ký tự")
    .max(200, "Tên địa điểm không được quá 200 ký tự"),

  description: z.string().optional().or(z.literal("")),

  address: z
    .string()
    .max(500, "Địa chỉ không được quá 500 ký tự")
    .optional()
    .or(z.literal("")),

  province: z
    .string()
    .max(100, "Tên tỉnh/thành không được quá 100 ký tự")
    .optional()
    .or(z.literal("")),

  latitude: z
    .string()
    .refine(
      (value) => value === "" || !isNaN(Number(value)),
      "Latitude phải là số",
    )
    .refine(
      (value) => value === "" || (Number(value) >= -90 && Number(value) <= 90),
      "Latitude phải từ -90 đến 90",
    )
    .optional(),

  longitude: z
    .string()
    .refine(
      (value) => value === "" || !isNaN(Number(value)),
      "Longitude phải là số",
    )
    .refine(
      (value) =>
        value === "" || (Number(value) >= -180 && Number(value) <= 180),
      "Longitude phải từ -180 đến 180",
    )
    .optional(),

  estimated_visit_time: z
    .string()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Thời gian tham quan phải là số nguyên",
    )
    .optional(),

  opening_time: z
    .string()
    .regex(
      /^$|^([01]\d|2[0-3]):([0-5]\d)$/,
      "Giờ mở cửa phải có định dạng HH:mm",
    )
    .optional(),

  closing_time: z
    .string()
    .regex(
      /^$|^([01]\d|2[0-3]):([0-5]\d)$/,
      "Giờ đóng cửa phải có định dạng HH:mm",
    )
    .optional(),

  average_cost: z
    .string()
    .refine(
      (value) => value === "" || !isNaN(Number(value)),
      "Chi phí trung bình phải là số",
    )
    .refine(
      (value) => value === "" || Number(value) >= 0,
      "Chi phí trung bình không được nhỏ hơn 0",
    )
    .optional(),

  best_time: z
    .string()
    .max(200, "best_time không được quá 200 ký tự")
    .optional()
    .or(z.literal("")),

  weather_note: z.string().optional().or(z.literal("")),

  age_suitable: z
    .string()
    .max(200, "age_suitable không được quá 200 ký tự")
    .optional()
    .or(z.literal("")),

  activity_types: z.string().optional().or(z.literal("")),

  status: z.enum(["active", "inactive"]).optional().default("active"),
});

// Validate cập nhật địa điểm du lịch
export const updateDestinationSchema = z.object({
  category_id: z
    .string()
    .regex(/^\d+$/, "category_id phải là số")
    .optional()
    .or(z.literal("")),

  name: z
    .string()
    .trim()
    .min(2, "Tên địa điểm phải có ít nhất 2 ký tự")
    .max(200, "Tên địa điểm không được quá 200 ký tự")
    .optional(),

  description: z.string().optional().or(z.literal("")),

  address: z
    .string()
    .max(500, "Địa chỉ không được quá 500 ký tự")
    .optional()
    .or(z.literal("")),

  province: z
    .string()
    .max(100, "Tên tỉnh/thành không được quá 100 ký tự")
    .optional()
    .or(z.literal("")),

  latitude: z
    .string()
    .refine(
      (value) => value === "" || !isNaN(Number(value)),
      "Latitude phải là số",
    )
    .refine(
      (value) => value === "" || (Number(value) >= -90 && Number(value) <= 90),
      "Latitude phải từ -90 đến 90",
    )
    .optional(),

  longitude: z
    .string()
    .refine(
      (value) => value === "" || !isNaN(Number(value)),
      "Longitude phải là số",
    )
    .refine(
      (value) =>
        value === "" || (Number(value) >= -180 && Number(value) <= 180),
      "Longitude phải từ -180 đến 180",
    )
    .optional(),

  estimated_visit_time: z
    .string()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Thời gian tham quan phải là số nguyên",
    )
    .refine(
      (value) => value === "" || Number(value) > 0,
      "Thời gian tham quan phải lớn hơn 0",
    )
    .optional(),

  opening_time: z
    .string()
    .regex(
      /^$|^([01]\d|2[0-3]):([0-5]\d)$/,
      "Giờ mở cửa phải có định dạng HH:mm",
    )
    .optional(),

  closing_time: z
    .string()
    .regex(
      /^$|^([01]\d|2[0-3]):([0-5]\d)$/,
      "Giờ đóng cửa phải có định dạng HH:mm",
    )
    .optional(),

  average_cost: z
    .string()
    .refine(
      (value) => value === "" || !isNaN(Number(value)),
      "Chi phí trung bình phải là số",
    )
    .refine(
      (value) => value === "" || Number(value) >= 0,
      "Chi phí trung bình không được nhỏ hơn 0",
    )
    .optional(),

  best_time: z
    .string()
    .max(200, "best_time không được quá 200 ký tự")
    .optional()
    .or(z.literal("")),

  weather_note: z.string().optional().or(z.literal("")),

  age_suitable: z
    .string()
    .max(200, "age_suitable không được quá 200 ký tự")
    .optional()
    .or(z.literal("")),

  activity_types: z.string().optional().or(z.literal("")),

  status: z
    .enum(["active", "inactive"], {
      message: "Status chỉ được là active hoặc inactive",
    })
    .optional(),
});
