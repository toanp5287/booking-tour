<script setup>
import { ref, computed, watch } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import bookingService from "../../../services/booking.service";
import Swal from "sweetalert2";

const queryClient = useQueryClient();

// =====================================================
// 1. QUERY BOOKINGS
// =====================================================
const {
  data: dataBooking,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["bookings"],
  queryFn: async () => {
    const response = await bookingService.getAll();
    return response?.data?.data || [];
  },
  staleTime: 1000 * 60 * 3,
});

// =====================================================
// 2. FILTER & PAGINATION
// =====================================================
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

watch([searchQuery, statusFilter, paymentFilter], () => {
  currentPage.value = 1;
});

// =====================================================
// 3. TOAST NOTIFICATION
// =====================================================
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

// =====================================================
// 4. FORMATTERS
// =====================================================
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "--/--/----";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/----";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// 5. STATUS MAPPING & BADGES
// =====================================================
const STATUS_MAP = {
  PENDING: {
    name: "Chờ duyệt",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  CONFIRMED: {
    name: "Đã xác nhận",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  LOCKED: {
    name: "Đã khóa",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
  CHECKED_IN: {
    name: "Đã đón khách",
    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  },
  IN_PROGRESS: {
    name: "Tour đang chạy",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  COMPLETED: {
    name: "Đã hoàn thành",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  CANCELLED: {
    name: "Đã hủy",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
  NO_SHOW: {
    name: "Khách không đến",
    badgeClass: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  },
  REFUND_PENDING: {
    name: "Chờ hoàn tiền",
    badgeClass: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  },
  REFUNDED: {
    name: "Đã hoàn tiền",
    badgeClass: "bg-teal-500/10 text-teal-300 border-teal-500/20",
  },
  READY: {
    name: "Đã xác nhận",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  ONGOING: {
    name: "Tour đang chạy",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  PAID: {
    name: "Đã xác nhận",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  CANCELED: {
    name: "Đã hủy",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
  CANCEL: {
    name: "Đã hủy",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
  COMPLETE: {
    name: "Đã hoàn thành",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  FINISHED: {
    name: "Đã hoàn thành",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  NOT_ATTENDED: {
    name: "Khách không đến",
    badgeClass: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  },
};

const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "LOCKED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "REFUND_PENDING",
  "REFUNDED",
];

const normalizeStatus = (status) =>
  String(status ?? "")
    .trim()
    .toUpperCase();

const getStatusName = (status) => {
  const s = normalizeStatus(status);
  return (
    STATUS_MAP[s]?.name || (s ? `Chưa xác định (${s})` : "Chưa xác định")
  );
};

const getStatusClass = (status) =>
  STATUS_MAP[normalizeStatus(status)]?.badgeClass ||
  "bg-slate-500/10 text-slate-400 border-white/10";

// =====================================================
// 6. FINANCIAL HELPERS
// =====================================================
const getTotalAmount = (booking) => Number(booking?.total_amount || 0);

const getPaidAmount = (booking) => {
  if (!booking) return 0;
  if (booking.paid_amount !== undefined && booking.paid_amount !== null) {
    return Number(booking.paid_amount || 0);
  }
  return (booking.payments || [])
    .filter((p) => normalizeStatus(p?.status) === "PAID")
    .reduce((sum, p) => sum + Number(p?.amount || 0), 0);
};

const getRemainingAmount = (booking) => {
  if (
    booking?.remaining_amount !== undefined &&
    booking?.remaining_amount !== null
  ) {
    return Number(booking.remaining_amount || 0);
  }
  return Math.max(getTotalAmount(booking) - getPaidAmount(booking), 0);
};

const isBookingFullyPaid = (booking) => {
  const total = getTotalAmount(booking);
  return total > 0 && getPaidAmount(booking) >= total;
};

const isBookingPartiallyPaid = (booking) => {
  const total = getTotalAmount(booking);
  const paid = getPaidAmount(booking);
  return total > 0 && paid > 0 && paid < total;
};

// =====================================================
// 7. PAYMENT UI BADGES
// =====================================================
const getRefundPaymentState = (booking) => {
  const statuses = (booking?.payments || []).map((p) =>
    normalizeStatus(p?.status),
  );
  if (statuses.includes("REFUND_PENDING")) return "REFUND_PENDING";
  if (statuses.includes("REFUNDED")) return "REFUNDED";
  return null;
};

const getPaymentText = (booking) => {
  if (!booking) return "Chưa thanh toán";
  const st = normalizeStatus(booking.payment_status);

  const refundState = getRefundPaymentState(booking) || st;
  if (refundState === "REFUNDED") return "Đã hoàn tiền";
  if (refundState === "REFUND_PENDING") return "Chờ hoàn tiền";

  if (
    booking.payment_type === "full" ||
    st === "PAID" ||
    isBookingFullyPaid(booking)
  ) {
    return "Đã thanh toán 100%";
  }
  if (
    booking.payment_type === "deposit" ||
    st === "PARTIAL" ||
    isBookingPartiallyPaid(booking)
  ) {
    return "Đã cọc";
  }
  if (
    (booking.payments || []).some(
      (p) => normalizeStatus(p?.status) === "PENDING",
    )
  ) {
    return "Chờ xử lý";
  }
  return "Chưa thanh toán";
};

const getPaymentClass = (booking) => {
  const st = normalizeStatus(booking?.payment_status);
  const refundState = getRefundPaymentState(booking) || st;
  if (refundState === "REFUNDED")
    return "bg-teal-500/10 text-teal-400 border-teal-500/20";
  if (refundState === "REFUND_PENDING")
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (isBookingFullyPaid(booking))
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (isBookingPartiallyPaid(booking))
    return "bg-sky-500/10 text-sky-400 border-sky-500/20";
  return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

const getPaymentDotClass = (booking) => {
  const st = normalizeStatus(booking?.payment_status);
  const refundState = getRefundPaymentState(booking) || st;
  if (refundState === "REFUNDED") return "bg-teal-400";
  if (refundState === "REFUND_PENDING") return "bg-orange-400";
  if (isBookingFullyPaid(booking)) return "bg-emerald-400";
  if (isBookingPartiallyPaid(booking)) return "bg-sky-400";
  return "bg-rose-400";
};

const getPaymentMethodText = (booking) => {
  const payments = booking?.payments || [];
  if (!payments.length) return "Chưa giao dịch";
  const latest = [...payments].sort(
    (a, b) =>
      new Date(b?.created_at || 0).getTime() -
      new Date(a?.created_at || 0).getTime(),
  )[0];
  const m = String(latest?.payment_method || "")
    .trim()
    .toUpperCase();
  return m === "VNPAY"
    ? "VNPAY"
    : m === "COD"
      ? "Tiền mặt (COD)"
      : latest?.payment_method || "Online";
};

// =====================================================
// 8. STATE MACHINE - HÀNH ĐỘNG HỢP LỆ (TỐI ĐA 1-2 NÚT)
// =====================================================
const classifyBookingKind = (booking) => {
  if (!booking) return "REGULAR";

  const tourType = String(booking.selected_tour_type ?? "")
    .trim()
    .toUpperCase();

  if (booking.quotation_id) return "GROUP";
  if (booking.custom_request_id) return "CUSTOM";

  if (tourType === "GROUP") return "GROUP";
  if (tourType === "CUSTOM") return "CUSTOM";

  return "REGULAR";
};

const isRegularTicketBooking = (booking) =>
  classifyBookingKind(booking) === "REGULAR";

const getAvailableActions = (booking) => {
  if (!booking) return [];
  const status = normalizeStatus(booking.status);
  const hasPaid = getPaidAmount(booking) > 0;
  const actions = [];

  switch (status) {
    // 1. PENDING -> CONFIRMED (chỉ khi đã thanh toán) hoặc CANCELLED
    case "PENDING":
      if (hasPaid) {
        actions.push({
          status: "CONFIRMED",
          label: "Duyệt đơn",
          icon: "check_circle",
          variant: "primary",
        });
      }
      actions.push({
        status: "CANCELLED",
        label: "Hủy đơn",
        icon: "cancel",
        variant: "danger",
      });
      break;

    // 2. CONFIRMED -> CHECKED_IN, NO_SHOW (chỉ regular) hoặc CANCELLED
    case "CONFIRMED":
    case "READY":
    case "PAID":
      actions.push({
        status: "CHECKED_IN",
        label: "Check-in",
        icon: "how_to_reg",
        variant: "primary",
      });
      if (isRegularTicketBooking(booking)) {
        actions.push({
          status: "NO_SHOW",
          label: "Vắng mặt",
          icon: "person_off",
          variant: "secondary",
        });
      }
      actions.push({
        status: "CANCELLED",
        label: "Hủy đơn và hoàn tiền",
        icon: "cancel",
        variant: "danger",
      });
      break;

    // 3. CHECKED_IN -> IN_PROGRESS
    case "CHECKED_IN":
      actions.push({
        status: "IN_PROGRESS",
        label: "Bắt đầu chuyến đi",
        icon: "play_circle",
        variant: "primary",
      });
      break;

    // 4. IN_PROGRESS -> COMPLETED
    case "IN_PROGRESS":
    case "ONGOING":
      actions.push({
        status: "COMPLETED",
        label: "Hoàn thành chuyến đi",
        icon: "task_alt",
        variant: "success",
      });
      break;

    // 5. CANCELLED -> REFUND_PENDING (Backend yêu cầu hasPaid mới cho qua)
    case "CANCELLED":
      if (hasPaid) {
        actions.push({
          status: "REFUND_PENDING",
          label: "Xử lý hoàn tiền",
          icon: "currency_exchange",
          variant: "warning",
        });
      }
      break;

    // 6. REFUND_PENDING -> REFUNDED
    case "REFUND_PENDING":
      actions.push({
        status: "REFUNDED",
        label: "Xác nhận đã hoàn tiền",
        icon: "verified",
        variant: "success",
      });
      break;

    // Các trạng thái kết thúc: COMPLETED, NO_SHOW, REFUNDED
    default:
      break;
  }

  return actions;
};

// =====================================================
// 9. CẬP NHẬT TRẠNG THÁI
// =====================================================
// =====================================================
// 9. CẬP NHẬT TRẠNG THÁI
// =====================================================
const actionLoading = ref(new Set());

const duyetDon = async (id, targetStatus) => {
  const norm = normalizeStatus(targetStatus);
  if (!BOOKING_STATUSES.includes(norm)) {
    showNotification("error", "Trạng thái không hợp lệ");
    return;
  }

  if (actionLoading.value.has(id)) return;

  let reason = "";

  // Hủy booking: bắt buộc nhập lý do
  if (norm === "CANCELLED") {
    const result = await Swal.fire({
      title: "Hủy booking",
      html: `
        <div style="text-align:left;line-height:1.7;">
          <p>Vui lòng nhập lý do hủy đơn <strong>#${id}</strong></p>
        </div>
      `,
      input: "textarea",
      inputPlaceholder: "Nhập lý do hủy booking...",
      inputAttributes: { "aria-label": "Lý do hủy booking" },
      showCancelButton: true,
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Quay lại",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Vui lòng nhập lý do hủy booking";
        return null;
      },
    });

    if (!result.isConfirmed) return;
    reason = (result.value || "").trim();
  }

  // Vắng mặt: cảnh báo rõ không hoàn tiền
  if (norm === "NO_SHOW") {
    const result = await Swal.fire({
      title: "Xác nhận khách vắng mặt",
      html: `
        <div style="text-align:left;line-height:1.7;">
          <p>Khách vắng mặt sẽ <strong>mất khoản tiền đã thanh toán</strong> và <strong>không được hoàn tiền</strong>.</p>
          <p style="margin-top:8px;color:#f59e0b;">Thao tác này không thể hoàn tác.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận vắng mặt",
      cancelButtonText: "Quay lại",
      confirmButtonColor: "#6b7280",
      cancelButtonColor: "#9ca3af",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;
  }

  // Các thao tác nguy hiểm khác cũng có xác nhận
  if (norm === "REFUNDED") {
    const result = await Swal.fire({
      title: "Xác nhận đã hoàn tiền",
      text: "Xác nhận đã chuyển tiền hoàn vào ví khách hàng?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;
  }

  if (norm === "REFUND_PENDING") {
    const result = await Swal.fire({
      title: "Gửi yêu cầu hoàn tiền",
      text: "Chuyển đơn sang trạng thái chờ hoàn tiền?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;
  }

  actionLoading.value.add(id);
  try {
    const payload = { status: norm };
    if (reason) payload.reason = reason;

    const res = await bookingService.duyetDon(id, payload);
    if (!res?.data?.success) {
      showNotification("error", res?.data?.message || "Cập nhật đơn thất bại");
      return;
    }

    showNotification("success", res?.data?.message || `Đã chuyển sang "${getStatusName(norm)}"`);
    await queryClient.invalidateQueries({ queryKey: ["bookings"] });
  } catch (err) {
    showNotification(
      "error",
      err?.response?.data?.message || "Lỗi cập nhật trạng thái",
    );
  } finally {
    actionLoading.value.delete(id);
  }
};

// =====================================================
// 10. KPI COMPUTED
// =====================================================
const kpiStats = computed(() => {
  const list = dataBooking.value || [];
  const totalBookings = list.length;
  const totalPeople = list.reduce(
    (sum, b) => sum + Number(b?.total_people || 0),
    0,
  );
  const pendingCount = list.filter(
    (b) => normalizeStatus(b?.status) === "PENDING",
  ).length;
  const paidCount = list.filter((b) => isBookingFullyPaid(b)).length;
  const paidPercentage =
    totalBookings > 0 ? Math.round((paidCount / totalBookings) * 100) : 0;
  const totalRevenue = list.reduce((sum, b) => sum + getPaidAmount(b), 0);
  const totalRemaining = list.reduce(
    (sum, b) => sum + getRemainingAmount(b),
    0,
  );

  return {
    totalBookings,
    totalPeople,
    pendingCount,
    paidCount,
    paidPercentage,
    totalRevenue,
    totalRemaining,
  };
});

// =====================================================
// 11. FILTER & SLICE DATA
// =====================================================
const filteredBookings = computed(() => {
  let list = [...(dataBooking.value || [])];
  const q = searchQuery.value.trim().toLowerCase();

  if (q) {
    list = list.filter((b) => {
      const id = String(b?.id || "").toLowerCase();
      const name = String(b?.booker_name || "").toLowerCase();
      const phone = String(b?.booker_phone || "").toLowerCase();
      const email = String(b?.booker_email || "").toLowerCase();
      return (
        id.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q)
      );
    });
  }

  if (statusFilter.value) {
    list = list.filter(
      (b) => normalizeStatus(b?.status) === normalizeStatus(statusFilter.value),
    );
  }

  if (paymentFilter.value) {
    list = list.filter((b) => {
      if (paymentFilter.value === "paid") return isBookingFullyPaid(b);
      if (paymentFilter.value === "partial") return isBookingPartiallyPaid(b);
      if (paymentFilter.value === "pending") {
        return (b?.payments || []).some(
          (p) => normalizeStatus(p?.status) === "PENDING",
        );
      }
      if (paymentFilter.value === "unpaid") return getPaidAmount(b) <= 0;
      return true;
    });
  }

  return list;
});

const totalPages = computed(() =>
  Math.max(Math.ceil(filteredBookings.value.length / itemsPerPage), 1),
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
  <div class="admin-page min-h-screen bg-[#080b11] p-4 text-white sm:p-6 lg:p-8">
    <div class="mx-auto max-w-[1800px] space-y-6">
      <!-- HEADER -->
      <header
        class="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#0d1119] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <div
            class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
            Quản trị hệ thống
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quản lý đơn đặt tour
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Theo dõi đơn đặt, tiến trình đón khách, vận hành tour và dòng tiền
            hoàn hủy.
          </p>
        </div>

        <RouterLink
          to="/admin"
          class="inline-flex min-h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300 active:scale-95"
        >
          <span class="material-symbols-outlined text-[20px]">dashboard</span>
          Trang quản trị
          <span class="material-symbols-outlined text-[17px]"
            >arrow_outward</span
          >
        </RouterLink>
      </header>

      <!-- TOAST NOTIFICATION -->
      <Transition name="toast">
        <div
          v-if="notification.show"
          class="fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl sm:right-6 sm:top-6"
          :class="
            notification.type === 'success'
              ? 'border-emerald-500/30 bg-[#0c211a]/95 text-emerald-300'
              : 'border-rose-500/30 bg-[#250f16]/95 text-rose-300'
          "
          role="status"
        >
          <span class="material-symbols-outlined shrink-0 text-[21px]">
            {{ notification.type === "success" ? "check_circle" : "error" }}
          </span>
          <span class="break-words text-sm font-medium">{{
            notification.message
          }}</span>
        </div>
      </Transition>

      <!-- KPI METRICS -->
      <section>
        <div class="mb-4">
          <h2 class="font-semibold text-white">Tổng quan đơn đặt</h2>
          <p class="mt-1 text-xs text-slate-500">
            Thống kê vận hành và doanh thu thời gian thực
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div
            class="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119] p-5 transition-all hover:border-white/[0.12]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Tổng đơn
                </p>
                <p
                  class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
                >
                  {{ kpiStats.totalBookings }}
                </p>
                <p class="mt-1 text-xs text-slate-500">Đơn tour toàn sàn</p>
              </div>
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400"
              >
                <span class="material-symbols-outlined"
                  >confirmation_number</span
                >
              </div>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119] p-5 transition-all hover:border-white/[0.12]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Tổng khách
                </p>
                <p
                  class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
                >
                  {{ kpiStats.totalPeople }}
                </p>
                <p class="mt-1 text-xs text-slate-500">Số khách đã đăng ký</p>
              </div>
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400"
              >
                <span class="material-symbols-outlined">groups</span>
              </div>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119] p-5 transition-all hover:border-white/[0.12]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Chờ duyệt
                </p>
                <p
                  class="mt-2 text-2xl font-bold tracking-tight text-amber-300 sm:text-3xl"
                >
                  {{ kpiStats.pendingCount }}
                </p>
                <p class="mt-1 text-xs text-slate-500">Cần admin xác nhận</p>
              </div>
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"
              >
                <span class="material-symbols-outlined">pending_actions</span>
              </div>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119] p-5 transition-all hover:border-white/[0.12]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Đã trả đủ
                </p>
                <p
                  class="mt-2 text-2xl font-bold tracking-tight text-emerald-300 sm:text-3xl"
                >
                  {{ kpiStats.paidCount }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ kpiStats.paidPercentage }}% tổng số đơn
                </p>
              </div>
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"
              >
                <span class="material-symbols-outlined">payments</span>
              </div>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119] p-5 transition-all hover:border-white/[0.12]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Doanh thu thực
                </p>
                <p
                  class="mt-2 break-words text-xl font-bold leading-tight text-orange-300 sm:text-2xl"
                >
                  {{ formatCurrency(kpiStats.totalRevenue) }}
                </p>
                <p class="mt-2 text-xs leading-5 text-slate-500">
                  Chưa thu: {{ formatCurrency(kpiStats.totalRemaining) }}
                </p>
              </div>
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"
              >
                <span class="material-symbols-outlined"
                  >account_balance_wallet</span
                >
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FILTER & SEARCH -->
      <section
        class="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119]"
      >
        <div
          class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"
          >
            <span class="material-symbols-outlined">filter_list</span>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white">Bộ lọc dữ liệu</h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Tra cứu nhanh theo từ khóa, tiến độ tour và thanh toán
            </p>
          </div>
        </div>

        <div
          class="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2 2xl:grid-cols-[minmax(280px,1fr)_220px_220px_auto]"
        >
          <div class="relative min-w-0">
            <span
              class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-500"
            >
              search
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Mã đơn, tên, điện thoại, email..."
              class="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-orange-500/50 focus:bg-orange-500/[0.02] focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <select
            v-model="statusFilter"
            class="w-full rounded-xl border border-white/10 bg-[#0d1119] px-3.5 py-2.5 text-sm text-slate-200 outline-none transition hover:border-white/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Tất cả trạng thái đơn</option>
            <option v-for="key in BOOKING_STATUSES" :key="key" :value="key">
              {{ STATUS_MAP[key]?.name || key }}
            </option>
          </select>

          <select
            v-model="paymentFilter"
            class="w-full rounded-xl border border-white/10 bg-[#0d1119] px-3.5 py-2.5 text-sm text-slate-200 outline-none transition hover:border-white/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="paid">Đã thanh toán đủ</option>
            <option value="partial">Đã cọc</option>
            <option value="pending">Chờ xử lý</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>

          <button
            type="button"
            @click="resetFilter"
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300 active:scale-95"
          >
            <span class="material-symbols-outlined text-[19px]"
              >restart_alt</span
            >
            Đặt lại
          </button>
        </div>
      </section>

      <!-- LOADING -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-white/[0.07] bg-[#0d1119] px-5 py-16 text-center"
      >
        <span
          class="material-symbols-outlined animate-spin text-4xl text-orange-400"
        >
          progress_activity
        </span>
        <p class="mt-4 text-sm font-medium text-slate-300">
          Đang tải dữ liệu đơn tour...
        </p>
      </div>

      <!-- ERROR -->
      <div
        v-else-if="isError"
        class="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] px-5 py-12 text-center"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400"
        >
          <span class="material-symbols-outlined text-3xl">error</span>
        </div>
        <p class="mt-4 font-semibold text-rose-300">Lỗi khi tải danh sách</p>
        <p class="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          {{ error?.message }}
        </p>
      </div>

      <!-- MAIN DATA CONTAINER -->
      <section
        v-else
        class="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1119]"
      >
        <!-- TOP META -->
        <div
          class="flex flex-col gap-4 border-b border-white/[0.07] px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"
            >
              <span class="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <h2 class="font-semibold text-white">Danh sách đơn đặt</h2>
              <p class="mt-0.5 text-xs text-slate-500">
                Hiển thị
                <span class="text-slate-300">{{
                  paginatedBookings.length
                }}</span>
                /
                <span class="text-slate-300">{{
                  filteredBookings.length
                }}</span>
                đơn
              </p>
            </div>
          </div>
          <div
            class="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Hệ thống quản trị
          </div>
        </div>

        <!-- EMPTY -->
        <div
          v-if="paginatedBookings.length === 0"
          class="px-5 py-16 text-center"
        >
          <span class="material-symbols-outlined text-4xl text-slate-600"
            >inbox</span
          >
          <p class="mt-3 font-medium text-slate-300">
            Không có đơn đặt tour phù hợp
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Thử thay đổi từ khóa hoặc điều kiện bộ lọc
          </p>
        </div>

        <!-- DESKTOP TABLE -->
        <div v-else class="hidden overflow-x-auto 2xl:block">
          <table class="w-full min-w-[1300px] border-collapse text-left">
            <thead>
              <tr
                class="border-b border-white/[0.07] bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                <th class="whitespace-nowrap px-5 py-4">Mã đơn</th>
                <th class="px-5 py-4">Khách hàng</th>
                <th class="px-5 py-4">Tour & Khởi hành</th>
                <th class="whitespace-nowrap px-5 py-4">Số khách</th>
                <th class="whitespace-nowrap px-5 py-4">Thanh toán</th>
                <th class="px-5 py-4">Trạng thái</th>
                <th class="whitespace-nowrap px-5 py-4">Ngày đặt</th>
                <th class="whitespace-nowrap px-5 py-4 text-right">
                  Thao tác tiếp theo
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in paginatedBookings"
                :key="item.id"
                class="border-b border-white/[0.045] transition-colors hover:bg-white/[0.02] last:border-0"
              >
                <!-- MÃ ĐƠN -->
                <td
                  class="whitespace-nowrap px-5 py-5 font-mono text-xs font-semibold text-orange-300"
                >
                  <span
                    class="rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-1"
                    >#{{ item.id }}</span
                  >
                </td>

                <!-- KHÁCH HÀNG -->
                <td class="px-5 py-5">
                  <div class="max-w-[200px]">
                    <p class="truncate text-sm font-semibold text-slate-100">
                      {{ item.booker_name || "Chưa có tên" }}
                    </p>
                    <p
                      class="mt-1 flex items-center gap-1 text-xs text-slate-400"
                    >
                      <span class="material-symbols-outlined text-[14px]"
                        >call</span
                      >
                      {{ item.booker_phone || "--" }}
                    </p>
                  </div>
                </td>

                <!-- TOUR -->
                <td class="px-5 py-5">
                  <div class="max-w-[250px]">
                    <p class="line-clamp-2 text-sm font-medium text-slate-200">
                      {{
                        item.tour?.name ||
                        item.tour?.title ||
                        `Tour #${item.tour_id || "--"}`
                      }}
                    </p>
                    <p
                      v-if="item.schedule?.departure_date"
                      class="mt-1 flex items-center gap-1 text-xs text-slate-500"
                    >
                      <span class="material-symbols-outlined text-[14px]"
                        >calendar_month</span
                      >
                      {{ formatDate(item.schedule.departure_date) }}
                    </p>
                  </div>
                </td>

                <!-- SỐ KHÁCH -->
                <td
                  class="whitespace-nowrap px-5 py-5 text-sm font-semibold text-slate-300"
                >
                  {{ item.total_people || 0 }} khách
                </td>

                <!-- TIỀN & THANH TOÁN -->
                <td class="whitespace-nowrap px-5 py-5">
                  <p class="text-sm font-bold text-white">
                    {{ formatCurrency(getTotalAmount(item)) }}
                  </p>
                  <div class="mt-1 flex items-center gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium"
                      :class="getPaymentClass(item)"
                    >
                      <span
                        class="h-1 w-1 rounded-full"
                        :class="getPaymentDotClass(item)"
                      ></span>
                      {{ getPaymentText(item) }}
                    </span>
                    <span class="text-[11px] text-slate-500">{{
                      getPaymentMethodText(item)
                    }}</span>
                  </div>
                </td>

                <!-- TRẠNG THÁI HIỆN TẠI -->
                <td class="px-5 py-5">
                  <span
                    class="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium"
                    :class="getStatusClass(item.status)"
                  >
                    {{ getStatusName(item.status) }}
                  </span>
                </td>

                <!-- NGÀY ĐẶT -->
                <td class="whitespace-nowrap px-5 py-5 text-xs text-slate-400">
                  {{ formatDate(item.created_at) }}
                </td>

                <!-- THAO TÁC DUYỆT (TỐI ĐA 1 - 2 NÚT) -->
                <td class="whitespace-nowrap px-5 py-5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <!-- Nút thao tác hợp lệ theo State Machine -->
            <template v-if="getAvailableActions(item).length > 0">
              <button
                v-for="action in getAvailableActions(item)"
                :key="action.status"
                type="button"
                :disabled="actionLoading.has(item.id)"
                @click="duyetDon(item.id, action.status)"
                class="inline-flex h-8 select-none items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                :class="[
                  action.variant === 'primary' &&
                    'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20',
                  action.variant === 'secondary' &&
                    'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white',
                  action.variant === 'success' &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
                  action.variant === 'danger' &&
                    'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
                  action.variant === 'warning' &&
                    'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
                ]"
              >
                <span class="material-symbols-outlined text-[15px]">
                  {{ actionLoading.has(item.id) ? "progress_activity" : action.icon }}
                </span>
                {{ action.label }}
              </button>
            </template>

                    <!-- Trạng thái kết thúc không có nút -->
                    <span v-else class="text-xs italic text-slate-500">
                      Đã hoàn tất
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- MOBILE / TABLET CARDS -->
        <div
          v-if="paginatedBookings.length > 0"
          class="grid grid-cols-1 gap-4 p-3 sm:p-5 2xl:hidden"
        >
          <article
            v-for="item in paginatedBookings"
            :key="item.id"
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <!-- TOP CARD -->
            <div class="flex items-start justify-between gap-3 p-4">
              <div>
                <span class="font-mono text-xs font-semibold text-orange-400"
                  >#{{ item.id }}</span
                >
                <p class="mt-1 text-sm font-semibold text-white">
                  {{ item.booker_name || "Chưa có tên" }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ item.booker_phone || "--" }}
                </p>
              </div>
              <span
                class="rounded-lg border px-2.5 py-1 text-[11px] font-medium"
                :class="getStatusClass(item.status)"
              >
                {{ getStatusName(item.status) }}
              </span>
            </div>

            <div class="mx-4 h-px bg-slate-100"></div>

            <!-- TOUR & GIÁ -->
            <div class="space-y-2 p-4 text-xs">
              <p class="font-medium text-slate-200">
                {{
                  item.tour?.name ||
                  item.tour?.title ||
                  `Tour #${item.tour_id || "--"}`
                }}
              </p>
              <div class="flex items-center justify-between text-slate-400">
                <span
                  >Số khách:
                  <strong class="text-slate-200">{{
                    item.total_people || 0
                  }}</strong></span
                >
                <span v-if="item.schedule?.departure_date"
                  >Khởi hành:
                  {{ formatDate(item.schedule.departure_date) }}</span
                >
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-sm font-bold text-white">{{
                  formatCurrency(getTotalAmount(item))
                }}</span>
                <span
                  class="rounded border px-2 py-0.5 text-[10px] font-medium"
                  :class="getPaymentClass(item)"
                >
                  {{ getPaymentText(item) }}
                </span>
              </div>
            </div>

            <!-- ACTION FOOTER MOBILE -->
            <div class="border-t border-slate-100 bg-slate-50 p-3">
              <div
                v-if="getAvailableActions(item).length > 0"
                class="flex items-center gap-2"
              >
                <button
                  v-for="action in getAvailableActions(item)"
                  :key="action.status"
                  type="button"
                  @click="duyetDon(item.id, action.status)"
                  class="inline-flex h-9 flex-1 select-none items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition active:scale-95"
                  :class="[
                    action.variant === 'primary' &&
                      'border-orange-500/30 bg-orange-500/10 text-orange-300',
                    action.variant === 'secondary' &&
                      'border-white/10 bg-white/[0.04] text-slate-300',
                    action.variant === 'success' &&
                      'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                    action.variant === 'danger' &&
                      'border-rose-500/30 bg-rose-500/10 text-rose-300',
                    action.variant === 'warning' &&
                      'border-amber-500/30 bg-amber-500/10 text-amber-300',
                  ]"
                >
                  <span class="material-symbols-outlined text-[16px]">{{
                    action.icon
                  }}</span>
                  {{ action.label }}
                </button>
              </div>
              <p v-else class="text-center text-xs italic text-slate-500">
                Đơn tour đã hoàn tất quy trình
              </p>
            </div>
          </article>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="filteredBookings.length > 0"
          class="flex flex-col gap-4 border-t border-white/[0.07] px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between"
        >
          <p class="text-xs text-slate-500 sm:text-sm">
            Trang
            <span class="font-semibold text-slate-200">{{ currentPage }}</span>
            /
            <span class="font-semibold text-slate-200">{{ totalPages }}</span>
            (Tổng
            <span class="font-semibold text-slate-300">{{
              filteredBookings.length
            }}</span>
            đơn)
          </p>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              aria-label="Trang trước"
              class="inline-flex h-9 w-9 select-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-medium text-slate-300 transition hover:bg-white/[0.07] disabled:pointer-events-none disabled:opacity-30"
            >
              <span class="material-symbols-outlined text-[19px]"
                >chevron_left</span
              >
            </button>

            <template v-for="page in totalPages" :key="page">
              <button
                v-if="
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                "
                type="button"
                @click="changePage(page)"
                class="inline-flex h-9 min-w-9 select-none items-center justify-center rounded-lg border px-3 text-xs font-medium transition"
                :class="
                  currentPage === page
                    ? 'border-orange-500/40 bg-orange-500/15 font-semibold text-orange-300'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white'
                "
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 2 || page === currentPage + 2"
                class="px-1 text-slate-600"
              >
                ...
              </span>
            </template>

            <button
              type="button"
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              aria-label="Trang sau"
              class="inline-flex h-9 w-9 select-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-medium text-slate-300 transition hover:bg-white/[0.07] disabled:pointer-events-none disabled:opacity-30"
            >
              <span class="material-symbols-outlined text-[19px]"
                >chevron_right</span
              >
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

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
