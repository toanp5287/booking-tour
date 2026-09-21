<template>
  <section
    class="rounded-[28px] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-white">
        Bình luận
        <span class="text-white/50 text-sm font-normal">(38)</span>
      </h2>

      <select
        class="rounded-xl border border-white/15 bg-[#111722] px-3 py-2 text-xs text-white/80 outline-none"
      >
        <option class="bg-[#111722] text-white">Mới nhất</option>
        <option class="bg-[#111722] text-white">Nhiều tương tác</option>
      </select>
    </div>

    <!-- COMMENT 1 -->
    <div class="mt-7 flex gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-blue-600 text-sm font-bold text-slate-950"
      >
        L
      </div>

      <div class="flex-1">
        <div class="rounded-2xl bg-black/25 px-4 py-3 border border-white/10">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white">Linh Nguyễn</h3>
            <span class="text-[10px] text-white/50">18 phút trước</span>
          </div>

          <p class="mt-2 text-sm leading-6 text-white/80">
            Ảnh đẹp quá bạn ơi 😍 Mình cũng đang dự định đi Hà Giang vào tháng
            sau.
          </p>
        </div>

        <div class="mt-2 flex items-center gap-4 px-2">
          <button
            type="button"
            class="text-xs font-medium text-white/60 hover:text-rose-400 cursor-pointer"
          >
            ♡ 12
          </button>
          <button
            type="button"
            class="text-xs font-medium text-white/60 hover:text-white cursor-pointer"
          >
            Trả lời
          </button>
        </div>
      </div>
    </div>

    <!-- COMMENT 2 -->
    <div class="mt-6 flex gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-300 to-purple-600 text-sm font-bold text-slate-950"
      >
        T
      </div>

      <div class="flex-1">
        <div class="rounded-2xl bg-black/25 px-4 py-3 border border-white/10">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white">Tuấn Trần</h3>
            <span class="text-[10px] text-white/50">42 phút trước</span>
          </div>

          <p class="mt-2 text-sm leading-6 text-white/80">
            Cho mình hỏi cung đường này đi xe máy có khó không?
          </p>
        </div>

        <div class="mt-2 flex items-center gap-4 px-2">
          <button
            type="button"
            class="text-xs font-medium text-white/60 hover:text-rose-400 cursor-pointer"
          >
            ♡ 8
          </button>
          <button
            type="button"
            class="text-xs font-medium text-white/60 hover:text-white cursor-pointer"
          >
            Trả lời
          </button>
        </div>
      </div>
    </div>

    <!-- COMMENT 3 -->
    <div class="mt-6 flex gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 text-sm font-bold text-slate-950"
      >
        M
      </div>

      <div class="flex-1">
        <div class="rounded-2xl bg-black/25 px-4 py-3 border border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-white">Minh Anh</h3>
              <span
                class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300"
              >
                Đã trải nghiệm
              </span>
            </div>

            <span class="text-[10px] text-white/50">1 giờ trước</span>
          </div>

          <p class="mt-2 text-sm leading-6 text-white/80">
            Mình đi cung này năm ngoái rồi. Cực kỳ đáng đi, đặc biệt là đoạn
            sông Nho Quế.
          </p>
        </div>

        <div class="mt-2 flex items-center gap-4 px-2">
          <button
            type="button"
            class="text-xs font-medium text-white/60 hover:text-rose-400 cursor-pointer"
          >
            ♡ 21
          </button>
          <button
            type="button"
            class="text-xs font-medium text-white/60 hover:text-white cursor-pointer"
          >
            Trả lời
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="mt-7 w-full rounded-xl border border-white/15 bg-white/[0.05] py-3 text-xs font-semibold text-white/70 transition hover:bg-white/15 hover:text-white cursor-pointer"
    >
      Xem thêm bình luận
    </button>
  </section>
</template>
