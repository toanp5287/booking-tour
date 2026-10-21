import prisma from "../../config/postgres.js";

// Chuyển "HH:mm" sang chuẩn ISO DateTime cho cột @db.Time(0) của Prisma
const formatTimeToDate = (timeStr) => {
  if (!timeStr) return null;
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`1970-01-01T${time}Z`);
};

// CREATE TOUR SERVICE
export const createTourService = async (tourData) => {
  const {
    operator_id,
    category_id,
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
    thumbnail,
    galleryImages = [],
    schedules = [],
    destinations = [],
    itineraries = [],
  } = tourData;

  // =========================
  // 1. VALIDATE DATA
  // =========================
  if (!name?.trim()) {
    throw new Error("Tên tour không được để trống.");
  }

  if (!slug?.trim()) {
    throw new Error("Slug tour không được để trống.");
  }

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    throw new Error("Giá tour không hợp lệ.");
  }

  if (!Number.isInteger(Number(duration_days)) || Number(duration_days) < 1) {
    throw new Error("Số ngày của tour phải lớn hơn hoặc bằng 1.");
  }

  if (
    !Number.isInteger(Number(duration_nights)) ||
    Number(duration_nights) < 0
  ) {
    throw new Error("Số đêm của tour không hợp lệ.");
  }

  if (!Number.isInteger(Number(max_people)) || Number(max_people) < 1) {
    throw new Error("Số khách tối đa phải lớn hơn hoặc bằng 1.");
  }

  if (!Array.isArray(galleryImages)) {
    throw new Error("Danh sách ảnh tour không hợp lệ.");
  }

  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new Error("Tour phải có ít nhất một lịch khởi hành.");
  }

  if (!Array.isArray(destinations)) {
    throw new Error("Danh sách điểm đến không hợp lệ.");
  }

  if (!Array.isArray(itineraries)) {
    throw new Error("Danh sách lịch trình không hợp lệ.");
  }

  // =========================
  // 2. HELPER
  // =========================
  const toNumber = (value, fieldName, min = 0) => {
    const number = Number(value);

    if (!Number.isFinite(number) || number < min) {
      throw new Error(`${fieldName} không hợp lệ.`);
    }

    return number;
  };

  const toBigInt = (value, fieldName) => {
    try {
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        throw new Error();
      }

      return BigInt(value);
    } catch {
      throw new Error(`${fieldName} không hợp lệ.`);
    }
  };

  // Chuyển giờ HH:mm thành Date cho trường PostgreSQL @db.Time(0).
  // Giữ giờ theo UTC để tránh phụ thuộc múi giờ của server.
  const toTime = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new Error(`${fieldName} không hợp lệ.`);
      }

      return value;
    }

    const match = String(value).match(/^([01]\d|2[0-3]):([0-5]\d)$/);

    if (!match) {
      throw new Error(`${fieldName} phải có định dạng HH:mm.`);
    }

    return new Date(`1970-01-01T${match[1]}:${match[2]}:00.000Z`);
  };

  const toDate = (value, fieldName) => {
    if (!value) {
      throw new Error(`${fieldName} không được để trống.`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`${fieldName} không hợp lệ.`);
    }

    return date;
  };

  const optionalDate = (value, fieldName) => {
    if (!value) return null;
    return toDate(value, fieldName);
  };

  const optionalPrice = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    return toNumber(value, fieldName);
  };

  // =========================
  // 3. PREPARE TICKET TYPES
  // =========================
  // Giá chính của form được hiểu là giá vé người lớn.
  // Chỉ tạo vé trẻ em/em bé khi controller thực sự truyền giá.
  const adultPrice = toNumber(price, "Giá vé người lớn");

  const ticketTypes = [
    {
      tour_type: "SIC",
      category: "SINGLE",
      name: "Vé người lớn",
      code: "SIC_ADULT",
      description: "Vé dành cho người lớn",
      price: adultPrice,
      total_pax: 1,
      adult_pax: 1,
      child_pax: 0,
      infant_pax: 0,
      min_quantity: 1,
      max_quantity: Number(max_people),
      status: "active",
    },
  ];

  const childPrice = optionalPrice(child_price, "Giá vé trẻ em");

  if (childPrice !== null) {
    ticketTypes.push({
      tour_type: "SIC",
      category: "SINGLE",
      name: "Vé trẻ em",
      code: "SIC_CHILD",
      description: "Vé dành cho trẻ em",
      price: childPrice,
      total_pax: 1,
      adult_pax: 0,
      child_pax: 1,
      infant_pax: 0,
      min_quantity: 1,
      max_quantity: Number(max_people),
      status: "active",
    });
  }

  const infantPrice = optionalPrice(infant_price, "Giá vé em bé");

  if (infantPrice !== null) {
    ticketTypes.push({
      tour_type: "SIC",
      category: "SINGLE",
      name: "Vé em bé",
      code: "SIC_INFANT",
      description: "Vé dành cho em bé",
      price: infantPrice,
      total_pax: 1,
      adult_pax: 0,
      child_pax: 0,
      infant_pax: 1,
      min_quantity: 1,
      max_quantity: Number(max_people),
      status: "active",
    });
  }

  // =========================
  // 4. PREPARE SCHEDULES
  // =========================
  const scheduleData = schedules.map((schedule, index) => {
    const totalSlots = toNumber(
      schedule.total_slots,
      `Tổng số chỗ của lịch ${index + 1}`,
      1,
    );

    const availableSlots =
      schedule.available_slots === undefined ||
      schedule.available_slots === null ||
      schedule.available_slots === ""
        ? totalSlots
        : toNumber(
            schedule.available_slots,
            `Số chỗ còn lại của lịch ${index + 1}`,
          );

    if (availableSlots > totalSlots) {
      throw new Error(
        `Số chỗ còn lại của lịch ${index + 1} không được lớn hơn tổng số chỗ.`,
      );
    }

    const departureDate = toDate(
      schedule.departure_date,
      `Ngày khởi hành của lịch ${index + 1}`,
    );

    const returnDate = optionalDate(
      schedule.return_date,
      `Ngày về của lịch ${index + 1}`,
    );

    if (returnDate && returnDate < departureDate) {
      throw new Error(
        `Ngày về của lịch ${index + 1} không được trước ngày khởi hành.`,
      );
    }

    return {
      tour_type: "SIC",
      departure_date: departureDate,
      departure_time: toTime(
        schedule.departure_time,
        `Giờ khởi hành của lịch ${index + 1}`,
      ),
      return_date: returnDate,
      return_time: toTime(schedule.return_time, `Giờ về của lịch ${index + 1}`),
      total_slots: totalSlots,
      available_slots: availableSlots,
      is_private: false,
      custom_departure_allowed: false,
      status: schedule.status || "open",
    };
  });

  // =========================
  // 5. PREPARE DESTINATIONS
  // =========================
  const destinationData = destinations
    .filter(
      (destination) =>
        destination.destination_id !== undefined &&
        destination.destination_id !== null &&
        String(destination.destination_id).trim() !== "",
    )
    .map((destination, index) => ({
      destination_id: toBigInt(
        destination.destination_id,
        `ID điểm đến ${index + 1}`,
      ),
      day_number: toNumber(
        destination.day_number ?? 1,
        `Ngày ghé điểm đến ${index + 1}`,
        1,
      ),
      visit_order: toNumber(
        destination.visit_order ?? index + 1,
        `Thứ tự điểm đến ${index + 1}`,
        1,
      ),
    }));

  // =========================
  // 6. PREPARE ITINERARIES
  // =========================
  const itineraryData = itineraries.map((itinerary, index) => {
    const dayNumber = toNumber(
      itinerary.day_number,
      `Ngày lịch trình ${index + 1}`,
      1,
    );

    if (!itinerary.title?.trim()) {
      throw new Error(
        `Tiêu đề lịch trình ngày ${dayNumber} không được để trống.`,
      );
    }

    const activities = Array.isArray(itinerary.activities)
      ? itinerary.activities
      : [];

    return {
      day_number: dayNumber,
      title: itinerary.title.trim(),
      description: itinerary.description || null,

      activities: {
        create: activities.map((activity, activityIndex) => {
          if (!activity.title?.trim()) {
            throw new Error(
              `Tên hoạt động ${activityIndex + 1} của ngày ${dayNumber} không được để trống.`,
            );
          }

          const estimatedCost =
            activity.estimated_cost === undefined ||
            activity.estimated_cost === null ||
            activity.estimated_cost === ""
              ? null
              : toNumber(
                  activity.estimated_cost,
                  `Chi phí hoạt động ${activityIndex + 1}`,
                );

          return {
            destination_id:
              activity.destination_id !== undefined &&
              activity.destination_id !== null &&
              String(activity.destination_id).trim() !== ""
                ? toBigInt(
                    activity.destination_id,
                    `ID điểm đến của hoạt động ${activityIndex + 1}`,
                  )
                : null,

            title: activity.title.trim(),
            description: activity.description || null,
            activity_type: activity.activity_type || null,
            visit_order: toNumber(
              activity.visit_order ?? activityIndex + 1,
              `Thứ tự hoạt động ${activityIndex + 1}`,
              1,
            ),
            transportation: activity.transportation || null,
            start_time: toTime(
              activity.start_time,
              `Giờ bắt đầu hoạt động ${activityIndex + 1}`,
            ),
            end_time: toTime(
              activity.end_time,
              `Giờ kết thúc hoạt động ${activityIndex + 1}`,
            ),
            estimated_cost: estimatedCost,
            note: activity.note || null,
          };
        }),
      },
    };
  });

  // =========================
  // 7. CREATE TOUR + RELATIONS
  // =========================
  // Prisma nested create lưu tour và các quan hệ trong cùng một thao tác.
  return prisma.tours.create({
    data: {
      operator_id: toBigInt(operator_id, "Đơn vị tổ chức"),
      category_id: toBigInt(category_id, "Danh mục tour"),

      name: name.trim(),
      slug: slug.trim(),
      description: description || null,

      // Schema dùng base_price, không có trường price.
      base_price: adultPrice,

      duration_days: Number(duration_days),
      duration_nights: Number(duration_nights),
      max_people: Number(max_people),

      difficulty_level: difficulty_level || null,
      transportation: transportation || null,
      status: status || "active",
      thumbnail: thumbnail || null,

      // Schema có default supported_tour_types = [SIC].
      // Không ghi đè mặc định ở đây.

      ticket_types: {
        create: ticketTypes,
      },

      images: {
        create: galleryImages
          .filter((url) => typeof url === "string" && url.trim() !== "")
          .map((url, index) => ({
            image_url: url,
            sort_order: index + 1,
          })),
      },

      schedules: {
        create: scheduleData,
      },

      destinations: {
        create: destinationData,
      },

      itineraries: {
        create: itineraryData,
      },
    },

    include: {
      category: true,
      operator: true,
      ticket_types: true,
      images: true,
      schedules: true,

      destinations: {
        include: {
          destination: true,
        },
      },

      itineraries: {
        include: {
          activities: {
            include: {
              destination: true,
            },
          },
        },
      },
    },
  });
};
