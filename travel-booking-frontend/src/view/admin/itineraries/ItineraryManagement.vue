<script setup>
import { ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import tourService from "../../../services/tour.service";
import destinationService from "../../../services/destination.service";
const router = useRouter();
const route = useRoute();
import Swal from "sweetalert2";

// 1. Biến cục bộ lưu tour đang chọn, khởi tạo từ URL nếu có
const selectedTourId = ref(
  route.query.tourId ? String(route.query.tourId) : "",
);

/* =========================
   LẤY DANH SÁCH TOUR
========================= */
const { data: dataTour, isLoading } = useQuery({
  queryKey: ["tours"],
  queryFn: async () => {
    const response = await tourService.getAll();
    const tours = response.data.data || [];

    // CHỈ gán tour đầu tiên nếu cả URL VÀ biến selectedTourId đều đang trống
    if (!selectedTourId.value && tours.length > 0) {
      const firstId = String(tours[0].id);
      selectedTourId.value = firstId;
      router.replace({
        query: { ...route.query, tourId: firstId },
      });
    }

    return tours;
  },
  staleTime: 1000 * 60 * 5, // Tránh fetch đi fetch lại làm reset state
});

/* =========================
   LẮNG NGHE ĐỔI TRÊN URL (F5, bấm Back/Forward)
========================= */
watch(
  () => route.query.tourId,
  (newId) => {
    if (newId && String(newId) !== selectedTourId.value) {
      selectedTourId.value = String(newId);
    }
  },
);

/* =========================
   HÀM ĐỔI TOUR TỪ SELECT
========================= */
const changeTour = (e) => {
  const newId = String(e?.target?.value || "");

  router.replace({
    query: {
      ...route.query,
      tourId: newId,
    },
  });
};

/* =========================
   LẤY LỊCH TRÌNH THEO SELECTED ID
========================= */
watch(
  () => dataTour.value,
  (tours) => {
    if (tours?.length && !route.query.tourId) {
      router.replace({
        query: {
          ...route.query,
          tourId: String(tours[0].id),
        },
      });
    }
  },
  { immediate: true },
);
const tourId = computed(() => route.query.tourId);
const {
  data: tourItinerary,
  isLoading: isLoadingItinerary,
  isFetching: isFetchingItinerary,
} = useQuery({
  queryKey: ["tourItinerary", tourId],

  queryFn: async () => {
    const res = await tourService.getTourItinerary(tourId.value);

    return res.data?.data || [];
  },

  enabled: computed(() => !!tourId.value),
});

const selectedTour = computed(() => {
  if (!dataTour.value || !selectedTourId.value) return null;
  return (
    dataTour.value.find((t) => String(t.id) === String(selectedTourId.value)) ||
    null
  );
});
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "0 ₫";
  }

  return Number(value).toLocaleString("vi-VN") + " ₫";
};
const formatTime = (value) => {
  if (!value) return "--:--";

  const date = new Date(value);

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
const hanldeDelete = async (id) => {
  const result = await Swal.fire({
    title: "Xác nhận đưa vào thùng rác?",
    text: "Hoạt động này sẽ được đưa vào thùng rác.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Đưa vào thùng rác",
    cancelButtonText: "Hủy",
    reverseButtons: true,

    background: "#0c1016",
    color: "#ffffff",

    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#374151",

    customClass: {
      popup: "rounded-2xl",
      confirmButton: "rounded-xl px-4 py-2",
      cancelButton: "rounded-xl px-4 py-2",
    },
  });

  if (!result.isConfirmed) return;

  try {
    const response = await destinationService.deleteActivities(id);

    if (response) {
      await Swal.fire({
        title: "Đã đưa vào thùng rác!",
        text: "Hoạt động đã được xóa mềm thành công.",
        icon: "success",
        confirmButtonText: "Đóng",

        background: "#0c1016",
        color: "#ffffff",
        confirmButtonColor: "#fbbf24",

        customClass: {
          popup: "rounded-2xl",
          confirmButton: "rounded-xl px-5 py-2",
        },
      });
    } else {
      await Swal.fire({
        title: "Xóa thất bại!",
        text: "Không thể đưa hoạt động vào thùng rác.",
        icon: "error",
        confirmButtonText: "Đóng",

        background: "#0c1016",
        color: "#ffffff",
        confirmButtonColor: "#ef4444",

        customClass: {
          popup: "rounded-2xl",
          confirmButton: "rounded-xl px-5 py-2",
        },
      });
    }
  } catch (error) {
    console.error("DELETE ERROR:", error);

    await Swal.fire({
      title: "Có lỗi xảy ra!",
      text: error?.response?.data?.message || "Không thể kết nối đến máy chủ.",
      icon: "error",
      confirmButtonText: "Đóng",

      background: "#0c1016",
      color: "#ffffff",
      confirmButtonColor: "#ef4444",

      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl px-5 py-2",
      },
    });
  }
};
</script>
<template>
  <div class="min-h-screen bg-[#07090d] px-4 py-6 text-white sm:px-6 lg:px-8">
    <!-- HEADER -->
    <div
      class="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
    >
      <div>
        <div class="mb-2 flex items-center gap-2">
          <span
            class="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300"
          >
            Tour Itinerary
          </span>

          <span class="text-xs text-white/30">/</span>

          <span class="text-xs text-white/40"> Quản lý lịch trình </span>
        </div>

        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
          Lịch trình tour
        </h1>

        <p class="mt-1 text-sm text-white/40">
          Quản lý các hoạt động theo từng ngày của tour.
        </p>
      </div>

      <!-- CHỌN TOUR -->
      <div class="w-full lg:w-[380px]">
        <label
          class="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/40"
        >
          Chọn tour
        </label>

        <select
          :value="route.query.tourId"
          @change="changeTour"
          class="w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-300/40 focus:ring-2 focus:ring-orange-300/10"
        >
          <option
            v-for="value in dataTour || []"
            :key="value.id"
            :value="String(value.id)"
          >
            {{ value.name }}
            ({{ value.duration_days }}N{{ value.duration_nights }}Đ)
          </option>
        </select>
      </div>
    </div>

    <!-- CONTENT -->
    <div
      class="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0c1016] shadow-2xl"
    >
      <!-- GLOW -->
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-300/10 blur-[100px]"
      ></div>

      <div
        class="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-[100px]"
      ></div>

      <div class="relative p-5 sm:p-7">
        <!-- KHÔNG CÓ LỊCH TRÌNH -->
        <div
          v-if="!tourItinerary || tourItinerary.length === 0"
          class="flex min-h-[300px] flex-col items-center justify-center text-center"
        >
          <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl"
          >
            📅
          </div>

          <h3 class="text-lg font-bold">Chưa có lịch trình</h3>

          <p class="mt-2 max-w-md text-sm text-white/40">
            Tour này hiện chưa có lịch trình hoặc chưa có hoạt động nào.
          </p>
        </div>

        <!-- DANH SÁCH LỊCH TRÌNH -->
        <div v-else class="space-y-6">
          <div
            v-for="value in tourItinerary"
            :key="value.id || value.day_number"
            class="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
          >
            <!-- HEADER NGÀY -->
            <div
              class="flex flex-col justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center"
            >
              <div class="flex items-center gap-4">
                <!-- SỐ NGÀY -->
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-300 text-lg font-black text-slate-900 shadow-lg shadow-orange-300/10"
                >
                  {{ value.day_number }}
                </div>

                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-bold">
                      {{ value.title || `Ngày ${value.day_number}` }}
                    </h2>

                    <span
                      class="rounded-full border border-orange-300/20 bg-orange-300/10 px-2.5 py-1 text-[10px] font-bold text-orange-300"
                    >
                      Ngày {{ value.day_number }}
                    </span>
                  </div>

                  <p
                    v-if="value.description"
                    class="mt-1 text-xs text-white/40"
                  >
                    {{ value.description }}
                  </p>
                </div>
              </div>

              <!-- THÊM HOẠT ĐỘNG -->
              <RouterLink
                :to="`createItineraries/${value.id}`"
                class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-300/20 bg-orange-300/10 px-4 py-2.5 text-xs font-bold text-orange-300 transition hover:border-orange-300/40 hover:bg-orange-300/20"
              >
                <span class="text-base leading-none"> + </span>

                <span> Thêm hoạt động </span>
              </RouterLink>
            </div>

            <!-- ACTIVITIES -->
            <div class="p-5">
              <!-- CHƯA CÓ HOẠT ĐỘNG -->
              <div
                v-if="!value.activities || value.activities.length === 0"
                class="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-10 text-center"
              >
                <div class="text-2xl">🗺️</div>

                <p class="mt-2 text-sm font-semibold text-white/60">
                  Chưa có hoạt động
                </p>

                <p class="mt-1 text-xs text-white/30">
                  Hãy thêm hoạt động cho ngày này.
                </p>
              </div>

              <!-- CÓ HOẠT ĐỘNG -->
              <div
                v-else
                class="relative space-y-4 before:absolute before:bottom-3 before:left-[19px] before:top-3 before:w-[2px] before:bg-white/[0.08]"
              >
                <div
                  v-for="activity in value.activities"
                  :key="activity.id || activity.visit_order"
                  class="relative flex items-start gap-4 pl-1"
                >
                  <!-- SỐ THỨ TỰ -->
                  <div
                    class="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-300/20 bg-[#0c1016] text-xs font-bold text-orange-300 shadow-lg"
                  >
                    {{ activity.visit_order }}
                  </div>

                  <!-- ACTIVITY -->
                  <div
                    class="flex-1 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-white/15"
                  >
                    <div
                      class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
                    >
                      <!-- TÊN + ĐỊA ĐIỂM -->
                      <div>
                        <h3 class="text-sm font-bold text-white">
                          {{ activity.title || "Hoạt động" }}
                        </h3>

                        <div
                          v-if="activity.destination?.name"
                          class="mt-1 flex items-center gap-1.5 text-xs text-white/40"
                        >
                          <span class="text-orange-300/70"> 📍 </span>

                          <span>
                            {{ activity.destination.name }}
                          </span>
                        </div>
                      </div>

                      <!-- THỜI GIAN + NÚT -->
                      <div class="flex items-center gap-2">
                        <!-- THỜI GIAN -->
                        <div
                          class="flex items-center gap-1.5 text-xs font-mono text-orange-200/80"
                        >
                          <span class="text-white/30"> ⏱ </span>

                          <span>
                            {{ formatTime(activity.start_time) }} -
                            {{ formatTime(activity.end_time) }}
                          </span>
                        </div>

                        <!-- NÚT SỬA -->
                        <button
                          type="button"
                          class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-400/[0.08] px-2.5 text-[11px] font-semibold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-400/[0.15] hover:text-blue-200"
                        >
                          ✏️

                          <span> Sửa </span>
                        </button>

                        <!-- NÚT XÓA -->
                        <button
                          @click="hanldeDelete(activity.id)"
                          type="button"
                          class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/[0.08] px-2.5 text-[11px] font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-400/[0.15] hover:text-red-200"
                        >
                          🗑️

                          <span> Xóa </span>
                        </button>
                      </div>
                    </div>

                    <!-- DESCRIPTION -->
                    <p
                      v-if="activity.description"
                      class="mt-3 text-sm leading-6 text-white/50"
                    >
                      {{ activity.description }}
                    </p>

                    <!-- THÔNG TIN -->
                    <div class="mt-4 flex flex-wrap items-center gap-2">
                      <!-- LOẠI HOẠT ĐỘNG -->
                      <span
                        v-if="activity.activity_type"
                        class="rounded-lg border border-purple-400/10 bg-purple-400/[0.06] px-2.5 py-1 text-[10px] font-semibold text-purple-300"
                      >
                        {{ activity.activity_type }}
                      </span>

                      <!-- PHƯƠNG TIỆN -->
                      <span
                        v-if="activity.transportation"
                        class="rounded-lg border border-blue-400/10 bg-blue-400/[0.06] px-2.5 py-1 text-[10px] font-semibold text-blue-300"
                      >
                        🚗 {{ activity.transportation }}
                      </span>

                      <!-- CHI PHÍ -->
                      <span
                        v-if="
                          activity.estimated_cost !== null &&
                          activity.estimated_cost !== undefined
                        "
                        class="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-semibold text-emerald-300"
                      >
                        💰
                        {{
                          Number(activity.estimated_cost).toLocaleString(
                            "vi-VN",
                          )
                        }}
                        đ
                      </span>
                    </div>

                    <!-- GHI CHÚ -->
                    <div
                      v-if="activity.note"
                      class="mt-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <p class="text-xs text-white/40">
                        <span class="font-semibold text-white/60">
                          Ghi chú:
                        </span>

                        {{ activity.note }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
