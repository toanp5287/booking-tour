<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

import BookingForm from "../../../components/booking/BookingForm.vue";
import BookingPaymentRice from "../../../components/booking/BookingPaymentRice.vue";
import BookTour from "../../../components/booking/BookTour.vue";

import { useBookingStore, thanhToan } from "../../../stores/booking.js";

import tourService from "../../../services/tour.service.js";

import { computed, ref, watch } from "vue";

import { useRoute, useRouter } from "vue-router";

import Swal from "sweetalert2";

/*
 * =========================================================
 * ROUTER
 * =========================================================
 */

const route = useRoute();

const router = useRouter();

/*
 * =========================================================
 * BOOKING STORE
 * =========================================================
 */

const databooking = useBookingStore();

/*
 * =========================================================
 * PHƯƠNG THỨC THANH TOÁN
 * =========================================================
 *
 * Chỉ sử dụng:
 *
 * "vnpay"
 * "cod"
 *
 * Không sử dụng "later" nữa.
 */

const paymentMethod = ref(
  databooking.bookingData.payment_method ||
    databooking.bookingData.paymentMethod ||
    "vnpay",
);

/*
 * =========================================================
 * ĐỒNG BỘ PAYMENT METHOD VÀO PINIA
 * =========================================================
 */

watch(
  paymentMethod,
  (value) => {
    databooking.setBooking({
      payment_method: value,
      paymentMethod: value,
    });
  },
  {
    immediate: true,
  },
);

/*
 * =========================================================
 * TOUR ID
 * =========================================================
 */

const tourId = computed(() => {
  return databooking.bookingData.tour_id;
});

/*
 * =========================================================
 * SCHEDULE ID
 * =========================================================
 */

const schedule = computed(() => {
  return databooking.bookingData.schedule_id;
});

/*
 * =========================================================
 * SỐ NGƯỜI
 * =========================================================
 */

const people = computed(() => {
  return (
    databooking.bookingData.total_people || databooking.bookingData.people || 1
  );
});

/*
 * =========================================================
 * VOUCHER
 * =========================================================
 */

const voucherCode = computed(() => {
  return databooking.bookingData.voucher_code || "";
});

/*
 * =========================================================
 * LẤY CHI TIẾT TOUR
 * =========================================================
 */

const { data: tourDetailData } = useQuery({
  queryKey: ["tourDetail", tourId],

  queryFn: async () => {
    const result = await tourService.getOne(tourId.value);

    return result.data.data;
  },

  enabled: computed(() => !!tourId.value),

  staleTime: 5 * 60 * 1000,
});

/*
 * =========================================================
 * HANDLE THANH TOÁN
 * =========================================================
 */

const handleThanhToan = async () => {
  try {
    const rawData = databooking.bookingData;

    /*
     * ===================================================
     * 2. LẤY TOUR ID
     * ===================================================
     *
     * Ưu tiên:
     *
     * bookingData.tour_id
     * ↓
     * tourId
     * ↓
     * route.params.id
     */

    const rawTourId = rawData.tour_id || tourId.value || route.params.id;

    /*
     * ===================================================
     * 3. LẤY SCHEDULE ID
     * ===================================================
     */

    const rawScheduleId = rawData.schedule_id || schedule.value;

    /*
     * ===================================================
     * 4. SỐ NGƯỜI
     * ===================================================
     */

    const countPeople = Number(rawData.people || rawData.total_people || 1);

    /*
     * ===================================================
     * 5. PHƯƠNG THỨC THANH TOÁN
     * ===================================================
     */

    let method = String(
      paymentMethod.value || rawData.payment_method || "vnpay",
    )
      .toLowerCase()
      .trim();

    /*
     * Hỗ trợ dữ liệu cũ trong localStorage
     *
     * later -> cod
     */

    if (method === "later") {
      method = "cod";
    }

    /*
     * ===================================================
     * 6. KIỂM TRA PHƯƠNG THỨC
     * ===================================================
     */

    if (method !== "cod" && method !== "vnpay") {
      await Swal.fire({
        icon: "error",

        title: "Phương thức không hợp lệ",

        text: "Vui lòng chọn phương thức thanh toán.",
      });

      return;
    }

    /*
     * ===================================================
     * 7. TẠO DANH SÁCH NGƯỜI ĐI
     * ===================================================
     */

    let detailsList = Array.isArray(rawData.booking_details)
      ? [...rawData.booking_details]
      : [];

    /*
     * Nếu số người nhiều hơn số detail
     * thì tự bổ sung.
     */

    while (detailsList.length < countPeople) {
      const idx = detailsList.length + 1;

      detailsList.push({
        full_name:
          idx === 1
            ? rawData.booker_name
            : `${rawData.booker_name} (Khách ${idx})`,

        phone: rawData.booker_phone || null,

        email: rawData.booker_email || null,
      });
    }

    /*
     * ===================================================
     * 8. PAYLOAD GỬI THANH TOÁN
     * ===================================================
     */

    const payload = {
      tour_id: Number(rawTourId),

      schedule_id: Number(rawScheduleId),

      total_people: countPeople,

      booker_name: rawData.booker_name,

      booker_phone: rawData.booker_phone,

      booker_email: rawData.booker_email,

      booker_identity_number: rawData.booker_identity_number || null,

      departure: rawData.departure || null,

      special_request: rawData.special_request || null,

      payment_method: method,

      details: detailsList,
    };
    /*
     * ===================================================
     * 9. GỌI THANH TOÁN
     * ===================================================
     */

    const result = await thanhToan(payload);

    /*
     * ===================================================
     * 10. THANH TOÁN THẤT BẠI
     * ===================================================
     */

    if (!result?.success) {
      await Swal.fire({
        icon: "error",

        title: "Thanh toán thất bại",

        text: result?.message || "Không thể thực hiện thanh toán",
      });

      return;
    }

    /*
     * ===================================================
     * 11. VNPAY
     * ===================================================
     *
     * Lúc này:
     *
     * Backend đã:
     *
     * payment_holds
     * available_slots - people
     *
     * Nhưng CHƯA có:
     *
     * bookings
     * payments
     */

    if (method === "vnpay") {
      const paymentUrl = result.payment_url;

      /*
       * Kiểm tra URL
       */

      if (!paymentUrl) {
        await Swal.fire({
          icon: "error",

          title: "Lỗi",

          text: "Không nhận được đường dẫn thanh toán VNPAY",
        });

        return;
      }

      /*
       * =================================================
       * LƯU PAYMENT HOLD
       * =================================================
       *
       * KHÔNG clear booking.
       *
       * Vì user đang chuyển sang VNPAY.
       */

      databooking.setPayment({
        hold_id: result.hold_id || result.data?.hold_id || null,

        hold_expires_at: result.expires_at || result.data?.expires_at || null,

        payment_code: result.data?.payment_code || null,
      });

      /*
       * DEBUG
       */

      console.log("VNPAY HOLD:", {
        hold_id: result.hold_id || result.data?.hold_id,

        payment_code: result.data?.payment_code,

        expires_at: result.expires_at || result.data?.expires_at,
      });

      /*
       * =================================================
       * CHUYỂN SANG VNPAY
       * =================================================
       */

      window.location.href = paymentUrl;

      return;
    }

    /*
     * ===================================================
     * 12. COD
     * ===================================================
     *
     * Backend đã:
     *
     * bookings
     * booking_details
     * payments
     * available_slots - people
     */

    if (method === "cod") {
      await Swal.fire({
        icon: "success",

        title: "Đặt tour thành công",

        text: "Bạn có thể thanh toán sau.",

        confirmButtonText: "OK",
      });

      /*
       * COD thành công
       * => Xóa booking tạm trong Pinia/localStorage
       */

      databooking.clearBooking();

      /*
       * Về trang chủ
       */

      router.push("/");
    }
  } catch (error) {
    console.error("HANDLE THANH TOAN ERROR:", error);

    /*
     * ===================================================
     * ERROR BACKEND
     * ===================================================
     */

    await Swal.fire({
      icon: "error",

      title: "Có lỗi xảy ra",

      text:
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thực hiện thanh toán",
    });
  }
};
</script>

<template>
  <div class="relative min-h-screen pt-20 text-white">
    <!-- ================================================= -->
    <!-- BACKGROUND -->
    <!-- ================================================= -->

    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
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

    <!-- ================================================= -->
    <!-- MAIN -->
    <!-- ================================================= -->

    <main class="relative z-10 text-white">
      <div class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <!-- ================================================= -->
        <!-- BREADCRUMB -->
        <!-- ================================================= -->

        <div
          class="mb-7 flex items-center gap-2 text-xs font-medium text-white/70"
        >
          <router-link to="/" class="transition hover:text-white">
            Trang chủ
          </router-link>

          <span class="text-white/40"> / </span>

          <router-link to="/tours" class="transition hover:text-white">
            Tour
          </router-link>

          <span class="text-white/40"> / </span>

          <span class="font-semibold text-white"> Đặt tour </span>
        </div>

        <!-- ================================================= -->
        <!-- HEADING -->
        <!-- ================================================= -->

        <div class="mb-9">
          <div
            class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80 backdrop-blur-xl"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-white"></span>

            Booking
          </div>

          <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Hoàn tất đặt tour
          </h1>

          <p class="mt-2 max-w-2xl text-sm leading-6 text-white/80">
            Điền thông tin chuyến đi của bạn để giữ chỗ và bắt đầu hành trình
            cùng TravelGo.
          </p>
        </div>

        <!-- ================================================= -->
        <!-- CONTENT GRID -->
        <!-- ================================================= -->

        <div class="grid gap-7 lg:grid-cols-[1fr_390px]">
          <!-- ================================================= -->
          <!-- LEFT -->
          <!-- ================================================= -->

          <div class="space-y-6">
            <!-- TOUR -->

            <BookTour v-if="tourDetailData" :tourData="tourDetailData" />

            <!-- FORM -->

            <BookingForm />

            <!-- ================================================= -->
            <!-- PAYMENT METHOD -->
            <!-- ================================================= -->

            <section
              class="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 backdrop-blur-2xl sm:p-7"
            >
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-white">
                  Phương thức thanh toán
                </h2>

                <p class="mt-1 text-xs font-medium text-white/70">
                  Chọn cách thanh toán cho đơn đặt tour của bạn.
                </p>
              </div>

              <div class="space-y-4">
                <!-- ================================================= -->
                <!-- VNPAY -->
                <!-- ================================================= -->

                <label
                  class="relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-200"
                  :class="
                    paymentMethod === 'vnpay'
                      ? 'border-white/70 bg-white/[0.20] shadow-[0_0_0_2px_rgba(255,255,255,0.08)]'
                      : 'border-white/15 bg-black/15 hover:border-white/30 hover:bg-white/[0.10]'
                  "
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="vnpay"
                    class="h-5 w-5 shrink-0 accent-white"
                  />

                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-red-600 shadow-sm"
                  >
                    VNPAY
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-semibold text-white">
                        Thanh toán ngay qua VNPAY
                      </p>

                      <span
                        v-if="paymentMethod === 'vnpay'"
                        class="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black"
                      >
                        ĐANG CHỌN
                      </span>
                    </div>

                    <p class="mt-1 text-xs font-medium text-white/70">
                      Thanh toán trực tuyến qua mã QR, App Ngân hàng hoặc thẻ
                      ATM/Visa
                    </p>
                  </div>
                </label>

                <!-- ================================================= -->
                <!-- COD -->
                <!-- ================================================= -->

                <label
                  class="relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-200"
                  :class="
                    paymentMethod === 'cod'
                      ? 'border-white/70 bg-white/[0.20] shadow-[0_0_0_2px_rgba(255,255,255,0.08)]'
                      : 'border-white/15 bg-black/15 hover:border-white/30 hover:bg-white/[0.10]'
                  "
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="cod"
                    class="h-5 w-5 shrink-0 accent-white"
                  />

                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg"
                  >
                    💵
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-semibold text-white">
                        Thanh toán sau (COD)
                      </p>

                      <span
                        v-if="paymentMethod === 'cod'"
                        class="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black"
                      >
                        ĐANG CHỌN
                      </span>
                    </div>

                    <p class="mt-1 text-xs font-medium text-white/70">
                      Đặt tour trước và thanh toán sau theo chính sách của tour
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <!-- ================================================= -->
          <!-- RIGHT -->
          <!-- ================================================= -->

          <BookingPaymentRice
            v-if="tourDetailData"
            :tourData="tourDetailData"
            :idShedule="schedule"
            :people="people"
            :voucherCode="voucherCode"
            :handleThanhToan="handleThanhToan"
            :databooking="databooking.bookingData"
          />
        </div>
      </div>
    </main>
  </div>
</template>
