<script setup></script>

<template>
  <main class="min-w-0 flex-1 min-h-screen lg:flex">
    <!-- =====================================================
         TOPBAR
    ====================================================== -->

    <!-- =====================================================
         CONTENT
    ====================================================== -->

    <div class="px-5 py-8 sm:px-8 lg:px-10">
      <!-- WELCOME -->

      <section
        class="relative mb-8 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04]"
      >
        <img
          src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85"
          alt="Travel"
          class="absolute inset-0 h-full w-full object-cover opacity-20"
        />

        <div
          class="absolute inset-0 bg-gradient-to-r from-[#070a10] via-[#070a10]/90 to-transparent"
        ></div>

        <div class="relative p-7 sm:p-9">
          <div class="max-w-2xl">
            <p
              class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-200/65"
            >
              Tổng quan hệ thống
            </p>

            <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Chào mừng trở lại, Admin.
            </h2>

            <p class="mt-3 text-sm leading-7 text-white/45 sm:text-base">
              Theo dõi hoạt động đặt tour, doanh thu, người dùng, nội dung cộng
              đồng và hiệu quả vận hành TravelGo từ một nơi.
            </p>
          </div>
        </div>
      </section>

      <!-- =====================================================
           KPI
      ====================================================== -->

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <!-- REVENUE -->

        <div class="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div class="flex items-start justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"
            >
              ₫
            </div>

            <span
              class="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200"
            >
              +18.6%
            </span>
          </div>

          <p class="mt-5 text-xs text-white/35">Doanh thu tháng này</p>

          <p class="mt-2 text-2xl font-bold">486.500.000₫</p>

          <p class="mt-2 text-[11px] text-white/30">So với tháng trước</p>
        </div>

        <!-- BOOKINGS -->

        <div class="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div class="flex items-start justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-300/10 text-orange-200"
            >
              ▣
            </div>

            <span
              class="rounded-full bg-orange-300/10 px-2.5 py-1 text-[10px] font-semibold text-orange-200"
            >
              +12.4%
            </span>
          </div>

          <p class="mt-5 text-xs text-white/35">Booking tháng này</p>

          <p class="mt-2 text-2xl font-bold">326</p>

          <p class="mt-2 text-[11px] text-white/30">
            18 booking đang chờ xử lý
          </p>
        </div>

        <!-- USERS -->

        <div class="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div class="flex items-start justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-300/10 text-blue-200"
            >
              ♙
            </div>

            <span
              class="rounded-full bg-blue-300/10 px-2.5 py-1 text-[10px] font-semibold text-blue-200"
            >
              +8.2%
            </span>
          </div>

          <p class="mt-5 text-xs text-white/35">Người dùng</p>

          <p class="mt-2 text-2xl font-bold">8.642</p>

          <p class="mt-2 text-[11px] text-white/30">214 người dùng mới</p>
        </div>

        <!-- TOURS -->

        <div class="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div class="flex items-start justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-300/10 text-purple-200"
            >
              ✈
            </div>

            <span
              class="rounded-full bg-purple-300/10 px-2.5 py-1 text-[10px] font-semibold text-purple-200"
            >
              Active
            </span>
          </div>

          <p class="mt-5 text-xs text-white/35">Tour đang hoạt động</p>

          <p class="mt-2 text-2xl font-bold">128</p>

          <p class="mt-2 text-[11px] text-white/30">9 tour cần kiểm tra</p>
        </div>
      </section>

      <!-- =====================================================
           MAIN GRID
      ====================================================== -->

      <section class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <!-- ===================================================
             REVENUE CHART
        ==================================================== -->

        <div
          class="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7"
        >
          <div class="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p class="text-[10px] uppercase tracking-[0.22em] text-white/30">
                Analytics
              </p>

              <h3 class="mt-2 text-xl font-bold">Doanh thu & booking</h3>

              <p class="mt-1 text-xs text-white/35">
                Thống kê 7 tháng gần nhất
              </p>
            </div>

            <button
              class="self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/45"
            >
              7 tháng ▾
            </button>
          </div>

          <!-- FAKE CHART -->

          <div class="mt-8">
            <div
              class="flex h-[270px] items-end gap-3 border-b border-white/10 px-2 sm:gap-5"
            >
              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/20"
                  style="height: 38%"
                ></div>
              </div>

              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/25"
                  style="height: 48%"
                ></div>
              </div>

              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/30"
                  style="height: 43%"
                ></div>
              </div>

              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/35"
                  style="height: 60%"
                ></div>
              </div>

              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/45"
                  style="height: 70%"
                ></div>
              </div>

              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/55"
                  style="height: 76%"
                ></div>
              </div>

              <div class="flex h-full flex-1 flex-col justify-end">
                <div
                  class="rounded-t-lg bg-orange-300/75"
                  style="height: 91%"
                ></div>
              </div>
            </div>

            <div
              class="mt-3 grid grid-cols-7 text-center text-[10px] text-white/25"
            >
              <span>02/26</span>
              <span>03/26</span>
              <span>04/26</span>
              <span>05/26</span>
              <span>06/26</span>
              <span>07/26</span>
              <span>08/26</span>
            </div>
          </div>
        </div>

        <!-- ===================================================
             BOOKING STATUS
        ==================================================== -->

        <div
          class="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] uppercase tracking-[0.22em] text-white/30">
                Booking
              </p>

              <h3 class="mt-2 text-xl font-bold">Trạng thái booking</h3>
            </div>

            <a
              href="admin-bookings.html"
              class="text-xs text-white/35 hover:text-white"
            >
              Xem tất cả →
            </a>
          </div>

          <div class="mt-7 space-y-5">
            <div>
              <div class="mb-2 flex justify-between text-xs">
                <span class="text-white/45"> Đã xác nhận </span>

                <span>186</span>
              </div>

              <div class="h-2 rounded-full bg-white/5">
                <div
                  class="h-full w-[72%] rounded-full bg-emerald-300/60"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex justify-between text-xs">
                <span class="text-white/45"> Chờ xác nhận </span>

                <span>18</span>
              </div>

              <div class="h-2 rounded-full bg-white/5">
                <div class="h-full w-[28%] rounded-full bg-orange-300/70"></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex justify-between text-xs">
                <span class="text-white/45"> Đã hoàn thành </span>

                <span>94</span>
              </div>

              <div class="h-2 rounded-full bg-white/5">
                <div class="h-full w-[42%] rounded-full bg-blue-300/60"></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex justify-between text-xs">
                <span class="text-white/45"> Đã hủy </span>

                <span>28</span>
              </div>

              <div class="h-2 rounded-full bg-white/5">
                <div class="h-full w-[14%] rounded-full bg-red-300/50"></div>
              </div>
            </div>
          </div>

          <div class="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p class="text-[11px] text-white/35">Tỷ lệ hoàn thành</p>

            <p class="mt-1 text-2xl font-bold">86.4%</p>
          </div>
        </div>
      </section>

      <!-- =====================================================
           RECENT BOOKINGS + QUICK ACTIONS
      ====================================================== -->

      <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <!-- RECENT BOOKINGS -->

        <div
          class="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]"
        >
          <div
            class="flex flex-col justify-between gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center"
          >
            <div>
              <p class="text-[10px] uppercase tracking-[0.22em] text-white/30">
                Recent activity
              </p>

              <h3 class="mt-2 text-xl font-bold">Booking gần đây</h3>
            </div>

            <a
              href="admin-bookings.html"
              class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/45 hover:bg-white/10 hover:text-white"
            >
              Quản lý booking
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[700px] text-left">
              <thead>
                <tr
                  class="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/25"
                >
                  <th class="px-6 py-4 font-medium">Khách hàng</th>

                  <th class="px-6 py-4 font-medium">Tour</th>

                  <th class="px-6 py-4 font-medium">Ngày đặt</th>

                  <th class="px-6 py-4 font-medium">Giá trị</th>

                  <th class="px-6 py-4 font-medium">Trạng thái</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-white/5">
                <tr class="transition hover:bg-white/[0.025]">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-300/10 text-xs font-bold text-orange-200"
                      >
                        MN
                      </div>

                      <div>
                        <p class="text-sm font-semibold">Minh Nguyễn</p>

                        <p class="text-[10px] text-white/30">minh@gmail.com</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <p class="text-sm">Đà Nẵng 4N3Đ</p>

                    <p class="text-[10px] text-white/30">#TG-1024</p>
                  </td>

                  <td class="px-6 py-4 text-xs text-white/40">25/08/2026</td>

                  <td class="px-6 py-4 text-sm font-semibold">6.850.000₫</td>

                  <td class="px-6 py-4">
                    <span
                      class="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] text-emerald-200"
                    >
                      Đã xác nhận
                    </span>
                  </td>
                </tr>

                <tr class="transition hover:bg-white/[0.025]">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-300/10 text-xs font-bold text-blue-200"
                      >
                        TA
                      </div>

                      <div>
                        <p class="text-sm font-semibold">Tuấn Anh</p>

                        <p class="text-[10px] text-white/30">
                          tuananh@gmail.com
                        </p>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <p class="text-sm">Hà Giang khám phá</p>

                    <p class="text-[10px] text-white/30">#TG-1023</p>
                  </td>

                  <td class="px-6 py-4 text-xs text-white/40">25/08/2026</td>

                  <td class="px-6 py-4 text-sm font-semibold">4.250.000₫</td>

                  <td class="px-6 py-4">
                    <span
                      class="rounded-full bg-orange-300/10 px-2.5 py-1 text-[10px] text-orange-200"
                    >
                      Chờ xác nhận
                    </span>
                  </td>
                </tr>

                <tr class="transition hover:bg-white/[0.025]">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-purple-300/10 text-xs font-bold text-purple-200"
                      >
                        HL
                      </div>

                      <div>
                        <p class="text-sm font-semibold">Hương Lê</p>

                        <p class="text-[10px] text-white/30">huong@gmail.com</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <p class="text-sm">Phú Quốc nghỉ dưỡng</p>

                    <p class="text-[10px] text-white/30">#TG-1022</p>
                  </td>

                  <td class="px-6 py-4 text-xs text-white/40">24/08/2026</td>

                  <td class="px-6 py-4 text-sm font-semibold">8.900.000₫</td>

                  <td class="px-6 py-4">
                    <span
                      class="rounded-full bg-blue-300/10 px-2.5 py-1 text-[10px] text-blue-200"
                    >
                      Đang chuẩn bị
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- QUICK ACTIONS -->

        <div class="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <p class="text-[10px] uppercase tracking-[0.22em] text-white/30">
            Management
          </p>

          <h3 class="mt-2 text-xl font-bold">Thao tác nhanh</h3>

          <div class="mt-5 grid gap-2">
            <a
              href="admin-tours.html"
              class="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/10"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-300/10 text-orange-200"
              >
                +
              </span>

              <div>
                <p class="text-sm font-semibold">Thêm tour</p>

                <p class="text-[10px] text-white/30">Tạo tour mới</p>
              </div>
            </a>

            <a
              href="admin-destinations.html"
              class="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/10"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-300/10 text-blue-200"
              >
                ⌖
              </span>

              <div>
                <p class="text-sm font-semibold">Thêm điểm đến</p>

                <p class="text-[10px] text-white/30">
                  Quản lý dữ liệu địa điểm
                </p>
              </div>
            </a>

            <a
              href="admin-vouchers.html"
              class="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/10"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-300/10 text-purple-200"
              >
                ◇
              </span>

              <div>
                <p class="text-sm font-semibold">Tạo voucher</p>

                <p class="text-[10px] text-white/30">Khuyến mãi & giảm giá</p>
              </div>
            </a>

            <a
              href="admin-community.html"
              class="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/10"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-300/10 text-red-200"
              >
                !
              </span>

              <div>
                <p class="text-sm font-semibold">Kiểm duyệt cộng đồng</p>

                <p class="text-[10px] text-white/30">7 nội dung cần xử lý</p>
              </div>
            </a>

            <a
              href="admin-ai.html"
              class="group flex items-center gap-3 rounded-2xl border border-orange-300/10 bg-orange-300/[0.035] p-3 transition hover:bg-orange-300/[0.07]"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-300/10 text-orange-200"
              >
                ✦
              </span>

              <div>
                <p class="text-sm font-semibold">TravelGo AI</p>

                <p class="text-[10px] text-white/30">
                  Quản lý hệ thống đề xuất
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- =====================================================
           LOWER MANAGEMENT
      ====================================================== -->

      <section class="mt-6 grid gap-6 lg:grid-cols-3">
        <!-- TOP TOURS -->

        <div class="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <div class="flex items-center justify-between">
            <h3 class="font-bold">Tour nổi bật</h3>

            <a
              href="admin-tours.html"
              class="text-xs text-white/30 hover:text-white"
            >
              Xem thêm
            </a>
          </div>

          <div class="mt-5 space-y-4">
            <div class="flex gap-3">
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=300&q=80"
                class="h-14 w-16 rounded-xl object-cover"
                alt="Ha Long"
              />

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">Hạ Long 3N2Đ</p>

                <p class="mt-1 text-[10px] text-white/30">86 booking</p>
              </div>

              <p class="text-xs font-semibold">6.2tr</p>
            </div>

            <div class="flex gap-3">
              <img
                src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=300&q=80"
                class="h-14 w-16 rounded-xl object-cover"
                alt="Da Nang"
              />

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">Đà Nẵng 4N3Đ</p>

                <p class="mt-1 text-[10px] text-white/30">72 booking</p>
              </div>

              <p class="text-xs font-semibold">6.85tr</p>
            </div>

            <div class="flex gap-3">
              <img
                src="https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=300&q=80"
                class="h-14 w-16 rounded-xl object-cover"
                alt="Phu Quoc"
              />

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">Phú Quốc 4N3Đ</p>

                <p class="mt-1 text-[10px] text-white/30">64 booking</p>
              </div>

              <p class="text-xs font-semibold">8.9tr</p>
            </div>
          </div>
        </div>

        <!-- COMMUNITY -->

        <div class="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <div class="flex items-center justify-between">
            <h3 class="font-bold">Cộng đồng</h3>

            <a
              href="admin-community.html"
              class="text-xs text-white/30 hover:text-white"
            >
              Kiểm duyệt
            </a>
          </div>

          <div class="mt-5 space-y-4">
            <div class="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div class="flex justify-between">
                <span class="text-xs font-semibold"> Bài viết mới </span>

                <span class="text-xs text-white/30"> 24 </span>
              </div>

              <p class="mt-2 text-[11px] leading-5 text-white/35">
                Bài viết được tạo trong 24 giờ qua.
              </p>
            </div>

            <div class="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div class="flex justify-between">
                <span class="text-xs font-semibold"> Đánh giá mới </span>

                <span class="text-xs text-white/30"> 46 </span>
              </div>

              <p class="mt-2 text-[11px] leading-5 text-white/35">
                Đánh giá từ khách hàng sau chuyến đi.
              </p>
            </div>

            <div
              class="rounded-2xl border border-red-300/10 bg-red-300/[0.025] p-4"
            >
              <div class="flex justify-between">
                <span class="text-xs font-semibold text-red-100">
                  Cần kiểm duyệt
                </span>

                <span class="text-xs text-red-200"> 7 </span>
              </div>

              <p class="mt-2 text-[11px] leading-5 text-white/35">
                Nội dung bị báo cáo hoặc cần admin kiểm tra.
              </p>
            </div>
          </div>
        </div>

        <!-- AI -->

        <div
          class="relative overflow-hidden rounded-[28px] border border-orange-300/10 bg-orange-300/[0.025] p-6"
        >
          <div
            class="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-300/10 blur-[80px]"
          ></div>

          <div class="relative">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-300/10 text-orange-200"
            >
              ✦
            </div>

            <p
              class="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200/55"
            >
              TravelGo AI
            </p>

            <h3 class="mt-2 text-xl font-bold">Hệ thống đề xuất</h3>

            <p class="mt-3 text-sm leading-6 text-white/40">
              Theo dõi dữ liệu điểm đến, sở thích người dùng, thời gian tham
              quan, chi phí và lịch trình để hỗ trợ hệ thống AI đề xuất hành
              trình.
            </p>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p class="text-[10px] text-white/30">Gợi ý hôm nay</p>

                <p class="mt-1 text-lg font-bold">1,248</p>
              </div>

              <div class="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p class="text-[10px] text-white/30">Độ phù hợp</p>

                <p class="mt-1 text-lg font-bold">92.4%</p>
              </div>
            </div>

            <a
              href="admin-ai.html"
              class="mt-5 flex w-full items-center justify-center rounded-xl bg-white py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Quản lý AI
            </a>
          </div>
        </div>
      </section>

      <!-- =====================================================
           ALERTS
      ====================================================== -->

      <section class="mt-6">
        <div class="mb-4">
          <p class="text-[10px] uppercase tracking-[0.22em] text-white/30">
            System
          </p>

          <h3 class="mt-2 text-xl font-bold">Cần xử lý</h3>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <a
            href="admin-bookings.html"
            class="rounded-2xl border border-orange-300/10 bg-orange-300/[0.025] p-5 transition hover:bg-orange-300/[0.05]"
          >
            <span class="text-xl">▣</span>

            <p class="mt-3 text-sm font-semibold">18 booking chờ xác nhận</p>

            <p class="mt-1 text-xs text-white/30">
              Kiểm tra và xác nhận booking mới.
            </p>
          </a>

          <a
            href="admin-community.html"
            class="rounded-2xl border border-red-300/10 bg-red-300/[0.025] p-5 transition hover:bg-red-300/[0.05]"
          >
            <span class="text-xl">!</span>

            <p class="mt-3 text-sm font-semibold">7 nội dung cần kiểm duyệt</p>

            <p class="mt-1 text-xs text-white/30">
              Có bài viết hoặc bình luận bị báo cáo.
            </p>
          </a>

          <a
            href="admin-tours.html"
            class="rounded-2xl border border-blue-300/10 bg-blue-300/[0.025] p-5 transition hover:bg-blue-300/[0.05]"
          >
            <span class="text-xl">✈</span>

            <p class="mt-3 text-sm font-semibold">9 tour cần kiểm tra</p>

            <p class="mt-1 text-xs text-white/30">
              Tour mới hoặc thông tin cần cập nhật.
            </p>
          </a>
        </div>
      </section>
    </div>

    <!-- =====================================================
         FOOTER
    ====================================================== -->
  </main>
</template>
