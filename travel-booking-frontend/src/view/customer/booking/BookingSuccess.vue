<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";

const bookingData = ref({
  bookingCode: "TG20260904",
  tourName: "Khám phá Đà Nẵng - Hội An 4 ngày 3 đêm",
  departureDate: "15/09/2026",
  departureLocation: "Sân bay Đà Nẵng",
  guests: "02 người lớn, 01 trẻ em",
  paymentMethod: "VNPAY (Đã thanh toán)",
  totalAmount: "12.970.000đ",
  customerName: "Nguyễn Văn A",
  customerPhone: "0901 234 567",
  customerEmail: "nguyenvana@example.com",
});
</script>

<template>
  <div class="relative min-h-screen text-white pt-30 pb-16">
    <!-- KHUNG NỀN CỐ ĐỊNH -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/40"></div>
      <div
        class="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-[#080b12]/80"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent"
      ></div>
    </div>

    <main class="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">
      <!-- THẺ THÔNG BÁO CHÍNH -->
      <section
        class="overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.08] p-8 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-10 text-center"
      >
        <!-- Icon thành công -->
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]"
        >
          <svg
            class="h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div class="mt-6">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300"
          >
            <span>✦</span> Đặt tour thành công
          </div>
          <h1
            class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white"
          >
            Cảm ơn bạn đã đồng hành!
          </h1>
          <p class="mt-2 text-sm text-white/80 leading-6">
            Mã đặt tour của bạn là
            <span class="font-bold text-white tracking-wider"
              >#{{ bookingData.bookingCode }}</span
            >. Chi tiết hành trình và vé điện tử đã được gửi tới email của bạn.
          </p>
        </div>

        <!-- THẺ TÓM TẮT ĐƠN HÀNG (BILL TICKET) -->
        <div
          class="mt-8 rounded-2xl border border-white/15 bg-black/30 p-6 text-left space-y-4"
        >
          <div class="border-b border-white/10 pb-4">
            <p
              class="text-xs uppercase tracking-widest text-white/60 font-semibold"
            >
              Chuyến đi đã chọn
            </p>
            <h3 class="mt-1 text-lg font-bold text-white">
              {{ bookingData.tourName }}
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-xs text-white/60">Ngày khởi hành</p>
              <p class="mt-0.5 font-semibold text-white">
                {{ bookingData.departureDate }}
              </p>
            </div>
            <div>
              <p class="text-xs text-white/60">Điểm đón khách</p>
              <p class="mt-0.5 font-semibold text-white">
                {{ bookingData.departureLocation }}
              </p>
            </div>
            <div>
              <p class="text-xs text-white/60">Số lượng khách</p>
              <p class="mt-0.5 font-semibold text-white">
                {{ bookingData.guests }}
              </p>
            </div>
            <div>
              <p class="text-xs text-white/60">Phương thức thanh toán</p>
              <p class="mt-0.5 font-semibold text-emerald-300">
                {{ bookingData.paymentMethod }}
              </p>
            </div>
          </div>

          <div
            class="border-t border-white/10 pt-4 flex items-baseline justify-between"
          >
            <span class="text-sm font-semibold text-white/80"
              >Tổng thanh toán</span
            >
            <span class="text-2xl font-extrabold text-white">{{
              bookingData.totalAmount
            }}</span>
          </div>
        </div>

        <!-- THÔNG TIN LIÊN HỆ -->
        <div
          class="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left text-xs text-white/75 space-y-2"
        >
          <div class="flex justify-between">
            <span class="text-white/60">Người đặt:</span>
            <span class="font-semibold text-white">{{
              bookingData.customerName
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">Số điện thoại:</span>
            <span class="font-semibold text-white">{{
              bookingData.customerPhone
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">Email xác nhận:</span>
            <span class="font-semibold text-white">{{
              bookingData.customerEmail
            }}</span>
          </div>
        </div>

        <!-- NHÓM NÚT ĐIỀU HƯỚNG -->
        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <RouterLink
            to="/my-trips"
            class="flex-1 rounded-2xl bg-white py-3.5 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100 text-center"
          >
            Quản lý chuyến đi
          </RouterLink>

          <RouterLink
            to="/tours"
            class="flex-1 rounded-2xl border border-white/20 bg-white/10 py-3.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20 text-center"
          >
            Khám phá thêm tour khác
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>
