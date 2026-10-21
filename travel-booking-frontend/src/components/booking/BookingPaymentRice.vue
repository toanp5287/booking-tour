<script setup>
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import tourService from "../../services/tour.service.js";

const props = defineProps({
  tourData: {
    type: Object,
    default: () => ({}),
  },
  idShedule: {
    type: [String, Number],
    default: null,
  },
  people: {
    type: [String, Number],
    default: 1,
  },
  voucherCode: {
    type: String,
    default: "",
  },
  handleThanhToan: {
    type: Function,
    required: true,
  },
  databooking: {
    type: Object,
    default: () => ({}),
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

/*
 * =========================================================
 * VOUCHER
 * =========================================================
 */
const voucherInput = ref(
  props.voucherCode || props.databooking?.voucher_code || "",
);
const discount = ref(0);

watch(
  () => props.voucherCode || props.databooking?.voucher_code,
  (newVal) => {
    voucherInput.value = newVal || "";
  },
);

/*
 * =========================================================
 * LẤY CHI TIẾT LỊCH KHỞI HÀNH
 * =========================================================
 */
const scheduleId = computed(() => {
  return props.idShedule || props.databooking?.schedule_id;
});

const { data: sheduleData, isLoading } = useQuery({
  queryKey: ["detailSchedule", scheduleId],
  queryFn: async () => {
    const response = await tourService.detailSchedule(scheduleId.value);
    return response.data?.data || response.data;
  },
  enabled: computed(() => Boolean(scheduleId.value)),
});

/*
 * =========================================================
 * SỐ LƯỢNG HÀNH KHÁCH
 * =========================================================
 */
const adultCount = computed(() => {
  return Number(
    props.databooking?.adult_count ??
      props.databooking?.people ??
      props.people ??
      1,
  );
});

const childCount = computed(() => {
  return Number(props.databooking?.child_count ?? 0);
});

const infantCount = computed(() => {
  return Number(props.databooking?.infant_count ?? 0);
});

// Ưu tiên total_people từ store (10 người), nếu không thì cộng tổng 3 loại khách
const totalPeople = computed(() => {
  if (props.databooking?.total_people) {
    return Number(props.databooking.total_people);
  }
  return adultCount.value + childCount.value + infantCount.value;
});

/*
 * =========================================================
 * KIỂM TRA LOẠI TOUR (THEO BLOCK/ĐOÀN HAY THEO VÉ LẺ)
 * =========================================================
 */
const isGroupTour = computed(() => {
  return (
    props.databooking?.selected_tour_type === "GROUP" ||
    (Array.isArray(props.databooking?.ticket_items) &&
      props.databooking.ticket_items.length > 0)
  );
});

// Danh sách vé đoàn / combo (nếu có)
const ticketItems = computed(() => {
  return Array.isArray(props.databooking?.ticket_items)
    ? props.databooking.ticket_items
    : [];
});

/*
 * =========================================================
 * ĐƠN GIÁ (DÀNH CHO VÉ LẺ NẾU KHÔNG PHẢI TOUR ĐOÀN)
 * =========================================================
 */
const adultPrice = computed(() => Number(props.tourData?.price) || 0);

const childPrice = computed(() => {
  if (
    props.tourData?.child_price !== null &&
    props.tourData?.child_price !== undefined &&
    props.tourData?.child_price !== ""
  ) {
    return Number(props.tourData.child_price);
  }
  return adultPrice.value;
});

const infantPrice = computed(() => Number(props.tourData?.infant_price) || 0);

/*
 * =========================================================
 * TÍNH TIỀN
 * =========================================================
 */
const subTotal = computed(() => {
  // 1. Nếu store đã tính sẵn total_amount thì lấy luôn
  if (
    props.databooking?.total_amount !== undefined &&
    props.databooking?.total_amount !== null
  ) {
    return Number(props.databooking.total_amount);
  }

  // 2. Nếu là tour đoàn có danh sách ticket_items
  if (ticketItems.value.length > 0) {
    return ticketItems.value.reduce((sum, item) => {
      return sum + Number(item.unit_price || 0) * Number(item.quantity || 1);
    }, 0);
  }

  // 3. Nếu là vé lẻ thông thường
  const adultAmt = adultCount.value * adultPrice.value;
  const childAmt = childCount.value * childPrice.value;
  const infantAmt = infantCount.value * infantPrice.value;
  return adultAmt + childAmt + infantAmt;
});

const totalAmount = computed(() => {
  return Math.max(subTotal.value - discount.value, 0);
});

/*
 * =========================================================
 * FORMAT HELPER
 * =========================================================
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
};

const formatDate = (date) => {
  if (!date || date === "--") return "--";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getThumbnailUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `http://localhost:8080/${path.replaceAll("\\", "/")}`;
};

const applyVoucher = () => {
  if (!voucherInput.value.trim()) return;
  console.log("Áp dụng voucher:", voucherInput.value);
};
</script>

<template>
  <aside class="light-booking-summary">
    <div
      class="sticky top-24 overflow-hidden rounded-[2rem] border border-white/20 bg-white/[0.11] shadow-[0_35px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
    >
      <!-- HÌNH ẢNH & TÊN TOUR -->
      <div class="relative h-44">
        <img
          v-if="tourData?.thumbnail"
          :src="getThumbnailUrl(tourData.thumbnail)"
          alt="Tour"
          class="h-full w-full object-cover"
        />
        <div v-else class="h-full w-full bg-white/10"></div>
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        ></div>

        <div class="booking-image-overlay absolute bottom-4 left-5 right-5">
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70"
            >
              Chuyến đi của bạn
            </span>
            <span
              v-if="isGroupTour"
              class="rounded-full bg-blue-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
            >
              Tour Đoàn
            </span>
          </div>
          <h3 class="mt-1 line-clamp-2 text-lg font-semibold text-white">
            {{ tourData?.name || "Đang tải dữ liệu tour..." }}
          </h3>
        </div>
      </div>

      <!-- NỘI DUNG CHI TIẾT -->
      <div class="p-6">
        <h3 class="text-base font-semibold text-white">Chi tiết thanh toán</h3>

        <!-- LỊCH TRÌNH -->
        <div class="mt-5 space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="font-medium text-white/60">Ngày khởi hành</span>
            <span class="font-semibold text-white">
              {{
                isLoading
                  ? "Đang tải..."
                  : formatDate(sheduleData?.departure_date)
              }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="font-medium text-white/60">Ngày kết thúc</span>
            <span class="font-semibold text-white">
              {{
                isLoading ? "Đang tải..." : formatDate(sheduleData?.return_date)
              }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="font-medium text-white/60">Tổng hành khách</span>
            <span class="font-semibold text-white">
              {{ totalPeople }} người
            </span>
          </div>
        </div>

        <!-- BẢNG CHI TIẾT GÓI VÉ / VÉ LẺ -->
        <div
          class="mt-5 space-y-2.5 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs"
        >
          <!-- Trường hợp 1: Tour đoàn có ticket_items -->
          <template v-if="ticketItems.length > 0">
            <div
              v-for="item in ticketItems"
              :key="item.ticket_type_id"
              class="flex items-center justify-between"
            >
              <span class="text-white/90">
                {{ item.ticket_name }}
                <span class="text-white/50">× {{ item.quantity }}</span>
              </span>
              <span class="font-semibold text-white">
                {{ formatPrice(item.unit_price * item.quantity) }} VNĐ
              </span>
            </div>
          </template>

          <!-- Trường hợp 2: Tour khách lẻ theo độ tuổi -->
          <template v-else>
            <!-- Người lớn -->
            <div class="flex items-center justify-between">
              <span class="text-white/80">
                Người lớn <span class="text-white/50">× {{ adultCount }}</span>
              </span>
              <span class="font-semibold text-white">
                {{ formatPrice(adultCount * adultPrice) }} VNĐ
              </span>
            </div>

            <!-- Trẻ em -->
            <div
              v-if="childCount > 0"
              class="flex items-center justify-between"
            >
              <span class="text-orange-200/90">
                Trẻ em (5-11t)
                <span class="text-white/50">× {{ childCount }}</span>
              </span>
              <span class="font-semibold text-orange-200">
                {{ formatPrice(childCount * childPrice) }} VNĐ
              </span>
            </div>

            <!-- Em bé -->
            <div
              v-if="infantCount > 0"
              class="flex items-center justify-between"
            >
              <span class="text-cyan-200/90">
                Em bé (&lt;5t)
                <span class="text-white/50">× {{ infantCount }}</span>
              </span>
              <span class="font-semibold text-cyan-200">
                {{
                  infantPrice === 0
                    ? "Miễn phí"
                    : `${formatPrice(infantCount * infantPrice)} VNĐ`
                }}
              </span>
            </div>
          </template>
        </div>

        <!-- MÃ GIẢM GIÁ -->
        <div class="my-6 border-y border-white/15 py-5">
          <label
            class="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/80"
          >
            Mã giảm giá
          </label>
          <div class="flex gap-2">
            <input
              v-model="voucherInput"
              type="text"
              placeholder="Nhập mã voucher"
              class="min-w-0 flex-1 rounded-xl border border-white/20 bg-black/25 px-3 py-2.5 text-xs text-white placeholder-white/40 outline-none transition focus:border-white/50"
            />
            <button
              type="button"
              @click="applyVoucher"
              class="cursor-pointer rounded-xl border border-white/20 bg-white/15 px-4 text-xs font-semibold text-white transition hover:bg-white/25"
            >
              Áp dụng
            </button>
          </div>
        </div>

        <!-- TỔNG KẾT TIỀN -->
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="font-medium text-white/60">Tạm tính</span>
            <span class="font-semibold text-white">
              {{ formatPrice(subTotal) }} VNĐ
            </span>
          </div>

          <div
            v-if="discount > 0"
            class="flex justify-between text-sm font-medium text-emerald-400"
          >
            <span>Giảm giá</span>
            <span>-{{ formatPrice(discount) }} VNĐ</span>
          </div>

          <div
            class="flex items-end justify-between border-t border-white/15 pt-4"
          >
            <div>
              <p class="text-xs font-medium text-white/60">Tổng thanh toán</p>
              <p
                class="mt-1 font-mono text-2xl font-bold tracking-tight text-orange-300"
              >
                {{ formatPrice(totalAmount) }}
              </p>
            </div>
            <span class="mb-1 text-xs font-semibold text-white/60">VNĐ</span>
          </div>
        </div>

        <!-- NÚT THANH TOÁN -->
        <button
          type="button"
          :disabled="isSubmitting"
          @click="handleThanhToan"
          class="group relative mt-6 block w-full overflow-hidden rounded-xl bg-orange-400 py-4 text-sm font-bold text-slate-900 shadow-sm transition-colors duration-200 hover:bg-orange-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            class="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-black/5 to-transparent transition-all duration-700 group-hover:left-[130%]"
          ></span>

          <span class="relative flex items-center justify-center gap-2">
            <svg
              v-if="isSubmitting"
              class="h-4 w-4 animate-spin text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>

            <span>{{
              isSubmitting ? "Đang xử lý..." : "Tiếp tục thanh toán"
            }}</span>

            <svg
              v-if="!isSubmitting"
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
          </span>
        </button>

        <!-- SECURE BADGE -->
        <div
          class="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-white/60"
        >
          <svg
            class="h-4 w-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z"
            />
          </svg>
          Thanh toán an toàn & bảo mật
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.light-booking-summary > div {
  border-color: #e2e8f0 !important;
  background-color: #fff !important;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.light-booking-summary :deep([class*="border-white/"]) {
  border-color: #e2e8f0 !important;
}

.light-booking-summary :deep([class*="bg-black/"]),
.light-booking-summary :deep([class*="bg-white/"]) {
  background-color: #f8fafc !important;
}

.light-booking-summary :deep(.text-white) {
  color: #1e293b !important;
}

.light-booking-summary :deep([class*="text-white/"]) {
  color: #64748b !important;
}

.light-booking-summary :deep([class*="text-orange-200"]) {
  color: #2563eb !important;
}

.light-booking-summary :deep([class*="text-orange-300"]) {
  color: #2563eb !important;
}

.light-booking-summary :deep([class*="text-emerald-400"]) {
  color: #047857 !important;
}

.light-booking-summary :deep(input) {
  border-color: #cbd5e1 !important;
  background-color: #fff !important;
  color: #1e293b !important;
}

.light-booking-summary :deep(input::placeholder) {
  color: #94a3b8 !important;
}

.light-booking-summary :deep(.booking-image-overlay [class*="text-white"]) {
  color: #fff !important;
}
</style>
