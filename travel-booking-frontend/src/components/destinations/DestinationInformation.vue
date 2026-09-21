<template>
  <section class="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
    <div class="grid gap-14 lg:grid-cols-[1.2fr_.8fr]">
      <!-- CONTENT -->

      <div>
        <p
          class="text-xs font-semibold uppercase tracking-[0.25em] text-white/35"
        >
          Khám phá điểm đến
        </p>

        <h2 class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Một hành trình,
          <span class="text-white/45"> vô vàn trải nghiệm. </span>
        </h2>

        <p class="mt-6 max-w-2xl leading-8 text-white/50">
          Mỗi điểm đến đều sở hữu một vẻ đẹp và dấu ấn riêng, nơi thiên nhiên,
          văn hóa và nhịp sống địa phương hòa quyện để tạo nên những trải nghiệm
          đáng nhớ. Đây là cơ hội để bạn tạm rời xa những bộn bề thường nhật và
          tận hưởng hành trình theo cách trọn vẹn nhất.
        </p>

        <p class="mt-5 max-w-2xl leading-8 text-white/50">
          Từ những thắng cảnh nổi bật, nét văn hóa đặc trưng đến ẩm thực và các
          hoạt động trải nghiệm thú vị, mỗi khoảnh khắc đều góp phần tạo nên một
          hành trình đầy cảm hứng. Hãy khám phá, tận hưởng và lưu giữ những kỷ
          niệm đẹp tại điểm đến mà bạn lựa chọn.
        </p>

        <!-- ACTIVITIES -->
        <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div class="text-xl">📍</div>
            <p class="mt-3 text-xs text-white/55">Địa điểm nổi bật</p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div class="text-xl">✨</div>
            <p class="mt-3 text-xs text-white/55">Trải nghiệm đặc sắc</p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div class="text-xl">🏛️</div>
            <p class="mt-3 text-xs text-white/55">Văn hóa địa phương</p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div class="text-xl">❤️</div>
            <p class="mt-3 text-xs text-white/55">Khoảnh khắc đáng nhớ</p>
          </div>
        </div>
      </div>

      <!-- WEATHER CARD -->

      <div
        class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#172131] to-[#0c1119] p-7"
      >
        <div
          class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-300/10 blur-3xl"
        ></div>

        <div class="relative">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-wider text-white/35">
                Thời tiết
              </p>

              <p class="mt-2 text-sm text-white/60">Hạ Long hôm nay</p>
            </div>

            <div class="text-4xl">☀️</div>
          </div>

          <div class="mt-10">
            <span class="text-6xl font-light"> 28° </span>

            <span class="ml-2 text-white/40"> C </span>
          </div>

          <p class="mt-3 text-sm text-white/50">Trời quang · Gió nhẹ</p>

          <div
            class="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6"
          >
            <div>
              <p class="text-xs text-white/30">Độ ẩm</p>

              <p class="mt-1 font-medium">72%</p>
            </div>

            <div>
              <p class="text-xs text-white/30">Gió</p>

              <p class="mt-1 font-medium">12 km/h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
