<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const status = computed(() => route.query.status);
const paymentCode = computed(() => route.query.payment_code);
const bookingId = computed(() => route.query.booking_id);

const isSuccess = computed(() => status.value === "success");

const goToBooking = () => {
  router.push("/myBooking");
};

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <div
    class="min-h-screen bg-[#07090d] text-white flex items-center justify-center px-4"
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

        <div class="mt-6 flex gap-3">
          <button
            @click="goToBooking"
            class="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-black transition hover:bg-orange-400"
          >
            Xem booking
          </button>

          <button
            @click="goHome"
            class="flex-1 rounded-xl border border-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/5"
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
          class="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-black transition hover:bg-orange-400"
        >
          Về trang chủ
        </button>
      </template>
    </div>
  </div>
</template>
