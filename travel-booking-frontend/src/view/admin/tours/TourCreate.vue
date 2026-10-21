<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Save,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  MapPin,
  CalendarDays,
  ClipboardList,
  Info,
  ChevronDown,
  X,
  Clock,
  Users,
  Bus,
  Wallet,
  Route,
  Sparkles,
  CheckCircle2,
} from "lucide-vue-next";

import cattegoryService from "../../../services/category.service";
import operatorsService from "../../../services/tourOperators.service";
import destinationService from "../../../services/destination.service";
import tourService from "../../../services/tour.service"; // Thêm service gọi API tour import { useQuery

const router = useRouter();

/* =========================================================
 * CONSTANTS
 * ======================================================= */

const TOUR_TYPES = [
  {
    value: "SIC",
    label: "SIC",
    description: "Tour ghép, khởi hành theo lịch",
  },
  {
    value: "PRIVATE",
    label: "PRIVATE",
    description: "Tour riêng theo nhóm khách",
  },
  {
    value: "GROUP",
    label: "GROUP",
    description: "Tour đoàn, tổ chức theo nhóm",
  },
  {
    value: "CUSTOM",
    label: "CUSTOM",
    description: "Tour thiết kế theo yêu cầu",
  },
];

const DIFFICULTIES = [
  { value: "", label: "Chưa xác định" },
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const TRANSPORTATIONS = [
  { value: "Xe du lịch", label: "Xe du lịch" },
  { value: "Máy bay", label: "Máy bay" },
  { value: "Tàu hỏa", label: "Tàu hỏa" },
  { value: "Tàu thủy", label: "Tàu thủy" },
  { value: "Xe máy", label: "Xe máy" },
  { value: "Khác", label: "Khác" },
];

const ACTIVITY_TYPES = [
  { value: "sightseeing", label: "Tham quan" },
  { value: "dining", label: "Ăn uống" },
  { value: "transport", label: "Di chuyển" },
  { value: "rest", label: "Nghỉ ngơi" },
  { value: "activity", label: "Hoạt động" },
  { value: "other", label: "Khác" },
];

const tabs = [
  { id: "information", label: "Thông tin tour", icon: Info },
  { id: "schedule", label: "Lịch khởi hành", icon: CalendarDays },
  { id: "destinations", label: "Điểm đến", icon: MapPin },
  { id: "itinerary", label: "Lịch trình", icon: ClipboardList },
];

const activeTab = ref("information");

/* =========================================================
 * STATE
 * ======================================================= */

const loading = ref(false);
const loadingOptions = ref(false);

const categories = ref([]);
const operators = ref([]);
const destinationsList = ref([]);

const thumbnailFile = ref(null);
const galleryFiles = ref([]);
const thumbnailPreview = ref("");
const galleryPreviews = ref([]);

const thumbnailInput = ref(null);
const galleryInput = ref(null);

const form = reactive({
  operator_id: "",
  category_id: "",

  name: "",
  slug: "",
  description: "",

  supported_tour_types: ["SIC"],
  is_customizable: false,

  min_people: 1,
  max_people: 20,
  base_price: 0,

  duration_days: 1,
  duration_nights: 0,

  difficulty_level: "",
  transportation: "Xe du lịch",
  status: "active",

  schedules: [],
  destinations: [],
  itineraries: [],
});

const errors = reactive({});

/* =========================================================
 * HELPERS
 * ======================================================= */

function getResponseList(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDateForInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);

  return formatDateForInput(date);
}

function normalizeId(value) {
  return value === null || value === undefined ? "" : String(value);
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scrollToSection(id) {
  activeTab.value = id;

  document.getElementById(`section-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

/* =========================================================
 * LOAD SELECT OPTIONS
 * ======================================================= */

async function loadOptions() {
  loadingOptions.value = true;

  try {
    const [categoryResponse, operatorResponse, destinationResponse] =
      await Promise.all([
        categoryService.getAll(),
        operatorService.getAll(),
        destinationService.getAll(),
      ]);

    categories.value = getResponseList(categoryResponse);
    operators.value = getResponseList(operatorResponse);
    destinationsList.value = getResponseList(destinationResponse);
  } catch (error) {
    console.error("Không thể tải dữ liệu danh mục:", error);

    await Swal.fire({
      icon: "error",
      title: "Không tải được dữ liệu",
      text: "Không thể tải danh mục, nhà điều hành hoặc điểm đến. Hãy kiểm tra kết nối API.",
      confirmButtonText: "Đã hiểu",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#f97316",
    });
  } finally {
    loadingOptions.value = false;
  }
}

onMounted(loadOptions);

/* =========================================================
 * SLUG
 * ======================================================= */

const slugManuallyEdited = ref(false);

watch(
  () => form.name,
  (name) => {
    if (!slugManuallyEdited.value) {
      form.slug = slugify(name);
    }
  },
);

/* =========================================================
 * TOUR TYPES
 * ======================================================= */

function toggleTourType(type) {
  const index = form.supported_tour_types.indexOf(type);

  if (index >= 0) {
    if (form.supported_tour_types.length === 1) {
      Swal.fire({
        icon: "info",
        title: "Cần ít nhất một loại tour",
        text: "Tour phải có ít nhất một loại trong supported_tour_types.",
        background: "#111827",
        color: "#fff",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    form.supported_tour_types.splice(index, 1);
  } else {
    form.supported_tour_types.push(type);
  }

  // Đồng bộ loại tour cho các lịch khởi hành hiện có.
  form.schedules.forEach((schedule) => {
    if (!form.supported_tour_types.includes(schedule.tour_type)) {
      schedule.tour_type = form.supported_tour_types[0];
    }
  });
}

/* =========================================================
 * IMAGE UPLOAD
 * ======================================================= */

function revokePreview(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function selectThumbnail(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    Swal.fire({
      icon: "warning",
      title: "File không hợp lệ",
      text: "Ảnh đại diện phải là file hình ảnh.",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#f97316",
    });

    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: "warning",
      title: "Ảnh quá lớn",
      text: "Dung lượng ảnh đại diện tối đa là 5 MB.",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#f97316",
    });

    event.target.value = "";
    return;
  }

  revokePreview(thumbnailPreview.value);

  thumbnailFile.value = file;
  thumbnailPreview.value = URL.createObjectURL(file);

  if (errors.thumbnail) delete errors.thumbnail;
}

function selectGallery(event) {
  const files = Array.from(event.target.files ?? []);
  if (!files.length) return;

  const validFiles = [];
  const invalidFiles = [];

  files.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      invalidFiles.push(`${file.name}: không phải hình ảnh`);
    } else if (file.size > 5 * 1024 * 1024) {
      invalidFiles.push(`${file.name}: vượt quá 5 MB`);
    } else {
      validFiles.push(file);
    }
  });

  const remaining = Math.max(0, 12 - galleryFiles.value.length);
  const accepted = validFiles.slice(0, remaining);

  accepted.forEach((file) => {
    galleryFiles.value.push(file);
    galleryPreviews.value.push({
      id: makeId(),
      file,
      url: URL.createObjectURL(file),
    });
  });

  if (validFiles.length > remaining) {
    invalidFiles.push(`Chỉ được chọn tối đa 12 ảnh trong thư viện.`);
  }

  event.target.value = "";

  if (invalidFiles.length) {
    Swal.fire({
      icon: "warning",
      title: "Một số ảnh chưa được thêm",
      text: invalidFiles.join(". "),
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#f97316",
    });
  }
}

function removeGalleryImage(index) {
  const preview = galleryPreviews.value[index];

  if (preview) revokePreview(preview.url);

  galleryPreviews.value.splice(index, 1);
  galleryFiles.value.splice(index, 1);
}

function clearThumbnail() {
  revokePreview(thumbnailPreview.value);

  thumbnailFile.value = null;
  thumbnailPreview.value = "";

  if (thumbnailInput.value) {
    thumbnailInput.value.value = "";
  }
}

onBeforeUnmount(() => {
  revokePreview(thumbnailPreview.value);

  galleryPreviews.value.forEach((item) => {
    revokePreview(item.url);
  });
});

/* =========================================================
 * SCHEDULES
 * ======================================================= */

function createSchedule() {
  const defaultType = form.supported_tour_types[0] || "SIC";
  const departureDate = addDays(
    formatDateForInput(),
    form.schedules.length + 1,
  );

  return {
    _key: makeId(),

    tour_type: defaultType,
    departure_date: departureDate,
    departure_time: "07:00",
    return_date: addDays(departureDate, form.duration_days - 1),
    return_time: "17:00",

    total_slots: form.max_people,
    available_slots: form.max_people,

    is_private: defaultType === "PRIVATE",
    custom_departure_allowed: defaultType === "CUSTOM",

    status: "open",
  };
}

function addSchedule() {
  form.schedules.push(createSchedule());
}

function removeSchedule(index) {
  form.schedules.splice(index, 1);
}

function updateScheduleType(schedule) {
  schedule.is_private = schedule.tour_type === "PRIVATE";
  schedule.custom_departure_allowed = schedule.tour_type === "CUSTOM";
}

function updateScheduleSlots(schedule) {
  schedule.total_slots = Math.max(
    0,
    toNumber(schedule.total_slots, form.max_people),
  );

  schedule.available_slots = Math.min(
    Math.max(0, toNumber(schedule.available_slots, schedule.total_slots)),
    schedule.total_slots,
  );
}

watch(
  () => form.max_people,
  (value) => {
    const maxPeople = Math.max(1, toNumber(value, 1));

    form.schedules.forEach((schedule) => {
      if (!schedule._slotsEdited) {
        schedule.total_slots = maxPeople;
        schedule.available_slots = maxPeople;
      }
    });
  },
);

/* =========================================================
 * DESTINATIONS
 * ======================================================= */

function createDestination() {
  return {
    _key: makeId(),
    destination_id: "",
    visit_order: form.destinations.length + 1,
    day_number: 1,
  };
}

function addDestination() {
  form.destinations.push(createDestination());
}

function removeDestination(index) {
  form.destinations.splice(index, 1);

  form.destinations.forEach((destination, position) => {
    destination.visit_order = position + 1;
  });
}

/* =========================================================
 * ITINERARIES AND ACTIVITIES
 * ======================================================= */

function createActivity() {
  return {
    _key: makeId(),
    destination_id: "",
    start_time: "09:00",
    end_time: "10:00",
    title: "",
    description: "",
    activity_type: "sightseeing",
    visit_order: 1,
    transportation: "",
    estimated_cost: "",
    note: "",
  };
}

function createItinerary(dayNumber) {
  return {
    _key: makeId(),
    day_number: dayNumber,
    title: `Ngày ${dayNumber}`,
    description: "",
    activities: [],
  };
}

function syncItineraries() {
  const days = Math.max(1, Math.min(60, toNumber(form.duration_days, 1)));

  while (form.itineraries.length < days) {
    form.itineraries.push(createItinerary(form.itineraries.length + 1));
  }

  while (form.itineraries.length > days) {
    form.itineraries.pop();
  }

  form.itineraries.forEach((itinerary, index) => {
    itinerary.day_number = index + 1;

    if (!itinerary.title?.trim()) {
      itinerary.title = `Ngày ${index + 1}`;
    }
  });

  // Loại bỏ điểm đến thuộc ngày vượt quá thời lượng tour.
  form.destinations.forEach((destination) => {
    if (toNumber(destination.day_number, 1) > days) {
      destination.day_number = days;
    }
  });
}

watch(
  () => form.duration_days,
  () => syncItineraries(),
  { immediate: true },
);

function addActivity(itinerary) {
  const activity = createActivity();
  activity.visit_order = itinerary.activities.length + 1;
  itinerary.activities.push(activity);
}

function removeActivity(itinerary, index) {
  itinerary.activities.splice(index, 1);

  itinerary.activities.forEach((activity, position) => {
    activity.visit_order = position + 1;
  });
}

/* =========================================================
 * VALIDATION
 * ======================================================= */

function validateForm() {
  clearErrors();

  if (!form.name.trim()) {
    errors.name = "Vui lòng nhập tên tour.";
  }

  if (!form.slug.trim()) {
    errors.slug = "Vui lòng nhập slug.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
    errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
  }

  if (!form.operator_id) {
    errors.operator_id = "Vui lòng chọn nhà điều hành.";
  }

  if (!form.category_id) {
    errors.category_id = "Vui lòng chọn danh mục.";
  }

  if (!form.supported_tour_types.length) {
    errors.supported_tour_types = "Chọn ít nhất một loại tour.";
  }

  if (toNumber(form.base_price, -1) < 0) {
    errors.base_price = "Giá tour không được âm.";
  }

  if (toNumber(form.min_people, 0) < 1) {
    errors.min_people = "Số khách tối thiểu phải từ 1.";
  }

  if (toNumber(form.max_people, 0) < toNumber(form.min_people, 1)) {
    errors.max_people =
      "Số khách tối đa phải lớn hơn hoặc bằng số khách tối thiểu.";
  }

  if (toNumber(form.duration_days, 0) < 1) {
    errors.duration_days = "Thời lượng tour phải ít nhất 1 ngày.";
  }

  if (toNumber(form.duration_nights, -1) < 0) {
    errors.duration_nights = "Số đêm không được âm.";
  }

  if (toNumber(form.duration_nights, 0) > toNumber(form.duration_days, 1)) {
    errors.duration_nights = "Số đêm không nên lớn hơn số ngày.";
  }

  form.schedules.forEach((schedule, index) => {
    if (!schedule.departure_date) {
      errors[`schedule_${index}_departure_date`] =
        `Lịch khởi hành ${index + 1}: vui lòng chọn ngày đi.`;
    }

    if (!schedule.departure_time) {
      errors[`schedule_${index}_departure_time`] =
        `Lịch khởi hành ${index + 1}: vui lòng chọn giờ đi.`;
    }

    if (
      schedule.return_date &&
      schedule.departure_date &&
      schedule.return_date < schedule.departure_date
    ) {
      errors[`schedule_${index}_return_date`] =
        `Lịch khởi hành ${index + 1}: ngày về không được trước ngày đi.`;
    }

    if (!form.supported_tour_types.includes(schedule.tour_type)) {
      errors[`schedule_${index}_tour_type`] =
        `Lịch khởi hành ${index + 1}: loại tour chưa được bật trong thông tin tour.`;
    }

    if (toNumber(schedule.total_slots, 0) < 0) {
      errors[`schedule_${index}_total_slots`] = "Tổng số chỗ không được âm.";
    }

    if (
      toNumber(schedule.available_slots, 0) < 0 ||
      toNumber(schedule.available_slots, 0) > toNumber(schedule.total_slots, 0)
    ) {
      errors[`schedule_${index}_available_slots`] =
        "Số chỗ còn lại phải nằm trong giới hạn tổng số chỗ.";
    }
  });

  form.destinations.forEach((destination, index) => {
    if (!destination.destination_id) {
      errors[`destination_${index}`] =
        `Điểm đến thứ ${index + 1}: vui lòng chọn địa điểm.`;
    }

    if (
      toNumber(destination.day_number, 0) < 1 ||
      toNumber(destination.day_number, 0) > toNumber(form.duration_days, 1)
    ) {
      errors[`destination_day_${index}`] =
        `Điểm đến thứ ${index + 1}: ngày tham quan không hợp lệ.`;
    }
  });

  form.itineraries.forEach((itinerary, itineraryIndex) => {
    itinerary.activities.forEach((activity, activityIndex) => {
      if (!activity.title.trim()) {
        errors[`activity_${itineraryIndex}_${activityIndex}`] =
          `Ngày ${itinerary.day_number}: hoạt động ${activityIndex + 1} cần có tiêu đề.`;
      }

      if (
        activity.start_time &&
        activity.end_time &&
        activity.end_time < activity.start_time
      ) {
        errors[`activity_time_${itineraryIndex}_${activityIndex}`] =
          `Ngày ${itinerary.day_number}: giờ kết thúc không được trước giờ bắt đầu.`;
      }

      if (
        activity.estimated_cost !== "" &&
        toNumber(activity.estimated_cost, -1) < 0
      ) {
        errors[`activity_cost_${itineraryIndex}_${activityIndex}`] =
          "Chi phí hoạt động không được âm.";
      }
    });
  });

  return Object.keys(errors).length === 0;
}

/* =========================================================
 * PAYLOAD
 * ======================================================= */

function buildPayload() {
  const formData = new FormData();

  formData.append("operator_id", String(form.operator_id));
  formData.append("category_id", String(form.category_id));

  formData.append("name", form.name.trim());
  formData.append("slug", form.slug.trim());
  formData.append("description", form.description.trim());

  formData.append(
    "supported_tour_types",
    JSON.stringify(form.supported_tour_types),
  );

  formData.append("is_customizable", String(form.is_customizable));

  formData.append("min_people", String(toNumber(form.min_people, 1)));
  formData.append("max_people", String(toNumber(form.max_people, 20)));
  formData.append("base_price", String(toNumber(form.base_price, 0)));

  formData.append("duration_days", String(toNumber(form.duration_days, 1)));
  formData.append("duration_nights", String(toNumber(form.duration_nights, 0)));

  formData.append("difficulty_level", form.difficulty_level || "");
  formData.append("transportation", form.transportation || "");
  formData.append("status", form.status);

  if (thumbnailFile.value) {
    formData.append("thumbnail", thumbnailFile.value);
  }

  galleryFiles.value.forEach((file) => {
    formData.append("tour_images", file);
  });

  const schedules = form.schedules.map((schedule) => ({
    tour_type: schedule.tour_type,
    departure_date: schedule.departure_date,
    departure_time: schedule.departure_time,
    return_date: schedule.return_date || null,
    return_time: schedule.return_time || null,
    total_slots: toNumber(schedule.total_slots, 0),
    available_slots: toNumber(schedule.available_slots, 0),
    is_private: Boolean(schedule.is_private),
    custom_departure_allowed: Boolean(schedule.custom_departure_allowed),
    status: schedule.status || "open",
  }));

  const destinations = form.destinations.map((destination) => ({
    destination_id: String(destination.destination_id),
    visit_order: toNumber(destination.visit_order, 1),
    day_number: toNumber(destination.day_number, 1),
  }));

  const itineraries = form.itineraries.map((itinerary) => ({
    day_number: toNumber(itinerary.day_number, 1),
    title: itinerary.title.trim() || `Ngày ${itinerary.day_number}`,
    description: itinerary.description.trim() || null,

    activities: itinerary.activities.map((activity) => ({
      destination_id: activity.destination_id
        ? String(activity.destination_id)
        : null,

      start_time: activity.start_time || null,
      end_time: activity.end_time || null,

      title: activity.title.trim(),
      description: activity.description.trim() || null,
      activity_type: activity.activity_type || null,

      visit_order: toNumber(activity.visit_order, 1),
      transportation: activity.transportation.trim() || null,

      estimated_cost:
        activity.estimated_cost === ""
          ? null
          : toNumber(activity.estimated_cost, 0),

      note: activity.note.trim() || null,
    })),
  }));

  formData.append("schedules", JSON.stringify(schedules));
  formData.append("destinations", JSON.stringify(destinations));
  formData.append("itineraries", JSON.stringify(itineraries));

  return formData;
}

/* =========================================================
 * SUBMIT
 * ======================================================= */

async function submitForm() {
  if (loading.value) return;

  if (!validateForm()) {
    const firstError = Object.keys(errors)[0];

    if (firstError.startsWith("schedule_")) {
      scrollToSection("schedule");
    } else if (firstError.startsWith("destination_")) {
      scrollToSection("destinations");
    } else if (firstError.startsWith("activity_")) {
      scrollToSection("itinerary");
    } else {
      scrollToSection("information");
    }

    await Swal.fire({
      icon: "warning",
      title: "Thông tin chưa hợp lệ",
      text: "Kiểm tra các trường được đánh dấu trước khi lưu tour.",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#f97316",
    });

    return;
  }

  const result = await Swal.fire({
    icon: "question",
    title: "Tạo tour mới?",
    text: "Vui lòng kiểm tra thông tin trước khi xác nhận.",
    showCancelButton: true,
    confirmButtonText: "Tạo tour",
    cancelButtonText: "Kiểm tra lại",
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#374151",
    background: "#111827",
    color: "#fff",
  });

  if (!result.isConfirmed) return;

  loading.value = true;

  try {
    const payload = buildPayload();

    await tourService.create(payload);

    await Swal.fire({
      icon: "success",
      title: "Tạo tour thành công",
      text: "Thông tin tour đã được gửi đến hệ thống.",
      confirmButtonText: "Đến danh sách tour",
      confirmButtonColor: "#f97316",
      background: "#111827",
      color: "#fff",
    });

    router.push("/admin/tours");
  } catch (error) {
    console.error("Lỗi tạo tour:", error);

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Không thể tạo tour. Vui lòng thử lại.";

    await Swal.fire({
      icon: "error",
      title: "Tạo tour thất bại",
      text: message,
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
      background: "#111827",
      color: "#fff",
    });
  } finally {
    loading.value = false;
  }
}

function cancelCreate() {
  router.push("/admin/tours");
}
</script>

<template>
  <div class="admin-page min-h-screen bg-[#080b11] px-4 py-6 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[1600px] space-y-6">
      <!-- HEADER -->
      <header
        class="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111722] p-6 sm:p-8"
      >
        <div
          class="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl"
        />
        <div
          class="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl"
        />

        <div
          class="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
        >
          <div>
            <button
              type="button"
              class="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
              @click="cancelCreate"
            >
              <ArrowLeft class="h-4 w-4" />
              Quay lại danh sách tour
            </button>

            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20"
              >
                <Sparkles class="h-6 w-6 text-white" />
              </div>

              <div>
                <p
                  class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400"
                >
                  TOUR MANAGEMENT
                </p>
                <h1 class="text-2xl font-bold sm:text-3xl">Tạo tour mới</h1>
              </div>
            </div>

            <p class="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
              Thiết lập thông tin tour, loại hình, lịch khởi hành, điểm đến và
              lịch trình trong cùng một biểu mẫu.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
              @click="cancelCreate"
            >
              Hủy
            </button>

            <button
              type="button"
              :disabled="loading || loadingOptions"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="submitForm"
            >
              <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ loading ? "Đang lưu..." : "Tạo tour" }}
            </button>
          </div>
        </div>
      </header>

      <!-- NAVIGATION -->
      <nav
        class="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#111722]/95 p-2 shadow-xl backdrop-blur-xl"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition"
          :class="
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
          "
          @click="scrollToSection(tab.id)"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>

      <div
        v-if="loadingOptions"
        class="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"
      >
        <LoaderCircle class="h-5 w-5 animate-spin" />
        Đang tải danh mục, nhà điều hành và điểm đến...
      </div>

      <form class="space-y-6" @submit.prevent="submitForm">
        <!-- =================================================
             SECTION 1: TOUR INFORMATION
        ================================================== -->
        <section
          id="section-information"
          class="scroll-mt-28 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111722]"
        >
          <div class="border-b border-white/[0.07] px-5 py-5 sm:px-7">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"
              >
                <Info class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-lg font-bold">Thông tin cơ bản</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Thông tin định danh, giá và cấu hình tour.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-8 p-5 sm:p-7">
            <!-- Name and slug -->
            <div class="grid gap-5 lg:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-300">
                  Tên tour <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  maxlength="200"
                  placeholder="Ví dụ: Khám phá Đà Nẵng 3 ngày 2 đêm"
                  class="w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                  :class="{ 'border-red-500': errors.name }"
                />
                <p v-if="errors.name" class="mt-2 text-xs text-red-400">
                  {{ errors.name }}
                </p>
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-300">
                  Slug <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.slug"
                  type="text"
                  maxlength="220"
                  placeholder="kham-pha-da-nang"
                  class="w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                  :class="{ 'border-red-500': errors.slug }"
                  @input="slugManuallyEdited = true"
                />
                <p v-if="errors.slug" class="mt-2 text-xs text-red-400">
                  {{ errors.slug }}
                </p>
                <p v-else class="mt-2 text-xs text-gray-500">
                  Dùng chữ thường, số và dấu gạch ngang.
                </p>
              </div>
            </div>

            <!-- Operator and category -->
            <div class="grid gap-5 lg:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-300">
                  Nhà điều hành <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="form.operator_id"
                    class="w-full appearance-none rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 pr-10 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                    :class="{ 'border-red-500': errors.operator_id }"
                  >
                    <option value="" disabled>Chọn nhà điều hành</option>
                    <option
                      v-for="operator in operators"
                      :key="operator.id"
                      :value="normalizeId(operator.id)"
                    >
                      {{
                        operator.name ||
                        operator.company_name ||
                        operator.full_name ||
                        `Nhà điều hành #${operator.id}`
                      }}
                    </option>
                  </select>
                  <ChevronDown
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                  />
                </div>
                <p v-if="errors.operator_id" class="mt-2 text-xs text-red-400">
                  {{ errors.operator_id }}
                </p>
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-300">
                  Danh mục <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="form.category_id"
                    class="w-full appearance-none rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 pr-10 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                    :class="{ 'border-red-500': errors.category_id }"
                  >
                    <option value="" disabled>Chọn danh mục tour</option>
                    <option
                      v-for="category in categories"
                      :key="category.id"
                      :value="normalizeId(category.id)"
                    >
                      {{
                        category.name ||
                        category.title ||
                        `Danh mục #${category.id}`
                      }}
                    </option>
                  </select>
                  <ChevronDown
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                  />
                </div>
                <p v-if="errors.category_id" class="mt-2 text-xs text-red-400">
                  {{ errors.category_id }}
                </p>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-300">
                Mô tả tour
              </label>
              <textarea
                v-model="form.description"
                rows="5"
                placeholder="Giới thiệu hành trình, trải nghiệm nổi bật và thông tin dành cho khách..."
                class="w-full resize-y rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <!-- Tour types -->
            <div>
              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <label class="text-sm font-semibold text-gray-300">
                  Loại tour hỗ trợ <span class="text-red-400">*</span>
                </label>
                <span class="text-xs text-gray-500">
                  Có thể chọn nhiều loại
                </span>
              </div>

              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  v-for="type in TOUR_TYPES"
                  :key="type.value"
                  type="button"
                  class="rounded-2xl border p-4 text-left transition"
                  :class="
                    form.supported_tour_types.includes(type.value)
                      ? 'border-orange-500/60 bg-orange-500/[0.08] ring-1 ring-orange-500/20'
                      : 'border-white/[0.08] bg-[#090d14] hover:border-white/20'
                  "
                  @click="toggleTourType(type.value)"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="font-bold"
                      :class="
                        form.supported_tour_types.includes(type.value)
                          ? 'text-orange-300'
                          : 'text-gray-200'
                      "
                    >
                      {{ type.label }}
                    </span>
                    <CheckCircle2
                      v-if="form.supported_tour_types.includes(type.value)"
                      class="h-5 w-5 text-orange-400"
                    />
                    <span
                      v-else
                      class="h-5 w-5 rounded-full border border-white/20"
                    />
                  </div>
                  <p class="mt-3 text-xs leading-5 text-gray-500">
                    {{ type.description }}
                  </p>
                </button>
              </div>

              <p
                v-if="errors.supported_tour_types"
                class="mt-2 text-xs text-red-400"
              >
                {{ errors.supported_tour_types }}
              </p>
            </div>

            <!-- Customizable -->
            <label
              class="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#090d14] p-4 transition hover:border-orange-500/30"
            >
              <input
                v-model="form.is_customizable"
                type="checkbox"
                class="mt-1 h-4 w-4 accent-orange-500"
              />
              <span>
                <span class="block text-sm font-semibold text-gray-200">
                  Cho phép tùy chỉnh tour
                </span>
                <span class="mt-1 block text-xs leading-5 text-gray-500">
                  Lưu trạng thái vào trường is_customizable, cho phép khách yêu
                  cầu thay đổi hành trình theo chính sách của tour.
                </span>
              </span>
            </label>

            <!-- Price and capacity -->
            <div>
              <div class="mb-4">
                <h3 class="text-sm font-bold text-gray-200">Giá và sức chứa</h3>
                <p class="mt-1 text-xs text-gray-500">
                  Dữ liệu tương ứng base_price, min_people và max_people.
                </p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Giá cơ bản (VND) <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <Wallet
                      class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      v-model.number="form.base_price"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="1500000"
                      class="w-full rounded-xl border border-white/10 bg-[#090d14] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                      :class="{ 'border-red-500': errors.base_price }"
                    />
                  </div>
                  <p class="mt-2 text-xs text-orange-300">
                    {{ formatCurrency(form.base_price) }}
                  </p>
                  <p v-if="errors.base_price" class="mt-1 text-xs text-red-400">
                    {{ errors.base_price }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Số khách tối thiểu
                  </label>
                  <div class="relative">
                    <Users
                      class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      v-model.number="form.min_people"
                      type="number"
                      min="1"
                      class="w-full rounded-xl border border-white/10 bg-[#090d14] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                      :class="{ 'border-red-500': errors.min_people }"
                    />
                  </div>
                  <p v-if="errors.min_people" class="mt-2 text-xs text-red-400">
                    {{ errors.min_people }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Số khách tối đa
                  </label>
                  <div class="relative">
                    <Users
                      class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      v-model.number="form.max_people"
                      type="number"
                      min="1"
                      class="w-full rounded-xl border border-white/10 bg-[#090d14] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                      :class="{ 'border-red-500': errors.max_people }"
                    />
                  </div>
                  <p v-if="errors.max_people" class="mt-2 text-xs text-red-400">
                    {{ errors.max_people }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Duration -->
            <div>
              <h3 class="mb-4 text-sm font-bold text-gray-200">
                Thời lượng tour
              </h3>

              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Số ngày
                  </label>
                  <input
                    v-model.number="form.duration_days"
                    type="number"
                    min="1"
                    max="60"
                    class="w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                    :class="{ 'border-red-500': errors.duration_days }"
                  />
                  <p
                    v-if="errors.duration_days"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors.duration_days }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Số đêm
                  </label>
                  <input
                    v-model.number="form.duration_nights"
                    type="number"
                    min="0"
                    max="60"
                    class="w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                    :class="{ 'border-red-500': errors.duration_nights }"
                  />
                  <p
                    v-if="errors.duration_nights"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors.duration_nights }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Độ khó
                  </label>
                  <div class="relative">
                    <select
                      v-model="form.difficulty_level"
                      class="w-full appearance-none rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 pr-10 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                    >
                      <option
                        v-for="item in DIFFICULTIES"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </option>
                    </select>
                    <ChevronDown
                      class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-semibold text-gray-300">
                    Phương tiện
                  </label>
                  <div class="relative">
                    <Bus
                      class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                    <select
                      v-model="form.transportation"
                      class="w-full appearance-none rounded-xl border border-white/10 bg-[#090d14] py-3.5 pl-11 pr-10 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                    >
                      <option
                        v-for="item in TRANSPORTATIONS"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </option>
                    </select>
                    <ChevronDown
                      class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-300">
                Trạng thái tour
              </label>
              <div class="relative max-w-md">
                <select
                  v-model="form.status"
                  class="w-full appearance-none rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 pr-10 text-sm text-white outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm ẩn</option>
                  <option value="draft">Bản nháp</option>
                </select>
                <ChevronDown
                  class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            <!-- Thumbnail -->
            <div>
              <div class="mb-3">
                <h3 class="text-sm font-bold text-gray-200">
                  Ảnh đại diện tour
                </h3>
                <p class="mt-1 text-xs text-gray-500">
                  Chọn ảnh rõ nét, dung lượng tối đa 5 MB.
                </p>
              </div>

              <input
                ref="thumbnailInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="selectThumbnail"
              />

              <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <button
                  type="button"
                  class="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#090d14] p-6 text-center transition hover:border-orange-500/50 hover:bg-orange-500/[0.03]"
                  @click="thumbnailInput?.click()"
                >
                  <div
                    class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400"
                  >
                    <Upload class="h-5 w-5" />
                  </div>
                  <span class="text-sm font-semibold text-gray-200">
                    Chọn ảnh đại diện
                  </span>
                  <span class="mt-2 text-xs text-gray-500">
                    PNG, JPG, WEBP
                  </span>
                </button>

                <div
                  class="relative min-h-48 overflow-hidden rounded-2xl border border-white/10 bg-[#090d14]"
                >
                  <img
                    v-if="thumbnailPreview"
                    :src="thumbnailPreview"
                    alt="Xem trước ảnh đại diện"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="absolute inset-0 flex flex-col items-center justify-center text-gray-600"
                  >
                    <ImageIcon class="mb-2 h-8 w-8" />
                    <span class="text-xs">Chưa có ảnh xem trước</span>
                  </div>

                  <button
                    v-if="thumbnailPreview"
                    type="button"
                    class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/70 text-white transition hover:bg-red-500"
                    aria-label="Xóa ảnh đại diện"
                    @click="clearThumbnail"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Gallery -->
            <div>
              <div
                class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 class="text-sm font-bold text-gray-200">
                    Thư viện ảnh tour
                  </h3>
                  <p class="mt-1 text-xs text-gray-500">
                    Tối đa 12 ảnh, mỗi ảnh tối đa 5 MB.
                  </p>
                </div>

                <button
                  type="button"
                  :disabled="galleryFiles.length >= 12"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-orange-500/40 hover:text-white disabled:opacity-40"
                  @click="galleryInput?.click()"
                >
                  <Plus class="h-4 w-4" />
                  Thêm ảnh
                </button>

                <input
                  ref="galleryInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="selectGallery"
                />
              </div>

              <div
                v-if="galleryPreviews.length"
                class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
              >
                <div
                  v-for="(item, index) in galleryPreviews"
                  :key="item.id"
                  class="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#090d14]"
                >
                  <img
                    :src="item.url"
                    :alt="`Ảnh tour ${index + 1}`"
                    class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div
                    class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3"
                  >
                    <span class="text-xs font-semibold text-white">
                      Ảnh {{ index + 1 }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-100 transition hover:bg-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Xóa ảnh"
                    @click="removeGalleryImage(index)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                v-else
                class="rounded-2xl border border-dashed border-white/10 bg-[#090d14] px-4 py-8 text-center"
              >
                <ImageIcon class="mx-auto h-7 w-7 text-gray-600" />
                <p class="mt-2 text-sm text-gray-500">
                  Chưa thêm ảnh vào thư viện.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- =================================================
             SECTION 2: SCHEDULES
        ================================================== -->
        <section
          id="section-schedule"
          class="scroll-mt-28 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111722]"
        >
          <div
            class="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-7"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400"
              >
                <CalendarDays class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-lg font-bold">Lịch khởi hành</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Cấu hình ngày giờ, loại tour và sức chứa từng lịch.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition hover:bg-purple-500/20"
              @click="addSchedule"
            >
              <Plus class="h-4 w-4" />
              Thêm lịch
            </button>
          </div>

          <div class="space-y-4 p-5 sm:p-7">
            <div
              v-if="!form.schedules.length"
              class="rounded-2xl border border-dashed border-white/10 bg-[#090d14] px-4 py-10 text-center"
            >
              <CalendarDays class="mx-auto h-8 w-8 text-gray-600" />
              <p class="mt-3 font-semibold text-gray-300">
                Chưa có lịch khởi hành
              </p>
              <p class="mt-1 text-sm text-gray-500">
                Thêm lịch nếu tour đã có ngày khởi hành dự kiến.
              </p>
              <button
                type="button"
                class="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-500/20"
                @click="addSchedule"
              >
                <Plus class="h-4 w-4" />
                Thêm lịch đầu tiên
              </button>
            </div>

            <article
              v-for="(schedule, index) in form.schedules"
              :key="schedule._key"
              class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090d14]"
            >
              <div
                class="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-sm font-bold text-purple-300"
                  >
                    {{ index + 1 }}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-gray-200">
                      Lịch khởi hành {{ index + 1 }}
                    </h3>
                    <p class="mt-1 text-xs text-gray-500">
                      Trạng thái:
                      {{
                        schedule.status === "open" ? "Đang mở" : schedule.status
                      }}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Xóa lịch khởi hành"
                  @click="removeSchedule(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>

              <div class="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Loại tour
                  </label>
                  <select
                    v-model="schedule.tour_type"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                    @change="updateScheduleType(schedule)"
                  >
                    <option
                      v-for="type in TOUR_TYPES.filter((item) =>
                        form.supported_tour_types.includes(item.value),
                      )"
                      :key="type.value"
                      :value="type.value"
                    >
                      {{ type.label }}
                    </option>
                  </select>
                  <p
                    v-if="errors[`schedule_${index}_tour_type`]"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors[`schedule_${index}_tour_type`] }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Ngày khởi hành
                  </label>
                  <input
                    v-model="schedule.departure_date"
                    type="date"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                  />
                  <p
                    v-if="errors[`schedule_${index}_departure_date`]"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors[`schedule_${index}_departure_date`] }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Giờ khởi hành
                  </label>
                  <input
                    v-model="schedule.departure_time"
                    type="time"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                  />
                  <p
                    v-if="errors[`schedule_${index}_departure_time`]"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors[`schedule_${index}_departure_time`] }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Ngày về
                  </label>
                  <input
                    v-model="schedule.return_date"
                    type="date"
                    :min="schedule.departure_date || undefined"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                  />
                  <p
                    v-if="errors[`schedule_${index}_return_date`]"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors[`schedule_${index}_return_date`] }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Giờ về
                  </label>
                  <input
                    v-model="schedule.return_time"
                    type="time"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Trạng thái lịch
                  </label>
                  <select
                    v-model="schedule.status"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                  >
                    <option value="open">Đang mở</option>
                    <option value="closed">Đã đóng</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Tổng số chỗ
                  </label>
                  <input
                    v-model.number="schedule.total_slots"
                    type="number"
                    min="0"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                    @input="
                      schedule._slotsEdited = true;
                      updateScheduleSlots(schedule);
                    "
                  />
                  <p
                    v-if="errors[`schedule_${index}_total_slots`]"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors[`schedule_${index}_total_slots`] }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold text-gray-400">
                    Số chỗ còn lại
                  </label>
                  <input
                    v-model.number="schedule.available_slots"
                    type="number"
                    min="0"
                    :max="schedule.total_slots"
                    class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-purple-500/60"
                    @input="
                      schedule._slotsEdited = true;
                      updateScheduleSlots(schedule);
                    "
                  />
                  <p
                    v-if="errors[`schedule_${index}_available_slots`]"
                    class="mt-2 text-xs text-red-400"
                  >
                    {{ errors[`schedule_${index}_available_slots`] }}
                  </p>
                </div>
              </div>

              <div
                class="grid gap-3 border-t border-white/[0.06] p-4 sm:grid-cols-2 sm:p-5"
              >
                <label
                  class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                >
                  <input
                    v-model="schedule.is_private"
                    type="checkbox"
                    class="mt-1 h-4 w-4 accent-purple-500"
                  />
                  <span>
                    <span class="block text-sm font-semibold text-gray-300">
                      Tour riêng
                    </span>
                    <span class="mt-1 block text-xs text-gray-500">
                      Lưu vào is_private.
                    </span>
                  </span>
                </label>

                <label
                  class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                >
                  <input
                    v-model="schedule.custom_departure_allowed"
                    type="checkbox"
                    class="mt-1 h-4 w-4 accent-purple-500"
                  />
                  <span>
                    <span class="block text-sm font-semibold text-gray-300">
                      Cho phép ngày khởi hành tùy chỉnh
                    </span>
                    <span class="mt-1 block text-xs text-gray-500">
                      Lưu vào custom_departure_allowed.
                    </span>
                  </span>
                </label>
              </div>
            </article>
          </div>
        </section>

        <!-- =================================================
             SECTION 3: DESTINATIONS
        ================================================== -->
        <section
          id="section-destinations"
          class="scroll-mt-28 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111722]"
        >
          <div
            class="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-7"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"
              >
                <MapPin class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-lg font-bold">Điểm đến</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Sắp xếp thứ tự và ngày tham quan của từng điểm đến.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
              @click="addDestination"
            >
              <Plus class="h-4 w-4" />
              Thêm điểm đến
            </button>
          </div>

          <div class="space-y-4 p-5 sm:p-7">
            <div
              v-if="!form.destinations.length"
              class="rounded-2xl border border-dashed border-white/10 bg-[#090d14] px-4 py-10 text-center"
            >
              <MapPin class="mx-auto h-8 w-8 text-gray-600" />
              <p class="mt-3 font-semibold text-gray-300">Chưa có điểm đến</p>
              <p class="mt-1 text-sm text-gray-500">
                Thêm các địa điểm thuộc hành trình của tour.
              </p>
            </div>

            <article
              v-for="(destination, index) in form.destinations"
              :key="destination._key"
              class="grid items-end gap-4 rounded-2xl border border-white/[0.08] bg-[#090d14] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[100px_minmax(0,1fr)_180px_52px]"
            >
              <div>
                <label class="mb-2 block text-xs font-semibold text-gray-400">
                  Thứ tự
                </label>
                <div
                  class="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-[#111722] font-bold text-emerald-300"
                >
                  {{ index + 1 }}
                </div>
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-gray-400">
                  Địa điểm <span class="text-red-400">*</span>
                </label>
                <select
                  v-model="destination.destination_id"
                  class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/60"
                >
                  <option value="" disabled>Chọn điểm đến</option>
                  <option
                    v-for="item in destinationsList"
                    :key="item.id"
                    :value="normalizeId(item.id)"
                  >
                    {{
                      item.name ||
                      item.destination_name ||
                      `Điểm đến #${item.id}`
                    }}
                  </option>
                </select>
                <p
                  v-if="errors[`destination_${index}`]"
                  class="mt-2 text-xs text-red-400"
                >
                  {{ errors[`destination_${index}`] }}
                </p>
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold text-gray-400">
                  Ngày tham quan
                </label>
                <select
                  v-model.number="destination.day_number"
                  class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/60"
                >
                  <option
                    v-for="day in Math.max(1, Number(form.duration_days) || 1)"
                    :key="day"
                    :value="day"
                  >
                    Ngày {{ day }}
                  </option>
                </select>
                <p
                  v-if="errors[`destination_day_${index}`]"
                  class="mt-2 text-xs text-red-400"
                >
                  {{ errors[`destination_day_${index}`] }}
                </p>
              </div>

              <button
                type="button"
                class="flex h-11 items-center justify-center rounded-xl border border-white/10 text-gray-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                aria-label="Xóa điểm đến"
                @click="removeDestination(index)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </article>
          </div>
        </section>

        <!-- =================================================
             SECTION 4: ITINERARIES
        ================================================== -->
        <section
          id="section-itinerary"
          class="scroll-mt-28 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111722]"
        >
          <div class="border-b border-white/[0.07] px-5 py-5 sm:px-7">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400"
              >
                <ClipboardList class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-lg font-bold">Lịch trình chi tiết</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Mỗi ngày có tiêu đề, mô tả và các hoạt động theo giờ.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-5 p-5 sm:p-7">
            <div
              class="flex items-start gap-3 rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4"
            >
              <Info class="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              <p class="text-xs leading-5 text-gray-400">
                Số ngày trong lịch trình tự đồng bộ theo thời lượng tour. Các
                hoạt động được gửi trong trường activities để backend có thể tạo
                bản ghi itinerary_activities liên kết với từng ngày lịch trình.
              </p>
            </div>

            <article
              v-for="(itinerary, itineraryIndex) in form.itineraries"
              :key="itinerary._key"
              class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090d14]"
            >
              <div
                class="flex items-center gap-3 border-b border-white/[0.06] p-4 sm:p-5"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 font-bold text-sky-300"
                >
                  {{ itinerary.day_number }}
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-gray-200">
                    Ngày {{ itinerary.day_number }}
                  </h3>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ itinerary.activities.length }} hoạt động
                  </p>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-sky-500/30 hover:text-sky-300"
                  @click="addActivity(itinerary)"
                >
                  <Plus class="h-4 w-4" />
                  Thêm hoạt động
                </button>
              </div>

              <div class="space-y-5 p-4 sm:p-5">
                <div class="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label
                      class="mb-2 block text-xs font-semibold text-gray-400"
                    >
                      Tiêu đề ngày
                    </label>
                    <input
                      v-model="itinerary.title"
                      type="text"
                      maxlength="200"
                      :placeholder="`Ngày ${itinerary.day_number}: Khám phá điểm đến`"
                      class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                    />
                  </div>

                  <div>
                    <label
                      class="mb-2 block text-xs font-semibold text-gray-400"
                    >
                      Mô tả ngày
                    </label>
                    <input
                      v-model="itinerary.description"
                      type="text"
                      placeholder="Mô tả ngắn về hoạt động trong ngày"
                      class="w-full rounded-xl border border-white/10 bg-[#111722] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                    />
                  </div>
                </div>

                <div
                  v-if="!itinerary.activities.length"
                  class="rounded-xl border border-dashed border-white/10 px-4 py-7 text-center"
                >
                  <Clock class="mx-auto h-6 w-6 text-gray-600" />
                  <p class="mt-2 text-sm text-gray-500">
                    Chưa có hoạt động cho ngày này.
                  </p>
                  <button
                    type="button"
                    class="mt-3 text-sm font-semibold text-sky-300 hover:text-sky-200"
                    @click="addActivity(itinerary)"
                  >
                    + Thêm hoạt động đầu tiên
                  </button>
                </div>

                <div
                  v-for="(activity, activityIndex) in itinerary.activities"
                  :key="activity._key"
                  class="rounded-2xl border border-white/[0.07] bg-[#111722] p-4 sm:p-5"
                >
                  <div class="mb-4 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-300"
                      >
                        {{ activityIndex + 1 }}
                      </span>
                      <h4 class="text-sm font-bold text-gray-300">
                        Hoạt động {{ activityIndex + 1 }}
                      </h4>
                    </div>

                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Xóa hoạt động"
                      @click="removeActivity(itinerary, activityIndex)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div class="md:col-span-2 xl:col-span-1">
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Tên hoạt động <span class="text-red-400">*</span>
                      </label>
                      <input
                        v-model="activity.title"
                        type="text"
                        maxlength="200"
                        placeholder="Ví dụ: Tham quan Bà Nà Hills"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                        :class="{
                          'border-red-500':
                            errors[
                              `activity_${itineraryIndex}_${activityIndex}`
                            ],
                        }"
                      />
                      <p
                        v-if="
                          errors[`activity_${itineraryIndex}_${activityIndex}`]
                        "
                        class="mt-2 text-xs text-red-400"
                      >
                        {{
                          errors[`activity_${itineraryIndex}_${activityIndex}`]
                        }}
                      </p>
                    </div>

                    <div>
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Loại hoạt động
                      </label>
                      <select
                        v-model="activity.activity_type"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                      >
                        <option
                          v-for="type in ACTIVITY_TYPES"
                          :key="type.value"
                          :value="type.value"
                        >
                          {{ type.label }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Địa điểm hoạt động
                      </label>
                      <select
                        v-model="activity.destination_id"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                      >
                        <option value="">Không gắn điểm đến</option>
                        <option
                          v-for="destination in destinationsList"
                          :key="destination.id"
                          :value="normalizeId(destination.id)"
                        >
                          {{
                            destination.name ||
                            destination.destination_name ||
                            `Điểm đến #${destination.id}`
                          }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Giờ bắt đầu
                      </label>
                      <input
                        v-model="activity.start_time"
                        type="time"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                      />
                    </div>

                    <div>
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Giờ kết thúc
                      </label>
                      <input
                        v-model="activity.end_time"
                        type="time"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                      />
                      <p
                        v-if="
                          errors[
                            `activity_time_${itineraryIndex}_${activityIndex}`
                          ]
                        "
                        class="mt-2 text-xs text-red-400"
                      >
                        {{
                          errors[
                            `activity_time_${itineraryIndex}_${activityIndex}`
                          ]
                        }}
                      </p>
                    </div>

                    <div>
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Phương tiện
                      </label>
                      <input
                        v-model="activity.transportation"
                        type="text"
                        placeholder="Ví dụ: Xe du lịch"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                      />
                    </div>

                    <div>
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Chi phí dự kiến (VND)
                      </label>
                      <input
                        v-model="activity.estimated_cost"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        class="w-full rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm text-white outline-none focus:border-sky-500/60"
                      />
                      <p
                        v-if="
                          errors[
                            `activity_cost_${itineraryIndex}_${activityIndex}`
                          ]
                        "
                        class="mt-2 text-xs text-red-400"
                      >
                        {{
                          errors[
                            `activity_cost_${itineraryIndex}_${activityIndex}`
                          ]
                        }}
                      </p>
                    </div>

                    <div class="md:col-span-2 xl:col-span-2">
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Mô tả hoạt động
                      </label>
                      <textarea
                        v-model="activity.description"
                        rows="2"
                        placeholder="Nội dung và lưu ý cho hoạt động..."
                        class="w-full resize-y rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm leading-5 text-white outline-none focus:border-sky-500/60"
                      />
                    </div>

                    <div class="md:col-span-2 xl:col-span-1">
                      <label
                        class="mb-2 block text-xs font-semibold text-gray-400"
                      >
                        Ghi chú
                      </label>
                      <textarea
                        v-model="activity.note"
                        rows="2"
                        placeholder="Ghi chú thêm..."
                        class="w-full resize-y rounded-xl border border-white/10 bg-[#090d14] px-3 py-3 text-sm leading-5 text-white outline-none focus:border-sky-500/60"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm font-semibold text-gray-400 transition hover:border-sky-500/40 hover:text-sky-300"
                  @click="addActivity(itinerary)"
                >
                  <Plus class="h-4 w-4" />
                  Thêm hoạt động cho ngày {{ itinerary.day_number }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- =================================================
             SUBMIT FOOTER
        ================================================== -->
        <footer
          class="sticky bottom-3 z-20 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#111722]/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:px-6"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"
            >
              <Route class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-bold text-gray-200">Sẵn sàng tạo tour?</p>
              <p class="mt-1 text-xs text-gray-500">
                Giá cơ bản: {{ formatCurrency(form.base_price) }}
                <span class="mx-1 text-gray-700">•</span>
                {{ form.duration_days }} ngày, {{ form.duration_nights }} đêm
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06] sm:flex-none"
              :disabled="loading"
              @click="cancelCreate"
            >
              Hủy
            </button>

            <button
              type="submit"
              :disabled="loading || loadingOptions"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ loading ? "Đang tạo..." : "Xác nhận tạo tour" }}
            </button>
          </div>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  background: #f8fafc;
  color: #475569;
}

.admin-page :deep(h1),
.admin-page :deep(h2),
.admin-page :deep(h3),
.admin-page :deep(h4) {
  color: #0f172a;
}

.admin-page :deep([class*="text-orange-200"]) {
  color: #2563eb;
}

.admin-page :deep(:is([class^="bg-[#"], [class*=" bg-[#"]):not([class~="absolute"]):not([class~="fixed"])),
.admin-page :deep([class*="bg-black/"]:not([class~="absolute"]):not([class~="fixed"])),
.admin-page :deep([class*="bg-white/"]:not([class~="absolute"]):not([class~="fixed"])),
.admin-page :deep([class*="bg-slate-800"]),
.admin-page :deep([class*="bg-slate-900"]) {
  border-color: #e2e8f0;
  background-color: #fff;
  box-shadow: 0 3px 14px rgba(30, 41, 59, 0.06);
  backdrop-filter: none;
}

.admin-page :deep([class*="border-white/"]) {
  border-color: #e2e8f0;
}

.admin-page :deep([class~="text-white"]),
.admin-page :deep([class~="text-slate-100"]),
.admin-page :deep([class~="text-slate-200"]),
.admin-page :deep([class*="text-gray-300"]) {
  color: #334155;
}

.admin-page :deep([class*="text-white/"]),
.admin-page :deep([class*="text-slate-300"]),
.admin-page :deep([class*="text-slate-400"]),
.admin-page :deep([class*="text-slate-500"]),
.admin-page :deep([class*="text-slate-600"]),
.admin-page :deep([class*="text-gray-400"]) {
  color: #64748b;
}

.admin-page :deep([class*="bg-gradient"][class*="text-white"]),
.admin-page :deep([class*="bg-gradient"] [class*="text-white"]),
.admin-page :deep([class*="bg-orange-"] [class*="text-white"]),
.admin-page :deep([class*="bg-emerald-"] [class*="text-white"]),
.admin-page :deep([class*="bg-green-"] [class*="text-white"]),
.admin-page :deep([class*="bg-red-"] [class*="text-white"]),
.admin-page :deep([class*="bg-rose-"] [class*="text-white"]),
.admin-page :deep([class*="bg-blue-"] [class*="text-white"]),
.admin-page :deep([class*="bg-sky-"] [class*="text-white"]),
.admin-page :deep([class*="bg-amber-"] [class*="text-white"]) {
  color: #fff;
}

.admin-page :deep(input),
.admin-page :deep(select),
.admin-page :deep(textarea) {
  border-color: #cbd5e1;
  background-color: #fff;
  color: #1e293b;
}

.admin-page :deep(input::placeholder),
.admin-page :deep(textarea::placeholder) {
  color: #94a3b8;
}

.admin-page :deep(input:focus),
.admin-page :deep(select:focus),
.admin-page :deep(textarea:focus) {
  border-color: #2563eb;
  outline-color: #2563eb;
}

.admin-page :deep(th) {
  background-color: #f8fafc;
  color: #475569;
}

.admin-page :deep(td),
.admin-page :deep(th) {
  border-color: #e2e8f0;
}

@media (max-width: 640px) {
  .admin-page :deep(table) {
    min-width: 640px;
  }
}
</style>
