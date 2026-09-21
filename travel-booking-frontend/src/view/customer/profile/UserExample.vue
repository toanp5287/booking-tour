<script setup>
import paymentService from "../../../services/payment.service";
import { useQuery } from "@tanstack/vue-query";
const dataUser = localStorage.getItem("user");
const user = JSON.parse(dataUser);
const { data: wallet } = useQuery({
  queryKey: ["walletUser", user.id],
  queryFn: async () => {
    const res = await paymentService.wallet();
    return res.data.data;
  },
});
</script>

<template>
  <div class="relative min-h-screen text-white pt-20 pb-16">
    <!-- ================================================== -->
    <!-- BACKGROUND -->
    <!-- ================================================== -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Background"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/50"></div>
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#080b12]/80 via-transparent to-[#080b12]/95"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/70 to-transparent"
      ></div>
    </div>

    <!-- ================================================== -->
    <!-- MAIN CONTENT -->
    <!-- ================================================== -->
    <main class="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
      <!-- HEADER -->
      <section class="mb-8">
        <div
          class="flex flex-col justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <div
              class="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-xl"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Ví điện tử & Hoàn tiền
            </div>
            <h1
              class="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Ví của tôi
            </h1>
            <p class="mt-2 text-xs text-white/70">
              Quản lý số dư tích lũy, theo dõi lịch sử hoàn tiền và chi tiêu
              tour.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.033 8.033 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Làm mới
            </button>
          </div>
        </div>
      </section>

      <!-- WALLET CARDS & QUICK STATS -->
      <section class="mb-10 grid gap-6 md:grid-cols-3">
        <!-- THẺ SỐ DƯ CHÍNH -->
        <div
          class="relative overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-white/[0.07] to-white/[0.02] p-7 backdrop-blur-2xl md:col-span-2 shadow-2xl"
        >
          <div
            class="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
          ></div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20 text-xl font-bold text-emerald-300 border border-emerald-400/30"
              >
                💳
              </div>
              <div>
                <p
                  class="text-[11px] font-semibold uppercase tracking-wider text-white/60"
                >
                  Số dư khả dụng
                </p>
                <p class="text-xs text-emerald-300 font-medium">
                  Sẵn sàng sử dụng
                </p>
              </div>
            </div>
            <span
              class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/80"
            >
              VND (₫)
            </span>
          </div>

          <div class="mt-8 flex flex-wrap items-baseline gap-3">
            <span
              class="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
            >
              {{ Number(wallet.balance).toLocaleString("vi-VN") }} ₫
            </span>
          </div>

          <div
            class="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5"
          >
            <RouterLink
              to="/tours"
              class="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-emerald-300"
            >
              Đặt tour ngay
              <svg
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </RouterLink>
            <p class="text-[11px] text-white/50">
              Tiền hoàn sẽ tự động nạp vào ví sau khi hủy tour thành công.
            </p>
          </div>
        </div>

        <!-- THẺ TỔNG KẾT NHẬN TIỀN -->
        <!-- <div
          class="flex flex-col justify-between rounded-[2rem] border border-white/15 bg-white/[0.07] p-7 backdrop-blur-2xl"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-white/70"
                >Thống kê ví</span
              >
              <span class="text-lg">📊</span>
            </div>

            <div class="mt-6 space-y-4">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-[10px] uppercase tracking-wider text-white/50">
                  Tổng tiền đã nhận lại
                </p>
                <p class="mt-1 font-mono text-xl font-bold text-emerald-300">
                  +0 ₫
                </p>
              </div>

              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-[10px] uppercase tracking-wider text-white/50">
                  Đã sử dụng thanh toán
                </p>
                <p class="mt-1 font-mono text-xl font-bold text-orange-300">
                  -0 ₫
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 text-[10px] text-white/40">
            Dữ liệu được cập nhật theo thời gian thực
          </div>
        </div> -->
      </section>

      <!-- TRANSACTION HISTORY -->
      <section>
        <div
          class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-lg font-bold text-white">Lịch sử biến động ví</h2>
            <p class="text-xs text-white/60">
              Danh sách các giao dịch hoàn tiền và chi tiêu
            </p>
          </div>

          <!-- BỘ LỌC GIAO DỊCH -->
          <div
            class="flex gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] p-1.5 backdrop-blur-xl"
          >
            <button
              type="button"
              class="cursor-pointer rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 transition"
            >
              Tất cả
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-xl px-3.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
            >
              Hoàn tiền (+)
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-xl px-3.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
            >
              Thanh toán (-)
            </button>
          </div>
        </div>

        <!-- DANH SÁCH GIAO DỊCH (MẪU MINH HỌA) -->
        <div class="space-y-3">
          <!-- Giao dịch nhận hoàn tiền -->
          <article
            v-for="value in wallet.transactions"
            class="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.06] p-4.5 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.09] sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3.5">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/15 text-emerald-300 text-base font-bold"
              >
                ↓
              </div>
              <div>
                <p class="text-xs font-bold text-white">
                  {{ value.description }}
                </p>
                <div
                  class="mt-1 flex items-center gap-2 font-mono text-[10px] text-white/50"
                >
                  <span>Mã GD: #{{ value.id }}</span>
                  <span>•</span>
                  <span>
                    {{ new Date(value.created_at).toLocaleString("vi-VN") }}
                  </span>
                  <span>• Đơn #{{ value.booking_id }}</span>
                </div>
              </div>
            </div>

            <div
              class="flex items-center justify-between border-t border-white/10 pt-3 sm:border-0 sm:pt-0 sm:text-right"
            >
              <div>
                <p class="font-mono text-base font-bold text-emerald-300">
                  +{{ Number(value.amount).toLocaleString("vi-VN") }} đ
                </p>
                <!-- <p class="mt-0.5 text-[10px] text-white/50">
                  Số dư sau GD:
                  <span class="font-mono text-white/70">
                    {{ Number(value.balance_after).toLocaleString("vi-VN") }}
                  </span>
                </p> -->
              </div>
            </div>
          </article>
        </div>

        <!-- TRẠNG THÁI TRỐNG (KHI CHƯA CÓ GIAO DỊCH) -->
        <!--
        <div
          class="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-xl"
        >
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
            📜
          </div>
          <h3 class="mt-3 text-sm font-bold text-white">Không có giao dịch nào</h3>
          <p class="mx-auto mt-1 max-w-sm text-xs text-white/50">
            Chưa có phát sinh giao dịch ví nào trong mục này.
          </p>
        </div>
        -->
      </section>
    </main>
  </div>
</template>
