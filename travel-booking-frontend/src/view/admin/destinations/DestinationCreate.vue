<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  UploadCloud,
  Check,
  MapPin,
  Clock,
  DollarSign,
  Compass,
  Sparkles,
  Navigation,
} from "lucide-vue-next";
import cattegoryService from "../../../services/category.service";
import destinationService from "../../../services/destination.service";
import { useQuery } from "@tanstack/vue-query";

const router = useRouter();

// ================= SWEETALERT2 DARK LUXURY =================
const showToast = (icon, title, text = "") => {
  return Swal.fire({
    icon,
    title,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#0c1016",
    color: "#ffffff",
    customClass: {
      popup: "border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl",
    },
  });
};

const showPopup = ({
  title,
  text,
  icon = "success",
  confirmText = "Đồng ý",
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    background: "#0c1016",
    color: "#ffffff",
    confirmButtonText: confirmText,
    confirmButtonColor: "#ffb36b",
    customClass: {
      popup:
        "rounded-[26px] border border-white/10 shadow-2xl backdrop-blur-xl",
      confirmButton: "!text-slate-900 !font-bold !px-6 !py-2.5 !rounded-xl",
    },
  });
};

// ================= FETCH DANH MỤC =================
const { data: categoriesData } = useQuery({
  queryKey: ["categoryAll"],
  queryFn: async () => {
    const res = await cattegoryService.getAll();
    return res.data.data;
  },
  staleTime: 1000 * 60 * 5,
});

// ================= FORM STATE (KHỚP BẢNG destinations) =================
const form = reactive({
  category_id: "",
  name: "",
  description: "",
  address: "",
  province: "",
  latitude: null,
  longitude: null,
  imageFile: null,
  imagePreview: null,
  estimated_visit_time: 120, // phút
  opening_time: "08:00",
  closing_time: "18:00",
  average_cost: 0,
  best_time: "Quanh năm",
  weather_note: "",
  age_suitable: "Mọi lứa tuổi",
  activity_types: [], // mảng tag chọn nhanh, khi gửi nối thành chuỗi
  status: "active",
});

// Các gợi ý tag hoạt động phổ biến
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

// Xử lý upload ảnh bìa
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    form.imageFile = file;
    form.imagePreview = URL.createObjectURL(file);
  }
};

// Lấy tọa độ GPS tự động qua trình duyệt
const isGettingLocation = ref(false);
const getCurrentGPS = () => {
  if (!navigator.geolocation) {
    showToast(
      "warning",
      "Không hỗ trợ",
      "Trình duyệt của bạn không hỗ trợ định vị GPS",
    );
    return;
  }
  isGettingLocation.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitude = parseFloat(pos.coords.latitude.toFixed(6));
      form.longitude = parseFloat(pos.coords.longitude.toFixed(6));
      isGettingLocation.value = false;
      showToast(
        "success",
        "Đã lấy tọa độ",
        `${form.latitude}, ${form.longitude}`,
      );
    },
    (err) => {
      isGettingLocation.value = false;
      showToast("error", "Lỗi GPS", "Không thể truy cập tọa độ GPS hiện tại.");
    },
    { timeout: 10000 },
  );
};

// ================= GỬI FORM =================
const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!form.name.trim()) {
    showToast("warning", "Thiếu tên địa điểm", "Vui lòng nhập tên điểm đến");
    return;
  }
  if (!form.province.trim()) {
    showToast("warning", "Thiếu khu vực", "Vui lòng nhập tỉnh / thành phố");
    return;
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();
    if (form.category_id) formData.append("category_id", form.category_id);
    formData.append("name", form.name.trim());
    formData.append("description", form.description || "");
    formData.append("address", form.address || "");
    formData.append("province", form.province.trim());

    if (form.latitude !== null && form.latitude !== "")
      formData.append("latitude", form.latitude);
    if (form.longitude !== null && form.longitude !== "")
      formData.append("longitude", form.longitude);

    if (form.estimated_visit_time)
      formData.append("estimated_visit_time", form.estimated_visit_time);

    // Format giờ Time(0) PostgreSQL

    if (form.opening_time) {
      formData.append("opening_time", form.opening_time); // "08:00"
    }
    if (form.closing_time) {
      formData.append("closing_time", form.closing_time); // "18:00"
    }

    formData.append("average_cost", form.average_cost || 0);
    formData.append("best_time", form.best_time || "");
    formData.append("weather_note", form.weather_note || "");
    formData.append("age_suitable", form.age_suitable || "Mọi lứa tuổi");
    formData.append("activity_types", form.activity_types.join(", "));
    formData.append("status", form.status);

    if (form.imageFile) {
      formData.append("image", form.imageFile);
    }

    // Gọi API
    if (
      destinationService &&
      typeof destinationService.createDestination === "function"
    ) {
      await destinationService.createDestination(formData);
    }

    await showPopup({
      title: "Thành công!",
      text: "Đã tạo mới địa điểm du lịch thành công.",
      icon: "success",
      confirmText: "Quay lại danh sách",
    });

    router.push("/admin/destinations");
  } catch (error) {
    console.error("Lỗi khi thêm điểm đến:", error);
    showToast(
      "error",
      "Thất bại!",
      error.response?.data?.message || "Không thể lưu điểm đến, hãy thử lại.",
    );
  } finally {
    isSubmitting.value = false;
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
        class="absolute left-[12%] top-[5%] h-[480px] w-[480px] rounded-full bg-orange-400/[0.045] blur-[160px]"
      ></div>
      <div
        class="absolute right-[8%] top-[30%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.035] blur-[170px]"
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
            <button
              type="button"
              @click="router.back()"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Quay lại"
            >
              <ArrowLeft :size="18" />
            </button>
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
                Destination Management
              </div>
              <h1
                class="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
              >
                Thêm điểm đến mới
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="router.back()"
              class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 rounded-xl bg-orange-300 px-6 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:opacity-50"
            >
              <Check :size="16" />
              <span>{{ isSubmitting ? "Đang lưu..." : "Lưu điểm đến" }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- ================= FORM CONTAINER ================= -->
      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- 1. THÔNG TIN ĐỊA DANH CƠ BẢN -->
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
                  Nhập tên địa danh, phân loại danh mục và địa chỉ thực tế
                </p>
              </div>
              <span class="text-xs font-mono text-white/30"
                >Bảng destinations</span
              >
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- Tên địa điểm -->
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Tên điểm đến (name) <span class="text-orange-300">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="VD: Quần thể Di tích Cố đô Huế"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- Danh mục -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Danh mục gắn liền (category_id)
                </label>
                <select
                  v-model="form.category_id"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
                >
                  <option value="">-- Chọn danh mục du lịch --</option>
                  <option v-for="c in categoriesData" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <!-- Tỉnh / Thành phố -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Tỉnh / Thành phố (province)
                  <span class="text-orange-300">*</span>
                </label>
                <input
                  v-model="form.province"
                  type="text"
                  required
                  placeholder="VD: Thừa Thiên Huế"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- Địa chỉ chi tiết -->
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Địa chỉ chi tiết (address)
                </label>
                <input
                  v-model="form.address"
                  type="text"
                  placeholder="VD: Đường 23/8, Phường Thuận Hòa, Thành phố Huế"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <!-- Mô tả địa điểm -->
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Mô tả chi tiết điểm đến (description)
                </label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  placeholder="Nhập giới thiệu lịch sử, bối cảnh, nét đẹp kiến trúc của điểm đến..."
                  class="w-full rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- 2. HÌNH ẢNH ĐIỂM ĐẾN -->
          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div class="mb-6 border-b border-white/[0.06] pb-4">
              <h2 class="text-base font-bold text-orange-200">
                2. Hình ảnh phong cảnh (image)
              </h2>
              <p class="mt-1 text-xs text-white/40">
                Tải lên hình ảnh đại diện tiêu biểu nhất cho danh lam này
              </p>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  class="flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-black/20 text-center transition hover:border-orange-300/40 hover:bg-white/[0.02]"
                >
                  <UploadCloud class="h-7 w-7 text-white/40 mb-2" />
                  <span class="text-xs font-semibold text-white/80"
                    >Chọn file ảnh điểm đến</span
                  >
                  <span class="mt-1 text-[11px] text-white/30"
                    >Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</span
                  >
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleImageChange"
                    class="hidden"
                  />
                </label>
              </div>

              <div class="flex items-center justify-center">
                <div
                  v-if="form.imagePreview"
                  class="relative h-44 w-full overflow-hidden rounded-2xl border border-white/10"
                >
                  <img
                    :src="form.imagePreview"
                    class="h-full w-full object-cover"
                  />
                  <span
                    class="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-orange-200"
                  >
                    Ảnh xem trước
                  </span>
                </div>
                <div
                  v-else
                  class="flex h-44 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs text-white/30"
                >
                  Khung hiển thị trước hình ảnh
                </div>
              </div>
            </div>
          </section>

          <!-- 3. TỌA ĐỘ ĐỊA LÝ GPS (LATITUDE & LONGITUDE) -->
          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div
              class="mb-6 flex flex-col justify-between gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center"
            >
              <div>
                <h2 class="text-base font-bold text-orange-200">
                  3. Tọa độ số hóa GPS (latitude &amp; longitude)
                </h2>
                <p class="mt-1 text-xs text-white/40">
                  Tọa độ chính xác phục vụ tính khoảng cách di chuyển và gợi ý
                  lộ trình tự động
                </p>
              </div>

              <button
                type="button"
                @click="getCurrentGPS"
                :disabled="isGettingLocation"
                class="inline-flex items-center gap-2 rounded-xl border border-orange-300/20 bg-orange-300/10 px-3.5 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-300/20"
              >
                <Navigation :size="14" />
                <span>{{
                  isGettingLocation ? "Đang dò GPS..." : "Lấy GPS hiện tại"
                }}</span>
              </button>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Vĩ độ (latitude: Decimal 10,7)
                </label>
                <input
                  v-model.number="form.latitude"
                  type="number"
                  step="0.000001"
                  placeholder="VD: 16.469722"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Kinh độ (longitude: Decimal 10,7)
                </label>
                <input
                  v-model.number="form.longitude"
                  type="number"
                  step="0.000001"
                  placeholder="VD: 107.579444"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
                />
              </div>
            </div>
          </section>

          <!-- 4. THỜI GIAN VẬN HÀNH & CHI PHÍ -->
          <section
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div class="mb-6 border-b border-white/[0.06] pb-4">
              <h2 class="text-base font-bold text-orange-200">
                4. Khung giờ &amp; Chi phí ước tính
              </h2>
              <p class="mt-1 text-xs text-white/40">
                Giờ mở/đóng cửa và mức chi phí bình quân cho mỗi lượt khách
              </p>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Giờ mở cửa -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Giờ mở cửa (opening_time)
                </label>
                <input
                  v-model="form.opening_time"
                  type="time"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Giờ đóng cửa -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Giờ đóng cửa (closing_time)
                </label>
                <input
                  v-model="form.closing_time"
                  type="time"
                  class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Thời gian tham quan ước tính -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Thời lượng tham quan (phút)
                </label>
                <input
                  v-model.number="form.estimated_visit_time"
                  type="number"
                  min="10"
                  step="10"
                  placeholder="120"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <!-- Chi phí bình quân -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Chi phí trung bình (VNĐ)
                </label>
                <input
                  v-model.number="form.average_cost"
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="100000"
                  class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-orange-200 outline-none focus:border-orange-300/40"
                />
              </div>
            </div>
          </section>

          <!-- 5. ĐẶC TÍNH AI & KHUYẾN NGHỊ -->
          <section
            class="rounded-[26px] border border-purple-300/15 bg-purple-300/[0.025] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div
              class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
            >
              <div>
                <h2
                  class="flex items-center gap-2 text-base font-bold text-purple-200"
                >
                  <Sparkles :size="16" />
                  <span>5. Dữ liệu chuẩn hóa TravelGo AI</span>
                </h2>
                <p class="mt-1 text-xs text-white/40">
                  Thuộc tính dùng cho AI gợi ý điểm đến theo sở thích, nhóm
                  khách và thời tiết
                </p>
              </div>
              <span
                class="rounded-full bg-purple-300/10 px-3 py-1 text-[10px] font-bold text-purple-200"
              >
                AI FEATURES
              </span>
            </div>

            <div class="space-y-6">
              <!-- Loại hình hoạt động -->
              <div>
                <label class="mb-2 block text-xs font-semibold text-white/70">
                  Loại hình hoạt động (activity_types - Click chọn nhanh)
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
                <!-- Mùa lý tưởng -->
                <div>
                  <label class="mb-2 block text-xs font-semibold text-white/70">
                    Thời điểm lý tưởng nhất (best_time)
                  </label>
                  <input
                    v-model="form.best_time"
                    type="text"
                    placeholder="VD: Tháng 3 - Tháng 8"
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white outline-none focus:border-purple-300/40"
                  />
                </div>

                <!-- Lứa tuổi thích hợp -->
                <div>
                  <label class="mb-2 block text-xs font-semibold text-white/70">
                    Độ tuổi phù hợp (age_suitable)
                  </label>
                  <input
                    v-model="form.age_suitable"
                    type="text"
                    placeholder="VD: Mọi lứa tuổi / Thanh niên"
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white outline-none focus:border-purple-300/40"
                  />
                </div>

                <!-- Ghi chú thời tiết -->
                <div class="md:col-span-2">
                  <label class="mb-2 block text-xs font-semibold text-white/70">
                    Lưu ý về thời tiết &amp; khí hậu (weather_note)
                  </label>
                  <input
                    v-model="form.weather_note"
                    type="text"
                    placeholder="VD: Nắng nhiều vào buổi trưa, nên chuẩn bị nón và nước lọc..."
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white outline-none focus:border-purple-300/40"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- 6. TRẠNG THÁI & LƯU -->
          <div
            class="flex flex-col justify-between gap-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"
          >
            <div class="flex items-center gap-4">
              <label class="text-xs font-semibold text-white/70">
                Trạng thái hiển thị (status):
              </label>
              <select
                v-model="form.status"
                class="h-11 rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs font-semibold text-orange-200 outline-none focus:border-orange-300/40"
              >
                <option value="active">● Đang hoạt động (active)</option>
                <option value="inactive">○ Tạm ẩn (inactive)</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="router.back()"
                class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-xl bg-orange-300 px-7 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:opacity-50"
              >
                {{ isSubmitting ? "Đang lưu điểm đến..." : "Tạo điểm đến mới" }}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>
