<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import DestinationInformation from "../../../components/destinations/DestinationInformation.vue";
import DestinationLocation from "../../../components/destinations/DestinationLocation.vue";
import DestinationReviews from "../../../components/destinations/DestinationReviews.vue";
import destinationService from "../../../services/destination.service.js";
import { useRoute, useRouter } from "vue-router";
import tourService from "../../../services/tour.service.js";
const route = useRoute();
const idDestination = route.params.id;
console.log(idDestination);

const { data: dataDestinationDetail } = useQuery({
  queryKey: ["dataDestinationDetail", idDestination],
  queryFn: async () => {
    const res = await destinationService.getOne(idDestination);
    return res.data.data;
  },
  staleTime: 1000 * 5 * 60,
});
</script>

<template>
  <div class="bg-[#070b12] text-white antialiased">
    <section class="relative h-[680px] overflow-hidden">
      <!-- BACKGROUND -->

      <img
        :src="
          dataDestinationDetail?.image
            ? `http://localhost:8080/${dataDestinationDetail.image.replaceAll('\\', '/')}`
            : 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=90'
        "
        :alt="dataDestinationDetail?.name || 'Địa điểm'"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <!-- SUNSET OVERLAY -->

      <div
        class="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-[#070b12]"
      ></div>

      <div
        class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent"
      ></div>

      <!-- SUNSET GLOW -->

      <div
        class="absolute left-[35%] top-[35%] h-72 w-72 rounded-full bg-orange-300/10 blur-[120px]"
      ></div>

      <!-- HERO CONTENT -->

      <div
        class="relative mx-auto flex h-full max-w-7xl items-end px-5 pb-20 sm:px-8 lg:px-10"
      >
        <div class="max-w-3xl">
          <!-- BREADCRUMB -->

          <div class="mb-6 flex items-center gap-2 text-xs text-white/55">
            <a href="index.html" class="hover:text-white"> Trang chủ </a>

            <span>/</span>

            <a href="destinations.html" class="hover:text-white"> Điểm đến </a>

            <span>/</span>

            <span class="text-white/80">{{ dataDestinationDetail.name }}</span>
          </div>

          <!-- BADGE -->

          <div
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-medium backdrop-blur-xl"
          >
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>

            Điểm đến nổi bật
          </div>

          <!-- TITLE -->

          <h1
            class="text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl"
          >
            {{ dataDestinationDetail.name }}
          </h1>

          <div
            class="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70"
          >
            <span class="flex items-center gap-1.5">
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
                  d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"
                />

                <circle cx="12" cy="9" r="2.2" stroke-width="1.7" />
              </svg>

              {{ dataDestinationDetail.address }} thành phố
              {{ dataDestinationDetail.province }}
            </span>

            <span class="h-1 w-1 rounded-full bg-white/40"></span>

            <span>★★★★★</span>

            <span>4.9 · 2.4k đánh giá</span>
          </div>

          <p
            class="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg"
          >
            {{ dataDestinationDetail.description }}
          </p>

          <!-- HERO BUTTON -->

          <div class="mt-8 flex flex-wrap gap-3">
            <a
              href="tours.html"
              class="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Khám phá tour

              <svg
                class="h-4 w-4 transition group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </a>

            <button
              class="rounded-2xl border border-white/20 bg-black/20 px-6 py-3.5 text-sm font-semibold backdrop-blur-xl transition hover:bg-white/10"
            >
              ♡ Lưu điểm đến
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         QUICK INFORMATION
    ====================================================== -->

    <section class="relative z-10 -mt-8 px-5 sm:px-8 lg:px-10">
      <div
        class="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-[#101722]/90 shadow-sunset backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-5"
      >
        <!-- ITEM 1 -->
        <div class="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p class="text-xs uppercase tracking-wider text-white/35">
            Thời điểm đẹp
          </p>

          <p class="mt-2 font-semibold">
            {{ dataDestinationDetail.best_time }}
          </p>
        </div>

        <!-- ITEM 2 -->
        <div class="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p class="text-xs uppercase tracking-wider text-white/35">
            Thời gian lý tưởng
          </p>

          <p class="mt-2 font-semibold whitespace-nowrap">2 — 3 ngày</p>
        </div>

        <!-- ITEM 3 -->
        <div class="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p class="text-xs uppercase tracking-wider text-white/35">
            Các loại hình hoạt động
          </p>

          <p class="mt-2 font-semibold">
            {{ dataDestinationDetail.activity_types }}
          </p>
        </div>

        <!-- ITEM 4 -->
        <div class="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p class="text-xs uppercase tracking-wider text-white/35">Phù hợp</p>

          <p class="mt-2 font-semibold">
            {{ dataDestinationDetail.age_suitable }}
          </p>
        </div>

        <!-- ITEM 5 -->
        <div class="p-6">
          <p class="text-xs uppercase tracking-wider text-white/35">
            Chi phí trung bình
          </p>

          <p class="mt-2 font-semibold whitespace-nowrap">
            {{
              Number(dataDestinationDetail?.average_cost ?? 0).toLocaleString(
                "vi-VN",
              )
            }}
            ₫
          </p>
        </div>
      </div>
    </section>

    <!-- =====================================================
         ABOUT DESTINATION
    ====================================================== -->
    <DestinationInformation />
    <!-- =====================================================
         POPULAR TOURS
    ====================================================== -->

    <section class="border-y border-white/10 bg-[#0b1018]">
      <div class="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <div
          class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.25em] text-white/35"
            >
              Bạn có thể quan tâm
            </p>

            <h2 class="mt-3 text-3xl font-bold tracking-tight">
              Tour liên quan {{ dataDestinationDetail.province }}
            </h2>

            <p class="mt-3 text-sm text-white/40">
              {{ dataDestinationDetail.category.description }}
            </p>
          </div>

          <a
            href="tours.html"
            class="text-sm font-semibold text-white/60 transition hover:text-white"
          >
            Xem tất cả tour →
          </a>
        </div>

        <!-- TOUR GRID -->

        <div class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <!-- TOUR 1 -->

          <article
            v-if="dataDestinationDetail.tours"
            v-for="value in dataDestinationDetail.tours"
            :key="value.id"
            class="group overflow-hidden rounded-3xl border border-white/10 bg-[#111823] transition hover:-translate-y-1 hover:border-white/20"
          >
            <div class="relative h-56 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=85"
                alt="Tour Hạ Long"
                class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />

              <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
              ></div>

              <span
                class="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium backdrop-blur-xl"
              >
                Bán chạy
              </span>
            </div>

            <div class="p-5">
              <div class="flex items-center justify-between">
                <span class="text-xs text-white/40"
                  >{{ value.duration_days }} ngày
                  {{ value.duration_nights }} đêm
                </span>

                <span class="text-xs"> ★ 4.9 </span>
              </div>

              <h3 class="mt-3 font-semibold">{{ value.name }}</h3>

              <p class="mt-2 text-sm text-white/40">
                {{ value.description }}
              </p>

              <div
                class="mt-5 flex items-end justify-between border-t border-white/10 pt-4"
              >
                <div>
                  <p class="text-xs text-white/30">Từ</p>

                  <p class="mt-1 text-lg font-bold">{{ value.price }}</p>
                </div>

                <RouterLink
                  :to="`/tours/${value.id}`"
                  class="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold transition hover:bg-white hover:text-slate-900"
                >
                  Xem tour
                </RouterLink>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- =====================================================
         SUGGESTED ITINERARY
    ====================================================== -->

    <section class="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
      <div class="max-w-2xl">
        <p
          class="text-xs font-semibold uppercase tracking-[0.25em] text-white/35"
        >
          Gợi ý hành trình
        </p>

        <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          3 ngày khám phá Hạ Long
        </h2>

        <p class="mt-4 text-sm leading-7 text-white/40">
          Một lịch trình mẫu để bạn có thể bắt đầu chuyến đi mà không cần mất
          thời gian lên kế hoạch.
        </p>
      </div>

      <div class="mt-12 grid gap-4 lg:grid-cols-3">
        <!-- DAY 1 -->

        <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-900"
            >
              01
            </span>

            <div>
              <p class="text-sm font-semibold">Ngày đầu tiên</p>

              <p class="text-xs text-white/35">Khám phá vịnh</p>
            </div>
          </div>

          <div class="mt-6 space-y-5">
            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 08:00 </span>

              <p class="text-sm text-white/60">Di chuyển đến cảng</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 10:00 </span>

              <p class="text-sm text-white/60">Check-in du thuyền</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 15:00 </span>

              <p class="text-sm text-white/60">Chèo kayak</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 17:30 </span>

              <p class="text-sm text-white/60">Ngắm hoàng hôn</p>
            </div>
          </div>
        </div>

        <!-- DAY 2 -->

        <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold"
            >
              02
            </span>

            <div>
              <p class="text-sm font-semibold">Ngày thứ hai</p>

              <p class="text-xs text-white/35">Thiên nhiên & trải nghiệm</p>
            </div>
          </div>

          <div class="mt-6 space-y-5">
            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 06:30 </span>

              <p class="text-sm text-white/60">Bình minh trên vịnh</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 09:00 </span>

              <p class="text-sm text-white/60">Tham quan hang động</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 14:00 </span>

              <p class="text-sm text-white/60">Tắm biển</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 19:00 </span>

              <p class="text-sm text-white/60">Ăn tối & nghỉ dưỡng</p>
            </div>
          </div>
        </div>

        <!-- DAY 3 -->

        <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold"
            >
              03
            </span>

            <div>
              <p class="text-sm font-semibold">Ngày cuối</p>

              <p class="text-xs text-white/35">Thư giãn & trở về</p>
            </div>
          </div>

          <div class="mt-6 space-y-5">
            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 06:30 </span>

              <p class="text-sm text-white/60">Yoga & bình minh</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 09:00 </span>

              <p class="text-sm text-white/60">Ăn sáng</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 10:30 </span>

              <p class="text-sm text-white/60">Check-out</p>
            </div>

            <div class="flex gap-4">
              <span class="text-xs text-white/30"> 12:00 </span>

              <p class="text-sm text-white/60">Trở về thành phố</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         AI PLANNER
    ====================================================== -->

    <section class="px-5 sm:px-8 lg:px-10">
      <div
        class="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#171d29] via-[#111823] to-[#0d121a] p-8 sm:p-12"
      >
        <!-- SUNSET GLOW -->

        <div
          class="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-orange-300/10 blur-[100px]"
        ></div>

        <div
          class="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber-200/5 blur-[100px]"
        ></div>

        <div class="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60"
            >
              ✦ TravelGo AI
            </div>

            <h2
              class="mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Không biết nên đi đâu?
              <span class="text-white/40">
                Hãy để AI lên lịch trình cho bạn.
              </span>
            </h2>

            <p class="mt-4 max-w-xl text-sm leading-7 text-white/45">
              Chọn thời gian, ngân sách và sở thích. TravelGo AI sẽ đề xuất các
              địa điểm, hoạt động, thời gian tham quan và lịch trình phù hợp.
            </p>
          </div>

          <a
            href="ai-planner.html"
            class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Tạo lịch trình

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
                d="M5 12h14M13 6l6 6-6 6"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- =====================================================
         REVIEWS
    ====================================================== -->

    <DestinationReviews />

    <!-- =====================================================
         MAP
    ====================================================== -->
    <DestinationLocation
      :latitude="dataDestinationDetail.latitude"
      :longitude="dataDestinationDetail.longitude"
      :name="dataDestinationDetail.name"
    />
    <!-- =====================================================
         CTA
    ====================================================== -->

    <section class="relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=2200&q=90"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover"
      />

      <div class="absolute inset-0 bg-black/60"></div>

      <div
        class="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/60"
      ></div>

      <div class="relative mx-auto max-w-5xl px-5 py-28 text-center sm:px-8">
        <p
          class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50"
        >
          Your next adventure
        </p>

        <h2
          class="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"
        >
          Hoàng hôn đang chờ bạn khám phá.
        </h2>

        <p class="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55">
          Bắt đầu lên kế hoạch cho chuyến đi Hạ Long của bạn ngay hôm nay.
        </p>

        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="tours.html"
            class="rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Khám phá tour
          </a>

          <a
            href="ai-planner.html"
            class="rounded-2xl border border-white/20 bg-black/20 px-7 py-3.5 text-sm font-semibold backdrop-blur-xl transition hover:bg-white/10"
          >
            Lên lịch trình với AI
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
