<script setup lang="ts">
import { ref, computed } from "vue";
import TourInfo from "../../../components/tour/TourInfo.vue";
import TourReview from "../../../components/tour/TourReview.vue";
import TourSchedule from "../../../components/tour/TourSchedule.vue";
import tourService from "../../../services/tour.service.js";
import { useRoute, useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { useBookingStore } from "../../../stores/booking.js";
import Swal from "sweetalert2";

const route = useRoute();
const id = route.params.id;
const router = useRouter();

const databooking = useBookingStore();
databooking.setBooking({
  tour_id: id,
});

const {
  data: tourDetailData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["tourDetail", id],
  queryFn: async () => {
    const result = await tourService.getOne(id);
    return result.data.data;
  },
  staleTime: 5 * 60 * 1000,
});

const formatPrice = (price: string | number) => {
  return Number(price || 0).toLocaleString("vi-VN") + "₫";
};

// Xử lý đường dẫn ảnh
const getTourImage = (path: string | null | undefined) => {
  if (!path) return "/hero-bg.jpg";
  const cleanPath = path.replaceAll("\\", "/");
  return `http://localhost:8080/${cleanPath}`;
};

const getStatusText = (status: string) => {
  if (status === "active") return "Đang mở bán";
  if (status === "inactive") return "Tạm ngừng";
  return "Đang cập nhật";
};

const selectedSchedule = ref("");
const voucherDiscount = ref(0);
const voucherCode = ref("");
const schedules = ref([]);

// State phân loại số lượng từng loại vé
const tickets = ref({
  adult: 1,
  child: 0,
  infant: 0,
});

// Lấy danh sách lịch khởi hành của tour
const getDetailSchedule = async (idTour: string | string[]) => {
  try {
    const response = await tourService.getSchedulesByTour(idTour);
    schedules.value = response.data.data;
  } catch (error) {
    console.error("Lỗi lấy lịch khởi hành:", error);
  }
};

getDetailSchedule(id);

const selectedScheduleData = computed(() => {
  return schedules.value.find(
    (schedule: any) => schedule.id == selectedSchedule.value,
  );
});

// Tổng số hành khách đang chọn
const totalPeople = computed(() => {
  return tickets.value.adult + tickets.value.child + tickets.value.infant;
});

// Hàm kiểm tra slot trống
const checkAvailableSlots = () => {
  if (!selectedSchedule.value) {
    Swal.fire({
      icon: "warning",
      title: "Chưa chọn lịch!",
      text: "Vui lòng chọn ngày khởi hành trước.",
      confirmButtonText: "Đã hiểu",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl",
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700",
      },
    });
    return false;
  }

  const availableSlots = Number(
    selectedScheduleData.value?.available_slots || 0,
  );

  if (totalPeople.value >= availableSlots) {
    Swal.fire({
      icon: "warning",
      title: "Không đủ chỗ!",
      text: `Lịch này chỉ còn ${availableSlots} chỗ trống.`,
      confirmButtonText: "Đã hiểu",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl",
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700",
      },
    });
    return false;
  }

  return true;
};

// Tăng số lượng vé
const increaseTicket = (type: "adult" | "child" | "infant") => {
  if (checkAvailableSlots()) {
    tickets.value[type]++;
  }
};

// Giảm số lượng vé
const decreaseTicket = (type: "adult" | "child" | "infant") => {
  if (type === "adult" && tickets.value.adult <= 1) {
    return; // Luôn cần ít nhất 1 người lớn đi kèm
  }
  if (tickets.value[type] > 0) {
    tickets.value[type]--;
  }
};

// Đơn giá từng loại vé
const adultPrice = computed(() => Number(tourDetailData.value?.price || 0));
const childPrice = computed(() =>
  Number(tourDetailData.value?.child_price || 0),
);
const infantPrice = computed(() =>
  Number(tourDetailData.value?.infant_price || 0),
);

// Tính tổng tiền theo số lượng từng loại
const totalPrice = computed(() => {
  const adultSubtotal = tickets.value.adult * adultPrice.value;
  const childSubtotal = tickets.value.child * childPrice.value;
  const infantSubtotal = tickets.value.infant * infantPrice.value;

  const total =
    adultSubtotal + childSubtotal + infantSubtotal - voucherDiscount.value;
  return total > 0 ? total : 0;
});

// Format ngày
const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN");
};

// Booking Action
const bookingStore = useBookingStore();

const booking = async (tourId: string) => {
  const user = localStorage.getItem("user");

  if (!user) {
    const result = await Swal.fire({
      icon: "info",
      title: "Đăng nhập để tiếp tục ✈️",
      html: `
        <p class="text-gray-500 mt-2">
          Bạn cần đăng nhập để có thể đặt tour và quản lý chuyến đi của mình.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Đăng nhập ngay",
      cancelButtonText: "Khám phá thêm",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "rounded-[28px] px-8 py-7",
        title: "text-2xl font-bold",
        confirmButton:
          "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg",
        cancelButton:
          "bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all",
      },
      backdrop: "rgba(0,0,0,0.65)",
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
      text: "Vui lòng chọn ngày khởi hành trước khi đặt tour.",
    });
    return;
  }

  // Lưu chi tiết số vé vào store
  bookingStore.setBooking({
    tour_id: tourId,
    schedule_id: selectedSchedule.value,
    total_people: totalPeople.value,
    adult_count: tickets.value.adult,
    child_count: tickets.value.child,
    infant_count: tickets.value.infant,
    total_amount: totalPrice.value,
    voucher_code: voucherCode.value || null,
  });

  router.push(`/booking`);
};
</script>

<template>
  <!-- ================================================= LOADING ================================================== -->
  <div
    v-if="isLoading"
    class="fixed inset-0 z-[999] flex items-center justify-center bg-[#080b10]"
  >
    <div class="text-center">
      <div
        class="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-white"
      ></div>
      <p class="mt-5 text-sm font-medium text-white/70">
        Đang tải thông tin tour...
      </p>
    </div>
  </div>

  <!-- ================================================= ERROR ================================================== -->
  <div
    v-else-if="isError || !tourDetailData"
    class="flex min-h-screen items-center justify-center bg-[#080b10] px-5 text-white"
  >
    <div class="text-center">
      <div class="text-5xl">😢</div>
      <h2 class="mt-4 text-2xl font-bold">Không tìm thấy tour</h2>
      <p class="mt-2 text-sm text-white/60">
        Tour có thể đã bị xóa hoặc không tồn tại.
      </p>
      <RouterLink
        to="/tours"
        class="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-white/90"
      >
        Quay lại danh sách tour
      </RouterLink>
    </div>
  </div>

  <!-- ================================================= MAIN ================================================== -->
  <div v-else>
    <!-- BACKGROUND -->
    <div class="fixed inset-0 -z-10 overflow-hidden">
      <img
        src="/hero-bg.jpg"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/60"></div>
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-[#080b10]"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-black/55"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#080b10] via-[#080b10]/85 to-transparent"
      ></div>
    </div>

    <main class="relative pt-20 text-white">
      <!-- BREADCRUMB -->
      <section class="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10">
        <div
          class="flex flex-wrap items-center gap-2 text-xs font-medium text-white/70"
        >
          <RouterLink to="/" class="hover:text-white"> Trang chủ </RouterLink>
          <span class="text-white/40"> / </span>
          <RouterLink to="/tours" class="hover:text-white"> Tour </RouterLink>
          <span class="text-white/40"> / </span>
          <span class="font-semibold text-white">
            {{ tourDetailData.name }}
          </span>
        </div>
      </section>

      <!-- TOUR HEADER -->
      <section class="mx-auto max-w-7xl px-5 pt-7 sm:px-8 lg:px-10">
        <div
          class="overflow-hidden rounded-[30px] border border-white/15 bg-black/25 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          <div class="relative h-[360px] overflow-hidden sm:h-[470px]">
            <img
              :src="getTourImage(tourDetailData.thumbnail)"
              :alt="tourDetailData.name"
              class="h-full w-full object-cover transition duration-700 hover:scale-[1.02]"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10"
            ></div>

            <div class="absolute left-5 top-5">
              <span
                class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="
                    tourDetailData.status === 'active'
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                  "
                ></span>
                {{ getStatusText(tourDetailData.status) }}
              </span>
            </div>

            <div class="absolute bottom-7 left-6 right-6 sm:left-9 sm:right-9">
              <h1
                class="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
              >
                {{ tourDetailData.name }}
              </h1>
            </div>
          </div>

          <!-- TOUR QUICK INFO -->
          <div
            class="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div class="border-b border-white/10 p-5 sm:border-r lg:border-b-0">
              <div
                class="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70"
              >
                Đánh giá
              </div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-white"> 4.9 </span>
                <div class="flex text-amber-300">★★★★★</div>
                <span class="text-xs font-medium text-white/70">
                  128 đánh giá
                </span>
              </div>
            </div>

            <div class="border-b border-white/10 p-5 lg:border-r lg:border-b-0">
              <div
                class="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70"
              >
                Thời lượng
              </div>
              <div
                class="flex items-center gap-2 text-sm font-semibold text-white"
              >
                {{ tourDetailData.duration_days }} ngày
                {{ tourDetailData.duration_nights }} đêm
              </div>
            </div>

            <div class="border-b border-white/10 p-5 sm:border-r lg:border-b-0">
              <div
                class="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70"
              >
                Phương tiện
              </div>
              <div
                class="flex items-center gap-2 text-sm font-semibold text-white"
              >
                {{ tourDetailData.transportation || "Đang cập nhật" }}
              </div>
            </div>

            <div class="p-5">
              <div
                class="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70"
              >
                Nhóm tour
              </div>
              <div class="text-sm font-semibold text-white">
                Tối đa {{ tourDetailData.max_people }} người
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT -->
      <section
        class="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-10"
      >
        <!-- LEFT: CHI TIẾT TOUR -->
        <div class="space-y-7">
          <section
            class="rounded-[26px] border border-white/10 bg-black/25 p-6 backdrop-blur-xl sm:p-8"
          >
            <h2 class="text-2xl font-bold text-white">Giới thiệu tour</h2>
            <p class="mt-5 text-sm leading-7 text-white/75">
              {{ tourDetailData.description || "Chưa có mô tả cho tour này." }}
            </p>
          </section>

          <TourInfo :tour="tourDetailData" />
          <TourSchedule :itineraries="tourDetailData.itineraries" />
          <TourReview :idTour="tourDetailData.id" />
        </div>

        <!-- RIGHT: KHUNG ĐẶT TOUR & CHỌN LOẠI VÉ -->
        <aside class="lg:sticky lg:top-[100px] lg:self-start">
          <div
            class="overflow-hidden rounded-[28px] border border-white/20 bg-black/55 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <!-- BẢNG GIÁ TỔNG QUAN -->
            <div class="border-b border-white/10 pb-5">
              <div
                class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
              >
                Giá vé tiêu chuẩn
              </div>
              <div class="mt-2 flex items-baseline justify-between">
                <div>
                  <span class="text-2xl font-bold text-white">
                    {{ formatPrice(tourDetailData.price) }}
                  </span>
                  <span class="text-xs text-white/60"> / người lớn</span>
                </div>
                <div v-if="tourDetailData.child_price" class="text-right">
                  <span class="text-lg font-semibold text-orange-400">
                    {{ formatPrice(tourDetailData.child_price) }}
                  </span>
                  <span class="text-xs text-white/60"> / trẻ em</span>
                </div>
              </div>
            </div>

            <!-- CHỌN NGÀY KHỞI HÀNH -->
            <div class="mt-6">
              <label class="mb-2 block text-sm font-semibold text-white">
                1. Ngày khởi hành
              </label>

              <select
                v-model="selectedSchedule"
                class="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/40 focus:ring-4 focus:ring-white/5"
              >
                <option value="" disabled class="bg-[#11151c]">
                  -- Chọn ngày khởi hành --
                </option>
                <option
                  v-for="schedule in schedules"
                  :key="schedule.id"
                  :value="schedule.id"
                  class="bg-[#11151c]"
                >
                  {{ formatDate(schedule.departure_date) }} -
                  {{ formatDate(schedule.return_date) }} · Còn
                  {{ schedule.available_slots }} chỗ
                </option>
              </select>
            </div>

            <!-- CHỌN PHÂN LOẠI VÉ -->
            <div class="mt-6">
              <div class="mb-2 flex items-center justify-between">
                <label class="block text-sm font-semibold text-white">
                  2. Chọn số lượng vé
                </label>
                <span
                  v-if="!selectedSchedule"
                  class="text-xs text-amber-400/90 font-medium"
                >
                  (Vui lòng chọn ngày trước)
                </span>
              </div>

              <!-- Danh sách các loại vé -->
              <div
                class="space-y-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 transition-all duration-300"
                :class="{
                  'opacity-40 pointer-events-none select-none':
                    !selectedSchedule,
                }"
              >
                <!-- 1. VÉ NGƯỜI LỚN -->
                <div
                  class="flex items-center justify-between border-b border-white/10 pb-3"
                >
                  <div>
                    <p class="text-sm font-medium text-white">Người lớn</p>
                    <p class="text-xs text-white/60">
                      {{ formatPrice(adultPrice) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      @click="decreaseTicket('adult')"
                      :disabled="tickets.adult <= 1"
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span class="w-5 text-center font-bold text-sm">{{
                      tickets.adult
                    }}</span>
                    <button
                      type="button"
                      @click="increaseTicket('adult')"
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>

                <!-- 2. VÉ TRẺ EM (5 - 11 tuổi) -->
                <div
                  class="flex items-center justify-between border-b border-white/10 pb-3"
                >
                  <div>
                    <p class="text-sm font-medium text-white">
                      Trẻ em (5 - 11 tuổi)
                    </p>
                    <p class="text-xs text-white/60">
                      {{ formatPrice(childPrice) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      @click="decreaseTicket('child')"
                      :disabled="tickets.child <= 0"
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span class="w-5 text-center font-bold text-sm">{{
                      tickets.child
                    }}</span>
                    <button
                      type="button"
                      @click="increaseTicket('child')"
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>

                <!-- 3. VÉ EM BÉ (< 5 tuổi) -->
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-white">
                      Em bé (&lt; 5 tuổi)
                    </p>
                    <p class="text-xs text-white/60">
                      {{
                        infantPrice > 0 ? formatPrice(infantPrice) : "Miễn phí"
                      }}
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      @click="decreaseTicket('infant')"
                      :disabled="tickets.infant <= 0"
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span class="w-5 text-center font-bold text-sm">{{
                      tickets.infant
                    }}</span>
                    <button
                      type="button"
                      @click="increaseTicket('infant')"
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-2 text-xs text-white/50">
                Tổng cộng: {{ totalPeople }} hành khách (Tối đa
                {{ tourDetailData.max_people }} người/đoàn)
              </div>
            </div>

            <!-- VOUCHER -->
            <div class="mt-5">
              <label class="mb-2 block text-sm font-semibold text-white">
                Mã giảm giá
              </label>
              <div class="flex gap-2">
                <input
                  v-model="voucherCode"
                  type="text"
                  placeholder="Nhập mã voucher"
                  class="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/50 outline-none focus:border-white/35"
                />
                <button
                  type="button"
                  class="rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <!-- TÓM TẮT THÀNH TIỀN THEO TỪNG LOẠI VÉ -->
            <div
              class="my-6 border-t border-white/10 pt-5 space-y-2 text-xs text-white/70"
            >
              <div class="flex justify-between">
                <span>Người lớn x {{ tickets.adult }}:</span>
                <span class="text-white font-medium">{{
                  formatPrice(tickets.adult * adultPrice)
                }}</span>
              </div>

              <div v-if="tickets.child > 0" class="flex justify-between">
                <span>Trẻ em x {{ tickets.child }}:</span>
                <span class="text-white font-medium">{{
                  formatPrice(tickets.child * childPrice)
                }}</span>
              </div>

              <div v-if="tickets.infant > 0" class="flex justify-between">
                <span>Em bé x {{ tickets.infant }}:</span>
                <span class="text-white font-medium">{{
                  formatPrice(tickets.infant * infantPrice)
                }}</span>
              </div>

              <div
                v-if="voucherDiscount > 0"
                class="flex justify-between text-emerald-400 font-medium"
              >
                <span>Ưu đãi voucher:</span>
                <span> - {{ formatPrice(voucherDiscount) }} </span>
              </div>

              <!-- TỔNG CỘNG -->
              <div
                class="mt-4 flex items-end justify-between border-t border-white/10 pt-4"
              >
                <span class="text-sm font-semibold text-white/80"
                  >Tổng tạm tính</span
                >
                <span class="text-2xl font-bold text-orange-400">
                  {{ formatPrice(totalPrice) }}
                </span>
              </div>
            </div>

            <!-- NÚT ĐẶT TOUR -->
            <button
              type="button"
              @click="booking(tourDetailData.id)"
              class="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-0.5 hover:bg-white/90"
            >
              Đặt tour ngay
              <svg
                class="h-4 w-4 transition group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </button>

            <!-- CAM KẾT -->
            <div class="mt-6 space-y-3 border-t border-white/10 pt-5">
              <div class="flex items-center gap-3 text-xs text-white/70">
                <span class="font-bold text-emerald-400"> ✓ </span> Xác nhận
                nhanh sau khi đặt
              </div>
              <div class="flex items-center gap-3 text-xs text-white/70">
                <span class="font-bold text-emerald-400"> ✓ </span> Hỗ trợ khách
                hàng 24/7
              </div>
              <div class="flex items-center gap-3 text-xs text-white/70">
                <span class="font-bold text-emerald-400"> ✓ </span> Giữ chỗ an
                toàn 100%
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>
