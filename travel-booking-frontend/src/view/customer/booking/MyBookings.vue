<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import Swal from "sweetalert2";

import bookingService from "../../../services/booking.service";
import reviewService from "../../../services/review.service";

const router = useRouter();
const queryClient = useQueryClient();

// ======================================================
// 1. USER AUTH
// ======================================================
const currentUser = computed(() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
});

const userId = computed(() => currentUser.value?.id);

// ======================================================
// 2. FETCH BOOKINGS
// ======================================================
const { data: rawBookings, isLoading } = useQuery({
  queryKey: ["myBookingData", userId],
  queryFn: async () => {
    const res = await bookingService.bookingUser();
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  },
  enabled: computed(() => !!userId.value),
  staleTime: 1000 * 60 * 5,
});

const bookings = computed(() => {
  return Array.isArray(rawBookings.value) ? rawBookings.value : [];
});

// ======================================================
// 3. CHUẨN HÓA TRẠNG THÁI BOOKING
// ======================================================

const normalizeStatus = (status) => {
  if (status == null || String(status).trim() === "") {
    return "PENDING";
  }

  const s = String(status)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const aliasMap = {
    CONFIRM: "CONFIRMED",
    READY: "CONFIRMED",
    PAID: "CONFIRMED",
    ONGOING: "IN_PROGRESS",
    CANCELED: "CANCELLED",
    CANCEL: "CANCELLED",
    COMPLETE: "COMPLETED",
    FINISHED: "COMPLETED",
    NOT_ATTENDED: "NO_SHOW",
  };

  // "paid" là trạng thái thanh toán, không phải trạng thái tour.
  // Tạm thời giữ nguyên để không gán sai trạng thái booking.
  return aliasMap[s] || s;
};

// ======================================================
// 4. BADGE TRẠNG THÁI HIỂN THỊ
// ======================================================
const getBadge = (status) => {
  const s = normalizeStatus(status);

  const badges = {
    PENDING: {
      text: "Chờ thanh toán",
      class: "border-amber-400/30 bg-amber-400/15 text-amber-300",
    },
    CONFIRMED: {
      text: "Đã xác nhận",
      class: "border-sky-400/30 bg-sky-400/15 text-sky-300",
    },
    CHECKED_IN: {
      text: "Đã đón khách",
      class: "border-indigo-400/30 bg-indigo-400/15 text-indigo-300",
    },
    IN_PROGRESS: {
      text: "Tour đang diễn ra",
      class: "border-blue-400/30 bg-blue-400/15 text-blue-300",
    },
    COMPLETED: {
      text: "Đã hoàn thành",
      class: "border-purple-400/30 bg-purple-400/15 text-purple-300",
    },
    NO_SHOW: {
      text: "Khách không tham gia",
      class: "border-zinc-500/30 bg-zinc-500/15 text-zinc-300",
    },
    CANCELLED: {
      text: "Đã hủy",
      class: "border-rose-400/30 bg-rose-400/15 text-rose-300",
    },
    REFUND_PENDING: {
      text: "Chờ xử lý hoàn tiền",
      class: "border-orange-400/30 bg-orange-400/15 text-orange-300",
    },
    REFUNDED: {
      text: "Đã hoàn tiền",
      class: "border-teal-400/30 bg-teal-400/15 text-teal-300",
    },
  };

  return (
    badges[s] || {
      text: `Trạng thái khác (${s})`,
      class: "border-white/20 bg-white/10 text-white/80",
    }
  );
};

// ======================================================
// 5. THANH TOÁN & SỐ TIỀN
// ======================================================
const getPayments = (booking) => {
  return Array.isArray(booking?.payments) ? booking.payments : [];
};

const getPaidPayments = (booking) => {
  return getPayments(booking).filter(
    (p) =>
      String(p?.status || "")
        .trim()
        .toUpperCase() === "PAID",
  );
};

const getTotalAmount = (booking) => Number(booking?.total_amount || 0);

const getPaidAmount = (booking) => {
  if (!booking) return 0;
  if (booking.paid_amount !== undefined && booking.paid_amount !== null) {
    return Number(booking.paid_amount || 0);
  }
  return getPaidPayments(booking).reduce(
    (total, p) => total + Number(p?.amount || 0),
    0,
  );
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

const isPaymentPaid = (booking) => {
  const total = getTotalAmount(booking);
  return total > 0 && getPaidAmount(booking) >= total;
};

const isPartiallyPaid = (booking) => {
  const total = getTotalAmount(booking);
  const paid = getPaidAmount(booking);
  return total > 0 && paid > 0 && paid < total;
};

const getRefundPaymentState = (booking) => {
  const statuses = getPayments(booking).map((p) =>
    String(p?.status || "")
      .trim()
      .toUpperCase(),
  );
  if (statuses.includes("REFUND_PENDING")) return "REFUND_PENDING";
  if (statuses.includes("REFUNDED")) return "REFUNDED";
  return null;
};

const getPaymentText = (booking) => {
  if (!booking) return "Chưa thanh toán";
  const st = String(booking?.payment_status || "")
    .trim()
    .toUpperCase();

  // Ưu tiên trạng thái hoàn tiền của giao dịch (payments.status)
  const refundState = getRefundPaymentState(booking);
  if (refundState === "REFUND_PENDING") return "Chờ hoàn tiền";
  if (refundState === "REFUNDED") return "Đã hoàn tiền";

  if (
    booking.payment_type === "full" ||
    st === "PAID" ||
    isPaymentPaid(booking)
  ) {
    return "Đã thanh toán đủ";
  }
  if (
    booking.payment_type === "deposit" ||
    st === "PARTIAL" ||
    isPartiallyPaid(booking)
  ) {
    return "Đã cọc";
  }
  if (st === "REFUND_PENDING") return "Chờ hoàn tiền";
  if (st === "REFUNDED") return "Đã hoàn tiền";

  const hasPending = getPayments(booking).some(
    (p) =>
      String(p?.status || "")
        .trim()
        .toUpperCase() === "PENDING",
  );
  if (hasPending) return "Chờ thanh toán";

  return "Chưa thanh toán";
};

const getPaymentTextColor = (booking) => {
  const refundState = getRefundPaymentState(booking);
  if (refundState === "REFUND_PENDING") return "text-orange-300";
  if (refundState === "REFUNDED") return "text-teal-300";

  if (isPaymentPaid(booking)) return "text-emerald-300";
  if (isPartiallyPaid(booking)) return "text-cyan-300";

  const st = String(booking?.payment_status || "")
    .trim()
    .toUpperCase();
  if (st === "REFUND_PENDING") return "text-orange-300";
  if (st === "REFUNDED") return "text-teal-300";

  return "text-amber-300";
};

// ======================================================
// 6. PHÂN QUYỀN NÚT THAO TÁC CỦA KHÁCH
// ======================================================
const canPay = (booking) => {
  if (!booking) return false;
  const remaining = getRemainingAmount(booking);
  if (remaining <= 0) return false;

  const status = normalizeStatus(booking.status);
  return ["PENDING", "CONFIRMED"].includes(status);
};

const canCancel = (booking) => {
  if (!booking) return false;
  // Đã có tiền thanh toán thì phải chuyển qua quy trình Hoàn tiền
  if (getPaidAmount(booking) > 0) return false;

  const status = normalizeStatus(booking.status);
  return ["PENDING", "CONFIRMED"].includes(status);
};

const canRefund = (booking) => {
  if (!booking) return false;
  if (getPaidAmount(booking) <= 0) return false;

  const status = normalizeStatus(booking.status);
  if (status === "REFUND_PENDING" || status === "REFUNDED") return false;

  const refundState = getRefundPaymentState(booking);
  if (refundState === "REFUND_PENDING" || refundState === "REFUNDED") return false;

  const refundStatus = String(booking?.refund_status || "")
    .trim()
    .toUpperCase();
  if (["REFUND_PENDING", "REFUNDED", "COMPLETED"].includes(refundStatus)) {
    return false;
  }

  // Khách chỉ được xin hoàn tiền khi đơn ĐÃ XÁC NHẬN hoặc ĐÃ HỦY (chưa hoàn)
  return ["CONFIRMED", "CANCELLED"].includes(status);
};

// ======================================================
// 7. FORMATTERS
// ======================================================
const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val || 0));

const formatDate = (val) => {
  if (!val) return "--/--/----";
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? "--/--/----"
    : d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const formatTime = (val) => {
  if (!val) return "--:--";
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? "--:--"
    : d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getThumbnailUrl = (path) => {
  if (!path) {
    return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=85";
  }
  const clean = String(path).replace(/\\/g, "/");
  return clean.startsWith("http") ? clean : `/${clean}`;
};

const getPickupText = (booking) => {
  return (
    booking?.pickup_point?.name ||
    booking?.pickup_point?.address ||
    booking?.pickup_note ||
    "Theo lịch trình của tour"
  );
};

// ======================================================
// 8. HÀNH ĐỘNG: THANH TOÁN NGAY / THANH TOÁN TIẾP
// ======================================================
const handlePayNow = async (booking) => {
  if (!canPay(booking)) return;

  const remaining = getRemainingAmount(booking);
  const resultConfirm = await Swal.fire({
    title: "Xác nhận thanh toán?",
    html: `
      <div style="text-align:left;line-height:1.7;">
        <p>Đơn tour: <strong>#BK-${booking.id}</strong></p>
        <p>Tổng tiền: <strong>${formatCurrency(getTotalAmount(booking))}</strong></p>
        <p>Đã thanh toán: <strong style="color:#22c55e;">${formatCurrency(getPaidAmount(booking))}</strong></p>
        <p>Số tiền cần nộp: <strong style="color:#f97316;">${formatCurrency(remaining)}</strong></p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Thanh toán qua VNPAY",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  if (!resultConfirm.isConfirmed) return;

  try {
    const res = await bookingService.payFull(booking.id);
    const url = res?.data?.data?.payment_url || res?.data?.payment_url;
    if (!url) throw new Error("Không nhận được URL thanh toán từ cổng.");
    window.location.href = url;
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Không thể thanh toán",
      text:
        error?.response?.data?.message ||
        error?.message ||
        "Đã xảy ra lỗi kết nối.",
    });
  }
};

// ======================================================
// 9. HÀNH ĐỘNG: HỦY ĐƠN
// ======================================================
const handleCancelBooking = async (booking, reason = "Lý do cá nhân") => {
  if (!canCancel(booking)) return;

  const result = await Swal.fire({
    title: "Xác nhận hủy booking?",
    html: `
      <div style="text-align:left;line-height:1.7;">
        <p>Bạn có chắc chắn muốn hủy đơn <strong>#BK-${booking.id}</strong>?</p>
        <p style="margin-top:8px;"><strong>Lý do:</strong> ${reason}</p>
        <p style="color:#f59e0b;margin-top:8px;">Đơn sau khi hủy sẽ giải phóng chỗ trống và không thể hoàn tác.</p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Hủy đơn",
    cancelButtonText: "Quay lại",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await bookingService.cancelBooking(booking.id, reason);
    await queryClient.invalidateQueries({ queryKey: ["myBookingData"] });
    await Swal.fire({
      title: "Đã hủy booking",
      text: "Đơn tour của bạn đã được hủy thành công.",
      icon: "success",
      confirmButtonColor: "#f97316",
    });
  } catch (error) {
    await Swal.fire({
      title: "Không thể hủy",
      text: error?.response?.data?.message || "Đã xảy ra lỗi khi hủy.",
      icon: "error",
    });
  }
};

// ======================================================
// 10. HÀNH ĐỘNG: YÊU CẦU HOÀN TIỀN
// ======================================================
const handleRefundRequest = async (booking, reason = "Lý do cá nhân") => {
  if (!canRefund(booking)) return;

  const depStr =
    booking?.schedule?.departure_date || booking?.custom_departure_date;
  const startDate = new Date(depStr);
  const createdDate = new Date(booking.created_at);
  const now = new Date();

  if (Number.isNaN(startDate.getTime())) {
    await Swal.fire({
      title: "Lỗi dữ liệu",
      text: "Không xác định được ngày khởi hành để tính tỷ lệ hoàn.",
      icon: "error",
    });
    return;
  }

  // Số giờ kể từ lúc đặt
  const hoursSinceBooking =
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

  // Số ngày trước khởi hành
  const depDay = new Date(startDate);
  const today = new Date();
  depDay.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (depDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Tỷ lệ hoàn theo chính sách backend
  let refundPercent = 0;
  if (hoursSinceBooking >= 0 && hoursSinceBooking <= 48) {
    refundPercent = 100;
  } else if (hoursSinceBooking > 48 && diffDays >= 3) {
    refundPercent = 50;
  } else {
    refundPercent = 0;
  }

  const paidAmount = getPaidAmount(booking);
  const refundAmount = Math.round((paidAmount * refundPercent) / 100);

  const result = await Swal.fire({
    title: "Yêu cầu hoàn tiền",
    html: `
      <div style="text-align:left;line-height:1.7;font-size:13px;">
        <p>Đơn: <strong>#BK-${booking.id}</strong></p>
        <p>Khởi hành: <strong>${formatDate(depStr)}</strong></p>
        <p>Lý do: <strong>${reason}</strong></p>
        <hr style="margin:10px 0;border-color:rgba(255,255,255,0.1);">
        <p><strong>Chính sách hoàn tiền:</strong></p>
        <ul style="padding-left:18px;margin-top:4px;">
          <li>Trong 48h từ lúc đặt: <strong style="color:#22c55e;">100%</strong></li>
          <li>Sau 48h & trước ngày đi ≥ 3 ngày: <strong style="color:#f59e0b;">50%</strong></li>
          <li>Cận ngày đi (&lt; 3 ngày): <strong style="color:#ef4444;">0%</strong></li>
        </ul>
        <hr style="margin:10px 0;border-color:rgba(255,255,255,0.1);">
        <p>Đã thanh toán: <strong>${formatCurrency(paidAmount)}</strong></p>
        <p>Tỷ lệ hoàn tính được: <strong style="color:#f97316;font-size:16px;">${refundPercent}%</strong></p>
        <p>Số tiền dự kiến hoàn về ví: <strong style="color:#22c55e;font-size:16px;">${formatCurrency(refundAmount)}</strong></p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xác nhận gửi yêu cầu",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const res = await bookingService.refund_pending(booking.id, {
      reason,
      refund_percent: refundPercent,
      refund_amount: refundAmount,
    });

    if (res?.data?.success === false) throw new Error(res?.data?.message);

    await queryClient.invalidateQueries({ queryKey: ["myBookingData"] });
    await Swal.fire({
      title: "Đã gửi yêu cầu",
      text: "Yêu cầu hoàn tiền đã được chuyển tới ban quản trị xử lý.",
      icon: "success",
      confirmButtonColor: "#f97316",
    });
  } catch (error) {
    await Swal.fire({
      title: "Gửi thất bại",
      text:
        error?.response?.data?.message ||
        error?.message ||
        "Vui lòng thử lại sau.",
      icon: "error",
    });
  }
};

// ======================================================
// 11. STATS TỔNG QUAN
// ======================================================
const stats = computed(() => {
  const list = bookings.value;
  return {
    total: list.length,
    upcoming: list.filter((b) =>
      ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(
        normalizeStatus(b.status),
      ),
    ).length,
    completed: list.filter((b) => normalizeStatus(b.status) === "COMPLETED")
      .length,
    paid: list.filter((b) => getPaidAmount(b) > 0).length,
    cancelled: list.filter((b) =>
      ["CANCELLED", "NO_SHOW", "REFUNDED"].includes(normalizeStatus(b.status)),
    ).length,
  };
});

// ======================================================
// 12. TABS & FILTER
// ======================================================
const searchQuery = ref("");
const activeTab = ref("ALL");

const filterCounts = computed(() => {
  const list = bookings.value;
  return {
    ALL: list.length,
    PENDING: list.filter((b) => normalizeStatus(b.status) === "PENDING").length,
    CONFIRMED: list.filter((b) => normalizeStatus(b.status) === "CONFIRMED")
      .length,
    CHECKED_IN: list.filter((b) => normalizeStatus(b.status) === "CHECKED_IN")
      .length,
    IN_PROGRESS: list.filter((b) => normalizeStatus(b.status) === "IN_PROGRESS")
      .length,
    COMPLETED: list.filter((b) => normalizeStatus(b.status) === "COMPLETED")
      .length,
    REFUND: list.filter((b) =>
      ["REFUND_PENDING", "REFUNDED"].includes(normalizeStatus(b.status)),
    ).length,
    CANCELLED: list.filter((b) =>
      ["CANCELLED", "NO_SHOW"].includes(normalizeStatus(b.status)),
    ).length,
  };
});

const filteredBookings = computed(() => {
  let result = bookings.value;

  if (activeTab.value !== "ALL") {
    if (activeTab.value === "REFUND") {
      result = result.filter((b) =>
        ["REFUND_PENDING", "REFUNDED"].includes(normalizeStatus(b.status)),
      );
    } else if (activeTab.value === "CANCELLED") {
      result = result.filter((b) =>
        ["CANCELLED", "NO_SHOW"].includes(normalizeStatus(b.status)),
      );
    } else {
      result = result.filter(
        (b) => normalizeStatus(b.status) === activeTab.value,
      );
    }
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((b) => {
      const tourName = b?.tour?.name?.toLowerCase() || "";
      const bookingId = String(b?.id || "").toLowerCase();
      const pickup = getPickupText(b).toLowerCase();
      return (
        tourName.includes(q) || bookingId.includes(q) || pickup.includes(q)
      );
    });
  }

  return result;
});

// ======================================================
// 13. REVIEW MODAL
// ======================================================
const activeReviewBooking = ref(null);
const isSubmitting = ref(false);

const formReview = ref({
  tour_id: "",
  rating: 5,
  joined_date: null,
  content: "",
});

const openReviewModal = (booking) => {
  activeReviewBooking.value = booking;
  formReview.value = {
    tour_id: booking?.tour?.id || booking?.tour_id || "",
    rating: 5,
    joined_date: booking?.schedule?.departure_date || null,
    content: "",
  };
};

const closeReviewModal = () => {
  activeReviewBooking.value = null;
};

const createReviewsTour = async () => {
  if (!formReview.value.content.trim()) {
    await Swal.fire({
      title: "Thiếu nhận xét",
      text: "Vui lòng nhập cảm nhận trải nghiệm của bạn!",
      icon: "warning",
      confirmButtonColor: "#f97316",
    });
    return;
  }

  try {
    isSubmitting.value = true;
    await reviewService.createReview({
      tour_id: formReview.value.tour_id,
      rating: Number(formReview.value.rating),
      joined_date: formReview.value.joined_date,
      content: formReview.value.content.trim(),
    });

    await Swal.fire({
      title: "Thành công!",
      text: "Cảm ơn bạn đã đóng góp đánh giá trải nghiệm chuyến đi!",
      icon: "success",
      confirmButtonColor: "#f97316",
    });

    closeReviewModal();
    await queryClient.invalidateQueries({ queryKey: ["myBookingData"] });
  } catch (error) {
    await Swal.fire({
      title: "Lỗi gửi đánh giá",
      text: error?.response?.data?.message || "Vui lòng thử lại sau.",
      icon: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

// ======================================================
// 14. CHI TIẾT ĐƠN TOUR
// ======================================================
const handleViewDetail = async (booking) => {
  if (!booking) return;

  const ticketName =
    booking?.ticket_items?.[0]?.ticket_type?.name || "Tiêu chuẩn";
  const pickupPoint = getPickupText(booking);

  await Swal.fire({
    title: "Chi tiết đơn đặt tour",
    width: 600,
    background: "#0d1119",
    color: "#fff",
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: "rounded-2xl border border-white/10",
      title: "text-lg font-bold text-white",
    },
    html: `
      <div style="text-align:left;font-size:13px;line-height:1.7;" class="space-y-3">
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;">
          <p style="color:#94a3b8;font-size:11px;">MÃ ĐƠN</p>
          <p style="font-weight:600;color:#f97316;">#BK-${booking.id}</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;">
          <p style="color:#94a3b8;font-size:11px;">TÊN TOUR</p>
          <p style="font-weight:600;">${booking?.tour?.name || "Tour du lịch"}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;">
            <p style="color:#94a3b8;font-size:11px;">KHỞI HÀNH</p>
            <p style="font-weight:600;">${formatDate(booking?.schedule?.departure_date)}</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;">
            <p style="color:#94a3b8;font-size:11px;">GIỜ XUẤT PHÁT</p>
            <p style="font-weight:600;">${formatTime(booking?.schedule?.departure_time)}</p>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;">
          <p style="color:#94a3b8;font-size:11px;">ĐIỂM ĐÓN KHÁCH</p>
          <p style="font-weight:600;">${pickupPoint}</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;">
          <p style="color:#94a3b8;font-size:11px;">THANH TOÁN</p>
          <p>Tổng tiền: <strong>${formatCurrency(getTotalAmount(booking))}</strong></p>
          <p>Đã trả: <strong style="color:#22c55e;">${formatCurrency(getPaidAmount(booking))}</strong></p>
          <p>Còn lại: <strong style="color:#f97316;">${formatCurrency(getRemainingAmount(booking))}</strong></p>
        </div>
      </div>
    `,
  });
};
</script>

<template>
  <div class="customer-redesign relative min-h-screen pt-20 text-white">
    <!-- BACKGROUND -->
    <div class="customer-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <img
        src="/hero-bg.jpg"
        alt="Travel background"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/50"></div>
      <div
        class="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-[#080b12]/95"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent"
      ></div>
    </div>

    <!-- MAIN WRAPPER -->
    <main class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- STATS SECTION -->
      <section
        class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
      >
        <div
          class="travel-surface rounded-2xl p-4 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg"
              >📋</span
            >
            <span class="text-xs text-white/70">Tổng đơn</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.total).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Tất cả chuyến đi</p>
        </div>

        <div
          class="travel-surface rounded-2xl p-4 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-lg"
              >🧳</span
            >
            <span class="text-xs text-cyan-200/80">Sắp đi</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.upcoming).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Tour đang hoạt động</p>
        </div>

        <div
          class="travel-surface rounded-2xl p-4 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-400/15 text-lg"
              >✨</span
            >
            <span class="text-xs text-purple-200/80">Hoàn thành</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.completed).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Đã đi xong</p>
        </div>

        <div
          class="travel-surface rounded-2xl p-4 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20 text-lg"
              >💳</span
            >
            <span class="text-xs text-emerald-200/80">Đã nộp tiền</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-emerald-300">
            {{ String(stats.paid).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-emerald-200/60">Có thanh toán</p>
        </div>

        <div
          class="travel-surface rounded-2xl p-4 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-400/15 text-lg"
              >📁</span
            >
            <span class="text-xs text-rose-200/80">Đã hủy/đóng</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.cancelled).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Đơn đã đóng</p>
        </div>
      </section>

      <!-- BOOKINGS LIST -->
      <section>
        <!-- SEARCH & HEADER -->
        <div
          class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-white">Chuyến đi của tôi</h2>
            <p class="mt-1 text-xs text-white/60">
              Quản lý hành trình, theo dõi tiến độ và xử lý thanh toán
            </p>
          </div>

          <div class="relative w-full lg:w-72">
            <span
              class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-white/50"
              >search</span
            >
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Tìm theo mã tour, tên, địa điểm..."
              class="w-full rounded-2xl border border-white/15 bg-white/[0.08] py-2.5 pl-10 pr-4 text-xs text-white outline-none backdrop-blur-xl transition placeholder:text-white/40 focus:border-orange-400/50 focus:bg-white/10"
            />
          </div>
        </div>

        <!-- TABS LỌC THEO HỆ THỐNG TRẠNG THÁI MỚI -->
        <div
          class="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          <button
            v-for="tab in [
              ['ALL', 'Tất cả', filterCounts.ALL],
              ['PENDING', 'Chờ duyệt', filterCounts.PENDING],
              ['CONFIRMED', 'Đã xác nhận', filterCounts.CONFIRMED],
              ['CHECKED_IN', 'Đã đón', filterCounts.CHECKED_IN],
              ['IN_PROGRESS', 'Đang đi', filterCounts.IN_PROGRESS],
              ['COMPLETED', 'Hoàn thành', filterCounts.COMPLETED],
              ['REFUND', 'Hoàn tiền', filterCounts.REFUND],
              ['CANCELLED', 'Đã hủy', filterCounts.CANCELLED],
            ]"
            :key="tab[0]"
            type="button"
            @click="activeTab = tab[0]"
            :class="
              activeTab === tab[0]
                ? 'bg-white font-bold text-slate-900'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-xs transition"
          >
            {{ tab[1] }} <span class="ml-1 opacity-70">({{ tab[2] }})</span>
          </button>
        </div>

        <!-- LOADING -->
        <div v-if="isLoading" class="py-16 text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent"
          ></div>
          <p class="mt-3 text-xs tracking-wider text-white/50">
            Đang tải lịch sử chuyến đi...
          </p>
        </div>

        <!-- LIST CONTAINER -->
        <div v-else-if="filteredBookings.length" class="space-y-4">
          <article
            v-for="booking in filteredBookings"
            :key="booking.id"
            class="travel-surface-interactive group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-[transform,border-color,box-shadow]"
          >
            <div class="flex flex-col md:flex-row">
              <!-- IMAGE -->
              <div class="relative h-52 shrink-0 md:h-auto md:w-64">
                <img
                  :src="getThumbnailUrl(booking.tour?.thumbnail)"
                  :alt="booking.tour?.name || 'Tour'"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
                ></div>
                <div
                  class="absolute bottom-4 left-4 rounded-full border border-white/20 bg-travel-blue/85 px-3 py-1 font-mono text-xs font-semibold text-white"
                >
                  #BK-{{ booking.id }}
                </div>
              </div>

              <!-- CONTENT -->
              <div class="flex-1 p-5 sm:p-6">
                <!-- TOP HEADER -->
                <div
                  class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span
                        class="font-mono text-[10px] font-semibold uppercase tracking-wider text-orange-300"
                      >
                        BOOKING #{{ booking.id }}
                      </span>
                      <span class="h-1 w-1 rounded-full bg-white/30"></span>
                      <span
                        class="text-[11px] font-medium"
                        :class="getPaymentTextColor(booking)"
                      >
                        {{ getPaymentText(booking) }}
                      </span>
                    </div>

                    <h3 class="mt-1.5 text-lg font-bold text-white">
                      {{ booking.tour?.name }}
                    </h3>

                    <p
                      class="mt-1 flex items-center gap-1 text-xs text-white/60"
                    >
                      <span class="material-symbols-outlined text-[15px]"
                        >location_on</span
                      >
                      {{ getPickupText(booking) }}
                    </p>
                  </div>

                  <!-- BADGE STATUS -->
                  <span
                    class="h-fit w-fit shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider"
                    :class="getBadge(booking.status).class"
                  >
                    {{ getBadge(booking.status).text }}
                  </span>
                </div>

                <!-- INFO GRID -->
                <div
                  class="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-4"
                >
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wider text-white/50"
                    >
                      Khởi hành
                    </p>
                    <p class="mt-1 text-xs font-semibold text-white">
                      {{ formatDate(booking.schedule?.departure_date) }}
                    </p>
                    <p class="text-[10px] text-white/50">
                      {{ formatTime(booking.schedule?.departure_time) }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wider text-white/50"
                    >
                      Hành khách
                    </p>
                    <p class="mt-1 text-xs font-semibold text-white">
                      {{ booking.total_people || 0 }} người
                    </p>
                    <p class="truncate text-[10px] text-white/50">
                      {{ booking.booker_name || "Khách lẻ" }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wider text-white/50"
                    >
                      Tổng tiền
                    </p>
                    <p class="mt-1 font-mono text-xs font-bold text-white">
                      {{ formatCurrency(getTotalAmount(booking)) }}
                    </p>
                    <p class="text-[10px] text-emerald-400">
                      Đã trả: {{ formatCurrency(getPaidAmount(booking)) }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wider text-white/50"
                    >
                      Còn lại
                    </p>
                    <p
                      class="mt-1 font-mono text-xs font-bold"
                      :class="
                        getRemainingAmount(booking) > 0
                          ? 'text-orange-400'
                          : 'text-emerald-400'
                      "
                    >
                      {{ formatCurrency(getRemainingAmount(booking)) }}
                    </p>
                  </div>
                </div>

                <!-- ACTIONS ROW -->
                <div
                  class="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4"
                >
                  <!-- Xem chi tiết -->
                  <button
                    type="button"
                    @click="handleViewDetail(booking)"
                    class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/15"
                  >
                    Xem chi tiết
                  </button>

                  <!-- Thanh toán số tiền còn thiếu -->
                  <button
                    v-if="canPay(booking)"
                    type="button"
                    @click="handlePayNow(booking)"
                    class="rounded-xl bg-orange-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-orange-300 active:scale-95"
                  >
                    {{
                      getPaidAmount(booking) > 0
                        ? "Thanh toán phần còn lại"
                        : "Thanh toán ngay"
                    }}
                  </button>

                  <!-- Yêu cầu hoàn tiền (Nếu đã có tiền và đơn đang CONFIRMED) -->
                  <details v-if="canRefund(booking)" class="relative">
                    <summary
                      class="inline-flex cursor-pointer list-none items-center gap-1 rounded-xl border border-orange-400/30 bg-orange-400/10 px-3.5 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-400/20"
                    >
                      Yêu cầu hoàn tiền
                      <span class="material-symbols-outlined text-[16px]"
                        >arrow_drop_down</span
                      >
                    </summary>

                    <div
                      class="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-2xl border border-white/15 bg-[#0f172a] p-2 shadow-2xl"
                    >
                      <p
                        class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300"
                      >
                        Chọn lý do hoàn tiền
                      </p>
                      <div class="space-y-0.5">
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              booking,
                              'Bận việc đột xuất / Trùng lịch',
                            )
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"
                        >
                          📅 Bận việc đột xuất
                        </button>
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              booking,
                              'Sức khỏe không đảm bảo',
                            )
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"
                        >
                          🏥 Vấn đề sức khỏe
                        </button>
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(booking, 'Lý do cá nhân khác')
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"
                        >
                          💬 Lý do cá nhân khác
                        </button>
                      </div>
                    </div>
                  </details>

                  <!-- Trạng thái chờ hoàn tiền -->
                  <span
                    v-if="
                      normalizeStatus(booking.status) === 'REFUND_PENDING' ||
                      booking.refund_status === 'REFUND_PENDING' ||
                      getRefundPaymentState(booking) === 'REFUND_PENDING'
                    "
                    class="inline-flex items-center gap-1 rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-xs font-medium text-orange-200"
                  >
                    ⏳ Chờ duyệt hoàn tiền
                  </span>

                  <!-- Đã hoàn tiền -->
                  <span
                    v-if="
                      normalizeStatus(booking.status) === 'REFUNDED' ||
                      booking.refund_status === 'REFUNDED' ||
                      booking.refund_status === 'COMPLETED' ||
                      getRefundPaymentState(booking) === 'REFUNDED'
                    "
                    class="inline-flex items-center gap-1 rounded-xl border border-teal-400/30 bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-200"
                  >
                    ✓ Đã hoàn tiền về ví
                  </span>

                  <!-- Đánh giá tour đã xong -->
                  <button
                    v-if="normalizeStatus(booking.status) === 'COMPLETED'"
                    type="button"
                    @click="openReviewModal(booking)"
                    class="rounded-xl border border-purple-400/30 bg-purple-400/15 px-3.5 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-400/25"
                  >
                    Viết đánh giá
                  </button>

                  <!-- Đặt lại tour (cho đơn hủy / đã hoàn tiền) -->
                  <RouterLink
                    v-if="
                      ['CANCELLED', 'REFUNDED', 'NO_SHOW'].includes(
                        normalizeStatus(booking.status),
                      )
                    "
                    to="/tours"
                    class="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/15"
                  >
                    Đặt lại tour
                  </RouterLink>

                  <!-- Hủy booking (Chỉ khi chưa thanh toán) -->
                  <details v-if="canCancel(booking)" class="relative ml-auto">
                    <summary
                      class="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-white/50 transition hover:text-rose-400"
                    >
                      Hủy booking
                      <span class="material-symbols-outlined text-[16px]"
                        >arrow_drop_down</span
                      >
                    </summary>

                    <div
                      class="absolute bottom-full right-0 z-30 mb-2 w-56 rounded-2xl border border-white/15 bg-[#0f172a] p-2 shadow-2xl"
                    >
                      <p
                        class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300"
                      >
                        Lý do hủy đơn
                      </p>
                      <div class="space-y-0.5">
                        <button
                          type="button"
                          @click="
                            handleCancelBooking(booking, 'Không còn nhu cầu đi')
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"
                        >
                          ❌ Không còn nhu cầu
                        </button>
                        <button
                          type="button"
                          @click="
                            handleCancelBooking(booking, 'Trùng lịch đột xuất')
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"
                        >
                          📅 Trùng lịch bận
                        </button>
                        <button
                          type="button"
                          @click="handleCancelBooking(booking, 'Lý do khác')"
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"
                        >
                          💬 Lý do khác
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- EMPTY STATE -->
        <div
          v-else
          class="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-xl"
        >
          <span class="text-3xl">✈️</span>
          <h3 class="mt-3 text-base font-bold text-white">
            Không có chuyến đi nào
          </h3>
          <p class="mt-1 text-xs text-white/60">
            Không tìm thấy đơn tour nào ở bộ lọc hiện tại.
          </p>
          <RouterLink
            to="/tours"
            class="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-orange-300"
          >
            Khám phá tour ngay
          </RouterLink>
        </div>
      </section>
    </main>

    <!-- REVIEW MODAL -->
    <div
      v-if="activeReviewBooking"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
    >
      <div
        class="absolute inset-0 cursor-pointer"
        @click="closeReviewModal"
      ></div>

      <div
        class="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-[#0f172a] p-6 text-white shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-white/10 pb-4"
        >
          <div>
            <h3 class="text-base font-bold text-white">Đánh giá chuyến đi</h3>
            <p class="mt-0.5 truncate text-xs text-orange-300">
              {{ activeReviewBooking.tour?.name }}
            </p>
          </div>
          <button
            type="button"
            @click="closeReviewModal"
            class="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent class="mt-4 space-y-4">
          <div>
            <label class="mb-2 block text-xs font-semibold text-white/80"
              >Số sao đánh giá</label
            >
            <div class="flex items-center gap-1.5">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="formReview.rating = star"
                class="text-2xl transition hover:scale-110"
                :class="
                  star <= formReview.rating ? 'text-amber-400' : 'text-white/20'
                "
              >
                ★
              </button>
              <span class="ml-2 text-xs font-bold text-amber-300"
                >{{ formReview.rating }} / 5 sao</span
              >
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold text-white/80"
              >Nhận xét của bạn</label
            >
            <textarea
              v-model="formReview.content"
              rows="4"
              placeholder="Chia sẻ cảm nhận về hướng dẫn viên, lịch trình và dịch vụ..."
              class="w-full resize-none rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white outline-none focus:border-orange-400 focus:bg-white/10"
            ></textarea>
          </div>

          <div
            class="flex items-center justify-end gap-3 border-t border-white/10 pt-3"
          >
            <button
              type="button"
              @click="closeReviewModal"
              class="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              @click="createReviewsTour"
              class="rounded-xl bg-orange-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-orange-300 disabled:opacity-50"
            >
              {{ isSubmitting ? "Đang gửi..." : "Gửi đánh giá" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customer-redesign {
  background: #f8fafc;
  color: #475569;
}

.customer-atmosphere {
  display: none;
}

.customer-redesign :is([class^="bg-[#"], [class*=" bg-[#"]):not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-black/"]:not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-white/"]:not([class~="absolute"]):not([class~="fixed"]) {
  border-color: #e2e8f0;
  background-color: #fff;
  box-shadow: 0 3px 14px rgba(30, 41, 59, 0.06);
  backdrop-filter: none;
}

.customer-redesign [class*="bg-slate-800"]:not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-slate-900"]:not([class~="absolute"]):not([class~="fixed"]),
.customer-redesign [class*="bg-gray-900"]:not([class~="absolute"]):not([class~="fixed"]) {
  border-color: #e2e8f0;
  background-color: #fff;
  box-shadow: 0 3px 14px rgba(30, 41, 59, 0.06);
  backdrop-filter: none;
}

.customer-redesign [class*="text-white"],
.customer-redesign [class*="text-slate-100"],
.customer-redesign [class*="text-slate-200"],
.customer-redesign [class*="text-slate-300"] {
  color: #334155;
}

.customer-redesign [class*="border-white/"] {
  border-color: #e2e8f0;
}

.customer-redesign h1,
.customer-redesign h2,
.customer-redesign h3,
.customer-redesign h4 {
  color: #0f172a;
}

.customer-redesign input,
.customer-redesign select,
.customer-redesign textarea {
  border-color: #cbd5e1;
  background-color: #fff;
  color: #0f172a;
}

.customer-redesign a:hover {
  color: #2563eb;
}
</style>
