import { z } from "zod";

// Helper parse JSON string nếu gửi từ FormData/Multer
const parseJsonArray = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val ?? [];
};

// =================================================================
// 1. CATEGORY SCHEMAS
// =================================================================
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên loại tour phải có ít nhất 2 ký tự")
    .max(100, "Tên loại tour không được vượt quá 100 ký tự"),

  description: z
    .string()
    .trim()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên loại tour phải có ít nhất 2 ký tự")
    .max(100, "Tên loại tour không được vượt quá 100 ký tự")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional(),

  status: z.enum(["active", "inactive"]).optional(),
});

// =================================================================
// 2. SUB-SCHEMAS CHO BẢNG CON CỦA TOUR
// =================================================================

// 2.1. Bảng tour_schedules
export const scheduleItemSchema = z.object({
  departure_date: z
    .string()
    .min(1, "Ngày khởi hành không được để trống")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày phải là YYYY-MM-DD"),

  departure_time: z
    .string()
    .min(1, "Giờ khởi hành không được để trống")
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
      "Giờ khởi hành không hợp lệ (HH:mm hoặc HH:mm:ss)",
    ),

  return_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày về phải là YYYY-MM-DD")
    .nullable()
    .optional(),

  return_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
      "Giờ về không hợp lệ (HH:mm hoặc HH:mm:ss)",
    )
    .nullable()
    .optional(),

  total_slots: z.coerce
    .number()
    .int("Tổng số chỗ phải là số nguyên")
    .min(1, "Tổng số chỗ tối thiểu là 1"),

  available_slots: z.coerce.number().int().min(0).optional(),

  status: z.enum(["open", "full", "closed"]).default("open").optional(),
});

// 2.2. Bảng tour_destinations
export const tourDestinationItemSchema = z.object({
  destination_id: z.coerce.bigint().positive("Vui lòng chọn điểm đến hợp lệ"),
  day_number: z.coerce
    .number()
    .int()
    .min(1, "Ngày ghé thăm tối thiểu là ngày 1"),
  visit_order: z.coerce.number().int().min(1, "Thứ tự ghé thăm tối thiểu là 1"),
});

// 2.3. Bảng itinerary_activities
export const activityItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên hoạt động không được để trống")
    .max(200, "Tên hoạt động tối đa 200 ký tự"),

  destination_id: z
    .union([z.coerce.bigint().positive(), z.literal(""), z.null()])
    .optional()
    .transform((val) =>
      val === "" || val === null || val === undefined ? null : BigInt(val),
    ),

  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Giờ không hợp lệ")
    .nullable()
    .optional(),

  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Giờ không hợp lệ")
    .nullable()
    .optional(),

  activity_type: z.string().trim().max(100).nullable().optional(),
  visit_order: z.coerce.number().int().min(1).default(1),
  transportation: z.string().trim().max(100).nullable().optional(),
  estimated_cost: z.coerce.number().min(0).default(0).optional(),
  note: z.string().trim().nullable().optional(),
});

// 2.4. Bảng tour_itineraries
export const itineraryItemSchema = z.object({
  day_number: z.coerce.number().int().min(1, "Số thứ tự ngày phải từ 1"),
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề ngày không được để trống")
    .max(200, "Tiêu đề ngày tối đa 200 ký tự"),
  description: z.string().trim().nullable().optional(),
  activities: z.array(activityItemSchema).default([]),
});

// =================================================================
// 3. TOUR SCHEMAS (CREATE & UPDATE)
// =================================================================

// 3.1. Schema Tạo Tour (Khắc phục triệt để lỗi operatorId / idCategory)
export const createTourSchema = z.preprocess(
  (raw) => {
    if (typeof raw !== "object" || raw === null) return raw;
    const body = { ...raw };

    // Tự động gán nếu frontend gửi camelCase hoặc snake_case
    body.operatorId = body.operatorId ?? body.operator_id;
    body.idCategory = body.idCategory ?? body.category_id;

    return body;
  },
  z.object({
    operatorId: z.coerce.bigint().positive("Vui lòng chọn đơn vị tổ chức"),

    idCategory: z.coerce.bigint().positive("Vui lòng chọn danh mục"),

    name: z
      .string()
      .trim()
      .min(3, "Tên tour phải có ít nhất 3 ký tự")
      .max(200, "Tên tour không được vượt quá 200 ký tự"),

    slug: z
      .string()
      .trim()
      .min(3, "Slug phải có ít nhất 3 ký tự")
      .max(220, "Slug không được vượt quá 220 ký tự")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
      ),

    description: z.string().trim().nullable().optional(),

    price: z.coerce.number().positive("Giá tour phải lớn hơn 0"),

    duration_days: z.coerce
      .number()
      .int()
      .min(1, "Thời lượng tour tối thiểu 1 ngày"),

    duration_nights: z.coerce
      .number()
      .int()
      .min(0, "Số đêm không được nhỏ hơn 0"),

    max_people: z.coerce
      .number()
      .int()
      .min(1, "Số người tối đa tối thiểu là 1"),

    difficulty_level: z.string().trim().max(50).default("Dễ").optional(),
    transportation: z.string().trim().max(100).nullable().optional(),
    status: z
      .enum(["active", "inactive", "draft"])
      .default("active")
      .optional(),

    // Parse JSON string cho các mảng lồng nhau từ FormData
    schedules: z.preprocess(
      parseJsonArray,
      z.array(scheduleItemSchema).min(1, "Phải có ít nhất 1 đợt khởi hành"),
    ),
    destinations: z.preprocess(
      parseJsonArray,
      z.array(tourDestinationItemSchema).default([]),
    ),
    itineraries: z.preprocess(
      parseJsonArray,
      z.array(itineraryItemSchema).default([]),
    ),
  }),
);

// 3.2. Schema Cập nhật Tour
export const updateTourSchema = z.preprocess(
  (raw) => {
    if (typeof raw !== "object" || raw === null) return raw;
    const body = { ...raw };
    body.operatorId = body.operatorId ?? body.operator_id;
    body.idCategory = body.idCategory ?? body.category_id;

    // Chuẩn hóa child_price khi gửi từ FormData: rỗng hoặc 'null' -> null
    if (
      body.child_price === "" ||
      body.child_price === "null" ||
      body.child_price === undefined
    ) {
      body.child_price = null;
    }

    // Chuẩn hóa infant_price: rỗng -> 0
    if (
      body.infant_price === "" ||
      body.infant_price === "null" ||
      body.infant_price === undefined
    ) {
      body.infant_price = 0;
    }

    return body;
  },
  z
    .object({
      operatorId: z.coerce.bigint().positive().optional(),

      idCategory: z.coerce.bigint().positive().optional(),

      name: z
        .string()
        .trim()
        .min(2, "Tên tour phải có ít nhất 2 ký tự")
        .max(200, "Tên tour không được vượt quá 200 ký tự")
        .optional(),

      slug: z
        .string()
        .trim()
        .min(2, "Slug phải có ít nhất 2 ký tự")
        .max(220, "Slug không được vượt quá 220 ký tự")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
        )
        .optional(),

      description: z
        .string()
        .trim()
        .max(5000, "Mô tả không được vượt quá 5000 ký tự")
        .nullable()
        .optional(),

      price: z.coerce.number().positive("Giá tour phải lớn hơn 0").optional(),

      // BỔ SUNG 1: Giá vé trẻ em (cho phép null nếu không áp dụng)
      child_price: z.coerce
        .number()
        .min(0, "Giá vé trẻ em không được âm")
        .nullable()
        .optional(),

      // BỔ SUNG 2: Giá vé em bé
      infant_price: z.coerce
        .number()
        .min(0, "Giá vé em bé không được âm")
        .nullable()
        .optional(),

      duration_days: z.coerce
        .number()
        .int()
        .positive("Số ngày phải lớn hơn 0")
        .optional(),

      duration_nights: z.coerce
        .number()
        .int()
        .min(0, "Số đêm không được nhỏ hơn 0")
        .optional(),

      max_people: z.coerce
        .number()
        .int()
        .positive("Số người tối đa phải lớn hơn 0")
        .optional(),

      difficulty_level: z
        .string()
        .trim()
        .max(50, "Độ khó không được vượt quá 50 ký tự")
        .optional(),

      transportation: z
        .string()
        .trim()
        .max(100, "Phương tiện không được vượt quá 100 ký tự")
        .nullable()
        .optional(),

      status: z.enum(["active", "inactive", "draft"]).optional(),

      // BỔ SUNG 3: Chấp nhận các mảng quan hệ gửi qua FormData
      schedules: z.any().optional(),
      destinations: z.any().optional(),
      itineraries: z.any().optional(),
    })
    .passthrough(), // BẬT PASSTHROUGH: Không tự ý xóa bỏ các field khác
);

// 3.3. Schema Tạo riêng Lịch khởi hành
export const createTourSchedulesSchema = z.object({
  tour_id: z.string().regex(/^\d+$/, "tour_id không hợp lệ"),

  schedules: z
    .array(
      z.object({
        departure_date: z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "Ngày khởi hành phải có định dạng YYYY-MM-DD",
          ),

        departure_time: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
            "Giờ khởi hành phải có định dạng HH:mm hoặc HH:mm:ss",
          ),

        return_date: z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "Ngày kết thúc phải có định dạng YYYY-MM-DD",
          )
          .nullable()
          .optional(),

        return_time: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
            "Giờ kết thúc phải có định dạng HH:mm hoặc HH:mm:ss",
          )
          .nullable()
          .optional(),

        total_slots: z.coerce
          .number({ invalid_type_error: "Tổng số chỗ phải là số" })
          .int("Tổng số chỗ phải là số nguyên")
          .positive("Tổng số chỗ phải lớn hơn 0"),

        available_slots: z.coerce
          .number({ invalid_type_error: "Số chỗ còn lại phải là số" })
          .int("Số chỗ còn lại phải là số nguyên")
          .min(0, "Số chỗ còn lại không được nhỏ hơn 0"),

        status: z.enum(["open", "full", "closed"]).default("open").optional(),
      }),
    )
    .min(1, "Phải có ít nhất một lịch khởi hành"),
});
