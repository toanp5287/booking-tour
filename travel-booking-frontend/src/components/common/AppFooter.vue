<script setup>
defineProps({
  transparentBackground: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <footer class="relative overflow-hidden text-white border-t border-white/10">
    <!-- =================================================
         LỚP NỀN (Tách biệt hoàn toàn, không bọc chữ vào đây)
    ================================================== -->
    <!-- Trường hợp 1: Trang thường -> Bật ảnh hoàng hôn mặc định -->
    <div
      v-if="!transparentBackground"
      class="absolute inset-0 pointer-events-none"
    >
      <img
        src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=95"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-black/45"></div>
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#080b12]/55 via-[#0b0b12]/60 to-[#05070c]/95"
      ></div>
      <div
        class="absolute left-1/2 top-20 h-56 w-[650px] -translate-x-1/2 rounded-full bg-orange-400/15 blur-[120px]"
      ></div>
      <div
        class="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-purple-500/10 blur-[120px]"
      ></div>
    </div>

    <!-- Trường hợp 2: Trang có ảnh riêng -> Kính mờ trong suốt -->
    <div
      v-else
      class="absolute inset-0 bg-black/40 backdrop-blur-xl pointer-events-none"
    >
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-[#080b12]/30 to-[#080b12]/70"
      ></div>
    </div>

    <!-- =================================================
         NỘI DUNG CHỮ (Luôn hiển thị với relative z-10)
    ================================================== -->
    <div class="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
      <!-- TOP DECORATION -->
      <div class="mb-12 flex items-center justify-center">
        <div
          class="h-px w-20 bg-gradient-to-r from-transparent to-white/20"
        ></div>
        <div
          class="mx-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg"
        >
          <svg
            class="h-5 w-5 text-white/90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.6"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-5"
            />
          </svg>
        </div>
        <div
          class="h-px w-20 bg-gradient-to-l from-transparent to-white/20"
        ></div>
      </div>

      <!-- FOOTER GRID -->
      <div class="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <!-- BRAND -->
        <div class="lg:col-span-1">
          <RouterLink to="/" class="inline-flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.35)]"
            >
              <svg
                class="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-5"
                />
              </svg>
            </div>

            <div>
              <div class="text-2xl font-bold tracking-tight text-white">
                Travel<span class="text-white/60">Go</span>
              </div>
              <div
                class="mt-1 text-[9px] uppercase tracking-[0.3em] text-white/70 font-medium"
              >
                Travel & Explore
              </div>
            </div>
          </RouterLink>

          <p class="mt-5 max-w-sm text-sm leading-7 text-white/75 font-normal">
            Khám phá những điểm đến tuyệt đẹp, tìm kiếm hành trình phù hợp và
            tạo nên những chuyến đi đáng nhớ cùng TravelGo.
          </p>

          <div
            class="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 backdrop-blur-xl"
          >
            <span
              class="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(253,186,116,0.8)]"
            ></span>
            <span
              class="text-[10px] uppercase tracking-[0.18em] text-white/80 font-medium"
            >
              Your journey starts here
            </span>
          </div>
        </div>

        <!-- KHÁM PHÁ -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider">
            Khám phá
          </h3>
          <div class="mt-5 space-y-4">
            <RouterLink
              to="/tours"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Tất cả tour
            </RouterLink>
            <RouterLink
              to="/destinations"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Điểm đến
            </RouterLink>
            <RouterLink
              to="/ai-planner"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              TravelGo AI
            </RouterLink>
          </div>
        </div>

        <!-- CỘNG ĐỒNG -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider">
            Cộng đồng
          </h3>
          <div class="mt-5 space-y-4">
            <RouterLink
              to="/community"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Bài viết
            </RouterLink>
            <RouterLink
              to="/reviews"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Đánh giá
            </RouterLink>
            <RouterLink
              to="/community"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Chia sẻ chuyến đi
            </RouterLink>
          </div>
        </div>

        <!-- HỖ TRỢ -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider">
            Hỗ trợ
          </h3>
          <div class="mt-5 space-y-4">
            <RouterLink
              to="/about"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Về TravelGo
            </RouterLink>
            <RouterLink
              to="/contact"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Liên hệ
            </RouterLink>
            <RouterLink
              to="/privacy"
              class="group flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <span
                class="h-px w-0 bg-orange-300 transition-all duration-300 group-hover:w-3"
              ></span>
              Chính sách
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- BOTTOM DIVIDER -->
      <div class="relative mt-14">
        <div
          class="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        ></div>
        <div
          class="absolute left-1/2 top-1/2 h-2 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/30 blur-lg"
        ></div>
      </div>

      <!-- COPYRIGHT -->
      <div
        class="mt-7 flex flex-col items-center justify-between gap-4 text-xs sm:flex-row text-white/70"
      >
        <p>© 2026 TravelGo. All rights reserved.</p>
        <div
          class="flex items-center gap-3 uppercase tracking-[0.2em] text-[9px] text-white/70 font-medium"
        >
          <span>Discover</span>
          <span class="h-1 w-1 rounded-full bg-orange-300/90"></span>
          <span>Travel</span>
          <span class="h-1 w-1 rounded-full bg-purple-300/90"></span>
          <span>Experience</span>
        </div>
      </div>
    </div>
  </footer>
</template>
