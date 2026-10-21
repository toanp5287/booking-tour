<script setup>
import { ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import categoryService from "../../services/category.service";

const emit = defineEmits(["filter-change"]);

const selectedCategories = ref([]);
const selectedPrice = ref(null);
const selectedDurations = ref([]);

// 1. LẤY DANH MỤC TỪ API
const {
  data: categoryData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["categories"],
  queryFn: async () => {
    const res = await categoryService.getAll();
    return res.data.data || [];
  },
  staleTime: 1000 * 60 * 5,
});

// 2. DANH SÁCH TIÊU CHÍ
const priceOptions = [
  { label: "< 2 triệu", value: "under_2m" },
  { label: "2 – 5 triệu", value: "2m_5m" },
  { label: "5 – 10 triệu", value: "5m_10m" },
  { label: "> 10 triệu", value: "over_10m" },
];

const durationOptions = [
  { label: "1 – 2 ngày", value: "1-2" },
  { label: "3 – 4 ngày", value: "3-4" },
  { label: "5+ ngày", value: "5+" },
];

const toggleDuration = (val) => {
  const index = selectedDurations.value.indexOf(val);
  if (index > -1) {
    selectedDurations.value.splice(index, 1);
  } else {
    selectedDurations.value.push(val);
  }
};

const clearAllFilters = () => {
  selectedCategories.value = [];
  selectedPrice.value = null;
  selectedDurations.value = [];
};

// 3. TỰ ĐỘNG PHÁT DỮ LIỆU LỌC RA TRANG CHA
watch(
  [selectedCategories, selectedPrice, selectedDurations],
  () => {
    emit("filter-change", {
      categories: [...selectedCategories.value],
      price: selectedPrice.value,
      durations: [...selectedDurations.value],
    });
  },
  { deep: true },
);

defineExpose({ clearAllFilters });
</script>

<template>
  <aside class="tour-filter w-full">
    <div
      class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <!-- HEADER -->
      <div
        class="flex items-center justify-between border-b border-white/[0.06] pb-3.5"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-travel-ink"
            >Bộ lọc</span
          >
          <span
            v-if="
              selectedCategories.length ||
              selectedPrice ||
              selectedDurations.length
            "
            class="flex h-5 items-center justify-center rounded-full bg-travel-secondary-soft px-1.5 font-mono text-[10px] font-bold text-teal-800"
          >
            {{
              selectedCategories.length +
              (selectedPrice ? 1 : 0) +
              selectedDurations.length
            }}
          </span>
        </div>

        <button
          type="button"
          @click="clearAllFilters"
          class="min-h-9 px-2 text-xs text-slate-500 transition hover:text-travel-teal"
        >
          Đặt lại
        </button>
      </div>

      <!-- 1. LOẠI HÌNH TOUR -->
      <div class="mt-5">
        <span
          class="block text-[11px] font-bold uppercase tracking-wider text-travel-muted"
        >
          Loại hình tour
        </span>

        <!-- Skeleton -->
        <div v-if="isLoading" class="mt-3 space-y-2 animate-pulse">
          <div v-for="i in 4" :key="i" class="h-8 rounded-xl bg-white/5"></div>
        </div>

        <!-- Error -->
        <div
          v-else-if="isError"
          class="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700"
        >
          Không thể tải danh mục
        </div>

        <!-- Checkbox List -->
        <div v-else class="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
          <label
            v-for="cat in categoryData"
            :key="cat.id"
            class="flex min-h-10 cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-sm transition hover:bg-slate-50"
            :class="
              selectedCategories.includes(cat.id)
                ? 'bg-teal-50 font-semibold text-teal-800'
                : 'text-slate-700'
            "
          >
            <div class="flex items-center gap-2.5">
              <input
                v-model="selectedCategories"
                :value="cat.id"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 accent-teal-700"
              />
              <span>{{ cat.name }}</span>
            </div>

            <span class="font-mono text-xs text-slate-500">
              {{ cat.tour_count || 0 }}
            </span>
          </label>
        </div>
      </div>

      <div class="my-5 h-px bg-slate-100"></div>

      <!-- 2. KHOẢNG GIÁ (CHIP BUTTONS) -->
      <div>
        <span
          class="block text-[11px] font-bold uppercase tracking-wider text-travel-muted"
        >
          Khoảng giá
        </span>

        <div class="mt-3 grid grid-cols-2 gap-1.5">
          <button
            v-for="p in priceOptions"
            :key="p.value"
            type="button"
            @click="selectedPrice = selectedPrice === p.value ? null : p.value"
            class="rounded-xl border px-2.5 py-2 text-center text-xs font-medium transition"
            :class="
              selectedPrice === p.value
                ? 'border-teal-300 bg-teal-50 font-semibold text-teal-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-travel-blue'
            "
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="my-5 h-px bg-slate-100"></div>

      <!-- 3. THỜI GIAN ĐI (PILL BUTTONS) -->
      <div>
        <span
          class="block text-[11px] font-bold uppercase tracking-wider text-travel-muted"
        >
          Thời gian đi
        </span>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            v-for="d in durationOptions"
            :key="d.value"
            type="button"
            @click="toggleDuration(d.value)"
            class="rounded-xl border px-3 py-1.5 text-xs font-medium transition"
            :class="
              selectedDurations.includes(d.value)
                ? 'border-teal-300 bg-teal-50 font-semibold text-teal-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-travel-blue'
            "
          >
            {{ d.label }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.tour-filter :deep(> div) {
  border-color: var(--travel-border) !important;
  background-color: var(--travel-surface) !important;
  box-shadow: var(--shadow-card);
}

.tour-filter :deep([class*="bg-[#090b10"]),
.tour-filter :deep([class*="bg-white/"]) {
  background-color: #f8fafc !important;
}

.tour-filter :deep([class*="border-white/"]) {
  border-color: #e2e8f0 !important;
}

.tour-filter :deep(.text-white) {
  color: #1e293b !important;
}

.tour-filter :deep([class*="text-amber-200"]) {
  color: #0f766e !important;
}

.tour-filter :deep([class*="bg-amber-400/"]) {
  background-color: #e7f6f3 !important;
}

.tour-filter :deep([class*="border-amber-300/"]) {
  border-color: #bfdbfe !important;
}

.tour-filter :deep(input[type="checkbox"]) {
  accent-color: #2563eb;
}

.tour-filter :deep([class*="hover:bg-white/"]:hover) {
  background-color: #f8fafc !important;
}

.tour-filter :deep([class*="hover:text-white"]:hover) {
  color: #1e293b !important;
}
</style>
