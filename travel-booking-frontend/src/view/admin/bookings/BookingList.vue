<script setup>
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import bookingService from "../../../services/booking.service";

const queryClient = useQueryClient();
const processingRefundId = ref(null);

// =========================================
// 1. GET BOOKINGS
// =========================================
const { data: dataBooking, isLoading } = useQuery({
  queryKey: ["bookings"],
  queryFn: async () => {
    const res = await bookingService.getAll();
    return res.data?.data || [];
  },
  staleTime: 1000 * 60 * 3,
});

// =========================================
// 2. FILTER & PAGINATION STATE
// =========================================
const searchQuery = ref("");
const statusFilter = ref("");
const paymentFilter = ref("");
const currentPage = ref(1);
const itemsPerPage = 8;

const resetFilter = () => {
  searchQuery.value = "";
  statusFilter.value = "";
  paymentFilter.value = "";
  currentPage.value = 1;
};

// =========================================
// 3. NOTIFICATION
// =========================================
const notification = ref({
  show: false,
  type: "",
  message: "",
});

let notificationTimer = null;

const showNotification = (type, message) => {
  notification.value = { show: true, type, message };
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    notification.value.show = false;
  }, 2500);
};

// =========================================
// 4. FORMATTERS
// =========================================
const formatCurrency = (val) => {
  if (!val && val !== 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val));
};

const formatDate = (dateStr) => {
  if (!dateStr) return "--/--/----";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =========================================
// 5. STATUS MAPPING & WORKFLOW
// =========================================
const STATUS_MAP = {
  pending: { name: "Chờ duyệt", class: "bg-amber-500/10 text-amber-300" },
  confirmed: { name: "Đã xác nhận", class: "bg-sky-500/10 text-sky-300" },
  paid: { name: "Đã thanh toán", class: "bg-emerald-500/10 text-emerald-300" },
  ready: {
    name: "Sẵn sàng khởi hành",
    class: "bg-indigo-500/10 text-indigo-300",
  },
  ongoing: { name: "Đang diễn ra", class: "bg-purple-500/10 text-purple-300" },
  completed: { name: "Hoàn thành", class: "bg-teal-500/10 text-teal-300" },
  cancelled: { name: "Đã hủy", class: "bg-rose-500/10 text-rose-300" },
  refund_pending: {
    name: "Đang chờ hoàn tiền",
    class: "bg-orange-500/10 text-orange-300",
  },
  refunded: { name: "Đã hoàn tiền", class: "bg-green-500/10 text-green-300" },
};

const getStatusName = (status) => STATUS_MAP[status]?.name || status;
const getStatusClass = (status) =>
  STATUS_MAP[status]?.class || "bg-slate-500/10 text-slate-400";

const isBookingPaid = (booking) => {
  return (
    booking?.status === "paid" ||
    booking?.payments?.some((p) => p?.status === "paid")
  );
};

// Flow các bước duyệt tiếp theo của Admin
const getStatusDuyet = (booking) => {
  if (!booking) return [];
  const currentStatus = booking.status;

  if (currentStatus === "pending") return ["confirmed"];
  if (currentStatus === "confirmed") {
    return isBookingPaid(booking) ? ["paid"] : [];
  }
  if (currentStatus === "paid") return ["ready"];
  if (currentStatus === "ready") return ["ongoing"];
  if (currentStatus === "ongoing") return ["completed"];

  return [];
};

// Admin có thể hủy đơn khi chuyến đi chưa diễn ra hoặc hoàn tất
const canAdminCancel = (status) => {
  return ["pending", "confirmed", "paid", "ready"].includes(status);
};

// =========================================
// 6. ACTIONS (DUYỆT / HỦY / HOÀN TIỀN)
// =========================================
const duyetDon = async (id, status) => {
  if (processingRefundId.value === id) return;

  if (status === "cancelled") {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy đơn booking này không?",
    );
    if (!confirmed) return;
  }

  if (status === "refunded") {
    const confirmed = window.confirm(
      "Xác nhận đã xử lý hoàn tiền cho khách hàng?",
    );
    if (!confirmed) return;
    processingRefundId.value = id;
  }

  try {
    const result = await bookingService.duyetDon(id, { status });

    if (result?.data?.success === false) {
      showNotification(
        "error",
        result?.data?.message || "Cập nhật trạng thái thất bại",
      );
      return;
    }

    showNotification(
      "success",
      `Đã chuyển trạng thái sang "${getStatusName(status)}"`,
    );
    await queryClient.invalidateQueries({ queryKey: ["bookings"] });
  } catch (error) {
    console.error("DUYET DON ERROR:", error);
    showNotification(
      "error",
      error?.response?.data?.message || "Cập nhật trạng thái thất bại",
    );
  } finally {
    if (status === "refunded") {
      processingRefundId.value = null;
    }
  }
};

// =========================================
// 7. KPI STATS
// =========================================
const kpiStats = computed(() => {
  const list = dataBooking.value || [];
  const totalBookings = list.length;
  const totalPeople = list.reduce(
    (acc, b) => acc + (Number(b.total_people) || 0),
    0,
  );
  const pendingCount = list.filter((b) => b.status === "pending").length;
  const paidCount = list.filter((b) => {
    const latestPayment = b.payments?.[0];
    return b.status === "paid" || latestPayment?.status === "paid";
  }).length;

  const paidPercentage = totalBookings
    ? Math.round((paidCount / totalBookings) * 100)
    : 0;
  const totalRevenue = list
    .filter((b) => {
      const latestPayment = b.payments?.[0];
      return b.status === "paid" || latestPayment?.status === "paid";
    })
    .reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);

  return {
    totalBookings,
    totalPeople,
    pendingCount,
    paidCount,
    paidPercentage,
    totalRevenue,
  };
});

// =========================================
// 8. FILTER & PAGINATION LOGIC
// =========================================
const filteredBookings = computed(() => {
  let list = dataBooking.value || [];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((item) => {
      const idMatch = String(item.id).toLowerCase().includes(q);
      const nameMatch = (item.booker_name || "").toLowerCase().includes(q);
      const phoneMatch = (item.booker_phone || "").toLowerCase().includes(q);
      const emailMatch = (item.booker_email || "").toLowerCase().includes(q);
      return idMatch || nameMatch || phoneMatch || emailMatch;
    });
  }

  if (statusFilter.value) {
    list = list.filter((item) => item.status === statusFilter.value);
  }

  if (paymentFilter.value) {
    list = list.filter((item) => {
      const pStatus = item.payments?.[0]?.status || "unpaid";
      if (paymentFilter.value === "paid")
        return item.status === "paid" || pStatus === "paid";
      if (paymentFilter.value === "pending") return pStatus === "pending";
      if (paymentFilter.value === "unpaid")
        return !item.payments?.length || pStatus === "unpaid";
      return true;
    });
  }

  return list;
});

const totalPages = computed(
  () => Math.ceil(filteredBookings.value.length / itemsPerPage) || 1,
);

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredBookings.value.slice(start, start + itemsPerPage);
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-[#0b0f17] font-sans text-slate-200 antialiased selection:bg-amber-500/20 selection:text-amber-200"
  >
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast">
      <div
        v-if="notification.show"
        class="fixed right-6 top-6 z-[9999] flex w-[340px] items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all"
        :class="
          notification.type === 'success'
            ? 'border-emerald-500/30 bg-[#0e171f]/95 text-emerald-300'
            : 'border-rose-500/30 bg-[#191016]/95 text-rose-300'
        "
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          :class="
            notification.type === 'success'
              ? 'bg-emerald-500/15'
              : 'bg-rose-500/15'
          "
        >
          {{ notification.type === "success" ? "✓" : "!" }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold leading-none">
            {{
              notification.type === "success"
                ? "Thao tác thành công"
                : "Có lỗi xảy ra"
            }}
          </p>
          <p class="mt-1 text-xs text-slate-400 line-clamp-2">
            {{ notification.message }}
          </p>
        </div>
        <button
          type="button"
          @click="notification.show = false"
          class="text-slate-400 transition hover:text-white"
        >
          ✕
        </button>
      </div>
    </Transition>

    <!-- LAYOUT CONTAINER -->
    <div
      class="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 sm:px-8"
    >
      <!-- HEADER -->
      <header
        class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.06] bg-[#0b0f17]/90 backdrop-blur-md"
      >
        <div>
          <div
            class="flex items-center gap-2 text-xs font-medium text-amber-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Travel Management Console
          </div>
          <h1
            class="mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl"
          >
            Danh sách đơn đặt tour
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs text-slate-400 sm:inline-flex"
          >
            <span>Tổng dữ liệu:</span>
            <span class="font-mono font-semibold text-white">{{
              dataBooking?.length || 0
            }}</span>
          </div>
          <RouterLink
            class="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/10 transition hover:bg-amber-400 active:scale-95"
            to="/admin/booking/create"
          >
            <span class="text-base font-bold leading-none">+</span>
            <span>Tạo đơn tại quầy</span>
          </RouterLink>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="space-y-6 py-8">
        <!-- KPI CARDS -->
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            class="group rounded-2xl border border-white/[0.06] bg-[#121721] p-5 transition hover:border-white/[0.12]"
          >
            <div
              class="flex items-center justify-between text-xs text-slate-400"
            >
              <span>Tổng lượt đặt</span>
              <span
                class="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-slate-300"
                >{{ kpiStats.totalBookings }} đơn</span
              >
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="font-mono text-2xl font-bold text-white">{{
                kpiStats.totalPeople
              }}</span>
              <span class="text-xs text-slate-400">hành khách</span>
            </div>
          </div>

          <div
            class="rounded-2xl border border-white/[0.06] bg-[#121721] p-5 transition hover:border-white/[0.12]"
          >
            <div
              class="flex items-center justify-between text-xs text-slate-400"
            >
              <span>Đơn chờ duyệt</span>
              <span
                class="rounded-md bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300"
                >Cần xử lý</span
              >
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="font-mono text-2xl font-bold text-amber-400">{{
                kpiStats.pendingCount
              }}</span>
              <span class="text-xs text-slate-400">đang đợi</span>
            </div>
          </div>

          <div
            class="rounded-2xl border border-white/[0.06] bg-[#121721] p-5 transition hover:border-white/[0.12]"
          >
            <div
              class="flex items-center justify-between text-xs text-slate-400"
            >
              <span>Đã thanh toán</span>
              <span
                class="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300"
                >{{ kpiStats.paidPercentage }}%</span
              >
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="font-mono text-2xl font-bold text-emerald-400">{{
                kpiStats.paidCount
              }}</span>
              <span class="text-xs text-slate-400">đã đối soát</span>
            </div>
          </div>

          <div
            class="rounded-2xl border border-white/[0.06] bg-[#121721] p-5 transition hover:border-white/[0.12]"
          >
            <div
              class="flex items-center justify-between text-xs text-slate-400"
            >
              <span>Doanh thu thực tế</span>
              <span class="text-[11px] text-emerald-400">Ghi nhận tức thì</span>
            </div>
            <div class="mt-3">
              <span
                class="font-mono text-2xl font-bold tracking-tight text-white"
                >{{ formatCurrency(kpiStats.totalRevenue) }}</span
              >
            </div>
          </div>
        </section>

        <!-- FILTERS -->
        <section
          class="rounded-2xl border border-white/[0.06] bg-[#121721] p-4"
        >
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <div class="lg:col-span-6">
              <div class="relative">
                <span
                  class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
                  >🔍</span
                >
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Tìm theo mã đơn, khách hàng, số điện thoại..."
                  class="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0b0f17] pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
            </div>

            <div class="lg:col-span-3">
              <select
                v-model="statusFilter"
                class="h-10 w-full cursor-pointer rounded-xl border border-white/[0.08] bg-[#0b0f17] px-3 text-xs text-slate-300 focus:border-amber-400/50 focus:outline-none"
              >
                <option value="">Tất cả trạng thái booking</option>
                <option
                  v-for="(status, key) in STATUS_MAP"
                  :key="key"
                  :value="key"
                >
                  {{ status.name }}
                </option>
              </select>
            </div>

            <div class="lg:col-span-2">
              <select
                v-model="paymentFilter"
                class="h-10 w-full cursor-pointer rounded-xl border border-white/[0.08] bg-[#0b0f17] px-3 text-xs text-slate-300 focus:border-amber-400/50 focus:outline-none"
              >
                <option value="">Mọi giao dịch</option>
                <option value="paid">Đã thanh toán</option>
                <option value="pending">Chờ chuyển khoản</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>
            </div>

            <div class="lg:col-span-1">
              <button
                type="button"
                @click="resetFilter"
                class="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </section>

        <!-- DATA TABLE -->
        <section
          class="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121721] shadow-xl"
        >
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-20 text-slate-400"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"
            ></div>
            <p class="mt-4 text-xs tracking-wide">
              Đang đồng bộ dữ liệu booking...
            </p>
          </div>

          <div
            v-else-if="filteredBookings.length === 0"
            class="py-20 text-center"
          >
            <div class="text-3xl opacity-30">📁</div>
            <p class="mt-2 text-sm font-semibold text-slate-300">
              Không tìm thấy dữ liệu phù hợp
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Hãy thử xóa bớt điều kiện lọc hoặc từ khóa tìm kiếm
            </p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr
                  class="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  <th class="py-3.5 pl-6 pr-3">Mã đơn</th>
                  <th class="px-3 py-3.5">Khách hàng</th>
                  <th class="px-3 py-3.5">Khởi hành / Lịch trình</th>
                  <th class="px-3 py-3.5">Ngày đặt</th>
                  <th class="px-3 py-3.5">Số lượng</th>
                  <th class="px-3 py-3.5">Tổng tiền</th>
                  <th class="px-3 py-3.5">Thanh toán</th>
                  <th class="px-3 py-3.5">Trạng thái</th>
                  <th class="py-3.5 pl-3 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-white/[0.04]">
                <tr
                  v-for="item in paginatedBookings"
                  :key="item.id"
                  class="transition-colors hover:bg-white/[0.02]"
                >
                  <!-- ID -->
                  <td
                    class="py-4 pl-6 pr-3 font-mono font-semibold text-amber-300"
                  >
                    #BK-{{ item.id }}
                  </td>

                  <!-- Khách hàng -->
                  <td class="px-3 py-4">
                    <div class="font-medium text-slate-200">
                      {{ item.booker_name || `Khách User #${item.user_id}` }}
                    </div>
                    <div class="mt-0.5 font-mono text-[11px] text-slate-500">
                      {{ item.booker_phone || "Không có SĐT" }}
                    </div>
                  </td>

                  <!-- Khởi hành -->
                  <td class="max-w-[240px] px-3 py-4">
                    <div
                      class="truncate text-slate-300"
                      :title="item.departure"
                    >
                      {{ item.departure || "Điểm hẹn linh hoạt" }}
                    </div>
                    <div class="mt-0.5 text-[10px] text-slate-500">
                      Tour #{{ item.tour_id }} • Lịch #{{ item.schedule_id }}
                    </div>
                  </td>

                  <!-- Ngày đặt -->
                  <td class="px-3 py-4 font-mono text-slate-400">
                    {{ formatDate(item.created_at) }}
                  </td>

                  <!-- Số người -->
                  <td class="px-3 py-4 text-slate-300">
                    <span class="font-mono font-medium text-white">{{
                      item.total_people
                    }}</span>
                    vé
                  </td>

                  <!-- Tổng tiền -->
                  <td class="px-3 py-4 font-mono font-bold text-amber-400">
                    {{ formatCurrency(item.total_amount) }}
                  </td>

                  <!-- Trạng thái thanh toán -->
                  <td class="px-3 py-4">
                    <div v-if="item.payments && item.payments.length > 0">
                      <span
                        v-if="
                          item.payments[0].status === 'paid' ||
                          item.status === 'paid'
                        "
                        class="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        ></span>
                        Đã thanh toán
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full bg-amber-400"
                        ></span>
                        Chờ thanh toán
                      </span>
                      <div
                        class="mt-1 font-mono text-[10px] uppercase text-slate-500"
                      >
                        {{ item.payments[0].payment_method || "Online" }}
                      </div>
                    </div>
                    <div v-else>
                      <span
                        class="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full bg-rose-400"
                        ></span>
                        Chưa giao dịch
                      </span>
                    </div>
                  </td>

                  <!-- Trạng thái booking -->
                  <td class="px-3 py-4">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                      :class="getStatusClass(item.status)"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {{ getStatusName(item.status) }}
                    </span>
                  </td>

                  <!-- Thao tác Admin -->
                  <td class="py-4 pl-3 pr-6 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Duyệt theo flow tiến trình -->
                      <button
                        v-for="status in getStatusDuyet(item)"
                        :key="status"
                        type="button"
                        class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition hover:bg-amber-500 hover:text-slate-950"
                        @click="duyetDon(item.id, status)"
                      >
                        <span v-if="status === 'confirmed'">Duyệt đơn</span>
                        <span v-else-if="status === 'paid'">Xác nhận tiền</span>
                        <span v-else-if="status === 'ready'">Sẵn sàng đi</span>
                        <span v-else-if="status === 'ongoing'"
                          >Bắt đầu tour</span
                        >
                        <span v-else-if="status === 'completed'"
                          >Hoàn thành</span
                        >
                        <span v-else>→ {{ getStatusName(status) }}</span>
                      </button>

                      <!-- Xử lý hoàn tiền (chỉ hiện khi khách/hệ thống đã tạo yêu cầu hoàn tiền) -->
                      <button
                        v-if="item.status === 'refund_pending'"
                        type="button"
                        @click="duyetDon(item.id, 'refunded')"
                        :disabled="processingRefundId === item.id"
                        class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {{
                          processingRefundId === item.id
                            ? "Đang xử lý..."
                            : "Xác nhận hoàn tiền"
                        }}
                      </button>

                      <!-- Admin Hủy đơn -->
                      <button
                        v-if="canAdminCancel(item.status)"
                        type="button"
                        @click="duyetDon(item.id, 'cancelled')"
                        class="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-500 hover:text-white"
                      >
                        Hủy đơn
                      </button>

                      <!-- Chi tiết đơn -->
                      <RouterLink
                        :to="`/admin/bookingDetail/${item.id}`"
                        class="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Chi tiết
                      </RouterLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PHÂN TRANG -->
          <div
            v-if="filteredBookings.length > 0"
            class="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] bg-white/[0.01] px-6 py-3.5 sm:flex-row"
          >
            <span class="text-xs text-slate-500">
              Đang xem
              <strong class="font-mono text-slate-300">{{
                (currentPage - 1) * itemsPerPage + 1
              }}</strong>
              -
              <strong class="font-mono text-slate-300">{{
                Math.min(currentPage * itemsPerPage, filteredBookings.length)
              }}</strong>
              trong
              <strong class="font-mono text-slate-300">{{
                filteredBookings.length
              }}</strong>
              đơn
            </span>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
                class="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-30"
              >
                Trước
              </button>

              <button
                v-for="page in totalPages"
                :key="page"
                type="button"
                @click="changePage(page)"
                :class="[
                  'h-7 min-w-[28px] rounded-lg px-2 font-mono text-xs font-medium transition',
                  currentPage === page
                    ? 'bg-amber-500 font-bold text-slate-950'
                    : 'border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white',
                ]"
              >
                {{ page }}
              </button>

              <button
                type="button"
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
                class="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-30"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
</style>
