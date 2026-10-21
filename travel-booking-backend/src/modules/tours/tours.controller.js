import prisma from "../../config/postgres.js";
import fs from "fs";
import path from "path";
import { bigint, date } from "zod";
import { ps } from "zod/locales";
import { createTourService } from "./tours.service.js";

//categories

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const image = req.file?.path || null;

    const category = await prisma.categories.create({
      data: {
        name,
        description,
        image,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Thêm danh mục tour thành công",
      data: {
        ...category,
        id: category.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
// update
export const updateCategory = async (req, res, next) => {
  try {
    const idCategory = BigInt(req.params.id);

    const category = await prisma.categories.findUnique({
      where: {
        id: idCategory,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Loại tour không tồn tại",
      });
    }

    const { name, description, status } = req.body;

    // Giữ ảnh cũ mặc định
    let image = category.image;

    // Nếu có ảnh mới
    if (req.file) {
      image = req.file.path;
    }

    // Cập nhật database trước
    const categoryNew = await prisma.categories.update({
      where: {
        id: idCategory,
      },
      data: {
        name: name ?? category.name,
        description: description ?? category.description,
        image,
        status: status ?? category.status,
      },
    });

    // Database update thành công mới xóa ảnh cũ
    if (req.file && category.image) {
      const oldImagePath = path.resolve(category.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục tour thành công",
      data: {
        ...categoryNew,
        id: categoryNew.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// xem 1 loai tour

export const getOneCategory = async (req, res, next) => {
  try {
    const categoryId = BigInt(req.params.id);

    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        status: "active",
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        status: true,
        deleted_at: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Loại tour không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh mục tour thành công",
      data: {
        ...category,
        id: category.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// lay tat ca

export const getAll = async (req, res, next) => {
  try {
    const categories = await prisma.categories.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        status: true,
        deleted_at: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const categoryNew = categories.map((x) => ({
      ...x,
      id: x.id.toString(),
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách danh mục tour thành công",
      data: categoryNew,
    });
  } catch (error) {
    next(error);
  }
};

// xoa mem

export const deleteCategory = async (req, res, next) => {
  try {
    const idCategory = BigInt(req.params.id);

    const category = await prisma.categories.findUnique({
      where: {
        id: idCategory,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Loại tour không tồn tại",
      });
    }

    const result = await prisma.categories.update({
      where: {
        id: idCategory,
      },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        status: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa danh mục tour thành công",
      data: {
        ...result,
        id: result.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// khoi phuc

export const restoreCategory = async (req, res, next) => {
  try {
    const idCategory = BigInt(req.params.id);
    const category = await prisma.categories.findUnique({
      where: {
        id: idCategory,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Loại tour không tồn tại",
      });
    }
    const result = await prisma.categories.update({
      where: {
        id: idCategory,
      },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        status: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khoi phuc dnah muc danh mục tour thành công",
      data: {
        ...result,
        id: result.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

//////////////////// tao tour-----------------------------------------------------------------------

// 1. Helper serialize BigInt sang String để res.json() không bị lỗi
const serializeBigInt = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
};

// 2. Helper parse an toàn JSON từ FormData
const safeJsonParse = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return Array.isArray(val) ? val : [];
};

// 3. Helper xóa file nếu kiểm tra nghiệp vụ thất bại (tránh rác bộ nhớ)
const cleanupUploadedFiles = (files) => {
  if (!files) return;
  const list = Array.isArray(files) ? files : [files];
  list.forEach((filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => { });
    }
  });
};

// tao moi tour
// Tạo mới tour

export const createTourController = async (req, res, next) => {
  // =====================================================
  // 1. Thu thập file upload để dọn dẹp nếu xảy ra lỗi
  // =====================================================
  const uploadedFiles = [];

  if (req.files?.thumbnail?.length) {
    req.files.thumbnail.forEach((file) => {
      if (file.path) uploadedFiles.push(file.path);
    });
  }

  if (req.files?.tour_images?.length) {
    req.files.tour_images.forEach((file) => {
      if (file.path) uploadedFiles.push(file.path);
    });
  }

  if (req.file?.path) {
    uploadedFiles.push(req.file.path);
  }

  // Loại bỏ đường dẫn trùng lặp
  const uniqueUploadedFiles = [...new Set(uploadedFiles)];

  // =====================================================
  // 2. Hàm trả lỗi và dọn file đã upload
  // =====================================================
  const fail = (statusCode, message) => {
    cleanupUploadedFiles(uniqueUploadedFiles);

    return res.status(statusCode).json({
      success: false,
      message,
    });
  };

  try {
    const {
      operator_id,
      operatorId,
      category_id,
      idCategory,
      name,
      slug,
      description,
      price,
      child_price,
      infant_price,
      duration_days,
      duration_nights,
      max_people,
      difficulty_level,
      transportation,
      status,
      schedules,
      destinations,
      itineraries,
    } = req.body;

    // =====================================================
    // 3. Kiểm tra dữ liệu bắt buộc
    // =====================================================
    const finalOperatorId = operator_id ?? operatorId;
    const finalCategoryId = category_id ?? idCategory;

    if (
      finalOperatorId == null ||
      String(finalOperatorId).trim() === "" ||
      finalCategoryId == null ||
      String(finalCategoryId).trim() === "" ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      price === undefined ||
      price === null ||
      String(price).trim() === ""
    ) {
      return fail(
        400,
        "Vui lòng cung cấp tên tour, slug, giá tour, danh mục và đơn vị tổ chức",
      );
    }

    // =====================================================
    // 4. Chuyển đổi và kiểm tra ID
    // =====================================================
    let operatorBigInt;
    let categoryBigInt;

    try {
      operatorBigInt = BigInt(String(finalOperatorId).trim());
      categoryBigInt = BigInt(String(finalCategoryId).trim());

      if (operatorBigInt <= 0n || categoryBigInt <= 0n) {
        throw new Error("ID phải lớn hơn 0");
      }
    } catch {
      return fail(400, "ID đơn vị tổ chức hoặc danh mục không hợp lệ");
    }

    // =====================================================
    // 5. Kiểm tra đơn vị tổ chức
    // =====================================================
    const operator = await prisma.tour_operators.findFirst({
      where: {
        id: operatorBigInt,
        deleted_at: null,
      },
      select: {
        id: true,
        user_id: true,
        status: true,
      },
    });

    if (!operator) {
      return fail(404, "Đơn vị tổ chức tour không tồn tại");
    }

    if (!operator.user_id) {
      return fail(400, "Đơn vị tổ chức chưa có chủ tài khoản");
    }

    // =====================================================
    // 6. Kiểm tra danh mục
    // =====================================================
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryBigInt,
        deleted_at: null,
        status: "active",
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return fail(404, "Danh mục tour không tồn tại hoặc đã bị vô hiệu hóa");
    }

    // =====================================================
    // 7. Chuẩn hóa tên và slug
    // =====================================================
    const finalName = name.trim();
    const finalSlug = slug.trim();

    // =====================================================
    // 8. Kiểm tra slug trùng
    // =====================================================
    const existingTour = await prisma.tours.findUnique({
      where: {
        slug: finalSlug,
      },
      select: {
        id: true,
      },
    });

    if (existingTour) {
      return fail(409, "Slug tour đã tồn tại, vui lòng chọn slug khác");
    }

    // =====================================================
    // 9. Kiểm tra và chuẩn hóa giá
    // =====================================================
    const adultPrice = Number(price);

    const childPrice =
      child_price !== undefined &&
        child_price !== null &&
        String(child_price).trim() !== ""
        ? Number(child_price)
        : null;

    const infantPrice =
      infant_price !== undefined &&
        infant_price !== null &&
        String(infant_price).trim() !== ""
        ? Number(infant_price)
        : 0;

    if (
      !Number.isFinite(adultPrice) ||
      adultPrice < 0 ||
      (childPrice !== null &&
        (!Number.isFinite(childPrice) || childPrice < 0)) ||
      !Number.isFinite(infantPrice) ||
      infantPrice < 0
    ) {
      return fail(400, "Giá tour và giá vé phải là số hợp lệ, không âm");
    }

    // =====================================================
    // 10. Parse JSON
    // =====================================================
    const parseArray = (value, fieldName) => {
      if (value === undefined || value === null || value === "") {
        return [];
      }

      let parsed = value;

      if (typeof value === "string") {
        try {
          parsed = JSON.parse(value);
        } catch {
          throw new Error(`${fieldName} phải là JSON hợp lệ`);
        }
      }

      if (!Array.isArray(parsed)) {
        throw new Error(`${fieldName} phải là một mảng`);
      }

      return parsed;
    };

    let parsedSchedules;
    let parsedDestinations;
    let parsedItineraries;

    try {
      parsedSchedules = parseArray(schedules, "Lịch khởi hành");
      parsedDestinations = parseArray(destinations, "Điểm đến");
      parsedItineraries = parseArray(itineraries, "Lịch trình");
    } catch (error) {
      return fail(400, error.message);
    }

    // =====================================================
    // 11. Chuẩn hóa thông tin thời lượng và số người
    // =====================================================
    const parsePositiveInteger = (value, fallback, fieldName) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      const number = Number(value);

      if (!Number.isSafeInteger(number) || number < 1) {
        throw new Error(`${fieldName} phải là số nguyên lớn hơn 0`);
      }

      return number;
    };

    let durationDays;
    let durationNights;
    let maxPeople;

    try {
      durationDays = parsePositiveInteger(duration_days, 1, "Số ngày tour");

      durationNights =
        duration_nights === undefined ||
          duration_nights === null ||
          duration_nights === ""
          ? Math.max(durationDays - 1, 0)
          : Number(duration_nights);

      maxPeople = parsePositiveInteger(max_people, 30, "Số lượng khách tối đa");

      if (!Number.isSafeInteger(durationNights) || durationNights < 0) {
        throw new Error("Số đêm tour không hợp lệ");
      }
    } catch (error) {
      return fail(400, error.message);
    }

    // =====================================================
    // 12. Lấy ảnh
    // =====================================================
    const thumbnail = req.files?.thumbnail?.[0]?.path || req.file?.path || null;

    const galleryImages = req.files?.tour_images
      ? req.files.tour_images.map((file) => file.path).filter(Boolean)
      : [];

    // =====================================================
    // 13. Tạo tour thông qua service hiện tại
    // =====================================================
    const result = await createTourService({
      operator_id: operatorBigInt,
      category_id: categoryBigInt,

      name: finalName,
      slug: finalSlug,
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,

      // Giá
      price: adultPrice,
      child_price: childPrice,
      infant_price: infantPrice,

      // Thời lượng
      duration_days: durationDays,
      duration_nights: durationNights,

      // Số lượng
      max_people: maxPeople,

      // Thông tin tour
      difficulty_level: difficulty_level || "Dễ",
      transportation: transportation || "Xe du lịch",
      status: status || "active",

      // Ảnh
      thumbnail,
      galleryImages,

      // Dữ liệu liên kết
      schedules: parsedSchedules,
      destinations: parsedDestinations,
      itineraries: parsedItineraries,
    });

    // =====================================================
    // 14. Đảm bảo ví chủ tour tồn tại
    // =====================================================
    // user_id có unique trong schema wallets.
    // upsert tránh lỗi trùng khi nhiều request đồng thời.
    await prisma.wallets.upsert({
      where: {
        user_id: operator.user_id,
      },
      update: {},
      create: {
        user_id: operator.user_id,
        balance: 0,
      },
    });

    // =====================================================
    // 15. Trả kết quả
    // =====================================================
    return res.status(201).json({
      success: true,
      message: "Tạo tour và lịch trình thành công",
      data: serializeBigInt(result),
    });
  } catch (error) {
    // =====================================================
    // 16. Dọn file nếu xảy ra lỗi
    // =====================================================
    cleanupUploadedFiles(uniqueUploadedFiles);

    return next(error);
  }
};

// get chi tiet tour
// =========================================================================
// 2. LẤY CHI TIẾT TOUR
// =========================================================================

export const getOneTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: null,
      },

      include: {
        // =========================
        // CATEGORY
        // =========================
        category: true,

        // =========================
        // OPERATOR
        // =========================
        operator: {
          select: {
            id: true,
            user_id: true,
            company_name: true,
            phone: true,
            email: true,
          },
        },

        // =========================
        // GALLERY IMAGES
        // =========================
        images: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            sort_order: "asc",
          },
        },

        // =========================
        // TICKET TYPES
        // =========================
        ticket_types: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            price: "asc",
          },
        },

        // =========================
        // PICKUP POINTS
        // =========================
        pickup_points: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            surcharge: "asc",
          },
        },

        // =========================
        // SCHEDULES
        // =========================
        schedules: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            departure_date: "asc",
          },
        },

        // =========================
        // ITINERARIES
        // =========================
        itineraries: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            day_number: "asc",
          },
          include: {
            activities: {
              where: {
                deleted_at: null,
              },
              orderBy: {
                visit_order: "asc",
              },
              include: {
                destination: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    address: true,
                    province: true,
                    latitude: true,
                    longitude: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // =========================
    // KHÔNG TÌM THẤY TOUR
    // =========================
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
      });
    }

    // =====================================================
    // FORMAT DATA
    // =====================================================

    const data = {
      // =========================
      // THÔNG TIN CƠ BẢN
      // =========================
      id: tour.id.toString(),

      operator_id: tour.operator_id.toString(),

      category_id: tour.category_id.toString(),

      name: tour.name,

      slug: tour.slug,

      description: tour.description,

      // =========================
      // LOẠI TOUR
      // =========================
      supported_tour_types: tour.supported_tour_types || [],

      is_customizable: tour.is_customizable,

      min_people: tour.min_people,

      max_people: tour.max_people,

      // =========================
      // GIÁ CƠ BẢN
      // =========================
      base_price: tour.base_price ? tour.base_price.toString() : "0",

      // =========================
      // THỜI GIAN
      // =========================
      duration_days: tour.duration_days,

      duration_nights: tour.duration_nights,

      // =========================
      // THÔNG TIN TOUR
      // =========================
      difficulty_level: tour.difficulty_level,

      transportation: tour.transportation,

      thumbnail: tour.thumbnail,

      status: tour.status,

      // =========================
      // TIMESTAMP
      // =========================
      created_at: tour.created_at,

      updated_at: tour.updated_at,

      deleted_at: tour.deleted_at,

      // =========================
      // CATEGORY
      // =========================
      category: tour.category
        ? {
          id: tour.category.id.toString(),
          name: tour.category.name,
          description: tour.category.description,
          image: tour.category.image,
          status: tour.category.status,
        }
        : null,

      // =========================
      // OPERATOR
      // =========================
      operator: tour.operator
        ? {
          id: tour.operator.id.toString(),

          user_id: tour.operator.user_id
            ? tour.operator.user_id.toString()
            : null,

          company_name: tour.operator.company_name,

          phone: tour.operator.phone,

          email: tour.operator.email,
        }
        : null,

      // =========================
      // GALLERY IMAGES
      // =========================
      gallery_images:
        tour.images?.map((img) => ({
          id: img.id.toString(),
          image_url: img.image_url,
          sort_order: img.sort_order,
        })) || [],

      // =========================
      // TICKET TYPES
      // =========================
      ticket_types:
        tour.ticket_types?.map((ticket) => ({
          id: ticket.id.toString(),

          tour_id: ticket.tour_id.toString(),

          // QUAN TRỌNG:
          // Loại tour mà ticket này áp dụng
          tour_type: ticket.tour_type,

          category: ticket.category,

          name: ticket.name,

          code: ticket.code,

          description: ticket.description,

          price: ticket.price ? ticket.price.toString() : "0",

          total_pax: ticket.total_pax,

          adult_pax: ticket.adult_pax,

          child_pax: ticket.child_pax,

          infant_pax: ticket.infant_pax,

          min_quantity: ticket.min_quantity,

          max_quantity: ticket.max_quantity,

          status: ticket.status,

          created_at: ticket.created_at,

          deleted_at: ticket.deleted_at,
        })) || [],

      // =========================
      // PICKUP POINTS
      // =========================
      pickup_points:
        tour.pickup_points?.map((pickup) => ({
          id: pickup.id.toString(),

          tour_id: pickup.tour_id.toString(),

          name: pickup.name,

          address: pickup.address,

          pickup_time: pickup.pickup_time,

          surcharge: pickup.surcharge ? pickup.surcharge.toString() : "0",

          created_at: pickup.created_at,

          deleted_at: pickup.deleted_at,
        })) || [],

      // =========================
      // LỊCH KHỞI HÀNH
      // =========================
      schedules:
        tour.schedules?.map((schedule) => ({
          id: schedule.id.toString(),

          tour_id: schedule.tour_id.toString(),

          lead_booker_id: schedule.lead_booker_id
            ? schedule.lead_booker_id.toString()
            : null,

          // QUAN TRỌNG:
          // Loại tour mà lịch này áp dụng
          tour_type: schedule.tour_type,

          departure_date: schedule.departure_date,

          departure_time: schedule.departure_time,

          return_date: schedule.return_date,

          return_time: schedule.return_time,

          total_slots: schedule.total_slots,

          available_slots: schedule.available_slots,

          // Không còn min_slots

          is_private: schedule.is_private,

          status: schedule.status,

          created_at: schedule.created_at,

          updated_at: schedule.updated_at,

          deleted_at: schedule.deleted_at,
        })) || [],

      // =========================
      // LỊCH TRÌNH
      // =========================
      itineraries:
        tour.itineraries?.map((itinerary) => ({
          id: itinerary.id.toString(),

          tour_id: itinerary.tour_id.toString(),

          day_number: itinerary.day_number,

          title: itinerary.title,

          description: itinerary.description,

          // =========================
          // HOẠT ĐỘNG
          // =========================
          activities:
            itinerary.activities?.map((activity) => ({
              id: activity.id.toString(),

              itinerary_id: activity.itinerary_id.toString(),

              destination_id: activity.destination_id
                ? activity.destination_id.toString()
                : null,

              start_time: activity.start_time
                ? activity.start_time.toISOString().slice(11, 19)
                : null,

              end_time: activity.end_time
                ? activity.end_time.toISOString().slice(11, 19)
                : null,

              title: activity.title,

              description: activity.description,

              activity_type: activity.activity_type,

              visit_order: activity.visit_order,

              transportation: activity.transportation,

              estimated_cost: activity.estimated_cost
                ? activity.estimated_cost.toString()
                : null,

              note: activity.note,

              // =========================
              // DESTINATION
              // =========================
              destination: activity.destination
                ? {
                  id: activity.destination.id.toString(),

                  name: activity.destination.name,

                  description: activity.destination.description,

                  address: activity.destination.address,

                  province: activity.destination.province,

                  latitude: activity.destination.latitude
                    ? activity.destination.latitude.toString()
                    : null,

                  longitude: activity.destination.longitude
                    ? activity.destination.longitude.toString()
                    : null,

                  image: activity.destination.image,
                }
                : null,
            })) || [],
        })) || [],
    };

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin tour thành công",
      data,
    });
  } catch (error) {
    console.error("GET ONE TOUR ERROR:", error);
    next(error);
  }
};

// =========================================================================
// 3. LẤY DANH SÁCH TẤT CẢ TOUR
// =========================================================================

export const getAllTour = async (req, res, next) => {
  try {
    // =====================================================
    // KIỂM TRA ROLE NGƯỜI DÙNG
    // =====================================================

    const idUser = BigInt(req.user.id);

    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: idUser,
        deleted_at: null,
      },

      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const roleName = userRole?.role?.name;

    // Chỉ cho phép 3 role
    if (
      roleName !== "ADMIN" &&
      roleName !== "STAFF" &&
      roleName !== "TOUR_OPERATOR_OWNER"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền quản lý tour",
      });
    }

    // =====================================================
    // ĐIỀU KIỆN LẤY TOUR
    // =====================================================

    let where = {
      deleted_at: null,
    };

    // =====================================================
    // ADMIN + STAFF
    // =====================================================

    if (roleName === "ADMIN" || roleName === "STAFF") {
      where = {
        deleted_at: null,
      };
    }

    // =====================================================
    // TOUR OPERATOR OWNER
    // =====================================================

    if (roleName === "TOUR_OPERATOR_OWNER") {
      where = {
        deleted_at: null,

        operator: {
          user_id: idUser,
          deleted_at: null,
        },
      };
    }

    // =====================================================
    // LẤY DANH SÁCH TOUR
    // =====================================================

    const toursResult = await prisma.tours.findMany({
      where,

      include: {
        // =========================
        // CATEGORY
        // =========================
        category: {
          select: {
            id: true,
            name: true,
          },
        },

        // =========================
        // OPERATOR
        // =========================
        operator: {
          select: {
            id: true,
            company_name: true,
            phone: true,
            email: true,
          },
        },

        // =========================
        // TICKET TYPES
        // =========================
        ticket_types: {
          where: {
            deleted_at: null,
          },

          orderBy: {
            price: "asc",
          },
        },

        // =========================
        // PICKUP POINTS
        // =========================
        pickup_points: {
          where: {
            deleted_at: null,
          },

          orderBy: {
            surcharge: "asc",
          },
        },

        // =========================
        // SCHEDULES
        // =========================
        schedules: {
          where: {
            deleted_at: null,
          },

          orderBy: {
            departure_date: "asc",
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    // =====================================================
    // FORMAT DATA
    // =====================================================

    const tours = toursResult.map((tour) => ({
      id: tour.id.toString(),

      operator_id: tour.operator_id.toString(),

      category_id: tour.category_id.toString(),

      name: tour.name,

      slug: tour.slug,

      description: tour.description,

      supported_tour_types: tour.supported_tour_types || [],

      is_customizable: tour.is_customizable,

      min_people: tour.min_people,

      max_people: tour.max_people,

      base_price: tour.base_price ? tour.base_price.toString() : "0",

      duration_days: tour.duration_days,

      duration_nights: tour.duration_nights,

      difficulty_level: tour.difficulty_level,

      transportation: tour.transportation,

      thumbnail: tour.thumbnail,

      status: tour.status,

      created_at: tour.created_at,

      updated_at: tour.updated_at,

      deleted_at: tour.deleted_at,

      category: tour.category
        ? {
          id: tour.category.id.toString(),
          name: tour.category.name,
        }
        : null,

      operator: tour.operator
        ? {
          id: tour.operator.id.toString(),
          company_name: tour.operator.company_name,
          phone: tour.operator.phone,
          email: tour.operator.email,
        }
        : null,

      ticket_types:
        tour.ticket_types?.map((ticket) => ({
          id: ticket.id.toString(),

          tour_id: ticket.tour_id.toString(),

          tour_type: ticket.tour_type,

          category: ticket.category,

          name: ticket.name,

          code: ticket.code,

          description: ticket.description,

          price: ticket.price ? ticket.price.toString() : "0",

          total_pax: ticket.total_pax,

          adult_pax: ticket.adult_pax,

          child_pax: ticket.child_pax,

          infant_pax: ticket.infant_pax,

          min_quantity: ticket.min_quantity,

          max_quantity: ticket.max_quantity,

          status: ticket.status,

          created_at: ticket.created_at,

          deleted_at: ticket.deleted_at,
        })) || [],

      pickup_points:
        tour.pickup_points?.map((pickup) => ({
          id: pickup.id.toString(),

          tour_id: pickup.tour_id.toString(),

          name: pickup.name,

          address: pickup.address,

          pickup_time: pickup.pickup_time,

          surcharge: pickup.surcharge ? pickup.surcharge.toString() : "0",

          created_at: pickup.created_at,

          deleted_at: pickup.deleted_at,
        })) || [],

      schedules:
        tour.schedules?.map((schedule) => ({
          id: schedule.id.toString(),

          tour_id: schedule.tour_id.toString(),

          lead_booker_id: schedule.lead_booker_id
            ? schedule.lead_booker_id.toString()
            : null,

          tour_type: schedule.tour_type,

          departure_date: schedule.departure_date,

          departure_time: schedule.departure_time,

          return_date: schedule.return_date,

          return_time: schedule.return_time,

          total_slots: schedule.total_slots,

          available_slots: schedule.available_slots,

          is_private: schedule.is_private,

          status: schedule.status,

          created_at: schedule.created_at,

          updated_at: schedule.updated_at,

          deleted_at: schedule.deleted_at,
        })) || [],
    }));

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      count: tours.length,
      tours,
    });
  } catch (error) {
    console.error("GET ALL TOUR ERROR:", error);
    next(error);
  }
};

// =========================================================================
// 4. LẤY DANH SÁCH TẤT CẢ TOUR PUBLIC
// =========================================================================

export const getAllTourPublic = async (req, res, next) => {
  try {
    const toursResult = await prisma.tours.findMany({
      where: {
        deleted_at: null,
      },

      include: {
        // =========================
        // CATEGORY
        // =========================
        category: {
          select: {
            id: true,
            name: true,
          },
        },

        // =========================
        // OPERATOR
        // =========================
        operator: {
          select: {
            id: true,
            company_name: true,
            phone: true,
            email: true,
          },
        },

        // =========================
        // TICKET TYPES
        // =========================
        ticket_types: {
          where: {
            deleted_at: null,
          },

          orderBy: {
            price: "asc",
          },
        },

        // =========================
        // PICKUP POINTS
        // =========================
        pickup_points: {
          where: {
            deleted_at: null,
          },

          orderBy: {
            surcharge: "asc",
          },
        },

        // =========================
        // SCHEDULES
        // =========================
        schedules: {
          where: {
            deleted_at: null,
          },

          orderBy: {
            departure_date: "asc",
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    // =====================================================
    // FORMAT DATA
    // =====================================================

    const tours = toursResult.map((tour) => ({
      id: tour.id.toString(),

      operator_id: tour.operator_id.toString(),

      category_id: tour.category_id.toString(),

      name: tour.name,

      slug: tour.slug,

      description: tour.description,

      supported_tour_types: tour.supported_tour_types || [],

      is_customizable: tour.is_customizable,

      min_people: tour.min_people,

      max_people: tour.max_people,

      base_price: tour.base_price ? tour.base_price.toString() : "0",

      duration_days: tour.duration_days,

      duration_nights: tour.duration_nights,

      difficulty_level: tour.difficulty_level,

      transportation: tour.transportation,

      thumbnail: tour.thumbnail,

      status: tour.status,

      created_at: tour.created_at,

      updated_at: tour.updated_at,

      deleted_at: tour.deleted_at,

      category: tour.category
        ? {
          id: tour.category.id.toString(),
          name: tour.category.name,
        }
        : null,

      operator: tour.operator
        ? {
          id: tour.operator.id.toString(),
          company_name: tour.operator.company_name,
          phone: tour.operator.phone,
          email: tour.operator.email,
        }
        : null,

      ticket_types:
        tour.ticket_types?.map((ticket) => ({
          id: ticket.id.toString(),

          tour_id: ticket.tour_id.toString(),

          tour_type: ticket.tour_type,

          category: ticket.category,

          name: ticket.name,

          code: ticket.code,

          description: ticket.description,

          price: ticket.price ? ticket.price.toString() : "0",

          total_pax: ticket.total_pax,

          adult_pax: ticket.adult_pax,

          child_pax: ticket.child_pax,

          infant_pax: ticket.infant_pax,

          min_quantity: ticket.min_quantity,

          max_quantity: ticket.max_quantity,

          status: ticket.status,

          created_at: ticket.created_at,

          deleted_at: ticket.deleted_at,
        })) || [],

      pickup_points:
        tour.pickup_points?.map((pickup) => ({
          id: pickup.id.toString(),

          tour_id: pickup.tour_id.toString(),

          name: pickup.name,

          address: pickup.address,

          pickup_time: pickup.pickup_time,

          surcharge: pickup.surcharge ? pickup.surcharge.toString() : "0",

          created_at: pickup.created_at,

          deleted_at: pickup.deleted_at,
        })) || [],

      schedules:
        tour.schedules?.map((schedule) => ({
          id: schedule.id.toString(),

          tour_id: schedule.tour_id.toString(),

          lead_booker_id: schedule.lead_booker_id
            ? schedule.lead_booker_id.toString()
            : null,

          tour_type: schedule.tour_type,

          departure_date: schedule.departure_date,

          departure_time: schedule.departure_time,

          return_date: schedule.return_date,

          return_time: schedule.return_time,

          total_slots: schedule.total_slots,

          available_slots: schedule.available_slots,

          is_private: schedule.is_private,

          status: schedule.status,

          created_at: schedule.created_at,

          updated_at: schedule.updated_at,

          deleted_at: schedule.deleted_at,
        })) || [],
    }));

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      count: tours.length,
      tours,
    });
  } catch (error) {
    console.error("GET ALL TOUR PUBLIC ERROR:", error);
    next(error);
  }
};

// Helper chuẩn hóa mọi định dạng giờ thành Date UTC hợp lệ cho PostgreSQL @db.Time
const parseTimeStringToDate = (timeInput, defaultTime = null) => {
  if (!timeInput || timeInput === "" || timeInput === "null") {
    if (!defaultTime) return null;
    timeInput = defaultTime;
  }

  // 1. Nếu đã là Date object hợp lệ
  if (timeInput instanceof Date && !isNaN(timeInput.getTime())) {
    return timeInput;
  }

  const str = timeInput.toString().trim();
  if (!str) return null;

  // 2. Nếu là chuỗi ISO chứa chữ 'T' (VD: "1970-01-01T08:00:00.000Z")
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Tách lấy phần giờ phút
  const timePart = str.includes(" ") ? str.split(" ")[1] : str;
  const parts = timePart.split(":");

  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);
  let seconds = parts[2] ? parseInt(parts[2], 10) : 0;

  // Nếu parse lỗi: kiểm tra defaultTime có tồn tại và hợp lệ không
  if (isNaN(hours) || isNaN(minutes)) {
    if (!defaultTime) return null;
    const defParts = defaultTime.toString().split(":");
    hours = parseInt(defParts[0], 10) || 0;
    minutes = parseInt(defParts[1], 10) || 0;
    seconds = 0;
  }

  const date = new Date(1970, 0, 1);
  date.setUTCHours(hours, minutes, seconds, 0);
  return date;
};

export const updateTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    // 1. Kiểm tra tour có tồn tại không
    const existingTour = await prisma.tours.findUnique({
      where: { id: idTour },
      include: {
        images: true,
      },
    });

    if (!existingTour || existingTour.deleted_at) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại hoặc đã bị xóa",
      });
    }

    const {
      name,
      slug,
      category_id,
      operator_id,
      price,
      child_price,
      infant_price,
      duration_days,
      duration_nights,
      max_people,
      difficulty_level,
      transportation,
      description,
      status,
      schedules,
      destinations,
      itineraries,
    } = req.body;

    // 2. Xử lý ảnh đại diện (Thumbnail): Giữ nguyên ảnh cũ nếu không có file mới
    let finalThumbnail = existingTour.thumbnail;
    const uploadedThumbnail = req.files?.thumbnail?.[0]?.path || req.file?.path;

    if (uploadedThumbnail) {
      finalThumbnail = uploadedThumbnail;

      // Xóa file ảnh cũ nếu tồn tại
      if (existingTour.thumbnail) {
        const oldThumbnailPath = path.resolve(existingTour.thumbnail);
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
    }

    // 3. Xử lý biểu giá 3 loại vé theo Prisma Schema
    const adultPrice =
      price !== undefined ? Number(price) : Number(existingTour.price);

    const parsedChildPrice =
      child_price !== undefined && child_price !== null && child_price !== ""
        ? Number(child_price)
        : child_price === ""
          ? null
          : existingTour.child_price;

    const parsedInfantPrice =
      infant_price !== undefined && infant_price !== null && infant_price !== ""
        ? Number(infant_price)
        : existingTour.infant_price || 0;

    // 4. Parse dữ liệu mảng
    const parsedSchedules = safeJsonParse(schedules);
    const parsedDestinations = safeJsonParse(destinations);
    const parsedItineraries = safeJsonParse(itineraries);

    // 5. Cập nhật dữ liệu trong Transaction
    const updatedTour = await prisma.$transaction(async (tx) => {
      // 5.1. Cập nhật bảng tours chính
      const tour = await tx.tours.update({
        where: { id: idTour },
        data: {
          name: name ? name.trim() : existingTour.name,
          slug: slug ? slug.trim() : existingTour.slug,
          category_id: category_id
            ? BigInt(category_id)
            : existingTour.category_id,
          operator_id: operator_id
            ? BigInt(operator_id)
            : existingTour.operator_id,
          price: adultPrice,
          child_price: parsedChildPrice,
          infant_price: parsedInfantPrice,
          duration_days:
            duration_days !== undefined
              ? Number(duration_days)
              : existingTour.duration_days,
          duration_nights:
            duration_nights !== undefined
              ? Number(duration_nights)
              : existingTour.duration_nights,
          max_people:
            max_people !== undefined
              ? Number(max_people)
              : existingTour.max_people,
          difficulty_level: difficulty_level || existingTour.difficulty_level,
          transportation: transportation || existingTour.transportation,
          description:
            description !== undefined ? description : existingTour.description,
          status: status || existingTour.status,
          thumbnail: finalThumbnail,
        },
      });

      // 5.2. Thêm ảnh gallery mới nếu có upload
      if (req.files?.tour_images && req.files.tour_images.length > 0) {
        const newImages = req.files.tour_images.map((f, index) => ({
          tour_id: idTour,
          image_url: f.path,
          sort_order: index,
        }));
        await tx.tour_images.createMany({
          data: newImages,
        });
      }

      // 5.3. Cập nhật tour_schedules
      if (Array.isArray(parsedSchedules) && parsedSchedules.length > 0) {
        for (const s of parsedSchedules) {
          const depTime = parseTimeStringToDate(s.departure_time, "08:00:00");
          const retTime = s.return_time
            ? parseTimeStringToDate(s.return_time, null)
            : null;
          const newTotalSlots = Number(s.total_slots) || 30;

          if (s.id) {
            // 1. Lấy thông tin đợt cũ từ DB để tính số chỗ khách ĐÃ ĐẶT
            const oldSchedule = await tx.tour_schedules.findUnique({
              where: { id: BigInt(s.id) },
            });

            let calculatedAvailableSlots = newTotalSlots;

            if (oldSchedule) {
              // Số chỗ đã đặt = tổng cũ - còn trống cũ
              const bookedSlots = Math.max(
                0,
                oldSchedule.total_slots - oldSchedule.available_slots,
              );
              // Chỗ còn trống mới = tổng mới - số chỗ đã đặt (không để âm)
              calculatedAvailableSlots = Math.max(
                0,
                newTotalSlots - bookedSlots,
              );
            }

            // 2. Cập nhật cả total_slots lẫn available_slots
            await tx.tour_schedules.update({
              where: { id: BigInt(s.id) },
              data: {
                departure_date: new Date(s.departure_date),
                departure_time: depTime,
                return_date: s.return_date ? new Date(s.return_date) : null,
                return_time: retTime,
                total_slots: newTotalSlots,
                available_slots: calculatedAvailableSlots, // 👈 ĐÃ ĐƯỢC TÍNH VÀ CẬP NHẬT TỰ ĐỘNG
                status:
                  calculatedAvailableSlots === 0 ? "full" : s.status || "open",
              },
            });
          } else if (s.departure_date) {
            // Đợt khởi hành tạo mới hoàn toàn
            await tx.tour_schedules.create({
              data: {
                tour_id: idTour,
                departure_date: new Date(s.departure_date),
                departure_time: depTime,
                return_date: s.return_date ? new Date(s.return_date) : null,
                return_time: retTime,
                total_slots: newTotalSlots,
                available_slots: newTotalSlots, // Mới tạo thì còn trống = tổng chỗ
                status: s.status || "open",
              },
            });
          }
        }
      }

      // 5.4. Đồng bộ tour_destinations
      if (Array.isArray(parsedDestinations) && parsedDestinations.length > 0) {
        await tx.tour_destinations.deleteMany({
          where: { tour_id: idTour },
        });

        await tx.tour_destinations.createMany({
          data: parsedDestinations.map((d) => ({
            tour_id: idTour,
            destination_id: BigInt(d.destination_id),
            day_number: Number(d.day_number) || 1,
            visit_order: Number(d.visit_order) || 1,
          })),
        });
      }

      // 5.5. Cập nhật tour_itineraries & activities (Đã sửa triệt để parse giờ)
      if (Array.isArray(parsedItineraries) && parsedItineraries.length > 0) {
        const oldItineraries = await tx.tour_itineraries.findMany({
          where: { tour_id: idTour },
          select: { id: true },
        });
        const oldIds = oldItineraries.map((it) => it.id);

        if (oldIds.length > 0) {
          await tx.itinerary_activities.deleteMany({
            where: { itinerary_id: { in: oldIds } },
          });
          await tx.tour_itineraries.deleteMany({
            where: { tour_id: idTour },
          });
        }

        for (const it of parsedItineraries) {
          const createdItinerary = await tx.tour_itineraries.create({
            data: {
              tour_id: idTour,
              day_number: Number(it.day_number),
              title: it.title,
              description: it.description || null,
            },
          });

          if (Array.isArray(it.activities) && it.activities.length > 0) {
            await tx.itinerary_activities.createMany({
              data: it.activities.map((act) => ({
                itinerary_id: createdItinerary.id,
                destination_id: act.destination_id
                  ? BigInt(act.destination_id)
                  : null,
                start_time: parseTimeStringToDate(act.start_time), // SỬA: Dùng helper an toàn
                end_time: parseTimeStringToDate(act.end_time), // SỬA: Dùng helper an toàn
                title: act.title,
                activity_type: act.activity_type || null,
                visit_order: Number(act.visit_order) || 1,
                transportation: act.transportation || null,
                estimated_cost: Number(act.estimated_cost) || 0,
                note: act.note || null,
              })),
            });
          }
        }
      }

      return tour;
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật tour thành công",
      data: {
        ...updatedTour,
        id: updatedTour.id.toString(),
        operator_id: updatedTour.operator_id.toString(),
        category_id: updatedTour.category_id.toString(),
        price: updatedTour.price.toString(),
        child_price: updatedTour.child_price
          ? updatedTour.child_price.toString()
          : null,
        infant_price: updatedTour.infant_price
          ? updatedTour.infant_price.toString()
          : "0",
      },
    });
  } catch (error) {
    next(error);
  }
};

// inactive
export const updateInactive = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    const { status } = req.body;

    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour này không tồn tại",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status chỉ được là active hoặc inactive",
      });
    }

    const result = await prisma.tours.update({
      where: {
        id: tour.id,
      },
      data: {
        status: status,
      },
      select: {
        id: true,
        operator_id: true,
        category_id: true,
        name: true,
        slug: true,
        status: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        status === "inactive"
          ? "Vô hiệu hóa tour thành công"
          : "Kích hoạt tour thành công",
      data: {
        ...result,
        id: result.id.toString(),
        operator_id: result.operator_id.toString(),
        category_id: result.category_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// xoa mem

export const softDeleteTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    // Kiểm tra tour tồn tại và chưa bị xóa
    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour này không tồn tại",
      });
    }

    // Xóa mềm
    const result = await prisma.tours.update({
      where: {
        id: tour.id,
      },
      data: {
        deleted_at: new Date(),
        status: "inactive",
      },
      select: {
        id: true,
        operator_id: true,
        category_id: true,
        name: true,
        slug: true,
        status: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa tour thành công",
      data: {
        ...result,
        id: result.id.toString(),
        operator_id: result.operator_id.toString(),
        category_id: result.category_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// khoi phuc
export const restoreTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    // Tìm tour đã bị xóa mềm
    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: {
          not: null,
        },
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại hoặc chưa bị xóa",
      });
    }

    // Khôi phục tour
    const result = await prisma.tours.update({
      where: {
        id: tour.id,
      },
      data: {
        deleted_at: null,
        status: "active",
      },
      select: {
        id: true,
        operator_id: true,
        category_id: true,
        name: true,
        slug: true,
        status: true,
        deleted_at: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục tour thành công",
      data: {
        ...result,
        id: result.id.toString(),
        operator_id: result.operator_id.toString(),
        category_id: result.category_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// tour_images

export const createTourImages = async (req, res, next) => {
  try {
    const { tour_id } = req.body;

    // Kiểm tra ảnh
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một ảnh",
      });
    }

    // Kiểm tra tour
    const tour = await prisma.tours.findFirst({
      where: {
        id: BigInt(tour_id),
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại hoặc đã bị xóa",
      });
    }

    // Tạo nhiều ảnh
    const data = req.files.map((file, index) => ({
      tour_id: tour.id,
      image_url: file.path,
      sort_order: index + 1,
    }));

    const result = await prisma.tour_images.createMany({
      data,
    });

    return res.status(201).json({
      success: true,
      message: `Đã thêm ${result.count} ảnh cho tour`,
      data: {
        count: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// update anh tour imgs

export const updateImgsTour = async (req, res, next) => {
  try {
    const tourId = BigInt(req.params.tourId);
    const tour = await prisma.tours.findFirst({
      where: {
        id: tourId,
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một ảnh",
      });
    }
    const oldImages = await prisma.tour_images.findMany({
      where: {
        tour_id: tourId,
      },
    });
    for (const oldImage of oldImages) {
      if (oldImage.image_url) {
        const oldPath = path.resolve(oldImage.image_url);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }
    await prisma.tour_images.deleteMany({
      where: {
        tour_id: tourId,
      },
    });
    const data = req.files.map((file, index) => ({
      tour_id: tourId,
      image_url: file.path,
      sort_order: index + 1,
    }));
    await prisma.tour_images.createMany({
      data,
    });
    // Lấy lại danh sách ảnh
    const images = await prisma.tour_images.findMany({
      where: {
        tour_id: tourId,
      },
      orderBy: {
        sort_order: "asc",
      },
      select: {
        id: true,
        tour_id: true,
        image_url: true,
        sort_order: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật danh sách ảnh tour thành công",
      data: images.map((image) => ({
        ...image,
        id: image.id.toString(),
        tour_id: image.tour_id.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/// lay tat anh thuoc tour do
export const getAllImgSTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    // Kiểm tra tour
    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    // Lấy tất cả ảnh của tour
    const result = await prisma.tour_images.findMany({
      where: {
        tour_id: idTour,
      },
      select: {
        id: true,
        tour_id: true,
        image_url: true,
        sort_order: true,
      },
      orderBy: {
        sort_order: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy tất cả ảnh của tour thành công",
      data: result.map((image) => ({
        ...image,
        id: image.id.toString(),
        tour_id: image.tour_id.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Xóa 1 ảnh tour (hard delete)
export const deleteImgTour = async (req, res, next) => {
  try {
    const idImg = BigInt(req.params.id);

    // Tìm ảnh trong bảng tour_images
    const img = await prisma.tour_images.findUnique({
      where: {
        id: idImg,
      },
    });

    if (!img) {
      return res.status(404).json({
        success: false,
        message: "Ảnh tour không tồn tại",
      });
    }

    const imgUrl = img.image_url;

    // Xóa file vật lý
    if (imgUrl) {
      const oldPath = path.resolve(imgUrl);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await prisma.tour_images.delete({
      where: {
        id: idImg,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa ảnh tour thành công",
    });
  } catch (error) {
    next(error);
  }
};

// tour_schedules --> lich trinh khoi hanh

// tao lich trinh
export const createTourSchedules = async (req, res, next) => {
  try {
    const { tour_id, schedules } = req.body;

    // Kiểm tra tour
    const tour = await prisma.tours.findFirst({
      where: {
        id: BigInt(tour_id),
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách lịch không được để trống",
      });
    }

    const data = schedules.map((item) => ({
      tour_id: tour.id,

      departure_date: new Date(`${item.departure_date}T00:00:00`),

      departure_time: new Date(`1970-01-01T${item.departure_time}:00`),

      return_date: item.return_date
        ? new Date(`${item.return_date}T00:00:00`)
        : null,

      return_time: item.return_time
        ? new Date(`1970-01-01T${item.return_time}:00`)
        : null,

      total_slots: Number(item.total_slots),

      available_slots: Number(item.available_slots),
    }));

    const result = await prisma.tour_schedules.createMany({
      data: data,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo lịch khởi hành thành công",
      data: {
        count: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all lich theo tour
export const getAllSchedules = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    // Kiểm tra tour
    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    // Lấy tất cả lịch của tour
    const result = await prisma.tour_schedules.findMany({
      where: {
        tour_id: tour.id,
        deleted_at: null,
      },
      orderBy: {
        departure_date: "asc",
      },
    });

    // Chuyển BigInt thành string
    const tourSchedules = result.map((x) => ({
      ...x,
      id: x.id.toString(),
      tour_id: x.tour_id.toString(),
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy lịch trình thành công",
      data: tourSchedules,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật nhiều lịch khởi hành cùng lúc
export const updateSchedules = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    const { schedules } = req.body;

    const tour = await prisma.tours.findFirst({
      where: {
        id: idTour,
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách lịch không được để trống",
      });
    }

    // 3. Kiểm tra từng lịch trước khi update
    for (const item of schedules) {
      if (!item.id) {
        return res.status(400).json({
          success: false,
          message: "Mỗi lịch phải có id",
        });
      }

      const schedule = await prisma.tour_schedules.findFirst({
        where: {
          id: BigInt(item.id),
          tour_id: idTour,
          deleted_at: null,
        },
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: `Lịch có id ${item.id} không tồn tại trong tour này`,
        });
      }

      const totalSlots =
        item.total_slots !== undefined
          ? Number(item.total_slots)
          : schedule.total_slots;

      const availableSlots =
        item.available_slots !== undefined
          ? Number(item.available_slots)
          : schedule.available_slots;

      if (totalSlots <= 0) {
        return res.status(400).json({
          success: false,
          message: `Lịch ${item.id}: tổng số chỗ phải lớn hơn 0`,
        });
      }

      if (availableSlots < 0 || availableSlots > totalSlots) {
        return res.status(400).json({
          success: false,
          message: `Lịch ${item.id}: số chỗ còn lại không hợp lệ`,
        });
      }
    }

    const results = await prisma.$transaction(
      schedules.map((item) =>
        prisma.tour_schedules.update({
          where: {
            id: BigInt(item.id),
          },
          data: {
            departure_date: item.departure_date
              ? new Date(`${item.departure_date}T00:00:00`)
              : undefined,

            departure_time: item.departure_time
              ? new Date(`1970-01-01T${item.departure_time}:00`)
              : undefined,

            return_date:
              item.return_date !== undefined
                ? item.return_date
                  ? new Date(`${item.return_date}T00:00:00`)
                  : null
                : undefined,

            return_time:
              item.return_time !== undefined
                ? item.return_time
                  ? new Date(`1970-01-01T${item.return_time}:00`)
                  : null
                : undefined,

            total_slots:
              item.total_slots !== undefined
                ? Number(item.total_slots)
                : undefined,

            available_slots:
              item.available_slots !== undefined
                ? Number(item.available_slots)
                : undefined,

            status: item.status !== undefined ? item.status : undefined,
          },
        }),
      ),
    );

    // 5. Convert BigInt
    const data = results.map((item) => ({
      ...item,
      id: item.id.toString(),
      tour_id: item.tour_id.toString(),
    }));

    return res.status(200).json({
      success: true,
      message: "Cập nhật các lịch khởi hành thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// cap nhat lich dong mo cua

export const updateScheduleStatus = async (req, res, next) => {
  try {
    const idSchedule = BigInt(req.params.id);

    const { status } = req.body;
    const schedule = await prisma.tour_schedules.findFirst({
      where: {
        id: idSchedule,
        deleted_at: null,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Lịch khởi hành không tồn tại",
      });
    }

    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái chỉ được là open hoặc closed",
      });
    }

    // Cập nhật trạng thái
    const result = await prisma.tour_schedules.update({
      where: {
        id: idSchedule,
      },
      data: {
        status: status,
      },
      select: {
        id: true,
        tour_id: true,
        departure_date: true,
        departure_time: true,
        return_date: true,
        return_time: true,
        total_slots: true,
        available_slots: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        status === "open" ? "Đã mở lịch khởi hành" : "Đã đóng lịch khởi hành",
      data: {
        ...result,
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết một lịch khởi hành theo lich trinn
export const getDetailSchedule = async (req, res, next) => {
  try {
    const idSchedule = BigInt(req.params.id);

    const schedule = await prisma.tour_schedules.findFirst({
      where: {
        id: idSchedule,
        status: "open",
        deleted_at: null,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Lịch khởi hành không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết lịch khởi hành thành công",
      data: {
        id: schedule.id.toString(),
        tour_id: schedule.tour_id.toString(),

        departure_date: schedule.departure_date,
        departure_time: schedule.departure_time,

        return_date: schedule.return_date,
        return_time: schedule.return_time,

        total_slots: schedule.total_slots,
        available_slots: schedule.available_slots,

        status: schedule.status,

        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả lịch khởi hành của một tour theo tour id
export const getSchedulesByTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    const schedules = await prisma.tour_schedules.findMany({
      where: {
        tour_id: idTour,
        status: "open",
        deleted_at: null,
      },
      orderBy: {
        departure_date: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy lịch khởi hành của tour thành công",
      data: schedules.map((schedule) => ({
        id: schedule.id.toString(),
        tour_id: schedule.tour_id.toString(),
        departure_date: schedule.departure_date,
        departure_time: schedule.departure_time,
        return_date: schedule.return_date,
        return_time: schedule.return_time,
        total_slots: schedule.total_slots,
        available_slots: schedule.available_slots,
        status: schedule.status,
        tour_type: schedule.tour_type,
      })),
    });
  } catch (error) {
    next(error);
  }
};
// Soft Delete lịch khởi hành
export const softDeleteSchedule = async (req, res, next) => {
  try {
    const idSchedule = BigInt(req.params.id);

    // Kiểm tra lịch tồn tại và chưa bị xóa
    const schedule = await prisma.tour_schedules.findFirst({
      where: {
        id: idSchedule,
        deleted_at: null,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Lịch khởi hành không tồn tại hoặc đã bị xóa",
      });
    }

    // Soft delete
    const result = await prisma.tour_schedules.update({
      where: {
        id: schedule.id,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa lịch khởi hành thành công",
      data: {
        ...result,
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Khôi phục lịch khởi hành
export const restoreSchedule = async (req, res, next) => {
  try {
    const idSchedule = BigInt(req.params.id);

    // Chỉ tìm lịch đã bị xóa
    const schedule = await prisma.tour_schedules.findFirst({
      where: {
        id: idSchedule,
        deleted_at: {
          not: null,
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Lịch khởi hành không tồn tại hoặc chưa bị xóa",
      });
    }

    // Khôi phục
    const result = await prisma.tour_schedules.update({
      where: {
        id: schedule.id,
      },
      data: {
        deleted_at: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục lịch khởi hành thành công",
      data: {
        ...result,
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả lịch khởi hành đã bị xóa mềm
export const getDeletedSchedules = async (req, res, next) => {
  try {
    const result = await prisma.tour_schedules.findMany({
      where: {
        deleted_at: {
          not: null,
        },
      },
      orderBy: {
        deleted_at: "desc",
      },
    });

    const schedules = result.map((x) => ({
      ...x,
      id: x.id.toString(),
      tour_id: x.tour_id.toString(),
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách lịch khởi hành đã xóa thành công",
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// Xóa cứng lịch khởi hành
export const hardDeleteSchedule = async (req, res, next) => {
  try {
    const idSchedule = BigInt(req.params.id);

    // Kiểm tra lịch
    const schedule = await prisma.tour_schedules.findUnique({
      where: {
        id: idSchedule,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Lịch khởi hành không tồn tại",
      });
    }

    // Xóa cứng
    const result = await prisma.tour_schedules.delete({
      where: {
        id: idSchedule,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa cứng lịch khởi hành thành công",
      data: {
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllItineraries = async (req, res, next) => {
  try {
    const { tourId } = req.params;

    // Điều kiện lọc linh hoạt: có tour_id thì lọc, không thì lấy hết
    const whereClause = {
      deleted_at: null,
      tour: {
        deleted_at: null, // Bỏ qua tour đã bị xóa mềm
      },
    };

    if (tourId && !isNaN(Number(tourId))) {
      whereClause.tour_id = BigInt(tourId);
    }

    const result = await prisma.tour_itineraries.findMany({
      where: whereClause,
      include: {
        // Thông tin tóm tắt của tour chứa ngày này
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
            duration_days: true,
            duration_nights: true,
            price: item.tour.price ? Number(item.tour.price.toString()) : 0,
          },
        },
        // Danh sách hoạt động trong ngày
        activities: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            visit_order: "asc",
          },
          include: {
            destination: {
              select: {
                id: true,
                name: true,
                province: true,
              },
            },
          },
        },
      },
      orderBy: [{ tour_id: "asc" }, { day_number: "asc" }],
    });

    // Định dạng lại dữ liệu trả về cho frontend
    const data = result.map((item) => ({
      id: item.id.toString(),
      tour_id: item.tour_id.toString(),
      day_number: item.day_number,
      title: item.title,
      description: item.description,

      // Thông tin tour kèm theo
      tour: item.tour
        ? {
          id: item.tour.id.toString(),
          name: item.tour.name,
          slug: item.tour.slug,
          duration_days: item.tour.duration_days,
          duration_nights: item.tour.duration_nights,
          price: item.tour.price ? Number(item.tour.price.toString()) : 0,
        }
        : null,

      // Danh sách hoạt động chi tiết
      activities: item.activities.map((activity) => ({
        id: activity.id.toString(),
        itinerary_id: activity.itinerary_id?.toString() ?? null,
        destination_id: activity.destination_id?.toString() ?? null,
        title: activity.title,
        description: activity.description,
        start_time: activity.start_time,
        end_time: activity.end_time,
        activity_type: activity.activity_type,
        visit_order: activity.visit_order,
        transportation: activity.transportation,
        estimated_cost: activity.estimated_cost
          ? Number(activity.estimated_cost.toString())
          : 0,
        note: activity.note,

        destination: activity.destination
          ? {
            id: activity.destination.id.toString(),
            name: activity.destination.name,
            province: activity.destination.province,
          }
          : null,
      })),
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy tất cả lịch trình thành công",
      total: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};




/// nhận yêu cầu tour đoàn

export const reqTourDoan = async (req, res) => {
  try {
    const {
      tour_id,
      company_name,
      contact_name,
      contact_phone,
      contact_email,
      estimated_pax,
      departure_date,
      duration_days,
      budget_per_pax,
      special_requirements,
    } = req.body;

    // Lấy ID người dùng đã đăng nhập
    const user_id = req.user?.id;

    // Kiểm tra đăng nhập
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để gửi yêu cầu tour đoàn.",
      });
    }

    // Kiểm tra thông tin bắt buộc
    if (
      !contact_name ||
      !contact_phone ||
      !contact_email ||
      estimated_pax == null ||
      !departure_date
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin bắt buộc.",
      });
    }

    // Kiểm tra số lượng người
    const soNguoi = Number(estimated_pax);

    if (!Number.isInteger(soNguoi) || soNguoi < 1) {
      return res.status(400).json({
        success: false,
        message: "Số người tham gia phải là số nguyên lớn hơn 0.",
      });
    }

    // Kiểm tra ngày khởi hành
    const ngayKhoiHanh = new Date(departure_date);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(departure_date) ||
      Number.isNaN(ngayKhoiHanh.getTime()) ||
      ngayKhoiHanh.toISOString().slice(0, 10) !== departure_date
    ) {
      return res.status(400).json({
        success: false,
        message: "Ngày khởi hành không hợp lệ.",
      });
    }

    if (ngayKhoiHanh < new Date(new Date().toISOString().slice(0, 10))) {
      return res.status(400).json({
        success: false,
        message: "Ngày khởi hành không được ở trong quá khứ.",
      });
    }

    // Kiểm tra thời lượng tour
    let soNgay = null;

    if (duration_days != null && duration_days !== "") {
      soNgay = Number(duration_days);

      if (!Number.isInteger(soNgay) || soNgay < 1) {
        return res.status(400).json({
          success: false,
          message: "Thời lượng tour phải là số nguyên lớn hơn 0.",
        });
      }
    }

    // Kiểm tra ngân sách
    let nganSach = null;

    if (budget_per_pax != null && budget_per_pax !== "") {
      nganSach = Number(budget_per_pax);

      if (!Number.isFinite(nganSach) || nganSach < 0) {
        return res.status(400).json({
          success: false,
          message: "Ngân sách mỗi người không hợp lệ.",
        });
      }
    }

    // Kiểm tra tour có sẵn nếu khách cung cấp tour_id
    let tourId = null;

    if (tour_id != null && tour_id !== "") {
      tourId = BigInt(tour_id);

      const tour = await prisma.tours.findFirst({
        where: {
          id: tourId,
          deleted_at: null,
          status: "active",
        },
        select: { id: true },
      });

      if (!tour) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tour đang hoạt động.",
        });
      }
    }

    // Chống tạo yêu cầu trùng: cùng user + cùng tour + cùng ngày khởi hành
    // đang ở trạng thái chờ xử lý trong vòng 10 phút gần đây.
    const trungLap = await prisma.custom_tour_requests.findFirst({
      where: {
        user_id: BigInt(user_id),
        tour_id: tourId,
        departure_date: ngayKhoiHanh,
        estimated_pax: soNguoi,
        status: "pending",
        created_at: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (trungLap) {
      return res.status(409).json({
        success: false,
        message:
          "Bạn đã gửi một yêu cầu tương tự gần đây. Vui lòng chờ xử lý hoặc thay đổi thông tin.",
      });
    }

    // Lưu yêu cầu vào database
    const yeuCau = await prisma.custom_tour_requests.create({
      data: {
        user_id: BigInt(user_id),
        tour_id: tourId,
        company_name: company_name?.trim() || null,
        contact_name: contact_name.trim(),
        contact_phone: contact_phone.trim(),
        contact_email: contact_email.trim(),
        estimated_pax: soNguoi,
        departure_date: ngayKhoiHanh,
        duration_days: soNgay,
        budget_per_pax: nganSach,
        special_requirements:
          special_requirements?.trim() || null,
        status: "pending",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Gửi yêu cầu tour đoàn thành công.",
      data: {
        ...yeuCau,
        id: yeuCau.id.toString(),
        user_id: yeuCau.user_id.toString(),
        tour_id: yeuCau.tour_id?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("Lỗi reqTourDoan:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lưu yêu cầu tour đoàn.",
    });
  }
};



// lấy ra yêu cầu tour đoàn

export const allYeuCauTourDoan = async (req, res) => {
  try {
    const yeuCauTourDoan = await prisma.custom_tour_requests.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        tour: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách yêu cầu tour đoàn thành công',
      data: yeuCauTourDoan.map((item) => ({
        ...item,
        id: item.id.toString(),
        user_id: item.user_id.toString(),
        tour_id: item.tour_id?.toString() ?? null,
        tour: item.tour
          ? { ...item.tour, id: item.tour.id.toString() }
          : null,
      })),
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách yêu cầu tour đoàn:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách yêu cầu tour đoàn',
    });
  }
};


// bảng phản hồi người yêu cầu

export const phanHoi = async (req, res) => {
  try {

    const { request_id, message } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (
      request_id === undefined ||
      request_id === null ||
      !/^[1-9]\d*$/.test(String(request_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Mã yêu cầu tour không hợp lệ.",
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung phản hồi.",
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phản hồi không được vượt quá 2000 ký tự.",
      });
    }

    const requestId = BigInt(request_id);

    // 2. Kiểm tra yêu cầu tour tồn tại
    const yeuCau = await prisma.custom_tour_requests.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
      },
    });

    if (!yeuCau) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu đặt tour.",
      });
    }

    // 3. Lấy người gửi từ middleware xác thực
    // Cần bảo đảm route đã dùng middleware xác thực
    // và kiểm tra quyền admin/nhân viên.
    const senderId = req.user?.id;

    if (senderId === undefined || senderId === null) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để gửi phản hồi.",
      });
    }

    // 4. Lưu phản hồi vào database
    const phanHoiMoi = await prisma.tour_negotiation_messages.create({
      data: {
        request_id: requestId,
        sender_id: BigInt(senderId),
        message: message.trim(),
        message_type: "text",
      },
    });

    // 5. Trả dữ liệu JSON
    return res.status(201).json({
      success: true,
      message: "Gửi phản hồi thành công.",
      data: {
        id: phanHoiMoi.id.toString(),
        request_id: phanHoiMoi.request_id.toString(),
        sender_id: phanHoiMoi.sender_id?.toString() ?? null,
        message: phanHoiMoi.message,
        message_type: phanHoiMoi.message_type,
        created_at: phanHoiMoi.created_at,
      },
    });
  } catch (error) {
    console.error("Lỗi phản hồi yêu cầu đặt tour:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể gửi phản hồi.",
    });
  }
};


/// lây ra lịch sử phản hồi

export const layRaLichSuPhanHoi = async (req, res) => {
  try {
    console.log(req.params)
    const { request_id } = req.params;

    // Kiểm tra mã yêu cầu
    if (!request_id || !/^\d+$/.test(request_id)) {
      return res.status(400).json({
        success: false,
        message: "Mã yêu cầu đặt tour không hợp lệ.",
      });
    }

    // Kiểm tra yêu cầu đặt tour có tồn tại không
    const yeuCau = await prisma.custom_tour_requests.findUnique({
      where: {
        id: BigInt(request_id),
      },
    });

    if (!yeuCau) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu đặt tour.",
      });
    }

    // Lấy lịch sử phản hồi của yêu cầu
    const lichSuPhanHoi =
      await prisma.tour_negotiation_messages.findMany({
        where: {
          request_id: BigInt(request_id),
        },
        orderBy: {
          created_at: "asc",
        },
        include: {
          sender: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

    // Chuyển BigInt thành chuỗi để trả JSON
    const data = lichSuPhanHoi.map((item) => ({
      ...item,
      id: item.id.toString(),
      request_id: item.request_id.toString(),
      quotation_id: item.quotation_id?.toString() ?? null,
      sender_id: item.sender_id?.toString() ?? null,
      sender: item.sender
        ? {
          ...item.sender,
          id: item.sender.id.toString(),
        }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử phản hồi thành công.",
      data,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử phản hồi:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử phản hồi.",
    });
  }
};