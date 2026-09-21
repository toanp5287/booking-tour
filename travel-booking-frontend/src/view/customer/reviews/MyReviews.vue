<template>
  <div class="relative min-h-screen text-white pt-20 pb-16">
    <!-- KHUNG NỀN CỐ ĐỊNH CHUẨN Z-0 -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-black/40"></div>
      <div
        class="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-[#080b12]/85"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent"
      ></div>
    </div>

    <!-- NỘI DUNG CHÍNH (relative z-10) -->
    <main class="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <!-- BREADCRUMB -->
      <div
        class="mb-6 flex items-center gap-2 text-xs font-semibold text-white/70"
      >
        <RouterLink to="/" class="transition hover:text-white"
          >Trang chủ</RouterLink
        >
        <span class="text-white/40">/</span>
        <RouterLink to="/profile" class="transition hover:text-white"
          >Tài khoản</RouterLink
        >
        <span class="text-white/40">/</span>
        <span class="text-white">Đánh giá của tôi</span>
      </div>

      <!-- HEADER -->
      <section
        class="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"
      >
        <div>
          <div
            class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 backdrop-blur-xl"
          >
            <span>★</span> Verified Reviews
          </div>
          <h1
            class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Đánh giá & Trải nghiệm
          </h1>
          <p class="mt-2 text-sm text-white/75">
            Quản lý nhận xét chuyến đi của bạn và đóng góp phản hồi thực tế cho
            cộng đồng.
          </p>
        </div>

        <RouterLink
          to="/tours"
          class="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          Khám phá thêm tour
          <span>→</span>
        </RouterLink>
      </section>

      <!-- STATS OVERVIEW -->
      <section class="mb-8 grid gap-4 sm:grid-cols-3">
        <div
          class="rounded-3xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wider text-white/60"
          >
            Tổng nhận xét
          </p>
          <p class="mt-3 text-3xl font-extrabold text-white">08</p>
          <p class="mt-1 text-xs text-white/70">Đã đăng tải thành công</p>
        </div>

        <div
          class="rounded-3xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wider text-white/60"
          >
            Điểm trung bình bạn chấm
          </p>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-amber-300">4.9</span>
            <span class="text-xs text-amber-300/80">★★★★★</span>
          </div>
          <p class="mt-1 text-xs text-emerald-300">100% đánh giá tích cực</p>
        </div>

        <div
          class="rounded-3xl border border-orange-300/20 bg-orange-400/[0.06] p-6 backdrop-blur-2xl"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wider text-orange-200/80"
          >
            Chờ đánh giá
          </p>
          <p class="mt-3 text-3xl font-extrabold text-white">01</p>
          <p class="mt-1 text-xs text-orange-200">
            Chuyến đi vừa hoàn thành gần đây
          </p>
        </div>
      </section>

      <!-- TABS -->
      <div
        class="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.05] p-1.5 backdrop-blur-xl"
      >
        <button
          type="button"
          class="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow cursor-pointer"
        >
          Đã đánh giá (8)
        </button>

        <button
          type="button"
          class="rounded-xl px-5 py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          Chờ đánh giá (1)
        </button>
      </div>

      <!-- DANH SÁCH ĐÁNH GIÁ -->
      <div class="space-y-5">
        <!-- ITEM 1 -->
        <article
          class="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl transition hover:border-white/25 sm:p-7"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div class="flex gap-4">
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=300&q=80"
                alt="Hạ Long"
                class="h-20 w-24 rounded-2xl object-cover"
              />
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold uppercase tracking-wider text-orange-300"
                  >
                    Booking #TG20260711
                  </span>
                  <span
                    class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300"
                  >
                    ✓ Đã xác thực
                  </span>
                </div>
                <h3 class="mt-1 text-lg font-bold text-white">
                  Khám phá Vịnh Hạ Long 3N2Đ
                </h3>
                <p class="mt-1 text-xs text-white/60">
                  Khởi hành: 12/07/2026 · Du thuyền 5 sao
                </p>
              </div>
            </div>

            <div
              class="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start"
            >
              <div class="tracking-widest text-amber-300 text-sm">★★★★★</div>
              <p class="mt-1 text-xs text-white/60">Đăng ngày 15/07/2026</p>
            </div>
          </div>

          <div class="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h4 class="text-sm font-bold text-white">
              "Chuyến đi vượt mong đợi, cảnh sắc tuyệt vời"
            </h4>
            <p class="mt-2 text-sm leading-7 text-white/80">
              Lịch trình rất hợp lý, thời gian ngắm hoàng hôn trên boong tàu là
              trải nghiệm đáng nhớ nhất. Hướng dẫn viên chu đáo, đồ ăn ngon và
              phong phú. Gia đình mình rất hài lòng!
            </p>
          </div>

          <div
            class="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold text-white/60"
          >
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5 text-white/80">
                <span>👍</span> 34 người thấy hữu ích
              </span>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="transition hover:text-white cursor-pointer"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                class="transition hover:text-rose-400 cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </article>

        <!-- ITEM 2 -->
        <article
          class="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl transition hover:border-white/25 sm:p-7"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div class="flex gap-4">
              <img
                src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=300&q=80"
                alt="Đà Nẵng"
                class="h-20 w-24 rounded-2xl object-cover"
              />
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold uppercase tracking-wider text-orange-300"
                  >
                    Booking #TG20260508
                  </span>
                  <span
                    class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300"
                  >
                    ✓ Đã xác thực
                  </span>
                </div>
                <h3 class="mt-1 text-lg font-bold text-white">
                  Đà Nẵng - Hội An 4 ngày 3 đêm
                </h3>
                <p class="mt-1 text-xs text-white/60">
                  Khởi hành: 18/05/2026 · Khách sạn biển
                </p>
              </div>
            </div>

            <div
              class="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start"
            >
              <div class="tracking-widest text-amber-300 text-sm">★★★★★</div>
              <p class="mt-1 text-xs text-white/60">Đăng ngày 22/05/2026</p>
            </div>
          </div>

          <div class="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h4 class="text-sm font-bold text-white">
              "Phố cổ Hội An về đêm lung linh và thanh bình"
            </h4>
            <p class="mt-2 text-sm leading-7 text-white/80">
              Khách sạn sát biển Mỹ Khê thuận tiện tắm sáng. Điểm nhấn là buổi
              thả hoa đăng tại sông Hoài, không gian rất hoài niệm. Sẽ tiếp tục
              đặt tour trên TravelGo vào các chuyến đi tới.
            </p>
          </div>

          <div
            class="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold text-white/60"
          >
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5 text-white/80">
                <span>👍</span> 19 người thấy hữu ích
              </span>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="transition hover:text-white cursor-pointer"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                class="transition hover:text-rose-400 cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
