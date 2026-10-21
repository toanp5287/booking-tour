<script setup>
import { computed, onMounted, ref } from "vue";
import tourService from "../../../services/tour.service";
import QuotationDetailModal from "../../../components/customer/tours/QuotationDetailModal.vue";

const isLoading = ref(false);
const errorMessage = ref("");
const requests = ref([]);
const needsLogin = ref(false);
const selectedQuotationId = ref(null);

const isLoggedIn = computed(() => Boolean(localStorage.getItem("accessToken")));

const statusMap = {
  pending: {
    label: "Chờ tiếp nhận",
    class: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  quoting: {
    label: "Đang báo giá",
    class: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  quoted: {
    label: "Đã gửi báo giá",
    class: "bg-teal-50 text-teal-800 ring-teal-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    class: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: {
    label: "Đã từ chối",
    class: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

function requestStatus(status) {
  return (
    statusMap[status] || {
      label: status || "Chưa xác định",
      class: "bg-slate-100 text-slate-600 ring-slate-200",
    }
  );
}

function quotationStatus(status) {
  const map = {
    draft: {
      label: "Bản nháp",
      class: "bg-slate-100 text-slate-600 ring-slate-200",
    },
    sent: {
      label: "Chờ phản hồi",
      class: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    accepted: {
      label: "Đã chấp nhận",
      class: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    revision_requested: {
      label: "Yêu cầu chỉnh sửa",
      class: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    rejected: {
      label: "Đã từ chối",
      class: "bg-rose-50 text-rose-700 ring-rose-200",
    },
    expired: {
      label: "Hết hạn",
      class: "bg-slate-100 text-slate-500 ring-slate-200",
    },
  };
  return (
    map[status] || {
      label: status || "Không xác định",
      class: "bg-slate-100 text-slate-600 ring-slate-200",
    }
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function loadRequests() {
  if (!isLoggedIn.value) {
    needsLogin.value = true;
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await tourService.getMyRequests();
    const body = response?.data;
    requests.value = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
        ? body
        : [];

    console.log(requests.value);
  } catch (error) {
    if (error?.response?.status === 401) {
      needsLogin.value = true;
    } else {
      errorMessage.value =
        error?.response?.data?.message || "Không tải được danh sách yêu cầu.";
    }
  } finally {
    isLoading.value = false;
  }
}

function openQuotation(id) {
  selectedQuotationId.value = String(id);
}

function closeQuotation() {
  selectedQuotationId.value = null;
  loadRequests();
}

onMounted(loadRequests);
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8 mt-20">
    <div class="mx-auto max-w-6xl space-y-6">
      <header>
        <p class="text-sm font-semibold text-travel-teal">TOUR ĐOÀN</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Yêu cầu & báo giá của tôi
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Theo dõi yêu cầu, xem báo giá và phản hồi.
        </p>
      </header>

      <div
        v-if="needsLogin"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"
      >
        <p class="font-semibold text-amber-800">
          Vui lòng đăng nhập để xem yêu cầu tour đoàn của bạn.
        </p>
        <RouterLink
          to="/login"
          class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-travel-orange px-5 py-2.5 text-sm font-semibold text-travel-blue transition hover:bg-amber-500"
          >Đăng nhập</RouterLink
        >
      </div>

      <div
        v-else-if="isLoading"
        class="py-16 text-center text-sm text-slate-500"
      >
        Đang tải...
      </div>

      <div
        v-else-if="errorMessage"
        class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"
      >
        <p class="text-rose-700">{{ errorMessage }}</p>
        <button
          type="button"
          class="mt-3 min-h-11 rounded-xl bg-travel-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          @click="loadRequests"
        >
          Thử lại
        </button>
      </div>

      <div
        v-else-if="!requests.length"
        class="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-500"
      >
        Bạn chưa có yêu cầu tour đoàn nào.
      </div>

      <div v-else class="space-y-5">
        <article
          v-for="request in requests"
          :key="request.id"
          class="travel-surface-interactive rounded-2xl p-5 transition-[transform,border-color,box-shadow] sm:p-6"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold">Yêu cầu #{{ request.id }}</h2>
              <p class="mt-1 text-sm text-slate-500">
                Khởi hành {{ formatDate(request.departure_date) }} ·
                {{ request.estimated_pax }} khách
              </p>
              <p
                v-if="request.tour?.name"
                class="mt-0.5 text-sm text-slate-500"
              >
                Tour: {{ request.tour.name }}
              </p>
            </div>
            <span
              class="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset"
              :class="requestStatus(request.status).class"
            >
              {{ requestStatus(request.status).label }}
            </span>
          </div>

          <div class="mt-4 space-y-2">
            <div
              v-if="!request.quotations?.length"
              class="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500"
            >
              Chưa có báo giá cho yêu cầu này.
            </div>

            <div
              v-for="quotation in request.quotations"
              :key="quotation.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div class="text-sm">
                <p class="font-semibold">
                  Phiên bản {{ quotation.version }}
                  <span
                    class="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset"
                    :class="quotationStatus(quotation.status).class"
                  >
                    {{ quotationStatus(quotation.status).label }}
                  </span>
                </p>
                <p class="mt-1 text-slate-500">
                  Tổng:
                  <span class="font-semibold text-slate-700">{{
                    formatMoney(quotation.total_amount)
                  }}</span>
                  · Cọc: {{ formatMoney(quotation.deposit_amount) }}
                </p>
              </div>
              <button
                type="button"
                class="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-travel-blue transition hover:bg-travel-primary-soft"
                @click="openQuotation(quotation.id)"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <QuotationDetailModal
      :visible="Boolean(selectedQuotationId)"
      :quotation-id="selectedQuotationId"
      @close="closeQuotation"
    />
  </div>
</template>
