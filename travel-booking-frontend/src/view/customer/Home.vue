<script setup>
import { useQuery } from "@tanstack/vue-query";
import tourService from "../../services/tour.service";
import { computed, ref, watch, nextTick } from "vue";
import { RouterLink } from "vue-router";

const userData = localStorage.getItem("user");
const user = JSON.parse(userData);
const {
  data: dataTour,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: ["tours"],
  queryFn: async () => {
    const response = await tourService.getAll();
    return response.data.data || [];
  },
});

const search = ref("");
const searchResultsSection = ref(null);


const toursList = computed(() => {
  return Array.isArray(dataTour.value) ? dataTour.value : [];
});

const filteredTours = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return [];

  return toursList.value.filter((item) => {
    const name = item.name?.toLowerCase().includes(keyword);
    const slug = item.slug?.toLowerCase().includes(keyword);
    const description = item.description?.toLowerCase().includes(keyword);
    const country = item.country?.toLowerCase().includes(keyword);
    return name || slug || description || country;
  });
});


watch(search, (newVal) => {
  if (newVal.trim().length >= 2) {
    nextTick(() => {
      searchResultsSection.value?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
});

const clearSearch = () => {
  search.value = "";
};
</script>

<template>
  <div
    class="min-h-screen bg-[#07090d] font-sans text-slate-100 antialiased selection:bg-orange-400/20 selection:text-orange-200"
  >
    <!-- =========================================================
         HERO SECTION
    ========================================================== -->
    <section class="relative min-h-[92vh] overflow-hidden lg:min-h-screen">
      <!-- HERO IMAGE -->
      <img
        src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=95"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover object-center scale-[1.02] transform-gpu transition duration-1000"
      />

      <!-- CINEMATIC OVERLAYS -->
      <div class="absolute inset-0 bg-[#07090d]/40"></div>
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#07090d]/95 via-[#07090d]/55 to-transparent"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#07090d] via-transparent to-[#07090d]/30"
      ></div>

      <!-- SUNSET GLOW ORBS -->
      <div
        class="pointer-events-none absolute left-[8%] top-[25%] h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-orange-500/20 to-amber-300/10 blur-[140px]"
      ></div>
      <div
        class="pointer-events-none absolute right-[10%] top-[40%] h-[380px] w-[380px] rounded-full bg-rose-500/10 blur-[130px]"
      ></div>

      <!-- HERO CONTENT -->
      <div
        class="relative mx-auto flex min-h-[92vh] max-w-[1440px] items-center px-6 pb-28 pt-36 sm:px-8 lg:min-h-screen lg:px-12"
      >
        <div class="w-full max-w-3xl">
          <!-- BADGE -->
          <div
            class="inline-flex items-center gap-2.5 rounded-full border border-orange-400/25 bg-[#0d1118]/70 px-4 py-1.5 text-xs font-medium text-orange-200 shadow-xl backdrop-blur-xl"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-orange-400"
              ></span>
            </span>
            <span>Hành trình hoàng hôn đang chờ đón bạn</span>
          </div>

          <!-- HEADLINE -->
          <h1
            class="mt-6 text-5xl font-black tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-[76px] lg:leading-[1.05]"
          >
            Đi xa hơn.
            <br />
            <span
              class="bg-gradient-to-r from-white via-white/85 to-orange-200/60 bg-clip-text text-transparent"
            >
              Sống trọn vẹn hơn.
            </span>
          </h1>

          <p
            class="mt-6 max-w-xl text-base leading-relaxed text-slate-300/80 sm:text-lg"
          >
            Khám phá những vùng đất nguyên bản, trải nghiệm các tour độc bản và
            kiến tạo chuyến đi của riêng bạn với sự đồng hành từ TravelGo.
          </p>

          <!-- SEARCH BAR COMPONENT -->
          <div class="mt-10 w-full max-w-2xl">
            <div
              class="relative flex items-center rounded-2xl border border-white/10 bg-[#0d1118]/85 p-2 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-white/20 focus-within:border-orange-300/50 focus-within:bg-[#111720]/95 focus-within:shadow-[0_0_35px_rgba(255,184,107,0.18)]"
            >
              <!-- ICON -->
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center text-orange-300/80"
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

              <!-- INPUT -->
              <div class="min-w-0 flex-1 px-2">
                <label
                  class="block text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300/70"
                >
                  Khám phá điểm đến
                </label>
                <input
                  v-model="search"
                  type="text"
                  placeholder="Bạn muốn đi đâu? (Đà Lạt, Sa Pa, Hạ Long...)"
                  class="mt-0.5 w-full bg-transparent text-sm font-medium text-white placeholder:text-white/25 outline-none"
                />
              </div>

              <!-- CLEAR / SUBMIT BUTTON -->
              <button
                v-if="search.trim()"
                type="button"
                @click="clearSearch"
                class="mr-2 rounded-lg p-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>

              <button
                type="button"
                class="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-300 to-orange-400 px-6 text-xs font-bold text-slate-950 shadow-lg shadow-orange-400/20 transition hover:brightness-110 active:scale-95"
              >
                <span>Tìm tour</span>
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- QUICK SUGGESTIONS -->
          <div class="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span class="text-white/40">Gợi ý nhanh:</span>
            <button
              v-for="item in ['Đà Nẵng', 'Đà Lạt', 'Phú Quốc', 'Hà Giang']"
              :key="item"
              type="button"
              @click="search = item"
              class="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-slate-300 backdrop-blur-md transition hover:border-orange-300/30 hover:bg-orange-400/10 hover:text-orange-200"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </div>

      <!-- HERO BOTTOM KPI BAR -->
      <div class="absolute bottom-6 left-0 right-0 z-10 hidden lg:block">
        <div class="mx-auto max-w-[1440px] px-12">
          <div
            class="flex items-center justify-between border-t border-white/[0.08] pt-6"
          >
            <div class="flex items-center gap-12">
              <div>
                <p class="font-mono text-2xl font-bold text-white">
                  500<span class="text-orange-300">+</span>
                </p>
                <p class="text-xs text-white/40">Tour trải nghiệm chọn lọc</p>
              </div>
              <div class="h-8 w-px bg-white/10"></div>
              <div>
                <p class="font-mono text-2xl font-bold text-white">
                  63<span class="text-orange-300">+</span>
                </p>
                <p class="text-xs text-white/40">Điểm đến khắp Việt Nam</p>
              </div>
              <div class="h-8 w-px bg-white/10"></div>
              <div>
                <p class="font-mono text-2xl font-bold text-white">
                  10.000<span class="text-orange-300">+</span>
                </p>
                <p class="text-xs text-white/40">Khách hàng tin tưởng</p>
              </div>
            </div>

            <div class="text-right">
              <p
                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300/50"
              >
                Curated Journey
              </p>
              <p class="mt-0.5 text-xs text-slate-400">
                Trải nghiệm du lịch tinh tế & đẳng cấp
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================
         FEATURED TOURS & SEARCH RESULTS SECTION
    ========================================================== -->
    <section
      ref="searchResultsSection"
      class="relative bg-[#07090d] py-24 scroll-mt-6"
    >
      <div class="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <!-- HEADER -->
        <div
          class="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <div
              class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300/70"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
              {{ search.trim() ? "Tìm kiếm" : "Featured Tours" }}
            </div>
            <h2
              class="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {{
                search.trim()
                  ? `Kết quả tìm kiếm cho "${search.trim()}"`
                  : "Những hành trình nổi bật nhất"
              }}
            </h2>
            <p class="mt-2 text-sm text-slate-400">
              {{
                search.trim()
                  ? `Tìm thấy ${filteredTours.length} hành trình phù hợp với tiêu chí của bạn.`
                  : "Các tour được yêu thích và đánh giá cao nhất bởi cộng đồng du khách TravelGo."
              }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              v-if="search.trim()"
              type="button"
              @click="clearSearch"
              class="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              ✕ Bỏ lọc
            </button>
            <RouterLink
              to="/tours"
              class="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-200"
            >
              <span>Xem tất cả tour</span>
              <span class="transition-transform group-hover:translate-x-0.5"
                >→</span
              >
            </RouterLink>
          </div>
        </div>

        <!-- LOADING SKELETON -->
        <div
          v-if="isLoading"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="animate-pulse rounded-3xl border border-white/5 bg-[#0d1118] p-4"
          >
            <div class="h-64 rounded-2xl bg-white/5"></div>
            <div class="mt-4 h-4 w-3/4 rounded bg-white/5"></div>
            <div class="mt-2 h-3 w-1/2 rounded bg-white/5"></div>
            <div class="mt-6 flex justify-between">
              <div class="h-5 w-20 rounded bg-white/5"></div>
              <div class="h-8 w-8 rounded-xl bg-white/5"></div>
            </div>
          </div>
        </div>

        <!-- ERROR STATE -->
        <div
          v-else-if="isError"
          class="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center"
        >
          <p class="text-sm font-semibold text-rose-300">
            Không thể tải dữ liệu tour
          </p>
          <p class="mt-1 text-xs text-slate-400">
            Vui lòng kiểm tra lại kết nối hoặc thử lại sau.
          </p>
          <button
            type="button"
            @click="refetch"
            class="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
          >
            Tải lại dữ liệu
          </button>
        </div>

        <!-- MAIN DATA DISPLAY -->
        <div v-else class="relative w-full">
          <!-- =========================================================
               TRƯỜNG HỢP 1: ĐANG TÌM KIẾM (HIỆN DẠNG GRID TĨNH)
          ========================================================== -->
          <div v-if="search.trim()">
            <!-- KHÔNG TÌM THẤY KẾT QUẢ -->
            <div
              v-if="filteredTours.length === 0"
              class="flex flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-[#0d1118]/80 py-16 text-center backdrop-blur-xl"
            >
              <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl text-orange-300"
              >
                🔍
              </div>
              <h3 class="mt-4 text-lg font-bold text-white">
                Không tìm thấy tour phù hợp
              </h3>
              <p class="mt-1 max-w-sm text-xs text-slate-400">
                Không có tour nào khớp với từ khóa "{{ search.trim() }}". Hãy
                thử tìm theo địa danh khác như Đà Lạt, Sa Pa, Hạ Long...
              </p>
              <button
                type="button"
                @click="clearSearch"
                class="mt-6 rounded-xl border border-orange-300/30 bg-orange-300/10 px-5 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-300 hover:text-slate-950"
              >
                Xem tất cả tour gợi ý
              </button>
            </div>

            <!-- CÓ KẾT QUẢ: GRID 4 CỘT -->
            <div
              v-else
              class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <article
                v-for="value in filteredTours"
                :key="`search-${value.id}`"
                class="group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1118] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-300/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
              >
                <!-- IMAGE -->
                <div class="relative h-64 overflow-hidden">
                  <img
                    :src="
                      value.thumbnail || value.image
                        ? `http://localhost:8080/${(value.thumbnail || value.image).replaceAll('\\', '/')}`
                        : 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85'
                    "
                    :alt="value.name"
                    class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-[#0d1118] via-[#0d1118]/20 to-transparent"
                  ></div>

                  <!-- RATING BADGE -->
                  <div
                    class="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md"
                  >
                    <span class="text-amber-300">★</span>
                    <span>{{ value.rating || "4.9" }}</span>
                  </div>

                  <!-- LOCATION & TITLE OVERLAY -->
                  <div class="absolute bottom-4 left-5 right-5">
                    <span
                      class="text-[11px] font-semibold uppercase tracking-wider text-orange-200/80"
                    >
                      {{ value.country || "Việt Nam" }}
                    </span>
                    <h3
                      class="mt-1 line-clamp-1 text-lg font-bold text-white transition group-hover:text-orange-200"
                    >
                      {{ value.name }}
                    </h3>
                  </div>
                </div>

                <!-- INFO FOOTER -->
                <div class="p-5">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <p class="text-xs text-slate-400">
                        {{
                          value.duration_days
                            ? `${value.duration_days} ngày ${value.duration_nights || 0} đêm`
                            : value.duration || "3 ngày 2 đêm"
                        }}
                      </p>
                      <p
                        class="mt-0.5 font-mono text-lg font-bold text-orange-300"
                      >
                        {{ Number(value.price || 0).toLocaleString("vi-VN") }}₫
                      </p>
                    </div>

                    <RouterLink
                      :to="`/tours/${value.id}`"
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-orange-300 hover:bg-orange-300 hover:text-slate-950"
                    >
                      →
                    </RouterLink>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- =========================================================
               TRƯỜNG HỢP 2: CHƯA TÌM KIẾM -> CAROUSEL VÔ TẬN
          ========================================================== -->
          <div v-else class="relative w-full overflow-hidden">
            <div
              class="flex w-max animate-[tour-slide_40s_linear_infinite] hover:[animation-play-state:paused]"
            >
              <!-- GROUP 1 -->
              <div class="flex shrink-0 gap-6 pr-6">
                <article
                  v-for="value in toursList"
                  :key="`tour-1-${value.id}`"
                  class="group w-[340px] shrink-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1118] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-300/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:w-[370px]"
                >
                  <div class="relative h-72 overflow-hidden">
                    <img
                      :src="
                        value.thumbnail || value.image
                          ? `http://localhost:8080/${(value.thumbnail || value.image).replaceAll('\\', '/')}`
                          : 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85'
                      "
                      :alt="value.name"
                      class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div
                      class="absolute inset-0 bg-gradient-to-t from-[#0d1118] via-[#0d1118]/20 to-transparent"
                    ></div>

                    <div
                      class="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md"
                    >
                      <span class="text-amber-300">★</span>
                      <span>{{ value.rating || "4.9" }}</span>
                    </div>

                    <div class="absolute bottom-4 left-5 right-5">
                      <span
                        class="text-[11px] font-semibold uppercase tracking-wider text-orange-200/80"
                      >
                        {{ value.country || "Việt Nam" }}
                      </span>
                      <h3
                        class="mt-1 line-clamp-1 text-xl font-bold text-white transition group-hover:text-orange-200"
                      >
                        {{ value.name }}
                      </h3>
                    </div>
                  </div>

                  <div class="p-5">
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <p class="text-xs text-slate-400">
                          {{
                            value.duration_days
                              ? `${value.duration_days} ngày ${value.duration_nights || 0} đêm`
                              : value.duration || "3 ngày 2 đêm"
                          }}
                        </p>
                        <p
                          class="mt-0.5 font-mono text-lg font-bold text-orange-300"
                        >
                          {{
                            Number(value.price || 0).toLocaleString("vi-VN")
                          }}₫
                        </p>
                      </div>

                      <RouterLink
                        :to="`/tours/${value.id}`"
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-orange-300 hover:bg-orange-300 hover:text-slate-950"
                      >
                        →
                      </RouterLink>
                    </div>
                  </div>
                </article>
              </div>

              <!-- GROUP 2 (LOOP DUPLICATE) -->
              <div class="flex shrink-0 gap-6 pr-6" aria-hidden="true">
                <article
                  v-for="value in toursList"
                  :key="`tour-2-${value.id}`"
                  class="group w-[340px] shrink-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1118] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-300/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:w-[370px]"
                >
                  <div class="relative h-72 overflow-hidden">
                    <img
                      :src="
                        value.thumbnail || value.image
                          ? `http://localhost:8080/${(value.thumbnail || value.image).replaceAll('\\', '/')}`
                          : 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85'
                      "
                      :alt="value.name"
                      class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div
                      class="absolute inset-0 bg-gradient-to-t from-[#0d1118] via-[#0d1118]/20 to-transparent"
                    ></div>

                    <div
                      class="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md"
                    >
                      <span class="text-amber-300">★</span>
                      <span>{{ value.rating || "4.9" }}</span>
                    </div>

                    <div class="absolute bottom-4 left-5 right-5">
                      <span
                        class="text-[11px] font-semibold uppercase tracking-wider text-orange-200/80"
                      >
                        {{ value.country || "Việt Nam" }}
                      </span>
                      <h3
                        class="mt-1 line-clamp-1 text-xl font-bold text-white transition group-hover:text-orange-200"
                      >
                        {{ value.name }}
                      </h3>
                    </div>
                  </div>

                  <div class="p-5">
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <p class="text-xs text-slate-400">
                          {{
                            value.duration_days
                              ? `${value.duration_days} ngày ${value.duration_nights || 0} đêm`
                              : value.duration || "3 ngày 2 đêm"
                          }}
                        </p>
                        <p
                          class="mt-0.5 font-mono text-lg font-bold text-orange-300"
                        >
                          {{
                            Number(value.price || 0).toLocaleString("vi-VN")
                          }}₫
                        </p>
                      </div>

                      <RouterLink
                        :to="`/tours/${value.id}`"
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-orange-300 hover:bg-orange-300 hover:text-slate-950"
                      >
                        →
                      </RouterLink>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <!-- SIDE GRADIENT VIGNETTES -->
            <div
              class="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#07090d] to-transparent"
            ></div>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#07090d] to-transparent"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================
         POPULAR DESTINATIONS GRID
    ========================================================== -->
    <section class="bg-[#0b0f17] py-28">
      <div class="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <div class="mb-14">
          <div
            class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300/70"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
            Destinations
          </div>
          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Điểm đến được yêu thích
          </h2>
          <p class="mt-2 text-sm text-slate-400">
            Từ cao nguyên sương mờ đến những vịnh biển ngọc ngà của Việt Nam.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <RouterLink
            to="/destinations"
            class="group relative h-96 overflow-hidden rounded-3xl border border-white/10 bg-[#0d1118]"
          >
            <img
              src="https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=900&q=85"
              alt="Đà Lạt"
              class="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-[#07090d]/90 via-[#07090d]/30 to-transparent"
            ></div>
            <div class="absolute bottom-6 left-6 right-6">
              <span
                class="rounded-full bg-orange-400/20 px-2.5 py-1 text-[10px] font-bold text-orange-300"
              >
                Cao nguyên sương mù
              </span>
              <h3
                class="mt-2 text-2xl font-bold text-white group-hover:text-orange-200 transition"
              >
                Đà Lạt
              </h3>
              <p class="mt-1 text-xs text-slate-400">Hơn 45 tour đang mở</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/destinations"
            class="group relative h-96 overflow-hidden rounded-3xl border border-white/10 bg-[#0d1118]"
          >
            <img
              src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=85"
              alt="Hạ Long"
              class="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-[#07090d]/90 via-[#07090d]/30 to-transparent"
            ></div>
            <div class="absolute bottom-6 left-6 right-6">
              <span
                class="rounded-full bg-cyan-400/20 px-2.5 py-1 text-[10px] font-bold text-cyan-300"
              >
                Kỳ quan di sản
              </span>
              <h3
                class="mt-2 text-2xl font-bold text-white group-hover:text-orange-200 transition"
              >
                Hạ Long
              </h3>
              <p class="mt-1 text-xs text-slate-400">Hơn 30 tour du thuyền</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/destinations"
            class="group relative h-96 overflow-hidden rounded-3xl border border-white/10 bg-[#0d1118]"
          >
            <img
              src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=85"
              alt="Phú Quốc"
              class="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-[#07090d]/90 via-[#07090d]/30 to-transparent"
            ></div>
            <div class="absolute bottom-6 left-6 right-6">
              <span
                class="rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-bold text-amber-300"
              >
                Đảo ngọc hoàng hôn
              </span>
              <h3
                class="mt-2 text-2xl font-bold text-white group-hover:text-orange-200 transition"
              >
                Phú Quốc
              </h3>
              <p class="mt-1 text-xs text-slate-400">Hơn 50 tour nghỉ dưỡng</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/destinations"
            class="group relative h-96 overflow-hidden rounded-3xl border border-white/10 bg-[#0d1118]"
          >
            <img
              src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=85"
              alt="Hà Giang"
              class="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-[#07090d]/90 via-[#07090d]/30 to-transparent"
            ></div>
            <div class="absolute bottom-6 left-6 right-6">
              <span
                class="rounded-full bg-rose-400/20 px-2.5 py-1 text-[10px] font-bold text-rose-300"
              >
                Chinh phục đèo mây
              </span>
              <h3
                class="mt-2 text-2xl font-bold text-white group-hover:text-orange-200 transition"
              >
                Hà Giang
              </h3>
              <p class="mt-1 text-xs text-slate-400">Hơn 20 tour phượt đèo</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- =========================================================
         WHY CHOOSE TRAVELGO (FEATURES)
    ========================================================== -->
    <section class="bg-[#07090d] py-28">
      <div class="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <div class="grid gap-16 lg:grid-cols-12 lg:items-center">
          <div class="lg:col-span-5">
            <div
              class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300/70"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
              Why TravelGo
            </div>
            <h2
              class="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl"
            >
              Không chỉ là đặt một tour.
              <br />
              <span class="text-slate-400">Đó là kiến tạo khoảnh khắc.</span>
            </h2>
            <p class="mt-5 text-sm leading-relaxed text-slate-400">
              TravelGo tối ưu hóa mọi công đoạn từ gợi ý hành trình theo cá nhân
              hóa, hệ thống đối soát minh bạch đến sự hỗ trợ xuyên suốt từng
              chuyến đi.
            </p>

            <RouterLink
              to="/tours"
              class="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-orange-300 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-orange-400/10 transition hover:bg-orange-400 active:scale-95"
            >
              <span>Khám phá toàn bộ tour</span>
              <span>→</span>
            </RouterLink>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <div
              class="rounded-3xl border border-white/[0.08] bg-[#0d1118] p-7 transition duration-300 hover:border-orange-300/30 hover:bg-[#111720]"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-xl text-orange-300"
              >
                🔍
              </div>
              <h3 class="mt-5 text-base font-bold text-white">
                Tìm kiếm linh hoạt
              </h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">
                Tìm kiếm thông minh theo địa danh, ngân sách, số ngày và lịch
                khởi hành mong muốn.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/[0.08] bg-[#0d1118] p-7 transition duration-300 hover:border-orange-300/30 hover:bg-[#111720]"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-xl text-orange-300"
              >
                🧭
              </div>
              <h3 class="mt-5 text-base font-bold text-white">
                Lịch trình chuẩn xác
              </h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">
                Minh bạch điểm đến, giờ khởi hành, chính sách hoàn hủy và thông
                tin hướng dẫn viên bản địa.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/[0.08] bg-[#0d1118] p-7 transition duration-300 hover:border-orange-300/30 hover:bg-[#111720]"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-xl text-orange-300"
              >
                🎫
              </div>
              <h3 class="mt-5 text-base font-bold text-white">
                Đặt vé & Giữ chỗ tức thì
              </h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">
                Thanh toán an toàn, xác nhận điện tử ngay sau khi đối soát thành
                công qua mã QR thông minh.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/[0.08] bg-[#0d1118] p-7 transition duration-300 hover:border-orange-300/30 hover:bg-[#111720]"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-xl text-orange-300"
              >
                💬
              </div>
              <h3 class="mt-5 text-base font-bold text-white">
                Cộng đồng du lịch
              </h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">
                Đánh giá khách quan, chia sẻ ảnh thực tế và mẹo vi vu từ những
                du khách đi trước.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================
         AI PROMO
    ========================================================== -->
    <section class="relative overflow-hidden py-32">
      <img
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=85"
        alt="Mountain sunset travel"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-[#07090d]/75"></div>
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#07090d] via-[#07090d]/60 to-transparent"
      ></div>

      <div class="relative mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <div
          class="max-w-2xl rounded-3xl border border-orange-300/20 bg-[#0d1118]/85 p-8 shadow-2xl backdrop-blur-2xl sm:p-12"
        >
          <div
            class="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3.5 py-1 text-xs font-semibold text-orange-200"
          >
            ✦ Trợ lý du lịch TravelGo AI
          </div>

          <h2
            class="mt-6 text-3xl font-black leading-tight text-white sm:text-4xl"
          >
            Chưa biết đi đâu?
            <br />
            <span
              class="bg-gradient-to-r from-orange-200 to-amber-400 bg-clip-text text-transparent"
            >
              Hãy để AI lập kế hoạch cho bạn.
            </span>
          </h2>

          <p class="mt-4 text-sm leading-relaxed text-slate-300/80">
            Nhập thời gian rảnh, ngân sách dự kiến và sở thích (biển đảo,
            trekking, ẩm thực hay nghỉ dưỡng). TravelGo AI sẽ gợi ý hành trình
            chi tiết từng ngày chỉ trong vài giây.
          </p>

          <div class="mt-8 flex items-center gap-4">
            <RouterLink
              to="/ai-planner"
              class="inline-flex items-center gap-2 rounded-xl bg-orange-300 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-orange-400/20 transition hover:bg-orange-400 active:scale-95"
            >
              <span>Lập hành trình ngay</span>
              <span>→</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================
         CALL TO ACTION
    ========================================================== -->
    <section class="bg-[#07090d] py-28 border-t border-white/[0.06]">
      <div class="mx-auto max-w-4xl px-6 text-center sm:px-8">
        <p
          class="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300/60"
        >
          Start Your Journey
        </p>

        <h2
          class="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl"
        >
          Chuyến đi tiếp theo đang chờ bạn.
        </h2>

        <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
          Gia nhập cộng đồng du khách TravelGo để nhận ưu đãi tour sớm nhất và
          lên lịch cho kỳ nghỉ của bạn.
        </p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <RouterLink
            v-if="!user"
            to="/register"
            class="rounded-xl bg-orange-300 px-7 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-orange-400/10 transition hover:bg-orange-400 active:scale-95"
          >
            Đăng ký tài khoản
          </RouterLink>

          <RouterLink
            to="/tours"
            class="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
          >
            Xem danh sách tour
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes tour-slide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.animate-\[tour-slide_40s_linear_infinite\] {
  animation: tour-slide 40s linear infinite;
}
</style>
