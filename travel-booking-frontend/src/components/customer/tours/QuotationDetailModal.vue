<script setup>
import { computed, ref, watch } from "vue";
import tourService from "../../../services/tour.service";

const props = defineProps({
  visible: { type: Boolean, default: false },
  quotationId: { type: [String, Number], default: null },
});

const emit = defineEmits(["close", "accepted"]);

const isLoading = ref(false);
const errorMessage = ref("");
const actionError = ref("");
const successMessage = ref("");
const actionLoading = ref("");
const quotation = ref(null);
const showAcceptBox = ref(false);
const showRejectBox = ref(false);
const showRevisionBox = ref(false);
const responseMessage = ref("");

const statusMap = {
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

const isExpiredByDate = computed(() => {
  const value = quotation.value?.valid_until;
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
});

const statusInfo = computed(() => {
  if (isExpiredByDate.value && quotation.value?.status === "sent") {
    return statusMap.expired;
  }
  return (
    statusMap[quotation.value?.status] || {
      label: quotation.value?.status || "—",
      class: "bg-slate-100 text-slate-600 ring-slate-200",
    }
  );
});

const details = computed(() => quotation.value?.details || {});
const items = computed(() =>
  Array.isArray(details.value.items) ? details.value.items : [],
);
const pricing = computed(() => details.value.pricing || {});
const canRespond = computed(
  () => quotation.value?.status === "sent" && !isExpiredByDate.value,
);

const paymentAmount = computed(() => {
  const total = Number(quotation.value?.total_amount || 0);
  const deposit = Number(quotation.value?.deposit_amount || 0);
  return deposit > 0 && deposit < total ? deposit : total;
});

const paymentTypeLabel = computed(() => {
  const total = Number(quotation.value?.total_amount || 0);
  return paymentAmount.value < total ? "tiền cọc" : "thanh toán 100%";
});

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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function itemTotal(item) {
  return Number(item.quantity || 0) * Number(item.unit_price || 0);
}

async function loadQuotation() {
  if (!props.quotationId) return;

  isLoading.value = true;
  errorMessage.value = "";
  actionError.value = "";
  successMessage.value = "";
  quotation.value = null;
  showAcceptBox.value = false;
  showRejectBox.value = false;
  showRevisionBox.value = false;
  responseMessage.value = "";

  try {
    const response = await tourService.getMyQuotation(props.quotationId);

    const body = response?.data;
    const data = body?.data;

    console.log("Toàn bộ báo giá:", data);
    console.log("Total amount:", data?.total_amount);
    console.log("Pricing:", data?.details?.pricing);
    console.log("Deposit amount:", data?.deposit_amount);
    console.log("Pricing deposit:", data?.details?.pricing?.deposit_amount);

    // Giữ toàn bộ dữ liệu báo giá
    quotation.value = data || null;
  } catch (error) {
    console.error("Lỗi tải báo giá:", error);

    errorMessage.value =
      error?.response?.data?.message || "Không tải được báo giá.";
  } finally {
    isLoading.value = false;
  }
}

async function accept() {
  actionError.value = "";
  actionLoading.value = "accept";
  try {
    const response = await tourService.respondQuotation(props.quotationId, {
      action: "accept",
    });
    const url = response?.data?.data?.payment_url;
    if (url) {
      emit("accepted", url);
      window.location.href = url;
    } else {
      actionError.value = "Không nhận được đường dẫn thanh toán.";
    }
  } catch (error) {
    actionError.value =
      error?.response?.data?.message || "Không thể chấp nhận báo giá.";
  } finally {
    actionLoading.value = "";
  }
}

async function respond(action) {
  if (
    (action === "reject" || action === "revision") &&
    !responseMessage.value.trim()
  ) {
    actionError.value = "Vui lòng nhập nội dung.";
    return;
  }
  actionError.value = "";
  actionLoading.value = action;
  try {
    await tourService.respondQuotation(props.quotationId, {
      action,
      message: responseMessage.value.trim() || undefined,
    });
    responseMessage.value = "";
    showRejectBox.value = false;
    showRevisionBox.value = false;
    await loadQuotation();
    successMessage.value =
      action === "reject"
        ? "Bạn đã từ chối báo giá này. Báo giá không còn hiệu lực thanh toán."
        : "Đã gửi yêu cầu chỉnh sửa. Vui lòng chờ Admin xử lý.";
  } catch (error) {
    actionError.value =
      error?.response?.data?.message || "Không thể gửi phản hồi.";
  } finally {
    actionLoading.value = "";
  }
}

watch(
  () => [props.visible, props.quotationId],
  ([visible]) => {
    if (visible) loadQuotation();
  },
);
console.log(quotation.value);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6"
      @click.self="emit('close')"
    >
      <section
        class="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header
          class="flex items-start justify-between gap-4 border-b border-slate-100 bg-sky-50/70 px-5 py-5 sm:px-7"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wider text-sky-600"
            >
              Chi tiết báo giá
            </p>
            <h2 class="mt-1 text-xl font-bold">
              Phiên bản {{ quotation?.version ?? "—" }}
            </h2>
            <p v-if="quotation?.title" class="mt-1 text-sm text-slate-500">
              {{ quotation.title }}
            </p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-500 hover:bg-slate-100"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <div class="max-h-[72vh] space-y-5 overflow-y-auto p-5 sm:p-7">
          <div
            v-if="isLoading"
            class="py-10 text-center text-sm text-slate-500"
          >
            Đang tải...
          </div>
          <div
            v-else-if="errorMessage"
            class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {{ errorMessage }}
          </div>

          <template v-else-if="quotation">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span
                class="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset"
                :class="statusInfo.class"
              >
                {{ statusInfo.label }}
              </span>
              <span class="text-sm text-slate-500"
                >Hiệu lực đến {{ formatDate(quotation.valid_until) }}</span
              >
            </div>

            <section
              class="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm sm:grid-cols-2"
            >
              <div>
                <span class="text-slate-500">Số khách: </span
                ><span class="font-medium">{{
                  details.pax?.total ?? "—"
                }}</span>
              </div>
              <div>
                <span class="text-slate-500">Loại tour: </span
                ><span class="font-medium">{{
                  details.tour_type || "GROUP"
                }}</span>
              </div>
              <div>
                <span class="text-slate-500">Ngày đi: </span
                ><span class="font-medium">{{
                  formatDate(details.departure_date)
                }}</span>
              </div>
              <div>
                <span class="text-slate-500">Ngày về: </span
                ><span class="font-medium">{{
                  formatDate(details.return_date)
                }}</span>
              </div>
            </section>

            <section v-if="details.itinerary">
              <h3 class="mb-2 font-bold text-slate-800">Lịch trình</h3>
              <p
                class="whitespace-pre-line break-words rounded-xl border border-slate-100 p-4 text-sm leading-6 text-slate-600"
              >
                {{ details.itinerary }}
              </p>
            </section>

            <section>
              <h3 class="mb-2 font-bold text-slate-800">Chi tiết chi phí</h3>
              <div class="overflow-hidden rounded-xl border border-slate-100">
                <table class="w-full text-left text-sm">
                  <thead
                    class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"
                  >
                    <tr>
                      <th class="px-4 py-3">Dịch vụ</th>
                      <th class="px-4 py-3 text-center">SL</th>
                      <th class="px-4 py-3 text-right">Đơn giá</th>
                      <th class="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(item, index) in items" :key="index">
                      <td class="px-4 py-3">{{ item.name }}</td>
                      <td class="px-4 py-3 text-center">{{ item.quantity }}</td>
                      <td class="px-4 py-3 text-right">
                        {{ formatMoney(item.unit_price) }}
                      </td>
                      <td class="px-4 py-3 text-right font-medium">
                        {{ formatMoney(itemTotal(item)) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-3 space-y-1 rounded-xl bg-slate-50 p-4 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500">Tạm tính</span
                  ><span>{{ formatMoney(pricing.subtotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Phụ phí</span
                  ><span>{{ formatMoney(pricing.surcharge) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Giảm giá</span
                  ><span>-{{ formatMoney(pricing.discount) }}</span>
                </div>
                <div
                  class="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-sky-700"
                >
                  <span>Tổng cộng</span
                  ><span
                    >{{ formatMoney(quotation?.details?.pricing?.total) }}
                  </span>
                </div>
                <div class="flex justify-between font-semibold">
                  <span>Tiền cọc</span
                  ><span>{{
                    formatMoney(quotation?.details?.pricing?.deposit_amount)
                  }}</span>
                </div>
              </div>
            </section>

            <section
              v-if="quotation.terms || quotation.notes"
              class="grid gap-3 sm:grid-cols-2"
            >
              <div v-if="quotation.terms">
                <h4 class="mb-1 font-semibold text-slate-800">
                  Điều kiện thanh toán / hủy
                </h4>
                <p
                  class="whitespace-pre-line break-words text-sm text-slate-600"
                >
                  {{ quotation.terms }}
                </p>
              </div>
              <div v-if="quotation.notes">
                <h4 class="mb-1 font-semibold text-slate-800">Ghi chú</h4>
                <p
                  class="whitespace-pre-line break-words text-sm text-slate-600"
                >
                  {{ quotation.notes }}
                </p>
              </div>
            </section>

            <section v-if="quotation.negotiation_messages?.length">
              <h3 class="mb-2 font-bold text-slate-800">Lịch sử trao đổi</h3>
              <div class="space-y-2">
                <div
                  v-for="msg in quotation.negotiation_messages"
                  :key="msg.id"
                  class="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span class="font-medium text-slate-700">{{
                      msg.sender?.full_name || "Hệ thống"
                    }}</span>
                    <span class="text-xs text-slate-400">{{
                      formatDateTime(msg.created_at)
                    }}</span>
                  </div>
                  <p
                    class="mt-1 whitespace-pre-line break-words text-slate-600"
                  >
                    {{ msg.message }}
                  </p>
                </div>
              </div>
            </section>

            <div
              v-if="actionError"
              class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {{ actionError }}
            </div>

            <div
              v-if="successMessage"
              class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {{ successMessage }}
            </div>

            <section
              v-if="canRespond"
              class="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-4"
            >
              <h3 class="font-bold text-slate-800">Phản hồi báo giá</h3>

              <div
                v-if="showAcceptBox"
                class="space-y-3 rounded-xl border border-sky-200 bg-white p-4 text-sm"
              >
                <p class="font-semibold text-slate-800">
                  Xác nhận chấp nhận báo giá
                </p>
                <p class="text-slate-600">
                  Bạn sắp chấp nhận
                  <span class="font-semibold"
                    >Phiên bản {{ quotation.version }}</span
                  >
                  <span v-if="quotation.title"> — {{ quotation.title }}</span
                  >.
                </p>
                <ul class="space-y-1 text-slate-600">
                  <li>
                    Tổng cộng:
                    <span class="font-semibold text-slate-800">{{
                      formatMoney(quotation.total_amount)
                    }}</span>
                  </li>
                  <li>
                    Số tiền cần thanh toán ngay ({{ paymentTypeLabel }}):
                    <span class="font-semibold text-sky-700">{{
                      formatMoney(paymentAmount)
                    }}</span>
                  </li>
                  <li>
                    Hình thức thanh toán:
                    <span class="font-semibold">VNPAY</span>
                  </li>
                </ul>
                <p class="text-xs text-slate-500">
                  Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán
                  VNPAY.
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    :disabled="Boolean(actionLoading)"
                    class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    @click="accept"
                  >
                    {{
                      actionLoading === "accept"
                        ? "Đang xử lý..."
                        : "Xác nhận & chuyển thanh toán"
                    }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                    @click="showAcceptBox = false"
                  >
                    Hủy
                  </button>
                </div>
              </div>

              <div
                v-else-if="showRejectBox || showRevisionBox"
                class="space-y-2"
              >
                <textarea
                  v-model="responseMessage"
                  rows="3"
                  maxlength="2000"
                  class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  :placeholder="
                    showRejectBox
                      ? 'Lý do từ chối...'
                      : 'Nội dung cần chỉnh sửa...'
                  "
                ></textarea>
                <div class="flex gap-2">
                  <button
                    type="button"
                    :disabled="Boolean(actionLoading)"
                    class="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    @click="respond(showRejectBox ? 'reject' : 'revision')"
                  >
                    {{ actionLoading ? "Đang gửi..." : "Xác nhận" }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                    @click="
                      showRejectBox = false;
                      showRevisionBox = false;
                    "
                  >
                    Hủy
                  </button>
                </div>
              </div>

              <div v-else class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :disabled="Boolean(actionLoading)"
                  class="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  @click="
                    showAcceptBox = true;
                    actionError = '';
                  "
                >
                  Chấp nhận & thanh toán
                </button>
                <button
                  type="button"
                  :disabled="Boolean(actionLoading)"
                  class="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  @click="
                    showRejectBox = true;
                    actionError = '';
                    successMessage = '';
                  "
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  :disabled="Boolean(actionLoading)"
                  class="rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  @click="
                    showRevisionBox = true;
                    actionError = '';
                    successMessage = '';
                  "
                >
                  Yêu cầu chỉnh sửa
                </button>
              </div>
            </section>
          </template>
        </div>

        <footer
          class="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7"
        >
          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            @click="emit('close')"
          >
            Đóng
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
