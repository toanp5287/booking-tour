<script setup>
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Plus,
  Trash2,
  UploadCloud,
  Check,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
} from "lucide-vue-next";
import cattegoryService from "../../../services/category.service";
import operatorsService from "../../../services/tourOperators.service";
import destinationService from "../../../services/destination.service";
import tourService from "../../../services/tour.service"; // Thêm service gọi API tour
import { useQuery } from "@tanstack/vue-query";
import Swal from "sweetalert2";

const router = useRouter();

// 1. Fetch dữ liệu từ API qua TanStack Query
const { data: categoriesData } = useQuery({
  queryKey: ["categoryAll"],
  queryFn: async () => {
    const res = await cattegoryService.getAll();
    return res.data.data;
  },
  staleTime: 1000 * 60 * 5,
});

const { data: dataOperators } = useQuery({
  queryKey: ["dataOperators"],
  queryFn: async () => {
    const res = await operatorsService.getAll();
    return res.data.data;
  },
  staleTime: 1000 * 60 * 5,
});

const {
  data: destinationData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["destinations"],
  queryFn: async () => {
    const res = await destinationService.getAll();
    return res.data.destination || res.data.data;
  },
  staleTime: 1000 * 60 * 5,
});

// 2. Model form bám sát Prisma Schema
const form = reactive({
  operator_id: "",
  category_id: "",
  name: "",
  slug: "",
  description: "",
  price: null,
  duration_days: 3,
  duration_nights: 2,
  max_people: 30,
  difficulty_level: "Dễ",
  transportation: "Xe du lịch",
  status: "active",
  thumbnail: null,
  thumbnailPreview: null,

  gallery_files: [],
  galleryPreviews: [],

  schedules: [
    {
      departure_date: "",
      departure_time: "08:00",
      return_date: "",
      return_time: "17:30",
      total_slots: 30,
      available_slots: 30,
      status: "open",
    },
  ],

  tour_destinations: [
    {
      destination_id: "",
      day_number: 1,
      visit_order: 1,
    },
  ],

  itineraries: [],
});

// Tự động sinh số ngày theo duration_days
const syncItineraryDays = (days) => {
  const targetDays = parseInt(days) || 1;
  const currentDays = form.itineraries.length;

  if (targetDays > currentDays) {
    for (let d = currentDays + 1; d <= targetDays; d++) {
      form.itineraries.push({
        day_number: d,
        title: `Lịch trình ngày ${d}`,
        description: "",
        activities: [
          {
            title: "Khởi hành & tham quan buổi sáng",
            destination_id: "",
            start_time: "08:00",
            end_time: "11:30",
            activity_type: "Tham quan",
            visit_order: 1,
            transportation: "Xe du lịch",
            estimated_cost: 0,
            note: "",
          },
        ],
      });
    }
  } else if (targetDays < currentDays) {
    form.itineraries.splice(targetDays);
  }
};

syncItineraryDays(form.duration_days);

watch(
  () => form.duration_days,
  (newVal) => {
    syncItineraryDays(newVal);
  },
);

watch(
  () => form.max_people,
  (newVal) => {
    if (newVal) {
      form.schedules.forEach((sch) => {
        if (!sch.total_slots || sch.total_slots === 30) {
          sch.total_slots = newVal;
          sch.available_slots = newVal;
        }
      });
    }
  },
);

// Tự sinh slug
const generateSlug = () => {
  form.slug = form.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/^-+|-+$/g, "");
};

const handleThumbnailChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    form.thumbnail = file;
    form.thumbnailPreview = URL.createObjectURL(file);
  }
};

// Upload Tour Images (tour_images)
const handleGalleryChange = (e) => {
  const files = Array.from(e.target.files);
  form.gallery_files = files;
  form.galleryPreviews = files.map((f) => URL.createObjectURL(f));
};

// Thao tác mảng con (Schedules, Destinations, Activities)
const addSchedule = () => {
  const defaultSlots = form.max_people || 30;
  form.schedules.push({
    departure_date: "",
    departure_time: "08:00",
    return_date: "",
    return_time: "17:30",
    total_slots: defaultSlots,
    available_slots: defaultSlots,
    status: "open",
  });
};
const removeSchedule = (idx) => {
  if (form.schedules.length > 1) form.schedules.splice(idx, 1);
};

const addTourDestination = () => {
  form.tour_destinations.push({
    destination_id: "",
    day_number: 1,
    visit_order: form.tour_destinations.length + 1,
  });
};
const removeTourDestination = (idx) => {
  if (form.tour_destinations.length > 1) form.tour_destinations.splice(idx, 1);
};

const addActivityToDay = (dayIdx) => {
  const actList = form.itineraries[dayIdx].activities;
  actList.push({
    title: "",
    destination_id: "",
    start_time: "13:30",
    end_time: "16:00",
    activity_type: "Tham quan",
    visit_order: actList.length + 1,
    transportation: "Xe du lịch",
    estimated_cost: 0,
    note: "",
  });
};
const removeActivityFromDay = (dayIdx, actIdx) => {
  const actList = form.itineraries[dayIdx].activities;
  if (actList.length > 1) actList.splice(actIdx, 1);
};

// Đóng gói FormData & Gửi API
const isSubmitting = ref(false);
const handleSubmit = async () => {
  if (!form.name || !form.price || !form.category_id || !form.operator_id) {
    return Swal.fire({
      title: "Vui lòng nhập tất cả các trường",
      text: "Bạn cần điền đầy đủ thông tin bắt buộc.",
      icon: "warning",
      background: "#0c1016",
      color: "#ffffff",
      confirmButtonColor: "#f5c27a",
      customClass: {
        popup:
          "rounded-[24px] border border-white/10 shadow-2xl backdrop-blur-xl",
        confirmButton: "!text-slate-900 !font-bold !px-6 !py-2.5 !rounded-xl",
      },
    });
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();

    // 1. Thêm các trường cơ bản
    formData.append("operator_id", form.operator_id);
    formData.append("category_id", form.category_id);
    formData.append("name", form.name);
    formData.append("slug", form.slug);
    formData.append("description", form.description || "");
    formData.append("price", form.price);
    formData.append("duration_days", form.duration_days);
    formData.append("duration_nights", form.duration_nights);
    formData.append("max_people", form.max_people);
    formData.append("difficulty_level", form.difficulty_level);
    formData.append("transportation", form.transportation);
    formData.append("status", form.status);

    // 2. Thêm file ảnh
    if (form.thumbnail) {
      formData.append("thumbnail", form.thumbnail);
    }
    if (form.gallery_files && form.gallery_files.length > 0) {
      form.gallery_files.forEach((file) => {
        formData.append("tour_images", file);
      });
    }

    // 3. Chuyển đổi các mảng quan hệ sang JSON String
    const formattedSchedules = form.schedules.map((s) => ({
      departure_date: s.departure_date,
      departure_time: s.departure_time,
      return_date: s.return_date || null,
      return_time: s.return_time || null,
      total_slots: Number(s.total_slots),
      available_slots: Number(s.available_slots || s.total_slots),
      status: s.status,
    }));

    const formattedDestinations = form.tour_destinations
      .filter((d) => d.destination_id)
      .map((d) => ({
        destination_id: d.destination_id,
        day_number: Number(d.day_number),
        visit_order: Number(d.visit_order),
      }));

    const formattedItineraries = form.itineraries.map((it) => ({
      day_number: Number(it.day_number),
      title: it.title,
      description: it.description,
      activities: it.activities.map((a) => ({
        destination_id: a.destination_id || null,
        title: a.title,
        description: a.description || null,
        activity_type: a.activity_type || null,
        visit_order: Number(a.visit_order),
        transportation: a.transportation || null,
        start_time: a.start_time || null,
        end_time: a.end_time || null,
        estimated_cost: Number(a.estimated_cost || 0),
        note: a.note || null,
      })),
    }));

    formData.append("schedules", JSON.stringify(formattedSchedules));
    formData.append("destinations", JSON.stringify(formattedDestinations));
    formData.append("itineraries", JSON.stringify(formattedItineraries));

    // Gọi service
    if (tourService && typeof tourService.create === "function") {
      await tourService.create(formData);
    } else {
      console.log("FormData đã sẵn sàng gửi lên Controller:", formData);
    }

    // Thông báo thành công
    await Swal.fire({
      title: "Tạo tour thành công!",
      text: "Tour du lịch mới đã được tạo thành công.",
      icon: "success",
      background: "#0c1016",
      color: "#ffffff",
      confirmButtonColor: "#f5c27a",
      customClass: {
        popup:
          "rounded-[24px] border border-white/10 shadow-2xl backdrop-blur-xl",
        confirmButton: "!text-slate-900 !font-bold !px-6 !py-2.5 !rounded-xl",
      },
    });

    router.push("/admin/tours");
  } catch (error) {
    console.error("Lỗi khi tạo tour:", error);

    // Lấy message từ Backend
    const message =
      error.response?.data?.message ||
      error.message ||
      "Có lỗi xảy ra khi lưu tour!";

    // Thông báo lỗi
    Swal.fire({
      title: "Tạo tour thất bại!",
      text: message,
      icon: "error",
      background: "#0c1016",
      color: "#ffffff",
      confirmButtonColor: "#f5c27a",
      customClass: {
        popup:
          "rounded-[24px] border border-white/10 shadow-2xl backdrop-blur-xl",
        confirmButton: "!text-slate-900 !font-bold !px-6 !py-2.5 !rounded-xl",
      },
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- ================= BACKGROUND GLOWS ================= -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        class="absolute left-[10%] top-[5%] h-[450px] w-[450px] rounded-full bg-orange-400/[0.04] blur-[150px]"
      ></div>
      <div
        class="absolute right-[5%] top-[30%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.03] blur-[160px]"
      ></div>
    </div>

    <!-- ================= MAIN CONTAINER ================= -->
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- HEADER BAR -->
      <div
        class="mb-8 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center"
      >
        <div class="flex items-center gap-4">
          <button
            type="button"
            @click="router.back()"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft :size="18" />
          </button>
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
              Prisma Schema Tour Creator
            </div>
            <h1 class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Tạo tour mới
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
            class="flex items-center gap-2 rounded-xl bg-orange-300 px-6 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:opacity-50"
          >
            <Check :size="16" />
            <span>{{
              isSubmitting ? "Đang xử lý..." : "Lưu tour hoàn chỉnh"
            }}</span>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-8">
        <!-- 1. BẢNG TOURS (THÔNG TIN CHÍNH) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 class="mb-5 text-base font-bold text-orange-200">
            1. Thông tin chung (Model: tours)
          </h2>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Tên tour -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Tên tour (name: String) <span class="text-orange-300">*</span>
              </label>
              <input
                v-model="form.name"
                @input="generateSlug"
                type="text"
                required
                placeholder="VD: Tour Đà Nẵng 3 Ngày 2 Đêm"
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
              />
            </div>

            <!-- Slug -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Slug URL (slug: String @unique)
                <span class="text-orange-300">*</span>
              </label>
              <input
                v-model="form.slug"
                type="text"
                required
                placeholder="tour-da-nang-3-ngay-2-dem"
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-xs text-orange-200/80 outline-none"
              />
            </div>

            <!-- Category ID -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Danh mục (category_id: BigInt)
                <span class="text-orange-300">*</span>
              </label>
              <select
                v-model="form.category_id"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
              >
                <option value="" disabled>-- Chọn danh mục --</option>
                <option v-for="c in categoriesData" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <!-- Operator ID -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Đơn vị tổ chức (operator_id: BigInt)
                <span class="text-orange-300">*</span>
              </label>
              <select
                v-model="form.operator_id"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
              >
                <option value="" disabled>
                  -- Chọn nhà xe / công ty tour --
                </option>
                <option v-for="op in dataOperators" :key="op.id" :value="op.id">
                  {{ op.company_name }}
                </option>
              </select>
            </div>

            <!-- Price -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Giá niêm yết (price: Decimal)
                <span class="text-orange-300">*</span>
              </label>
              <input
                v-model="form.price"
                type="number"
                min="0"
                step="10000"
                required
                placeholder="3500000"
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
              />
            </div>

            <!-- Duration days -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số ngày (duration_days: Int)
                <span class="text-orange-300"
                  >* (Đổi số để tự sinh số ngày)</span
                >
              </label>
              <input
                v-model.number="form.duration_days"
                type="number"
                min="1"
                required
                class="h-11 w-full rounded-xl border border-orange-300/40 bg-black/25 px-4 text-sm font-bold text-orange-200 outline-none focus:border-orange-300"
              />
            </div>

            <!-- Duration nights -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số đêm (duration_nights: Int)
                <span class="text-orange-300">*</span>
              </label>
              <input
                v-model.number="form.duration_nights"
                type="number"
                min="0"
                required
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
              />
            </div>

            <!-- Max people -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số khách tối đa (max_people: Int)
                <span class="text-orange-300">*</span>
              </label>
              <input
                v-model.number="form.max_people"
                type="number"
                min="1"
                required
                placeholder="30"
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
              />
            </div>

            <!-- Difficulty level -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Độ khó (difficulty_level: String?)
              </label>
              <select
                v-model="form.difficulty_level"
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c1016] px-4 text-sm text-white/70 outline-none focus:border-orange-300/40"
              >
                <option>Dễ</option>
                <option>Trung bình</option>
                <option>Thử thách</option>
              </select>
            </div>

            <!-- Transportation -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Phương tiện chính (transportation: String?)
              </label>
              <input
                v-model="form.transportation"
                type="text"
                placeholder="VD: Xe du lịch 45 chỗ"
                class="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-orange-300/40"
              />
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Mô tả chi tiết tour (description: String?)
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Nhập mô tả tổng quan về hành trình..."
                class="w-full rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-300/40"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- 2. BẢNG TOURS & TOUR_IMAGES (HÌNH ẢNH) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 class="mb-5 text-base font-bold text-orange-200">
            2. Hình ảnh (Model: tours.thumbnail &amp; tour_images)
          </h2>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Thumbnail -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Ảnh bìa đại diện (thumbnail: String?)
              </label>
              <label
                class="flex h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-black/20 text-center transition hover:border-orange-300/40"
              >
                <UploadCloud class="h-6 w-6 text-white/40 mb-1" />
                <span class="text-xs text-white/70">Chọn ảnh đại diện</span>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleThumbnailChange"
                  class="hidden"
                />
              </label>
            </div>

            <div class="flex items-center justify-center">
              <div
                v-if="form.thumbnailPreview"
                class="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10"
              >
                <img
                  :src="form.thumbnailPreview"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                v-else
                class="flex h-36 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs text-white/30"
              >
                Xem trước ảnh bìa
              </div>
            </div>

            <!-- Multiple tour_images -->
            <div class="md:col-span-2 border-t border-white/[0.06] pt-4">
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Bộ sưu tập ảnh chi tiết (Bảng tour_images)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                @change="handleGalleryChange"
                class="block w-full text-xs text-white/40 file:mr-4 file:rounded-xl file:border file:border-white/15 file:bg-white/5 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white/80 hover:file:bg-white/10"
              />
              <div
                v-if="form.galleryPreviews.length"
                class="mt-4 flex flex-wrap gap-3"
              >
                <div
                  v-for="(imgSrc, gIdx) in form.galleryPreviews"
                  :key="gIdx"
                  class="relative h-20 w-28 overflow-hidden rounded-xl border border-white/10"
                >
                  <img :src="imgSrc" class="h-full w-full object-cover" />
                  <span
                    class="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] text-orange-200"
                  >
                    #{{ gIdx + 1 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. BẢNG TOUR_SCHEDULES (CÁC ĐỢT KHỞI HÀNH) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-orange-200">
                3. Đợt khởi hành (Model: tour_schedules)
              </h2>
              <p class="text-xs text-white/40">
                Quản lý ngày, giờ và số lượng chỗ mở bán từng đợt
              </p>
            </div>
            <button
              type="button"
              @click="addSchedule"
              class="flex items-center gap-1.5 rounded-xl border border-orange-300/20 bg-orange-300/10 px-3.5 py-2 text-xs font-semibold text-orange-200 hover:bg-orange-300/20"
            >
              <Plus :size="15" />
              <span>+ Thêm đợt khởi hành</span>
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(sch, idx) in form.schedules"
              :key="idx"
              class="rounded-2xl border border-white/5 bg-black/30 p-5"
            >
              <div
                class="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-3"
              >
                <span
                  class="text-xs font-bold uppercase tracking-wider text-orange-300/90"
                >
                  Lịch khởi hành #{{ idx + 1 }}
                </span>
                <button
                  type="button"
                  @click="removeSchedule(idx)"
                  :disabled="form.schedules.length === 1"
                  class="rounded-lg p-1.5 text-red-400 hover:bg-red-400/10 disabled:opacity-20"
                >
                  <Trash2 :size="15" />
                </button>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Ngày đi (departure_date) *</label
                  >
                  <input
                    v-model="sch.departure_date"
                    type="date"
                    required
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Giờ đi (departure_time) *</label
                  >
                  <input
                    v-model="sch.departure_time"
                    type="time"
                    required
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Ngày về (return_date)</label
                  >
                  <input
                    v-model="sch.return_date"
                    type="date"
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Giờ về (return_time)</label
                  >
                  <input
                    v-model="sch.return_time"
                    type="time"
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Tổng chỗ (total_slots) *</label
                  >
                  <input
                    v-model.number="sch.total_slots"
                    @input="sch.available_slots = sch.total_slots"
                    type="number"
                    min="1"
                    required
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-[11px] text-white/50"
                    >Trạng thái lịch</label
                  >
                  <select
                    v-model="sch.status"
                    class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white/70 outline-none focus:border-orange-300/40"
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

        <!-- 4. BẢNG TOUR_DESTINATIONS (ĐIỂM ĐẾN GHÉ THĂM) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-orange-200">
                4. Điểm đến trong tour (Model: tour_destinations)
              </h2>
              <p class="text-xs text-white/40">
                Gắn điểm đến theo ngày ghé và thứ tự ghé thăm
              </p>
            </div>
            <button
              type="button"
              @click="addTourDestination"
              class="flex items-center gap-1.5 rounded-xl border border-orange-300/20 bg-orange-300/10 px-3.5 py-2 text-xs font-semibold text-orange-200 hover:bg-orange-300/20"
            >
              <Plus :size="15" />
              <span>+ Thêm điểm đến</span>
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(td, tdIdx) in form.tour_destinations"
              :key="tdIdx"
              class="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/30 p-4 sm:flex-row sm:items-center"
            >
              <div class="flex-1">
                <label class="mb-1 block text-[11px] text-white/40">
                  Điểm đến (destination_id: BigInt) *
                </label>
                <select
                  v-model="td.destination_id"
                  required
                  class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white/80 outline-none focus:border-orange-300/40"
                >
                  <option value="" disabled>-- Chọn điểm đến --</option>
                  <option
                    v-for="d in destinationData"
                    :key="d.id"
                    :value="d.id"
                  >
                    {{ d.name }} ({{ d.province }})
                  </option>
                </select>
              </div>

              <div class="w-full sm:w-36">
                <label class="mb-1 block text-[11px] text-white/40">
                  Ghé ngày thứ (day_number: Int)
                </label>
                <input
                  v-model.number="td.day_number"
                  type="number"
                  min="1"
                  :max="form.duration_days"
                  class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div class="w-full sm:w-28">
                <label class="mb-1 block text-[11px] text-white/40">
                  Thứ tự (visit_order: Int)
                </label>
                <input
                  v-model.number="td.visit_order"
                  type="number"
                  min="1"
                  class="h-10 w-full rounded-xl border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                />
              </div>

              <div class="flex items-end pt-2 sm:pt-4">
                <button
                  type="button"
                  @click="removeTourDestination(tdIdx)"
                  :disabled="form.tour_destinations.length === 1"
                  class="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/5 text-red-400 hover:bg-red-400/20 disabled:opacity-20"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. BẢNG TOUR_ITINERARIES & ITINERARY_ACTIVITIES (TỰ CHẠY THEO SỐ NGÀY) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="mb-6">
            <h2 class="text-base font-bold text-orange-200">
              5. Lịch trình chi tiết (Model: tour_itineraries &amp;
              itinerary_activities)
            </h2>
            <p class="text-xs text-white/40">
              Tự động khởi tạo {{ form.itineraries.length }} ngày theo thời
              lượng tour. Bạn có thể thêm nhiều hoạt động cho từng ngày.
            </p>
          </div>

          <div class="space-y-6">
            <!-- TỪNG NGÀY TRONG ITINERARIES -->
            <div
              v-for="(day, dayIdx) in form.itineraries"
              :key="dayIdx"
              class="overflow-hidden rounded-2xl border border-white/10 bg-black/25"
            >
              <!-- Tiêu đề ngày -->
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-5 py-4"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-300/10 font-bold text-orange-200"
                  >
                    {{ day.day_number }}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white">
                      Ngày {{ day.day_number }}
                    </h3>
                    <p class="text-[11px] text-white/40">
                      Chi tiết các hoạt động trong ngày thứ {{ day.day_number }}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  @click="addActivityToDay(dayIdx)"
                  class="flex items-center gap-1.5 rounded-xl border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-xs font-semibold text-orange-200 hover:bg-orange-300/20"
                >
                  <Plus :size="14" />
                  <span>+ Thêm hoạt động</span>
                </button>
              </div>

              <!-- Nội dung ngày: title & description -->
              <div class="space-y-5 p-5">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block text-[11px] text-white/50">
                      Tiêu đề ngày (title: String) *
                    </label>
                    <input
                      v-model="day.title"
                      type="text"
                      required
                      placeholder="VD: Đón sân bay - Bán đảo Sơn Trà"
                      class="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-orange-300/40"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-[11px] text-white/50">
                      Mô tả ngày (description: String?)
                    </label>
                    <input
                      v-model="day.description"
                      type="text"
                      placeholder="VD: Xe đón đoàn tại sân bay, nhận phòng nghỉ ngơi..."
                      class="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-orange-300/40"
                    />
                  </div>
                </div>

                <!-- CÁC HOẠT ĐỘNG TRONG NGÀY (BẢNG itinerary_activities) -->
                <div class="border-t border-white/[0.06] pt-4">
                  <p
                    class="mb-3 text-[11px] font-bold uppercase tracking-wider text-orange-300/80"
                  >
                    Danh sách hoạt động (itinerary_activities)
                  </p>

                  <div class="space-y-3">
                    <div
                      v-for="(act, aIdx) in day.activities"
                      :key="aIdx"
                      class="rounded-xl border border-white/5 bg-black/40 p-4"
                    >
                      <div
                        class="mb-3 flex items-center justify-between border-b border-white/[0.04] pb-2"
                      >
                        <span class="text-xs font-semibold text-white/70">
                          Hoạt động #{{ aIdx + 1 }}
                        </span>
                        <button
                          type="button"
                          @click="removeActivityFromDay(dayIdx, aIdx)"
                          :disabled="day.activities.length === 1"
                          class="text-red-400 hover:text-red-300 disabled:opacity-20"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </div>

                      <div
                        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
                      >
                        <!-- Tên hoạt động (title) -->
                        <div class="lg:col-span-2">
                          <label class="mb-1 block text-[10px] text-white/40">
                            Tên hoạt động (title) *
                          </label>
                          <input
                            v-model="act.title"
                            type="text"
                            required
                            placeholder="VD: Tham quan Chùa Linh Ứng"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Điểm đến gắn kèm (destination_id) -->
                        <div>
                          <label class="mb-1 block text-[10px] text-white/40">
                            Địa điểm (destination_id?)
                          </label>
                          <select
                            v-model="act.destination_id"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white/70 outline-none focus:border-orange-300/40"
                          >
                            <option value="">-- Không chọn --</option>
                            <option
                              v-for="d in destinationData"
                              :key="d.id"
                              :value="d.id"
                            >
                              {{ d.name }}
                            </option>
                          </select>
                        </div>

                        <!-- Giờ bắt đầu (start_time) -->
                        <div>
                          <label class="mb-1 block text-[10px] text-white/40">
                            Giờ bắt đầu (start_time)
                          </label>
                          <input
                            v-model="act.start_time"
                            type="time"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Giờ kết thúc (end_time) -->
                        <div>
                          <label class="mb-1 block text-[10px] text-white/40">
                            Giờ kết thúc (end_time)
                          </label>
                          <input
                            v-model="act.end_time"
                            type="time"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Thứ tự (visit_order) -->
                        <div>
                          <label class="mb-1 block text-[10px] text-white/40">
                            Thứ tự (visit_order) *
                          </label>
                          <input
                            v-model.number="act.visit_order"
                            type="number"
                            min="1"
                            required
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-2 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Loại hoạt động (activity_type) -->
                        <div class="sm:col-span-2">
                          <label class="mb-1 block text-[10px] text-white/40">
                            Loại hoạt động (activity_type)
                          </label>
                          <input
                            v-model="act.activity_type"
                            type="text"
                            placeholder="Tham quan / Ăn uống / Di chuyển"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Phương tiện (transportation) -->
                        <div class="sm:col-span-2">
                          <label class="mb-1 block text-[10px] text-white/40">
                            Phương tiện (transportation)
                          </label>
                          <input
                            v-model="act.transportation"
                            type="text"
                            placeholder="VD: Xe du lịch / Đi bộ"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Chi phí dự kiến (estimated_cost: Decimal) -->
                        <div class="sm:col-span-2">
                          <label class="mb-1 block text-[10px] text-white/40">
                            Chi phí dự tính (estimated_cost)
                          </label>
                          <input
                            v-model.number="act.estimated_cost"
                            type="number"
                            min="0"
                            placeholder="0"
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>

                        <!-- Ghi chú (note) -->
                        <div class="sm:col-span-2 lg:col-span-6">
                          <label class="mb-1 block text-[10px] text-white/40">
                            Ghi chú (note: String?)
                          </label>
                          <input
                            v-model="act.note"
                            type="text"
                            placeholder="VD: Mang theo áo ấm hoặc đồ bơi..."
                            class="h-9 w-full rounded-lg border border-white/10 bg-[#0c1016] px-3 text-xs text-white outline-none focus:border-orange-300/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. TRẠNG THÁI VÀ NÚT SUBMIT -->
        <div
          class="flex flex-col justify-between gap-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-4">
            <label class="text-xs font-semibold text-white/70"
              >Trạng thái phát hành (status):</label
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
            <button
              type="button"
              @click="router.back()"
              class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/60 hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="rounded-xl bg-orange-300 px-7 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:opacity-50"
            >
              {{ isSubmitting ? "Đang tạo tour..." : "Tạo tour du lịch" }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
