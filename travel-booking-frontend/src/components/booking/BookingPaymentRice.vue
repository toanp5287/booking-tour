<script setup>
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import tourService from "../../services/tour.service";

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
});

/*
 * =========================================================
 * VOUCHER
 * =========================================================
 */
const voucherInput = ref(props.voucherCode);
const discount = ref(0);

/*
 * =========================================================
 * LẤY CHI TIẾT LỊCH KHỞI HÀNH
 * =========================================================
 */
const { data: sheduleData, isLoading } = useQuery({
  queryKey: ["detailSchedule", props.idShedule],
  queryFn: async () => {
    const response = await tourService.detailSchedule(props.idShedule);
    return response.data.data;
  },
  enabled: computed(() => !!props.idShedule),
});

/*
 * =========================================================
 * ĐẾM SỐ LƯỢNG HÀNH KHÁCH TỪNG LOẠI
 * =========================================================
 */
// 1. Số người lớn
const adultCount = computed(() => {
  if (props.databooking?.adult_count !== undefined) {
    return Number(props.databooking.adult_count) || 0;
  }
  // Hoặc tính từ danh sách chi tiết passengers/booking_details nếu có
  if (Array.isArray(props.databooking?.passengers)) {
    return props.databooking.passengers.filter(
      (p) => !p.passenger_type || p.passenger_type === "adult",
    ).length;
  }
  return Number(props.people) || 1;
});

// 2. Số trẻ em (5 - 11 tuổi)
const childCount = computed(() => {
  if (props.databooking?.child_count !== undefined) {
    return Number(props.databooking.child_count) || 0;
  }
  if (Array.isArray(props.databooking?.passengers)) {
    return props.databooking.passengers.filter(
      (p) => p.passenger_type === "child",
    ).length;
  }
  return 0;
});

// 3. Số em bé (< 5 tuổi)
const infantCount = computed(() => {
  if (props.databooking?.infant_count !== undefined) {
    return Number(props.databooking.infant_count) || 0;
  }
  if (Array.isArray(props.databooking?.passengers)) {
    return props.databooking.passengers.filter(
      (p) => p.passenger_type === "infant",
    ).length;
  }
  return 0;
});

// Tổng số người
const totalPeople = computed(() => {
  return adultCount.value + childCount.value + infantCount.value;
});

/*
 * =========================================================
 * ĐƠN GIÁ TỪNG LOẠI VÉ
 * =========================================================
 */
// Giá vé người lớn
const adultPrice = computed(() => {
  return Number(props.tourData?.price) || 0;
});

// Giá vé trẻ em: nếu null/undefined/0 thì fallback bằng giá vé người lớn
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

// Giá vé em bé
const infantPrice = computed(() => {
  return Number(props.tourData?.infant_price) || 0;
});

/*
 * =========================================================
 * THÀNH TIỀN TỪNG LOẠI & TỔNG
 * =========================================================
 */
const totalAdultAmount = computed(() => adultCount.value * adultPrice.value);
const totalChildAmount = computed(() => childCount.value * childPrice.value);
const totalInfantAmount = computed(() => infantCount.value * infantPrice.value);

// Tạm tính trước giảm giá
const subTotal = computed(() => {
  return (
    totalAdultAmount.value + totalChildAmount.value + totalInfantAmount.value
  );
});

// Tổng số tiền cần thanh toán
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
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const applyVoucher = () => {
  console.log("Voucher:", voucherInput.value);
};
</script>

<template>
  <aside>
    <div
      class="sticky top-24 overflow-hidden rounded-[2rem] border border-white/20 bg-white/[0.11] shadow-[0_35px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
    >
      <!-- IMAGE -->
      <div class="relative h-44">
        <img
          v-if="tourData?.thumbnail"
          :src="`http://localhost:8080/${tourData.thumbnail.replaceAll('\\', '/')}`"
          alt="Tour"
          class="h-full w-full object-cover"
        />
        <div v-else class="h-full w-full bg-white/10"></div>
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        ></div>

        <div class="absolute bottom-4 left-5 right-5">
          <p
            class="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70"
          >
            Your trip
          </p>
          <h3 class="mt-1 line-clamp-2 text-lg font-semibold text-white">
            {{ tourData?.name || "Đang tải..." }}
          </h3>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="p-6">
        <h3 class="text-base font-semibold text-white">Chi tiết thanh toán</h3>

        <!-- SCHEDULE -->
        <div class="mt-5 space-y-3 text-sm">
          <!-- Ngày khởi hành -->
          <div class="flex items-center justify-between gap-4">
            <span class="font-medium text-white/60"> Ngày khởi hành </span>
            <span class="font-semibold text-white">
              {{
                isLoading
                  ? "Đang tải..."
                  : formatDate(sheduleData?.departure_date || "--")
              }}
            </span>
          </div>

          <!-- Ngày kết thúc -->
          <div class="flex items-center justify-between gap-4">
            <span class="font-medium text-white/60"> Ngày kết thúc </span>
            <span class="font-semibold text-white">
              {{
                isLoading
                  ? "Đang tải..."
                  : formatDate(sheduleData?.return_date || "--")
              }}
            </span>
          </div>

          <!-- Tổng số khách -->
          <div class="flex items-center justify-between gap-4">
            <span class="font-medium text-white/60"> Tổng hành khách </span>
            <span class="font-semibold text-white">
              {{ totalPeople }} người
            </span>
          </div>
        </div>

        <!-- BẢNG BÓC TÁCH GIÁ THEO 3 LOẠI VÉ -->
        <div
          class="mt-5 space-y-2.5 rounded-2xl bg-black/25 p-4 border border-white/10 text-xs"
        >
          <!-- Người lớn -->
          <div class="flex items-center justify-between">
            <span class="text-white/80">
              Người lớn <span class="text-white/50">× {{ adultCount }}</span>
            </span>
            <span class="font-semibold text-white">
              {{ formatPrice(totalAdultAmount) }} VNĐ
            </span>
          </div>

          <!-- Trẻ em -->
          <div v-if="childCount > 0" class="flex items-center justify-between">
            <span class="text-orange-200/90">
              Trẻ em (5-11t)
              <span class="text-white/50">× {{ childCount }}</span>
            </span>
            <span class="font-semibold text-orange-200">
              {{ formatPrice(totalChildAmount) }} VNĐ
            </span>
          </div>

          <!-- Em bé -->
          <div v-if="infantCount > 0" class="flex items-center justify-between">
            <span class="text-cyan-200/90">
              Em bé (&lt;5t)
              <span class="text-white/50">× {{ infantCount }}</span>
            </span>
            <span class="font-semibold text-cyan-200">
              {{
                infantPrice === 0
                  ? "Miễn phí"
                  : `${formatPrice(totalInfantAmount)} VNĐ`
              }}
            </span>
          </div>
        </div>

        <!-- VOUCHER -->
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
              class="rounded-xl border border-white/20 bg-white/15 px-4 text-xs font-semibold text-white transition hover:bg-white/25 cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>

        <!-- PRICE -->
        <div class="space-y-3">
          <!-- Tạm tính -->
          <div class="flex justify-between text-sm">
            <span class="font-medium text-white/60"> Tạm tính </span>
            <span class="font-semibold text-white">
              {{ formatPrice(subTotal) }} VNĐ
            </span>
          </div>

          <!-- Giảm giá -->
          <div
            v-if="discount > 0"
            class="flex justify-between text-sm font-medium text-emerald-400"
          >
            <span> Giảm giá </span>
            <span> -{{ formatPrice(discount) }} VNĐ </span>
          </div>

          <!-- Tổng tiền thanh toán -->
          <div
            class="flex items-end justify-between border-t border-white/15 pt-4"
          >
            <div>
              <p class="text-xs font-medium text-white/60">Tổng thanh toán</p>
              <p
                class="mt-1 text-2xl font-bold tracking-tight text-orange-300 font-mono"
              >
                {{ formatPrice(totalAmount) }}
              </p>
            </div>
            <span class="mb-1 text-xs font-semibold text-white/60"> VNĐ </span>
          </div>
        </div>

        <!-- BUTTON -->
        <button
          type="button"
          @click="handleThanhToan"
          class="group relative mt-6 block w-full overflow-hidden rounded-2xl bg-white py-4 text-sm font-bold text-slate-900 shadow-[0_15px_35px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] cursor-pointer"
        >
          <span
            class="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-black/5 to-transparent transition-all duration-700 group-hover:left-[130%]"
          ></span>

          <span class="relative flex items-center justify-center gap-2">
            Tiếp tục thanh toán
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
          </span>
        </button>

        <!-- SECURE -->
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
