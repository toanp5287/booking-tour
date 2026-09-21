<script setup>
import { ref, computed } from "vue";
import tourService from "../../../services/tour.service";
import { useQuery } from "@tanstack/vue-query";

const {
  data: dataTour,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["tours"],
  queryFn: async () => {
    const response = await tourService.getAll();
    return response.data.data || [];
  },
});

// Format tiền tệ chuẩn Việt Nam
const formatPrice = (price) => {
  if (!price && price !== 0) return "Chưa đặt";
  return Number(price).toLocaleString("vi-VN") + "₫";
};

// Xử lý ảnh Windows & fallback
const getTourImage = (path) => {
  if (!path) {
    return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=300&q=80";
  }
  const cleanPath = path.replaceAll("\\", "/");
  return `http://localhost:8080/${cleanPath}`;
};

// Thống kê động dựa trên dữ liệu thật
const activeTours = computed(() => {
  return dataTour.value?.filter((t) => t.status === "active").length || 0;
});
const inactiveTours = computed(() => {
  return dataTour.value?.filter((t) => t.status !== "active").length || 0;
});
</script>

<template>
  <main class="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 text-white">
    <!-- INTRO -->
    <section
      class="relative mb-7 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8"
    >
      <div
        class="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-400/[0.06] blur-[100px]"
      ></div>

      <div class="relative flex flex-col justify-between gap-6 lg:flex-row">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
            Tour Management
          </div>

          <h2 class="mt-4 text-3xl font-bold tracking-tight">
            Quản lý các tour du lịch
          </h2>

          <p class="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Quản lý toàn bộ tour của TravelGo, bao gồm thông tin tour, biểu giá
            phân loại (Người lớn / Trẻ em / Em bé), số lượng chỗ và trạng thái
            bán tour.
          </p>
        </div>

        <div class="flex items-end">
          <RouterLink
            to="create"
            class="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            + Thêm tour
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
        <p class="text-xs text-white/35">Tổng tour</p>
        <p class="mt-3 text-3xl font-bold">{{ dataTour?.length || 0 }}</p>
        <p class="mt-1 text-xs text-white/25">tất cả tour</p>
      </div>

      <div
        class="rounded-[22px] border border-emerald-300/10 bg-emerald-300/[0.035] p-5"
      >
        <p class="text-xs text-white/35">Đang mở bán</p>
        <p class="mt-3 text-3xl font-bold text-emerald-400">
          {{ activeTours }}
        </p>
        <p class="mt-1 text-xs text-emerald-300/60">đang hoạt động</p>
      </div>

      <div class="rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
        <p class="text-xs text-white/35">Tạm ngưng</p>
        <p class="mt-3 text-3xl font-bold text-white/60">{{ inactiveTours }}</p>
        <p class="mt-1 text-xs text-white/25">chưa kích hoạt</p>
      </div>

      <div
        class="rounded-[22px] border border-orange-300/10 bg-orange-300/[0.035] p-5"
      >
        <p class="text-xs text-white/35">Phân loại vé</p>
        <p class="mt-3 text-3xl font-bold text-orange-200">3</p>
        <p class="mt-1 text-xs text-orange-200/50">NL / TE / Em bé</p>
      </div>
    </section>

    <!-- TOOLBAR -->
    <section
      class="mb-5 rounded-[22px] border border-white/10 bg-white/[0.035] p-4"
    >
      <div
        class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
      >
        <!-- SEARCH -->
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/25">
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên tour, mã tour..."
            class="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/30"
          />
        </div>

        <!-- FILTER -->
        <div class="flex flex-wrap gap-3">
          <select
            class="h-11 rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white/60 outline-none focus:border-orange-300/30"
          >
            <option>Tất cả trạng thái</option>
            <option>Đang mở bán</option>
            <option>Tạm ngưng</option>
          </select>

          <select
            class="h-11 rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white/60 outline-none focus:border-orange-300/30"
          >
            <option>Tất cả điểm đến</option>
            <option>Hà Nội</option>
            <option>Đà Nẵng</option>
            <option>Hạ Long</option>
            <option>Phú Quốc</option>
            <option>Đà Lạt</option>
          </select>

          <select
            class="h-11 rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white/60 outline-none focus:border-orange-300/30"
          >
            <option>Sắp xếp</option>
            <option>Mới nhất</option>
            <option>Giá cao → thấp</option>
            <option>Giá thấp → cao</option>
          </select>
        </div>
      </div>
    </section>

    <!-- TOUR TABLE -->
    <section
      class="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035]"
    >
      <!-- TABLE HEADER -->
      <div
        class="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center"
      >
        <div>
          <h2 class="font-bold">Danh sách Tour</h2>
          <p class="mt-1 text-xs text-white/30">
            Hiển thị {{ dataTour?.length || 0 }} tour trong hệ thống
          </p>
        </div>

        <div class="flex gap-2">
          <button
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/50 hover:bg-white/10 hover:text-white"
          >
            Xuất dữ liệu
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1100px]">
          <thead>
            <tr
              class="border-b border-white/[0.07] text-left text-[10px] uppercase tracking-wider text-white/25"
            >
              <th class="px-5 py-4 font-semibold">Mã tour</th>
              <th class="px-5 py-4 font-semibold">Tên tour & Điểm đến</th>
              <th class="px-5 py-4 font-semibold">Thời lượng</th>
              <th class="px-5 py-4 font-semibold">Trạng thái</th>
              <!-- Cột giá vé phân loại đã đồng bộ với schema mới -->
              <th class="px-5 py-4 font-semibold">Bảng giá vé phân loại</th>
              <th class="px-5 py-4 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-white/[0.06]">
            <!-- LOADING -->
            <tr v-if="isLoading">
              <td colspan="6" class="py-10 text-center text-xs text-white/40">
                Đang tải danh sách tour...
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="!dataTour || dataTour.length === 0">
              <td colspan="6" class="py-10 text-center text-xs text-white/40">
                Chưa có tour nào.
              </td>
            </tr>

            <!-- DATA ROWS -->
            <tr
              v-else
              v-for="value in dataTour"
              :key="value.id"
              class="group hover:bg-white/[0.025]"
            >
              <!-- 1. MÃ TOUR & ẢNH -->
              <td class="px-5 py-5">
                <div class="flex items-center gap-4">
                  <img
                    :src="getTourImage(value.thumbnail)"
                    class="h-14 w-20 rounded-xl object-cover border border-white/10"
                    alt=""
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-semibold font-mono text-sm">
                        #{{ value.id }}
                      </p>
                      <span
                        v-if="value.status === 'active'"
                        class="rounded-full bg-orange-300/10 px-2 py-0.5 text-[8px] font-bold text-orange-200"
                      >
                        HOT
                      </span>
                    </div>
                    <p
                      class="mt-1 text-[10px] text-white/35 max-w-[120px] truncate"
                    >
                      {{ value.slug }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- 2. TÊN TOUR -->
              <td class="px-5 py-5">
                <p class="text-sm font-medium text-white">{{ value.name }}</p>
                <p class="mt-1 text-[10px] text-white/40">
                  {{ value.category?.name || "Danh mục mặc định" }} · Tối đa
                  {{ value.max_people }} khách
                </p>
              </td>

              <!-- 3. THỜI LƯỢNG -->
              <td class="px-5 py-5 text-sm text-white/60">
                {{ value.duration_days }} ngày {{ value.duration_nights }} đêm
              </td>

              <!-- 4. TRẠNG THÁI -->
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  v-if="value.status === 'active' || value.status === 1"
                  class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
                  ></span>
                  Đang mở bán
                </span>

                <span
                  v-else
                  class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/40"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-white/30"></span>
                  Tạm ngưng
                </span>
              </td>

              <!-- 5. BẢNG GIÁ PHÂN LOẠI CHI TIẾT -->
              <td class="px-5 py-5">
                <div class="space-y-1 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-white/40 min-w-[55px]">Người lớn:</span>
                    <span class="font-bold text-white">{{
                      formatPrice(value.price)
                    }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-white/40 min-w-[55px]">Trẻ em:</span>
                    <span class="font-semibold text-orange-300/90">
                      {{
                        value.child_price
                          ? formatPrice(value.child_price)
                          : "Chưa đặt"
                      }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-white/40 min-w-[55px]">Em bé:</span>
                    <span class="text-white/60">
                      {{
                        Number(value.infant_price || 0) > 0
                          ? formatPrice(value.infant_price)
                          : "Miễn phí"
                      }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 6. THAO TÁC (GIỮ NGUYÊN HOÀN TOÀN CÁC ROUTERLINK) -->
              <td class="px-5 py-5">
                <div class="flex justify-end gap-2">
                  <RouterLink
                    :to="`tours/${value.id}`"
                    title="Xem"
                    class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  >
                    👁
                  </RouterLink>

                  <RouterLink
                    :to="`edit/${value.id}`"
                    title="Sửa"
                    class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:bg-orange-300/10 hover:text-orange-200"
                  >
                    ✎
                  </RouterLink>

                  <button
                    onclick="deleteTour()"
                    title="Xóa"
                    class="flex h-9 w-9 items-center justify-center rounded-lg border border-red-300/10 bg-red-300/5 text-red-300/60 hover:bg-red-300/10 hover:text-red-300"
                  >
                    🗑
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        class="flex flex-col justify-between gap-4 border-t border-white/[0.07] p-5 sm:flex-row sm:items-center"
      >
        <p class="text-xs text-white/25">
          Hiển thị 1 - {{ dataTour?.length || 0 }} trên tổng số
          {{ dataTour?.length || 0 }} tour
        </p>

        <div class="flex items-center gap-2">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/30"
          >
            ‹
          </button>

          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-300 font-semibold text-slate-900"
          >
            1
          </button>

          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/30"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
