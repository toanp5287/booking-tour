import { z } from "zod";

// =================================================================
// BÁO GIÁ TOUR ĐOÀN - VALIDATION
// Lưu ý: backend luôn tự tính lại tổng tiền / tiền cọc, không tin client.
// =================================================================

const idString = (message) =>
  z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^[1-9]\d*$/.test(val), { message });

const optionalIdString = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === "") return null;
    return String(val).trim();
  })
  .refine((val) => val === null || /^[1-9]\d*$/.test(val), {
    message: "ID không hợp lệ",
  });

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày phải là YYYY-MM-DD");

const quotationItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên dịch vụ không được để trống")
    .max(200, "Tên dịch vụ không quá 200 ký tự"),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.coerce
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng tối thiểu là 1"),
  unit_price: z.coerce.number().min(0, "Đơn giá không được âm"),
});

const paxSchema = z.object({
  total: z.coerce.number().int().min(1, "Số người tham gia phải lớn hơn 0"),
});

export const quotationDetailsSchema = z.object({
  tour_id: idString("Vui lòng chọn tour cho báo giá"),
  schedule_id: optionalIdString,
  tour_type: z.enum(["SIC", "PRIVATE", "GROUP", "CUSTOM"]).optional(),
  departure_date: dateString.nullable().optional(),
  return_date: dateString.nullable().optional(),
  pax: paxSchema.optional(),
  itinerary: z.string().trim().max(5000).nullable().optional(),
  items: z
    .array(quotationItemSchema)
    .min(1, "Cần ít nhất một dịch vụ trong báo giá"),
  surcharge: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  deposit_percentage: z.coerce
    .number()
    .min(0, "Tỷ lệ đặt cọc không được âm")
    .max(100, "Tỷ lệ đặt cọc không quá 100")
    .optional()
    .default(30),
});

export const createQuotationSchema = z.object({
  request_id: idString("Mã yêu cầu tour không hợp lệ"),
  title: z.string().trim().max(200).optional(),
  currency: z.string().trim().max(10).optional(),
  valid_until: z.union([z.string(), z.null()]).optional(),
  terms: z.string().trim().max(5000).optional(),
  notes: z.string().trim().max(5000).optional(),
  details: quotationDetailsSchema,
});

export const updateQuotationSchema = z.object({
  title: z.string().trim().max(200).optional(),
  currency: z.string().trim().max(10).optional(),
  valid_until: z.union([z.string(), z.null()]).optional(),
  terms: z.string().trim().max(5000).optional(),
  notes: z.string().trim().max(5000).optional(),
  details: quotationDetailsSchema.optional(),
});

export const respondQuotationSchema = z
  .object({
    action: z.enum(["accept", "reject", "revision"]),
    message: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) =>
      data.action === "accept" ||
      (typeof data.message === "string" && data.message.length > 0),
    {
      message: "Vui lòng nhập nội dung khi từ chối hoặc yêu cầu chỉnh sửa",
      path: ["message"],
    },
  );
