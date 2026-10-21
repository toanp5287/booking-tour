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
    <div
      class="w-full max-w-lg rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl"
    >
      <!-- SUCCESS -->
      <template v-if="isSuccess">
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-400 text-3xl"
        >
          ✓
        </div>

        <h1 class="text-2xl font-bold">Thanh toán thành công</h1>

        <p class="mt-3 text-white/60">Đơn đặt tour của bạn đã được xác nhận.</p>

        <div class="mt-6 rounded-xl bg-white/5 p-4 text-left">
          <p class="text-sm text-white/50">Mã thanh toán</p>

          <p class="mt-1 break-all font-medium text-orange-300">
            {{ paymentCode }}
          </p>

          <p class="mt-4 text-sm text-white/50">Mã booking</p>

          <p class="mt-1 font-medium">#{{ bookingId }}</p>
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            @click="goToBooking"
            class="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Xem booking
          </button>

          <button
            @click="goToGroupRequests"
            class="flex-1 rounded-xl bg-blue-600/80 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Yêu cầu tour đoàn
          </button>

          <button
            @click="goHome"
            class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Về trang chủ
          </button>
        </div>
      </template>

      <!-- FAILED -->
      <template v-else>
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400 text-3xl"
        >
          ✕
        </div>

        <h1 class="text-2xl font-bold">Thanh toán thất bại</h1>

        <p class="mt-3 text-white/60">
          Giao dịch VNPAY không thành công hoặc đã bị hủy.
        </p>

        <button
          @click="goHome"
          class="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
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
