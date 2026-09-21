<script setup lang="ts">
import Articles from "../../../components/community/Articles.vue";
import { computed, ref } from "vue";
import communityService from "../../../services/community.service.js";
import { useQuery } from "@tanstack/vue-query";

const showAll = ref(false);

const { data: communityData } = useQuery({
  queryKey: ["communityData"],
  queryFn: async () => {
    const res = await communityService.getAll();

    return res.data.data || [];
  },
});
const search = ref("");

const communiti = computed(() => {
  const keyWord = search.value.trim().toLowerCase();

  // Không nhập gì -> lấy tất cả
  if (!keyWord) {
    return communityData.value;
  }

  return communityData.value.filter((item) => {
    const nameTour = item.tour_attachment?.tour_name?.toLowerCase() || "";

    const hashtags = item.hashtags || [];

    const matchTour = nameTour.includes(keyWord);

    const matchHashtag = hashtags.some((hashtag) =>
      hashtag.toLowerCase().includes(keyWord),
    );

    return matchTour || matchHashtag;
  });
});
</script>

<template>
  <!-- 1. Bỏ hoàn toàn class bg-[#070b12] -->
  <div class="relative min-h-screen text-white">
    <!-- 2. Đổi -z-30 thành z-0 pointer-events-none, dùng ảnh cục bộ /hero-bg.jpg -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Travel sunset"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <!-- Dark overlay cân bằng -->
      <div class="absolute inset-0 bg-black/40"></div>

      <!-- Gradient nhẹ dịu chuyển màu đáy -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#070b12]/30 via-[#070b12]/60 to-[#070b12]/85"
      ></div>

      <!-- Sunset glow -->
      <div
        class="absolute left-1/2 top-0 h-[520px] w-[850px] -translate-x-1/2 rounded-full bg-orange-400/15 blur-[150px]"
      ></div>
    </div>

    <!-- 3. Có relative z-10 để toàn bộ nội dung nổi lên trên ảnh nền -->
    <main class="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <!-- =====================================================
            HERO
      ====================================================== -->

      <section
        class="relative mb-8 overflow-hidden rounded-[30px] border border-white/15 shadow-2xl"
      >
        <!-- Hero image -->

        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=90"
          alt="Travel community"
          class="absolute inset-0 h-full w-full object-cover"
        />

        <!-- Overlay -->

        <div class="absolute inset-0 bg-black/55"></div>

        <div
          class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20"
        ></div>

        <!-- Hero content -->

        <div class="relative max-w-2xl px-7 py-14 sm:px-10 sm:py-16">
          <div
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-xl"
          >
            <span
              class="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.8)]"
            ></span>

            TravelGo Community
          </div>

          <h1
            class="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
          >
            Những hành trình
            <span class="text-white/60"> được kể lại. </span>
          </h1>

          <p class="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            Chia sẻ những khoảnh khắc đáng nhớ, đánh giá chuyến đi, tìm cảm hứng
            và kết nối với những người cùng đam mê khám phá.
          </p>

          <div class="mt-7 flex flex-wrap gap-3">
            <RouterLink
              to="createPost"
              class="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Chia sẻ hành trình
            </RouterLink>

            <a
              href="reviews.html"
              class="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              Xem đánh giá
            </a>
          </div>
        </div>
      </section>

      <!-- =====================================================
            COMMUNITY STATS
      ====================================================== -->

      <section class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          class="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl"
        >
          <p class="text-xs text-white/70 font-medium">Thành viên</p>

          <p class="mt-2 text-2xl font-bold text-white">24.8K</p>

          <p class="mt-1 text-xs text-emerald-400 font-medium">
            +12% tháng này
          </p>
        </div>

        <div
          class="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl"
        >
          <p class="text-xs text-white/70 font-medium">Bài viết</p>

          <p class="mt-2 text-2xl font-bold text-white">
            {{ communiti?.length ?? 0 }}
          </p>

          <p class="mt-1 text-xs text-white/70">Cộng đồng chia sẻ</p>
        </div>

        <div
          class="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl"
        >
          <p class="text-xs text-white/70 font-medium">Đánh giá</p>

          <p class="mt-2 text-2xl font-bold text-white">12.4K</p>

          <p class="mt-1 text-xs text-emerald-300 font-medium">Đã xác thực</p>
        </div>

        <div
          class="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl"
        >
          <p class="text-xs text-white/70 font-medium">Điểm đến</p>

          <p class="mt-2 text-2xl font-bold text-white">126</p>

          <p class="mt-1 text-xs text-white/70">Đang được khám phá</p>
        </div>
      </section>

      <!-- =====================================================
            FILTER + SEARCH
      ====================================================== -->

      <section
        class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <!-- Search -->
        <div class="relative w-full md:w-96">
          <svg
            class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-width="1.7"
              d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>

          <input
            v-model="search"
            type="text"
            placeholder="Tìm bài viết, điểm đến..."
            class="w-full rounded-xl border border-white/15 bg-white/[0.08] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/50 outline-none backdrop-blur-xl transition focus:border-white/40 focus:bg-white/[0.12]"
          />
        </div>

        <!-- Đăng bài -->
        <RouterLink
          to="createPost"
          class="shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-center text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          Đăng bài viết mới
        </RouterLink>
      </section>

      <!-- =====================================================
            CONTENT GRID
      ====================================================== -->

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <!-- FEED -->

        <Articles :community="communiti" />

        <!-- SIDEBAR -->

        <aside class="space-y-5">
          <!-- USER PROFILE -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-lg font-bold text-slate-950 shadow-lg"
              >
                V
              </div>

              <div>
                <h3 class="font-bold text-white">Phạm Quang Vinh</h3>

                <p class="mt-0.5 text-xs text-white/70 font-medium">
                  Traveller · Vietnam
                </p>
              </div>
            </div>

            <div
              class="mt-5 grid grid-cols-3 border-t border-white/15 pt-5 text-center"
            >
              <div>
                <p class="font-bold text-white">24</p>
                <p class="mt-1 text-[10px] text-white/60 font-medium">
                  Bài viết
                </p>
              </div>

              <div class="border-x border-white/15">
                <p class="font-bold text-white">186</p>
                <p class="mt-1 text-[10px] text-white/60 font-medium">
                  Theo dõi
                </p>
              </div>

              <div>
                <p class="font-bold text-white">342</p>
                <p class="mt-1 text-[10px] text-white/60 font-medium">
                  Người theo dõi
                </p>
              </div>
            </div>

            <RouterLink
              to="/profile"
              class="mt-5 block rounded-xl border border-white/15 bg-white/10 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Xem trang cá nhân
            </RouterLink>
          </div>

          <!-- TRENDING -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">🔥 Chủ đề nổi bật</h3>

              <span
                class="text-[10px] font-semibold text-orange-300 uppercase tracking-wider"
              >
                TRENDING
              </span>
            </div>

            <div class="mt-5 space-y-4">
              <a
                href="#"
                class="block rounded-xl p-2 -mx-2 transition hover:bg-white/10"
              >
                <p class="text-sm font-semibold text-white">#VietnamTravel</p>
                <p class="mt-0.5 text-xs text-white/60">4.8K bài viết</p>
              </a>

              <a
                href="#"
                class="block rounded-xl p-2 -mx-2 transition hover:bg-white/10"
              >
                <p class="text-sm font-semibold text-white">#DaNang</p>
                <p class="mt-0.5 text-xs text-white/60">1.2K bài viết</p>
              </a>

              <a
                href="#"
                class="block rounded-xl p-2 -mx-2 transition hover:bg-white/10"
              >
                <p class="text-sm font-semibold text-white">#HaGiang</p>
                <p class="mt-0.5 text-xs text-white/60">956 bài viết</p>
              </a>

              <a
                href="#"
                class="block rounded-xl p-2 -mx-2 transition hover:bg-white/10"
              >
                <p class="text-sm font-semibold text-white">#Sapa</p>
                <p class="mt-0.5 text-xs text-white/60">734 bài viết</p>
              </a>
            </div>
          </div>

          <!-- TOP MEMBERS -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">Thành viên nổi bật</h3>

              <a
                href="#"
                class="text-xs font-semibold text-white/70 transition hover:text-white"
              >
                Xem tất cả
              </a>
            </div>

            <div class="mt-5 space-y-4">
              <!-- Member 1 -->
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-sm font-bold text-slate-950"
                >
                  M
                </div>

                <div class="flex-1">
                  <p class="text-sm font-semibold text-white">Minh Anh</p>
                  <p class="text-xs text-white/60">2.4K followers</p>
                </div>

                <button
                  type="button"
                  class="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/15 cursor-pointer"
                >
                  Theo dõi
                </button>
              </div>

              <!-- Member 2 -->
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-blue-600 text-sm font-bold text-slate-950"
                >
                  K
                </div>

                <div class="flex-1">
                  <p class="text-sm font-semibold text-white">Khánh Linh</p>
                  <p class="text-xs text-white/60">1.8K followers</p>
                </div>

                <button
                  type="button"
                  class="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/15 cursor-pointer"
                >
                  Theo dõi
                </button>
              </div>

              <!-- Member 3 -->
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-300 to-purple-600 text-sm font-bold text-slate-950"
                >
                  T
                </div>

                <div class="flex-1">
                  <p class="text-sm font-semibold text-white">Tuấn Trần</p>
                  <p class="text-xs text-white/60">1.5K followers</p>
                </div>

                <button
                  type="button"
                  class="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/15 cursor-pointer"
                >
                  Theo dõi
                </button>
              </div>
            </div>
          </div>

          <!-- HOT DESTINATIONS -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">Điểm đến đang hot</h3>

              <a
                href="destinations.html"
                class="text-xs font-semibold text-white/70 transition hover:text-white"
              >
                Tất cả
              </a>
            </div>

            <div class="mt-5 space-y-3">
              <a
                href="destination-detail.html"
                class="group relative block overflow-hidden rounded-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=85"
                  alt="Hạ Long"
                  class="h-28 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                ></div>

                <div class="absolute bottom-3 left-3">
                  <p class="text-sm font-bold text-white">Hạ Long</p>
                  <p class="text-[10px] font-medium text-white/70">
                    4.9 ★ · 320 đánh giá
                  </p>
                </div>
              </a>

              <a
                href="destination-detail.html"
                class="group relative block overflow-hidden rounded-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=85"
                  alt="Đà Nẵng"
                  class="h-28 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                ></div>

                <div class="absolute bottom-3 left-3">
                  <p class="text-sm font-bold text-white">Đà Nẵng</p>
                  <p class="text-[10px] font-medium text-white/70">
                    4.8 ★ · 286 đánh giá
                  </p>
                </div>
              </a>
            </div>
          </div>

          <!-- COMMUNITY RULE -->

          <div
            class="rounded-[24px] border border-orange-300/20 bg-gradient-to-br from-orange-400/15 via-white/[0.06] to-transparent p-5 backdrop-blur-2xl"
          >
            <div class="text-2xl">🌅</div>

            <h3 class="mt-4 font-bold text-white">TravelGo Community</h3>

            <p class="mt-2 text-xs leading-6 text-white/75">
              Chia sẻ trải nghiệm thật, tôn trọng cộng đồng và truyền cảm hứng
              cho những hành trình tiếp theo.
            </p>

            <a
              href="#"
              class="mt-4 inline-block text-xs font-semibold text-orange-200 transition hover:text-white"
            >
              Quy tắc cộng đồng →
            </a>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
