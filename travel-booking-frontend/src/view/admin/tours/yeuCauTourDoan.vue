<script setup>
import { computed, ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import tourService from "../../../services/tour.service";
import QuotationFormModal from "../../../components/admin/tours/QuotationFormModal.vue";
import QuotationHistory from "../../../components/admin/tours/QuotationHistory.vue";

const queryClient = useQueryClient();

const search = ref("");
const activeFilter = ref("all");
const selectedRequest = ref(null);
const replyContent = ref("");
const notification = ref(null);

const showQuotationForm = ref(false);
const showQuotationHistory = ref(false);
const editingQuotation = ref(null);

const filters = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ tiếp nhận", value: "pending" },
  { label: "Đang báo giá", value: "quoting" },
  { label: "Đã gửi báo giá", value: "quoted" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Từ chối", value: "rejected" },
];

// =========================
// Lấy danh sách yêu cầu tour
// =========================
const {
  data: dataYeuCau,
  isLoading,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ["allYeuCauTourDoan"],
  queryFn: async () => {
    const response = await tourService.getAllYeuCau();
    return response?.data;
  },
  staleTime: 30000,
});

const requests = computed(() => {
  const result = dataYeuCau.value;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.requests)) return result.requests;

  return [];
});

// =========================
// Lấy lịch sử phản hồi
// Chỉ gọi khi mở chi tiết yêu cầu
// =========================
const currentRequestId = computed(() => selectedRequest.value?.id ?? null);

const {
  data: dataLichSuPhanHoi,
  isLoading: isLoadingLichSu,
  isError: isErrorLichSu,
  error: errorLichSu,
  refetch: refetchLichSu,
} = useQuery({
  queryKey: ["lichSuPhanHoi", currentRequestId],
  enabled: computed(() => Boolean(currentRequestId.value)),
  queryFn: async () => {
    if (typeof tourService.getAllLichSuPhanHoi !== "function") {
      throw new Error(
        "tourService chưa có hàm getAllLichSuPhanHoi(requestId).",
      );
    }

    const response = await tourService.getAllLichSuPhanHoi(
      currentRequestId.value,
    );

    const result = response?.data;

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.messages)) return result.messages;
    if (Array.isArray(result?.history)) return result.history;

    return [];
  },
});

// =========================
// Lấy danh sách báo giá
// =========================
const {
  data: dataBaoGia,
  isLoading: isLoadingBaoGia,
  refetch: refetchBaoGia,
} = useQuery({
  queryKey: ["baoGiaTheoYeuCau", currentRequestId],
  enabled: computed(() => Boolean(currentRequestId.value)),
  queryFn: async () => {
    if (typeof tourService.getQuotationsByRequest !== "function") {
      return [];
    }

    const response = await tourService.getQuotationsByRequest(
      currentRequestId.value,
    );

    const result = response?.data;

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.quotations)) return result.quotations;

    return [];
  },
});

const quotations = computed(() => {
  const result = dataBaoGia.value;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.quotations)) return result.quotations;

  return [];
});

// =========================
// Định dạng dữ liệu
// =========================
// Lấy giá trị đầu tiên được cung cấp.
// Hỗ trợ cả dữ liệu API dùng snake_case và camelCase.
function getValue(...values) {
  const value = values.find((item) => {
    if (item === null || item === undefined) return false;
    if (typeof item === "string" && item.trim() === "") return false;
    return true;
  });

  return value ?? "Chưa cung cấp";
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeStatus(status) {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);

  const labels = {
    pending: "Chờ tiếp nhận",
    waiting: "Chờ tiếp nhận",
    quoting: "Đang báo giá",
    quoted: "Đã gửi báo giá",
    confirmed: "Đã xác nhận",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
    completed: "Hoàn thành",
    draft: "Bản nháp",
    sent: "Đã gửi",
    accepted: "Đã thanh toán xác nhận",
    revision_requested: "Yêu cầu sửa báo giá",
    expired: "Đã hết hạn",
  };

  return labels[normalized] ?? status ?? "Chưa xác định";
}

function getStatusClass(status) {
  const normalized = normalizeStatus(status);

  const classes = {
    pending: "bg-amber-100 text-amber-700",
    waiting: "bg-amber-100 text-amber-700",
    quoting: "bg-blue-100 text-blue-700",
    quoted: "bg-teal-100 text-teal-800",
    confirmed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
    canceled: "bg-gray-100 text-gray-700",
    completed: "bg-emerald-100 text-emerald-700",
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    revision_requested: "bg-orange-100 text-orange-700",
    expired: "bg-gray-100 text-gray-700",
  };

  return classes[normalized] ?? "bg-gray-100 text-gray-700";
}

// =========================
// Lấy dữ liệu yêu cầu
// =========================
function getRequestId(item) {
  return item?.id ?? item?.request_id ?? item?.custom_request_id ?? null;
}

function getRequestCode(item) {
  return getValue(
    item?.request_code,
    item?.requestCode,
    item?.code,
    item?.id ? `YC-${item.id}` : null,
  );
}

function getCustomerName(item) {
  return getValue(
    item?.contact_name,
    item?.contactName,
    item?.customer_name,
    item?.customerName,
    item?.company_name,
    item?.companyName,
    item?.user?.full_name,
    item?.user?.name,
    item?.full_name,
    item?.name,
  );
}

function getCustomerEmail(item) {
  return getValue(
    item?.contact_email,
    item?.contactEmail,
    item?.customer_email,
    item?.customerEmail,
    item?.user?.email,
    item?.email,
  );
}

function getCustomerPhone(item) {
  return getValue(
    item?.contact_phone,
    item?.contactPhone,
    item?.customer_phone,
    item?.customerPhone,
    item?.user?.phone,
    item?.phone,
  );
}

function getTourName(item) {
  return getValue(
    item?.tour_name,
    item?.tourName,
    item?.tour?.name,
    item?.tour?.title,
    item?.title,
    item?.tour_id ? `Tour #${item.tour_id}` : null,
    item?.tourId ? `Tour #${item.tourId}` : null,
  );
}

function getRequestStatus(item) {
  return (
    item?.status ?? item?.request_status ?? item?.requestStatus ?? "pending"
  );
}

function getRequestCreatedAt(item) {
  return item?.created_at ?? item?.createdAt ?? item?.created_at_time ?? null;
}

function getRequestDeparture(item) {
  return getValue(
    item?.departure_date,
    item?.departureDate,
    item?.start_date,
    item?.startDate,
  );
}

function getRequestPeople(item) {
  return getValue(
    item?.estimated_pax,
    item?.estimatedPax,
    item?.number_of_people,
    item?.numberOfPeople,
    item?.guest_count,
    item?.guestCount,
    item?.quantity,
  );
}

function getRequestDescription(item) {
  return getValue(
    item?.special_requirements,
    item?.specialRequirements,
    item?.description,
    item?.requirements,
    item?.note,
    item?.message,
  );
}

function getRequestCompany(item) {
  return getValue(item?.company_name, item?.companyName);
}

// =========================
// Tìm kiếm và lọc yêu cầu
// =========================
const filteredRequests = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return requests.value.filter((item) => {
    const matchesSearch =
      !keyword ||
      [
        getRequestCode(item),
        getCustomerName(item),
        getCustomerEmail(item),
        getCustomerPhone(item),
        getTourName(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    const status = normalizeStatus(getRequestStatus(item));

    const matchesStatus =
      activeFilter.value === "all" ||
      status === normalizeStatus(activeFilter.value);

    return matchesSearch && matchesStatus;
  });
});

const requestCounts = computed(() => {
  const result = {
    all: requests.value.length,
    pending: 0,
    quoting: 0,
    quoted: 0,
    confirmed: 0,
    rejected: 0,
  };

  requests.value.forEach((item) => {
    const status = normalizeStatus(getRequestStatus(item));

    if (Object.prototype.hasOwnProperty.call(result, status)) {
      result[status] += 1;
    }
  });

  return result;
});

// =========================
// Thông báo trên giao diện
// =========================
let notificationTimeout = null;

function showNotification(message, type = "success") {
  notification.value = { message, type };

  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notificationTimeout = setTimeout(() => {
    notification.value = null;
    notificationTimeout = null;
  }, 3500);
}

// =========================
// Mở và đóng chi tiết
// =========================
function openDetail(item) {
  selectedRequest.value = item;
  replyContent.value = "";
  showQuotationForm.value = false;
  showQuotationHistory.value = false;
  editingQuotation.value = null;
}

function closeDetail() {
  selectedRequest.value = null;
  replyContent.value = "";
  showQuotationForm.value = false;
  showQuotationHistory.value = false;
  editingQuotation.value = null;
}

// =========================
// Làm mới dữ liệu
// =========================
async function refreshRequestData() {
  await queryClient.invalidateQueries({
    queryKey: ["allYeuCauTourDoan"],
  });

  await queryClient.invalidateQueries({
    queryKey: ["lichSuPhanHoi"],
  });

  await queryClient.invalidateQueries({
    queryKey: ["baoGiaTheoYeuCau"],
  });

  await refetch();

  if (currentRequestId.value) {
    await Promise.allSettled([refetchLichSu(), refetchBaoGia()]);
  }
}

// =========================
// Gửi phản hồi yêu cầu
// =========================
const replyMutation = useMutation({
  mutationFn: async ({ requestId, content }) => {
    if (typeof tourService.phanHoi !== "function") {
      throw new Error("tourService chưa có hàm phanHoi(data).");
    }

    return tourService.phanHoi({
      request_id: String(requestId),
      message: content,
    });
  },

  onSuccess: async () => {
    showNotification("Đã gửi phản hồi cho khách hàng.");
    replyContent.value = "";
    await refreshRequestData();
  },

  onError: (err) => {
    showNotification(
      err?.response?.data?.message ?? err?.message ?? "Không thể gửi phản hồi.",
      "error",
    );
  },
});

function submitReply() {
  const content = replyContent.value.trim();
  const requestId = getRequestId(selectedRequest.value);

  if (!requestId) {
    showNotification("Không xác định được yêu cầu tour.", "error");
    return;
  }

  if (!content) {
    showNotification("Vui lòng nhập nội dung phản hồi.", "error");
    return;
  }

  replyMutation.mutate({
    requestId,
    content,
  });
}

// =========================
// Báo giá
// =========================
function openCreateQuotation() {
  if (!selectedRequest.value) {
    showNotification("Vui lòng chọn yêu cầu tour.", "error");
    return;
  }

  const tourId =
    selectedRequest.value?.tour_id ??
    selectedRequest.value?.tourId ??
    selectedRequest.value?.tour?.id ??
    null;

  if (!tourId) {
    showNotification(
      "Yêu cầu này chưa liên kết với tour cụ thể. Không thể tự chọn tour khác để báo giá.",
      "error",
    );
    return;
  }

  editingQuotation.value = null;
  showQuotationHistory.value = false;
  showQuotationForm.value = true;
}

function openEditQuotation(quotation) {
  if (!quotation) return;

  const status = normalizeStatus(quotation.status);

  if (status !== "draft") {
    showNotification(
      "Chỉ có thể chỉnh sửa báo giá đang ở trạng thái bản nháp.",
      "error",
    );
    return;
  }

  editingQuotation.value = quotation;
  showQuotationHistory.value = false;
  showQuotationForm.value = true;
}

function openQuotationHistory() {
  showQuotationForm.value = false;
  showQuotationHistory.value = true;
}

function closeQuotationForm() {
  showQuotationForm.value = false;
  editingQuotation.value = null;
}

function closeQuotationHistory() {
  showQuotationHistory.value = false;
}

async function handleQuotationSaved() {
  showQuotationForm.value = false;
  editingQuotation.value = null;

  showNotification("Đã lưu báo giá.");

  await queryClient.invalidateQueries({
    queryKey: ["baoGiaTheoYeuCau"],
  });

  await queryClient.invalidateQueries({
    queryKey: ["allYeuCauTourDoan"],
  });

  await Promise.allSettled([refetchBaoGia(), refetch()]);
}

async function handleQuotationSent() {
  showNotification("Đã gửi báo giá cho khách hàng.");

  await queryClient.invalidateQueries({
    queryKey: ["baoGiaTheoYeuCau"],
  });

  await queryClient.invalidateQueries({
    queryKey: ["allYeuCauTourDoan"],
  });

  await Promise.allSettled([refetchBaoGia(), refetch()]);
}

const latestQuotation = computed(() => {
  if (!quotations.value.length) return null;

  return [...quotations.value].sort((a, b) => {
    const versionA = Number(a?.version ?? a?.quotation_version ?? 0);
    const versionB = Number(b?.version ?? b?.quotation_version ?? 0);

    if (versionA !== versionB) {
      return versionB - versionA;
    }

    const dateA = new Date(a?.created_at ?? a?.createdAt ?? 0).getTime();

    const dateB = new Date(b?.created_at ?? b?.createdAt ?? 0).getTime();

    return dateB - dateA;
  })[0];
});

function canCreateQuotation(item) {
  const status = normalizeStatus(getRequestStatus(item));

  return (
    Boolean(item?.tour_id ?? item?.tourId ?? item?.tour?.id) &&
    !["confirmed", "rejected", "cancelled", "canceled"].includes(status)
  );
}

function getQuotationVersion(item) {
  const version = item?.version ?? item?.quotation_version;

  return version ? `Phiên bản ${version}` : "Báo giá";
}

function getQuotationTotal(item) {
  return (
    item?.total ??
    item?.total_amount ??
    item?.totalAmount ??
    item?.pricing?.total ??
    item?.details?.pricing?.total ??
    null
  );
}

// =========================
// Hiển thị lỗi API
// =========================
function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    fallback
  );
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Tiêu đề -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-wider text-orange-600"
          >
            Quản lý tour
          </p>

          <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Yêu cầu tour đoàn
          </h1>

          <p class="mt-2 text-sm text-slate-500">
            Theo dõi yêu cầu, phản hồi khách hàng và quản lý báo giá tour đoàn.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isLoading"
          @click="refetch()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 7v5h-5" />
            <path d="M4 17v-5h5" />
            <path d="M5.6 9A7 7 0 0 1 18 6l2 6" />
            <path d="M18.4 15A7 7 0 0 1 6 18l-2-6" />
          </svg>
          Làm mới
        </button>
      </div>

      <!-- Thông báo -->
      <Transition name="fade">
        <div
          v-if="notification"
          class="fixed right-4 top-4 z-[100] flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg"
          :class="
            notification.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          "
          role="status"
        >
          <svg
            v-if="notification.type === 'error'"
            xmlns="http://www.w3.org/2000/svg"
            class="mt-0.5 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>

          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="mt-0.5 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>

          <p class="text-sm font-medium">
            {{ notification.message }}
          </p>

          <button
            type="button"
            class="ml-2 rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Đóng thông báo"
            @click="notification = null"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Transition>

      <!-- Thống kê -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          class="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="
            activeFilter === filter.value
              ? 'border-orange-300 ring-2 ring-orange-100'
              : 'border-slate-200'
          "
          @click="activeFilter = filter.value"
        >
          <p class="text-xs font-medium text-slate-500">
            {{ filter.label }}
          </p>

          <p class="mt-2 text-2xl font-bold text-slate-900">
            {{
              filter.value === "all"
                ? requestCounts.all
                : (requestCounts[filter.value] ?? 0)
            }}
          </p>
        </button>
      </div>

      <!-- Tìm kiếm -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              v-model="search"
              type="search"
              placeholder="Tìm theo mã yêu cầu, tên, email hoặc số điện thoại..."
              class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <p class="shrink-0 text-sm text-slate-500">
            Hiển thị
            <span class="font-semibold text-slate-900">
              {{ filteredRequests.length }}
            </span>
            /
            <span class="font-semibold text-slate-900">
              {{ requests.length }}
            </span>
            yêu cầu
          </p>
        </div>
      </div>

      <!-- Trạng thái tải -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
      >
        <div
          class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"
        />
        <p class="mt-4 text-sm font-medium text-slate-600">
          Đang tải danh sách yêu cầu...
        </p>
      </div>

      <!-- Lỗi tải danh sách -->
      <div
        v-else-if="isError"
        class="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h2 class="mt-4 text-lg font-bold text-slate-900">
          Không thể tải yêu cầu tour
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          {{ getErrorMessage(error, "Đã xảy ra lỗi khi tải dữ liệu.") }}
        </p>

        <button
          type="button"
          class="mt-5 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          @click="refetch()"
        >
          Thử lại
        </button>
      </div>

      <!-- Danh sách rỗng -->
      <div
        v-else-if="filteredRequests.length === 0"
        class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          >
            <path d="M8 6h13M8 12h13M8 18h13" />
            <path d="M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </div>

        <h2 class="mt-4 text-lg font-bold text-slate-900">
          Không tìm thấy yêu cầu
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.
        </p>

        <button
          type="button"
          class="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700"
          @click="
            search = '';
            activeFilter = 'all';
          "
        >
          Xóa bộ lọc
        </button>
      </div>

      <!-- Bảng yêu cầu -->
      <div
        v-else
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="min-w-[1000px] w-full border-collapse text-left">
            <thead class="bg-slate-50">
              <tr class="border-b border-slate-200">
                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Mã yêu cầu
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Khách hàng
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Tour
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Số khách
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Ngày khởi hành
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Trạng thái
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Ngày tạo
                </th>

                <th
                  class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredRequests"
                :key="getRequestId(item)"
                class="transition hover:bg-slate-50/80"
              >
                <td class="px-5 py-4">
                  <span class="font-mono text-sm font-bold text-slate-800">
                    {{ getRequestCode(item) }}
                  </span>
                </td>

                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">
                    {{ getCustomerName(item) }}
                  </p>

                  <p class="mt-1 text-xs text-slate-500">
                    {{ getCustomerEmail(item) }}
                  </p>
                </td>

                <td class="px-5 py-4">
                  <p
                    class="max-w-[220px] truncate text-sm font-medium text-slate-800"
                  >
                    {{ getTourName(item) }}
                  </p>
                </td>

                <td class="px-5 py-4 text-sm text-slate-700">
                  {{ getRequestPeople(item) }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-700">
                  <template
                    v-if="
                      getRequestDeparture(item) !== 'Chưa cung cấp'
                    "
                  >
                    {{ formatDate(getRequestDeparture(item)) }}
                  </template>
                  <template v-else>Chưa cung cấp</template>
                </td>

                <td class="px-5 py-4">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="getStatusClass(getRequestStatus(item))"
                  >
                    {{ getStatusLabel(getRequestStatus(item)) }}
                  </span>
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ formatDate(getRequestCreatedAt(item)) }}
                </td>

                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    @click="openDetail(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Chi tiết
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
          <p class="text-xs text-slate-500">
            Tổng cộng {{ filteredRequests.length }} yêu cầu phù hợp.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal chi tiết yêu cầu -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedRequest"
          class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-3 py-6 backdrop-blur-sm sm:px-6 sm:py-10"
          @click.self="closeDetail"
        >
          <section
            class="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-detail-title"
          >
            <!-- Header modal -->
            <header
              class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7"
            >
              <div class="min-w-0">
                <p
                  class="text-xs font-bold uppercase tracking-wider text-orange-600"
                >
                  Chi tiết yêu cầu tour đoàn
                </p>

                <h2
                  id="request-detail-title"
                  class="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl"
                >
                  {{ getRequestCode(selectedRequest) }}
                </h2>

                <p class="mt-2 text-sm text-slate-500">
                  Ngày tạo:
                  {{ formatDate(getRequestCreatedAt(selectedRequest)) }}
                </p>
              </div>

              <button
                type="button"
                class="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng chi tiết"
                @click="closeDetail"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </header>

            <!-- Nội dung modal -->
            <div
              class="max-h-[calc(100vh-180px)] space-y-6 overflow-y-auto px-5 py-6 sm:px-7"
            >
              <!-- Thông tin khách hàng -->
              <section>
                <div class="mb-4 flex items-center gap-2">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                    </svg>
                  </span>

                  <h3 class="font-bold text-slate-900">Thông tin khách hàng</h3>
                </div>

                <div
                  class="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <div>
                    <p class="text-xs font-medium text-slate-500">Họ và tên</p>

                    <p
                      class="mt-1 break-words text-sm font-semibold text-slate-900"
                    >
                      {{ getCustomerName(selectedRequest) }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-medium text-slate-500">Email</p>

                    <p
                      class="mt-1 break-words text-sm font-semibold text-slate-900"
                    >
                      {{ getCustomerEmail(selectedRequest) }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-medium text-slate-500">
                      Số điện thoại
                    </p>

                    <p
                      class="mt-1 break-words text-sm font-semibold text-slate-900"
                    >
                      {{ getCustomerPhone(selectedRequest) }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-medium text-slate-500">
                      Công ty / Đoàn
                    </p>

                    <p
                      class="mt-1 break-words text-sm font-semibold text-slate-900"
                    >
                      {{ getRequestCompany(selectedRequest) }}
                    </p>
                  </div>
                </div>
              </section>

              <!-- Thông tin tour -->
              <section>
                <div class="mb-4 flex items-center gap-2">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M3 7 12 3l9 4-9 4-9-4Z" />
                      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
                    </svg>
                  </span>

                  <h3 class="font-bold text-slate-900">Thông tin yêu cầu</h3>
                </div>

                <div
                  class="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <div>
                    <p class="text-xs font-medium text-slate-500">
                      Tour được yêu cầu
                    </p>

                    <p class="mt-1 text-sm font-semibold text-slate-900">
                      {{ getTourName(selectedRequest) }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-medium text-slate-500">
                      Số lượng khách
                    </p>

                    <p class="mt-1 text-sm font-semibold text-slate-900">
                      {{ getRequestPeople(selectedRequest) }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-medium text-slate-500">
                      Ngày khởi hành dự kiến
                    </p>

                    <p class="mt-1 text-sm font-semibold text-slate-900">
                      <template
                        v-if="
                          getRequestDeparture(selectedRequest) !==
                          'Chưa cung cấp'
                        "
                      >
                        {{ formatDate(getRequestDeparture(selectedRequest)) }}
                      </template>
                      <template v-else>Chưa cung cấp</template>
                    </p>
                  </div>

                  <div class="sm:col-span-2 lg:col-span-3">
                    <p class="text-xs font-medium text-slate-500">
                      Mô tả và yêu cầu đặc biệt
                    </p>

                    <p
                      class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700"
                    >
                      {{ getRequestDescription(selectedRequest) }}
                    </p>
                  </div>

                  <div class="sm:col-span-2 lg:col-span-3">
                    <p class="text-xs font-medium text-slate-500">
                      Trạng thái yêu cầu
                    </p>

                    <span
                      class="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      :class="getStatusClass(getRequestStatus(selectedRequest))"
                    >
                      {{ getStatusLabel(getRequestStatus(selectedRequest)) }}
                    </span>
                  </div>
                </div>
              </section>

              <!-- Quản lý báo giá -->
              <section
                class="overflow-hidden rounded-xl border border-orange-200"
              >
                <div
                  class="flex flex-col gap-3 bg-orange-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 class="font-bold text-slate-900">Báo giá tour đoàn</h3>

                    <p class="mt-1 text-xs leading-5 text-slate-600">
                      Tạo báo giá cho đúng tour liên kết với yêu cầu, xem lịch
                      sử phiên bản và gửi báo giá cho khách hàng.
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="isLoadingBaoGia"
                      @click="openQuotationHistory"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      Lịch sử báo giá
                    </button>

                    <button
                      v-if="canCreateQuotation(selectedRequest)"
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
                      @click="openCreateQuotation"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Tạo báo giá
                    </button>
                  </div>
                </div>

                <div class="p-4 sm:p-5">
                  <div
                    v-if="isLoadingBaoGia"
                    class="py-6 text-center text-sm text-slate-500"
                  >
                    Đang tải thông tin báo giá...
                  </div>

                  <div
                    v-else-if="latestQuotation"
                    class="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div
                      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <h4 class="font-bold text-slate-900">
                            {{ getQuotationVersion(latestQuotation) }}
                          </h4>

                          <span
                            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                            :class="getStatusClass(latestQuotation.status)"
                          >
                            {{ getStatusLabel(latestQuotation.status) }}
                          </span>
                        </div>

                        <p class="mt-2 text-sm text-slate-500">
                          Tạo lúc:
                          {{
                            formatDate(
                              latestQuotation.created_at ??
                                latestQuotation.createdAt,
                            )
                          }}
                        </p>
                      </div>

                      <p class="text-lg font-bold text-orange-700">
                        {{
                          getQuotationTotal(latestQuotation) !== null
                            ? formatCurrency(getQuotationTotal(latestQuotation))
                            : "Chưa có tổng tiền"
                        }}
                      </p>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        @click="openQuotationHistory"
                      >
                        Xem các phiên bản
                      </button>

                      <button
                        v-if="
                          normalizeStatus(latestQuotation.status) === 'draft'
                        "
                        type="button"
                        class="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                        @click="openEditQuotation(latestQuotation)"
                      >
                        Tiếp tục chỉnh sửa
                      </button>
                    </div>
                  </div>

                  <div
                    v-else
                    class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center"
                  >
                    <p class="text-sm font-semibold text-slate-700">
                      Chưa có báo giá cho yêu cầu này
                    </p>

                    <p class="mt-1 text-xs leading-5 text-slate-500">
                      Tạo báo giá mới để gửi chi tiết chi phí cho khách hàng.
                    </p>
                  </div>
                </div>
              </section>

              <!-- Lịch sử phản hồi -->
              <section>
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"
                        />
                      </svg>
                    </span>

                    <h3 class="font-bold text-slate-900">Lịch sử phản hồi</h3>
                  </div>

                  <button
                    type="button"
                    class="text-sm font-semibold text-orange-600 hover:text-orange-700"
                    @click="refetchLichSu()"
                  >
                    Làm mới
                  </button>
                </div>

                <div
                  v-if="isLoadingLichSu"
                  class="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500"
                >
                  Đang tải lịch sử phản hồi...
                </div>

                <div
                  v-else-if="isErrorLichSu"
                  class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {{
                    getErrorMessage(
                      errorLichSu,
                      "Không thể tải lịch sử phản hồi.",
                    )
                  }}
                </div>

                <div
                  v-else-if="!dataLichSuPhanHoi?.length"
                  class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center"
                >
                  <p class="text-sm text-slate-500">
                    Chưa có phản hồi nào cho yêu cầu này.
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <article
                    v-for="(message, index) in dataLichSuPhanHoi"
                    :key="message.id ?? message.created_at ?? index"
                    class="rounded-xl border border-slate-200 p-4"
                  >
                    <div
                      class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p class="text-sm font-bold text-slate-900">
                          {{
                            getValue(
                              message.sender?.full_name,
                              message.sender?.email,
                              message.sender_name,
                              message.senderName,
                              message.user?.full_name,
                              message.user?.name,
                              message.role_name,
                              message.role,
                              "Người gửi",
                            )
                          }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                          {{
                            formatDate(
                              message.created_at ??
                                message.createdAt ??
                                message.sent_at,
                            )
                          }}
                        </p>
                      </div>

                      <span
                        v-if="message.message_type || message.type"
                        class="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {{
                          getStatusLabel(message.message_type ?? message.type)
                        }}
                      </span>
                    </div>

                    <p
                      class="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-700"
                    >
                      {{
                        getValue(
                          message.message,
                          message.content,
                          message.message_content,
                          message.reply,
                        )
                      }}
                    </p>
                  </article>
                </div>
              </section>

              <!-- Gửi phản hồi -->
              <section class="rounded-xl border border-slate-200 p-4 sm:p-5">
                <h3 class="font-bold text-slate-900">
                  Gửi phản hồi cho khách hàng
                </h3>

                <p class="mt-1 text-xs leading-5 text-slate-500">
                  Nội dung phản hồi sẽ được gửi qua API hiện có của hệ thống.
                </p>

                <textarea
                  v-model="replyContent"
                  rows="4"
                  maxlength="5000"
                  placeholder="Nhập nội dung phản hồi..."
                  class="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

                <div
                  class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p class="text-xs text-slate-400">
                    {{ replyContent.length }}/5000 ký tự
                  </p>

                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="
                      replyMutation.isPending.value || !replyContent.trim()
                    "
                    @click="submitReply"
                  >
                    <svg
                      v-if="replyMutation.isPending.value"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"
                      />
                    </svg>

                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>

                    {{
                      replyMutation.isPending.value
                        ? "Đang gửi..."
                        : "Gửi phản hồi"
                    }}
                  </button>
                </div>
              </section>
            </div>

            <!-- Footer modal -->
            <footer
              class="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"
            >
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                @click="closeDetail"
              >
                Đóng
              </button>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal tạo/chỉnh sửa báo giá -->
    <QuotationFormModal
      v-if="showQuotationForm && selectedRequest"
      :visible="true"
      :request="selectedRequest"
      :quotation="editingQuotation"
      @close="closeQuotationForm"
      @saved="handleQuotationSaved"
    />

    <!-- Modal lịch sử báo giá -->
    <QuotationHistory
      v-if="showQuotationHistory && selectedRequest"
      :visible="true"
      :request-id="getRequestId(selectedRequest)"
      @close="closeQuotationHistory"
      @create="openCreateQuotation"
      @edit="openEditQuotation"
      @sent="handleQuotationSent"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from section,
.modal-leave-to section {
  transform: translateY(12px) scale(0.99);
}

.modal-enter-active section,
.modal-leave-active section {
  transition: transform 0.2s ease;
}
</style>
