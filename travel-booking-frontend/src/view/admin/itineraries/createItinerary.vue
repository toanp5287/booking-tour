<script setup>
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import destinationService from "../../../services/destination.service";
import { computed, reactive, watch } from "vue";
import Swal from "sweetalert2";
const route = useRoute();
const router = useRouter();
const idActive = route.params.itineraryId;
const { data: dataItineraryDetail } = useQuery({
  queryKey: ["itineraryDetail", idActive],
  queryFn: async () => {
    const res = await destinationService.getActivities(idActive);
    return res.data.data;
  },
});
const visit_order = computed(
  () => (dataItineraryDetail.value || []).map((x) => x.visit_order),
  { itinerary: true },
);

watch(
  () => dataItineraryDetail.value,
  (data) => {
    if (data) {
      const orders = data
        .map((x) => Number(x.visit_order))
        .filter((x) => !isNaN(x));

      from.visit_order = orders.length > 0 ? Math.max(...orders) + 1 : 1;
    }
  },
  { immediate: true },
);
const {
  data: destinationData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["destinations"],
  queryFn: async () => {
    const res = await destinationService.getAll();
    return res.data.destination || res.data.data || [];
  },
  staleTime: 1000 * 60 * 5,
});
watch(
  () => destinationData.value,
  (data) => {
    if (data?.length && !from.destination_id) {
      from.destination_id = data[0].id;
    }
  },
  { immediate: true },
);
// loai hinh hoat dong

const activity_type = reactive([
  "tham quan",
  "ẩm thực",
  "nghỉ dưỡng",
  "di sản & văn hoá",
  "biểm đảo",
]);

// phuong tien

const transportation = reactive([
  "xe du lịch ",
  "đi bộ",
  "cáp treo",
  "cano tàu thuỷ",
  "xe điện",
  "tự do ",
]);

const from = reactive({
  destination_id: null,
  start_time: "08:30",
  end_time: "11:00",
  title: "",
  description: "",
  activity_type: activity_type[0],

  visit_order: null,
  transportation: transportation[0],
  estimated_cost: 0,

  note: "",
});

const hanldeCreate = async () => {
  const result = await Swal.fire({
    title: "Xác nhận thêm hoạt động?",
    text: "Hoạt động sẽ được thêm vào lịch trình này.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Thêm hoạt động",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#fdba74",
    cancelButtonColor: "#374151",
    reverseButtons: true,
    background: "#0c1016",
    color: "#fff",
  });

  if (!result.isConfirmed) return;

  try {
    const payload = {
      itinerary_id: idActive,

      activities: [
        {
          destination_id: from.destination_id,
          start_time: from.start_time,
          end_time: from.end_time,
          title: from.title,
          description: from.description,
          activity_type: from.activity_type,
          visit_order: from.visit_order,
          transportation: from.transportation,
          estimated_cost: from.estimated_cost,
          note: from.note,
        },
      ],
    };

    const response = await destinationService.createActivities(payload);

    if (response?.data?.success) {
      await Swal.fire({
        title: "Thành công!",
        text: "Đã thêm hoạt động vào lịch trình.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#fdba74",
        background: "#0c1016",
        color: "#fff",
      });

      router.push("/admin/itineraries");
    } else {
      Swal.fire({
        title: "Thêm thất bại!",
        text: response?.data?.message || "Không thể thêm hoạt động.",
        icon: "error",
        confirmButtonText: "Đóng",
        confirmButtonColor: "#ef4444",
        background: "#0c1016",
        color: "#fff",
      });
    }
  } catch (error) {
    Swal.fire({
      title: "Có lỗi xảy ra!",
      text: error?.response?.data?.message || "Không thể kết nối đến máy chủ.",
      icon: "error",
      confirmButtonText: "Đóng",
      confirmButtonColor: "#ef4444",
      background: "#0c1016",
      color: "#fff",
    });
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- ================= BACKGROUND GLOWS ================= -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        class="h-full w-full object-cover opacity-[0.06]"
        alt=""
      />
      <div class="absolute inset-0 bg-[#07090d]/95"></div>
      <div
        class="absolute left-[10%] top-[4%] h-[480px] w-[480px] rounded-full bg-orange-400/[0.045] blur-[160px]"
      ></div>
      <div
        class="absolute right-[8%] top-[25%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.035] blur-[170px]"
      ></div>
    </div>

    <!-- ================= MAIN WRAPPER (CENTERED) ================= -->
    <div class="w-full min-h-screen flex flex-col items-center">
      <!-- HEADER BAR -->
      <header
        class="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090d]/85 backdrop-blur-2xl"
      >
        <div
          class="mx-auto flex h-[80px] max-w-[1500px] items-center justify-between px-5 sm:px-8"
        >
          <div class="flex items-center gap-4">
            <a
              href="itineraries.html"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Quay lại"
            >
              ←
            </a>
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
                Itinerary Activity
              </div>
              <h1
                class="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
              >
                Thêm hoạt động mới vào lịch trình
                {{ dataItineraryDetail?.itinerary?.title }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="itineraries.html"
              class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Hủy bỏ
            </a>
            <button
              type="submit"
              form="addActivityForm"
              class="rounded-xl bg-orange-300 px-6 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400"
            >
              ✓ Lưu hoạt động
            </button>
          </div>
        </div>
      </header>

      <!-- ================= FORM CONTAINER ================= -->
      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <form
          id="addActivityForm"
          @submit.prevent="hanldeCreate"
          method="POST"
          class="space-y-8"
        >
          <!-- 1. THÔNG TIN HOẠT ĐỘNG & NGÀY ÁP DỤNG -->
          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div
              class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
            >
              <div>
                <h2 class="text-base font-bold text-orange-200">
                  1. Chi tiết kế hoạch hoạt động
                </h2>
                <p class="mt-1 text-xs text-white/40">
                  Gắn hoạt động vào ngày lịch trình thuộc tour và đặt tên trải
                  nghiệm
                </p>
              </div>
              <span class="text-xs font-mono text-white/30"
                >Model: itinerary_activities</span
              >
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- Thứ tự ghé thăm -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Thứ tự hoạt động trong ngày (visit_order)
                  <span class="text-orange-300">*</span>
                </label>
                <div class="mt-4">
                  <p
                    class="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60"
                  >
                    Các hoạt động đã có
                  </p>

                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="value in visit_order"
                      :key="value"
                      class="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-orange-400/20 bg-orange-400/10 px-3 text-sm font-bold text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-400/20"
                    >
                      {{ value }}
                    </span>
                  </div>
                </div>

                <input
                  v-model="from.visit_order"
                  name="visit_order"
                  type="number"
                  min="1"
                  required
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Tên hoạt động -->
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Tên hoạt động (title) <span class="text-orange-300">*</span>
                </label>
                <input
                  v-model="from.title"
                  name="title"
                  type="text"
                  required
                  placeholder="VD: Viếng Chùa Linh Ứng - Tượng Phật Bà Quan Âm 67m"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- Điểm đến liên kết -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Điểm đến liên kết (destination_id)
                </label>
                <select
                  v-model="from.destination_id"
                  name="destination_id"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/80 outline-none focus:border-orange-300/40"
                >
                  <option
                    v-for="value in destinationData"
                    :key="value.id"
                    :value="value.id"
                  >
                    {{ value.name }}
                  </option>
                </select>
              </div>

              <!-- Loại hoạt động -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Loại hoạt động (activity_type)
                </label>
                <select
                  v-model="from.activity_type"
                  name="activity_type"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/80 outline-none focus:border-orange-300/40"
                >
                  <option
                    v-for="value in activity_type"
                    :key="value"
                    :value="value"
                    selected
                  >
                    {{ value }}
                  </option>
                </select>
              </div>

              <!-- Mô tả hoạt động -->
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Mô tả nội dung chi tiết (description)
                </label>
                <textarea
                  v-model="from.description"
                  name="description"
                  rows="3"
                  placeholder="Giới thiệu cụ thể trải nghiệm của du khách trong hoạt động này..."
                  class="w-full rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- 2. THỜI GIAN, PHƯƠNG TIỆN & CHI PHÍ -->
          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div class="mb-6 border-b border-white/[0.06] pb-4">
              <h2 class="text-base font-bold text-orange-200">
                2. Vận hành &amp; Chi phí ước tính
              </h2>
              <p class="mt-1 text-xs text-white/40">
                Khung giờ thực hiện (HH:mm), phương tiện di chuyển và dự trù
                ngân sách
              </p>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Giờ bắt đầu -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Giờ bắt đầu (start_time)
                </label>
                <input
                  v-model="from.start_time"
                  name="start_time"
                  type="time"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Giờ kết thúc -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Giờ kết thúc (end_time)
                </label>
                <input
                  v-model="from.end_time"
                  name="end_time"
                  type="time"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Phương tiện -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Phương tiện (transportation)
                </label>
                <select
                  v-model="from.transportation"
                  name="transportation"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                >
                  <option
                    v-for="value in transportation"
                    :key="value"
                    :value="value"
                  >
                    {{ value }}
                  </option>
                </select>
              </div>

              <!-- Chi phí dự tính -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Chi phí dự tính (estimated_cost - VNĐ)
                </label>
                <input
                  v-model="from.estimated_cost"
                  name="estimated_cost"
                  type="number"
                  min="0"
                  step="10000"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm font-semibold text-orange-200 outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Ghi chú cho du khách -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Ghi chú lưu ý cho du khách (note)
                </label>
                <input
                  v-model="from.note"
                  name="note"
                  type="text"
                  placeholder="VD: Trang phục lịch sự khi viếng chùa, mang theo áo khoác mỏng..."
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>
            </div>
          </section>

          <!-- 3. ACTION BUTTONS -->
          <div
            class="flex items-center justify-end gap-3 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
          >
            <a
              href="itineraries.html"
              class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Hủy bỏ
            </a>
            <button
              type="submit"
              class="rounded-xl bg-orange-300 px-7 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400"
            >
              ✓ Thêm hoạt động vào lịch trình
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>
