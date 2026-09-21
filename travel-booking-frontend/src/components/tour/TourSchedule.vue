<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  itineraries: {
    type: Array,
    default: () => [],
  },
});

const showAll = ref(false);

const displayedItineraries = computed(() => {
  if (showAll.value) {
    return props.itineraries;
  }

  return props.itineraries.slice(0, 1);
});
</script>

<template>
  <section
    class="rounded-[26px] border border-white/10 bg-black/25 p-6 backdrop-blur-xl sm:p-8"
  >
    <div class="mb-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
        Itinerary
      </p>

      <h2 class="mt-2 text-2xl font-bold text-white">Lịch trình chuyến đi</h2>
    </div>

    <div class="space-y-7">
      <!-- CÁC NGÀY -->
      <div
        v-for="(itinerary, index) in displayedItineraries"
        :key="itinerary.id"
        class="relative pl-10"
      >
        <!-- SỐ NGÀY -->
        <div
          class="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900"
        >
          {{ itinerary.day_number }}
        </div>

        <!-- ĐƯỜNG DỌC -->
        <div
          v-if="index < displayedItineraries.length - 1"
          class="absolute left-[13px] top-7 h-[calc(100%+28px)] w-px bg-white/10"
        ></div>

        <!-- NGÀY -->
        <div
          class="mb-1 text-xs font-semibold uppercase tracking-widest text-white/70"
        >
          Ngày {{ String(itinerary.day_number).padStart(2, "0") }}
        </div>

        <!-- TIÊU ĐỀ -->
        <h3 class="text-lg font-semibold text-white">
          {{ itinerary.title }}
        </h3>

        <!-- MÔ TẢ -->
        <p
          v-if="itinerary.description"
          class="mt-2 text-sm leading-6 text-white/80"
        >
          {{ itinerary.description }}
        </p>

        <!-- DANH SÁCH HOẠT ĐỘNG -->
        <div v-if="itinerary.activities?.length" class="mt-4 space-y-3">
          <div
            v-for="activity in itinerary.activities"
            :key="activity.id"
            class="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <!-- THỜI GIAN + LOẠI -->
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-if="activity.start_time || activity.end_time"
                class="text-xs font-semibold text-white/60"
              >
                {{ activity.start_time?.slice(0, 5) || "" }}

                <span v-if="activity.end_time"> - </span>

                {{ activity.end_time?.slice(0, 5) || "" }}
              </span>

              <span
                v-if="activity.activity_type"
                class="rounded-md bg-white/10 px-2 py-1 text-xs text-white/70"
              >
                {{ activity.activity_type }}
              </span>
            </div>

            <!-- TÊN -->
            <h4 class="mt-2 text-sm font-semibold text-white">
              {{ activity.title }}
            </h4>

            <!-- MÔ TẢ -->
            <p
              v-if="activity.description"
              class="mt-1 text-sm leading-5 text-white/70"
            >
              {{ activity.description }}
            </p>

            <!-- ĐỊA ĐIỂM -->
            <p v-if="activity.destination" class="mt-2 text-xs text-white/50">
              📍 {{ activity.destination.name }}
            </p>

            <!-- ĐỊA CHỈ -->
            <p
              v-if="activity.destination?.address"
              class="mt-1 text-xs text-white/40"
            >
              {{ activity.destination.address }}
            </p>

            <!-- PHƯƠNG TIỆN -->
            <p
              v-if="activity.transportation"
              class="mt-1 text-xs text-white/50"
            >
              🚗 {{ activity.transportation }}
            </p>

            <!-- CHI PHÍ -->
            <p
              v-if="activity.estimated_cost"
              class="mt-1 text-xs text-white/50"
            >
              💰
              {{ Number(activity.estimated_cost).toLocaleString("vi-VN") }}
              VNĐ
            </p>

            <!-- GHI CHÚ -->
            <p v-if="activity.note" class="mt-2 text-xs italic text-white/50">
              {{ activity.note }}
            </p>
          </div>
        </div>
      </div>

      <!-- KHÔNG CÓ LỊCH TRÌNH -->
      <div
        v-if="!props.itineraries.length"
        class="rounded-xl border border-white/10 bg-white/5 p-6 text-center"
      >
        <p class="text-sm text-white/60">Tour này chưa có lịch trình.</p>
      </div>

      <!-- NÚT XEM THÊM -->
      <div v-if="props.itineraries.length > 1" class="flex justify-center pt-2">
        <button
          type="button"
          @click="showAll = !showAll"
          class="rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {{ showAll ? "Thu gọn lịch trình ↑" : "Xem toàn bộ lịch trình ↓" }}
        </button>
      </div>
    </div>
  </section>
</template>
