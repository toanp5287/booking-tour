<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import FeaturedDestinations from "../../../components/destinations/FeaturedDestinations.vue";
import destinationService from "../../../services/destination.service.js";

const {
  data: destinationData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["destinations"],
  queryFn: async () => {
    const res = await destinationService.getAll();
    return res.data.destination;
  },
  staleTime: 1000 * 60 * 5,
});
</script>

<template>
  <div class="fixed inset-0 -z-10 overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=95"
      alt="Sunset travel"
      class="h-full w-full object-cover object-center"
    />

    <div class="absolute inset-0 bg-[#05070b]/70"></div>

    <div
      class="absolute inset-0 bg-gradient-to-b from-black/35 via-[#080b10]/70 to-[#080b10]"
    ></div>

    <!-- Sunset glow -->
    <div
      class="absolute left-1/2 top-[12%] h-[400px] w-[650px] -translate-x-1/2 rounded-full bg-orange-300/10 blur-[130px]"
    ></div>
  </div>
  <section class="relative">
    <div
      class="mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 lg:px-10 lg:pb-20 lg:pt-24"
    >
      <div class="max-w-3xl">
        <!-- Badge -->

        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65 backdrop-blur-xl"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-white"></span>

          Explore the world
        </div>

        <!-- Heading -->

        <h1
          class="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-7xl"
        >
          Những nơi đáng để
          <span class="text-white/45">bạn lên đường.</span>
        </h1>

        <p class="mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
          Khám phá những điểm đến tuyệt đẹp, tìm cảm hứng cho chuyến đi tiếp
          theo và lựa chọn hành trình phù hợp với bạn.
        </p>
      </div>

      <!-- SEARCH BOX -->

      <div
        class="mt-10 rounded-[24px] border border-white/20 bg-white/[0.10] p-3 shadow-sunset backdrop-blur-2xl lg:mt-14"
      >
        <div class="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_auto]">
          <!-- Search -->

          <div
            class="flex items-center gap-3 rounded-[17px] border border-white/10 bg-black/20 px-4 py-3"
          >
            <svg
              class="h-5 w-5 shrink-0 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
              />
            </svg>

            <input
              type="text"
              placeholder="Bạn muốn đi đâu?"
              class="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>

          <!-- Region -->

          <div
            class="flex items-center gap-3 rounded-[17px] border border-white/10 bg-black/20 px-4 py-3"
          >
            <svg
              class="h-5 w-5 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z"
              />

              <circle cx="12" cy="10" r="2.3" stroke-width="1.7" />
            </svg>

            <select
              class="w-full bg-transparent text-sm text-white outline-none"
            >
              <option class="bg-[#10151d]">Tất cả khu vực</option>
              <option class="bg-[#10151d]">Miền Bắc</option>
              <option class="bg-[#10151d]">Miền Trung</option>
              <option class="bg-[#10151d]">Miền Nam</option>
            </select>
          </div>

          <!-- Type -->

          <div
            class="flex items-center gap-3 rounded-[17px] border border-white/10 bg-black/20 px-4 py-3"
          >
            <svg
              class="h-5 w-5 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M4 19l5-7 4 4 3-5 4 8H4z"
              />
            </svg>

            <select
              class="w-full bg-transparent text-sm text-white outline-none"
            >
              <option class="bg-[#10151d]">Loại điểm đến</option>
              <option class="bg-[#10151d]">Biển</option>
              <option class="bg-[#10151d]">Núi</option>
              <option class="bg-[#10151d]">Thành phố</option>
              <option class="bg-[#10151d]">Thiên nhiên</option>
            </select>
          </div>

          <!-- Button -->

          <button
            class="rounded-[17px] bg-white px-7 py-3 text-sm font-bold text-[#090c12] transition hover:-translate-y-0.5 hover:bg-white/90"
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- =========================================================
         MAIN CONTENT
    ========================================================== -->

  <main class="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
    <!-- =====================================================
           FEATURED DESTINATIONS
      ====================================================== -->

    <FeaturedDestinations :destinationData="destinationData" />
    <!-- =====================================================
           CATEGORIES
      ====================================================== -->

    <section class="mt-24">
      <div class="mb-8">
        <p
          class="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35"
        >
          Find your style
        </p>

        <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
          Bạn muốn trải nghiệm điều gì?
        </h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- BEACH -->

        <a
          href="tours.html"
          class="group rounded-[22px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div
            class="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
          >
            <svg
              class="h-5 w-5 text-white/75"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M3 20h18M5 20c1-4 3.3-6 7-6s6 2 7 6M12 14V4m0 0l-3 3m3-3l3 3"
              />
            </svg>
          </div>

          <h3 class="font-semibold">Biển & đảo</h3>

          <p class="mt-2 text-xs leading-5 text-white/40">
            Những bãi biển và hòn đảo tuyệt đẹp.
          </p>

          <div
            class="mt-5 text-xs text-white/35 transition group-hover:text-white"
          >
            Khám phá →
          </div>
        </a>

        <!-- MOUNTAIN -->

        <a
          href="tours.html"
          class="group rounded-[22px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div
            class="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
          >
            <svg
              class="h-5 w-5 text-white/75"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M3 19l7-10 4 5 2-3 5 8H3z"
              />
            </svg>
          </div>

          <h3 class="font-semibold">Núi & trekking</h3>

          <p class="mt-2 text-xs leading-5 text-white/40">
            Chinh phục núi rừng và những cung đường mới.
          </p>

          <div
            class="mt-5 text-xs text-white/35 transition group-hover:text-white"
          >
            Khám phá →
          </div>
        </a>

        <!-- CULTURE -->

        <a
          href="tours.html"
          class="group rounded-[22px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div
            class="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
          >
            <svg
              class="h-5 w-5 text-white/75"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M4 20h16M6 17V9m4 8V9m4 8V9m4 8V9M4 9l8-5 8 5"
              />
            </svg>
          </div>

          <h3 class="font-semibold">Văn hóa</h3>

          <p class="mt-2 text-xs leading-5 text-white/40">
            Khám phá lịch sử, văn hóa và con người.
          </p>

          <div
            class="mt-5 text-xs text-white/35 transition group-hover:text-white"
          >
            Khám phá →
          </div>
        </a>

        <!-- NATURE -->

        <a
          href="tours.html"
          class="group rounded-[22px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div
            class="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
          >
            <svg
              class="h-5 w-5 text-white/75"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
                d="M12 21c4.5-3 7-6.2 7-10a7 7 0 10-14 0c0 3.8 2.5 7 7 10z"
              />

              <path
                stroke-linecap="round"
                stroke-width="1.7"
                d="M12 11v6m0-3l3-2"
              />
            </svg>
          </div>

          <h3 class="font-semibold">Thiên nhiên</h3>

          <p class="mt-2 text-xs leading-5 text-white/40">
            Tìm về những không gian xanh và bình yên.
          </p>

          <div
            class="mt-5 text-xs text-white/35 transition group-hover:text-white"
          >
            Khám phá →
          </div>
        </a>
      </div>
    </section>

    <!-- =====================================================
           AI PLANNER
      ====================================================== -->

    <section class="mt-24">
      <div
        class="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/[0.07] p-7 backdrop-blur-2xl sm:p-10 lg:p-12"
      >
        <!-- Decorative image -->

        <img
          src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=90"
          alt="Travel landscape"
          class="absolute inset-0 h-full w-full object-cover opacity-20"
        />

        <div
          class="absolute inset-0 bg-gradient-to-r from-[#080b10]/95 via-[#080b10]/80 to-[#080b10]/30"
        ></div>

        <div class="relative max-w-2xl">
          <div
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60"
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
                stroke-width="1.7"
                d="M12 3v4m0 10v4M4.2 4.2l2.8 2.8m10 10l2.8 2.8M3 12h4m10 0h4M4.2 19.8L7 17m10-10l2.8-2.8"
              />
            </svg>

            TravelGo AI
          </div>

          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
            Không biết nên đi đâu?
          </h2>

          <p class="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
            Hãy để TravelGo AI đề xuất điểm đến và xây dựng hành trình phù hợp
            với thời gian, ngân sách và sở thích của bạn.
          </p>

          <a
            href="ai-planner.html"
            class="mt-7 inline-flex items-center gap-2 rounded-[15px] bg-white px-5 py-3 text-sm font-bold text-[#090c12] transition hover:-translate-y-0.5 hover:bg-white/90"
          >
            Khám phá với AI

            <span>→</span>
          </a>
        </div>
      </div>
    </section>

    <!-- =====================================================
           POPULAR DESTINATIONS
      ====================================================== -->

    <section class="mt-24">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <p
            class="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35"
          >
            More to explore
          </p>

          <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
            Địa điểm được yêu thích
          </h2>
        </div>

        <a
          href="tours.html"
          class="hidden text-sm text-white/45 transition hover:text-white sm:block"
        >
          Xem tất cả →
        </a>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- ITEM -->

        <a
          href="destination-detail.html"
          class="group overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]"
        >
          <div class="relative h-52 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=85"
              alt="Sapa"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            ></div>
          </div>

          <div class="p-5">
            <div class="text-xs text-white/35">Lào Cai</div>

            <h3 class="mt-1 font-semibold">Sa Pa</h3>

            <p class="mt-2 text-xs text-white/40">Núi · Văn hóa · Trekking</p>
          </div>
        </a>

        <!-- ITEM -->

        <a
          href="destination-detail.html"
          class="group overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]"
        >
          <div class="relative h-52 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=85"
              alt="Ninh Bình"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            ></div>
          </div>

          <div class="p-5">
            <div class="text-xs text-white/35">Ninh Bình</div>

            <h3 class="mt-1 font-semibold">Tràng An</h3>

            <p class="mt-2 text-xs text-white/40">Thiên nhiên · Văn hóa</p>
          </div>
        </a>

        <!-- ITEM -->

        <a
          href="destination-detail.html"
          class="group overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]"
        >
          <div class="relative h-52 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=900&q=85"
              alt="Hội An"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            ></div>
          </div>

          <div class="p-5">
            <div class="text-xs text-white/35">Quảng Nam</div>

            <h3 class="mt-1 font-semibold">Hội An</h3>

            <p class="mt-2 text-xs text-white/40">Phố cổ · Văn hóa · Ẩm thực</p>
          </div>
        </a>

        <!-- ITEM -->

        <a
          href="destination-detail.html"
          class="group overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]"
        >
          <div class="relative h-52 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1609140842261-7f6e6f1d9b0e?auto=format&fit=crop&w=900&q=85"
              alt="Đà Lạt"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            ></div>
          </div>

          <div class="p-5">
            <div class="text-xs text-white/35">Lâm Đồng</div>

            <h3 class="mt-1 font-semibold">Đà Lạt</h3>

            <p class="mt-2 text-xs text-white/40">Nghỉ dưỡng · Thiên nhiên</p>
          </div>
        </a>
      </div>
    </section>

    <!-- =====================================================
           CTA
      ====================================================== -->

    <section class="mt-24">
      <div
        class="rounded-[26px] border border-white/10 bg-white/[0.04] px-6 py-12 text-center backdrop-blur-xl sm:px-10"
      >
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30"
        >
          Your next journey
        </p>

        <h2
          class="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Một chuyến đi tuyệt vời bắt đầu từ một điểm đến.
        </h2>

        <p class="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/40">
          Chọn nơi bạn muốn đến và bắt đầu xây dựng hành trình của riêng mình.
        </p>

        <div class="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="tours.html"
            class="rounded-[15px] bg-white px-6 py-3 text-sm font-bold text-[#090c12] transition hover:-translate-y-0.5"
          >
            Khám phá tour
          </a>

          <a
            href="ai-planner.html"
            class="rounded-[15px] border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Lên lịch trình với AI
          </a>
        </div>
      </div>
    </section>
  </main>
</template>
