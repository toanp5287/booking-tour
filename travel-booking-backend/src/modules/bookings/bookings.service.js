// ==========================================================
// BOOKING DOMAIN SERVICE
// ------------------------------------------------------------
// Gom các quy tắc nghiệp vụ thuần của module bookings ra khỏi
// controller để controller chỉ lo HTTP, còn quy tắc ở đây
// thì test được độc lập (node:test).
//
// Không sửa schema, không thêm bảng mới. Tất cả dữ liệu cần
// thiết đã có sẵn trong DB:
//   - bookings.status            : trạng thái (VarChar)
//   - bookings.selected_tour_type: SIC | PRIVATE | GROUP | CUSTOM
//   - bookings.quotation_id      : có => booking từ báo giá tour đoàn
//   - bookings.custom_request_id : có => booking từ yêu cầu tour custom
//   - booking_status_histories   : lý do / người thực hiện / thời gian
//   - refunds                    : số tiền hoàn / trạng thái hoàn
// ==========================================================

// ==========================================================
// 1. TRẠNG THÁI BOOKING
// ==========================================================

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
};

// Trạng thái cũ vẫn còn trong DB. Chuẩn hóa về trạng thái chuẩn.
// LOCKED là bước trung gian của luồng cũ, không còn bắt buộc.
export const BOOKING_STATUS_ALIAS = {
  READY: "CONFIRMED",
  PAID: "CONFIRMED",
  LOCKED: "CONFIRMED",
  ONGOING: "IN_PROGRESS",
  CANCELED: "CANCELLED",
  CANCEL: "CANCELLED",
  COMPLETE: "COMPLETED",
  FINISHED: "COMPLETED",
  NOT_ATTENDED: "NO_SHOW",
};

export const VALID_TARGET_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.CHECKED_IN,
  BOOKING_STATUS.IN_PROGRESS,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.NO_SHOW,
  BOOKING_STATUS.REFUND_PENDING,
  BOOKING_STATUS.REFUNDED,
];

// Trạng thái kết thúc: không được chuyển ngược bằng thao tác thường.
// LOCKED là trạng thái cũ (legacy) - cũng chặn để tránh cập nhật nhầm.
export const TERMINAL_BOOKING_STATUSES = [
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.NO_SHOW,
  BOOKING_STATUS.REFUNDED,
  "LOCKED",
];

// ==========================================================
// 2. MA TRẬN CHUYỂN TRẠNG THÁI
// ------------------------------------------------------------
// Luồng chính: CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED
// Nhánh kết thúc: CANCELLED (hủy + hoàn tiền), NO_SHOW (mất tiền)
// ==========================================================

export const ALLOWED_BOOKING_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],

  // Đã thanh toán hợp lệ: đón khách / đánh dấu vắng mặt / hủy
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CHECKED_IN,
    BOOKING_STATUS.NO_SHOW,
    BOOKING_STATUS.CANCELLED,
  ],

  [BOOKING_STATUS.CHECKED_IN]: [BOOKING_STATUS.IN_PROGRESS],

  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED],

  // Chỉ booking đã hủy mới được đưa vào luồng hoàn tiền (yêu cầu hoàn của khách)
  [BOOKING_STATUS.CANCELLED]: [BOOKING_STATUS.REFUND_PENDING],

  [BOOKING_STATUS.REFUND_PENDING]: [BOOKING_STATUS.REFUNDED],
};

export const normalizeBookingStatus = (status) => {
  const raw = String(status ?? "")
    .trim()
    .toUpperCase();

  return BOOKING_STATUS_ALIAS[raw] || raw;
};

export const isTerminalBookingStatus = (status) => {
  const normalized = normalizeBookingStatus(status);
  if (TERMINAL_BOOKING_STATUSES.includes(normalized)) return true;
  if (TERMINAL_BOOKING_STATUSES.includes(status)) return true;
  return false;
};

export const canTransitionBooking = (fromStatus, toStatus) => {
  const from = normalizeBookingStatus(fromStatus);
  const to = normalizeBookingStatus(toStatus);

  return (ALLOWED_BOOKING_TRANSITIONS[from] || []).includes(to);
};

// ==========================================================
// 3. PHÂN LOẠI LOẠI BOOKING
// ------------------------------------------------------------
// REGULAR: booking mua vé thông thường (không qua báo giá, không custom)
// GROUP  : booking sinh từ báo giá tour đoàn
// CUSTOM : booking sinh từ yêu cầu tour theo yêu cầu riêng
// ==========================================================

export const BOOKING_KIND = {
  REGULAR: "REGULAR",
  GROUP: "GROUP",
  CUSTOM: "CUSTOM",
};

export const BOOKING_KIND_LABEL = {
  [BOOKING_KIND.REGULAR]: "Vé thông thường",
  [BOOKING_KIND.GROUP]: "Tour đoàn",
  [BOOKING_KIND.CUSTOM]: "Tour theo yêu cầu",
};

export const classifyBookingKind = (booking) => {
  if (!booking) return BOOKING_KIND.REGULAR;

  const tourType = String(booking.selected_tour_type ?? "")
    .trim()
    .toUpperCase();

  // Ưu tiên quan hệ trực tiếp: có báo giá => tour đoàn, có yêu cầu custom => custom
  if (booking.quotation_id) return BOOKING_KIND.GROUP;
  if (booking.custom_request_id) return BOOKING_KIND.CUSTOM;

  if (tourType === "GROUP") return BOOKING_KIND.GROUP;
  if (tourType === "CUSTOM") return BOOKING_KIND.CUSTOM;

  return BOOKING_KIND.REGULAR;
};

export const isRegularTicketBooking = (booking) =>
  classifyBookingKind(booking) === BOOKING_KIND.REGULAR;

// ==========================================================
// 4. CỬA SỔ ĐIỂM DANH
// ------------------------------------------------------------
// Mở cửa trước giờ khởi hành, đóng sau giờ khởi hành (grace).
// ==========================================================

export const CHECKIN_WINDOW = {
  OPEN_BEFORE_MINUTES: 24 * 60,
  CLOSE_AFTER_MINUTES: 2 * 60,
};

// Prisma trả Time(@db.Time) về dạng Date 1970-01-01 theo UTC => đọc giờ UTC.
const parseTimeToMinutes = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.getUTCHours() * 60 + value.getUTCMinutes();
  }

  const parts = String(value).split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
};

// Ngày khởi hành là Date(@db.Date) => lấy Y/M/D theo UTC rồi dựng local time.
export const getDepartureDateTime = (schedule) => {
  if (!schedule?.departure_date) return null;

  const base = new Date(schedule.departure_date);
  if (Number.isNaN(base.getTime())) return null;

  const minutes = parseTimeToMinutes(schedule.departure_time);

  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const day = base.getUTCDate();

  if (minutes === null) {
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  return new Date(year, month, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
};

export const getCheckinWindow = (schedule, now = new Date()) => {
  const departure = getDepartureDateTime(schedule);
  if (!departure) return null;

  const open = new Date(
    departure.getTime() - CHECKIN_WINDOW.OPEN_BEFORE_MINUTES * 60 * 1000,
  );
  const close = new Date(
    departure.getTime() + CHECKIN_WINDOW.CLOSE_AFTER_MINUTES * 60 * 1000,
  );

  const nowTime = now.getTime();

  return {
    departure,
    open,
    close,
    isOpen: nowTime >= open.getTime() && nowTime <= close.getTime(),
  };
};

export const isWithinCheckinWindow = (schedule, now = new Date()) => {
  const window = getCheckinWindow(schedule, now);
  return window ? window.isOpen : false;
};

// ==========================================================
// 5. THANH TOÁN
// ==========================================================

const upperStatus = (status) =>
  String(status ?? "")
    .trim()
    .toUpperCase();

export const getPaidPayments = (payments = []) =>
  (payments || []).filter(
    (payment) => upperStatus(payment?.status) === "PAID",
  );

export const getPaidAmount = (payments = []) =>
  getPaidPayments(payments).reduce(
    (sum, payment) => sum + Number(payment?.amount || 0),
    0,
  );

// Số tiền khách đã thu (kể cả khoản đã đánh dấu hoàn tiền)
export const getCollectedAmount = (payments = []) =>
  (payments || [])
    .filter((payment) =>
      ["PAID", "REFUND_PENDING", "REFUNDED"].includes(
        upperStatus(payment?.status),
      ),
    )
    .reduce((sum, payment) => sum + Number(payment?.amount || 0), 0);

export const getRefundAmount = (refunds = []) =>
  (refunds || [])
    .filter((refund) => upperStatus(refund?.status) === "COMPLETED")
    .reduce((sum, refund) => sum + Number(refund?.amount || 0), 0);

// Trạng thái hoàn tiền hiển thị cho admin
export const REFUND_STATE = {
  NONE: "NONE",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

export const getRefundState = ({ payments = [], refunds = [] } = {}) => {
  const statuses = [
    ...(payments || []).map((p) => upperStatus(p?.status)),
    ...(refunds || []).map((r) => upperStatus(r?.status)),
  ];

  if (statuses.includes("REFUNDED")) return REFUND_STATE.COMPLETED;
  if (statuses.includes("REFUND_PENDING")) return REFUND_STATE.PENDING;
  if (statuses.includes("REJECTED")) return REFUND_STATE.REJECTED;

  return REFUND_STATE.NONE;
};

// ==========================================================
// 6. CHÍNH SÁCH HOÀN TIỀN
// ------------------------------------------------------------
// - Trong 48h đầu kể từ lúc đặt          : hoàn 100%
// - Quá 48h và còn >= 3 ngày trước ngày đi : hoàn 50%
// - Còn lại                              : không hoàn
// ==========================================================

export const REFUND_POLICY = {
  FULL_REFUND_WINDOW_HOURS: 48,
  PARTIAL_REFUND_MIN_DAYS: 3,
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const calcRefundPolicy = ({
  createdAt,
  departureDate,
  now = new Date(),
} = {}) => {
  const created = createdAt ? new Date(createdAt) : null;
  const departure = departureDate ? new Date(departureDate) : null;

  if (!created || Number.isNaN(created.getTime())) {
    return {
      percent: 0,
      hoursSinceBooking: 0,
      diffDays: 0,
      hasDepartureDate: false,
    };
  }

  const hoursSinceBooking = (now.getTime() - created.getTime()) / 3600000;

  let diffDays = 0;
  let hasDepartureDate = false;

  if (departure && !Number.isNaN(departure.getTime())) {
    hasDepartureDate = true;
    diffDays = Math.ceil(
      (startOfDay(departure).getTime() - startOfDay(now).getTime()) / 86400000,
    );
  }

  let percent = 0;

  if (hoursSinceBooking >= 0 && hoursSinceBooking <= REFUND_POLICY.FULL_REFUND_WINDOW_HOURS) {
    percent = 100;
  } else if (
    hoursSinceBooking > REFUND_POLICY.FULL_REFUND_WINDOW_HOURS &&
    diffDays >= REFUND_POLICY.PARTIAL_REFUND_MIN_DAYS
  ) {
    percent = 50;
  }

  return { percent, hoursSinceBooking, diffDays, hasDepartureDate };
};

// Phân bổ số tiền hoàn cho từng giao dịch, tổng luôn khớp chính xác
// với refundTotal (tránh lệch vài đồng so với số tiền thực trừ ví).
export const distributeRefundAmount = (payments = [], percent = 0) => {
  const entries = (payments || []).map((payment) => ({
    payment,
    amount: Number(payment?.amount || 0),
  }));

  const totalPaid = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const refundTotal = Math.round((totalPaid * percent) / 100);

  if (refundTotal <= 0 || entries.length === 0) {
    return { totalPaid, refundTotal, items: [] };
  }

  // Sắp xếp giảm dần: giao dịch lớn nhất hấp thụ phần làm tròn dư
  const ordered = [...entries].sort((a, b) => b.amount - a.amount);

  const items = ordered.map((entry) => ({
    payment: entry.payment,
    amount: entry.amount,
    refundAmount: Math.round((entry.amount * percent) / 100),
  }));

  const allocated = items.reduce((sum, item) => sum + item.refundAmount, 0);
  let residual = refundTotal - allocated;

  if (residual !== 0 && items.length > 0) {
    const indexes =
      residual > 0
        ? items.map((_, index) => index).sort((a, b) => items[b].amount - items[a].amount)
        : items.map((_, index) => index).sort((a, b) => items[a].amount - items[b].amount);

    for (const index of indexes) {
      if (residual === 0) break;

      const delta = residual > 0 ? Math.min(residual, 1) : Math.max(residual, -1);
      const next = items[index].refundAmount + delta;

      if (next < 0) continue;

      items[index].refundAmount = next;
      residual -= delta;
    }
  }

  return { totalPaid, refundTotal, items };
};
