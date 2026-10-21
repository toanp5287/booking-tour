<script setup>
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import tourService from "../../services/tour.service";

const props = defineProps({
  shearch: {
    type: String,
    default: "",
  },
});

const {
  data: dataTour,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: ["tours"],
  queryFn: async () => {
    const response = await tourService.getAll();
    return response.data.data || [];
  },
});

// Lọc dữ liệu an toàn dựa trên từ khóa tìm kiếm
const filteredTours = computed(() => {
  const tours = dataTour.value || [];
  const keyword = props.shearch?.trim().toLowerCase();

  if (!keyword) return tours;

  return tours.filter((tour) => {
    const nameMatch = tour.name?.toLowerCase().includes(keyword);
    const descMatch = tour.description?.toLowerCase().includes(keyword);
    const slugMatch = tour.slug?.toLowerCase().includes(keyword);
    const transportMatch = tour.transportation?.toLowerCase().includes(keyword);
    return nameMatch || descMatch || slugMatch || transportMatch;
  });
});
</script>

<template>
  <div class="tour-card-list space-y-6">
    <!-- THANH THỐNG KÊ KẾT QUẢ KHI CÓ TỪ KHÓA TÌM KIẾM -->
    <div
      v-if="props.shearch && props.shearch.trim() && !isLoading && !isError"
      class="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e121a] px-4 py-2.5 text-xs text-slate-300"
    >
      <div class="flex items-center gap-2">
        <span class="text-amber-200/70">🔍</span>
        <span>Kết quả cho:</span>
        <strong class="text-amber-200 font-semibold"
          >"{{ props.shearch.trim() }}"</strong
        >
      </div>
      <span class="font-mono text-slate-400">
        Tìm thấy
        <strong class="text-slate-200">{{ filteredTours.length }}</strong> tour
      </span>
    </div>

    <!-- SKELETON LOADING -->
    <div v-if="isLoading" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="animate-pulse rounded-2xl border border-white/[0.05] bg-[#0e121a] p-4"
      >
        <div class="h-52 rounded-xl bg-white/[0.03]"></div>
        <div class="mt-4 h-4 w-2/3 rounded bg-white/[0.03]"></div>
        <div class="mt-2 h-3 w-1/2 rounded bg-white/[0.03]"></div>
        <div class="mt-5 flex items-center justify-between">
          <div class="h-5 w-24 rounded bg-white/[0.03]"></div>
          <div class="h-8 w-16 rounded bg-white/[0.03]"></div>
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 p-12 text-center text-xs text-rose-300/90"
    >
      <p class="font-medium">
        Không thể tải danh sách tour. Vui lòng thử lại sau.
      </p>
      <button
        type="button"
        @click="refetch"
        class="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-1.5 text-xs text-rose-200 transition hover:bg-rose-400/20"
      >
        Tải lại
      </button>
    </div>

    <!-- EMPTY STATE KHI KHÔNG CÓ KẾT QUẢ PHÙ HỢP -->
    <div
      v-else-if="filteredTours.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0e121a] py-16 text-center"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-xl text-amber-200/70"
      >
        🧭
      </div>
      <h3 class="mt-4 text-sm font-semibold text-slate-200">
        Không tìm thấy tour phù hợp
      </h3>
      <p class="mt-1.5 max-w-sm text-xs text-slate-400">
        <span v-if="props.shearch && props.shearch.trim()">
          Không có kết quả nào khớp với từ khóa "{{ props.shearch.trim() }}".
          Hãy thử tìm theo địa danh khác như Đà Lạt, Sa Pa, Hạ Long...
        </span>
        <span v-else>
          Hiện chưa có chuyến đi nào được mở bán trong danh mục này.
        </span>
      </p>
    </div>

    <!-- TOUR GRID KHI CÓ DỮ LIỆU -->
    <div v-else class="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="value in filteredTours"
        :key="value.id"
        class="travel-surface-interactive group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-[transform,border-color,box-shadow] duration-200"
      >
        <!-- IMAGE WRAPPER -->
        <div class="tour-card-image relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            :src="
              value.thumbnail
                ? `http://localhost:8080/${value.thumbnail.replaceAll('\\', '/')}`
                : '/default-tour.jpg'
            "
            :alt="value.name"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          <div
            class="absolute inset-0 bg-gradient-to-t from-[#0e121a] via-black/20 to-black/30"
          ></div>

          <!-- BADGES TRÊN ẢNH -->
          <div
            class="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between"
          >
            <span
              class="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-travel-blue/90 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-travel-orange"></span>
              Nổi bật
            </span>

            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-travel-blue/80 text-white transition hover:bg-travel-blue active:scale-[0.98]"
              title="Lưu tour"
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
                  stroke-width="1.6"
                  d="M20.8 8.6c0 5.5-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.6A4.6 4.6 0 0112 5.9a4.6 4.6 0 018.8 2.7z"
                />
              </svg>
            </button>
          </div>

          <!-- ĐÁNH GIÁ & VỊ TRÍ GÓC DƯỚI -->
          <div
            class="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-slate-300"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-amber-200/70">📍</span>
              <span class="text-slate-200 truncate max-w-[160px]">
                {{ value.transportation || "Xe du lịch" }}
              </span>
            </div>

            <div class="flex items-center gap-1 rounded-md bg-travel-blue/85 px-2 py-0.5 font-mono text-travel-orange">
              <span class="text-[10px]">★</span>
              <span class="font-semibold">4.9</span>
            </div>
          </div>
        </div>

        <!-- CONTENT -->
        <div class="flex flex-1 flex-col p-4 sm:p-5">
          <!-- TAGS THỜI GIAN / SỐ KHÁCH -->
          <div class="flex items-center gap-2 text-[11px] text-slate-400">
            <span
            class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5"
            >
              {{
                value.duration_days
                  ? `${value.duration_days}N${value.duration_nights || 0}Đ`
                  : "3N2Đ"
              }}
            </span>
            <span
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5"
            >
              Tối đa {{ value.max_people || 25 }} khách
            </span>
          </div>

          <!-- TÊN TOUR -->
          <h3
            class="mt-3 line-clamp-2 min-h-10 text-base font-semibold leading-snug text-travel-ink transition-colors group-hover:text-travel-teal"
          >
            {{ value.name }}
          </h3>

          <!-- MÔ TẢ NGẮN -->
          <p class="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-travel-muted">
            {{
              value.description ||
              "Hành trình trọn gói khám phá danh lam thắng cảnh với dịch vụ chu đáo và linh hoạt."
            }}
          </p>

          <!-- FOOTER: GIÁ & NÚT CHI TIẾT -->
          <div
            class="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4"
          >
            <div>
              <span class="block text-[10px] text-slate-500"> mỗi khách</span>
              <p class="mt-0.5 font-mono text-base font-bold text-travel-blue">
                {{ Number(value.price || 0).toLocaleString("vi-VN") }}₫
              </p>
            </div>

            <RouterLink
              :to="`/tours/${value.id}`"
              class="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-travel-blue bg-white px-3 text-xs font-semibold text-travel-blue transition hover:bg-travel-blue hover:text-white focus-visible:outline-offset-2"
            >
              <span>Chi tiết</span>
              <span class="text-[11px]">→</span>
            </RouterLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.tour-card-list :deep(article) {
  border-color: var(--travel-border);
  background-color: var(--travel-surface);
  box-shadow: var(--shadow-card);
}

.tour-card-list :deep(article:hover) {
  border-color: #cbd5e1;
  box-shadow: var(--travel-shadow-hover);
}

.tour-card-list :deep(article h3) {
  color: var(--travel-ink);
}

.tour-card-list :deep(article:hover h3) {
  color: var(--travel-secondary);
}

.tour-card-list :deep(.tour-card-image [class*="text-white"]),
.tour-card-list :deep(.tour-card-image [class*="text-slate-200"]),
.tour-card-list :deep(.tour-card-image [class*="text-slate-300"]) {
  color: #ffffff !important;
}

.tour-card-list :deep(article .tour-card-image [class*="bg-[#07090d]"]) {
  background-color: rgba(23, 43, 77, 0.86);
}
</style>
