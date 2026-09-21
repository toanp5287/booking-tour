import prisma from "../../config/postgres.js";

// Chuyển "HH:mm" sang chuẩn ISO DateTime cho cột @db.Time(0) của Prisma
const formatTimeToDate = (timeStr) => {
  if (!timeStr) return null;
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`1970-01-01T${time}Z`);
};

export const createTourService = async (tourData) => {
  const {
    operator_id,
    category_id,
    name,
    slug,
    description,
    price,
    duration_days,
    duration_nights,
    max_people,
    difficulty_level,
    transportation,
    status,
    thumbnail,
    galleryImages,
    schedules,
    destinations,
    itineraries,
  } = tourData;

  // Thực hiện Transaction lồng nhau (Nested Create)
  return await prisma.tours.create({
    data: {
      operator_id,
      category_id,
      name,
      slug,
      description,
      price,
      duration_days,
      duration_nights,
      max_people,
      difficulty_level,
      transportation,
      status,
      thumbnail,

      // 1. Lưu danh sách ảnh phụ (tour_images)
      images: {
        create: galleryImages.map((url, index) => ({
          image_url: url,
          sort_order: index + 1,
        })),
      },

      // 2. Lưu đợt khởi hành (tour_schedules)
      schedules: {
        create: schedules.map((sch) => ({
          departure_date: new Date(sch.departure_date),
          departure_time: formatTimeToDate(sch.departure_time),
          return_date: sch.return_date ? new Date(sch.return_date) : null,
          return_time: formatTimeToDate(sch.return_time),
          total_slots: Number(sch.total_slots),
          available_slots: Number(sch.available_slots ?? sch.total_slots),
          status: sch.status || "open",
        })),
      },

      // 3. Lưu điểm đến ghé thăm (tour_destinations)
      destinations: {
        create: destinations
          .filter((d) => d.destination_id)
          .map((dest, index) => ({
            destination_id: BigInt(dest.destination_id),
            day_number: Number(dest.day_number || 1),
            visit_order: Number(dest.visit_order || index + 1),
          })),
      },

      // 4. Lưu Lịch trình từng ngày & Các hoạt động (itineraries & activities)
      itineraries: {
        create: itineraries.map((it) => ({
          day_number: Number(it.day_number),
          title: it.title,
          description: it.description || null,
          activities: {
            create: (it.activities || []).map((act, actIdx) => ({
              destination_id: act.destination_id
                ? BigInt(act.destination_id)
                : null,
              title: act.title,
              description: act.description || null,
              activity_type: act.activity_type || null,
              visit_order: Number(act.visit_order || actIdx + 1),
              transportation: act.transportation || null,
              start_time: formatTimeToDate(act.start_time),
              end_time: formatTimeToDate(act.end_time),
              estimated_cost: Number(act.estimated_cost || 0),
              note: act.note || null,
            })),
          },
        })),
      },
    },
    include: {
      category: true,
      operator: true,
      images: true,
      schedules: true,
      destinations: {
        include: { destination: true },
      },
      itineraries: {
        include: {
          activities: {
            include: { destination: true },
          },
        },
      },
    },
  });
};
