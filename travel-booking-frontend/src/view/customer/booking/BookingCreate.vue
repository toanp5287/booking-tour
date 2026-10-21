<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import Swal from "sweetalert2";

import BookingForm from "../../../components/booking/BookingForm.vue";
import BookingPaymentRice from "../../../components/booking/BookingPaymentRice.vue";
import BookTour from "../../../components/booking/BookTour.vue";

import { useBookingStore, thanhToan } from "../../../stores/booking.js";
import tourService from "../../../services/tour.service.js";

const route = useRoute();
const router = useRouter();
const databooking = useBookingStore();

const isSubmitting = ref(false);

/*
|--------------------------------------------------------------------------
| BOOKING DATA
|--------------------------------------------------------------------------
*/

const tourId = computed(
  () => databooking.bookingData.tour_id || route.params.id,
);

const schedule = computed(() => databooking.bookingData.schedule_id);

const voucherCode = computed(() => databooking.bookingData.voucher_code || "");

/*
|--------------------------------------------------------------------------
| XÁC ĐỊNH LOẠI TOUR
|--------------------------------------------------------------------------
*/

const isGroupOrFamily = computed(() => {
  const data = databooking.bookingData;

  const type = String(data.selected_tour_type || "")
    .toUpperCase()
    .trim();

  return ["GROUP", "FAMILY", "PRIVATE"].includes(type);
});

/*
|--------------------------------------------------------------------------
| PHÂN LOẠI HÀNH KHÁCH
|--------------------------------------------------------------------------
|
| Ưu tiên:
| 1. adult_count + child_count + infant_count
| 2. total_people
| 3. people
|
*/

const passengerSummary = computed(() => {
  const data = databooking.bookingData;

  let adults = Number(data.adult_count) || 0;

  let children = Number(data.child_count) || 0;

  let infants = Number(data.infant_count) || 0;

  const storedTotal = Number(data.total_people) || 0;

  const peopleFallback = Number(data.people) || 0;

  let totalPeople = storedTotal > 0 ? storedTotal : peopleFallback;

  const breakdownTotal = adults + children + infants;

  /*
   * Nếu frontend chưa gửi phân loại
   * nhưng có total_people
   * => mặc định toàn bộ là người lớn.
   */
  if (breakdownTotal === 0 && totalPeople > 0) {
    adults = totalPeople;
  }

  /*
   * Nếu không có total_people
   * => tính từ breakdown.
   */
  if (totalPeople <= 0) {
    totalPeople = adults + children + infants;
  }

  /*
   * Nếu breakdown có dữ liệu
   * thì tổng người phải lấy theo breakdown.
   */
  const finalBreakdown = adults + children + infants;

  if (finalBreakdown > 0 && finalBreakdown !== totalPeople) {
    /*
     * Trường hợp total_people cũ bị sai,
     * ưu tiên breakdown thực tế.
     */
    totalPeople = finalBreakdown;
  }

  return {
    adult_count: adults,
    child_count: children,
    infant_count: infants,
    total_people: totalPeople,
  };
});

/*
|--------------------------------------------------------------------------
| TỔNG SỐ NGƯỜI
|--------------------------------------------------------------------------
*/

const people = computed(() => {
  return passengerSummary.value.total_people || 1;
});

/*
|--------------------------------------------------------------------------
| PHƯƠNG THỨC THANH TOÁN
|--------------------------------------------------------------------------
*/

const paymentType = computed({
  get() {
    const raw = String(
      databooking.bookingData.payment_type ||
        databooking.bookingData.paymentType ||
        "full",
    ).toLowerCase();

    return raw === "deposit" ? "deposit" : "full";
  },

  set(value) {
    databooking.setBooking({
      payment_type: value,
      paymentType: value,

      payment_method: "vnpay",
      paymentMethod: "vnpay",
    });
  },
});

/*
|--------------------------------------------------------------------------
| LẤY CHI TIẾT TOUR
|--------------------------------------------------------------------------
*/

const { data: tourDetailData } = useQuery({
  queryKey: ["tourDetail", tourId],

  queryFn: async () => {
    const res = await tourService.getOne(tourId.value);

    return res.data?.data || res.data;
  },

  enabled: computed(() => Boolean(tourId.value)),

  staleTime: 5 * 60 * 1000,
});

/*
|--------------------------------------------------------------------------
| TÍNH TỔNG TIỀN
|--------------------------------------------------------------------------
*/

const currentTotalAmount = computed(() => {
  /*
   * 1. Ưu tiên total_amount từ store
   */
  const storeTotal = Number(databooking.bookingData.total_amount);

  if (Number.isFinite(storeTotal) && storeTotal > 0) {
    return storeTotal;
  }

  /*
   * 2. Tính theo ticket_items
   */
  const ticketItems = databooking.bookingData.ticket_items;

  if (Array.isArray(ticketItems) && ticketItems.length > 0) {
    const ticketTotal = ticketItems.reduce((sum, item) => {
      const price = Number(item.unit_price) || 0;

      const quantity = Number(item.quantity) || 1;

      return sum + price * quantity;
    }, 0);

    if (ticketTotal > 0) {
      return ticketTotal;
    }
  }

  /*
   * 3. Fallback giá tour
   */
  const tourPrice = Number(tourDetailData.value?.price) || 0;

  const count = Number(people.value) || 1;

  return tourPrice * count;
});

/*
|--------------------------------------------------------------------------
| CỌC 30%
|--------------------------------------------------------------------------
*/

const depositAmount = computed(() => {
  return Math.round(currentTotalAmount.value * 0.3);
});

/*
|--------------------------------------------------------------------------
| CÒN LẠI 70%
|--------------------------------------------------------------------------
*/

const remainingAmount = computed(() => {
  return Math.max(currentTotalAmount.value - depositAmount.value, 0);
});

/*
|--------------------------------------------------------------------------
| FORMAT TIỀN
|--------------------------------------------------------------------------
*/

const formatMoney = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
};

/*
|--------------------------------------------------------------------------
| THANH TOÁN
|--------------------------------------------------------------------------
*/

const handleThanhToan = async () => {
  if (isSubmitting.value) {
    return;
  }

  const rawData = databooking.bookingData;

  const rawTourId = rawData.tour_id || tourId.value;

  const rawScheduleId = rawData.schedule_id || schedule.value;

  const passenger = passengerSummary.value;

  const countPeople = passenger.total_people;

  const paymentTypeValue = paymentType.value;

  const finalAmount = Number(currentTotalAmount.value) || 0;

  /*
   * KIỂM TRA GIÁ
   */
  if (finalAmount <= 0) {
    await Swal.fire({
      icon: "warning",
      title: "Chưa có giá tour",
      text: "Không thể tính tổng tiền thanh toán. Vui lòng kiểm tra lại gói vé.",
    });

    return;
  }

  /*
   * KIỂM TRA TOUR / SCHEDULE
   */
  if (!rawTourId || !rawScheduleId) {
    await Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng chọn tour và lịch khởi hành.",
    });

    return;
  }

  /*
   * KIỂM TRA SỐ NGƯỜI
   */
  if (countPeople <= 0) {
    await Swal.fire({
      icon: "warning",
      title: "Chưa có số người",
      text: "Vui lòng kiểm tra lại số lượng hành khách.",
    });

    return;
  }

  /*
   * KIỂM TRA BOOKER
   */
  if (!rawData.booker_name || !rawData.booker_phone) {
    await Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin liên hệ",
      text: "Vui lòng nhập họ tên và số điện thoại người đại diện.",
    });

    return;
  }

  /*
   * ========================================================
   * DETAILS
   * ========================================================
   *
   * GROUP / FAMILY / PRIVATE:
   * Không bắt buộc khai từng người.
   *
   * VÉ LẺ:
   * Gửi danh sách khách nếu có.
   */

  let detailsList = [];

  if (isGroupOrFamily.value) {
    detailsList = [
      {
        full_name: rawData.booker_name,

        phone: rawData.booker_phone || null,

        email: rawData.booker_email || null,

        is_leader: true,

        passenger_type: "adult",
      },
    ];
  } else {
    detailsList = Array.isArray(rawData.booking_details)
      ? [...rawData.booking_details]
      : [];

    /*
     * Nếu có số người nhưng chưa đủ details
     * thì bổ sung khách mặc định.
     */
    while (detailsList.length < countPeople) {
      const index = detailsList.length + 1;

      detailsList.push({
        full_name:
          index === 1
            ? rawData.booker_name
            : `${rawData.booker_name} (Khách ${index})`,

        phone: rawData.booker_phone || null,

        email: rawData.booker_email || null,

        passenger_type:
          index <= passenger.adult_count
            ? "adult"
            : index <= passenger.adult_count + passenger.child_count
              ? "child"
              : "infant",
      });
    }
  }

  /*
   * ========================================================
   * PAYLOAD
   * ========================================================
   */

  const payload = {
    /*
     * TOUR
     */
    tour_id: Number(rawTourId),

    schedule_id: Number(rawScheduleId),

    /*
     * TỔNG NGƯỜI
     */
    total_people: passenger.total_people,

    /*
     * PHÂN LOẠI VÉ / NGƯỜI
     */
    adult_count: passenger.adult_count,

    child_count: passenger.child_count,

    infant_count: passenger.infant_count,

    /*
     * BOOKER
     */
    booker_name: rawData.booker_name,

    booker_phone: rawData.booker_phone,

    booker_email: rawData.booker_email || null,

    booker_identity_number: rawData.booker_identity_number || null,

    /*
     * KHÁC
     */
    departure: rawData.departure || null,

    special_request: rawData.special_request || null,

    /*
     * THANH TOÁN
     */
    payment_method: "vnpay",

    payment_type: paymentTypeValue,

    /*
     * LOẠI TOUR
     */
    selected_tour_type:
      rawData.selected_tour_type ||
      (isGroupOrFamily.value ? "GROUP" : "INDIVIDUAL"),

    /*
     * VÉ
     */
    ticket_items: Array.isArray(rawData.ticket_items)
      ? rawData.ticket_items
      : [],

    /*
     * TIỀN
     */
    total_amount: Number(currentTotalAmount.value) || 0,

    deposit_amount: Number(depositAmount.value) || 0,

    remaining_amount: Number(remainingAmount.value) || 0,

    /*
     * VOUCHER
     */
    voucher_code: rawData.voucher_code || null,

    /*
     * DETAILS
     */
    details: detailsList,
  };

  /*
   * DEBUG
   */
  console.log("===== PAYMENT PAYLOAD =====");

  console.log(JSON.stringify(payload, null, 2));

  try {
    isSubmitting.value = true;

    const result = await thanhToan(payload);

    /*
     * API ERROR
     */
    if (!result?.success) {
      await Swal.fire({
        icon: "error",
        title: "Thanh toán thất bại",
        text: result?.message || "Không thể thực hiện thanh toán.",
      });

      return;
    }

    /*
     * LẤY LINK VNPAY
     */
    const paymentUrl = result.payment_url || result.data?.payment_url;

    if (!paymentUrl) {
      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không lấy được link thanh toán VNPAY.",
      });

      return;
    }

    /*
     * LƯU PAYMENT HOLD
     */
    databooking.setPayment({
      hold_id: result.hold_id || result.data?.hold_id || null,

      hold_expires_at: result.expires_at || result.data?.expires_at || null,

      payment_code: result.payment_code || result.data?.payment_code || null,
    });

    /*
     * CHUYỂN VNPAY
     */
    window.location.href = paymentUrl;
  } catch (error) {
    console.error("HANDLE THANH TOAN ERROR:", error);

    await Swal.fire({
      icon: "error",
      title: "Có lỗi xảy ra",
      text:
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thực hiện thanh toán.",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="customer-redesign relative min-h-screen pt-20 text-white">
    <!-- BACKGROUND -->
    <div class="customer-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <img
        src="/hero-bg.jpg"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover"
      />

      <div class="absolute inset-0 bg-black/35"></div>

      <div
        class="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-[#080b12]/80"
      ></div>

      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent"
      ></div>
    </div>

    <main class="relative z-10">
      <div class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <!-- BREADCRUMB -->
        <div
          class="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-travel-muted"
        >
          <router-link to="/" class="transition hover:text-travel-blue">
            Trang chủ
          </router-link>

          <span class="text-slate-300">/</span>

          <router-link to="/tours" class="transition hover:text-travel-blue">
            Tour
          </router-link>

          <span class="text-slate-300">/</span>

          <span class="font-semibold text-travel-ink"> Đặt tour </span>
        </div>

        <!-- HEADER -->
        <div class="mb-9">
          <div
            class="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-800"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-travel-teal"></span>

            {{ isGroupOrFamily ? "Tour Đoàn / Gia Đình" : "Khách Lẻ" }}
          </div>

          <h1 class="text-3xl font-bold tracking-tight text-travel-ink sm:text-4xl">
            Hoàn tất đặt tour
          </h1>

          <p class="mt-2 max-w-2xl text-sm leading-6 text-travel-muted">
            Điền thông tin chuyến đi của bạn để giữ chỗ và bắt đầu hành trình.
          </p>
        </div>

        <!-- CONTENT -->
        <div class="grid gap-7 lg:grid-cols-[1fr_390px]">
          <!-- ==================== CỘT TRÁI ==================== -->
          <div class="space-y-6">
            <!-- THÔNG TIN TOUR -->
            <BookTour v-if="tourDetailData" :tourData="tourDetailData" />

            <!-- FORM KHÁCH HÀNG -->
            <BookingForm :isGroupOrFamily="isGroupOrFamily" />

            <!-- ==================== THANH TOÁN ==================== -->
            <section
              class="travel-surface rounded-2xl p-5 sm:p-7"
            >
              <!-- TITLE -->
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-travel-ink">
                  Phương thức thanh toán
                </h2>

                <p class="mt-1 text-sm font-medium text-travel-muted">
                  Chọn hình thức thanh toán cho đơn đặt tour của bạn.
                </p>
              </div>

              <div class="space-y-4">
                <!-- ================================================= -->
                <!-- THANH TOÁN FULL 100% -->
                <!-- ================================================= -->
                <label
                  class="relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-[border-color,background-color,box-shadow] duration-200"
                  :class="
                    paymentType === 'full'
                      ? 'border-teal-500 bg-teal-50 shadow-[0_0_0_2px_rgba(15,157,138,0.12)]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  "
                >
                  <!-- RADIO -->
                  <input
                    v-model="paymentType"
                    type="radio"
                    value="full"
                    class="mt-1 h-5 w-5 shrink-0 accent-teal-700"
                  />

                  <!-- ICON -->
                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-red-600 shadow-sm"
                  >
                    VNPAY
                  </div>

                  <!-- CONTENT -->
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-semibold text-travel-ink">
                        Thanh toán toàn bộ qua VNPAY (100%)
                      </p>

                      <span
                        v-if="paymentType === 'full'"
                        class="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-900"
                      >
                        ĐANG CHỌN
                      </span>
                    </div>

                    <p class="mt-1 text-sm leading-5 text-travel-muted">
                      Thanh toán toàn bộ giá trị đơn hàng qua VNPAY. Hỗ trợ mã
                      QR, App Ngân hàng hoặc thẻ ATM/Visa/Mastercard.
                    </p>

                    <!-- FULL AMOUNT -->
                    <div
                      v-if="paymentType === 'full' && currentTotalAmount > 0"
                      class="mt-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-xs text-travel-muted">
                          Số tiền thanh toán:
                        </span>

                        <span class="font-mono text-sm font-bold text-travel-ink">
                          {{ formatMoney(currentTotalAmount) }} VNĐ
                        </span>
                      </div>
                    </div>
                  </div>
                </label>

                <!-- ================================================= -->
                <!-- ĐẶT CỌC 30% -->
                <!-- ================================================= -->
                <label
                  class="relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200"
                  :class="
                    paymentType === 'deposit'
                      ? 'border-amber-500 bg-amber-50 shadow-[0_0_0_2px_rgba(245,158,11,0.12)]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  "
                >
                  <!-- RADIO -->
                  <input
                    v-model="paymentType"
                    type="radio"
                    value="deposit"
                    class="mt-1 h-5 w-5 shrink-0 accent-amber-600"
                  />

                  <!-- ICON -->
                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-amber-400/20 text-lg text-amber-300"
                  >
                    🛡️
                  </div>

                  <!-- CONTENT -->
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-semibold text-travel-ink">
                        Đặt cọc giữ chỗ (30%)
                      </p>

                      <span
                        v-if="paymentType === 'deposit'"
                        class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900"
                      >
                        ĐANG CHỌN
                      </span>
                    </div>

                    <p class="mt-1 text-sm leading-5 text-travel-muted">
                      Chỉ thanh toán trước 30% để xác nhận giữ chỗ. 70% còn lại
                      sẽ thanh toán trước ngày khởi hành.
                    </p>

                    <!-- DEPOSIT DETAIL -->
                    <div
                      v-if="paymentType === 'deposit' && currentTotalAmount > 0"
                      class="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <!-- 30% -->
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-xs text-travel-muted">
                          Tiền cọc cần thanh toán (30%):
                        </span>

                        <span
                          class="font-mono text-sm font-bold text-amber-700"
                        >
                          {{ formatMoney(depositAmount) }} VNĐ
                        </span>
                      </div>

                      <!-- 70% -->
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-[11px] text-travel-muted">
                          Số tiền còn lại (70%):
                        </span>

                        <span class="font-mono text-xs text-slate-500">
                          {{ formatMoney(remainingAmount) }} VNĐ
                        </span>
                      </div>

                      <!-- TOTAL -->
                      <div class="border-t border-slate-200 pt-2">
                        <div class="flex items-center justify-between gap-3">
                          <span class="text-[11px] text-travel-muted">
                            Tổng giá trị tour:
                          </span>

                          <span
                            class="font-mono text-xs font-semibold text-travel-ink"
                          >
                            {{ formatMoney(currentTotalAmount) }} VNĐ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <!-- ==================== CỘT PHẢI ==================== -->
          <BookingPaymentRice
            v-if="tourDetailData"
            :tourData="tourDetailData"
            :idShedule="schedule"
            :people="people"
            :voucherCode="voucherCode"
            :handleThanhToan="handleThanhToan"
            :databooking="databooking.bookingData"
            :isSubmitting="isSubmitting"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.customer-redesign {
  background: #f8fafc;
  color: #475569;
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
</style>
