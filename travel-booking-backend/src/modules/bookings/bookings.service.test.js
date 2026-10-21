import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWED_BOOKING_TRANSITIONS,
  BOOKING_KIND,
  BOOKING_STATUS,
  TERMINAL_BOOKING_STATUSES,
  calcRefundPolicy,
  canTransitionBooking,
  classifyBookingKind,
  distributeRefundAmount,
  getCheckinWindow,
  isRegularTicketBooking,
  isTerminalBookingStatus,
  normalizeBookingStatus,
} from "./bookings.service.js";

describe("bookings.service", () => {
  it("normalizes legacy statuses", () => {
    assert.equal(normalizeBookingStatus("READY"), BOOKING_STATUS.CONFIRMED);
    assert.equal(normalizeBookingStatus("PAID"), BOOKING_STATUS.CONFIRMED);
    assert.equal(normalizeBookingStatus("LOCKED"), BOOKING_STATUS.CONFIRMED);
    assert.equal(normalizeBookingStatus("ONGOING"), BOOKING_STATUS.IN_PROGRESS);
    assert.equal(normalizeBookingStatus("CANCELED"), BOOKING_STATUS.CANCELLED);
    assert.equal(normalizeBookingStatus("CANCEL"), BOOKING_STATUS.CANCELLED);
    assert.equal(normalizeBookingStatus("COMPLETE"), BOOKING_STATUS.COMPLETED);
    assert.equal(normalizeBookingStatus("FINISHED"), BOOKING_STATUS.COMPLETED);
    assert.equal(normalizeBookingStatus("NOT_ATTENDED"), BOOKING_STATUS.NO_SHOW);
  });

  it("enforces the correct transition matrix", () => {
    // Chính xác theo luồng yêu cầu
    assert.ok(canTransitionBooking("CONFIRMED", "CHECKED_IN"));
    assert.ok(canTransitionBooking("CONFIRMED", "NO_SHOW"));
    assert.ok(canTransitionBooking("CONFIRMED", "CANCELLED"));
    assert.ok(canTransitionBooking("CHECKED_IN", "IN_PROGRESS"));
    assert.ok(canTransitionBooking("IN_PROGRESS", "COMPLETED"));

    // Không được bỏ qua bước
    assert.ok(!canTransitionBooking("PENDING", "CHECKED_IN"));
    assert.ok(!canTransitionBooking("CONFIRMED", "IN_PROGRESS"));
    assert.ok(!canTransitionBooking("CHECKED_IN", "COMPLETED"));

    // Không được đi ngược
    assert.ok(!canTransitionBooking("COMPLETED", "CHECKED_IN"));
    assert.ok(!canTransitionBooking("CANCELLED", "CONFIRMED"));
    assert.ok(!canTransitionBooking("NO_SHOW", "COMPLETED"));
    assert.ok(!canTransitionBooking("REFUNDED", "CANCELLED"));

    // Hủy -> chỉ sang chờ hoàn, hoàn tiền -> hoàn thành
    assert.ok(canTransitionBooking("CANCELLED", "REFUND_PENDING"));
    assert.ok(canTransitionBooking("REFUND_PENDING", "REFUNDED"));

    // Không còn bắt buộc qua LOCKED
    assert.ok(!canTransitionBooking("CONFIRMED", "LOCKED"));
  });

  it("marks terminal statuses correctly", () => {
    for (const status of TERMINAL_BOOKING_STATUSES) {
      assert.ok(isTerminalBookingStatus(status));
    }

    // LOCKED là trạng thái cũ; ma trận mới không dùng làm terminal theo nghĩa "không cập nhật"
    // nhưng service vẫn coi là terminal để tránh sửa nhầm booking cũ
    assert.ok(isTerminalBookingStatus("LOCKED"));
    assert.ok(!isTerminalBookingStatus("CONFIRMED"));
    assert.ok(!isTerminalBookingStatus("CHECKED_IN"));
  });

  it("classifies booking kind correctly", () => {
    // Vé thông thường
    assert.equal(
      classifyBookingKind({ selected_tour_type: "SIC", quotation_id: null, custom_request_id: null }),
      BOOKING_KIND.REGULAR,
    );
    assert.equal(
      classifyBookingKind({ selected_tour_type: "PRIVATE", quotation_id: null, custom_request_id: null }),
      BOOKING_KIND.REGULAR,
    );
    assert.equal(isRegularTicketBooking({ selected_tour_type: "SIC" }), true);

    // Tour đoàn
    assert.equal(
      classifyBookingKind({ selected_tour_type: "SIC", quotation_id: 123n }),
      BOOKING_KIND.GROUP,
    );
    assert.equal(
      classifyBookingKind({ selected_tour_type: "GROUP", quotation_id: null }),
      BOOKING_KIND.GROUP,
    );

    // Tour custom
    assert.equal(
      classifyBookingKind({ selected_tour_type: "SIC", custom_request_id: 45n }),
      BOOKING_KIND.CUSTOM,
    );
    assert.equal(
      classifyBookingKind({ selected_tour_type: "CUSTOM", quotation_id: null, custom_request_id: null }),
      BOOKING_KIND.CUSTOM,
    );
  });

  it("checks check-in window (24h before - 2h after)", () => {
    // Giờ khởi hành 08:00 ngày 2026-10-23 (local)
    const schedule = {
      departure_date: new Date("2026-10-23T00:00:00.000Z"),
      departure_time: new Date("1970-01-01T08:00:00.000Z"),
    };

    // Trong cửa sổ: 07:00 cùng ngày
    const inside = new Date(2026, 9, 23, 7, 0, 0, 0);
    const window = getCheckinWindow(schedule, inside);
    assert.ok(window?.isOpen);

    // Mở cửa: 08:00 ngày hôm trước
    const atOpen = new Date(2026, 9, 22, 8, 0, 0, 0);
    const wOpen = getCheckinWindow(schedule, atOpen);
    assert.ok(wOpen?.isOpen);

    // Trước cửa sổ mở: 07:00 ngày hôm trước
    const tooEarly = new Date(2026, 9, 22, 7, 0, 0, 0);
    const w2 = getCheckinWindow(schedule, tooEarly);
    assert.ok(w2 && !w2.isOpen);

    // Sau cửa sổ đóng: 10:01 cùng ngày
    const tooLate = new Date(2026, 9, 23, 10, 1, 0, 0);
    const w3 = getCheckinWindow(schedule, tooLate);
    assert.ok(w3 && !w3.isOpen);
  });

  it("applies refund policy correctly (100% / 50% / 0%)", () => {
    const now = new Date(2026, 9, 22, 10, 0, 0, 0);
    const departure = new Date(2026, 9, 25, 0, 0, 0, 0);

    // Trong 48h đầu kể từ lúc đặt -> 100%
    const p1 = calcRefundPolicy({
      createdAt: new Date(2026, 9, 22, 0, 0, 0, 0),
      departureDate: departure,
      now,
    });
    assert.equal(p1.percent, 100);

    // Quá 48h và còn >= 3 ngày trước ngày đi -> 50%
    const p2 = calcRefundPolicy({
      createdAt: new Date(2026, 9, 19, 0, 0, 0, 0),
      departureDate: departure,
      now,
    });
    assert.equal(p2.percent, 50);

    // Quá 48h và còn < 3 ngày trước ngày đi -> 0%
    const departureSoon = new Date(2026, 9, 24, 0, 0, 0, 0);
    const p3 = calcRefundPolicy({
      createdAt: new Date(2026, 9, 19, 0, 0, 0, 0),
      departureDate: departureSoon,
      now,
    });
    assert.equal(p3.percent, 0);
  });

  it("distributes refund amount exactly and rounds correctly", () => {
    const payments = [
      { id: 1, amount: 1000000 },
      { id: 2, amount: 333333 },
    ];

    const result = distributeRefundAmount(payments, 50);
    assert.equal(result.refundTotal, 666667); // round(1333333*50/100)
    assert.equal(
      result.items.reduce((sum, item) => sum + item.refundAmount, 0),
      result.refundTotal,
    );
  });

  it("transition matrix is defined for main flow", () => {
    assert.deepEqual(ALLOWED_BOOKING_TRANSITIONS[BOOKING_STATUS.PENDING], [
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.CANCELLED,
    ]);
    assert.deepEqual(ALLOWED_BOOKING_TRANSITIONS[BOOKING_STATUS.CANCELLED], [
      BOOKING_STATUS.REFUND_PENDING,
    ]);
    assert.deepEqual(ALLOWED_BOOKING_TRANSITIONS[BOOKING_STATUS.REFUND_PENDING], [
      BOOKING_STATUS.REFUNDED,
    ]);
  });
});
