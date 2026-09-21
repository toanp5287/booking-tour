<script setup>
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";

import { getCurrentUser } from "../../../stores/auth";

const {
  data: userData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["profile"],
  queryFn: getCurrentUser,
});

// =========================
// USER DATA
// =========================

const userName = computed(() => {
  return userData.value?.full_name || "Người dùng";
});

const userEmail = computed(() => {
  return userData.value?.email || "";
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase();
});

const userAddress = computed(() => {
  return userData.value?.address || "Chưa cập nhật địa chỉ";
});

const userRole = computed(() => {
  return userData.value?.role_name || "CUSTOMER";
});

const joinYear = computed(() => {
  if (!userData.value?.created_at) {
    return "2024";
  }

  return new Date(userData.value.created_at).getFullYear();
});
</script>

<template>
  <!-- =====================================================
       LOADING
  ====================================================== -->
  <div
    v-if="isLoading"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b12]"
  >
    <div class="flex flex-col items-center">
      <!-- Spinner -->
      <div class="relative h-20 w-20">
        <div
          class="absolute inset-0 rounded-full border-4 border-white/10"
        ></div>

        <div
          class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-400 border-r-orange-300"
        ></div>

        <div
          class="absolute inset-3 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-xl"
        >
          <span class="text-lg">✈️</span>
        </div>
      </div>

      <p class="mt-5 text-sm font-semibold text-white">
        Đang tải trang cá nhân...
      </p>

      <p class="mt-1 text-xs text-white/50">
        TravelGo đang chuẩn bị hành trình của bạn
      </p>

      <!-- Loading dots -->
      <div class="mt-4 flex gap-1.5">
        <span
          class="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400"
        ></span>
        <span
          class="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:150ms]"
        ></span>
        <span
          class="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:300ms]"
        ></span>
      </div>
    </div>
  </div>

  <!-- =====================================================
       ERROR
  ====================================================== -->
  <div
    v-else-if="isError || !userData"
    class="flex min-h-screen items-center justify-center bg-[#070b12] px-5 text-white pt-20"
  >
    <div
      class="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur-2xl"
    >
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/10 text-2xl"
      >
        ⚠️
      </div>

      <h2 class="mt-5 text-xl font-bold">Không thể tải trang cá nhân</h2>

      <p class="mt-2 text-sm leading-6 text-white/60">
        Vui lòng đăng nhập lại hoặc thử tải lại trang.
      </p>

      <RouterLink
        to="/login"
        class="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
      >
        Đăng nhập
      </RouterLink>
    </div>
  </div>

  <!-- =====================================================
       PROFILE
  ====================================================== -->
  <div v-else class="relative min-h-screen pt-6 text-white">
    <!-- BACKGROUND -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Travel sunset"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div class="absolute inset-0 bg-black/40"></div>

      <div
        class="absolute inset-0 bg-gradient-to-b from-[#070b12]/30 via-[#070b12]/60 to-[#070b12]/85"
      ></div>

      <div
        class="absolute left-1/2 top-0 h-[500px] w-[750px] -translate-x-1/2 rounded-full bg-orange-400/15 blur-[140px]"
      ></div>
    </div>

    <!-- MAIN -->
    <main class="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <!-- =====================================================
           PROFILE COVER
      ====================================================== -->
      <section
        class="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.08] shadow-2xl backdrop-blur-2xl"
      >
        <!-- COVER -->
        <div class="relative h-[260px] sm:h-[320px]">
          <img
            src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2000&q=90"
            alt="Travel cover"
            class="h-full w-full object-cover"
          />

          <div class="absolute inset-0 bg-black/35"></div>

          <div
            class="absolute inset-0 bg-gradient-to-t from-[#070b12] via-black/15 to-transparent"
          ></div>

          <!-- COVER LABEL -->
          <div
            class="absolute right-5 top-5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur-xl"
          >
            Traveller since {{ joinYear }}
          </div>
        </div>

        <!-- PROFILE INFO -->
        <div class="relative px-5 pb-6 sm:px-8">
          <div
            class="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between"
          >
            <!-- AVATAR -->
            <div class="flex items-end gap-4">
              <div
                class="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[#070b12] bg-gradient-to-br from-orange-300 to-orange-600 text-3xl font-bold text-slate-950 shadow-2xl sm:h-36 sm:w-36"
              >
                {{ userInitial }}

                <div
                  class="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#070b12] bg-emerald-400 text-xs font-bold text-slate-950 shadow"
                >
                  ✓
                </div>
              </div>

              <div class="pb-2">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-2xl font-bold text-white sm:text-3xl">
                    {{ userName }}
                  </h1>

                  <span
                    class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300"
                  >
                    ✓ Đã xác thực
                  </span>
                </div>

                <p class="mt-1 text-sm font-medium text-white/70">
                  {{ userEmail }} · {{ userRole }}
                </p>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100 cursor-pointer"
              >
                Chỉnh sửa trang cá nhân
              </button>

              <RouterLink
                to="/changePassword"
                class="flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-white transition hover:bg-white/20"
              >
                Đổi mật khẩu
              </RouterLink>
            </div>
          </div>

          <!-- BIO -->
          <div class="mt-5 max-w-2xl">
            <p class="text-sm leading-7 text-white/80">
              Yêu những chuyến đi chậm, những cung đường đẹp và những buổi chiều
              đầy nắng. Luôn tìm kiếm những điểm đến mới để khám phá và chia sẻ
              cùng cộng đồng TravelGo. 🌅
            </p>

            <div
              class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/70"
            >
              <span> 📍 {{ userAddress }} </span>

              <span> ✈️ 18 chuyến đi </span>

              <span> 📅 Tham gia {{ joinYear }} </span>
            </div>
          </div>

          <!-- STATS -->
          <div
            class="mt-7 grid max-w-2xl grid-cols-4 border-t border-white/15 pt-5"
          >
            <div>
              <p class="text-xl font-bold text-white">24</p>
              <p class="mt-1 text-[11px] font-medium text-white/70">Bài viết</p>
            </div>

            <div>
              <p class="text-xl font-bold text-white">18</p>
              <p class="mt-1 text-[11px] font-medium text-white/70">
                Chuyến đi
              </p>
            </div>

            <div>
              <p class="text-xl font-bold text-white">186</p>
              <p class="mt-1 text-[11px] font-medium text-white/70">
                Đang theo dõi
              </p>
            </div>

            <div>
              <p class="text-xl font-bold text-white">342</p>
              <p class="mt-1 text-[11px] font-medium text-white/70">
                Người theo dõi
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =====================================================
           PROFILE NAVIGATION
      ====================================================== -->
      <nav
        class="mt-5 overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl"
      >
        <div class="flex min-w-max">
          <a
            href="#posts"
            class="border-b-2 border-white px-6 py-4 text-sm font-bold text-white"
          >
            Bài viết
          </a>

          <RouterLink
            to="/myBooking"
            class="border-b-2 border-transparent px-6 py-4 text-sm font-medium text-white/70 transition hover:text-white"
          >
            Chuyến đi
          </RouterLink>

          <a
            href="#photos"
            class="border-b-2 border-transparent px-6 py-4 text-sm font-medium text-white/70 transition hover:text-white"
          >
            Ảnh
          </a>

          <RouterLink
            to="/myFavorites"
            class="border-b-2 border-transparent px-6 py-4 text-sm font-medium text-white/70 transition hover:text-white"
          >
            Tour đã thích
          </RouterLink>
        </div>
      </nav>

      <!-- =====================================================
           CONTENT
      ====================================================== -->
      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- =====================================================
             LEFT
        ====================================================== -->
        <section class="space-y-6">
          <!-- POSTS -->
          <div id="posts" class="space-y-6">
            <!-- POST 1 -->
            <article
              class="overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-2xl"
            >
              <div class="flex items-center justify-between p-5">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 font-bold text-slate-950"
                  >
                    {{ userInitial }}
                  </div>

                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white">
                        {{ userName }}
                      </h3>

                      <span class="text-xs font-bold text-sky-400"> ✓ </span>
                    </div>

                    <p class="mt-0.5 text-xs text-white/60">
                      2 ngày trước · Hạ Long
                    </p>
                  </div>
                </div>

                <RouterLink
                  to="/myReviews"
                  class="text-sm text-white/60 transition hover:text-white"
                >
                  Chi tiết
                </RouterLink>
              </div>

              <div class="px-5 pb-4">
                <h2 class="text-lg font-bold text-white">
                  Một buổi chiều rất đẹp ở Hạ Long 🌅
                </h2>

                <p class="mt-3 text-sm leading-7 text-white/80">
                  Có những khoảnh khắc khiến mình muốn dừng lại lâu hơn một
                  chút. Hạ Long lúc chiều tà thực sự rất khác, yên bình và cực
                  kỳ đáng nhớ.
                </p>

                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="text-xs font-semibold text-orange-300">
                    #HaLong
                  </span>

                  <span class="text-xs text-white/70"> #TravelGo </span>

                  <span class="text-xs text-white/70"> #VietnamTravel </span>
                </div>
              </div>

              <RouterLink to="/tours" class="block overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=90"
                  alt="Hạ Long"
                  class="h-[420px] w-full object-cover transition duration-500 hover:scale-[1.01]"
                />
              </RouterLink>

              <div class="border-t border-white/10 px-5 py-4">
                <div class="flex items-center gap-5">
                  <button
                    class="text-sm text-white/70 transition hover:text-rose-400"
                  >
                    ♡ 246
                  </button>

                  <button
                    class="text-sm text-white/70 transition hover:text-white"
                  >
                    ○ 38
                  </button>

                  <button
                    class="text-sm text-white/70 transition hover:text-white"
                  >
                    ↗ Chia sẻ
                  </button>

                  <button
                    class="ml-auto text-sm text-white/60 hover:text-white"
                  >
                    🔖
                  </button>
                </div>
              </div>
            </article>

            <!-- POST 2 -->
            <article
              class="rounded-[28px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-2xl"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-blue-600 font-bold text-slate-950"
                >
                  {{ userInitial }}
                </div>

                <div>
                  <h3 class="text-sm font-bold text-white">
                    {{ userName }}
                  </h3>

                  <p class="mt-0.5 text-xs text-white/60">
                    1 tuần trước · Đà Nẵng
                  </p>
                </div>
              </div>

              <p class="mt-4 text-sm leading-7 text-white/80">
                Nếu có ai đang chuẩn bị đi Đà Nẵng thì nhất định nên dành một
                buổi chiều để ngắm hoàng hôn bên biển. Một trong những trải
                nghiệm mình thích nhất.
              </p>

              <div
                class="mt-4 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=90"
                  alt="Da Nang"
                  class="h-64 w-full object-cover"
                />

                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=90"
                  alt="Travel"
                  class="h-64 w-full object-cover"
                />
              </div>

              <div class="mt-4 flex items-center gap-5">
                <button class="text-sm text-white/70 hover:text-rose-400">
                  ♡ 128
                </button>

                <button class="text-sm text-white/70 hover:text-white">
                  ○ 16
                </button>

                <button class="text-sm text-white/70 hover:text-white">
                  ↗ Chia sẻ
                </button>
              </div>
            </article>
          </div>

          <!-- =====================================================
               TRIPS
          ====================================================== -->
          <section id="trips">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                >
                  Travel history
                </p>

                <h2 class="mt-1 text-xl font-bold text-white">
                  Chuyến đi đã hoàn thành
                </h2>
              </div>

              <RouterLink
                to="/myBooking"
                class="text-xs font-semibold text-white/70 hover:text-white"
              >
                Xem tất cả →
              </RouterLink>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- TRIP 1 -->
              <div
                class="group overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.07] backdrop-blur-xl"
              >
                <div class="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=90"
                    alt="Hạ Long"
                    class="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div
                    class="absolute left-3 top-3 rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-xl"
                  >
                    Hoàn thành
                  </div>
                </div>

                <div class="p-4">
                  <p class="text-xs text-white/60">12 - 14 / 07 / 2026</p>

                  <h3 class="mt-1.5 font-bold text-white">Hạ Long 3N2Đ</h3>

                  <p class="mt-1 text-xs text-white/70">
                    Tour trải nghiệm Vịnh Hạ Long
                  </p>
                </div>
              </div>

              <!-- TRIP 2 -->
              <div
                class="group overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.07] backdrop-blur-xl"
              >
                <div class="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=90"
                    alt="Đà Nẵng"
                    class="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div
                    class="absolute left-3 top-3 rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-xl"
                  >
                    Hoàn thành
                  </div>
                </div>

                <div class="p-4">
                  <p class="text-xs text-white/60">05 - 08 / 06 / 2026</p>

                  <h3 class="mt-1.5 font-bold text-white">Đà Nẵng 4N3Đ</h3>

                  <p class="mt-1 text-xs text-white/70">
                    Biển · Ẩm thực · Khám phá
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- =====================================================
               REVIEWS
          ====================================================== -->
          <section id="reviews">
            <div class="mb-4">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
              >
                Travel reviews
              </p>

              <h2 class="mt-1 text-xl font-bold text-white">
                Đánh giá của tôi
              </h2>
            </div>

            <div
              class="rounded-[26px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-white">Hạ Long 3N2Đ</h3>

                    <span
                      class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300"
                    >
                      Đã xác thực
                    </span>
                  </div>

                  <p class="mt-1 text-xs text-white/60">
                    Đã trải nghiệm · 14 / 07 / 2026
                  </p>
                </div>

                <div class="text-right">
                  <div class="text-sm tracking-widest text-amber-300">
                    ★★★★★
                  </div>

                  <p class="mt-0.5 text-xs font-bold text-white">4.9 / 5</p>
                </div>
              </div>

              <p class="mt-4 text-sm leading-7 text-white/80">
                Lịch trình khá hợp lý, hướng dẫn viên nhiệt tình. Đặc biệt rất
                thích trải nghiệm ngắm hoàng hôn trên Vịnh. Chắc chắn sẽ quay
                lại.
              </p>
            </div>
          </section>

          <!-- =====================================================
               PHOTOS
          ====================================================== -->
          <section id="photos">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                >
                  Memories
                </p>

                <h2 class="mt-1 text-xl font-bold text-white">Ảnh chuyến đi</h2>
              </div>

              <span class="text-xs font-semibold text-white/70"> 42 ảnh </span>
            </div>

            <div class="grid grid-cols-3 gap-2 overflow-hidden rounded-[24px]">
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=700&q=90"
                class="h-40 w-full object-cover transition hover:brightness-75 sm:h-52"
                alt="Travel photo"
              />

              <img
                src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=700&q=90"
                class="h-40 w-full object-cover transition hover:brightness-75 sm:h-52"
                alt="Travel photo"
              />

              <img
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=90"
                class="h-40 w-full object-cover transition hover:brightness-75 sm:h-52"
                alt="Travel photo"
              />

              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=90"
                class="h-40 w-full object-cover transition hover:brightness-75 sm:h-52"
                alt="Travel photo"
              />

              <img
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=90"
                class="h-40 w-full object-cover transition hover:brightness-75 sm:h-52"
                alt="Travel photo"
              />

              <div class="relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=90"
                  class="h-40 w-full object-cover brightness-50 sm:h-52"
                  alt="Travel photo"
                />

                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-lg font-bold text-white"> +37 </span>
                </div>
              </div>
            </div>
          </section>

          <!-- =====================================================
               SAVED
          ====================================================== -->
          <section id="saved">
            <div
              class="rounded-[26px] border border-white/15 bg-white/[0.06] p-6 text-center"
            >
              <div
                class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl"
              >
                🔖
              </div>

              <h3 class="mt-4 font-bold text-white">Bộ sưu tập đã lưu</h3>

              <p class="mx-auto mt-2 max-w-md text-xs leading-6 text-white/70">
                Lưu những bài viết, tour và điểm đến yêu thích để quay lại xem
                khi cần.
              </p>

              <RouterLink
                to="/myFavorites"
                class="mt-4 inline-block rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Xem nội dung đã lưu
              </RouterLink>
            </div>
          </section>
        </section>

        <!-- =====================================================
             SIDEBAR
        ====================================================== -->
        <aside class="space-y-5">
          <!-- TRAVEL LEVEL -->
          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70"
                >
                  Travel level
                </p>

                <h3 class="mt-1 font-bold text-white">Explorer</h3>
              </div>

              <div
                class="flex h-11 w-11 items-center justify-center rounded-full bg-orange-400/20 text-xl shadow"
              >
                🧭
              </div>
            </div>

            <div class="mt-5">
              <div class="flex justify-between text-xs font-semibold">
                <span class="text-orange-200"> 1,280 XP </span>

                <span class="text-white/60"> 2,000 XP </span>
              </div>

              <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  class="h-full w-[64%] rounded-full bg-gradient-to-r from-orange-300 to-orange-600"
                ></div>
              </div>

              <p class="mt-2 text-[10px] text-white/70">
                Còn 720 XP để lên cấp Adventurer
              </p>
            </div>
          </div>

          <!-- BADGES -->
          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">Huy hiệu</h3>

              <span class="text-xs font-semibold text-white/70">
                6 huy hiệu
              </span>
            </div>

            <div class="mt-5 grid grid-cols-3 gap-3">
              <div
                class="flex aspect-square flex-col items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-400/10"
              >
                <span class="text-2xl">🌅</span>
                <span class="mt-2 text-[9px] font-semibold text-white/80">
                  Sunset
                </span>
              </div>

              <div
                class="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10"
              >
                <span class="text-2xl">✈️</span>
                <span class="mt-2 text-[9px] font-semibold text-white/80">
                  Traveller
                </span>
              </div>

              <div
                class="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10"
              >
                <span class="text-2xl">📸</span>
                <span class="mt-2 text-[9px] font-semibold text-white/80">
                  Photographer
                </span>
              </div>

              <div
                class="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10"
              >
                <span class="text-2xl">⭐</span>
                <span class="mt-2 text-[9px] font-semibold text-white/80">
                  Reviewer
                </span>
              </div>

              <div
                class="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10"
              >
                <span class="text-2xl">🗺️</span>
                <span class="mt-2 text-[9px] font-semibold text-white/80">
                  Explorer
                </span>
              </div>

              <div
                class="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10"
              >
                <span class="text-2xl">🏆</span>
                <span class="mt-2 text-[9px] font-semibold text-white/80">
                  Top Member
                </span>
              </div>
            </div>
          </div>

          <!-- FOLLOWING -->
          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">Đang theo dõi</h3>

              <span class="text-xs font-semibold text-white/70"> 186 </span>
            </div>

            <div class="mt-5 flex -space-x-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#11151d] bg-gradient-to-br from-orange-300 to-orange-600 text-xs font-bold text-slate-950"
              >
                M
              </div>

              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#11151d] bg-gradient-to-br from-blue-300 to-blue-600 text-xs font-bold text-slate-950"
              >
                K
              </div>

              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#11151d] bg-gradient-to-br from-purple-300 to-purple-600 text-xs font-bold text-slate-950"
              >
                T
              </div>

              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#11151d] bg-white/10 text-xs font-bold text-white"
              >
                +183
              </div>
            </div>
          </div>

          <!-- QUICK ACTION -->
          <div
            class="rounded-[24px] border border-orange-300/20 bg-gradient-to-br from-orange-400/15 via-white/[0.06] to-transparent p-5 backdrop-blur-2xl"
          >
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300"
            >
              TravelGo
            </p>

            <h3 class="mt-3 text-lg font-bold text-white">
              Tiếp tục hành trình
            </h3>

            <p class="mt-2 text-xs leading-6 text-white/75">
              Khám phá tour mới, xây dựng lịch trình bằng AI hoặc chia sẻ chuyến
              đi tiếp theo của bạn.
            </p>

            <div class="mt-5 space-y-2">
              <RouterLink
                to="/tours"
                class="block rounded-xl bg-white py-2.5 text-center text-xs font-bold text-slate-900 shadow transition hover:bg-slate-100"
              >
                Khám phá tour
              </RouterLink>

              <RouterLink
                to="/ai-planner"
                class="block rounded-xl border border-white/20 bg-white/10 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Lên lịch trình với AI
              </RouterLink>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
