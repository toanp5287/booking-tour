<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import TourCard from "../../../components/tour/TourCard.vue";
import TourFilter from "../../../components/tour/TourFilter.vue";

interface FilterPayload {
  categories: string[];
  price: string | null;
  durations: string[];
}

const shearch = ref("");
const sortBy = ref("popular");

const activeFilters = ref<FilterPayload>({
  categories: [],
  price: null,
  durations: [],
});

const clearSearch = () => {
  shearch.value = "";
};

const handleFilterChange = (filters: FilterPayload) => {
  activeFilters.value = filters;
};
</script>

<template>
  <div
    class="relative min-h-screen bg-[#090b10] font-sans text-slate-100 antialiased selection:bg-amber-300/20 selection:text-amber-200"
  >
    <!-- BACKGROUND ATMOSPHERE (LÌ & ÊM MẮT) -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <img
        src="/hero-bg.jpg"
        alt="Travel horizon"
        class="absolute inset-0 h-full w-full object-cover opacity-25 filter blur-[0.5px]"
      />
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#090b10]/80 via-[#090b10]/95 to-[#090b10]"
      ></div>
      <div
        class="absolute left-1/2 top-12 h-64 w-[600px] -translate-x-1/2 rounded-full bg-amber-400/5 blur-[120px]"
      ></div>
    </div>

    <main class="relative z-10 pt-20">
      <!-- HERO SEARCH HEADER -->
      <section class="border-b border-white/[0.06] pb-14 pt-8">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div class="max-w-2xl">
            <!-- Badge -->
            <div
              class="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-amber-200/90 backdrop-blur-md"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-amber-300"></span>
              <span>Khám phá kỳ nghỉ trong mơ</span>
            </div>

            <h1
              class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Hành trình trải nghiệm
              <span
                class="bg-gradient-to-r from-amber-200 via-amber-100 to-white/70 bg-clip-text text-transparent"
              >
                đích thực
              </span>
            </h1>

            <p class="mt-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Lựa chọn điểm đến lý tưởng, theo dõi lịch khởi hành mới nhất và
              tận hưởng dịch vụ lưu trú trọn gói chất lượng cao.
            </p>
          </div>

          <!-- COMPACT MODERN SEARCH BAR -->
          <div class="mt-8 w-full max-w-3xl">
            <div
              class="flex items-center rounded-2xl border border-white/[0.08] bg-[#0f131c] p-2 shadow-xl transition focus-within:border-amber-300/40 focus-within:shadow-[0_0_25px_rgba(251,191,36,0.08)]"
            >
              <!-- Search Icon -->
              <div
                class="flex h-10 w-11 shrink-0 items-center justify-center text-amber-200/70"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <!-- Input -->
              <div class="min-w-0 flex-1 px-2">
                <label
                  class="block text-[9px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  Địa danh & tour
                </label>
                <input
                  v-model="shearch"
                  type="text"
                  placeholder="Bạn muốn đi đâu? (Đà Lạt, Hạ Long, Sa Pa...)"
                  class="w-full bg-transparent text-xs font-medium text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <!-- Clear button -->
              <button
                v-if="shearch.trim()"
                type="button"
                @click="clearSearch"
                class="mr-2 rounded-lg p-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                title="Xóa từ khóa"
              >
                ✕
              </button>

              <!-- Action button -->
              <button
                type="button"
                class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-amber-300 px-5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-95"
              >
                <span>Tìm kiếm</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TOUR CATALOG LAYOUT -->
      <section class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div class="grid gap-8 lg:grid-cols-[260px_1fr]">
          <!-- SIDEBAR BỘ LỌC -->
          <aside class="sticky top-24 h-fit">
            <TourFilter @filter-change="handleFilterChange" />
          </aside>

          <!-- KHU VỰC DANH SÁCH TOUR -->
          <div>
            <!-- Controls Bar -->
            <div
              class="mb-6 flex flex-col justify-between gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center"
            >
              <div>
                <h2
                  class="text-lg font-bold tracking-tight text-white sm:text-xl"
                >
                  Danh sách hành trình
                </h2>
                <p class="mt-0.5 text-xs text-slate-400">
                  Giá đã bao gồm vé máy bay, phòng khách sạn và hướng dẫn viên
                </p>
              </div>

              <!-- Sort Dropdown -->
              <!-- <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Sắp xếp:</span>
                <select
                  v-model="sortBy"
                  class="cursor-pointer rounded-xl border border-white/10 bg-[#0f131c] px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition focus:border-amber-300/40"
                >
                  <option value="popular">Phổ biến nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="rating">Đánh giá cao nhất</option>
                </select>
              </div> -->
            </div>

            <!-- COMPONENT DANH SÁCH THẺ TOUR -->
            <TourCard
              :shearch="shearch"
              :filters="activeFilters"
              :sort-by="sortBy"
            />
          </div>
        </div>
      </section>

      <!-- AI TRIP PLANNER BANNER -->
      <section class="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <div
          class="flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/[0.08] bg-[#0f131c] p-7 sm:p-9 md:flex-row md:items-center"
        >
          <div class="max-w-xl">
            <span
              class="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
            >
              ✦ TravelGo Assistant
            </span>
            <h3 class="mt-2.5 text-xl font-bold text-white">
              Chưa chọn được lịch trình ưng ý?
            </h3>
            <p class="mt-1 text-xs leading-relaxed text-slate-400">
              Chia sẻ số ngày rảnh và dự tính ngân sách, hệ thống AI sẽ phân
              tích và gợi ý gói tour phù hợp với gia đình hoặc nhóm bạn.
            </p>
          </div>

          <RouterLink
            to="/aiTripPlanner"
            class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-200/30 bg-amber-300/10 px-5 py-2.5 text-xs font-bold text-amber-200 transition hover:bg-amber-300 hover:text-slate-950 active:scale-95"
          >
            <span>Tạo lộ trình AI</span>
            <span>→</span>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>
