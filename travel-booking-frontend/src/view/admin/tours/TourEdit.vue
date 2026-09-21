<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import tourService from "../../../services/tour.service.js";
import Swal from "sweetalert2";

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const tourId = route.params.id;

// ================= STATE FORM DỮ LIỆU TOUR =================
const form = ref({
  name: "",
  slug: "",
  category_id: "",
  operator_id: "",
  // === 3 LOẠI GIÁ VÉ THEO SCHEMA PRISMA MỚI ===
  price: 0, // Người lớn
  child_price: null, // Trẻ em (5 - 11 tuổi)
  infant_price: 0, // Em bé (< 5 tuổi)
  duration_days: 1,
  duration_nights: 0,
  max_people: 30,
  difficulty_level: "Dễ",
  transportation: "Xe du lịch",
  description: "",
  status: "active",
  thumbnail_preview: "",
  existing_gallery: [],
  schedules: [],
  destinations: [],
  itineraries: [],
});

const thumbnailFile = ref(null);
const galleryFiles = ref([]);

// ================= 1. LẤY DỮ LIỆU TOUR HIỆN TẠI =================
const { data: tourData, isLoading } = useQuery({
  queryKey: ["tourDetailEdit", tourId],
  queryFn: async () => {
    const res = await tourService.getOne(tourId);
    return res.data.data;
  },
  staleTime: 0,
});

// Đồng bộ dữ liệu tour vào form khi API trả về
watch(
  tourData,
  (data) => {
    if (data) {
      form.value = {
        name: data.name || "",
        slug: data.slug || "",
        category_id: data.category_id
          ? data.category_id.toString()
          : data.category?.id?.toString() || "1",
        operator_id: data.operator_id ? data.operator_id.toString() : "1",
        price: Number(data.price) || 0,
        child_price:
          data.child_price !== null && data.child_price !== undefined
            ? Number(data.child_price)
            : null,
        infant_price: Number(data.infant_price) || 0,
        duration_days: Number(data.duration_days) || 1,
        duration_nights: Number(data.duration_nights) || 0,
        max_people: Number(data.max_people) || 30,
        difficulty_level: data.difficulty_level || "Dễ",
        transportation: data.transportation || "Xe du lịch",
        description: data.description || "",
        status: data.status || "active",
        thumbnail_preview: data.thumbnail
          ? `http://localhost:8080/${data.thumbnail.replaceAll("\\", "/")}`
          : "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
        existing_gallery: data.gallery_images || [],
        schedules: (data.schedules || []).map((s) => ({
          id: s.id,
          departure_date: s.departure_date ? s.departure_date.slice(0, 10) : "",
          departure_time: s.departure_time
            ? s.departure_time.slice(0, 5)
            : "08:00",
          return_date: s.return_date ? s.return_date.slice(0, 10) : "",
          return_time: s.return_time ? s.return_time.slice(0, 5) : "17:00",
          total_slots: s.total_slots || 30,
          status: s.status || "open",
        })),
        destinations: (data.tour_destinations || []).map((d) => ({
          destination_id: d.destination_id?.toString() || "",
          day_number: d.day_number || 1,
          visit_order: d.visit_order || 1,
        })),
        itineraries: (data.itineraries || []).map((it) => ({
          id: it.id,
          day_number: it.day_number,
          title: it.title,
          description: it.description || "",
          activities: (it.activities || []).map((act) => ({
            id: act.id,
            title: act.title,
            destination_id: act.destination_id
              ? act.destination_id.toString()
              : "",
            start_time: act.start_time ? act.start_time.slice(0, 5) : "08:00",
            end_time: act.end_time ? act.end_time.slice(0, 5) : "10:00",
            visit_order: act.visit_order || 1,
            activity_type: act.activity_type || "Tham quan",
            transportation: act.transportation || "Xe du lịch",
            estimated_cost: Number(act.estimated_cost) || 0,
            note: act.note || "",
          })),
        })),
      };
    }
  },
  { immediate: true },
);

// Tự tạo slug theo tên
const generateSlug = () => {
  form.value.slug = form.value.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ================= 2. QUẢN LÝ ẢNH =================
const handleThumbnailChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    thumbnailFile.value = file;
    form.value.thumbnail_preview = URL.createObjectURL(file);
  }
};

const handleGalleryChange = (e) => {
  galleryFiles.value = Array.from(e.target.files);
};

const removeExistingImage = (index) => {
  form.value.existing_gallery.splice(index, 1);
};

// ================= 3. THAO TÁC SCHEDULES =================
const addSchedule = () => {
  form.value.schedules.push({
    departure_date: "",
    departure_time: "08:00",
    return_date: "",
    return_time: "17:00",
    total_slots: 30,
    status: "open",
  });
};

const removeSchedule = (index) => {
  form.value.schedules.splice(index, 1);
};

// ================= 4. THAO TÁC ĐIỂM ĐẾN (DESTINATIONS) =================
const addDestination = () => {
  form.value.destinations.push({
    destination_id: "",
    day_number: 1,
    visit_order: form.value.destinations.length + 1,
  });
};

const removeDestination = (index) => {
  form.value.destinations.splice(index, 1);
};

// ================= 5. THAO TÁC LỊCH TRÌNH (ITINERARIES) =================
const addItineraryDay = () => {
  const nextDay = form.value.itineraries.length + 1;
  form.value.itineraries.push({
    day_number: nextDay,
    title: `Khám phá Ngày ${nextDay}`,
    description: "",
    activities: [],
  });
};

const removeItineraryDay = (index) => {
  form.value.itineraries.splice(index, 1);
  form.value.itineraries.forEach((it, idx) => {
    it.day_number = idx + 1;
  });
};

const addActivity = (dayIndex) => {
  const acts = form.value.itineraries[dayIndex].activities;
  acts.push({
    title: "",
    destination_id: "",
    start_time: "08:00",
    end_time: "10:00",
    visit_order: acts.length + 1,
    activity_type: "Tham quan",
    transportation: "Xe du lịch",
    estimated_cost: 0,
    note: "",
  });
};

const removeActivity = (dayIndex, actIndex) => {
  form.value.itineraries[dayIndex].activities.splice(actIndex, 1);
};

// ================= 6. SUBMIT FORM =================
const isSubmitting = ref(false);

const handleUpdateTour = async () => {
  if (!form.value.name.trim() || !form.value.price) {
    Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin!",
      text: "Vui lòng nhập tên tour và giá vé người lớn.",
    });
    return;
  }

  try {
    isSubmitting.value = true;
    const formData = new FormData();

    formData.append("name", form.value.name);
    formData.append("slug", form.value.slug);
    formData.append("category_id", form.value.category_id);
    formData.append("operator_id", form.value.operator_id);

    // Dữ liệu 3 loại vé
    formData.append("price", form.value.price);
    if (form.value.child_price !== null && form.value.child_price !== "") {
      formData.append("child_price", form.value.child_price);
    } else {
      formData.append("child_price", "");
    }
    formData.append("infant_price", form.value.infant_price || 0);

    formData.append("duration_days", form.value.duration_days);
    formData.append("duration_nights", form.value.duration_nights);
    formData.append("max_people", form.value.max_people);
    formData.append("difficulty_level", form.value.difficulty_level);
    formData.append("transportation", form.value.transportation);
    formData.append("description", form.value.description);
    formData.append("status", form.value.status);

    // Mảng liên kết đã parse JSON
    formData.append("schedules", JSON.stringify(form.value.schedules));
    formData.append("destinations", JSON.stringify(form.value.destinations));
    formData.append("itineraries", JSON.stringify(form.value.itineraries));

    // File đính kèm
    if (thumbnailFile.value) {
      formData.append("thumbnail", thumbnailFile.value);
    }
    galleryFiles.value.forEach((file) => {
      formData.append("tour_images", file);
    });

    // Gọi API update (hỗ trợ cả tourService.update hoặc tourService.updateTour)
    if (typeof tourService.update === "function") {
      await tourService.update(tourId, formData);
    } else {
      await tourService.updateTour(tourId, formData);
    }

    await Swal.fire({
      icon: "success",
      title: "Cập nhật thành công!",
      text: "Thông tin tour và biểu giá đã được lưu vào hệ thống.",
      timer: 1500,
      showConfirmButton: false,
    });

    queryClient.invalidateQueries({ queryKey: ["tours"] });
    queryClient.invalidateQueries({ queryKey: ["tourDetail", tourId] });
    router.push(`/admin/tours/${tourId}`);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Cập nhật thất bại",
      text: error.response?.data?.message || "Đã xảy ra lỗi khi lưu tour.",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- BACKGROUND GLOWS -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        class="h-full w-full object-cover opacity-[0.08]"
        alt=""
      />
      <div class="absolute inset-0 bg-[#07090d]/95"></div>
      <div
        class="absolute left-[10%] top-[5%] h-[450px] w-[450px] rounded-full bg-orange-400/[0.05] blur-[150px]"
      ></div>
      <div
        class="absolute right-[5%] top-[30%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.035] blur-[160px]"
      ></div>
    </div>

    <!-- MAIN CONTAINER -->
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- HEADER BAR -->
      <header
        class="mb-8 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center"
      >
        <div class="flex items-center gap-4">
          <button
            type="button"
            @click="router.back()"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            title="Quay lại"
          >
            ←
          </button>
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
              Chỉnh sửa Tour #{{ tourId }}
            </div>
            <h1
              class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl truncate max-w-xl"
            >
              {{ form.name || "Đang tải dữ liệu tour..." }}
            </h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <RouterLink
            :to="`/admin/tours/${tourId}`"
            class="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            Hủy bỏ
          </RouterLink>
          <button
            type="button"
            :disabled="isSubmitting"
            @click="handleUpdateTour"
            class="rounded-xl bg-orange-300 px-6 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:opacity-50"
          >
            {{ isSubmitting ? "Đang lưu..." : "✓ Cập nhật tour" }}
          </button>
        </div>
      </header>

      <div v-if="isLoading" class="py-20 text-center text-sm text-white/40">
        Đang nạp dữ liệu chi tiết tour...
      </div>

      <!-- FORM BODY -->
      <form v-else @submit.prevent="handleUpdateTour" class="space-y-8">
        <!-- 1. THÔNG TIN CHUNG & BIỂU GIÁ PHÂN LOẠI -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 class="mb-5 text-base font-bold text-orange-200">
            1. Thông tin chung & Biểu giá phân loại
          </h2>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Tên tour -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Tên tour (name) <span class="text-orange-300">*</span>
              </label>
              <input
                v-model="form.name"
                @input="generateSlug"
                type="text"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
              />
            </div>

            <!-- Slug -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Slug (URL) <span class="text-orange-300">*</span>
              </label>
              <input
                v-model="form.slug"
                type="text"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-xs text-orange-200/80 outline-none"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Danh mục <span class="text-orange-300">*</span>
              </label>
              <select
                v-model="form.category_id"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
              >
                <option value="1">Tour biển đảo cao cấp</option>
                <option value="2">Khám phá di sản &amp; văn hóa</option>
                <option value="3">Nghỉ dưỡng sinh thái</option>
                <option value="4">Tour phượt &amp; mạo hiểm</option>
              </select>
            </div>

            <!-- Operator -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Đơn vị tổ chức <span class="text-orange-300">*</span>
              </label>
              <select
                v-model="form.operator_id"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
              >
                <option value="1">TravelGo Signature Operations</option>
                <option value="2">Đà Nẵng Heritage Travel</option>
                <option value="3">Saigon Tourist Partner</option>
              </select>
            </div>

            <!-- KHỐI 3 LOẠI VÉ -->
            <div
              class="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <p
                class="text-xs font-bold uppercase tracking-wider text-orange-300/90 mb-3"
              >
                Biểu giá phân loại vé (Prisma Schema mới)
              </p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <!-- Vé người lớn -->
                <div>
                  <label class="mb-1 block text-xs font-semibold text-white/80">
                    Vé Người lớn (VNĐ) <span class="text-orange-300">*</span>
                  </label>
                  <input
                    v-model.number="form.price"
                    type="number"
                    min="0"
                    step="10000"
                    required
                    class="h-10 w-full rounded-xl border border-white/15 bg-[#0c1016] px-3 text-sm font-bold text-white outline-none focus:border-orange-300"
                  />
                  <span class="text-[10px] text-white/40"
                    >Giá chuẩn cho khách ≥ 12 tuổi</span
                  >
                </div>

                <!-- Vé trẻ em -->
                <div>
                  <label
                    class="mb-1 block text-xs font-semibold text-orange-300/90"
                  >
                    Vé Trẻ em (5 - 11 tuổi)
                  </label>
                  <input
                    v-model.number="form.child_price"
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="Chưa cấu hình"
                    class="h-10 w-full rounded-xl border border-orange-400/30 bg-[#0c1016] px-3 text-sm font-semibold text-orange-300 outline-none focus:border-orange-300"
                  />
                  <span class="text-[10px] text-white/40"
                    >Để trống nếu áp dụng giá người lớn</span
                  >
                </div>

                <!-- Vé em bé -->
                <div>
                  <label class="mb-1 block text-xs font-semibold text-white/80">
                    Vé Em bé (&lt; 5 tuổi)
                  </label>
                  <input
                    v-model.number="form.infant_price"
                    type="number"
                    min="0"
                    step="10000"
                    class="h-10 w-full rounded-xl border border-white/15 bg-[#0c1016] px-3 text-sm text-white/90 outline-none focus:border-orange-300"
                  />
                  <span class="text-[10px] text-white/40"
                    >Nhập 0 nếu miễn phí vé</span
                  >
                </div>
              </div>
            </div>

            <!-- Số ngày -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số ngày (duration_days) <span class="text-orange-300">*</span>
              </label>
              <input
                v-model.number="form.duration_days"
                type="number"
                min="1"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-orange-200 outline-none"
              />
            </div>

            <!-- Số đêm -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số đêm (duration_nights) <span class="text-orange-300">*</span>
              </label>
              <input
                v-model.number="form.duration_nights"
                type="number"
                min="0"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none"
              />
            </div>

            <!-- Số người tối đa -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số khách tối đa <span class="text-orange-300">*</span>
              </label>
              <input
                v-model.number="form.max_people"
                type="number"
                min="1"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none"
              />
            </div>

            <!-- Độ khó -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70"
                >Độ khó</label
              >
              <select
                v-model="form.difficulty_level"
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none"
              >
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thử thách">Thử thách</option>
              </select>
            </div>

            <!-- Phương tiện -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70"
                >Phương tiện chính</label
              >
              <input
                v-model="form.transportation"
                type="text"
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none"
              />
            </div>

            <!-- Mô tả tour -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70"
                >Mô tả tour</label
              >
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- 2. HÌNH ẢNH TOUR -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 class="mb-5 text-base font-bold text-orange-200">
            2. Hình ảnh tour
          </h2>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Thay đổi ảnh đại diện (Thumbnail mới)
              </label>
              <input
                type="file"
                accept="image/*"
                @change="handleThumbnailChange"
                class="block w-full text-xs text-white/40 file:mr-4 file:rounded-xl file:border file:border-orange-300/20 file:bg-orange-300/10 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-orange-200 hover:file:bg-orange-300/20"
              />
              <p class="mt-2 text-[11px] text-white/30">
                Nếu không chọn file mới, hệ thống sẽ tự động giữ lại ảnh bìa cũ
              </p>
            </div>

            <div class="flex items-center justify-center">
              <div
                class="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10"
              >
                <img
                  :src="form.thumbnail_preview"
                  alt="Ảnh xem trước"
                  class="h-full w-full object-cover"
                />
                <span
                  class="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-orange-200"
                >
                  Ảnh bìa
                </span>
              </div>
            </div>

            <!-- Upload thêm ảnh phụ -->
            <div class="border-t border-white/[0.06] pt-4 md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Thêm ảnh chi tiết vào bộ sưu tập (tour_images)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                @change="handleGalleryChange"
                class="block w-full text-xs text-white/40 file:mr-4 file:rounded-xl file:border file:border-white/15 file:bg-white/5 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white/80 hover:file:bg-white/10"
              />

              <!-- Danh sách ảnh cũ trong database -->
              <div
                v-if="form.existing_gallery.length"
                class="mt-4 flex flex-wrap gap-3"
              >
                <div
                  v-for="(img, idx) in form.existing_gallery"
                  :key="idx"
                  class="group relative h-20 w-28 overflow-hidden rounded-xl border border-white/10"
                >
                  <img
                    :src="`http://localhost:8080/${img.image_url?.replaceAll('\\', '/')}`"
                    class="h-full w-full object-cover"
                    alt=""
                  />
                  <button
                    type="button"
                    @click="removeExistingImage(idx)"
                    class="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600/80 text-[10px] text-white opacity-0 transition group-hover:opacity-100 flex items-center justify-center"
                    title="Xóa ảnh này"
                  >
                    ✕
                  </button>
                  <span
                    class="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] text-white/70"
                  >
                    Ảnh #{{ idx + 1 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. ĐỢT KHỞI HÀNH (TOUR_SCHEDULES) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-orange-200">
                3. Đợt khởi hành (Model: tour_schedules)
              </h2>
              <p class="text-xs text-white/40">
                Quản lý ngày khởi hành và số lượng chỗ trống
              </p>
            </div>
            <button
              type="button"
              @click="addSchedule"
              class="rounded-xl border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-bold text-orange-200 hover:bg-orange-300/20"
            >
              + Thêm đợt đi
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(s, index) in form.schedules"
              :key="index"
              class="rounded-2xl border border-white/5 bg-black/30 p-5"
            >
              <div
                class="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-3"
              >
                <span
                  class="text-xs font-bold uppercase tracking-wider text-orange-300/90"
                >
                  Lịch khởi hành #{{ index + 1 }}
                  {{ s.id ? `(ID: ${s.id})` : "(Mới thêm)" }}
                </span>
                <button
                  type="button"
                  @click="removeSchedule(index)"
                  class="text-xs text-rose-400 hover:underline"
                >
                  Xóa đợt này
                </button>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Ngày đi *</label
                  >
                  <input
                    v-model="s.departure_date"
                    type="date"
                    required
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Giờ đi *</label
                  >
                  <input
                    v-model="s.departure_time"
                    type="time"
                    required
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Ngày về</label
                  >
                  <input
                    v-model="s.return_date"
                    type="date"
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Giờ về</label
                  >
                  <input
                    v-model="s.return_time"
                    type="time"
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Tổng chỗ *</label
                  >
                  <input
                    v-model.number="s.total_slots"
                    type="number"
                    min="1"
                    required
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Trạng thái</label
                  >
                  <select
                    v-model="s.status"
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white/70 outline-none"
                  >
                    <option value="open">Đang mở</option>
                    <option value="full">Đã đủ chỗ</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. ĐIỂM ĐẾN TRONG TOUR (TOUR_DESTINATIONS) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-orange-200">
                4. Điểm đến trong tour (Model: tour_destinations)
              </h2>
              <p class="text-xs text-white/40">
                Thứ tự danh lam thắng cảnh được ghé thăm trong chuyến đi
              </p>
            </div>
            <button
              type="button"
              @click="addDestination"
              class="rounded-xl border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-bold text-orange-200 hover:bg-orange-300/20"
            >
              + Thêm điểm đến
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(d, dIndex) in form.destinations"
              :key="dIndex"
              class="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/30 p-4 sm:flex-row sm:items-center"
            >
              <div class="flex-1">
                <label class="mb-1 block text-[11px] text-white/40"
                  >Địa danh ID *</label
                >
                <input
                  v-model="d.destination_id"
                  type="text"
                  placeholder="Nhập ID địa danh (VD: 1, 2)"
                  required
                  class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div class="w-full sm:w-36">
                <label class="mb-1 block text-[11px] text-white/40"
                  >Ghé ngày thứ</label
                >
                <input
                  v-model.number="d.day_number"
                  type="number"
                  min="1"
                  class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                />
              </div>

              <div class="w-full sm:w-28">
                <label class="mb-1 block text-[11px] text-white/40"
                  >Thứ tự ghé</label
                >
                <input
                  v-model.number="d.visit_order"
                  type="number"
                  min="1"
                  class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                />
              </div>

              <button
                type="button"
                @click="removeDestination(dIndex)"
                class="self-end sm:self-center text-xs text-rose-400 hover:underline pt-2 sm:pt-4"
              >
                Xóa
              </button>
            </div>

            <div
              v-if="!form.destinations.length"
              class="text-center py-6 text-xs text-white/30"
            >
              Chưa gán điểm đến nào cho tour.
            </div>
          </div>
        </section>

        <!-- 5. LỊCH TRÌNH CHI TIẾT (TOUR_ITINERARIES) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-orange-200">
                5. Lịch trình chi tiết
              </h2>
              <p class="text-xs text-white/40">
                Kế hoạch và hoạt động cụ thể theo từng ngày
              </p>
            </div>
            <button
              type="button"
              @click="addItineraryDay"
              class="rounded-xl border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-bold text-orange-200 hover:bg-orange-300/20"
            >
              + Thêm ngày mới
            </button>
          </div>

          <div class="space-y-6">
            <div
              v-for="(it, dayIndex) in form.itineraries"
              :key="dayIndex"
              class="overflow-hidden rounded-2xl border border-white/10 bg-black/25"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-5 py-4"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-300/10 font-bold text-orange-200"
                  >
                    {{ it.day_number }}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white">
                      Ngày {{ it.day_number }}
                    </h3>
                    <p class="text-[11px] text-white/40">
                      Hoạt động trong ngày
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    @click="addActivity(dayIndex)"
                    class="text-xs text-orange-300 hover:underline"
                  >
                    + Thêm hoạt động
                  </button>
                  <button
                    type="button"
                    @click="removeItineraryDay(dayIndex)"
                    class="text-xs text-rose-400 hover:underline"
                  >
                    Xóa ngày này
                  </button>
                </div>
              </div>

              <div class="space-y-5 p-5">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block text-[11px] text-white/50"
                      >Tiêu đề ngày *</label
                    >
                    <input
                      v-model="it.title"
                      type="text"
                      required
                      class="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-[11px] text-white/50"
                      >Mô tả ngày</label
                    >
                    <input
                      v-model="it.description"
                      type="text"
                      class="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <!-- Danh sách hoạt động con -->
                <div
                  v-if="it.activities?.length"
                  class="border-t border-white/[0.06] pt-4 space-y-3"
                >
                  <div
                    v-for="(act, actIndex) in it.activities"
                    :key="actIndex"
                    class="rounded-xl border border-white/5 bg-black/40 p-4"
                  >
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-[11px] font-bold text-orange-300/80">
                        Hoạt động #{{ actIndex + 1 }}
                      </span>
                      <button
                        type="button"
                        @click="removeActivity(dayIndex, actIndex)"
                        class="text-[10px] text-rose-400 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>

                    <div
                      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
                    >
                      <div class="lg:col-span-2">
                        <label class="mb-1 block text-[10px] text-white/40"
                          >Tên hoạt động *</label
                        >
                        <input
                          v-model="act.title"
                          type="text"
                          required
                          class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-[10px] text-white/40"
                          >ID Địa danh</label
                        >
                        <input
                          v-model="act.destination_id"
                          type="text"
                          placeholder="VD: 1, 2..."
                          class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-[10px] text-white/40"
                          >Giờ bắt đầu</label
                        >
                        <input
                          v-model="act.start_time"
                          type="time"
                          class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-[10px] text-white/40"
                          >Giờ kết thúc</label
                        >
                        <input
                          v-model="act.end_time"
                          type="time"
                          class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-[10px] text-white/40"
                          >Phương tiện</label
                        >
                        <input
                          v-model="act.transportation"
                          type="text"
                          class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. TRẠNG THÁI & NÚT SUBMIT LƯU THAY ĐỔI -->
        <div
          class="flex flex-col justify-between gap-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-4">
            <label class="text-xs font-semibold text-white/70"
              >Trạng thái tour:</label
            >
            <select
              v-model="form.status"
              class="h-11 rounded-xl border border-white/10 bg-[#0c1016] px-4 text-xs font-semibold text-orange-200 outline-none focus:border-orange-300/40"
            >
              <option value="active">● Đang mở bán (active)</option>
              <option value="inactive">○ Tạm ngưng (inactive)</option>
              <option value="draft">Bản nháp (draft)</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <RouterLink
              :to="`/admin/tours/${tourId}`"
              class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Hủy
            </RouterLink>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="rounded-xl bg-orange-300 px-7 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:opacity-50"
            >
              {{ isSubmitting ? "Đang lưu..." : "✓ Cập nhật tour" }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
