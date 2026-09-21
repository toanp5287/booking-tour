<template>
  <!-- 1. Bọc relative, bỏ toàn bộ màu nền đè để lộ ảnh -->
  <div class="relative min-h-screen text-white pt-20 pb-16">
    <!-- 2. Khung nền chuẩn z-0 pointer-events-none, dùng ảnh cục bộ /hero-bg.jpg -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Travel sunset"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div class="absolute inset-0 bg-black/40"></div>

      <div
        class="absolute inset-0 bg-gradient-to-b from-[#070b12]/30 via-[#070b12]/65 to-[#070b12]/85"
      ></div>

      <div
        class="absolute left-1/2 top-0 h-[600px] w-[850px] -translate-x-1/2 rounded-full bg-orange-400/15 blur-[160px]"
      ></div>
    </div>

    <!-- 3. Nội dung chính: relative z-10 nổi bật trên nền ảnh -->
    <main class="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <!-- ===================================================
            PAGE HEADER
      ==================================================== -->

      <section class="mb-10">
        <div
          class="flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <div
              class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200 backdrop-blur-xl"
            >
              <span
                class="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.8)]"
              ></span>

              Saved journeys
            </div>

            <h1
              class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            >
              Những điều bạn
              <span class="text-white/60"> muốn khám phá. </span>
            </h1>

            <p
              class="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base"
            >
              Lưu lại những tour, điểm đến, bài viết và lịch trình bạn yêu thích
              để dễ dàng quay lại khi chuẩn bị cho chuyến đi.
            </p>
          </div>

          <!-- TOTAL -->

          <div
            class="flex w-fit items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-4 backdrop-blur-xl shadow-card"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/20 text-xl text-rose-300"
            >
              ♥
            </div>

            <div>
              <p class="text-2xl font-bold text-white">18</p>

              <p class="text-xs font-medium text-white/70">mục đã lưu</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================================================
            CATEGORY TABS
      ==================================================== -->

      <div class="mb-8 flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          class="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg cursor-pointer"
        >
          Tất cả
        </button>

        <button
          type="button"
          class="shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          ✈️ Tours
        </button>

        <button
          type="button"
          class="shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          📍 Điểm đến
        </button>

        <button
          type="button"
          class="shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          📝 Bài viết
        </button>

        <button
          type="button"
          class="shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          ✨ Lịch trình AI
        </button>
      </div>

      <!-- ===================================================
            SEARCH + SORT
      ==================================================== -->

      <div
        class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="relative">
          <svg
            class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>

          <input
            type="text"
            placeholder="Tìm trong mục yêu thích..."
            class="w-full rounded-xl border border-white/15 bg-white/[0.08] py-3 pl-10 pr-4 text-sm text-white placeholder-white/50 outline-none backdrop-blur-xl transition focus:border-white/40 focus:bg-white/[0.12] sm:w-72"
          />
        </div>

        <button
          type="button"
          class="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          Mới lưu gần đây ▾
        </button>
      </div>

      <!-- ===================================================
            CONTENT
      ==================================================== -->

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <!-- SAVED CONTENT -->

        <section>
          <div class="grid gap-5 md:grid-cols-2">
            <!-- TOUR CARD 1 -->

            <article
              class="group overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-2xl transition hover:border-white/25"
            >
              <div class="relative">
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=90"
                  alt="Hạ Long"
                  class="h-60 w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
                ></div>

                <div
                  class="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-xl"
                >
                  TOUR
                </div>

                <button
                  type="button"
                  class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-rose-400 backdrop-blur-xl transition hover:scale-110 cursor-pointer"
                >
                  ♥
                </button>

                <div class="absolute bottom-4 left-4 right-4">
                  <div class="flex items-end justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold text-white/70">
                        Hạ Long · Quảng Ninh
                      </p>

                      <h2 class="mt-1 text-lg font-bold text-white">
                        Hạ Long 3N2Đ
                      </h2>
                    </div>

                    <div class="text-right">
                      <p class="text-[10px] text-white/60 uppercase">từ</p>

                      <p class="font-extrabold text-white text-base">
                        3.490.000₫
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="p-5">
                <div class="flex items-center justify-between">
                  <div class="flex gap-1 text-sm text-amber-300">★★★★★</div>

                  <span class="text-xs text-white/70 font-medium">
                    4.9 · 320 đánh giá
                  </span>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <span
                    class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/80"
                  >
                    3 ngày 2 đêm
                  </span>

                  <span
                    class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/80"
                  >
                    Xe du lịch
                  </span>

                  <span
                    class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/80"
                  >
                    Khách sạn
                  </span>
                </div>

                <RouterLink
                  to="/tours"
                  class="mt-5 block rounded-xl bg-white py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Xem tour
                </RouterLink>
              </div>
            </article>

            <!-- TOUR CARD 2 -->

            <article
              class="group overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-2xl transition hover:border-white/25"
            >
              <div class="relative">
                <img
                  src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=90"
                  alt="Đà Nẵng"
                  class="h-60 w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
                ></div>

                <div
                  class="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-xl"
                >
                  TOUR
                </div>

                <button
                  type="button"
                  class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-rose-400 backdrop-blur-xl transition hover:scale-110 cursor-pointer"
                >
                  ♥
                </button>

                <div class="absolute bottom-4 left-4">
                  <p class="text-xs font-semibold text-white/70">
                    Đà Nẵng · Hội An
                  </p>

                  <h2 class="mt-1 text-lg font-bold text-white">
                    Đà Nẵng - Hội An 4N3Đ
                  </h2>
                </div>
              </div>

              <div class="p-5">
                <div class="flex items-center justify-between">
                  <div class="text-sm tracking-widest text-amber-300">
                    ★★★★★
                  </div>

                  <span class="text-xs text-white/70 font-medium">
                    4.8 · 286 đánh giá
                  </span>
                </div>

                <div class="mt-4 flex items-center justify-between">
                  <div>
                    <p class="text-[10px] text-white/60 uppercase">Giá từ</p>

                    <p class="mt-0.5 text-lg font-extrabold text-white">
                      4.290.000₫
                    </p>
                  </div>

                  <span
                    class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1.5 text-[10px] font-bold text-emerald-300"
                  >
                    Còn chỗ
                  </span>
                </div>

                <RouterLink
                  to="/tours"
                  class="mt-5 block rounded-xl bg-white py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Xem tour
                </RouterLink>
              </div>
            </article>

            <!-- DESTINATION CARD -->

            <article
              class="group overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-2xl transition hover:border-white/25"
            >
              <div class="relative">
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=90"
                  alt="Hạ Long"
                  class="h-60 w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                ></div>

                <button
                  type="button"
                  class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-rose-400 backdrop-blur-xl transition hover:scale-110 cursor-pointer"
                >
                  ♥
                </button>

                <div class="absolute bottom-5 left-5">
                  <p class="text-xs font-semibold text-white/70">Điểm đến</p>

                  <h2 class="mt-1 text-2xl font-bold text-white">Hạ Long</h2>

                  <p class="mt-0.5 text-xs text-white/70">
                    Quảng Ninh · Việt Nam
                  </p>
                </div>
              </div>

              <div class="p-5">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-amber-300"> ★ 4.9 </span>

                  <span class="text-xs text-white/70 font-medium">
                    320 đánh giá
                  </span>
                </div>

                <p class="mt-4 text-sm leading-6 text-white/80">
                  Vịnh biển nổi tiếng với những đảo đá vôi, cảnh hoàng hôn tuyệt
                  đẹp và nhiều hoạt động khám phá.
                </p>

                <RouterLink
                  to="/destinations"
                  class="mt-5 block rounded-xl border border-white/20 bg-white/10 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Khám phá điểm đến
                </RouterLink>
              </div>
            </article>

            <!-- COMMUNITY POST -->

            <article
              class="rounded-[26px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-2xl transition hover:border-white/25"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 font-bold text-slate-950"
                  >
                    A
                  </div>

                  <div>
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-bold text-white">Anh Minh</p>

                      <span class="text-xs font-bold text-sky-400"> ✓ </span>
                    </div>

                    <p class="mt-0.5 text-xs text-white/60">
                      2 ngày trước · Hà Giang
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="text-rose-400 text-lg hover:scale-110 transition cursor-pointer"
                >
                  ♥
                </button>
              </div>

              <div class="mt-5">
                <span
                  class="rounded-full border border-orange-300/30 bg-orange-400/15 px-3 py-1.5 text-[10px] font-bold text-orange-200"
                >
                  Bài viết
                </span>

                <h2 class="mt-4 text-lg font-bold text-white">
                  Hoàng hôn trên đèo Mã Pí Lèng 🌄
                </h2>

                <p class="mt-3 line-clamp-4 text-sm leading-7 text-white/75">
                  Có những nơi chỉ cần đứng yên vài phút cũng đủ khiến mình quên
                  mất thời gian. Hà Giang chắc chắn là một trong những nơi như
                  vậy...
                </p>

                <div class="mt-4 flex flex-wrap gap-2">
                  <span class="text-xs font-semibold text-orange-300">
                    #HaGiang
                  </span>

                  <span class="text-xs text-white/70"> #MaPiLeng </span>

                  <span class="text-xs text-white/70"> #TravelVietnam </span>
                </div>
              </div>

              <div
                class="mt-5 flex items-center justify-between border-t border-white/10 pt-4"
              >
                <div class="flex gap-5 text-xs text-white/60 font-medium">
                  <span> ♡ 246 </span>

                  <span> ○ 38 </span>
                </div>

                <RouterLink
                  to="/community"
                  class="text-xs font-semibold text-orange-200 transition hover:text-white"
                >
                  Xem bài viết →
                </RouterLink>
              </div>
            </article>

            <!-- AI ITINERARY -->

            <article
              class="relative overflow-hidden rounded-[26px] border border-orange-300/20 bg-gradient-to-br from-orange-400/15 via-white/[0.06] to-transparent p-6 shadow-2xl md:col-span-2"
            >
              <div
                class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-300/15 blur-3xl"
              ></div>

              <div class="relative">
                <div class="flex items-start justify-between">
                  <div>
                    <span
                      class="rounded-full border border-orange-300/30 bg-orange-300/15 px-3 py-1.5 text-[10px] font-bold text-orange-200 uppercase tracking-wider"
                    >
                      ✨ AI ITINERARY
                    </span>

                    <h2 class="mt-4 text-xl font-bold text-white">
                      Đà Nẵng 4 ngày 3 đêm
                    </h2>

                    <p class="mt-1.5 text-xs text-white/75">
                      Lịch trình được tạo bởi TravelGo AI
                    </p>
                  </div>

                  <button
                    type="button"
                    class="text-rose-400 text-lg hover:scale-110 transition cursor-pointer"
                  >
                    ♥
                  </button>
                </div>

                <div class="mt-6 grid gap-3 sm:grid-cols-2">
                  <div
                    class="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/25 p-3.5"
                  >
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white"
                    >
                      01
                    </span>

                    <div>
                      <p class="text-sm font-bold text-white">
                        Bán đảo Sơn Trà
                      </p>

                      <p class="text-xs text-white/60">08:00 · 11:30</p>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/25 p-3.5"
                  >
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white"
                    >
                      02
                    </span>

                    <div>
                      <p class="text-sm font-bold text-white">Phố cổ Hội An</p>

                      <p class="text-xs text-white/60">16:00 · 21:00</p>
                    </div>
                  </div>
                </div>

                <RouterLink
                  to="/ai-planner"
                  class="mt-5 inline-block rounded-xl bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-100 shadow"
                >
                  Mở lịch trình
                </RouterLink>
              </div>
            </article>
          </div>

          <!-- LOAD MORE -->

          <button
            type="button"
            class="mt-6 w-full rounded-2xl border border-white/15 bg-white/[0.06] py-4 text-sm font-semibold text-white/70 transition hover:bg-white/15 hover:text-white cursor-pointer"
          >
            Xem thêm mục đã lưu
          </button>
        </section>

        <!-- =================================================
              SIDEBAR
        ==================================================== -->

        <aside class="space-y-5">
          <!-- SAVED SUMMARY -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <h3 class="font-bold text-white">Bộ sưu tập của bạn</h3>

            <p class="mt-0.5 text-xs text-white/60">
              Những gì bạn đã lưu trên TravelGo
            </p>

            <div class="mt-5 space-y-3">
              <div
                class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg"> ✈️ </span>

                  <span class="text-sm font-semibold text-white"> Tours </span>
                </div>

                <span class="text-xs font-bold text-white/70"> 6 </span>
              </div>

              <div
                class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg"> 📍 </span>

                  <span class="text-sm font-semibold text-white">
                    Điểm đến
                  </span>
                </div>

                <span class="text-xs font-bold text-white/70"> 5 </span>
              </div>

              <div
                class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg"> 📝 </span>

                  <span class="text-sm font-semibold text-white">
                    Bài viết
                  </span>
                </div>

                <span class="text-xs font-bold text-white/70"> 4 </span>
              </div>

              <div
                class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg"> ✨ </span>

                  <span class="text-sm font-semibold text-white">
                    Lịch trình AI
                  </span>
                </div>

                <span class="text-xs font-bold text-white/70"> 3 </span>
              </div>
            </div>
          </div>

          <!-- UPCOMING -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white">Sắp đi?</h3>

              <span class="text-xs font-bold text-orange-300"> 01 chuyến </span>
            </div>

            <div
              class="mt-5 overflow-hidden rounded-2xl border border-white/15 bg-black/25"
            >
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=700&q=85"
                alt="Hạ Long"
                class="h-32 w-full object-cover"
              />

              <div class="p-4">
                <p class="text-xs text-white/60">18 - 20 Sep 2026</p>

                <h4 class="mt-1 font-bold text-white">Hạ Long 3N2Đ</h4>

                <p class="mt-1.5 text-xs text-white/70">Tour đã lưu</p>

                <RouterLink
                  to="/booking/1"
                  class="mt-4 block rounded-xl bg-white py-2.5 text-center text-xs font-bold text-slate-900 transition hover:bg-slate-100 shadow"
                >
                  Đặt tour
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- AI SUGGESTION -->

          <div
            class="rounded-[24px] border border-orange-300/20 bg-gradient-to-br from-orange-400/15 via-white/[0.06] to-transparent p-5 backdrop-blur-2xl"
          >
            <div class="text-2xl">✨</div>

            <h3 class="mt-3 text-base font-bold text-white">
              Chưa biết đi đâu?
            </h3>

            <p class="mt-2 text-xs leading-6 text-white/75">
              TravelGo AI có thể dựa trên những điểm đến bạn yêu thích để đề
              xuất hành trình phù hợp.
            </p>

            <RouterLink
              to="/ai-planner"
              class="mt-5 block rounded-xl border border-white/20 bg-white/10 py-3 text-center text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Khám phá với AI →
            </RouterLink>
          </div>

          <!-- TIP -->

          <div
            class="rounded-[24px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-2xl"
          >
            <div class="flex gap-3">
              <div class="text-xl">💡</div>

              <div>
                <h3 class="text-sm font-bold text-white">Mẹo nhỏ</h3>

                <p class="mt-1.5 text-xs leading-6 text-white/70">
                  Bạn có thể lưu tour hoặc điểm đến từ trang chi tiết bằng biểu
                  tượng ♥ để quay lại nhanh hơn.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
