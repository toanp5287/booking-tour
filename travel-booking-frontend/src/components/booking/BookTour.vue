<script setup>
const props = defineProps({
  tourData: {
    type: Object,
    default: () => ({}),
  },
});
</script>
<template>
  <section
    class="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
  >
    <div class="p-6 sm:p-7">
      <div class="mb-6 flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z"
            />

            <circle cx="12" cy="11" r="2.5" stroke-width="1.7" />
          </svg>
        </div>

        <div>
          <h2 class="font-semibold text-white">Thông tin tour</h2>

          <p class="text-xs text-white/70 font-medium">
            Kiểm tra lại hành trình của bạn
          </p>
        </div>
      </div>

      <!-- Tour -->

      <div
        class="flex flex-col gap-5 rounded-2xl border border-white/15 bg-black/25 p-4 sm:flex-row"
      >
        <img
          :src="`http://localhost:8080/${tourData.thumbnail.replaceAll('\\', '/')}`"
          alt="Tour Việt Nam"
          class="h-40 w-full rounded-xl object-cover sm:h-28 sm:w-40"
        />

        <div class="flex-1">
          <div
            class="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70"
          >
            TOUR {{ tourData.id }}
          </div>

          <h3 class="text-lg font-semibold text-white"></h3>

          <div
            class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/80 font-medium"
          >
            <span> 📍 {{ tourData.name }} </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
