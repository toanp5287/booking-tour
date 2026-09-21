<script setup>
const props = defineProps({
  tour: {
    type: Object,
    default: () => ({}),
  },
});
</script>

<template>
  <section
    class="rounded-[26px] border border-white/10 bg-black/25 p-6 backdrop-blur-xl sm:p-8"
  >
    <div class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
        Overview
      </p>

      <h2 class="mt-2 text-2xl font-bold text-white">
        Một hành trình đáng nhớ
      </h2>
    </div>

    <!-- MÔ TẢ TOUR -->
    <p v-if="tour?.description" class="text-sm leading-7 text-white/80">
      {{ tour.description }}
    </p>

    <p v-else class="text-sm leading-7 text-white/60">Tour chưa có mô tả.</p>

    <!-- Highlights -->
    <div class="mt-7 grid gap-3 sm:grid-cols-2">
      <!-- Thời gian -->
      <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div class="mb-2 text-lg">📅</div>

        <div class="text-sm font-semibold text-white">Thời gian</div>

        <p class="mt-1 text-xs leading-5 text-white/70">
          {{ tour?.duration_days || 0 }} ngày
          {{ tour?.duration_nights || 0 }} đêm
        </p>
      </div>

      <!-- Phương tiện -->
      <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div class="mb-2 text-lg">🚗</div>

        <div class="text-sm font-semibold text-white">Phương tiện</div>

        <p class="mt-1 text-xs leading-5 text-white/70">
          {{ tour?.transportation || "Đang cập nhật" }}
        </p>
      </div>

      <!-- Số lượng -->
      <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div class="mb-2 text-lg">👥</div>

        <div class="text-sm font-semibold text-white">Số lượng tối đa</div>

        <p class="mt-1 text-xs leading-5 text-white/70">
          Tối đa {{ tour?.max_people || 0 }} người
        </p>
      </div>

      <!-- Độ khó -->
      <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div class="mb-2 text-lg">🥾</div>

        <div class="text-sm font-semibold text-white">Độ khó</div>

        <p class="mt-1 text-xs leading-5 text-white/70">
          {{ tour?.difficulty_level || "Đang cập nhật" }}
        </p>
      </div>
    </div>
  </section>
</template>
