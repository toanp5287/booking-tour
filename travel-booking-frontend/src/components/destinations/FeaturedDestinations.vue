<script setup>
import { ref, computed } from "vue";
const props = defineProps({
  destinationData: {
    type: Array,
    default: () => [],
  },
});
const visibleCount = 4;
const currentIndex = ref(0); // Số lượng card hiển thị const visibleCount = 4;
// // Có thể trượt sang phải không?
const canNext = computed(() => {
  return currentIndex.value < props.destinationData.length - visibleCount;
});
// Có thể trượt sang trái không?
const canPrev = computed(() => {
  return currentIndex.value > 0;
});
const next = () => {
  if (canNext.value) {
    currentIndex.value++;
  }
};
const prev = () => {
  if (canPrev.value) {
    currentIndex.value--;
  }
};
</script>

<template>
  <section>
    <!-- SECTION HEADING -->
    <div
      class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
    >
      <div>
        <p
          class="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35"
        >
          Featured destinations
        </p>

        <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
          Điểm đến nổi bật
        </h2>

        <p class="mt-2 text-sm text-white/40">
          Những nơi được nhiều du khách lựa chọn.
        </p>
      </div>

      <RouterLink
        to="/tours"
        class="text-sm font-medium text-white/55 transition hover:text-white"
      >
        Xem tour →
      </RouterLink>
    </div>

    <!-- CAROUSEL -->
    <div class="relative px-2 sm:px-0">
      <!-- NÚT TRÁI -->
      <button
        v-if="props.destinationData.length > visibleCount"
        type="button"
        @click="prev"
        :disabled="!canPrev"
        class="absolute left-[-18px] top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        ←
      </button>

      <!-- VÙNG HIỂN THỊ -->
      <div class="overflow-hidden">
        <div
          class="flex gap-5 transition-transform duration-500 ease-out"
          :style="{
            transform: `translateX(calc(-${currentIndex * 25}% - ${
              currentIndex * 5
            }px))`,
          }"
        >
          <!-- DESTINATION -->
          <RouterLink
            v-for="value in props.destinationData"
            :key="value.id"
            :to="`/destinations/${value.id}`"
            class="group relative min-h-[430px] min-w-[calc(25%-15px)] flex-[0_0_calc(25%-15px)] overflow-hidden rounded-[26px] border border-white/10"
          >
            <!-- IMAGE -->
            <img
              :src="
                value.image
                  ? `http://localhost:8080/${value.image}`
                  : 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=90'
              "
              :alt="value.name"
              class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <!-- OVERLAY -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
            ></div>

            <!-- PROVINCE -->
            <div class="absolute left-5 top-5">
              <span
                class="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md"
              >
                {{ value.province }}
              </span>
            </div>

            <!-- CONTENT -->
            <div class="absolute inset-x-0 bottom-0 p-6">
              <!-- ADDRESS -->
              <div class="mb-3 flex items-center gap-2 text-xs text-white/60">
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.7"
                    d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z"
                  />

                  <circle cx="12" cy="10" r="2.3" stroke-width="1.7" />
                </svg>

                <span class="line-clamp-1">
                  {{ value.address }}
                </span>
              </div>

              <!-- NAME -->
              <h3 class="text-2xl font-bold">
                {{ value.name }}
              </h3>

              <!-- DESCRIPTION -->
              <p class="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                {{ value.description }}
              </p>

              <!-- FOOTER -->
              <div
                class="mt-5 flex items-center justify-between border-t border-white/15 pt-4"
              >
                <span class="text-xs text-white/50">
                  {{ value.tours_count || 0 }}+ tour
                </span>

                <span
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- NÚT PHẢI -->
      <button
        v-if="props.destinationData.length > visibleCount"
        type="button"
        @click="next"
        :disabled="!canNext"
        class="absolute right-[-18px] top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        →
      </button>
    </div>
  </section>
</template>
