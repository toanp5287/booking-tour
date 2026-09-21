<script setup>
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import bookingService from "../../../services/booking.service";
import { useQuery } from "@tanstack/vue-query";

const route = useRoute();
const id = route.params.id;

const { data: bookingDetail, isLoading } = useQuery({
  queryKey: ["bookingDetail", id],
  queryFn: async () => {
    const res = await bookingService.getDetail(id);
    return res.data.data;
  },
});

// Helper định dạng tiền tệ VND
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0 ₫";
  return Number(amount).toLocaleString("vi-VN") + " ₫";
};

// Helper định dạng ngày tháng (DD/MM/YYYY)
const formatDate = (isoString) => {
  if (!isoString) return "--/--/----";
  const date = new Date(isoString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper định dạng ngày giờ (DD/MM/YYYY HH:mm)
const formatDateTime = (isoString) => {
  if (!isoString) return "--/--/---- --:--";
  const date = new Date(isoString);
  return (
    date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

// Helper lấy giờ (HH:mm)
const formatTimeOnly = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Xử lý link thumbnail tour từ đường dẫn backend
const tourThumbnailUrl = computed(() => {
  const path = bookingDetail.value?.tour?.thumbnail;
  if (!path) {
    return "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1400&q=85";
  }
  const cleanPath = path.replace(/\\/g, "/");
  return cleanPath.startsWith("http") ? cleanPath : `/${cleanPath}`;
});

// Lấy giao dịch thanh toán mới nhất
const latestPayment = computed(() => {
  const payments = bookingDetail.value?.payments;
  return payments && payments.length > 0 ? payments[0] : null;
});
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- ================= BACKGROUND GLOWS ================= -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 bg-[#07090d]/95"></div>
      <div
        class="absolute left-[10%] top-[8%] h-[500px] w-[500px] rounded-full bg-orange-400/[0.045] blur-[170px]"
      ></div>
      <div
        class="absolute right-[12%] top-[25%] h-[520px] w-[520px] rounded-full bg-purple-500/[0.035] blur-[180px]"
      ></div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="isLoading" class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-transparent"
        ></div>
        <p class="mt-3 text-xs text-white/50 tracking-widest uppercase">
          Đang tải dữ liệu đơn...
        </p>
      </div>
    </div>

    <!-- ================= MAIN WRAPPER ================= -->
    <div
      v-else-if="bookingDetail"
      class="w-full min-h-screen flex flex-col items-center"
    >
      <!-- HEADER BAR -->
      <header
        class="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090d]/85 backdrop-blur-2xl"
      >
        <div
          class="mx-auto flex h-[80px] max-w-[1500px] items-center justify-between px-5 sm:px-8"
        >
          <div class="flex items-center gap-4">
            <RouterLink
              to="/admin/bookingList"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Quay lại danh sách"
            >
              ←
            </RouterLink>
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
                Chi tiết đơn hàng #BK-{{ bookingDetail.id }}
              </div>
              <h1
                class="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl capitalize"
              >
                Hồ sơ đặt tour: {{ bookingDetail.booker_name }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              onclick="window.print()"
              class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              🖨 In hợp đồng / Vé
            </button>
            <RouterLink
              to="/admin/bookingList"
              class="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Quay lại danh sách
            </RouterLink>
          </div>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- CỘT TRÁI (8 CỘT) -->
          <div class="space-y-8 lg:col-span-8">
            <!-- 1. TỔNG QUAN TOUR & LỊCH TRÌNH -->
            <section
              class="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl"
            >
              <div class="relative h-48 w-full sm:h-56">
                <img
                  :src="tourThumbnailUrl"
                  :alt="bookingDetail.tour?.name"
                  class="h-full w-full object-cover"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-[#0c1016] via-[#0c1016]/40 to-transparent"
                ></div>
                <div
                  class="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <span
                      class="rounded-md bg-orange-300/20 px-2.5 py-0.5 text-[10px] font-bold text-orange-200 backdrop-blur-sm"
                    >
                      MÃ TOUR: #TG-{{ bookingDetail.tour?.id }}
                    </span>
                    <h2 class="mt-1 text-lg font-bold text-white sm:text-xl">
                      {{ bookingDetail.tour?.name }}
                    </h2>
                  </div>
                  <div class="flex gap-2">
                    <span
                      class="rounded-xl border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white/80"
                    >
                      Lịch khởi hành: #{{ bookingDetail.schedule?.id }} (Trạng
                      thái: {{ bookingDetail.schedule?.status }})
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="grid grid-cols-2 gap-4 border-t border-white/[0.06] p-6 sm:grid-cols-4"
              >
                <div>
                  <span
                    class="block text-[10px] uppercase tracking-wider text-white/40"
                    >Ngày khởi hành</span
                  >
                  <span class="text-xs font-bold text-white font-mono">
                    {{ formatDate(bookingDetail.schedule?.departure_date) }}
                    <span
                      v-if="bookingDetail.schedule?.departure_time"
                      class="text-white/60"
                    >
                      ({{
                        formatTimeOnly(bookingDetail.schedule?.departure_time)
                      }})
                    </span>
                  </span>
                </div>
                <div>
                  <span
                    class="block text-[10px] uppercase tracking-wider text-white/40"
                    >Ngày kết thúc</span
                  >
                  <span class="text-xs font-bold text-white font-mono">
                    {{ formatDate(bookingDetail.schedule?.return_date) }}
                    <span
                      v-if="bookingDetail.schedule?.return_time"
                      class="text-white/60"
                    >
                      ({{
                        formatTimeOnly(bookingDetail.schedule?.return_time)
                      }})
                    </span>
                  </span>
                </div>
                <div>
                  <span
                    class="block text-[10px] uppercase tracking-wider text-white/40"
                    >Quy mô đoàn</span
                  >
                  <span class="text-xs font-bold text-orange-200">
                    {{ bookingDetail.total_people }} Hành khách
                  </span>
                </div>
                <div>
                  <span
                    class="block text-[10px] uppercase tracking-wider text-white/40"
                    >Tài khoản liên kết</span
                  >
                  <span class="text-xs font-bold text-purple-200 font-mono">
                    User #{{ bookingDetail.user?.id }} ({{
                      bookingDetail.user?.phone || "N/A"
                    }})
                  </span>
                </div>
              </div>
            </section>

            <!-- 2. THÔNG TIN KHÁCH HÀNG ĐẠI DIỆN -->
            <section
              class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div
                class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
              >
                <div>
                  <h3 class="text-base font-bold text-orange-200">
                    2. Khách hàng đại diện đặt tour
                  </h3>
                  <p class="mt-0.5 text-xs text-white/40">
                    Hồ sơ người liên hệ trực tiếp đơn đặt
                  </p>
                </div>
                <span class="text-xs font-mono text-white/30"
                  >User ID: #{{ bookingDetail.user?.id }}</span
                >
              </div>

              <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <span class="mb-1.5 block text-xs font-semibold text-white/40"
                    >Họ và tên</span
                  >
                  <div
                    class="flex h-11 items-center rounded-xl border border-white/5 bg-black/25 px-4 text-sm font-semibold text-white/90 capitalize"
                  >
                    {{ bookingDetail.booker_name }}
                  </div>
                </div>

                <div>
                  <span class="mb-1.5 block text-xs font-semibold text-white/40"
                    >Số điện thoại</span
                  >
                  <div
                    class="flex h-11 items-center rounded-xl border border-white/5 bg-black/25 px-4 font-mono text-sm text-white/90"
                  >
                    {{ bookingDetail.booker_phone }}
                  </div>
                </div>

                <div>
                  <span class="mb-1.5 block text-xs font-semibold text-white/40"
                    >Địa chỉ Email</span
                  >
                  <div
                    class="flex h-11 items-center rounded-xl border border-white/5 bg-black/25 px-4 text-sm text-white/90"
                  >
                    {{ bookingDetail.booker_email }}
                  </div>
                </div>

                <div>
                  <span class="mb-1.5 block text-xs font-semibold text-white/40"
                    >Số CCCD / Hộ chiếu</span
                  >
                  <div
                    class="flex h-11 items-center rounded-xl border border-white/5 bg-black/25 px-4 font-mono text-sm text-white/90"
                  >
                    {{
                      bookingDetail.booker_identity_number || "Chưa cập nhật"
                    }}
                  </div>
                </div>

                <div class="md:col-span-2">
                  <span class="mb-1.5 block text-xs font-semibold text-white/40"
                    >Nơi đón / Khởi hành</span
                  >
                  <div
                    class="flex h-11 items-center rounded-xl border border-white/5 bg-black/25 px-4 text-sm text-white/90"
                  >
                    {{
                      bookingDetail.departure || "Theo lịch trình tiêu chuẩn"
                    }}
                  </div>
                </div>
              </div>
            </section>

            <!-- 3. DANH SÁCH HÀNH KHÁCH (details) -->
            <section
              class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div
                class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
              >
                <div>
                  <h3 class="text-base font-bold text-orange-200">
                    3. Danh sách hành khách đi cùng ({{
                      bookingDetail.details?.length || 0
                    }}
                    khách)
                  </h3>
                  <p class="mt-0.5 text-xs text-white/40">
                    Thông tin phục vụ bảo hiểm du lịch và điều phối dịch vụ
                  </p>
                </div>
                <span class="text-xs font-mono text-white/30">
                  details count: {{ bookingDetail.details?.length || 0 }}
                </span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="border-b border-white/[0.08] text-white/40">
                      <th class="pb-3 font-semibold uppercase">Mã HK</th>
                      <th class="pb-3 font-semibold uppercase">Họ và tên</th>
                      <th class="pb-3 font-semibold uppercase">
                        Số điện thoại
                      </th>
                      <th class="pb-3 font-semibold uppercase">Email</th>
                      <th class="pb-3 font-semibold uppercase">Giới tính</th>
                      <th class="pb-3 font-semibold uppercase">Ngày sinh</th>
                      <th class="pb-3 font-semibold uppercase">
                        CCCD / Hộ chiếu
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/[0.04] text-white/80">
                    <tr
                      v-for="passenger in bookingDetail.details"
                      :key="passenger.id"
                    >
                      <td class="py-3.5 font-mono text-white/40">
                        #{{ passenger.id }}
                      </td>
                      <td class="py-3.5 font-bold text-white capitalize">
                        {{ passenger.full_name }}
                      </td>
                      <td class="py-3.5 font-mono text-white/70">
                        {{ passenger.phone || "--" }}
                      </td>
                      <td class="py-3.5 text-white/70">
                        {{ passenger.email || "--" }}
                      </td>
                      <td class="py-3.5">
                        <span
                          class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase"
                          :class="
                            passenger.gender === 'FEMALE'
                              ? 'bg-purple-400/10 text-purple-200'
                              : 'bg-blue-400/10 text-blue-200'
                          "
                        >
                          {{
                            passenger.gender === "FEMALE"
                              ? "Nữ (FEMALE)"
                              : passenger.gender === "MALE"
                                ? "Nam (MALE)"
                                : passenger.gender
                          }}
                        </span>
                      </td>
                      <td class="py-3.5 font-mono text-white/70">
                        {{ formatDate(passenger.date_of_birth) }}
                      </td>
                      <td
                        class="py-3.5 font-mono text-orange-200/90 font-semibold"
                      >
                        {{ passenger.identity_number || "--" }}
                      </td>
                    </tr>
                    <tr v-if="!bookingDetail.details?.length">
                      <td colspan="7" class="py-6 text-center text-white/40">
                        Chưa có thông tin hành khách chi tiết.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 4. LỊCH SỬ GIAO DỊCH THANH TOÁN -->
            <section
              class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div
                class="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4"
              >
                <div>
                  <h3 class="text-base font-bold text-orange-200">
                    4. Lịch sử giao dịch thanh toán
                  </h3>
                  <p class="mt-0.5 text-xs text-white/40">
                    Chi tiết hóa đơn đối soát từ bảng payments
                  </p>
                </div>
                <span class="text-xs font-mono text-white/40">
                  {{ bookingDetail.payments?.length || 0 }} Giao dịch
                </span>
              </div>

              <!-- CÓ BẢN GHI THANH TOÁN -->
              <div v-if="bookingDetail.payments?.length" class="space-y-4">
                <div
                  v-for="payment in bookingDetail.payments"
                  :key="payment.id"
                  class="rounded-xl border border-white/10 bg-black/25 p-4 text-xs space-y-3"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-sm font-mono">{{
                        payment.payment_code
                      }}</span>
                      <span
                        class="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                        :class="
                          payment.status === 'paid'
                            ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                            : 'bg-amber-400/10 text-amber-300'
                        "
                      >
                        {{ payment.status }}
                      </span>
                    </div>
                    <span class="font-mono text-orange-300 font-bold text-sm">
                      {{ formatCurrency(payment.amount) }}
                    </span>
                  </div>

                  <div
                    class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-white/70"
                  >
                    <div>
                      <span class="block text-white/40 text-[10px]"
                        >Mã GD (Txn Code):</span
                      >
                      <span class="font-mono text-white">{{
                        payment.transaction_code || "--"
                      }}</span>
                    </div>
                    <div>
                      <span class="block text-white/40 text-[10px]"
                        >Phương thức:</span
                      >
                      <span class="font-bold text-white">{{
                        payment.payment_method
                      }}</span>
                    </div>
                    <div>
                      <span class="block text-white/40 text-[10px]"
                        >Ngân hàng:</span
                      >
                      <span class="text-white">{{
                        payment.gateway_response?.vnp_BankCode || "--"
                      }}</span>
                    </div>
                    <div>
                      <span class="block text-white/40 text-[10px]"
                        >Thời gian thanh toán:</span
                      >
                      <span class="font-mono text-white">{{
                        formatDateTime(payment.paid_at)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KHÔNG CÓ BẢN GHI THANH TOÁN -->
              <div
                v-else
                class="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-xs text-white/40"
              >
                Chưa có bản ghi thanh toán nào được ghi nhận cho đơn đặt tour
                này.
              </div>
            </section>

            <!-- 5. YÊU CẦU ĐẶC BIỆT -->
            <section
              class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div class="mb-4 border-b border-white/[0.06] pb-3">
                <h3 class="text-base font-bold text-orange-200">
                  5. Yêu cầu đặc biệt từ du khách
                </h3>
              </div>
              <div
                class="rounded-xl border border-white/5 bg-black/25 p-4 text-xs leading-relaxed"
                :class="
                  bookingDetail.special_request
                    ? 'text-white/90'
                    : 'text-white/40 italic'
                "
              >
                {{
                  bookingDetail.special_request ||
                  "Không có yêu cầu phục vụ đặc biệt nào được ghi nhận cho đơn này."
                }}
              </div>
            </section>
          </div>

          <!-- CỘT PHẢI: TRẠNG THÁI & QUYẾT TOÁN (4 CỘT) -->
          <div class="space-y-6 lg:col-span-4">
            <div
              class="sticky top-[100px] rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div class="border-b border-white/[0.06] pb-4">
                <span
                  class="text-[10px] font-semibold uppercase tracking-wider text-white/40"
                  >Hệ thống giám sát</span
                >
                <h3 class="text-base font-bold text-white mt-0.5">
                  Tình trạng đơn hàng
                </h3>
              </div>

              <!-- TRẠNG THÁI BOOKING -->
              <div>
                <span class="mb-2 block text-xs font-semibold text-white/40"
                  >Trạng thái booking</span
                >
                <div
                  class="flex h-11 items-center justify-between rounded-xl border px-4 text-xs font-bold uppercase tracking-wider"
                  :class="
                    bookingDetail.status === 'confirmed'
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                  "
                >
                  <span>● {{ bookingDetail.status }}</span>
                  <span
                    class="text-[10px] font-normal lowercase font-mono opacity-70"
                  >
                    #{{ bookingDetail.status }}
                  </span>
                </div>
              </div>

              <!-- TRẠNG THÁI THANH TOÁN -->
              <div>
                <span class="mb-2 block text-xs font-semibold text-white/40"
                  >Tình trạng thanh toán</span
                >
                <div
                  class="flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-bold"
                  :class="
                    latestPayment?.status === 'paid'
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border-red-400/20 bg-red-400/10 text-red-300'
                  "
                >
                  <span>●</span>
                  <span class="uppercase">
                    {{
                      latestPayment?.status === "paid"
                        ? "Đã thanh toán đủ"
                        : "Chưa thanh toán"
                    }}
                  </span>
                </div>
              </div>

              <!-- HÌNH THỨC CHI TRẢ -->
              <div>
                <span class="mb-2 block text-xs font-semibold text-white/40"
                  >Hình thức thanh toán</span
                >
                <div
                  class="rounded-xl border border-white/5 bg-black/25 px-4 py-3 text-xs font-semibold text-white/80 leading-relaxed font-mono"
                >
                  {{
                    latestPayment?.payment_method ||
                    "Chưa xác định cổng thanh toán"
                  }}
                </div>
              </div>

              <!-- THỜI GIAN TẠO / CẬP NHẬT -->
              <div
                class="space-y-2 border-t border-white/[0.06] pt-4 text-xs text-white/50"
              >
                <div class="flex justify-between">
                  <span>Ngày tạo đơn:</span>
                  <span class="font-mono text-white">{{
                    formatDateTime(bookingDetail.created_at)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Cập nhật:</span>
                  <span class="font-mono text-white">{{
                    formatDateTime(bookingDetail.updated_at)
                  }}</span>
                </div>
              </div>

              <!-- HÓA ĐƠN CHI TIẾT -->
              <div
                class="border-t border-white/[0.06] pt-4 space-y-2.5 text-xs"
              >
                <div class="flex justify-between text-white/50">
                  <span>Đơn giá tour</span>
                  <span class="font-mono text-white">{{
                    formatCurrency(bookingDetail.tour?.price)
                  }}</span>
                </div>
                <div class="flex justify-between text-white/50">
                  <span>Số lượng hành khách</span>
                  <span class="font-bold text-white"
                    >{{ bookingDetail.total_people }} Khách</span
                  >
                </div>
                <div class="flex justify-between text-white/50">
                  <span>Bảo hiểm &amp; Thuế GTGT</span>
                  <span class="text-emerald-400 font-semibold">Đã bao gồm</span>
                </div>

                <div class="border-t border-white/[0.06] pt-3">
                  <span
                    class="text-[10px] uppercase tracking-wider text-white/40 block"
                    >Tổng thanh toán</span
                  >
                  <div class="mt-1 flex items-baseline justify-between">
                    <span
                      class="text-2xl font-extrabold text-orange-300 font-mono"
                    >
                      {{ formatCurrency(bookingDetail.total_amount) }}
                    </span>
                    <span
                      class="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
                      :class="
                        bookingDetail.status === 'confirmed'
                          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                          : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                      "
                    >
                      {{ bookingDetail.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
