<script setup>
import destinationService from "../../../services/destination.service";
import { useQuery } from "@tanstack/vue-query";
import Swal from "sweetalert2";
const {
  data: destinationData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["destinations"],
  queryFn: async () => {
    const res = await destinationService.getAll();
    return res.data.destination || res.data.data || [];
  },
  staleTime: 1000 * 60 * 5,
});

// Helper định dạng tiền tệ VNĐ
const formatCurrency = (val) => {
  if (!val && val !== 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val));
};

// Helper parse danh sách tag từ chuỗi phân cách dấu phẩy
const parseTags = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};
// xoa -mem

const sofleDelete = async (id) => {
  const isConfirm = await Swal.fire({
    title: "Xác nhận đưa vào thùng rác?",
    text: "Địa điểm này sẽ được chuyển vào thùng rác.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Đưa vào thùng rác",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
  });
  if (!isConfirm.isConfirmed) return;
  try {
    const result = await destinationService.sofleDelete(id);
    if (result.success) {
      await Swal.fire({
        title: "Thành công!",
        text: result.message,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });

      router.push("/destinations");
    } else {
      Swal.fire({
        title: "Không thể thực hiện!",
        text: result.message,
        icon: "error",
        confirmButtonText: "Đóng",
        confirmButtonColor: "#ef4444",
      });
    }
  } catch (error) {
    console.error(error);

    Swal.fire({
      title: "Có lỗi xảy ra!",
      text:
        error.response?.data?.message ||
        error.message ||
        "Không thể kết nối đến máy chủ.",
      icon: "error",
      confirmButtonText: "Đóng",
      confirmButtonColor: "#ef4444",
    });
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- ================= BACKGROUND GLOWS ================= -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        class="h-full w-full object-cover opacity-[0.07]"
        alt=""
      />
      <div class="absolute inset-0 bg-[#07090d]/95"></div>
      <div
        class="absolute left-[12%] top-[4%] h-[460px] w-[460px] rounded-full bg-orange-400/[0.045] blur-[150px]"
      ></div>
      <div
        class="absolute right-[6%] top-[30%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.035] blur-[160px]"
      ></div>
    </div>

    <!-- ================= MAIN WRAPPER (CENTERED) ================= -->
    <div class="w-full min-h-screen flex flex-col items-center">
      <!-- HEADER -->
      <header
        class="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090d]/85 backdrop-blur-2xl"
      >
        <div
          class="mx-auto flex h-[80px] max-w-[1500px] items-center justify-between px-5 sm:px-8"
        >
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
              TravelGo Admin
            </div>
            <h1
              class="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
            >
              Quản lý điểm đến
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Cài đặt"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- ================= CONTENT ================= -->
      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <!-- INTRO HERO BANNER -->
        <section
          class="relative mb-8 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div
            class="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-400/[0.07] blur-[120px]"
          ></div>

          <div
            class="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
                Destinations Inventory
              </div>

              <h2 class="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Cơ sở dữ liệu danh lam & điểm đến
              </h2>

              <p
                class="mt-2 max-w-2xl text-xs sm:text-sm leading-6 text-white/40"
              >
                Toàn bộ danh lam, điểm tham quan được chuẩn hóa định vị GPS, đặc
                tính văn hóa, chi phí phục vụ việc ghép Tour và tích hợp
                TravelGo AI.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <RouterLink
                to="/admin/destination/create"
                class="inline-flex items-center gap-2 rounded-xl bg-orange-300 px-5 py-3 text-xs font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-orange-400 active:translate-y-0"
              >
                <span class="text-base leading-none font-extrabold">+</span>
                <span>Thêm điểm đến mới</span>
              </RouterLink>
            </div>
          </div>
        </section>

        <!-- ================= STATS ================= -->
        <section class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <!-- TOTAL -->
          <div
            class="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-md"
          >
            <p class="text-xs font-medium text-white/40">Tổng điểm đến</p>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-extrabold text-white">
                {{ destinationData?.length ?? 0 }}
              </p>
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Hệ thống sẵn sàng
              </span>
            </div>
          </div>

          <!-- ACTIVE IN TOURS -->
          <div
            class="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-md"
          >
            <p class="text-xs font-medium text-white/40">Đang có trong tour</p>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-extrabold text-white">
                {{ destinationData ? Math.min(destinationData.length, 96) : 0 }}
              </p>
              <span class="text-[11px] text-white/35">Đã gắn lịch trình</span>
            </div>
          </div>

          <!-- PROVINCES -->
          <div
            class="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-md"
          >
            <p class="text-xs font-medium text-white/40">Độ phủ tỉnh / thành</p>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-extrabold text-orange-200">
                {{
                  destinationData
                    ? new Set(destinationData.map((d) => d.province)).size
                    : 0
                }}
              </p>
              <span class="text-[11px] text-white/35">Tỉnh / Thành phố</span>
            </div>
          </div>

          <!-- AI READY -->
          <div
            class="rounded-[22px] border border-purple-300/15 bg-purple-300/[0.035] p-5 shadow-lg backdrop-blur-md"
          >
            <p class="text-xs font-medium text-purple-200/60">
              Tương thích TravelGo AI
            </p>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-extrabold text-purple-200">91%</p>
              <span class="text-[11px] text-purple-200/50"
                >Đầy đủ tọa độ & đặc tính</span
              >
            </div>
          </div>
        </section>

        <!-- ================= FILTER BAR ================= -->
        <section
          class="mb-6 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-md"
        >
          <div
            class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
          >
            <!-- SEARCH -->
            <div class="relative w-full xl:max-w-[420px]">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo tên điểm đến, tỉnh thành, tọa độ..."
                class="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-xs sm:text-sm text-white outline-none placeholder:text-white/25 transition focus:border-orange-300/40"
              />
            </div>

            <!-- FILTERS -->
            <div class="flex flex-wrap items-center gap-2.5">
              <select
                class="h-10 rounded-xl border border-white/10 bg-[#0c1016] px-3.5 text-xs text-white/70 outline-none transition focus:border-orange-300/40"
              >
                <option value="">Tất cả tỉnh thành</option>
                <option value="Quảng Ninh">Quảng Ninh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Quảng Nam">Quảng Nam</option>
                <option value="Hà Nội">Hà Nội</option>
              </select>

              <select
                class="h-10 rounded-xl border border-white/10 bg-[#0c1016] px-3.5 text-xs text-white/70 outline-none transition focus:border-orange-300/40"
              >
                <option value="">Loại hình du lịch</option>
                <option value="Biển">Biển đảo</option>
                <option value="Núi">Núi non</option>
                <option value="Văn hóa">Di sản văn hóa</option>
                <option value="Nghỉ dưỡng">Nghỉ dưỡng</option>
              </select>

              <select
                class="h-10 rounded-xl border border-white/10 bg-[#0c1016] px-3.5 text-xs text-white/70 outline-none transition focus:border-orange-300/40"
              >
                <option value="">Trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ẩn</option>
              </select>

              <button
                class="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <span>Thiết lập lại</span>
              </button>
            </div>
          </div>
        </section>

        <!-- ================= DESTINATION GRID ================= -->
        <section>
          <!-- GRID HEADER -->
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-white">Danh sách điểm đến</h2>
              <p class="mt-0.5 text-xs text-white/35">
                Hiển thị {{ destinationData?.length ?? 0 }} địa danh được lưu
                trong cơ sở dữ liệu
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-300/10 text-orange-200"
                title="Dạng lưới"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- LOADING SKELETON -->
          <div
            v-if="isLoading"
            class="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <div
              v-for="i in 6"
              :key="i"
              class="h-[430px] rounded-[24px] border border-white/5 bg-white/[0.02] p-4 animate-pulse"
            >
              <div class="h-48 w-full rounded-2xl bg-white/5"></div>
              <div class="mt-4 h-4 w-2/3 rounded bg-white/5"></div>
              <div class="mt-3 h-3 w-1/3 rounded bg-white/5"></div>
              <div class="mt-5 grid grid-cols-2 gap-3">
                <div class="h-12 rounded-xl bg-white/5"></div>
                <div class="h-12 rounded-xl bg-white/5"></div>
              </div>
            </div>
          </div>

          <!-- EMPTY STATE -->
          <div
            v-else-if="!destinationData || destinationData.length === 0"
            class="flex flex-col items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.02] py-16 text-center"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl text-white/30"
            >
              ⌖
            </div>
            <h3 class="mt-4 text-base font-bold text-white">
              Chưa có điểm đến nào
            </h3>
            <p class="mt-1 text-xs text-white/40">
              Bấm nút "Thêm điểm đến mới" để bắt đầu khởi tạo dữ liệu.
            </p>
          </div>

          <!-- REAL DATA GRID -->
          <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="value in destinationData"
              :key="value.id"
              class="group flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/30 hover:bg-white/[0.045]"
            >
              <!-- TOP IMAGE BANNER -->
              <div>
                <div class="relative h-52 w-full overflow-hidden bg-black/40">
                  <img
                    :src="
                      value.image
                        ? `http://localhost:8080/${value.image}`
                        : 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=85'
                    "
                    :alt="value.name"
                    class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div
                    class="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/30 to-transparent"
                  ></div>

                  <!-- BADGE STATUS -->
                  <div class="absolute left-4 top-4">
                    <span
                      v-if="value.status === 'active' || !value.status"
                      class="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      ></span>
                      ACTIVE
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/50 backdrop-blur-md"
                    >
                      INACTIVE
                    </span>
                  </div>

                  <!-- ACTION MENU BUTTON -->
                  <button
                    class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white/70 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
                  >
                    <span class="font-bold text-sm leading-none">⋮</span>
                  </button>

                  <!-- PROVINCE & NAME OVERLAY -->
                  <div class="absolute bottom-4 left-4 right-4">
                    <p
                      class="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/80"
                    >
                      {{ value.province || "Việt Nam" }}
                    </p>
                    <h3
                      class="mt-1 truncate text-lg font-bold text-white group-hover:text-orange-200 transition"
                    >
                      {{ value.name }}
                    </h3>
                  </div>
                </div>

                <!-- BODY INFO -->
                <div class="p-5">
                  <!-- COORDINATES -->
                  <div class="flex items-center gap-2 text-xs text-white/40">
                    <svg
                      class="h-3.5 w-3.5 text-orange-300/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span class="truncate font-mono text-[11px]">
                      {{
                        value.latitude
                          ? `${value.latitude}° N, ${value.longitude}° E`
                          : "Chưa có tọa độ GPS"
                      }}
                    </span>
                  </div>

                  <!-- STATS BOXES -->
                  <div class="mt-4 grid grid-cols-2 gap-3">
                    <div
                      class="rounded-xl border border-white/5 bg-black/25 p-3"
                    >
                      <p class="text-[10px] font-medium text-white/35">
                        Thời gian tham quan
                      </p>
                      <p
                        class="mt-1 text-xs sm:text-sm font-semibold text-white"
                      >
                        {{
                          value.estimated_visit_time
                            ? `${value.estimated_visit_time} phút`
                            : "Tự do"
                        }}
                      </p>
                    </div>

                    <div
                      class="rounded-xl border border-white/5 bg-black/25 p-3"
                    >
                      <p class="text-[10px] font-medium text-white/35">
                        Chi phí trung bình
                      </p>
                      <p
                        class="mt-1 text-xs sm:text-sm font-semibold text-orange-200"
                      >
                        {{ formatCurrency(value.average_cost) }}
                      </p>
                    </div>
                  </div>

                  <!-- TAGS BADGES -->
                  <div class="mt-4 flex flex-wrap gap-1.5">
                    <span
                      v-if="value.age_suitable"
                      class="rounded-lg border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-200"
                    >
                      {{ value.age_suitable }}
                    </span>
                    <span
                      v-for="act in parseTags(value.activity_types)"
                      :key="act"
                      class="rounded-lg border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-medium text-purple-200"
                    >
                      {{ act }}
                    </span>
                    <span
                      v-if="value.best_time"
                      class="rounded-lg border border-orange-300/20 bg-orange-300/10 px-2 py-0.5 text-[10px] font-medium text-orange-200"
                    >
                      {{ value.best_time }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- FOOTER ACTION -->
              <div
                class="mx-5 mb-5 flex items-center justify-between border-t border-white/[0.06] pt-4"
              >
                <span class="text-[11px] text-white/35">
                  ID: #{{ value.id }}
                </span>
                <button
                  type="submit"
                  @click="sofleDelete(value.id)"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-200"
                >
                  <span> Xoá</span>
                  <span class="text-sm">→</span>
                </button>
                <RouterLink
                  :to="`/admin/destination/${value.id}/edit`"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-200"
                >
                  <span>Sửa</span>
                  <span class="text-sm">→</span>
                </RouterLink>
                <RouterLink
                  :to="`/admin/destination/${value.id} `"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-200"
                >
                  <span>Chi tiết</span>
                  <span class="text-sm">→</span>
                </RouterLink>
              </div>
            </article>
          </div>
        </section>

        <!-- ================= PAGINATION ================= -->
        <div
          class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-6 sm:flex-row"
        >
          <p class="text-xs text-white/35">
            Hiển thị
            <span class="font-semibold text-white/80"
              >1–{{ destinationData?.length ?? 0 }}</span
            >
            trong tổng số
            <span class="font-semibold text-white/80">{{
              destinationData?.length ?? 0
            }}</span>
            điểm đến
          </p>

          <div class="flex items-center gap-1.5">
            <button
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              ‹
            </button>
            <button
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-300 text-xs font-bold text-slate-900 shadow-md"
            >
              1
            </button>
            <button
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              2
            </button>
            <button
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              ›
            </button>
          </div>
        </div>

        <!-- ================= AI DATA QUALITY ================= -->
        <section
          class="mt-8 overflow-hidden rounded-[26px] border border-purple-300/15 bg-purple-300/[0.025] p-6 shadow-xl backdrop-blur-md"
        >
          <div
            class="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-300/10 text-lg text-purple-200"
              >
                ✦
              </div>

              <div>
                <p
                  class="text-[10px] uppercase tracking-[0.22em] text-purple-200/60 font-semibold"
                >
                  TravelGo AI Engine
                </p>

                <h2 class="mt-1 text-base font-bold text-white">
                  Chất lượng dữ liệu điểm đến
                </h2>

                <p class="mt-1.5 max-w-2xl text-xs leading-5 text-white/40">
                  Dữ liệu điểm đến được sử dụng để AI đề xuất địa điểm và xây
                  dựng lịch trình phù hợp với sở thích, thời gian, ngân sách và
                  điều kiện chuyến đi.
                </p>
              </div>
            </div>

            <div class="min-w-[220px]">
              <div class="mb-2 flex items-center justify-between">
                <span
                  class="text-[10px] uppercase tracking-wider text-white/40 font-semibold"
                  >AI Ready Score</span
                >
                <span class="text-sm font-bold text-purple-200">91%</span>
              </div>

              <div class="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  class="h-full w-[91%] rounded-full bg-gradient-to-r from-purple-400 to-orange-300"
                ></div>
              </div>

              <p class="mt-2 text-right text-[10px] text-white/30">
                12 điểm đến cần bổ sung thêm tọa độ
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
