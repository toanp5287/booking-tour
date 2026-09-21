<script setup>
import { ref, computed, watch, reactive } from "vue";

import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";

import cattegoryService from "../../../services/category.service";
import destinationService from "../../../services/destination.service";
import Swal from "sweetalert2";
const route = useRoute();
const router = useRouter();

const id = route.params.id;

// ======================================================
// CATEGORY
// ======================================================

const { data: categoriesData } = useQuery({
  queryKey: ["categoryAll"],
  queryFn: async () => {
    const res = await cattegoryService.getAll();
    return res.data.data;
  },
  staleTime: 1000 * 60 * 5,
});

// ======================================================
// DESTINATION DETAIL
// ======================================================

const {
  data: destinationDetail,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["destinationDetail", id],

  queryFn: async () => {
    const res = await destinationService.getDetail(id);
    return res.data.data;
  },
});

// ======================================================
// FORM
// ======================================================

const form = reactive({
  name: "",
  category_id: "",
  province: "",
  address: "",
  description: "",

  latitude: null,
  longitude: null,

  opening_time: "08:00",
  closing_time: "18:00",

  estimated_visit_time: 120,
  average_cost: 0,

  activity_types: [],

  best_time: "",
  age_suitable: "Mọi lứa tuổi",
  weather_note: "",

  status: "active",

  existingImage: null,
  imageFile: null,
  imagePreview: null,
});

// ======================================================
// FORMAT TIME
// ======================================================

const formatTimeToInput = (timeStr) => {
  if (!timeStr) return "08:00";

  if (typeof timeStr === "string" && timeStr.includes("T")) {
    return timeStr.split("T")[1].substring(0, 5);
  }

  return timeStr.substring(0, 5);
};

// ======================================================
// ACTIVITY
// ======================================================

const availableActivities = [
  "Tham quan",
  "Di sản",
  "Văn hóa",
  "Lịch sử",
  "Biển đảo",
  "Núi non",
  "Trekking",
  "Ẩm thực",
  "Nghỉ dưỡng",
  "Chụp ảnh",
  "Tâm linh",
  "Thám hiểm",
];

const toggleActivity = (act) => {
  const index = form.activity_types.indexOf(act);

  if (index > -1) {
    form.activity_types.splice(index, 1);
  } else {
    form.activity_types.push(act);
  }
};

// ======================================================
// LOAD DATA
// ======================================================

watch(
  destinationDetail,
  (detail) => {
    if (!detail) return;

    form.name = detail.name || "";

    form.category_id = detail.category_id ? String(detail.category_id) : "";

    form.province = detail.province || "";
    form.address = detail.address || "";
    form.description = detail.description || "";

    form.latitude = detail.latitude ? Number(detail.latitude) : null;

    form.longitude = detail.longitude ? Number(detail.longitude) : null;

    form.opening_time = formatTimeToInput(detail.opening_time);

    form.closing_time = formatTimeToInput(detail.closing_time);

    form.estimated_visit_time = detail.estimated_visit_time || 120;

    form.average_cost = detail.average_cost ? Number(detail.average_cost) : 0;

    form.activity_types = detail.activity_types
      ? detail.activity_types.split(",").map((item) => item.trim())
      : [];

    form.best_time = detail.best_time || "";

    form.age_suitable = detail.age_suitable || "Mọi lứa tuổi";

    form.weather_note = detail.weather_note || "";

    form.status = detail.status || "active";

    form.existingImage = detail.image || null;
  },
  {
    immediate: true,
  },
);

const handeUpdate = async () => {
  const isConfirm = await Swal.fire({
    title: "Xác nhận cập nhật?",
    text: "Bạn có chắc muốn cập nhật địa điểm này không?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Cập nhật",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#64748b",
  });

  if (!isConfirm.isConfirmed) return;

  try {
    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("category_id", form.category_id);
    formData.append("province", form.province);
    formData.append("address", form.address);
    formData.append("description", form.description);
    formData.append("latitude", form.latitude);
    formData.append("longitude", form.longitude);
    formData.append("estimated_visit_time", form.estimated_visit_time);
    formData.append("opening_time", form.opening_time);
    formData.append("closing_time", form.closing_time);
    formData.append("average_cost", form.average_cost);
    formData.append("best_time", form.best_time);
    formData.append("weather_note", form.weather_note);
    formData.append("age_suitable", form.age_suitable);
    formData.append("activity_types", form.activity_types.join(", "));
    formData.append("status", form.status);

    if (form.imageFile) {
      formData.append("image", form.imageFile);
    }

    const result = await destinationService.updateDestination(id, formData);

    if (result) {
      await Swal.fire({
        title: "Cập nhật thành công!",
        text: "Địa điểm đã được cập nhật.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });

      router.push("/admin/destinations");
    } else {
      Swal.fire({
        title: "Cập nhật thất bại!",
        text: "Không thể cập nhật địa điểm.",
        icon: "error",
        confirmButtonText: "Thử lại",
        confirmButtonColor: "#ef4444",
      });
    }
  } catch (error) {
    console.error(error);

    Swal.fire({
      title: "Có lỗi xảy ra!",
      text: "Không thể kết nối đến máy chủ.",
      icon: "error",
      confirmButtonText: "Đóng",
      confirmButtonColor: "#ef4444",
    });
  }
};
</script>

<template>
  <!-- ====================================================== -->
  <!-- LOADING -->
  <!-- ====================================================== -->

  <div
    v-if="isLoading"
    class="flex min-h-screen items-center justify-center bg-[#07090d] text-white"
  >
    <div class="text-sm text-white/60">Đang tải dữ liệu địa điểm...</div>
  </div>

  <!-- ====================================================== -->
  <!-- ERROR -->
  <!-- ====================================================== -->

  <div
    v-else-if="isError"
    class="flex min-h-screen items-center justify-center bg-[#07090d] text-white"
  >
    <div class="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
      <p class="font-semibold text-red-300">Không thể tải dữ liệu địa điểm.</p>

      <p class="mt-2 text-sm text-white/50">
        {{ error?.message }}
      </p>

      <button
        type="button"
        @click="goBack"
        class="mt-4 rounded-xl bg-orange-300 px-5 py-2 text-xs font-bold text-slate-900"
      >
        Quay lại
      </button>
    </div>
  </div>

  <!-- ====================================================== -->
  <!-- MAIN -->
  <!-- ====================================================== -->

  <div
    v-else-if="destinationDetail"
    class="min-h-screen bg-[#07090d] font-sans text-white antialiased"
  >
    <!-- BACKGROUND -->

    <div class="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        class="h-full w-full object-cover opacity-[0.06]"
        alt=""
      />

      <div class="absolute inset-0 bg-[#07090d]/95"></div>

      <div
        class="absolute left-[12%] top-[5%] h-[480px] w-[480px] rounded-full bg-orange-400/[0.045] blur-[160px]"
      ></div>

      <div
        class="absolute right-[8%] top-[30%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.035] blur-[170px]"
      ></div>
    </div>

    <!-- MAIN -->

    <div class="flex min-h-screen w-full flex-col items-center">
      <!-- ================================================== -->
      <!-- HEADER -->
      <!-- ================================================== -->

      <header
        class="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090d]/85 backdrop-blur-2xl"
      >
        <div
          class="mx-auto flex h-[80px] max-w-[1500px] items-center justify-between px-5 sm:px-8"
        >
          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="goBack"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Quay lại danh sách"
            >
              ←
            </button>

            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>

                Chỉnh sửa điểm đến #{{ id }}
              </div>

              <h1
                class="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
              >
                Cập nhật: {{ form.name }}
              </h1>
            </div>
          </div>

          <button
            type="button"
            @click="handeUpdate"
            :disabled="isSubmitting"
            class="rounded-xl bg-orange-300 px-6 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSubmitting ? "Đang cập nhật..." : "✓ Cập nhật thay đổi" }}
          </button>
        </div>
      </header>

      <!-- ================================================== -->
      <!-- FORM -->
      <!-- ================================================== -->

      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <form
          @submit.prevent="handleSubmit"
          enctype="multipart/form-data"
          class="space-y-8"
        >
          <!-- ================================================= -->
          <!-- 1. THÔNG TIN CƠ BẢN -->
          <!-- ================================================= -->

          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div
              class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
            >
              <div>
                <h2 class="text-base font-bold text-orange-200">
                  1. Thông tin địa danh
                </h2>

                <p class="mt-1 text-xs text-white/40">
                  Cập nhật tên địa danh, phân loại danh mục và địa chỉ
                </p>
              </div>

              <span class="font-mono text-xs text-white/30">
                Model: destinations
              </span>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- NAME -->

              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Tên điểm đến
                  <span class="text-orange-300">*</span>
                </label>

                <input
                  v-model="form.name"
                  name="name"
                  type="text"
                  required
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- CATEGORY -->

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Danh mục gắn liền
                </label>

                <select
                  v-model="form.category_id"
                  name="category_id"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
                >
                  <option value="">-- Chọn danh mục --</option>

                  <option
                    v-for="value in categoriesData || []"
                    :key="value.id"
                    :value="String(value.id)"
                  >
                    {{ value.name }}
                  </option>
                </select>
              </div>

              <!-- PROVINCE -->

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Tỉnh / Thành phố
                  <span class="text-orange-300">*</span>
                </label>

                <input
                  v-model="form.province"
                  name="province"
                  type="text"
                  required
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- ADDRESS -->

              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Địa chỉ chi tiết
                </label>

                <input
                  v-model="form.address"
                  name="address"
                  type="text"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- DESCRIPTION -->

              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Mô tả chi tiết điểm đến
                </label>

                <textarea
                  v-model="form.description"
                  name="description"
                  rows="4"
                  class="w-full rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- ================================================= -->
          <!-- 2. HÌNH ẢNH -->
          <!-- ================================================= -->

          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div class="mb-6 border-b border-white/[0.06] pb-4">
              <h2 class="text-base font-bold text-orange-200">
                2. Hình ảnh phong cảnh
              </h2>

              <p class="mt-1 text-xs text-white/40">
                Chọn ảnh mới nếu muốn thay ảnh hiện tại
              </p>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- FILE -->

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Tải ảnh mới
                </label>

                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  @change="handleImageChange"
                  class="block w-full text-xs text-white/40 file:mr-4 file:rounded-xl file:border file:border-orange-300/20 file:bg-orange-300/10 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-orange-200 hover:file:bg-orange-300/20"
                />

                <p class="mt-2 text-[11px] text-white/30">
                  JPG, PNG, WEBP — tối đa 5MB
                </p>
              </div>

              <!-- PREVIEW -->

              <div class="flex items-center justify-center">
                <div
                  class="relative h-44 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                >
                  <img
                    :src="imageUrl"
                    :alt="form.name"
                    class="h-full w-full object-cover"
                  />

                  <span
                    class="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-orange-200"
                  >
                    {{ imagePreview ? "Ảnh mới" : "Ảnh hiện tại" }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- ================================================= -->
          <!-- 3. GPS -->
          <!-- ================================================= -->

          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div
              class="mb-6 flex flex-col justify-between gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center"
            >
              <div>
                <h2 class="text-base font-bold text-orange-200">
                  3. Tọa độ GPS
                </h2>

                <p class="mt-1 text-xs text-white/40">
                  Tọa độ phục vụ tính toán lộ trình
                </p>
              </div>

              <div class="font-mono text-xs text-orange-200/80">
                GPS:
                {{ form.latitude }}° N, {{ form.longitude }}° E
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Vĩ độ (latitude)
                </label>

                <input
                  v-model.number="form.latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Kinh độ (longitude)
                </label>

                <input
                  v-model.number="form.longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm text-white outline-none focus:border-orange-300/40"
                />
              </div>
            </div>
          </section>

          <!-- ================================================= -->
          <!-- 4. THỜI GIAN + CHI PHÍ -->
          <!-- ================================================= -->

          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div class="mb-6 border-b border-white/[0.06] pb-4">
              <h2 class="text-base font-bold text-orange-200">
                4. Khung giờ & Chi phí
              </h2>

              <p class="mt-1 text-xs text-white/40">
                Giờ mở/đóng cửa và chi phí tham quan
              </p>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Giờ mở cửa
                </label>

                <input
                  v-model="form.opening_time"
                  name="opening_time"
                  type="time"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Giờ đóng cửa
                </label>

                <input
                  v-model="form.closing_time"
                  name="closing_time"
                  type="time"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Thời lượng tham quan (phút)
                </label>

                <input
                  v-model.number="form.estimated_visit_time"
                  name="estimated_visit_time"
                  type="number"
                  min="10"
                  step="10"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Chi phí trung bình (VNĐ)
                </label>

                <input
                  v-model.number="form.average_cost"
                  name="average_cost"
                  type="number"
                  min="0"
                  step="10000"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-orange-200 outline-none focus:border-orange-300/40"
                />
              </div>
            </div>
          </section>

          <!-- ================================================= -->
          <!-- 5. AI -->
          <!-- ================================================= -->

          <section
            class="rounded-[26px] border border-purple-300/15 bg-purple-300/[0.025] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div
              class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
            >
              <div>
                <h2 class="text-base font-bold text-purple-200">
                  5. Dữ liệu TravelGo AI
                </h2>

                <p class="mt-1 text-xs text-white/40">
                  Dữ liệu phục vụ AI gợi ý
                </p>
              </div>

              <span
                class="rounded-full bg-purple-300/10 px-3 py-1 text-[10px] font-bold text-purple-200"
              >
                AI FEATURES
              </span>
            </div>

            <div class="space-y-6">
              <!-- ACTIVITY -->

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Loại hình hoạt động
                </label>

                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="act in availableActivities"
                    :key="act"
                    type="button"
                    @click="toggleActivity(act)"
                    :class="[
                      'rounded-xl border px-3 py-1.5 text-xs font-medium transition',

                      form.activity_types.includes(act)
                        ? 'border-purple-300/40 bg-purple-300/20 text-purple-200'
                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white',
                    ]"
                  >
                    {{ act }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <!-- BEST TIME -->

                <div>
                  <label class="mb-2 block text-xs font-semibold text-white/70">
                    Thời điểm lý tưởng nhất
                  </label>

                  <input
                    v-model="form.best_time"
                    name="best_time"
                    type="text"
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white outline-none focus:border-purple-300/40"
                  />
                </div>

                <!-- AGE -->

                <div>
                  <label class="mb-2 block text-xs font-semibold text-white/70">
                    Độ tuổi phù hợp
                  </label>

                  <input
                    v-model="form.age_suitable"
                    name="age_suitable"
                    type="text"
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white outline-none focus:border-purple-300/40"
                  />
                </div>

                <!-- WEATHER -->

                <div class="md:col-span-2">
                  <label class="mb-2 block text-xs font-semibold text-white/70">
                    Lưu ý về thời tiết & khí hậu
                  </label>

                  <input
                    v-model="form.weather_note"
                    name="weather_note"
                    type="text"
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white outline-none focus:border-purple-300/40"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- ================================================= -->
          <!-- 6. STATUS -->
          <!-- ================================================= -->

          <section
            class="flex flex-col justify-between gap-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"
          >
            <div class="flex items-center gap-4">
              <label class="text-xs font-semibold text-white/70">
                Trạng thái:
              </label>

              <select
                v-model="form.status"
                name="status"
                class="h-11 rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs font-semibold text-orange-200 outline-none focus:border-orange-300/40"
              >
                <option value="active">● Đang hoạt động (active)</option>

                <option value="inactive">○ Tạm ẩn (inactive)</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="goBack"
                class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Hủy
              </button>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-xl bg-orange-300 px-7 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ isSubmitting ? "Đang cập nhật..." : "✓ Cập nhật điểm đến" }}
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  </div>
</template>
