<template>
  <header
    class="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080b10]/80 backdrop-blur-2xl"
  >
    <div class="flex h-[82px] items-center justify-between px-5 sm:px-8">
      <div>
        <p class="text-[10px] uppercase tracking-[0.25em] text-orange-300/60">
          Booking Management
        </p>

        <h1 class="mt-1 text-xl font-bold">Quản lý đặt tour</h1>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white sm:flex"
        >
          🔔
        </button>

        <button
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
        >
          ⚙
        </button>
      </div>
    </div>
  </header>
</template>
