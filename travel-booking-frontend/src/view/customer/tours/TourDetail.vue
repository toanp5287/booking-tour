<script setup>
import { ref, computed, watch } from "vue";
import TourInfo from "../../../components/tour/TourInfo.vue";
import TourReview from "../../../components/tour/TourReview.vue";
import TourSchedule from "../../../components/tour/TourSchedule.vue";
import tourService from "../../../services/tour.service.js";
import { useRoute, useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { useBookingStore } from "../../../stores/booking.js";
import Swal from "sweetalert2";


const showGroupRequest = ref(false);

function createEmptyGroupRequestForm() {
  return {
    company_name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    estimated_pax: 20,
    departure_date: '',
    duration_days: 3,
    budget_per_pax: '',
    special_requirements: '',
  };
}

const groupRequestForm = ref(createEmptyGroupRequestForm());

const submittingGroupRequest = ref(false);
const groupRequestMessage = ref('');
const groupRequestError = ref(false);

const yeucauTourDoan = async () => {
  if (submittingGroupRequest.value) return;

  const contactName = groupRequestForm.value.contact_name?.trim();
  const contactPhone = groupRequestForm.value.contact_phone?.trim();
  const contactEmail = groupRequestForm.value.contact_email?.trim();
  const estimatedPax = Number(groupRequestForm.value.estimated_pax);
  const departureDate = groupRequestForm.value.departure_date;

  groupRequestMessage.value = '';
  groupRequestError.value = false;

  if (!contactName || !contactPhone || !contactEmail) {
    groupRequestError.value = true;
    groupRequestMessage.value =
      'Vui lòng nhập đầy đủ họ tên, số điện thoại và email liên hệ.';
    return;
  }

  if (!Number.isInteger(estimatedPax) || estimatedPax < 1) {
    groupRequestError.value = true;
    groupRequestMessage.value =
      'Tổng số người tham gia phải là số nguyên lớn hơn 0.';
    return;
  }

  if (!departureDate) {
    groupRequestError.value = true;
    groupRequestMessage.value = 'Vui lòng chọn ngày khởi hành dự kiến.';
    return;
  }

  submittingGroupRequest.value = true;

  try {
    const payload = {
      ...groupRequestForm.value,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      estimated_pax: estimatedPax,
      tour_id: route.params.id ? String(route.params.id) : undefined,
      duration_days: groupRequestForm.value.duration_days
        ? Number(groupRequestForm.value.duration_days)
        : undefined,
      budget_per_pax: groupRequestForm.value.budget_per_pax
        ? Number(groupRequestForm.value.budget_per_pax)
        : undefined,
    };

    const response = await tourService.tourDoan(payload);

    // Chỉ thông báo thành công sau khi backend xác nhận đã lưu.
    groupRequestError.value = false;
    groupRequestMessage.value =
      response?.data?.message || 'Gửi yêu cầu báo giá tour đoàn thành công!';

    await Swal.fire({
      icon: 'success',
      title: 'Thành công!',
      text: groupRequestMessage.value,
      confirmButtonText: 'Đóng',
    });

    // Đóng form và xóa dữ liệu cũ sau khi gửi thành công
    showGroupRequest.value = false;
    groupRequestForm.value = createEmptyGroupRequestForm();
    groupRequestMessage.value = '';
  } catch (error) {
    console.error('Lỗi gửi yêu cầu tour đoàn:', error);

    groupRequestError.value = true;
    groupRequestMessage.value =
      error?.response?.data?.message ||
      'Không thể gửi yêu cầu tour đoàn. Vui lòng thử lại!';

    await Swal.fire({
      icon: 'error',
      title: 'Thất bại!',
      text: groupRequestMessage.value,
      confirmButtonText: 'Đóng',
    });
  } finally {
    submittingGroupRequest.value = false;
  }
};


const today = computed(() => {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
});

const route = useRoute();
const router = useRouter();

const id = route.params.id;

const bookingStore = useBookingStore();

bookingStore.setBooking({
  tour_id: id,
});

// ============================================================
// 1. LẤY CHI TIẾT TOUR
// ============================================================

const {
  data: tourDetailData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["tourDetail", id],

  queryFn: async () => {
    const result = await tourService.getOne(id);

    console.log("CHI TIẾT TOUR:", result.data);

    return result.data.data;
  },

  staleTime: 5 * 60 * 1000,
});

// ============================================================
// 2. FORMAT
// ============================================================

const formatPrice = (price) => {
  return Number(price || 0).toLocaleString("vi-VN") + "₫";
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("vi-VN");
};

const getTourImage = (path) => {
  if (!path) return "/hero-bg.jpg";

  if (path.startsWith("http")) {
    return path;
  }

  const cleanPath = path.replaceAll("\\", "/");

  return `http://localhost:8080/${cleanPath}`;
};

const getStatusText = (status) => {
  if (status === "active") return "Đang mở bán";

  if (status === "inactive") return "Tạm ngừng";

  return "Đang cập nhật";
};

// ============================================================
// 3. LOẠI TOUR
// ============================================================

const currentTourType = ref("SIC");

const tourTypeTabs = [
  {
    key: "SIC",
    label: "Tour Ghép Lẻ",
    icon: "👥",
    desc: "Tiết kiệm chi phí, khởi hành theo lịch",
  },

  {
    key: "PRIVATE",
    label: "Gia Đình / Riêng",
    icon: "🏡",
    desc: "Xe riêng, không ghép khách ngoài",
  },

  {
    key: "GROUP",
    label: "Tour Đoàn / B2B",
    icon: "🏢",
    desc: "Ưu đãi theo quy mô đoàn đông",
  },

  {
    key: "CUSTOM",
    label: "Thiết Kế Riêng",
    icon: "✨",
    desc: "Lịch trình & dịch vụ theo ý muốn",
  },
];

// ============================================================
// 4. STATE
//
// Khai báo toàn bộ ref trước các watch immediate
// để tránh lỗi:
// Cannot access 'selectedSchedule' before initialization
// ============================================================

const selectedTickets = ref({});

const selectedSchedule = ref("");

const schedules = ref([]);

// ============================================================
// 5. LOẠI TOUR MÀ TOUR HỖ TRỢ
// ============================================================

const supportedTourTypes = computed(() => {
  return tourDetailData.value?.supported_tour_types || [];
});

const availableTourTypeTabs = computed(() => {
  return tourTypeTabs.filter((tab) =>
    supportedTourTypes.value.includes(tab.key),
  );
});

// ============================================================
// 6. TỰ CHỌN LOẠI TOUR
// ============================================================

watch(
  () => tourDetailData.value?.supported_tour_types,

  (types) => {
    if (!Array.isArray(types) || types.length === 0) {
      return;
    }

    if (!types.includes(currentTourType.value)) {
      currentTourType.value = types[0];
    }
  },

  {
    immediate: true,
  },
);

// ============================================================
// 7. LẤY VÉ THEO LOẠI TOUR
// ============================================================

const filteredTicketTypes = computed(() => {
  const tickets = tourDetailData.value?.ticket_types || [];

  const result = tickets.filter(
    (ticket) => ticket.tour_type === currentTourType.value,
  );
  console.log(result);
  return result;
});

// ============================================================
// 8. KHI ĐỔI LOẠI TOUR
// ============================================================

watch(
  currentTourType,

  () => {
    // Xóa vé cũ
    selectedTickets.value = {};

    // Xóa lịch cũ
    selectedSchedule.value = "";

    // Chọn vé đầu tiên nếu có
    const firstTicket = filteredTicketTypes.value[0];

    if (firstTicket) {
      selectedTickets.value[firstTicket.id] = 1;
    }
  },

  {
    immediate: true,
  },
);

// ============================================================
// 9. LẤY LỊCH KHỞI HÀNH
// ============================================================

const getDetailSchedule = async (idTour) => {
  try {
    const response = await tourService.getSchedulesByTour(idTour);

    console.log("API LỊCH TOUR:", response.data);

    schedules.value = response.data.data || [];

    console.log("LỊCH TOUR SAU KHI GÁN:", schedules.value);
  } catch (error) {
    console.error("Lỗi lấy lịch khởi hành:", error);

    schedules.value = [];
  }
};
getDetailSchedule(id);

// ============================================================
// 10. LỌC LỊCH THEO LOẠI TOUR
// ============================================================

const filteredSchedules = computed(() => {
  console.log("currentTourType:", currentTourType.value);

  console.log(
    "TOUR TYPES:",
    schedules.value.map((schedule) => ({
      id: schedule.id,
      tour_type: schedule.tour_type,
      departure_date: schedule.departure_date,
    })),
  );

  const result = schedules.value.filter(
    (schedule) => schedule.tour_type === currentTourType.value,
  );

  console.log("KẾT QUẢ LỌC:", result);

  return result;
});

// ============================================================
// 11. KIỂM TRA SCHEDULE ĐANG CHỌN
// ============================================================

watch(
  filteredSchedules,

  (newSchedules) => {
    const currentExists = newSchedules.some(
      (schedule) => String(schedule.id) === String(selectedSchedule.value),
    );

    if (!currentExists) {
      selectedSchedule.value = "";
    }
  },

  {
    immediate: true,
  },
);

// ============================================================
// 12. SCHEDULE ĐANG CHỌN
// ============================================================

const selectedScheduleData = computed(() => {
  return filteredSchedules.value.find(
    (schedule) => String(schedule.id) === String(selectedSchedule.value),
  );
});

// ============================================================
// 13. TỔNG SỐ NGƯỜI
// ============================================================

const totalPeople = computed(() => {
  return filteredTicketTypes.value.reduce(
    (sum, item) => {
      const quantity = selectedTickets.value[item.id] || 0;

      return sum + quantity * Number(item.total_pax || 0);
    },

    0,
  );
});

// ============================================================
// 14. PHÂN LOẠI KHÁCH
// ============================================================

const paxBreakdown = computed(() => {
  let adult = 0;
  let child = 0;
  let infant = 0;

  filteredTicketTypes.value.forEach((item) => {
    const quantity = selectedTickets.value[item.id] || 0;

    adult += quantity * Number(item.adult_pax || 0);

    child += quantity * Number(item.child_pax || 0);

    infant += quantity * Number(item.infant_pax || 0);
  });

  return {
    adult,
    child,
    infant,
  };
});

// ============================================================
// 15. KIỂM TRA CHỖ TRỐNG
// ============================================================

const checkAvailableSlots = (additionalPax = 1) => {
  if (!selectedSchedule.value) {
    Swal.fire({
      icon: "warning",
      title: "Chưa chọn ngày khởi hành!",
      text: "Vui lòng chọn ngày đi trước khi thêm vé.",
      confirmButtonText: "Đã hiểu",

      customClass: {
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold",
      },

      buttonsStyling: false,
    });

    return false;
  }

  const availableSlots = Number(
    selectedScheduleData.value?.available_slots || 0,
  );

  if (totalPeople.value + additionalPax > availableSlots) {
    Swal.fire({
      icon: "warning",
      title: "Không đủ chỗ!",

      text:
        `Chuyến này chỉ còn ${availableSlots} chỗ. ` +
        `Gói bạn chọn yêu cầu thêm ${additionalPax} chỗ.`,

      confirmButtonText: "Đã hiểu",

      customClass: {
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold",
      },

      buttonsStyling: false,
    });

    return false;
  }

  // Kiểm tra giới hạn max_people của tour
  const maxPeople = Number(tourDetailData.value?.max_people || 0);

  if (maxPeople > 0 && totalPeople.value + additionalPax > maxPeople) {
    Swal.fire({
      icon: "warning",
      title: "Vượt quá số người tối đa!",
      text: `Tour này chỉ nhận tối đa ${maxPeople} khách.`,
      confirmButtonText: "Đã hiểu",

      customClass: {
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold",
      },

      buttonsStyling: false,
    });

    return false;
  }

  return true;
};

// ============================================================
// 16. TĂNG VÉ
// ============================================================

const increaseTicket = (ticket) => {
  const currentQuantity = selectedTickets.value[ticket.id] || 0;

  // Kiểm tra max_quantity
  if (
    ticket.max_quantity !== null &&
    ticket.max_quantity !== undefined &&
    currentQuantity >= Number(ticket.max_quantity)
  ) {
    Swal.fire({
      icon: "warning",
      title: "Đã đạt giới hạn!",
      text: `Gói này chỉ được chọn tối đa ` + `${ticket.max_quantity} lần.`,

      confirmButtonText: "Đã hiểu",

      customClass: {
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold",
      },

      buttonsStyling: false,
    });

    return;
  }

  if (checkAvailableSlots(Number(ticket.total_pax || 1))) {
    selectedTickets.value[ticket.id] = currentQuantity + 1;
  }
};

// ============================================================
// 17. GIẢM VÉ
// ============================================================

const decreaseTicket = (ticket) => {
  const current = selectedTickets.value[ticket.id] || 0;

  if (current <= 0) {
    return;
  }

  const minQuantity = Number(ticket.min_quantity || 0);

  const newQuantity = current - 1;

  if (newQuantity < minQuantity) {
    selectedTickets.value[ticket.id] = 0;
    return;
  }

  selectedTickets.value[ticket.id] = newQuantity;
};

// ============================================================
// 18. TÍNH TIỀN
// ============================================================

const voucherDiscount = ref(0);

const voucherCode = ref("");

const subtotalTickets = computed(() => {
  return filteredTicketTypes.value.reduce(
    (sum, item) => {
      const quantity = selectedTickets.value[item.id] || 0;

      return sum + quantity * Number(item.price || 0);
    },

    0,
  );
});

const totalPrice = computed(() => {
  const total = subtotalTickets.value - voucherDiscount.value;

  return total > 0 ? total : 0;
});

// ============================================================
// 19. CUSTOM TOUR
// ============================================================

const customForm = ref({
  contact_name: "",
  contact_phone: "",
  estimated_pax: 15,
  departure_date: "",
  requirements: "",
});

const handleCustomRequest = async () => {
  if (!customForm.value.contact_name || !customForm.value.contact_phone) {
    Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng nhập họ tên và số điện thoại liên hệ!",
    });

    return;
  }

  if (!customForm.value.departure_date) {
    Swal.fire({
      icon: "warning",
      title: "Chưa chọn ngày đi",
      text: "Vui lòng chọn ngày dự kiến khởi hành!",
    });

    return;
  }

  if (
    !customForm.value.estimated_pax ||
    Number(customForm.value.estimated_pax) < 1
  ) {
    Swal.fire({
      icon: "warning",
      title: "Số người không hợp lệ",
      text: "Số người dự kiến phải lớn hơn hoặc bằng 1.",
    });

    return;
  }

  // Chưa gọi API custom_tour_requests
  // vì endpoint/service chưa được xác định
  Swal.fire({
    icon: "success",
    title: "Đã gửi yêu cầu!",

    text: "Bộ phận điều hành sẽ liên hệ lại và gửi báo giá chi tiết trong vòng 2 giờ.",

    confirmButtonText: "Tuyệt vời",

    customClass: {
      confirmButton:
        "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold",
    },

    buttonsStyling: false,
  });
};

// ============================================================
// 20. BOOKING
// ============================================================

const booking = async (tourId) => {
  const user = localStorage.getItem("user");

  if (!user) {
    const result = await Swal.fire({
      icon: "info",
      title: "Đăng nhập để tiếp tục ✈️",

      text: "Bạn cần đăng nhập để đặt tour và quản lý vé.",

      showCancelButton: true,

      confirmButtonText: "Đăng nhập ngay",

      cancelButtonText: "Để sau",

      reverseButtons: true,

      customClass: {
        confirmButton:
          "bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold",

        cancelButton:
          "bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold",
      },

      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      router.push("/login");
    }

    return;
  }

  if (!selectedSchedule.value) {
    Swal.fire({
      icon: "warning",
      title: "Chưa chọn lịch!",
      text: "Vui lòng chọn ngày khởi hành trước khi đặt.",
    });

    return;
  }

  // ----------------------------------------------------------
  // Chưa chọn vé
  // ----------------------------------------------------------

  if (totalPeople.value <= 0) {
    Swal.fire({
      icon: "warning",
      title: "Chưa chọn vé!",
      text: "Vui lòng chọn ít nhất 1 vé hoặc gói tour.",
    });

    return;
  }

  // ----------------------------------------------------------
  // Kiểm tra schedule
  // ----------------------------------------------------------

  const availableSlots = Number(
    selectedScheduleData.value?.available_slots || 0,
  );

  if (totalPeople.value > availableSlots) {
    Swal.fire({
      icon: "warning",
      title: "Không đủ chỗ!",
      text: `Chuyến này chỉ còn ${availableSlots} chỗ trống.`,
    });

    return;
  }

  // ----------------------------------------------------------
  // Tạo ticket items
  // ----------------------------------------------------------

  const ticketItemsPayload = filteredTicketTypes.value

    .filter((ticket) => (selectedTickets.value[ticket.id] || 0) > 0)

    .map((ticket) => {
      const quantity = selectedTickets.value[ticket.id];

      return {
        ticket_type_id: ticket.id,

        ticket_name: ticket.name,

        quantity: quantity,

        unit_price: Number(ticket.price),

        total_price: quantity * Number(ticket.price),

        pax_per_item: Number(ticket.total_pax || 0),
      };
    });

  // ----------------------------------------------------------
  // LƯU BOOKING
  //
  // Schema mới:
  // selected_tour_type
  //
  // Không dùng:
  // booking_type
  // ----------------------------------------------------------

  bookingStore.setBooking({
    tour_id: tourId,

    schedule_id: selectedSchedule.value,

    selected_tour_type: currentTourType.value,

    total_people: totalPeople.value,

    adult_count: paxBreakdown.value.adult,

    child_count: paxBreakdown.value.child,

    infant_count: paxBreakdown.value.infant,

    total_amount: totalPrice.value,

    voucher_code: voucherCode.value || null,

    ticket_items: ticketItemsPayload,
  });

  console.log("BOOKING DATA:", bookingStore.booking);

  router.push("/booking");
};
</script>


<template>
  <!-- LOADING -->
  <div
    v-if="isLoading"
    class="customer-redesign fixed inset-0 z-[999] flex items-center justify-center bg-[#F8FAFC]"
  >
    <div
      class="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
    ></div>
  </div>

  <!-- ERROR -->
  <div
    v-else-if="isError || !tourDetailData"
    class="customer-redesign flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5 text-slate-900"
  >
    <div class="text-center">
      <div class="text-5xl">😢</div>
      <h2 class="mt-4 text-2xl font-bold">Không tìm thấy tour</h2>

      <RouterLink
        to="/tours"
        class="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900"
      >
        Quay lại danh sách
      </RouterLink>
    </div>
  </div>

  <!-- MAIN -->
  <div v-else>
    <!-- BACKGROUND -->
    <div class="customer-atmosphere fixed inset-0 -z-10 overflow-hidden">
      <img
        src="/hero-bg.jpg"
        alt="Background"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-slate-950/25"></div>
      <div
        class="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/25 to-transparent"
      ></div>
    </div>

    <main class="customer-redesign relative pt-20 text-white">
      <!-- BREADCRUMB -->
      <section class="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10">
        <div class="flex items-center gap-2 text-xs font-medium text-white/70">
          <RouterLink to="/" class="hover:text-white">Trang chủ</RouterLink>
          <span class="text-white/40">/</span>
          <RouterLink to="/tours" class="hover:text-white">Tour</RouterLink>
          <span class="text-white/40">/</span>
          <span class="font-semibold text-white">
            {{ tourDetailData.name }}
          </span>
        </div>
      </section>

      <!-- TOUR HEADER -->
      <section class="mx-auto max-w-7xl px-5 pt-7 sm:px-8 lg:px-10">
        <div
          class="overflow-hidden rounded-[30px] border border-white/15 bg-black/25 shadow-2xl backdrop-blur-xl"
        >
          <div class="relative h-[360px] sm:h-[450px]">
            <img
              :src="getTourImage(tourDetailData.thumbnail)"
              :alt="tourDetailData.name"
              class="h-full w-full object-cover"
            />

            <div
              class="tour-hero-overlay absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent"
            ></div>

            <div
              class="tour-hero-content absolute bottom-7 left-6 right-6 sm:left-9 sm:right-9"
            >
              <span
                class="rounded-full bg-blue-600/80 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md"
              >
                {{ getStatusText(tourDetailData.status) }}
              </span>

              <h1
                class="mt-3 text-3xl font-bold leading-tight text-white sm:text-5xl"
              >
                {{ tourDetailData.name }}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT -->
      <section
        class="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_450px] lg:px-10"
      >
        <!-- LEFT: TOUR INFORMATION -->
        <div class="space-y-7">
          <section
            class="rounded-[26px] border border-white/10 bg-black/25 p-6 backdrop-blur-xl sm:p-8"
          >
            <h2 class="text-2xl font-bold text-white">
              Giới thiệu chuyến đi
            </h2>

            <p class="mt-4 text-sm leading-7 text-white/75">
              {{
                tourDetailData.description ||
                "Chưa có mô tả chi tiết cho tour này."
              }}
            </p>
          </section>

          <TourInfo :tour="tourDetailData" />
          <TourSchedule :itineraries="tourDetailData.itineraries" />
          <TourReview :idTour="tourDetailData.id" />
        </div>

        <!-- RIGHT: BOOKING SIDEBAR -->
        <aside class="lg:sticky lg:top-[100px] lg:self-start">
          <div
            class="overflow-hidden rounded-[28px] border border-white/20 bg-black/60 p-6 shadow-2xl backdrop-blur-2xl"
          >
            <!-- PRICE -->
            <div class="border-b border-white/10 pb-4">
              <div
                class="text-xs font-semibold uppercase tracking-widest text-white/60"
              >
                Giá tham khảo từ
              </div>

              <div class="mt-1 flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-white">
                  {{ formatPrice(tourDetailData.base_price || 850000) }}
                </span>
                <span class="text-xs text-white/60">/ khách</span>
              </div>
            </div>

            <!-- TOUR TYPE -->
            <div class="mt-5">
              <label
                class="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-white/70"
              >
                1. Chọn hình thức chuyến đi
              </label>

              <div
                v-if="availableTourTypeTabs.length"
                class="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5"
              >
                <button
                  v-for="tab in availableTourTypeTabs"
                  :key="tab.key"
                  type="button"
                  @click="currentTourType = tab.key"
                  class="flex flex-col items-center justify-center rounded-xl px-1 py-2 text-center transition"
                  :class="
                    currentTourType === tab.key
                      ? 'bg-white font-bold text-slate-900 shadow-md'
                      : 'text-white/70 hover:bg-white/10'
                  "
                >
                  <span class="text-sm">
                    {{ tab.icon }} {{ tab.label }}
                  </span>
                </button>
              </div>

              <p
                v-if="availableTourTypeTabs.length"
                class="mt-2 text-center text-[11px] text-white/50"
              >
                {{
                  tourTypeTabs.find((t) => t.key === currentTourType)?.desc
                }}
              </p>

              <p
                v-else
                class="rounded-xl bg-white/5 p-3 text-center text-xs text-white/60"
              >
                Tour chưa cấu hình hình thức khởi hành.
              </p>
            </div>

            <!-- CUSTOM TOUR -->
            <div v-if="currentTourType === 'CUSTOM'" class="mt-5 space-y-3">
              <div
                class="rounded-2xl border border-dashed border-amber-400/40 bg-amber-400/[0.05] p-4 text-xs text-amber-200"
              >
                Tour thiết kế theo lịch trình, điểm đón và dịch vụ riêng.
                Điền thông tin để nhận báo giá.
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-white/70">
                  Họ tên của bạn
                </label>
                <input
                  v-model="customForm.contact_name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-white/70">
                  Số điện thoại liên hệ
                </label>
                <input
                  v-model="customForm.contact_phone"
                  type="tel"
                  placeholder="09xxxxxxxx"
                  class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-white/70">
                  Dự kiến số người
                </label>
                <input
                  v-model.number="customForm.estimated_pax"
                  type="number"
                  min="1"
                  class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-white/70">
                  Ngày dự kiến khởi hành
                </label>
                <input
                  v-model="customForm.departure_date"
                  type="date"
                  class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-white/70">
                  Yêu cầu đặc biệt
                </label>
                <textarea
                  v-model="customForm.requirements"
                  rows="3"
                  placeholder="Khách sạn 4 sao, xe Limousine, tổ chức Gala dinner..."
                  class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs text-white outline-none"
                ></textarea>
              </div>

              <button
                type="button"
                @click="handleCustomRequest"
                class="w-full rounded-2xl bg-amber-400 py-3.5 text-xs font-bold text-slate-900 transition hover:bg-amber-300"
              >
                Gửi yêu cầu báo giá riêng
              </button>
            </div>

            <!-- SIC / PRIVATE / GROUP -->
            <div v-else class="mt-5">
              <!-- GROUP INTRO -->
              <div
                v-if="currentTourType === 'GROUP'"
                class="mb-4 rounded-2xl border border-blue-400/30 bg-blue-400/[0.07] p-4"
              >
                <div class="flex items-start gap-3">
                  <span class="text-2xl">👥</span>
                  <div>
                    <h3 class="text-sm font-bold text-white">
                      Tour đoàn doanh nghiệp và tập thể
                    </h3>
                    <p class="mt-1 text-xs leading-5 text-white/60">
                      Có thể gửi yêu cầu để nhận tư vấn về lịch trình,
                      dịch vụ và báo giá theo quy mô đoàn.
                    </p>
                  </div>
                </div>
              </div>

              <!-- DEPARTURE DATE -->
              <div>
                <label
                  class="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70"
                >
                  2. Ngày khởi hành
                </label>

                <select
                  v-model="selectedSchedule"
                  class="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs text-white outline-none"
                >
                  <option value="" disabled class="bg-[#11151c]">
                    -- Chọn ngày khởi hành --
                  </option>

                  <option
                    v-for="s in filteredSchedules"
                    :key="s.id"
                    :value="s.id"
                    class="bg-[#11151c]"
                  >
                    {{ formatDate(s.departure_date) }}
                    · Còn {{ s.available_slots }} chỗ trống
                  </option>
                </select>

                <p
                  v-if="filteredSchedules.length === 0"
                  class="mt-2 text-[11px] text-amber-400"
                >
                  Chưa có lịch cho hình thức tour này.
                </p>
              </div>

              <!-- TICKET TYPES -->
              <div class="mt-5">
                <div class="mb-2 flex items-center justify-between">
                  <label
                    class="text-xs font-semibold uppercase tracking-wider text-white/70"
                  >
                    3. Chọn vé / Gói chuyến đi
                  </label>

                  <span
                    v-if="!selectedSchedule"
                    class="text-[11px] text-amber-400"
                  >
                    (Chọn ngày trước)
                  </span>
                </div>

                <div
                  class="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3"
                  :class="{
                    'pointer-events-none opacity-40': !selectedSchedule,
                  }"
                >
                  <div
                    v-if="filteredTicketTypes.length === 0"
                    class="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-white/50"
                  >
                    Chưa có vé hoặc gói cho hình thức này.
                  </div>

                  <div
                    v-for="ticket in filteredTicketTypes"
                    :key="ticket.id"
                    class="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/20"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <p class="text-xs font-semibold text-white">
                            {{ ticket.name }}
                          </p>

                          <span
                            v-if="ticket.category === 'PACKAGE'"
                            class="rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-400"
                          >
                            Gói
                          </span>

                          <span
                            v-if="ticket.category === 'GROUP_BLOCK'"
                            class="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400"
                          >
                            Đoàn
                          </span>

                          <span
                            v-if="ticket.category === 'VEHICLE'"
                            class="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-400"
                          >
                            Xe
                          </span>

                          <span
                            v-if="ticket.category === 'SINGLE'"
                            class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400"
                          >
                            Vé lẻ
                          </span>
                        </div>

                        <p class="mt-0.5 text-[11px] text-white/50">
                          {{ ticket.description }}
                        </p>

                        <p class="mt-1 text-xs font-bold text-orange-400">
                          {{
                            Number(ticket.price) > 0
                              ? formatPrice(ticket.price)
                              : "Miễn phí"
                          }}
                        </p>

                        <p class="mt-1 text-[10px] text-white/40">
                          {{ ticket.total_pax }} chỗ / gói
                        </p>
                      </div>

                      <!-- QUANTITY -->
                      <div class="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          @click="decreaseTicket(ticket)"
                          :disabled="!selectedTickets[ticket.id]"
                          class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base disabled:opacity-30"
                        >
                          −
                        </button>

                        <span class="w-4 text-center text-xs font-bold">
                          {{ selectedTickets[ticket.id] || 0 }}
                        </span>

                        <button
                          type="button"
                          @click="increaseTicket(ticket)"
                          class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TOTAL PEOPLE -->
                <div class="mt-2 flex justify-between text-[11px] text-white/50">
                  <span>
                    Quy đổi:
                    <b class="text-white">{{ totalPeople }}</b>
                    chỗ ngồi
                  </span>

                  <span>
                    Tối đa {{ tourDetailData.max_people }} khách/chuyến
                  </span>
                </div>
              </div>

              <!-- PAX BREAKDOWN -->
              <div v-if="totalPeople > 0" class="mt-3 grid grid-cols-3 gap-2">
                <div class="rounded-xl bg-white/[0.04] p-2 text-center">
                  <div class="text-[10px] text-white/40">Người lớn</div>
                  <div class="mt-1 text-sm font-bold text-white">
                    {{ paxBreakdown.adult }}
                  </div>
                </div>

                <div class="rounded-xl bg-white/[0.04] p-2 text-center">
                  <div class="text-[10px] text-white/40">Trẻ em</div>
                  <div class="mt-1 text-sm font-bold text-white">
                    {{ paxBreakdown.child }}
                  </div>
                </div>

                <div class="rounded-xl bg-white/[0.04] p-2 text-center">
                  <div class="text-[10px] text-white/40">Em bé</div>
                  <div class="mt-1 text-sm font-bold text-white">
                    {{ paxBreakdown.infant }}
                  </div>
                </div>
              </div>

              <!-- TOTAL PRICE -->
              <div class="mt-5 border-t border-white/10 pt-4">
                <div class="flex items-end justify-between">
                  <span class="text-xs font-semibold text-white/70">
                    Tổng tạm tính
                  </span>

                  <span class="text-2xl font-bold text-orange-400">
                    {{ formatPrice(totalPrice) }}
                  </span>
                </div>
              </div>

              <!-- NORMAL BOOKING -->
              <button
                type="button"
                @click="booking(tourDetailData.id)"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900 transition hover:bg-white/90"
              >
                Tiến hành đặt tour
              </button>
            </div>

            <!-- GROUP REQUEST BUTTON: ALWAYS VISIBLE -->
            <div
              class="mt-5 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-amber-400/[0.04] p-4"
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-2xl"
                >
                  👥
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-bold text-white">
                    Bạn muốn đi tour theo đoàn?
                  </h3>
                  <p class="mt-1 text-xs leading-5 text-white/60">
                    Đăng ký nhu cầu để được tư vấn lịch trình và báo giá
                    theo số lượng thành viên.
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click="showGroupRequest = true"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-400 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-orange-300"
              >
                Yêu cầu tour đoàn
                <span class="text-base">→</span>
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>

    <!-- GROUP REQUEST MODAL -->

<Teleport to="body">
  <div
    v-if="showGroupRequest"
    class="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
    @click.self="showGroupRequest = false"
  >
    <section
      class="my-auto w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/15 bg-[#111827] text-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-request-title"
    >
      <header
        class="flex items-start justify-between gap-4 border-b border-white/10 p-6 sm:p-7"
      >
        <div>
          <span
            class="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400"
          >
            DỊCH VỤ TOUR ĐOÀN
          </span>

          <h2
            id="group-request-title"
            class="mt-2 text-xl font-extrabold sm:text-2xl"
          >
            Yêu cầu báo giá tour đoàn
          </h2>

          <p class="mt-2 text-xs leading-5 text-white/55">
            Cung cấp thông tin để chúng tôi tư vấn chương trình phù hợp.
          </p>
        </div>

        <button
          type="button"
          aria-label="Đóng biểu mẫu"
          @click="showGroupRequest = false"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </header>

      <form
        class="p-6 sm:p-7"
    @submit.prevent="yeucauTourDoan"
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Họ tên -->
          <div>
            <label
              for="group-contact-name"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Họ và tên người liên hệ *
            </label>

            <input
              id="group-contact-name"
              v-model.trim="groupRequestForm.contact_name"
              type="text"
              required
              autocomplete="name"
              placeholder="Nguyễn Văn A"
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            />
          </div>

          <!-- Số điện thoại -->
          <div>
            <label
              for="group-contact-phone"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Số điện thoại *
            </label>

            <input
              id="group-contact-phone"
              v-model.trim="groupRequestForm.contact_phone"
              type="tel"
              required
              autocomplete="tel"
              pattern="[0-9+(). -]{9,20}"
              placeholder="09xxxxxxxx"
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            />
          </div>

          <!-- Email -->
          <div class="sm:col-span-2">
            <label
              for="group-contact-email"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Email nhận báo giá *
            </label>

            <input
              id="group-contact-email"
              v-model.trim="groupRequestForm.contact_email"
              type="email"
              required
              autocomplete="email"
              placeholder="email@example.com"
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            />
          </div>

          <!-- Tên công ty -->
          <div class="sm:col-span-2">
            <label
              for="group-company-name"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Tên công ty / tổ chức
            </label>

            <input
              id="group-company-name"
              v-model.trim="groupRequestForm.company_name"
              type="text"
              placeholder="Tên công ty hoặc tổ chức (không bắt buộc)"
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            />
          </div>

          <!-- Tổng số người tham gia -->
          <div>
            <label
              for="group-estimated-pax"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Tổng số người tham gia *
            </label>

            <input
              id="group-estimated-pax"
              v-model.number="groupRequestForm.estimated_pax"
              type="number"
              min="1"
              max="10000"
              step="1"
              required
              placeholder="Ví dụ: 35"
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            />

            <p class="mt-1 text-[11px] text-white/40">
              Nhập tổng số người tham gia (đơn vị: người).
            </p>
          </div>

          <!-- Ngày khởi hành -->
          <div>
            <label
              for="group-departure-date"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Ngày khởi hành dự kiến *
            </label>

            <input
              id="group-departure-date"
              v-model="groupRequestForm.departure_date"
              type="date"
              :min="today"
              required
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
            />
          </div>

          <!-- Thời lượng -->
          <div>
            <label
              for="group-duration-days"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Thời lượng tour (ngày)
            </label>

            <input
              id="group-duration-days"
              v-model.number="groupRequestForm.duration_days"
              type="number"
              min="1"
              max="365"
              step="1"
              placeholder="Ví dụ: 3"
              class="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            />
          </div>

          <!-- Ngân sách -->
          <div>
            <label
              for="group-budget"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Ngân sách dự kiến mỗi người
            </label>

            <select
              id="group-budget"
              v-model="groupRequestForm.budget_per_pax"
              class="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
            >
              <option value="">Chọn mức ngân sách</option>
              <option value="1500000">Dưới 2 triệu</option>
              <option value="3500000">2–5 triệu</option>
              <option value="7500000">5–10 triệu</option>
              <option value="12000000">Trên 10 triệu</option>
            </select>
          </div>

          <!-- Yêu cầu thêm -->
          <div class="sm:col-span-2">
            <label
              for="group-requirements"
              class="mb-2 block text-xs font-semibold text-white/75"
            >
              Yêu cầu thêm
            </label>

            <textarea
              id="group-requirements"
              v-model.trim="groupRequestForm.special_requirements"
              rows="4"
              placeholder="Ví dụ: xe riêng, khách sạn, ăn uống, Gala dinner..."
              class="w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
            ></textarea>
          </div>
        </div>

        <!-- Thông báo trạng thái -->
        <div
          v-if="groupRequestMessage"
          class="mt-5 rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm"
          :class="groupRequestError ? 'text-red-300' : 'text-emerald-300'"
          role="status"
        >
          {{ groupRequestMessage }}
        </div>

        <!-- Nút thao tác -->
        <div
          class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            @click="showGroupRequest = false"
            class="rounded-xl border border-white/15 px-5 py-3 text-xs font-bold text-white/75 transition hover:bg-white/5"
          >
            Hủy
          </button>

          <button
            type="submit"
            :disabled="submittingGroupRequest"
            class="rounded-xl bg-orange-400 px-5 py-3 text-xs font-extrabold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{
              submittingGroupRequest
                ? 'Đang gửi yêu cầu...'
                : 'Gửi yêu cầu báo giá →'
            }}
          </button>
        </div>
      </form>
    </section>
  </div>
</Teleport>

  </div>
</template>


<style scoped>
.customer-redesign {
  background: #f8fafc;
  color: #0f172a;
}

.customer-atmosphere {
  display: none;
}

.customer-redesign :is([class^="bg-[#"], [class*=" bg-[#"]):not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-black/"]:not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-white/"]:not([class~="absolute"]):not([class~="fixed"]) {
  border-color: #e2e8f0;
  background-color: #fff;
  box-shadow: 0 3px 14px rgba(30, 41, 59, 0.06);
  backdrop-filter: none;
}

.customer-redesign [class*="bg-slate-800"]:not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-slate-900"]:not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-gray-900"]:not([class~="absolute"]):not([class~="fixed"]) {
  border-color: #e2e8f0;
  background-color: #fff;
  box-shadow: 0 3px 14px rgba(30, 41, 59, 0.06);
  backdrop-filter: none;
}

.customer-redesign [class*="text-white"],
.customer-redesign [class*="text-slate-100"],
.customer-redesign [class*="text-slate-200"],
.customer-redesign [class*="text-slate-300"] {
  color: #334155;
}

.customer-redesign [class*="border-white/"] {
  border-color: #e2e8f0;
}

.customer-redesign h1,
.customer-redesign h2,
.customer-redesign h3,
.customer-redesign h4 {
  color: #0f172a;
}

.customer-redesign input,
.customer-redesign select,
.customer-redesign textarea {
  border-color: #cbd5e1;
  background-color: #fff;
  color: #0f172a;
}

.customer-redesign a:hover {
  color: #2563eb;
}

.customer-redesign [class*="text-slate-400"] {
  color: #64748b;
}

.customer-redesign .tour-hero-content,
.customer-redesign .tour-hero-content [class*="text-white"] {
  color: #fff !important;
}

.customer-redesign .tour-hero-overlay {
  background-image: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.78),
    rgba(15, 23, 42, 0.2) 55%,
    transparent
  );
}
</style>
