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
      fs.unlink(filePath, () => {});
    }
  });
};

// tao moi tour
// Tạo mới tour
export const createTourController = async (req, res, next) => {
  // =====================================================
  // Gom danh sách file đã upload để rollback nếu có lỗi
  // =====================================================
  const uploadedFiles = [];

  if (req.files?.thumbnail?.[0]) {
    uploadedFiles.push(req.files.thumbnail[0].path);
  }

  if (req.files?.tour_images) {
    req.files.tour_images.forEach((f) => {
      uploadedFiles.push(f.path);
    });
  } else if (req.file) {
    uploadedFiles.push(req.file.path);
  }

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
    // 1. Lấy ID operator và category
    // =====================================================
    const finalOperatorId = operator_id || operatorId;
    const finalCategoryId = category_id || idCategory;

    // =====================================================
    // 2. Validate dữ liệu bắt buộc
    // =====================================================
    if (!finalOperatorId || !finalCategoryId || !name || !slug || !price) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ: Tên, slug, giá vé người lớn, danh mục và đơn vị tổ chức",
      });
    }

    // =====================================================
    // 3. Convert operator ID
    // =====================================================
    let operatorBigInt;

    try {
      operatorBigInt = BigInt(finalOperatorId);
    } catch {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message: "ID đơn vị tổ chức không hợp lệ",
      });
    }

    // =====================================================
    // 4. Kiểm tra đơn vị tổ chức
    // =====================================================
    const operator = await prisma.tour_operators.findUnique({
      where: {
        id: operatorBigInt,
      },
    });

    if (!operator) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(404).json({
        success: false,
        message: "Nhà cung cấp tour không tồn tại",
      });
    }

    // =====================================================
    // 5. Lấy ID chủ tour
    // =====================================================
    const ownerId = operator.user_id;

    if (!ownerId) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message: "Đơn vị tổ chức chưa có chủ tài khoản",
      });
    }

    // =====================================================
    // 6. Convert category ID
    // =====================================================
    let categoryBigInt;

    try {
      categoryBigInt = BigInt(finalCategoryId);
    } catch {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message: "ID danh mục không hợp lệ",
      });
    }

    // =====================================================
    // 7. Kiểm tra danh mục
    // =====================================================
    const category = await prisma.categories.findUnique({
      where: {
        id: categoryBigInt,
      },
    });

    if (!category) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(404).json({
        success: false,
        message: "Loại tour không tồn tại",
      });
    }

    // =====================================================
    // 8. Kiểm tra slug trùng
    // =====================================================
    const slugExists = await prisma.tours.findUnique({
      where: {
        slug: slug.trim(),
      },
    });

    if (slugExists) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(409).json({
        success: false,
        message: "Slug tour đã tồn tại, vui lòng chọn tên hoặc slug khác",
      });
    }

    // =====================================================
    // 9. Lấy đường dẫn file ảnh
    // =====================================================
    const thumbnail = req.files?.thumbnail?.[0]?.path || req.file?.path || null;

    const galleryImages = req.files?.tour_images
      ? req.files.tour_images.map((f) => f.path)
      : [];

    // =====================================================
    // 10. Parse JSON an toàn
    // =====================================================
    const parsedSchedules = safeJsonParse(schedules);
    const parsedDestinations = safeJsonParse(destinations);
    const parsedItineraries = safeJsonParse(itineraries);

    // =====================================================
    // 11. Chuẩn bị giá
    // =====================================================
    const adultPrice = Number(price);

    const parsedChildPrice =
      child_price !== undefined && child_price !== null && child_price !== ""
        ? Number(child_price)
        : null;

    const parsedInfantPrice =
      infant_price !== undefined && infant_price !== null && infant_price !== ""
        ? Number(infant_price)
        : 0;

    // =====================================================
    // 12. Tạo tour
    // =====================================================
    const result = await createTourService({
      operator_id: operatorBigInt,
      category_id: categoryBigInt,

      name: name.trim(),
      slug: slug.trim(),

      description: description?.trim() || null,

      // Giá
      price: adultPrice,
      child_price: parsedChildPrice,
      infant_price: parsedInfantPrice,

      // Thời gian
      duration_days: Number(duration_days) || 1,
      duration_nights: Number(duration_nights) || 0,

      // Số lượng
      max_people: Number(max_people) || 30,

      // Thông tin tour
      difficulty_level: difficulty_level || "Dễ",
      transportation: transportation || "Xe du lịch",
      status: status || "active",

      // Hình ảnh
      thumbnail,
      galleryImages,

      // Dữ liệu liên kết
      schedules: parsedSchedules,
      destinations: parsedDestinations,
      itineraries: parsedItineraries,
    });

    // =====================================================
    // 13. Tạo ví tổng cho chủ tour nếu chưa có
    // =====================================================
    const existingWallet = await prisma.wallets.findUnique({
      where: {
        user_id: ownerId,
      },
    });

    if (!existingWallet) {
      await prisma.wallets.create({
        data: {
          user_id: ownerId,
          balance: 0,
        },
      });
    }

    // =====================================================
    // 14. Response
    // =====================================================
    return res.status(201).json({
      success: true,
      message: "Tạo tour và lịch trình thành công",
      data: serializeBigInt(result),
    });
  } catch (error) {
    // =====================================================
    // Rollback file nếu có lỗi
    // =====================================================
    cleanupUploadedFiles(uploadedFiles);

    next(error);
  }
};

// get chi tiet tour
export const getOneTour = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);

    const tour = await prisma.tours.findUnique({
      where: {
        id: idTour,
      },
      include: {
        category: true,
        images: {
          where: { deleted_at: null },
          orderBy: { sort_order: "asc" },
        },
        schedules: {
          where: { deleted_at: null },
          orderBy: { departure_date: "asc" },
        },
        itineraries: {
          where: { deleted_at: null },
          orderBy: { day_number: "asc" },
          include: {
            activities: {
              where: { deleted_at: null },
              orderBy: { visit_order: "asc" },
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

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
      });
    }

    // Format dữ liệu trả về cho client (serialize BigInt và Decimal)
    const data = {
      id: tour.id.toString(),
      operator_id: tour.operator_id.toString(),
      category_id: tour.category_id.toString(),

      name: tour.name,
      slug: tour.slug,
      description: tour.description,

      // === CÁC LOẠI GIÁ VÉ THEO SCHEMA MỚI ===
      price: tour.price ? tour.price.toString() : "0", // Người lớn
      child_price: tour.child_price ? tour.child_price.toString() : null, // Trẻ em
      infant_price: tour.infant_price ? tour.infant_price.toString() : "0", // Em bé

      duration_days: tour.duration_days,
      duration_nights: tour.duration_nights,
      max_people: tour.max_people,

      difficulty_level: tour.difficulty_level,
      transportation: tour.transportation,

      thumbnail: tour.thumbnail,
      gallery_images:
        tour.images?.map((img) => ({
          id: img.id.toString(),
          image_url: img.image_url,
          sort_order: img.sort_order,
        })) || [],

      status: tour.status,

      created_at: tour.created_at,
      updated_at: tour.updated_at,
      deleted_at: tour.deleted_at,

      category: tour.category
        ? {
            id: tour.category.id.toString(),
            name: tour.category.name,
            description: tour.category.description,
            image: tour.category.image,
            status: tour.category.status,
          }
        : null,

      schedules: tour.schedules.map((schedule) => ({
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
      })),

      itineraries: tour.itineraries.map((itinerary) => ({
        id: itinerary.id.toString(),
        tour_id: itinerary.tour_id.toString(),
        day_number: itinerary.day_number,
        title: itinerary.title,
        description: itinerary.description,

        activities: itinerary.activities.map((activity) => ({
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
          destination: activity.destination
            ? {
                id: activity.destination.id.toString(),
                name: activity.destination.name,
                description: activity.destination.description,
                address: activity.destination.address,
                province: activity.destination.province,
                latitude: activity.destination.latitude?.toString(),
                longitude: activity.destination.longitude?.toString(),
                image: activity.destination.image,
              }
            : null,
        })),
      })),
    };

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
// 3. LẤY DANH SÁCH TẤT CẢ TOUR (GET ALL TOURS)
// =========================================================================
export const getAllTour = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    const tours = await prisma.tours.findMany({
      where: {
        deleted_at: null,
        status: "active",
        ...(keyword && {
          OR: [
            { name: { contains: keyword.trim(), mode: "insensitive" } },
            { description: { contains: keyword.trim(), mode: "insensitive" } },
            { slug: { contains: keyword.trim(), mode: "insensitive" } },
          ],
        }),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const data = tours.map((tour) => ({
      ...tour,
      id: tour.id.toString(),
      operator_id: tour.operator_id ? tour.operator_id.toString() : null,
      category_id: tour.category_id ? tour.category_id.toString() : null,
      // Format giá sang string để tránh tràn số JSON
      price: tour.price ? tour.price.toString() : "0",
      child_price: tour.child_price ? tour.child_price.toString() : null,
      infant_price: tour.infant_price ? tour.infant_price.toString() : "0",
      category: tour.category
        ? {
            id: tour.category.id.toString(),
            name: tour.category.name,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách tour thành công",
      data,
    });
  } catch (error) {
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
            price: true,
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
