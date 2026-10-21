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
  <div class="customer-redesign relative min-h-screen text-white pt-30 pb-16">
    <!-- KHUNG NỀN CỐ ĐỊNH -->
    <div class="customer-atmosphere fixed inset-0 z-0 overflow-hidden pointer-events-none">
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
        class="travel-surface overflow-hidden rounded-2xl p-6 text-center sm:p-10"
      >
        <!-- Icon thành công -->
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 sm:h-20 sm:w-20"
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
            class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800"
          >
            <span>✦</span> Đặt tour thành công
          </div>
          <h1
            class="mt-3 text-3xl font-extrabold tracking-tight text-travel-ink sm:text-4xl"
          >
            Cảm ơn bạn đã đồng hành!
          </h1>
          <p class="mt-2 text-sm leading-6 text-travel-muted">
            Mã đặt tour của bạn là
            <span             class="font-bold tracking-wider text-travel-blue"
              >#{{ bookingData.bookingCode }}</span
            >. Chi tiết hành trình và vé điện tử đã được gửi tới email của bạn.
          </p>
        </div>

        <!-- THẺ TÓM TẮT ĐƠN HÀNG (BILL TICKET) -->
        <div
          class="mt-8 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left sm:p-6"
        >
          <div class="border-b border-white/10 pb-4">
            <p
              class="text-xs font-semibold uppercase tracking-widest text-travel-muted"
            >
              Chuyến đi đã chọn
            </p>
            <h3 class="mt-1 text-lg font-bold text-travel-ink">
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
          class="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-left text-sm text-travel-muted"
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
            class="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-travel-orange px-4 py-3 text-center text-sm font-bold text-travel-blue transition hover:bg-amber-500"
          >
            Quản lý chuyến đi
          </RouterLink>

          <RouterLink
            to="/tours"
            class="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-travel-blue transition hover:bg-slate-50"
          >
            Khám phá thêm tour khác
          </RouterLink>
        </div>
      </section>
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
