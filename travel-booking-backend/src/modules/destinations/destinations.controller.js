import prisma from "../../config/postgres.js";
import path from "path";
import fs, { unlink } from "fs";
import { date, success } from "zod";
import { ps } from "zod/locales";
import { title } from "process";
import { Prisma } from "@prisma/client";
// them dem den
export const createDestination = async (req, res, next) => {
  try {
    console.log("========== CREATE DESTINATION ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const {
      category_id,
      name,
      description,
      address,
      province,
      latitude,
      longitude,
      estimated_visit_time,
      opening_time,
      closing_time,
      average_cost,
      best_time,
      weather_note,
      age_suitable,
      activity_types,
      status,
    } = req.body;

    // 1. Kiểm tra category nếu có truyền category_id
    let category = null;

    if (category_id) {
      category = await prisma.categories.findFirst({
        where: {
          id: BigInt(category_id),
          deleted_at: null,
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại tour",
        });
      }
    }

    // 2. Lấy ảnh
    const image = req.file?.path || null;

    // 3. Tạo địa điểm
    const result = await prisma.destinations.create({
      data: {
        category_id: category ? category.id : null,

        name,
        description: description || null,
        address: address || null,
        province: province || null,

        latitude:
          latitude !== undefined && latitude !== "" ? Number(latitude) : null,

        longitude:
          longitude !== undefined && longitude !== ""
            ? Number(longitude)
            : null,

        image,

        estimated_visit_time:
          estimated_visit_time !== undefined && estimated_visit_time !== ""
            ? Number(estimated_visit_time)
            : null,

        opening_time: opening_time
          ? new Date(`1970-01-01T${opening_time}:00`)
          : null,

        closing_time: closing_time
          ? new Date(`1970-01-01T${closing_time}:00`)
          : null,

        average_cost:
          average_cost !== undefined && average_cost !== ""
            ? Number(average_cost)
            : null,

        best_time: best_time || null,
        weather_note: weather_note || null,
        age_suitable: age_suitable || null,
        activity_types: activity_types || null,

        status: status || "active",
      },
    });

    // 4. Trả dữ liệu
    return res.status(201).json({
      success: true,
      message: "Tạo địa điểm du lịch thành công",
      data: {
        ...result,
        id: result.id.toString(),
        category_id: result.category_id ? result.category_id.toString() : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật địa điểm du lịch
export const updateDestination = async (req, res, next) => {
  try {
    const idDestination = BigInt(req.params.id);

    const {
      category_id,
      name,
      description,
      address,
      province,
      latitude,
      longitude,
      estimated_visit_time,
      opening_time,
      closing_time,
      average_cost,
      best_time,
      weather_note,
      age_suitable,
      activity_types,
      status,
    } = req.body;

    // ==========================================
    // 1. Tìm destination
    // ==========================================

    const destination = await prisma.destinations.findFirst({
      where: {
        id: idDestination,
        deleted_at: null,
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    // Lưu ảnh cũ
    const oldImage = destination.image;

    // ==========================================
    // 2. Kiểm tra category
    // ==========================================

    let categoryId = destination.category_id;

    if (category_id !== undefined && category_id !== "") {
      const category = await prisma.categories.findFirst({
        where: {
          id: BigInt(category_id),
          deleted_at: null,
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục",
        });
      }

      categoryId = category.id;
    }

    // ==========================================
    // 3. Kiểm tra status
    // ==========================================

    if (status !== undefined && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status chỉ được phép là active hoặc inactive",
      });
    }

    // ==========================================
    // 4. Xử lý ảnh
    // ==========================================

    let image = oldImage;

    if (req.file) {
      image = req.file.path;
    }

    // ==========================================
    // 5. Update database
    // ==========================================

    const result = await prisma.destinations.update({
      where: {
        id: idDestination,
      },

      data: {
        category_id: categoryId,

        name: name !== undefined ? name : destination.name,

        description:
          description !== undefined
            ? description || null
            : destination.description,

        address: address !== undefined ? address || null : destination.address,

        province:
          province !== undefined ? province || null : destination.province,

        latitude:
          latitude !== undefined && latitude !== ""
            ? Number(latitude)
            : destination.latitude,

        longitude:
          longitude !== undefined && longitude !== ""
            ? Number(longitude)
            : destination.longitude,

        estimated_visit_time:
          estimated_visit_time !== undefined && estimated_visit_time !== ""
            ? Number(estimated_visit_time)
            : destination.estimated_visit_time,

        opening_time:
          opening_time !== undefined && opening_time !== ""
            ? new Date(`1970-01-01T${opening_time}:00`)
            : destination.opening_time,

        closing_time:
          closing_time !== undefined && closing_time !== ""
            ? new Date(`1970-01-01T${closing_time}:00`)
            : destination.closing_time,

        average_cost:
          average_cost !== undefined && average_cost !== ""
            ? Number(average_cost)
            : destination.average_cost,

        best_time:
          best_time !== undefined ? best_time || null : destination.best_time,

        weather_note:
          weather_note !== undefined
            ? weather_note || null
            : destination.weather_note,

        age_suitable:
          age_suitable !== undefined
            ? age_suitable || null
            : destination.age_suitable,

        activity_types:
          activity_types !== undefined
            ? activity_types || null
            : destination.activity_types,

        status: status !== undefined ? status : destination.status,

        image,
      },
    });

    // ==========================================
    // 6. XÓA ẢNH CŨ
    // Chỉ xóa khi upload ảnh mới
    // ==========================================

    if (req.file && oldImage) {
      const oldImagePath = path.resolve(oldImage);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);

        console.log("Đã xóa ảnh cũ:", oldImagePath);
      }
    }

    // ==========================================
    // 7. Response
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Cập nhật địa điểm thành công",

      data: {
        ...result,

        id: result.id.toString(),

        category_id: result.category_id ? result.category_id.toString() : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all
export const getAllDestination = async (req, res, next) => {
  try {
    const result = await prisma.destinations.findMany({
      where: { deleted_at: null },
    });
    const destination = result.map((x) => ({
      ...x,
      id: x.id.toString(),
      category_id: x.category_id.toString(),
    }));
    return res.status(200).json({
      success: true,
      message: "lay lich tinh thanh cong",
      destination,
    });
  } catch (error) {
    next(error);
  }
};

// get one lich diem den

export const getOne = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const destination = await prisma.destinations.findFirst({
      where: {
        id,
        deleted_at: null,
      },

      include: {
        // Thông tin category
        category: true,

        // Các tour có địa điểm này
        tour_destinations: {
          where: {
            deleted_at: null,
          },

          orderBy: [
            {
              day_number: "asc",
            },
            {
              visit_order: "asc",
            },
          ],

          include: {
            tour: true,
          },
        },
      },
    });

    // Không tìm thấy destination
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    // ==========================================
    // SERIALIZE DATA
    // BigInt -> String
    // Decimal -> Number
    // Date -> ISO String
    // ==========================================

    const serializeData = (value) => {
      // BigInt -> String
      if (typeof value === "bigint") {
        return value.toString();
      }

      // Prisma Decimal -> Number
      if (value instanceof Prisma.Decimal) {
        return Number(value.toString());
      }

      // Date -> String
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Array
      if (Array.isArray(value)) {
        return value.map(serializeData);
      }

      // Object
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, val]) => [key, serializeData(val)]),
        );
      }

      return value;
    };
    // ==========================================
    // TẠO DATA TRẢ VỀ
    // ==========================================

    const dataDestination = serializeData({
      ...destination,

      tours: destination.tour_destinations.map((item) => ({
        ...item.tour,
        visit_order: item.visit_order,
        day_number: item.day_number,
      })),
    });

    delete dataDestination.tour_destinations;

    // Không cần trả tour_destinations
    delete dataDestination.tour_destinations;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      data: dataDestination,
    });
  } catch (error) {
    console.error("GET ONE DESTINATION ERROR:", error);
    next(error);
  }
};

// Helper chuyển BigInt -> String, Decimal -> Number, Date -> ISO String
const serializeData = (value) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Prisma.Decimal) {
    return Number(value.toString());
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeData);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeData(val)]),
    );
  }
  return value;
};

export const destinationDetail = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    if (!rawId || isNaN(Number(rawId))) {
      return res.status(400).json({
        success: false,
        message: "ID điểm đến không hợp lệ",
      });
    }

    const id = BigInt(rawId);

    // 1. Truy vấn địa điểm và include quan hệ tour_destinations -> tours
    const destination = await prisma.destinations.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        // Danh mục của điểm đến
        category: true,

        // Liên kết với các tour thông qua tour_destinations
        tour_destinations: {
          where: {
            deleted_at: null,
            tour: {
              deleted_at: null, // Lọc bỏ các tour đã xóa mềm
            },
          },
          orderBy: [{ day_number: "asc" }, { visit_order: "asc" }],
          include: {
            tour: {
              include: {
                operator: {
                  select: {
                    id: true,
                    company_name: true,
                    logo_url: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                // Lấy kèm lịch khởi hành gần nhất để hiển thị ngày đi/giá chỗ
                schedules: {
                  where: {
                    deleted_at: null,
                    status: "open",
                  },
                  orderBy: {
                    departure_date: "asc",
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy điểm đến yêu cầu",
      });
    }

    // 2. Định dạng lại danh sách tours từ quan hệ tour_destinations
    const formattedTours = destination.tour_destinations
      .filter((td) => td.tour !== null)
      .map((td) => {
        const t = td.tour;
        const nextSchedule = t.schedules?.[0] || null;

        return {
          tour_destination_id: td.id.toString(),
          day_number: td.day_number,
          visit_order: td.visit_order,

          // Chi tiết Tour
          id: t.id.toString(),
          name: t.name,
          slug: t.slug,
          price: Number(t.price.toString()),
          duration_days: t.duration_days,
          duration_nights: t.duration_nights,
          max_people: t.max_people,
          difficulty_level: t.difficulty_level,
          transportation: t.transportation,
          thumbnail: t.thumbnail,
          status: t.status,

          // Đơn vị tổ chức & Danh mục tour
          operator: t.operator
            ? {
                id: t.operator.id.toString(),
                company_name: t.operator.company_name,
                logo_url: t.operator.logo_url,
              }
            : null,
          category: t.category
            ? {
                id: t.category.id.toString(),
                name: t.category.name,
              }
            : null,

          // Lịch gần nhất (nếu có)
          nearest_schedule: nextSchedule
            ? {
                id: nextSchedule.id.toString(),
                departure_date: nextSchedule.departure_date,
                departure_time: nextSchedule.departure_time,
                total_slots: nextSchedule.total_slots,
                available_slots: nextSchedule.available_slots,
              }
            : null,
        };
      });

    // 3. Serialize toàn bộ object destination và gán mảng tours đã format
    const serializedDestination = serializeData(destination);
    delete serializedDestination.tour_destinations;

    return res.status(200).json({
      success: true,
      data: {
        ...serializedDestination,
        tours: formattedTours,
      },
    });
  } catch (error) {
    console.error("DESTINATION DETAIL ERROR:", error);
    next(error);
  }
};
// Xóa mềm địa điểm
export const softDestination = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const destination = await prisma.destinations.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm hoặc địa điểm đã bị xóa",
      });
    }

    const result = await prisma.destinations.update({
      where: {
        id: destination.id,
      },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "An địa điểm thành công",
      data: {
        ...result,
        id: result.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Khôi phục địa điểm
export const restoreDestination = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const destination = await prisma.destinations.findFirst({
      where: {
        id,
        deleted_at: {
          not: null,
        },
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm đã bị xóa",
      });
    }

    const result = await prisma.destinations.update({
      where: {
        id: destination.id,
      },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục địa điểm thành công",
      data: {
        ...result,
        id: result.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Xóa cứng địa điểm
export const hardDeleteDestination = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    // Tìm địa điểm
    const destination = await prisma.destinations.findUnique({
      where: {
        id,
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    // Lưu đường dẫn ảnh trước khi xóa DB
    const imageUrl = destination.image;

    // Xóa cứng trong database
    const result = await prisma.destinations.delete({
      where: {
        id: destination.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Xóa file ảnh sau khi xóa DB thành công
    if (imageUrl) {
      const imagePath = path.resolve(imageUrl);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn địa điểm thành công",
      data: {
        ...result,
        id: result.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

///------------------tour_destinations--------------------------------------

// Thêm nhiều địa điểm vào tour
export const createTourDestinations = async (req, res, next) => {
  try {
    const { tour_id, data } = req.body;

    // =========================
    // 1. Validate dữ liệu
    // =========================
    if (!tour_id) {
      return res.status(400).json({
        success: false,
        message: "tour_id là bắt buộc",
      });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "data phải là một mảng và không được để trống",
      });
    }

    // =========================
    // 2. Kiểm tra tour
    // =========================
    const tour = await prisma.tours.findFirst({
      where: {
        id: BigInt(tour_id),
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
      });
    }

    // =========================
    // 3. Lấy danh sách destination ID
    // =========================
    const destinationIds = data.map((item) => BigInt(item.destination_id));

    // =========================
    // 4. Kiểm tra destinations
    // =========================
    const destinationList = await prisma.destinations.findMany({
      where: {
        id: {
          in: destinationIds,
        },
        deleted_at: null,
      },
    });

    if (destinationList.length !== destinationIds.length) {
      return res.status(404).json({
        success: false,
        message: "Có một hoặc nhiều địa điểm không tồn tại",
      });
    }

    // =========================
    // 5. Tạo dữ liệu
    // =========================
    const dataCreate = data.map((item) => ({
      tour_id: BigInt(tour_id),
      destination_id: BigInt(item.destination_id),
      visit_order: Number(item.visit_order),
      day_number: Number(item.day_number),
    }));

    // =========================
    // 6. Thêm vào tour
    // =========================
    await prisma.tour_destinations.createMany({
      data: dataCreate,
      skipDuplicates: true,
    });

    // =========================
    // 7. Lấy lại toàn bộ dữ liệu
    // =========================
    const result = await prisma.tour_destinations.findMany({
      where: {
        tour_id: BigInt(tour_id),
        deleted_at: null,
      },

      include: {
        tour: {
          select: {
            id: true,
            name: true,
          },
        },

        destination: {
          select: {
            id: true,
            name: true,
            image: true,
            province: true,
          },
        },
      },

      orderBy: [
        {
          day_number: "asc",
        },
        {
          visit_order: "asc",
        },
      ],
    });

    // =========================
    // 8. Convert BigInt
    // =========================
    const dataResponse = result.map((item) => ({
      tour_id: item.tour_id.toString(),
      destination_id: item.destination_id.toString(),

      visit_order: item.visit_order,
      day_number: item.day_number,
      deleted_at: item.deleted_at,

      tour: {
        id: item.tour.id.toString(),
        name: item.tour.name,
      },

      destination: {
        id: item.destination.id.toString(),
        name: item.destination.name,
        image: item.destination.image,
        province: item.destination.province,
      },
    }));

    // =========================
    // 9. Response
    // =========================
    return res.status(201).json({
      success: true,
      message: "Thêm địa điểm vào tour thành công",
      data: dataResponse,
    });
  } catch (error) {
    next(error);
  }
};

// lay dnah sach diem den cua 1 tour

export const getAllDestiations = async (req, res, next) => {
  try {
    const idTour = BigInt(req.params.id);
    const tour = await prisma.tours.findFirst({
      where: {
        id: BigInt(idTour),
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
      });
    }
    const result = await prisma.tour_destinations.findMany({
      where: {
        tour_id: tour.id,
      },
      include: {
        destination: true,
      },
    });
    const dataResult = result.map((x) => ({
      id: x.destination.id.toString(),
      name: x.destination.name,
      description: x.destination.description,
      address: x.destination.address,
      province: x.destination.province,
      image: x.destination.image,
      latitude: x.destination.latitude,
      longitude: x.destination.longitude,
      estimated_visit_time: x.destination.estimated_visit_time,
      opening_time: x.destination.opening_time,
      closing_time: x.destination.closing_time,
      average_cost: x.destination.average_cost,
      best_time: x.destination.best_time,
      weather_note: x.destination.weather_note,
      age_suitable: x.destination.age_suitable,
      activity_types: x.destination.activity_types,
    }));
    return res.status(200).json({
      success: true,
      message: "lay diem den tour thanh cong",
      dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH cập nhật day_number, visit_order
export const updateTourDestination = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const { day_number, visit_order } = req.body;

    const tourDestination = await prisma.tour_destinations.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!tourDestination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour-destination",
      });
    }

    if (day_number === undefined && visit_order === undefined) {
      return res.status(400).json({
        success: false,
        message: "Phải truyền day_number hoặc visit_order",
      });
    }

    const result = await prisma.tour_destinations.update({
      where: {
        id: tourDestination.id,
      },

      data: {
        ...(day_number !== undefined && {
          day_number: Number(day_number),
        }),

        ...(visit_order !== undefined && {
          visit_order: Number(visit_order),
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật tour-destination thành công",

      data: {
        ...result,
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
        destination_id: result.destination_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET chi tiết 1 địa điểm trong tour
export const getDetail = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const result = await prisma.tour_destinations.findFirst({
      where: {
        id,
        deleted_at: null,
      },

      include: {
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

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
            estimated_visit_time: true,
            opening_time: true,
            closing_time: true,
            average_cost: true,
            best_time: true,
            weather_note: true,
            age_suitable: true,
            activity_types: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm trong tour",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết địa điểm trong tour thành công",

      data: {
        id: result.id.toString(),

        tour_id: result.tour_id.toString(),
        destination_id: result.destination_id.toString(),

        day_number: result.day_number,
        visit_order: result.visit_order,
        deleted_at: result.deleted_at,

        tour: {
          ...result.tour,
          id: result.tour.id.toString(),
        },

        destination: {
          ...result.destination,
          id: result.destination.id.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE mềm tour-destination
export const xoaMem = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const tourDestination = await prisma.tour_destinations.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!tourDestination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour-destination hoặc đã bị xóa",
      });
    }

    const result = await prisma.tour_destinations.update({
      where: {
        id,
      },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id: true,
        tour_id: true,
        destination_id: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa tour-destination thành công",
      data: {
        ...result,
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
        destination_id: result.destination_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// RESTORE tour-destination
export const khoiPhuc = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const tourDestination = await prisma.tour_destinations.findFirst({
      where: {
        id,
        deleted_at: {
          not: null,
        },
      },
    });

    if (!tourDestination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour-destination đã bị xóa",
      });
    }

    const result = await prisma.tour_destinations.update({
      where: {
        id,
      },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        tour_id: true,
        destination_id: true,
        day_number: true,
        visit_order: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục tour-destination thành công",
      data: {
        ...result,
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
        destination_id: result.destination_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// HARD DELETE tour-destination
export const xoaCung = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const tourDestination = await prisma.tour_destinations.findUnique({
      where: {
        id,
      },
    });

    if (!tourDestination) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour-destination",
      });
    }

    const result = await prisma.tour_destinations.delete({
      where: {
        id,
      },
      select: {
        id: true,
        tour_id: true,
        destination_id: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn tour-destination thành công",
      data: {
        id: result.id.toString(),
        tour_id: result.tour_id.toString(),
        destination_id: result.destination_id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
//////////////////////////////////    /////////////
//---------------tour_itineraries -- lich khoi hanh---di chuyen trong 1 tour
////////////////////////////////////////////////  ////

// tạo lịch trình cho tour
export const createTourItinerary = async (req, res, next) => {
  try {
    const { tour_id, day_number, title, description } = req.body;

    // 1. Kiểm tra tour
    const tour = await prisma.tours.findFirst({
      where: {
        id: BigInt(tour_id),
        deleted_at: null,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
      });
    }

    // 2. Kiểm tra ngày đã tồn tại chưa
    const existed = await prisma.tour_itineraries.findFirst({
      where: {
        tour_id: tour.id,
        day_number: Number(day_number),
        deleted_at: null,
      },
    });

    if (existed) {
      return res.status(409).json({
        success: false,
        message: `Tour đã có lịch trình ngày ${day_number}`,
      });
    }

    // 3. Tạo lịch trình
    const result = await prisma.tour_itineraries.create({
      data: {
        tour_id: tour.id,
        day_number: Number(day_number),
        title,
        description: description || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tạo lịch trình tour thành công",
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

// GET danh sách lịch trình của tour
export const getAllTourItineraries = async (req, res, next) => {
  try {
    const tour_id = BigInt(req.params.id);

    // Kiểm tra tour
    const tour = await prisma.tours.findFirst({
      where: {
        id: tour_id,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
      });
    }

    const result = await prisma.tour_itineraries.findMany({
      where: {
        tour_id,
        deleted_at: null,
      },

      orderBy: {
        day_number: "asc",
      },
    });

    const data = result.map((item) => ({
      id: item.id.toString(),
      tour_id: item.tour_id.toString(),
      day_number: item.day_number,
      title: item.title,
      description: item.description,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách lịch trình thành công",

      tour: {
        id: tour.id.toString(),
        name: tour.name,
        slug: tour.slug,
      },

      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET chi tiết lịch trình
export const getTourItineraryDetail = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const result = await prisma.tour_itineraries.findFirst({
      where: {
        id,
        deleted_at: null,
      },

      include: {
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết lịch trình thành công",

      data: {
        id: result.id.toString(),

        tour: {
          id: result.tour.id.toString(),
          name: result.tour.name,
          slug: result.tour.slug,
        },

        day_number: result.day_number,
        title: result.title,
        description: result.description,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE tour itinerary
export const updateTourItinerary = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const { day_number, title, description } = req.body;

    const itinerary = await prisma.tour_itineraries.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    // Nếu đổi day_number thì kiểm tra trùng
    if (
      day_number !== undefined &&
      Number(day_number) !== itinerary.day_number
    ) {
      const existed = await prisma.tour_itineraries.findFirst({
        where: {
          tour_id: itinerary.tour_id,
          day_number: Number(day_number),
          deleted_at: null,
          NOT: {
            id,
          },
        },
      });

      if (existed) {
        return res.status(409).json({
          success: false,
          message: `Tour đã có lịch trình ngày ${day_number}`,
        });
      }
    }

    const result = await prisma.tour_itineraries.update({
      where: {
        id,
      },

      data: {
        day_number:
          day_number !== undefined ? Number(day_number) : itinerary.day_number,

        title: title !== undefined ? title : itinerary.title,

        description:
          description !== undefined
            ? description || null
            : itinerary.description,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật lịch trình thành công",

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

// DELETE mềm
export const deleteTourItinerary = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const itinerary = await prisma.tour_itineraries.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình hoặc lịch trình đã bị xóa",
      });
    }

    const result = await prisma.tour_itineraries.update({
      where: {
        id,
      },

      data: {
        deleted_at: new Date(),
      },

      select: {
        id: true,
        tour_id: true,
        day_number: true,
        deleted_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa lịch trình thành công",

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

// RESTORE
export const restoreTourItinerary = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const itinerary = await prisma.tour_itineraries.findFirst({
      where: {
        id,
        deleted_at: {
          not: null,
        },
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình đã bị xóa",
      });
    }

    // Kiểm tra có lịch trình cùng ngày đang tồn tại không
    const existed = await prisma.tour_itineraries.findFirst({
      where: {
        tour_id: itinerary.tour_id,
        day_number: itinerary.day_number,
        deleted_at: null,
      },
    });

    if (existed) {
      return res.status(409).json({
        success: false,
        message: `Ngày ${itinerary.day_number} đã có lịch trình khác`,
      });
    }

    const result = await prisma.tour_itineraries.update({
      where: {
        id,
      },

      data: {
        deleted_at: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Khôi phục lịch trình thành công",

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

// HARD DELETE
export const hardDeleteTourItinerary = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const itinerary = await prisma.tour_itineraries.findUnique({
      where: {
        id,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    await prisma.tour_itineraries.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn lịch trình thành công",
    });
  } catch (error) {
    next(error);
  }
};

//-------ITINERARY_ACTIVITIES.-- lich trinh hoat dong tung ngay trong tour  ------
const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
// Thêm nhiều hoạt động vào một ngày trong lịch trình
export const createItineraryActivities = async (req, res, next) => {
  try {
    const { itinerary_id, activities } = req.body;

    // =========================
    // 1. Kiểm tra dữ liệu đầu vào
    // =========================

    if (!itinerary_id) {
      return res.status(400).json({
        success: false,
        message: "itinerary_id là bắt buộc",
      });
    }

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "activities phải là một mảng và không được rỗng",
      });
    }

    const itineraryId = BigInt(itinerary_id);

    // =========================
    // 2. Kiểm tra itinerary
    // =========================

    const itinerary = await prisma.tour_itineraries.findFirst({
      where: {
        id: itineraryId,
        deleted_at: null,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình tour",
      });
    }

    // =========================
    // 3. Kiểm tra visit_order
    // =========================

    const visitOrders = activities.map((item) => Number(item.visit_order));

    const duplicateOrders = visitOrders.filter(
      (order, index) => visitOrders.indexOf(order) !== index,
    );

    if (duplicateOrders.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Các hoạt động không được trùng visit_order",
      });
    }

    // =========================
    // 4. Kiểm tra visit_order
    //    đã tồn tại trong DB
    // =========================

    const existedActivities = await prisma.itinerary_activities.findMany({
      where: {
        itinerary_id: itineraryId,
        visit_order: {
          in: visitOrders,
        },
        deleted_at: null,
      },
      select: {
        visit_order: true,
      },
    });

    if (existedActivities.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Visit_order ${existedActivities
          .map((item) => item.visit_order)
          .join(", ")} đã tồn tại trong ngày này`,
      });
    }
    // =========================
    // 5. Kiểm tra thời gian bị trùng
    // =========================

    const existingActivities = await prisma.itinerary_activities.findMany({
      where: {
        itinerary_id: itineraryId,
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        start_time: true,
        end_time: true,
      },
    });

    // Chuyển HH:mm -> số phút
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);

      return hours * 60 + minutes;
    };

    // =========================
    // Kiểm tra activity mới
    // với activity đã có trong DB
    // =========================

    for (const activity of activities) {
      if (!activity.start_time || !activity.end_time) {
        continue;
      }

      const newStart = toMinutes(activity.start_time);
      const newEnd = toMinutes(activity.end_time);

      const conflict = existingActivities.find((oldActivity) => {
        if (!oldActivity.start_time || !oldActivity.end_time) {
          return false;
        }

        const oldStart = toMinutes(
          new Date(oldActivity.start_time).toISOString().substring(11, 16),
        );

        const oldEnd = toMinutes(
          new Date(oldActivity.end_time).toISOString().substring(11, 16),
        );

        return newStart < oldEnd && newEnd > oldStart;
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Thời gian bị trùng với hoạt động "${conflict.title}"`,
        });
      }
    }

    // =========================
    // Kiểm tra các activity mới
    // với nhau
    // =========================

    for (let i = 0; i < activities.length; i++) {
      const current = activities[i];

      if (!current.start_time || !current.end_time) {
        continue;
      }

      const currentStart = toMinutes(current.start_time);
      const currentEnd = toMinutes(current.end_time);

      for (let j = i + 1; j < activities.length; j++) {
        const next = activities[j];

        if (!next.start_time || !next.end_time) {
          continue;
        }

        const nextStart = toMinutes(next.start_time);
        const nextEnd = toMinutes(next.end_time);

        const conflict = currentStart < nextEnd && currentEnd > nextStart;

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: `Thời gian hoạt động "${current.title}" bị trùng với "${next.title}"`,
          });
        }
      }
    }
    // =========================
    // 5. Lấy destination IDs
    // =========================

    const destinationIds = activities.map((item) =>
      BigInt(item.destination_id),
    );

    // Loại ID trùng
    const uniqueDestinationIds = [
      ...new Set(destinationIds.map((id) => id.toString())),
    ].map((id) => BigInt(id));

    const destinations = await prisma.destinations.findMany({
      where: {
        id: {
          in: uniqueDestinationIds,
        },
        deleted_at: null,
      },
    });

    // =========================
    // 6. Kiểm tra destination
    // =========================

    if (destinations.length !== uniqueDestinationIds.length) {
      return res.status(404).json({
        success: false,
        message: "Có một hoặc nhiều địa điểm không tồn tại",
      });
    }

    // =========================
    // 7. Kiểm tra thời gian
    // =========================

    for (const activity of activities) {
      if (activity.start_time && activity.end_time) {
        const startTime = new Date(`1970-01-01T${activity.start_time}:00`);

        const endTime = new Date(`1970-01-01T${activity.end_time}:00`);

        if (startTime >= endTime) {
          return res.status(400).json({
            success: false,
            message: `Thời gian hoạt động "${activity.title}" không hợp lệ`,
          });
        }
      }
    }

    // =========================
    // 8. Tạo dữ liệu
    // =========================

    const dataCreate = activities.map((activity) => ({
      itinerary_id: itineraryId,

      destination_id: BigInt(activity.destination_id),

      start_time: activity.start_time
        ? new Date(`1970-01-01T${activity.start_time}:00`)
        : null,

      end_time: activity.end_time
        ? new Date(`1970-01-01T${activity.end_time}:00`)
        : null,

      title: activity.title,

      description: activity.description || null,

      activity_type: activity.activity_type || null,

      visit_order: Number(activity.visit_order),

      transportation: activity.transportation || null,

      estimated_cost:
        activity.estimated_cost !== undefined &&
        activity.estimated_cost !== null &&
        activity.estimated_cost !== ""
          ? Number(activity.estimated_cost)
          : null,

      note: activity.note || null,
    }));

    // =========================
    // 9. Create nhiều activity
    // =========================

    await prisma.itinerary_activities.createMany({
      data: dataCreate,
    });

    // =========================
    // 10. Lấy lại dữ liệu
    // =========================

    const result = await prisma.itinerary_activities.findMany({
      where: {
        itinerary_id: itineraryId,
        deleted_at: null,
      },

      include: {
        itinerary: {
          select: {
            id: true,
            day_number: true,
            title: true,
            tour_id: true,
          },
        },

        destination: {
          select: {
            id: true,
            name: true,
            province: true,
            image: true,
          },
        },
      },

      orderBy: {
        visit_order: "asc",
      },
    });

    // =========================
    // 11. Convert BigInt
    // =========================

    const dataResponse = result.map((item) => ({
      ...item,

      id: item.id.toString(),

      itinerary_id: item.itinerary_id.toString(),

      destination_id: item.destination_id
        ? item.destination_id.toString()
        : null,

      itinerary: {
        ...item.itinerary,

        id: item.itinerary.id.toString(),

        tour_id: item.itinerary.tour_id.toString(),
      },

      destination: item.destination
        ? {
            ...item.destination,

            id: item.destination.id.toString(),
          }
        : null,
    }));

    // =========================
    // 12. Response
    // =========================

    return res.status(201).json({
      success: true,

      message: "Thêm các hoạt động vào ngày thành công",

      data: dataResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy các hoạt động theo ngày
export const getActivities = async (req, res, next) => {
  try {
    // ==============================
    // 1. Lấy ID lịch trình
    // ==============================
    const idItinerary = BigInt(req.params.id);

    // ==============================
    // 2. Kiểm tra lịch trình tồn tại
    // ==============================
    const itinerary = await prisma.tour_itineraries.findUnique({
      where: {
        id: idItinerary,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    // ==============================
    // 3. Lấy danh sách hoạt động
    // ==============================
    const result = await prisma.itinerary_activities.findMany({
      where: {
        itinerary_id: idItinerary,
        deleted_at: null,
      },

      include: {
        // Thông tin lịch trình
        itinerary: {
          select: {
            id: true,
            day_number: true,
            title: true,
          },
        },

        // Thông tin địa điểm
        destination: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      // Sắp xếp hoạt động theo thứ tự
      orderBy: {
        visit_order: "asc",
      },
    });

    // ==============================
    // 4. Chuyển dữ liệu BigInt
    // ==============================
    const dataResult = result.map((activity) => ({
      id: activity.id.toString(),

      itinerary_id: activity.itinerary_id.toString(),

      destination_id: activity.destination_id
        ? activity.destination_id.toString()
        : null,

      start_time: activity.start_time,
      end_time: activity.end_time,

      title: activity.title,

      description: activity.description,

      activity_type: activity.activity_type,

      visit_order: activity.visit_order,

      transportation: activity.transportation,

      estimated_cost: activity.estimated_cost
        ? activity.estimated_cost.toString()
        : null,

      note: activity.note,

      // Thông tin lịch trình
      itinerary: activity.itinerary
        ? {
            id: activity.itinerary.id.toString(),
            day_number: activity.itinerary.day_number,
            day_name: activity.itinerary.title,
          }
        : null,

      // Thông tin địa điểm
      destination: activity.destination
        ? {
            id: activity.destination.id.toString(),
            name: activity.destination.name,
          }
        : null,
    }));

    // ==============================
    // 5. Trả response
    // ==============================
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hoạt động thành công",
      data: dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật hoạt động của từng ngày
export const updateItineraryActivitie = async (req, res, next) => {
  try {
    const idItineraryActivitie = BigInt(req.params.id);

    // =========================
    // 1. Kiểm tra activity tồn tại
    // =========================

    const itineraryActivitie = await prisma.itinerary_activities.findFirst({
      where: {
        id: idItineraryActivitie,
        deleted_at: null,
      },
    });

    if (!itineraryActivitie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoạt động",
      });
    }

    // =========================
    // 2. Lấy dữ liệu cần cập nhật
    // =========================

    const {
      start_time,
      end_time,
      title,
      description,
      activity_type,
      transportation,
      estimated_cost,
      note,
    } = req.body;

    // =========================
    // 3. Xử lý thời gian mới
    // =========================

    const newStartTime =
      start_time !== undefined
        ? start_time
          ? new Date(`1970-01-01T${start_time}:00`)
          : null
        : itineraryActivitie.start_time;

    const newEndTime =
      end_time !== undefined
        ? end_time
          ? new Date(`1970-01-01T${end_time}:00`)
          : null
        : itineraryActivitie.end_time;

    // =========================
    // 4. Kiểm tra thời gian
    // =========================

    if (newStartTime && newEndTime && newStartTime >= newEndTime) {
      return res.status(400).json({
        success: false,
        message: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
      });
    }

    // =========================
    // 5. Cập nhật activity
    // =========================

    const result = await prisma.itinerary_activities.update({
      where: {
        id: itineraryActivitie.id,
      },

      data: {
        start_time: newStartTime,

        end_time: newEndTime,

        title: title !== undefined ? title : itineraryActivitie.title,

        description:
          description !== undefined
            ? description || null
            : itineraryActivitie.description,

        activity_type:
          activity_type !== undefined
            ? activity_type || null
            : itineraryActivitie.activity_type,

        transportation:
          transportation !== undefined
            ? transportation || null
            : itineraryActivitie.transportation,

        estimated_cost:
          estimated_cost !== undefined
            ? estimated_cost === "" || estimated_cost === null
              ? null
              : Number(estimated_cost)
            : itineraryActivitie.estimated_cost,

        note: note !== undefined ? note || null : itineraryActivitie.note,
      },

      include: {
        itinerary: {
          select: {
            id: true,
            day_number: true,
            title: true,
            tour_id: true,
          },
        },

        destination: {
          select: {
            id: true,
            name: true,
            province: true,
            image: true,
          },
        },
      },
    });

    // =========================
    // 6. Response
    // =========================

    return res.status(200).json({
      success: true,

      message: "Cập nhật hoạt động thành công",

      data: {
        ...result,

        id: result.id.toString(),

        itinerary_id: result.itinerary_id.toString(),

        destination_id: result.destination_id
          ? result.destination_id.toString()
          : null,

        itinerary: {
          ...result.itinerary,

          id: result.itinerary.id.toString(),

          tour_id: result.itinerary.tour_id.toString(),
        },

        destination: result.destination
          ? {
              ...result.destination,

              id: result.destination.id.toString(),
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thứ tự, thời gian và phương tiện của các hoạt động
export const reorder = async (req, res, next) => {
  try {
    const itinerary_id = BigInt(req.params.id);
    const { activities } = req.body;

    // =====================================================
    // 1. Validate request
    // =====================================================

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách activities không hợp lệ",
      });
    }

    // =====================================================
    // 2. Kiểm tra itinerary
    // =====================================================

    const itinerary = await prisma.tour_itineraries.findFirst({
      where: {
        id: itinerary_id,
        deleted_at: null,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    // =====================================================
    // 3. Validate activity ID
    // =====================================================

    let activityIds;

    try {
      activityIds = activities.map((activity) => {
        return BigInt(activity.id);
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "ID activity không hợp lệ",
      });
    }

    // Không cho ID trùng
    const uniqueActivityIds = new Set(activityIds.map((id) => id.toString()));

    if (uniqueActivityIds.size !== activityIds.length) {
      return res.status(400).json({
        success: false,
        message: "Activity ID không được trùng nhau",
      });
    }

    // =====================================================
    // 4. Validate visit_order
    // =====================================================

    const visitOrders = [];

    for (const activity of activities) {
      const order = Number(activity.visit_order);

      if (!Number.isInteger(order) || order < 1) {
        return res.status(400).json({
          success: false,
          message: `visit_order của activity ${activity.id} không hợp lệ`,
        });
      }

      visitOrders.push(order);
    }

    const uniqueOrders = new Set(visitOrders);

    if (uniqueOrders.size !== visitOrders.length) {
      return res.status(400).json({
        success: false,
        message: "visit_order không được trùng nhau",
      });
    }

    // =====================================================
    // 5. Validate thời gian
    // =====================================================

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const activity of activities) {
      const startTime = activity.start_time;
      const endTime = activity.end_time;

      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({
          success: false,
          message: `start_time của activity ${activity.id} phải có dạng HH:mm`,
        });
      }

      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({
          success: false,
          message: `end_time của activity ${activity.id} phải có dạng HH:mm`,
        });
      }

      if (startTime && endTime) {
        const [startHour, startMinute] = startTime.split(":").map(Number);

        const [endHour, endMinute] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMinute;

        const endMinutes = endHour * 60 + endMinute;

        if (startMinutes >= endMinutes) {
          return res.status(400).json({
            success: false,
            message: `Thời gian activity ${activity.id} không hợp lệ: start_time phải nhỏ hơn end_time`,
          });
        }
      }
    }

    // =====================================================
    // 6. Kiểm tra activity thuộc itinerary
    // =====================================================

    const existingActivities = await prisma.itinerary_activities.findMany({
      where: {
        id: {
          in: activityIds,
        },
        itinerary_id: itinerary_id,
      },
      select: {
        id: true,
      },
    });

    if (existingActivities.length !== activities.length) {
      return res.status(404).json({
        success: false,
        message: "Có activity không tồn tại hoặc không thuộc lịch trình này",
      });
    }

    // =====================================================
    // 7. Transaction
    // =====================================================

    const result = await prisma.$transaction(async (tx) => {
      // -------------------------------------------------
      // BƯỚC 1:
      // Đưa toàn bộ activity về visit_order tạm thời
      //
      // Ví dụ:
      // A = 1
      // B = 2
      //
      // thành:
      // A = -1
      // B = -2
      //
      // để tránh đụng UNIQUE
      // -------------------------------------------------

      for (let i = 0; i < activityIds.length; i++) {
        await tx.itinerary_activities.update({
          where: {
            id: activityIds[i],
          },
          data: {
            visit_order: -(i + 1),
          },
        });
      }

      // -------------------------------------------------
      // BƯỚC 2:
      // Gán visit_order mới
      // -------------------------------------------------

      for (const activity of activities) {
        const updateData = {
          visit_order: Number(activity.visit_order),
        };

        // start_time
        if (Object.prototype.hasOwnProperty.call(activity, "start_time")) {
          updateData.start_time = activity.start_time
            ? new Date(`1970-01-01T${activity.start_time}:00.000Z`)
            : null;
        }

        // end_time
        if (Object.prototype.hasOwnProperty.call(activity, "end_time")) {
          updateData.end_time = activity.end_time
            ? new Date(`1970-01-01T${activity.end_time}:00.000Z`)
            : null;
        }

        // transportation
        if (Object.prototype.hasOwnProperty.call(activity, "transportation")) {
          updateData.transportation = activity.transportation || null;
        }

        await tx.itinerary_activities.update({
          where: {
            id: BigInt(activity.id),
          },
          data: updateData,
        });
      }

      // -------------------------------------------------
      // BƯỚC 3:
      // Lấy lại toàn bộ activity theo visit_order
      // -------------------------------------------------

      return await tx.itinerary_activities.findMany({
        where: {
          itinerary_id: itinerary_id,
        },
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              province: true,
              image: true,
            },
          },
        },
        orderBy: [
          {
            visit_order: "asc",
          },
          {
            id: "asc",
          },
        ],
      });
    });

    // =====================================================
    // 8. Format time
    // =====================================================

    const formatTime = (date) => {
      if (!date) return null;

      const hours = String(date.getUTCHours()).padStart(2, "0");

      const minutes = String(date.getUTCMinutes()).padStart(2, "0");

      return `${hours}:${minutes}`;
    };

    // =====================================================
    // 9. Convert BigInt
    // =====================================================

    const dataResult = result.map((activity) => ({
      id: activity.id.toString(),

      itinerary_id: activity.itinerary_id.toString(),

      destination_id: activity.destination_id
        ? activity.destination_id.toString()
        : null,

      visit_order: activity.visit_order,

      start_time: formatTime(activity.start_time),

      end_time: formatTime(activity.end_time),

      title: activity.title,

      description: activity.description,

      activity_type: activity.activity_type,

      transportation: activity.transportation,

      estimated_cost: activity.estimated_cost,

      note: activity.note,

      destination: activity.destination
        ? {
            ...activity.destination,
            id: activity.destination.id.toString(),
          }
        : null,
    }));

    // =====================================================
    // 10. Response
    // =====================================================

    return res.status(200).json({
      success: true,

      message: "Cập nhật thứ tự, thời gian và phương tiện hoạt động thành công",

      data: dataResult,
    });
  } catch (error) {
    next(error);
  }
};

// Xóa mềm hoạt động trong lịch trình
export const deleteSoftAtvici = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    await prisma.itinerary_activities.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Đã đưa hoạt động vào thùng rác",
    });
  } catch (error) {
    next(error);
  }
};
