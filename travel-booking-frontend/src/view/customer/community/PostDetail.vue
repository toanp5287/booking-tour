<script setup lang="ts">
import CommentItem from "../../../components/community/CommentItem.vue";
</script>

<template>
  <!-- 1. Bỏ bg-[#070b12] để không bị đè mất nền ảnh -->
  <div class="relative min-h-screen text-white">
    <!-- 2. Khung nền chuẩn: z-0, pointer-events-none, dùng ảnh nội bộ /hero-bg.jpg -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Travel sunset"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <!-- Dark cinematic layer -->
      <div class="absolute inset-0 bg-black/40"></div>

      <!-- Gradient chuyển màu đáy -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#070b12]/30 via-[#070b12]/65 to-[#070b12]/85"
      ></div>

      <!-- Sunset glow -->
      <div
        class="absolute left-1/2 top-0 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-orange-400/15 blur-[150px]"
      ></div>
    </div>

    <!-- 3. Nội dung chính: relative z-10 để nổi bật lên trên nền -->
    <main class="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <!-- BACK -->
      <div class="mb-6">
        <RouterLink
          to="/community"
          class="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"
        >
          ← Quay lại cộng đồng
        </RouterLink>
      </div>

      <!-- =====================================================
            CONTENT GRID
      ====================================================== -->

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <!-- ===================================================
              LEFT CONTENT
        ==================================================== -->

        <section class="space-y-6">
          <!-- POST -->
          <article
            class="overflow-hidden rounded-[30px] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-2xl"
          >
            <!-- AUTHOR -->
            <div class="flex items-center justify-between p-6">
              <div class="flex items-center gap-3">
                <RouterLink
                  to="/profile"
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 font-bold text-slate-950 shadow-lg"
                >
                  A
                </RouterLink>

                <div>
                  <div class="flex items-center gap-2">
                    <RouterLink
                      to="/profile"
                      class="text-sm font-bold text-white hover:text-orange-200 transition"
                    >
                      Anh Minh
                    </RouterLink>

                    <span
                      class="rounded-full border border-sky-400/30 bg-sky-400/15 px-2 py-0.5 text-[9px] font-bold text-sky-300"
                    >
                      ✓ Đã xác minh
                    </span>
                  </div>

                  <p class="mt-0.5 text-xs text-white/60">
                    25 tháng 8, 2026 · 18:42 · Hà Giang
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-white/60 transition hover:bg-white/10 hover:text-white cursor-pointer"
              >
                ···
              </button>
            </div>

            <!-- TITLE -->
            <div class="px-6 pb-5">
              <h1
                class="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl"
              >
                Hoàng hôn trên đèo Mã Pí Lèng 🌄
              </h1>

              <div class="mt-4 flex flex-wrap gap-2">
                <RouterLink
                  to="/destinations"
                  class="rounded-full border border-orange-300/30 bg-orange-400/15 px-3 py-1.5 text-xs font-semibold text-orange-200 transition hover:bg-orange-400/25"
                >
                  #HaGiang
                </RouterLink>

                <RouterLink
                  to="/destinations"
                  class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  #MaPiLeng
                </RouterLink>

                <RouterLink
                  to="/destinations"
                  class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  #VietnamTravel
                </RouterLink>
              </div>
            </div>

            <!-- HERO IMAGE -->
            <div class="relative">
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1800&q=95"
                alt="Hà Giang"
                class="max-h-[650px] w-full object-cover"
              />

              <div
                class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent"
              ></div>

              <div
                class="absolute bottom-5 left-5 rounded-xl border border-white/20 bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl"
              >
                📍 Đèo Mã Pí Lèng · Hà Giang
              </div>
            </div>

            <!-- STORY -->
            <div class="p-6">
              <div class="space-y-5 text-[15px] leading-8 text-white/80">
                <p>
                  Có những nơi chỉ cần đứng yên vài phút cũng đủ khiến mình quên
                  mất thời gian.
                </p>

                <p>
                  Mã Pí Lèng đối với mình chính là một nơi như vậy. Đường lên
                  đèo không quá dễ, nhưng khi đứng trên cao nhìn xuống dòng sông
                  Nho Quế và những dãy núi nối tiếp nhau, mọi mệt mỏi gần như
                  biến mất.
                </p>

                <p>
                  Mình đến đây vào khoảng 17h30. Đây có lẽ là khoảng thời gian
                  đẹp nhất trong ngày. Ánh nắng cuối ngày phủ lên những ngọn núi
                  một màu vàng cam rất nhẹ.
                </p>
              </div>

              <!-- LOCATION CARD -->
              <RouterLink
                to="/destinations"
                class="mt-7 block overflow-hidden rounded-2xl border border-white/15 bg-black/30 transition hover:border-white/30 hover:bg-black/40"
              >
                <div class="flex items-center gap-4 p-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-400/20 text-xl"
                  >
                    📍
                  </div>

                  <div class="flex-1">
                    <p class="text-xs font-semibold text-white/60">Điểm đến</p>
                    <h3 class="mt-0.5 font-bold text-white">Đèo Mã Pí Lèng</h3>
                    <p class="mt-0.5 text-xs text-white/70">
                      Mèo Vạc · Hà Giang · Việt Nam
                    </p>
                  </div>

                  <span class="text-white/60 text-lg font-bold"> → </span>
                </div>
              </RouterLink>

              <!-- PHOTO GRID -->
              <div
                class="mt-7 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=90"
                  alt="Travel"
                  class="h-64 w-full object-cover transition duration-500 hover:scale-[1.02]"
                />

                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=90"
                  alt="Mountain"
                  class="h-64 w-full object-cover transition duration-500 hover:scale-[1.02]"
                />
              </div>

              <!-- TOUR LINK -->
              <div class="mt-7">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-white/60"
                >
                  Hành trình liên quan
                </p>

                <RouterLink
                  to="/tours"
                  class="mt-3 flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.05] p-4 transition hover:border-white/25 hover:bg-white/[0.08] sm:flex-row"
                >
                  <img
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=500&q=85"
                    alt="Tour Hà Giang"
                    class="h-32 w-full rounded-xl object-cover sm:w-44"
                  />

                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-xs font-bold text-orange-300">
                          TravelGo Tour
                        </p>
                        <h3 class="mt-1 font-bold text-white">
                          Hà Giang 3N2Đ · Khám phá cực Bắc
                        </h3>
                      </div>

                      <span class="text-sm font-bold text-amber-300">
                        ★ 4.9
                      </span>
                    </div>

                    <p class="mt-2.5 text-xs leading-5 text-white/70">
                      Khám phá Mã Pí Lèng, sông Nho Quế và những cung đường đẹp
                      nhất Hà Giang.
                    </p>

                    <div class="mt-4 flex items-center justify-between">
                      <span class="text-sm font-bold text-white">
                        2.890.000đ
                      </span>
                      <span class="text-xs font-semibold text-orange-200">
                        Xem tour →
                      </span>
                    </div>
                  </div>
                </RouterLink>
              </div>
            </div>

            <!-- ACTION BAR -->
            <div class="border-t border-white/10 px-6 py-4">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-6">
                  <button
                    type="button"
                    class="flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-rose-400 cursor-pointer"
                  >
                    <span class="text-xl">♡</span>
                    <span>246 lượt thích</span>
                  </button>

                  <button
                    type="button"
                    class="flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white cursor-pointer"
                  >
                    <span class="text-xl">○</span>
                    <span>38 bình luận</span>
                  </button>
                </div>

                <button
                  type="button"
                  class="flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white cursor-pointer"
                >
                  ↗ Chia sẻ
                </button>
              </div>
            </div>
          </article>

          <!-- COMMENT BOX -->
          <section
            class="rounded-[28px] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl"
          >
            <div class="flex gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 font-bold text-slate-950"
              >
                V
              </div>

              <div class="flex-1">
                <textarea
                  rows="3"
                  placeholder="Viết bình luận về hành trình này..."
                  class="w-full resize-none rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder-white/40 transition focus:border-white/35 focus:bg-black/35"
                ></textarea>
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <button
                type="button"
                class="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
              >
                📷 Thêm ảnh
              </button>

              <button
                type="button"
                class="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-slate-100 cursor-pointer shadow"
              >
                Bình luận
              </button>
            </div>
          </section>

          <!-- COMMENTS LIST -->
          <CommentItem />
        </section>

        <!-- ===================================================
              SIDEBAR
        ==================================================== -->

        <aside class="space-y-5">
          <!-- AUTHOR CARD -->
          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-lg font-bold text-slate-950"
              >
                A
              </div>

              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-white">Anh Minh</h3>
                  <span class="text-xs font-bold text-sky-400">✓</span>
                </div>

                <p class="mt-0.5 text-xs text-white/60">Traveller · Hà Nội</p>
              </div>
            </div>

            <div
              class="mt-5 grid grid-cols-3 border-t border-white/15 pt-5 text-center"
            >
              <div>
                <p class="font-bold text-white">48</p>
                <p class="mt-1 text-[10px] font-medium text-white/60">
                  Bài viết
                </p>
              </div>

              <div class="border-x border-white/15">
                <p class="font-bold text-white">1.8K</p>
                <p class="mt-1 text-[10px] font-medium text-white/60">
                  Theo dõi
                </p>
              </div>

              <div>
                <p class="font-bold text-white">2.4K</p>
                <p class="mt-1 text-[10px] font-medium text-white/60">
                  Followers
                </p>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-xl bg-white py-2.5 text-xs font-bold text-slate-900 transition hover:bg-slate-100 cursor-pointer"
              >
                Theo dõi
              </button>

              <RouterLink
                to="/profile"
                class="rounded-xl border border-white/15 bg-white/10 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Trang cá nhân
              </RouterLink>
            </div>
          </div>

          <!-- LOCATION -->
          <div
            class="overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.07] backdrop-blur-2xl"
          >
            <div class="relative h-40">
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=700&q=85"
                alt="Hà Giang"
                class="h-full w-full object-cover"
              />

              <div
                class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"
              ></div>

              <div class="absolute bottom-4 left-4">
                <p class="text-xs font-medium text-white/70">Điểm đến</p>
                <h3 class="mt-0.5 text-lg font-bold text-white">Hà Giang</h3>
              </div>
            </div>

            <div class="p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-white/60">
                    Đánh giá cộng đồng
                  </p>
                  <p class="mt-0.5 font-bold text-white">★ 4.9</p>
                </div>

                <RouterLink
                  to="/destinations"
                  class="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Khám phá
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- RELATED POSTS -->
          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">Bài viết liên quan</h3>

              <RouterLink
                to="/community"
                class="text-xs font-semibold text-white/70 hover:text-white"
              >
                Xem tất cả
              </RouterLink>
            </div>

            <div class="mt-5 space-y-4">
              <RouterLink to="/community" class="group flex gap-3">
                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80"
                  alt="Mountain"
                  class="h-16 w-16 rounded-xl object-cover"
                />

                <div class="flex-1">
                  <p
                    class="line-clamp-2 text-sm font-semibold leading-5 text-white group-hover:text-orange-200 transition"
                  >
                    Những cung đường đẹp nhất Hà Giang
                  </p>

                  <p class="mt-1.5 text-[10px] text-white/60 font-medium">
                    ♡ 128 · ○ 21
                  </p>
                </div>
              </RouterLink>

              <RouterLink to="/community" class="group flex gap-3">
                <img
                  src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80"
                  alt="Travel"
                  class="h-16 w-16 rounded-xl object-cover"
                />

                <div class="flex-1">
                  <p
                    class="line-clamp-2 text-sm font-semibold leading-5 text-white group-hover:text-orange-200 transition"
                  >
                    5 địa điểm nhất định phải ghé ở miền Bắc
                  </p>

                  <p class="mt-1.5 text-[10px] text-white/60 font-medium">
                    ♡ 94 · ○ 16
                  </p>
                </div>
              </RouterLink>

              <RouterLink to="/community" class="group flex gap-3">
                <img
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=300&q=80"
                  alt="Travel"
                  class="h-16 w-16 rounded-xl object-cover"
                />

                <div class="flex-1">
                  <p
                    class="line-clamp-2 text-sm font-semibold leading-5 text-white group-hover:text-orange-200 transition"
                  >
                    Kinh nghiệm đi Sapa tự túc
                  </p>

                  <p class="mt-1.5 text-[10px] text-white/60 font-medium">
                    ♡ 76 · ○ 12
                  </p>
                </div>
              </RouterLink>
            </div>
          </div>

          <!-- COMMUNITY -->
          <div
            class="rounded-[24px] border border-orange-300/20 bg-gradient-to-br from-orange-400/15 via-white/[0.06] to-transparent p-5 backdrop-blur-2xl"
          >
            <div class="text-2xl">🌅</div>

            <h3 class="mt-4 font-bold text-white">Cùng chia sẻ hành trình</h3>

            <p class="mt-2 text-xs leading-6 text-white/75">
              Chia sẻ trải nghiệm thật, hình ảnh và những địa điểm bạn đã khám
              phá cùng cộng đồng TravelGo.
            </p>

            <RouterLink
              to="/createPost"
              class="mt-4 block rounded-xl bg-white py-2.5 text-center text-xs font-bold text-slate-900 transition hover:bg-slate-100 shadow"
            >
              + Tạo bài viết
            </RouterLink>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
