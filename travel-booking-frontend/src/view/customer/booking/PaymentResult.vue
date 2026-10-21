<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useBookingStore } from "@/stores/booking";

const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();

const status = computed(() => route.query.status);
const paymentCode = computed(() => route.query.payment_code);
const bookingId = computed(() => route.query.booking_id);

const isSuccess = computed(() => status.value === "success");

onMounted(() => {
  if (isSuccess.value) {
    localStorage.removeItem("bookingData");

    if (bookingStore.clearBooking) {
      bookingStore.clearBooking();
    }
  }
});

const goToBooking = () => {
  router.push("/myBooking");
};

const goHome = () => {
  router.push("/");
};

const goToGroupRequests = () => {
  router.push("/myGroupRequests");
};
</script>

<template>
  <div
    class="customer-redesign min-h-screen bg-[#07090d] text-white flex items-center justify-center px-4"
  >
    <div class="travel-surface w-full max-w-lg rounded-2xl p-6 text-center sm:p-8">
      <!-- SUCCESS -->
      <template v-if="isSuccess">
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-3xl text-emerald-700"
        >
          ✓
        </div>

        <h1 class="text-2xl font-bold">Thanh toán thành công</h1>

        <p class="mt-3 text-travel-muted">Đơn đặt tour của bạn đã được xác nhận.</p>

        <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p class="text-sm text-travel-muted">Mã thanh toán</p>

          <p class="mt-1 break-all font-medium text-orange-300">
            {{ paymentCode }}
          </p>

          <p class="mt-4 text-sm text-travel-muted">Mã booking</p>

          <p class="mt-1 font-medium">#{{ bookingId }}</p>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            @click="goToBooking"
            class="min-h-12 rounded-xl bg-travel-orange px-4 py-3 font-semibold text-travel-blue transition hover:bg-amber-500"
          >
            Xem booking
          </button>

          <button
            @click="goToGroupRequests"
            class="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-travel-blue transition hover:bg-slate-50"
          >
            Yêu cầu tour đoàn
          </button>

          <button
            @click="goHome"
            class="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 sm:col-span-2"
          >
            Về trang chủ
          </button>
        </div>
      </template>

      <!-- FAILED -->
      <template v-else>
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50 text-3xl text-red-700"
        >
          ✕
        </div>

        <h1 class="text-2xl font-bold">Thanh toán thất bại</h1>

        <p class="mt-3 text-travel-muted">
          Giao dịch VNPAY không thành công hoặc đã bị hủy.
        </p>

        <button
          @click="goHome"
          class="mt-6 min-h-12 rounded-xl bg-travel-orange px-6 py-3 font-semibold text-travel-blue transition hover:bg-amber-500"
        >
          Về trang chủ
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.customer-redesign {
  background: #f8fafc;
  color: #475569;
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

.customer-redesign a:hover {
  color: #2563eb;
}
</style>
