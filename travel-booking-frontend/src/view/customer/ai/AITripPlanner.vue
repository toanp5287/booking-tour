<template>
  <div
    class="relative min-h-screen bg-[#090b10] font-sans text-slate-100 antialiased selection:bg-amber-300/20 selection:text-amber-200"
  >
    <!-- BACKGROUND ATMOSPHERE -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#090b10]/70 via-[#090b10]/95 to-[#090b10]"
      ></div>
      <div
        class="absolute left-1/3 top-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-amber-400/5 blur-[140px]"
      ></div>
      <div
        class="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-500/5 blur-[160px]"
      ></div>
    </div>

    <!-- MAIN CONTENT -->
    <main
      class="relative z-10 mx-auto max-w-[1440px] px-4 pt-20 pb-16 sm:px-6 lg:px-8"
    >
      <!-- HEADER BANNER GỌN -->
      <section class="border-b border-white/[0.06] pb-8 pt-4">
        <div
          class="flex flex-col justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-amber-200/90 backdrop-blur-md"
            >
              <span class="relative flex h-2 w-2">
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75"
                ></span>
                <span
                  class="relative inline-flex h-2 w-2 rounded-full bg-amber-300"
                ></span>
              </span>
              <span>Trợ lý lập lịch trình thông minh</span>
            </div>

            <h1
              class="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl"
            >
              TravelGo
              <span
                class="bg-gradient-to-r from-amber-200 via-amber-100 to-white/70 bg-clip-text text-transparent"
              >
                AI Trip Planner
              </span>
            </h1>

            <p class="mt-1.5 text-xs text-slate-400 sm:text-sm">
              Trò chuyện cùng AI hoặc nhập thông số chuyến đi để tạo lộ trình
              chi tiết theo từng khung giờ và tối ưu ngân sách.
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0f131c] px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span>🔄</span>
              <span>Làm mới đoạn chat</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-300 hover:text-slate-950"
            >
              <span>Lưu chuyến đi</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 2 CỘT CHÍNH: CHAT CONSOLE & ITINERARY PREVIEW -->
      <section
        class="mt-8 grid gap-6 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr]"
      >
        <!-- =========================================================
             CỘT TRÁI: HỘP CHAT TRAVELGO AI
        ========================================================== -->
        <aside
          class="flex h-[760px] flex-col rounded-2xl border border-white/[0.08] bg-[#0f131c] shadow-lg"
        >
          <!-- Chat Header -->
          <div
            class="flex items-center justify-between border-b border-white/[0.06] p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 font-mono text-sm font-bold text-amber-200"
              >
                ✦
              </div>
              <div>
                <h2 class="text-xs font-bold text-white">TravelGo AI Guide</h2>
                <div class="flex items-center gap-1.5">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span class="text-[10px] text-slate-400"
                    >Đang hoạt động · Sẵn sàng gợi ý</span
                  >
                </div>
              </div>
            </div>

            <span
              class="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] text-slate-400 font-mono"
            >
              v2.4
            </span>
          </div>

          <!-- Chat Message Feed -->
          <div
            class="flex-1 space-y-4 overflow-y-auto p-4 pr-3 text-xs leading-relaxed"
          >
            <!-- Tin nhắn AI chào -->
            <div class="flex items-start gap-2.5">
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-xs font-bold text-amber-200"
              >
                ✦
              </div>
              <div
                class="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] p-3.5 text-slate-300"
              >
                <p>
                  Xin chào! 👋 Tôi là trợ lý du lịch TravelGo AI. Bạn đang lên
                  kế hoạch đi đâu, mấy ngày và dự kiến ngân sách thế nào?
                </p>
                <p class="mt-1.5 text-[11px] text-slate-400">
                  Bạn có thể chọn gợi ý nhanh bên dưới hoặc nhắn tin trực tiếp.
                </p>
              </div>
            </div>

            <!-- Gợi ý nhanh (Prompt Chips) -->
            <div class="flex flex-wrap gap-1.5 pl-9">
              <button
                type="button"
                class="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1 text-[11px] text-amber-200 transition hover:bg-amber-300/15"
              >
                🏝️ Đà Nẵng 4N3Đ dưới 6 triệu
              </button>
              <button
                type="button"
                class="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-white/15 hover:text-white"
              >
                🏔️ Sa Pa 3N2Đ săn mây
              </button>
              <button
                type="button"
                class="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-white/15 hover:text-white"
              >
                🌊 Hạ Long du thuyền 2N1Đ
              </button>
            </div>

            <!-- Tin nhắn người dùng -->
            <div class="flex items-start justify-end gap-2.5">
              <div
                class="max-w-[85%] rounded-2xl rounded-tr-sm bg-amber-300 p-3 text-slate-950 font-medium shadow-sm"
              >
                Tôi muốn lên lịch trình Đà Nẵng 4 ngày 3 đêm cho 2 người, thích
                tắm biển, ăn hải sản và có ghé phố cổ Hội An buổi tối.
              </div>
            </div>

            <!-- Tin nhắn phản hồi từ AI -->
            <div class="flex items-start gap-2.5">
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-xs font-bold text-amber-200"
              >
                ✦
              </div>
              <div
                class="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] p-3.5 text-slate-300"
              >
                <p>
                  Tuyệt vời! Tôi đã tính toán và thiết lập lộ trình **Đà Nẵng -
                  Hội An (4N3Đ)** tối ưu cung đường di chuyển để bạn có nhiều
                  thời gian tắm biển và thưởng thức ẩm thực nhất.
                </p>
                <div
                  class="mt-2.5 rounded-xl border border-white/[0.06] bg-[#090b10] p-2.5 text-[11px] text-slate-300"
                >
                  <p class="font-semibold text-amber-200">
                    Điểm nhấn chuyến đi:
                  </p>
                  <ul
                    class="mt-1 list-inside list-disc space-y-0.5 text-slate-400"
                  >
                    <li>Bán đảo Sơn Trà & Biển Mỹ Khê</li>
                    <li>Phố cổ Hội An thả hoa đăng đêm</li>
                    <li>Check-in Bà Nà Hills & Cầu Vàng</li>
                  </ul>
                </div>
                <p class="mt-2 text-[11px] text-slate-400">
                  Bản lịch trình đầy đủ đã được đồng bộ sang cột bên phải! 👉
                </p>
              </div>
            </div>
          </div>

          <!-- Chat Input Area -->
          <div class="border-t border-white/[0.06] p-3">
            <div
              class="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-[#090b10] p-2 focus-within:border-amber-300/40"
            >
              <textarea
                rows="2"
                placeholder="Hỏi AI thêm: 'Đổi ngày 2 sang Bà Nà Hills', 'Thêm quán cafe đẹp'..."
                class="w-full resize-none bg-transparent px-2 text-xs font-medium text-white placeholder:text-slate-500 outline-none"
              ></textarea>

              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-300 text-slate-950 transition hover:bg-amber-400 active:scale-95"
                title="Gửi tin nhắn"
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
                    stroke-width="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <!-- =========================================================
             CỘT PHẢI: BẢNG LỊCH TRÌNH & THAM SỐ TỔNG HỢP
        ========================================================== -->
        <div class="flex flex-col gap-6">
          <!-- QUICK PARAMETER BAR (FORM THAM SỐ NHANH) -->
          <div class="rounded-2xl border border-white/[0.08] bg-[#0f131c] p-4">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <!-- Điểm đến -->
              <div
                class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <span
                  class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >Điểm đến</span
                >
                <input
                  type="text"
                  value="Đà Nẵng - Hội An"
                  class="mt-0.5 w-full bg-transparent text-xs font-bold text-white outline-none"
                />
              </div>

              <!-- Thời gian -->
              <div
                class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <span
                  class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >Thời gian</span
                >
                <select
                  class="mt-0.5 w-full cursor-pointer bg-transparent text-xs font-bold text-white outline-none"
                >
                  <option class="bg-[#0f131c]">4 Ngày 3 Đêm</option>
                  <option class="bg-[#0f131c]">3 Ngày 2 Đêm</option>
                  <option class="bg-[#0f131c]">5 Ngày 4 Đêm</option>
                </select>
              </div>

              <!-- Ngân sách -->
              <div
                class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <span
                  class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >Ngân sách dự kiến</span
                >
                <select
                  class="mt-0.5 w-full cursor-pointer bg-transparent text-xs font-bold text-white outline-none"
                >
                  <option class="bg-[#0f131c]">2 - 5 triệu / người</option>
                  <option class="bg-[#0f131c]">5 - 10 triệu / người</option>
                  <option class="bg-[#0f131c]">Trên 10 triệu</option>
                </select>
              </div>

              <!-- Thành viên -->
              <div
                class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <span
                  class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >Số lượng</span
                >
                <select
                  class="mt-0.5 w-full cursor-pointer bg-transparent text-xs font-bold text-white outline-none"
                >
                  <option class="bg-[#0f131c]">2 người (Cặp đôi)</option>
                  <option class="bg-[#0f131c]">Gia đình (3-4 người)</option>
                  <option class="bg-[#0f131c]">Nhóm bạn (5+ người)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- DETAILED ITINERARY CARD (KẾT QUẢ XUẤT LỘ TRÌNH) -->
          <div
            class="rounded-2xl border border-white/[0.08] bg-[#0f131c] p-5 sm:p-6"
          >
            <!-- Header kết quả -->
            <div
              class="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-200"
                  >
                    ĐÃ TỐI ƯU HÓA
                  </span>
                  <span class="text-xs text-slate-400"
                    >Cập nhật bởi AI vừa xong</span
                  >
                </div>
                <h2 class="mt-1.5 text-xl font-bold text-white">
                  Lịch trình chi tiết: Khám phá Đà Nẵng - Hội An
                </h2>
              </div>

              <!-- Thống kê nhanh -->
              <div
                class="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#090b10] px-4 py-2 text-xs"
              >
                <div>
                  <span class="text-[10px] text-slate-500 block">Dự toán</span>
                  <strong class="font-mono text-amber-200">~ 4.800.000₫</strong>
                </div>
                <div class="h-6 w-px bg-white/[0.08]"></div>
                <div>
                  <span class="text-[10px] text-slate-500 block"
                    >Độ phù hợp</span
                  >
                  <strong class="text-emerald-400">96%</strong>
                </div>
              </div>
            </div>

            <!-- TIMELINE LỊCH TRÌNH THEO NGÀY -->
            <div class="mt-6 space-y-6">
              <!-- NGÀY 1 -->
              <div
                class="rounded-xl border border-white/[0.06] bg-[#090b10] p-4"
              >
                <div
                  class="flex items-center justify-between border-b border-white/[0.06] pb-3"
                >
                  <div class="flex items-center gap-2.5">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded-md bg-amber-300 text-[11px] font-mono font-bold text-slate-950"
                    >
                      01
                    </span>
                    <h3
                      class="text-xs font-bold text-white uppercase tracking-wider"
                    >
                      Ngày 1: Đón sân bay · Bán đảo Sơn Trà · Check-in Biển Mỹ
                      Khê
                    </h3>
                  </div>
                  <span class="text-[11px] text-slate-400"
                    >3 hoạt động chính</span
                  >
                </div>

                <div class="mt-3.5 space-y-3 pl-2">
                  <div class="border-l-2 border-amber-300/40 pl-3">
                    <p class="text-xs font-semibold text-slate-200">
                      09:00 - 11:30 · Chùa Linh Ứng & Bán đảo Sơn Trà
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                      Ngắm toàn cảnh vịnh Đà Nẵng, tham quan tượng Phật Bà Quan
                      Âm 67m.
                    </p>
                  </div>
                  <div class="border-l-2 border-white/10 pl-3">
                    <p class="text-xs font-semibold text-slate-200">
                      12:30 · Ăn trưa Bánh tráng cuốn thịt heo Đại Lộc
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                      Thưởng thức đặc sản số 1 miền Trung với nước mắm nêm đậm
                      vị.
                    </p>
                  </div>
                  <div class="border-l-2 border-white/10 pl-3">
                    <p class="text-xs font-semibold text-slate-200">
                      16:00 - 18:30 · Tắm biển Mỹ Khê & ngắm hoàng hôn
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                      Một trong 6 bãi biển quyến rũ nhất hành tinh do Forbes
                      bình chọn.
                    </p>
                  </div>
                </div>
              </div>

              <!-- NGÀY 2 -->
              <div
                class="rounded-xl border border-white/[0.06] bg-[#090b10] p-4"
              >
                <div
                  class="flex items-center justify-between border-b border-white/[0.06] pb-3"
                >
                  <div class="flex items-center gap-2.5">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[11px] font-mono font-bold text-slate-200"
                    >
                      02
                    </span>
                    <h3
                      class="text-xs font-bold text-white uppercase tracking-wider"
                    >
                      Ngày 2: Ngũ Hành Sơn · Phố cổ Hội An về đêm
                    </h3>
                  </div>
                  <span class="text-[11px] text-slate-400"
                    >3 hoạt động chính</span
                  >
                </div>

                <div class="mt-3.5 space-y-3 pl-2">
                  <div class="border-l-2 border-amber-300/40 pl-3">
                    <p class="text-xs font-semibold text-slate-200">
                      14:00 · Khám phá quần thể Ngũ Hành Sơn & Động Huyền Không
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                      Chinh phục ngọn Thủy Sơn và làng đá mỹ nghệ Non Nước.
                    </p>
                  </div>
                  <div class="border-l-2 border-white/10 pl-3">
                    <p class="text-xs font-semibold text-slate-200">
                      17:00 - 21:00 · Tản bộ Phố Cổ Hội An & Thả hoa đăng sông
                      Hoài
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                      Thưởng thức Cơm gà Bà Buội, Cao Lầu và ngắm dãy đèn lồng
                      lung linh.
                    </p>
                  </div>
                </div>
              </div>

              <!-- NGÀY 3 & 4 GOM TẮT -->
              <div
                class="rounded-xl border border-white/[0.06] bg-[#090b10] p-4"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[11px] font-mono font-bold text-slate-200"
                    >
                      3-4
                    </span>
                    <h3
                      class="text-xs font-bold text-white uppercase tracking-wider"
                    >
                      Ngày 3 - 4: Bà Nà Hills · Cầu Rồng phun lửa · Mua đặc sản
                      Chợ Cồn
                    </h3>
                  </div>
                  <button
                    type="button"
                    class="text-xs text-amber-200 hover:underline"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>

            <!-- FOOTER HÀNH ĐỘNG -->
            <div
              class="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-5 sm:flex-row"
            >
              <p class="text-xs text-slate-400">
                Đã có tour trọn gói tương ứng với lịch trình này từ TravelGo.
              </p>

              <div class="flex w-full items-center gap-2.5 sm:w-auto">
                <button
                  type="button"
                  class="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/10 sm:flex-initial"
                >
                  Xuất file PDF
                </button>
                <RouterLink
                  to="/tours"
                  class="flex-1 rounded-xl bg-amber-300 px-5 py-2.5 text-center text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-95 sm:flex-initial"
                >
                  Đặt tour theo lộ trình này →
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
