import { PrismaClient, TourType, TicketCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanTourDataOnly() {
  console.log(
    "🧹 Đang dọn dữ liệu từ Tour trở xuống (GIỮ NGUYÊN Users & Phân quyền)..."
  );

  // ============================================================
  // 1. BOOKING & GIAO DỊCH
  // ============================================================
  await prisma.reviews.deleteMany();
  await prisma.refunds.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.payment_installments.deleteMany();
  await prisma.tickets.deleteMany();
  await prisma.booking_details.deleteMany();
  await prisma.booking_ticket_items.deleteMany();
  await prisma.booking_addons.deleteMany();
  await prisma.booking_coupons.deleteMany();
  await prisma.booking_status_histories.deleteMany();
  await prisma.bookings.deleteMany();
  await prisma.payment_holds.deleteMany();

  // ============================================================
  // 2. CHI TIẾT TOUR
  // ============================================================
  await prisma.itinerary_activities.deleteMany();
  await prisma.tour_itineraries.deleteMany();
  await prisma.tour_destinations.deleteMany();
  await prisma.tour_images.deleteMany();
  await prisma.tour_pickup_points.deleteMany();
  await prisma.ticket_types.deleteMany();
  await prisma.tour_pricing_tiers.deleteMany();
  await prisma.tour_addons.deleteMany();
  await prisma.tour_schedules.deleteMany();
  await prisma.custom_tour_requests.deleteMany();

  // ============================================================
  // 3. TOUR / DESTINATION / CATEGORY / COUPON
  // ============================================================
  await prisma.tours.deleteMany();
  await prisma.destinations.deleteMany();
  await prisma.categories.deleteMany();
  await prisma.coupons.deleteMany();

  console.log("✨ Đã dọn sạch dữ liệu Tour cũ thành công!\n");
}

async function main() {
  await cleanTourDataOnly();

  console.log("🚀 Đang nạp dữ liệu Tour mới theo Schema hiện tại...\n");

  // ============================================================
  // 1. NHÀ ĐIỀU HÀNH
  // ============================================================
  let operator = await prisma.tour_operators.findFirst();

  if (!operator) {
    const firstUser = await prisma.users.findFirst();

    if (!firstUser) {
      throw new Error(
        "❌ Database chưa có user. Hãy tạo ít nhất 1 user trước khi seed."
      );
    }

    operator = await prisma.tour_operators.create({
      data: {
        user_id: firstUser.id,
        company_name: "Việt Nam Discovery Travel",
        email: "contact@vietnamtravel.vn",
        phone: "02439999999",
        address: "Tầng 5, Tòa nhà Discovery, Ba Đình, Hà Nội",
        status: "active",
      },
    });
  }

  console.log(
    `📌 Nhà điều hành: "${operator.company_name}" - ID: ${operator.id}`
  );

  // ============================================================
  // 2. CATEGORIES
  // ============================================================
  const catBienDao = await prisma.categories.create({
    data: {
      name: "Du Lịch Biển Đảo",
      description: "Các hành trình nghỉ dưỡng biển đảo nhiệt đới",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      status: "active",
    },
  });

  const catMienBac = await prisma.categories.create({
    data: {
      name: "Khám Phá Miền Bắc",
      description: "Danh lam thắng cảnh và di sản văn hóa miền Bắc",
      image:
        "https://images.unsplash.com/photo-1528127269322-539801943592",
      status: "active",
    },
  });

  // ============================================================
  // 3. DESTINATIONS
  // ============================================================
  const destPhuQuoc = await prisma.destinations.create({
    data: {
      category_id: catBienDao.id,
      name: "Đảo Ngọc Phú Quốc",
      province: "Kiên Giang",
      address: "Thành phố Phú Quốc, Kiên Giang",
      description:
        "Sunset Town, Bãi Sao, Grand World và cáp treo Hòn Thơm",
      status: "active",
    },
  });

  const destHaLong = await prisma.destinations.create({
    data: {
      category_id: catMienBac.id,
      name: "Vịnh Hạ Long",
      province: "Quảng Ninh",
      address: "Thành phố Hạ Long, Quảng Ninh",
      description:
        "Kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá vôi kì vĩ",
      status: "active",
    },
  });

  // ============================================================
  // 4. TOUR PHÚ QUỐC
  //
  // Hỗ trợ:
  // SIC
  // PRIVATE
  // GROUP
  // CUSTOM
  // ============================================================
  const tourPhuQuoc = await prisma.tours.create({
    data: {
      operator_id: operator.id,
      category_id: catBienDao.id,

      name: "Phú Quốc 3N2Đ: Khám Phá Nam Đảo & Sunset Town",

      slug: `phu-quoc-3n2d-nam-dao-${Date.now()}`,

      description:
        "Trải nghiệm cáp treo Hòn Thơm, lặn biển ngắm san hô và check-in Cầu Hôn lãng mạn.",

      supported_tour_types: [
        TourType.SIC,
        TourType.PRIVATE,
        TourType.GROUP,
        TourType.CUSTOM,
      ],

      is_customizable: true,

      min_people: 1,
      max_people: 35,

      base_price: 850000,

      duration_days: 3,
      duration_nights: 2,

      transportation: "Xe du lịch đời mới & Cano 4 đảo",

      thumbnail:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef",

      status: "active",

      // ========================================================
      // ĐIỂM ĐÓN
      // ========================================================
      pickup_points: {
        create: [
          {
            name: "Sân bay Quốc tế Phú Quốc - Cột 5 Ga Đến",
            address: "Dương Tơ, Phú Quốc",
            pickup_time: new Date("1970-01-01T08:30:00Z"),
            surcharge: 0,
          },
          {
            name: "Khách sạn trung tâm Dương Đông",
            address: "Đường Trần Hưng Đạo, Dương Đông, Phú Quốc",
            pickup_time: new Date("1970-01-01T09:00:00Z"),
            surcharge: 0,
          },
          {
            name: "Khu vực Bãi Dài / Grand World",
            address: "Gành Dầu, Phú Quốc",
            pickup_time: new Date("1970-01-01T08:00:00Z"),
            surcharge: 100000,
          },
        ],
      },

      // ========================================================
      // VÉ
      // ========================================================
      ticket_types: {
        create: [
          // ----------------------------------------------------
          // SIC - VÉ LẺ
          // ----------------------------------------------------
          {
            tour_type: TourType.SIC,
            category: TicketCategory.SINGLE,

            name: "Vé Người Lớn Tiêu Chuẩn",
            code: "PQ_SIC_ADULT",

            description: "Khách từ 12 tuổi trở lên",

            price: 850000,

            total_pax: 1,
            adult_pax: 1,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: null,

            status: "active",
          },

          {
            tour_type: TourType.SIC,
            category: TicketCategory.SINGLE,

            name: "Vé Trẻ Em 5 - 11 tuổi",
            code: "PQ_SIC_CHILD",

            description: "Chiếm ghế cano và suất ăn riêng",

            price: 550000,

            total_pax: 1,
            adult_pax: 0,
            child_pax: 1,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: null,

            status: "active",
          },

          {
            tour_type: TourType.SIC,
            category: TicketCategory.SINGLE,

            name: "Vé Em Bé dưới 5 tuổi",
            code: "PQ_SIC_INFANT",

            description: "Ngồi cùng ghế với bố mẹ, miễn phí vé",

            price: 0,

            total_pax: 1,
            adult_pax: 0,
            child_pax: 0,
            infant_pax: 1,

            min_quantity: 1,
            max_quantity: null,

            status: "active",
          },

          // ----------------------------------------------------
          // SIC - GÓI GIA ĐÌNH
          // ----------------------------------------------------
          {
            tour_type: TourType.SIC,
            category: TicketCategory.PACKAGE,

            name: "Gói Gia Đình Nhỏ - 2 Lớn + 1 Trẻ",
            code: "PQ_SIC_FAMILY_3",

            description: "Gói dành cho gia đình 3 thành viên",

            price: 2100000,

            total_pax: 3,
            adult_pax: 2,
            child_pax: 1,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: null,

            status: "active",
          },

          {
            tour_type: TourType.SIC,
            category: TicketCategory.PACKAGE,

            name: "Gói Gia Đình Hạnh Phúc - 2 Lớn + 2 Trẻ",
            code: "PQ_SIC_FAMILY_4",

            description: "Gói gia đình 4 người, tiết kiệm 300.000đ",

            price: 2500000,

            total_pax: 4,
            adult_pax: 2,
            child_pax: 2,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: null,

            status: "active",
          },

          // ----------------------------------------------------
          // PRIVATE - GIA ĐÌNH / TOUR RIÊNG
          // ----------------------------------------------------
          {
            tour_type: TourType.PRIVATE,
            category: TicketCategory.PACKAGE,

            name: "Gói Gia Đình Riêng - 4 Người",
            code: "PQ_PRIVATE_FAMILY_4",

            description:
              "Tour riêng dành cho gia đình, không ghép khách ngoài",

            price: 4200000,

            total_pax: 4,
            adult_pax: 2,
            child_pax: 2,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 1,

            status: "active",
          },

          {
            tour_type: TourType.PRIVATE,
            category: TicketCategory.VEHICLE,

            name: "Thuê Xe Riêng 7 Chỗ",
            code: "PQ_PRIVATE_CAR_7",

            description: "Bao xe riêng 7 chỗ cho nhóm/gia đình",

            price: 1800000,

            total_pax: 7,
            adult_pax: 7,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 1,

            status: "active",
          },

          // ----------------------------------------------------
          // GROUP - TOUR ĐOÀN
          // ----------------------------------------------------
          {
            tour_type: TourType.GROUP,
            category: TicketCategory.GROUP_BLOCK,

            name: "Block Đoàn 10 Người",
            code: "PQ_GROUP_10",

            description:
              "Gói đoàn cố định dành cho nhóm từ 10 người",

            price: 7800000,

            total_pax: 10,
            adult_pax: 10,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 3,

            status: "active",
          },

          {
            tour_type: TourType.GROUP,
            category: TicketCategory.GROUP_BLOCK,

            name: "Block Đoàn 20 Người",
            code: "PQ_GROUP_20",

            description:
              "Gói đoàn 20 người dành cho công ty hoặc tổ chức",

            price: 14500000,

            total_pax: 20,
            adult_pax: 20,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 2,

            status: "active",
          },
        ],
      },

      // ========================================================
      // LỊCH SIC
      // ========================================================
      schedules: {
        create: [
          {
            tour_type: TourType.SIC,

            departure_date: new Date("2026-10-15"),
            departure_time: new Date("1970-01-01T07:30:00Z"),

            return_date: new Date("2026-10-17"),
            return_time: new Date("1970-01-01T17:30:00Z"),

            total_slots: 35,
            available_slots: 35,

            is_private: false,
            custom_departure_allowed: false,

            status: "open",
          },

          {
            tour_type: TourType.SIC,

            departure_date: new Date("2026-10-22"),
            departure_time: new Date("1970-01-01T07:30:00Z"),

            return_date: new Date("2026-10-24"),
            return_time: new Date("1970-01-01T17:30:00Z"),

            total_slots: 35,
            available_slots: 28,

            is_private: false,
            custom_departure_allowed: false,

            status: "open",
          },

          // ----------------------------------------------------
          // LỊCH PRIVATE
          // ----------------------------------------------------
          {
            tour_type: TourType.PRIVATE,

            departure_date: new Date("2026-10-20"),
            departure_time: new Date("1970-01-01T08:00:00Z"),

            return_date: new Date("2026-10-22"),
            return_time: new Date("1970-01-01T17:00:00Z"),

            total_slots: 7,
            available_slots: 7,

            is_private: true,
            custom_departure_allowed: true,

            status: "open",
          },

          // ----------------------------------------------------
          // LỊCH GROUP
          // ----------------------------------------------------
          {
            tour_type: TourType.GROUP,

            departure_date: new Date("2026-10-25"),
            departure_time: new Date("1970-01-01T07:30:00Z"),

            return_date: new Date("2026-10-27"),
            return_time: new Date("1970-01-01T17:30:00Z"),

            total_slots: 35,
            available_slots: 35,

            is_private: false,
            custom_departure_allowed: true,

            status: "open",
          },
        ],
      },

      // ========================================================
      // PRICING PRIVATE
      // ========================================================
      pricing_tiers: {
        create: [
          {
            tour_type: TourType.PRIVATE,

            tier_name: "Gia đình nhỏ",
            min_pax: 2,
            max_pax: 4,

            price_per_pax: 1100000,
            package_price: 4200000,
          },

          {
            tour_type: TourType.PRIVATE,

            tier_name: "Gia đình lớn",
            min_pax: 5,
            max_pax: 7,

            price_per_pax: 950000,
            package_price: 6650000,
          },
        ],
      },

      // ========================================================
      // LỊCH TRÌNH
      // ========================================================
      itineraries: {
        create: [
          {
            day_number: 1,

            title:
              "Ngày 1: Đón Sân Bay - Sunset Town & Cầu Hôn",

            description:
              "Check-in khách sạn, tham quan thị trấn Hoàng Hôn và xem biểu diễn nghệ thuật.",

            activities: {
              create: [
                {
                  title: "Đón tại điểm hẹn và ăn trưa",

                  visit_order: 1,

                  start_time:
                    new Date("1970-01-01T09:30:00Z"),

                  end_time:
                    new Date("1970-01-01T11:30:00Z"),
                },

                {
                  title: "Dạo chơi Cầu Hôn Kiss Bridge",

                  visit_order: 2,

                  start_time:
                    new Date("1970-01-01T16:00:00Z"),

                  end_time:
                    new Date("1970-01-01T18:00:00Z"),
                },
              ],
            },
          },

          {
            day_number: 2,

            title:
              "Ngày 2: Cano 4 Đảo & Cáp Treo Hòn Thơm",

            description:
              "Lặn biển ngắm san hô tại Hòn Mây Rút, vui chơi công viên nước Aquatopia.",
          },

          {
            day_number: 3,

            title:
              "Ngày 3: Bãi Sao - Grand World - Tiễn Sân Bay",

            description:
              "Tham quan Bãi Sao, mua sắm và kết thúc hành trình.",
          },
        ],
      },

      // ========================================================
      // DESTINATION CỦA TOUR
      // ========================================================
      destinations: {
        create: [
          {
            destination_id: destPhuQuoc.id,
            day_number: 1,
            visit_order: 1,
          },
        ],
      },
    },
  });

  // ============================================================
  // 5. TOUR HẠ LONG
  //
  // Hỗ trợ PRIVATE + GROUP
  // ============================================================
  const tourHaLong = await prisma.tours.create({
    data: {
      operator_id: operator.id,
      category_id: catMienBac.id,

      name:
        "Hạ Long 2N1Đ: Trải Nghiệm Du Thuyền 5 Sao Đẳng Cấp",

      slug:
        `ha-long-2n1d-du-thuyen-5sao-${Date.now()}`,

      description:
        "Kỳ nghỉ sang trọng trên du thuyền vịnh di sản, chèo thuyền kayak và tiệc buffet hải sản cao cấp.",

      supported_tour_types: [
        TourType.PRIVATE,
        TourType.GROUP,
      ],

      is_customizable: true,

      min_people: 2,
      max_people: 20,

      base_price: 2200000,

      duration_days: 2,
      duration_nights: 1,

      transportation:
        "Limousine Dcar & Du thuyền 5 sao",

      thumbnail:
        "https://images.unsplash.com/photo-1528127269322-539801943592",

      status: "active",

      // ========================================================
      // ĐIỂM ĐÓN
      // ========================================================
      pickup_points: {
        create: [
          {
            name: "Nhà hát Lớn Hà Nội",

            address:
              "Số 1 Tràng Tiền, Hoàn Kiếm, Hà Nội",

            pickup_time:
              new Date("1970-01-01T07:30:00Z"),

            surcharge: 0,
          },

          {
            name:
              "Cảng tàu khách quốc tế Tuần Châu",

            address:
              "Tuần Châu, TP. Hạ Long",

            pickup_time:
              new Date("1970-01-01T11:30:00Z"),

            surcharge: 0,
          },
        ],
      },

      // ========================================================
      // VÉ
      // ========================================================
      ticket_types: {
        create: [
          // ----------------------------------------------------
          // PRIVATE - PACKAGE
          // ----------------------------------------------------
          {
            tour_type: TourType.PRIVATE,
            category: TicketCategory.PACKAGE,

            name:
              "Gói Gia Đình VIP - 2 Lớn + 1 Trẻ",

            code: "HL_PRIVATE_FAMILY_3",

            description:
              "Phòng Family Suite có ban công riêng",

            price: 5200000,

            total_pax: 3,
            adult_pax: 2,
            child_pax: 1,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 1,

            status: "active",
          },

          // ----------------------------------------------------
          // PRIVATE - VEHICLE
          // ----------------------------------------------------
          {
            tour_type: TourType.PRIVATE,
            category: TicketCategory.VEHICLE,

            name:
              "Bao Trọn Du Thuyền Riêng",

            code: "HL_PRIVATE_CHARTER",

            description:
              "Bao trọn du thuyền cho gia đình hoặc nhóm riêng, tối đa 12 khách",

            price: 24000000,

            total_pax: 12,
            adult_pax: 12,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 1,

            status: "active",
          },

          // ----------------------------------------------------
          // GROUP
          // ----------------------------------------------------
          {
            tour_type: TourType.GROUP,
            category: TicketCategory.GROUP_BLOCK,

            name: "Block Đoàn 10 Người",

            code: "HL_GROUP_10",

            description:
              "Gói du thuyền dành cho đoàn 10 khách",

            price: 19000000,

            total_pax: 10,
            adult_pax: 10,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 2,

            status: "active",
          },

          {
            tour_type: TourType.GROUP,
            category: TicketCategory.GROUP_BLOCK,

            name: "Block Đoàn 20 Người",

            code: "HL_GROUP_20",

            description:
              "Gói du thuyền dành cho đoàn doanh nghiệp tối đa 20 khách",

            price: 36000000,

            total_pax: 20,
            adult_pax: 20,
            child_pax: 0,
            infant_pax: 0,

            min_quantity: 1,
            max_quantity: 1,

            status: "active",
          },
        ],
      },

      // ========================================================
      // SCHEDULE PRIVATE + GROUP
      // ========================================================
      schedules: {
        create: [
          {
            tour_type: TourType.PRIVATE,

            departure_date:
              new Date("2026-10-18"),

            departure_time:
              new Date("1970-01-01T08:00:00Z"),

            return_date:
              new Date("2026-10-19"),

            return_time:
              new Date("1970-01-01T16:00:00Z"),

            total_slots: 20,
            available_slots: 20,

            is_private: true,
            custom_departure_allowed: true,

            status: "open",
          },

          // ----------------------------------------------------
          // GROUP
          // ----------------------------------------------------
          {
            tour_type: TourType.GROUP,

            departure_date:
              new Date("2026-10-30"),

            departure_time:
              new Date("1970-01-01T08:00:00Z"),

            return_date:
              new Date("2026-10-31"),

            return_time:
              new Date("1970-01-01T16:00:00Z"),

            total_slots: 20,
            available_slots: 20,

            is_private: false,
            custom_departure_allowed: true,

            status: "open",
          },
        ],
      },

      // ========================================================
      // PRICING PRIVATE + GROUP
      // ========================================================
      pricing_tiers: {
        create: [
          {
            tour_type: TourType.PRIVATE,

            tier_name: "Nhóm nhỏ",

            min_pax: 2,
            max_pax: 4,

            price_per_pax: 2200000,
            package_price: 8800000,
          },

          {
            tour_type: TourType.PRIVATE,

            tier_name: "Nhóm gia đình",

            min_pax: 5,
            max_pax: 8,

            price_per_pax: 1900000,
            package_price: 15200000,
          },

          {
            tour_type: TourType.GROUP,

            tier_name: "Đoàn tiêu chuẩn",

            min_pax: 10,
            max_pax: 15,

            price_per_pax: 1750000,
            package_price: 26250000,
          },

          {
            tour_type: TourType.GROUP,

            tier_name: "Đoàn lớn",

            min_pax: 16,
            max_pax: 20,

            price_per_pax: 1600000,
            package_price: 32000000,
          },
        ],
      },

      // ========================================================
      // LỊCH TRÌNH
      // ========================================================
      itineraries: {
        create: [
          {
            day_number: 1,

            title:
              "Ngày 1: Hà Nội - Tuần Châu - Du Thuyền",

            description:
              "Khởi hành từ Hà Nội, lên du thuyền và khám phá vịnh Hạ Long.",

            activities: {
              create: [
                {
                  title:
                    "Đón khách tại Nhà hát Lớn Hà Nội",

                  visit_order: 1,

                  start_time:
                    new Date("1970-01-01T07:30:00Z"),

                  end_time:
                    new Date("1970-01-01T08:00:00Z"),
                },

                {
                  title:
                    "Check-in du thuyền",

                  visit_order: 2,

                  start_time:
                    new Date("1970-01-01T11:30:00Z"),

                  end_time:
                    new Date("1970-01-01T12:30:00Z"),
                },
              ],
            },
          },

          {
            day_number: 2,

            title:
              "Ngày 2: Kayak - Buffet - Về Hà Nội",

            description:
              "Chèo kayak, ăn trưa trên du thuyền và kết thúc hành trình.",
          },
        ],
      },

      // ========================================================
      // DESTINATION CỦA TOUR
      // ========================================================
      destinations: {
        create: [
          {
            destination_id: destHaLong.id,
            day_number: 1,
            visit_order: 1,
          },
        ],
      },
    },
  });

  // ============================================================
  // 6. COUPONS
  // ============================================================
  await prisma.coupons.createMany({
    data: [
      {
        code: "SUMMER2026",

        title: "Chào hè rực rỡ - Giảm 10%",

        discount_type: "percentage",

        discount_value: 10,

        min_order_value: 2000000,

        max_discount: 500000,

        usage_limit: 100,

        used_count: 5,

        start_date:
          new Date("2026-05-01"),

        end_date:
          new Date("2026-12-31"),

        status: "active",
      },

      {
        code: "FAMILY500K",

        title: "Ưu đãi gói gia đình",

        discount_type: "fixed_amount",

        discount_value: 500000,

        min_order_value: 3000000,

        max_discount: null,

        usage_limit: 50,

        used_count: 2,

        start_date:
          new Date("2026-01-01"),

        end_date:
          new Date("2026-12-31"),

        status: "active",
      },

      {
        code: "GROUP10",

        title: "Ưu đãi khách đoàn",

        discount_type: "percentage",

        discount_value: 8,

        min_order_value: 10000000,

        max_discount: 1500000,

        usage_limit: 30,

        used_count: 0,

        start_date:
          new Date("2026-01-01"),

        end_date:
          new Date("2026-12-31"),

        status: "active",
      },
    ],
  });

  // ============================================================
  // 7. CUSTOM TOUR REQUEST DEMO
  // ============================================================
  const firstUser = await prisma.users.findFirst();

  if (firstUser) {
    await prisma.custom_tour_requests.create({
      data: {
        user_id: firstUser.id,

        tour_id: tourPhuQuoc.id,

        company_name: null,

        contact_name: firstUser.full_name,

        contact_phone:
          firstUser.phone || "0900000000",

        contact_email: firstUser.email,

        estimated_pax: 12,

        departure_date:
          new Date("2026-11-10"),

        duration_days: 4,

        budget_per_pax: 3000000,

        special_requirements:
          "Gia đình muốn có lịch trình riêng, ưu tiên xe riêng và khách sạn gần biển.",

        status: "pending",

        quotation_amount: null,

        quotation_notes: null,

        quoted_at: null,
      },
    });
  }

  // ============================================================
  // 8. THÔNG BÁO KẾT QUẢ
  // ============================================================
  console.log("\n🎉 ================================");
  console.log("🎉 SEED TOUR HOÀN TẤT");
  console.log("🎉 ================================\n");

  console.log(`📌 Tour 1: ${tourPhuQuoc.name}`);
  console.log(
    "   → Hỗ trợ: SIC + PRIVATE + GROUP + CUSTOM"
  );

  console.log(`\n📌 Tour 2: ${tourHaLong.name}`);
  console.log("   → Hỗ trợ: PRIVATE + GROUP");

  console.log("\n📦 Dữ liệu mẫu:");
  console.log("   → SIC: Vé lẻ + Package");
  console.log("   → PRIVATE: Package + Vehicle");
  console.log("   → GROUP: Group Block");
  console.log("   → CUSTOM: Custom Tour Request");
  console.log("   → Pricing tiers: PRIVATE + GROUP");
  console.log("   → Schedule: SIC + PRIVATE + GROUP");
  console.log("   → Coupons: 3 mã giảm giá");

  console.log(
    "\n🔐 Users / Roles / Permissions / Wallets được giữ nguyên."
  );
}

main()
  .catch((e) => {
    console.error("\n❌ LỖI SEED:");
    console.error(e);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });