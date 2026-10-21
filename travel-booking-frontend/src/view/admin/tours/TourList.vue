<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import {
  Plus,
  Search,
  RotateCw,
  MapPin,
  Clock3,
  Users,
  Eye,
  Pencil,
  Trash2,
  Compass,
  Ticket,
  TrendingUp,
  LockKeyhole,
  CircleCheck,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-vue-next";
import tourService from "../../../services/tour.service";

// =========================
// USER ĐĂNG NHẬP
// =========================
const userData = localStorage.getItem("user");

const user = computed(() => {
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
});

// =========================
// LẤY DANH SÁCH TOUR
// =========================
const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ["tour", user.value?.id],
  queryFn: async () => {
    const res = await tourService.getAll();
    return res.data?.tours ?? [];
  },
});

const tours = computed(() => {
  return Array.isArray(data.value) ? data.value : [];
});

// =========================
// BỘ LỌC VÀ TÌM KIẾM
// =========================
const searchQuery = ref("");
const selectedType = ref("ALL");
const selectedStatus = ref("ALL");

// =========================
// FORMAT TIỀN
// =========================
const formatPrice = (price: number | string | null | undefined) => {
  if (
    price === null ||
    price === undefined ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) === 0
  ) {
    return "Liên hệ";
  }

  return `${Number(price).toLocaleString("vi-VN")}₫`;
};

// =========================
// HUY HIỆU LOẠI TOUR
// =========================
const getTourTypeBadge = (type?: string) => {
  const badges: Record<string, { label: string; class: string }> = {
    SIC: {
      label: "Tour ghép",
      class: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    },
    PRIVATE: {
      label: "Tour riêng",
      class: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    },
    GROUP: {
      label: "Tour đoàn / MICE",
      class: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    },
    CUSTOM: {
      label: "Thiết kế riêng",
      class: "border-pink-400/20 bg-pink-400/10 text-pink-300",
    },
  };

  return (
    badges[String(type ?? "").toUpperCase()] ?? {
      label: type || "Chưa phân loại",
      class: "border-white/10 bg-white/[0.04] text-white/60",
    }
  );
};

// =========================
// HUY HIỆU TRẠNG THÁI TOUR
// =========================
const getTourStatusBadge = (status?: string) => {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toUpperCase();

  const badges: Record<string, { label: string; class: string; dot: string }> =
    {
      ACTIVE: {
        label: "Đang mở bán",
        class: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        dot: "bg-emerald-400",
      },
      INACTIVE: {
        label: "Tạm ngưng",
        class: "border-white/10 bg-white/[0.04] text-white/50",
        dot: "bg-white/35",
      },
      LOCKED: {
        label: "Đã khóa",
        class: "border-red-400/20 bg-red-400/10 text-red-300",
        dot: "bg-red-400",
      },
    };

  return (
    badges[normalizedStatus] ?? {
      label: status || "Không xác định",
      class: "border-white/10 bg-white/[0.04] text-white/50",
      dot: "bg-white/30",
    }
  );
};

// =========================
// CHUẨN HÓA TRẠNG THÁI TOUR
// =========================
const normalizeTourStatus = (status?: string) => {
  return String(status ?? "")
    .trim()
    .toUpperCase();
};

// =========================
// TOUR SAU KHI LỌC
// =========================
const filteredTours = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return tours.value.filter((tour: any) => {
    const name = String(tour.name ?? "").toLowerCase();
    const slug = String(tour.slug ?? "").toLowerCase();
    const id = String(tour.id ?? "");

    const matchSearch =
      !keyword ||
      name.includes(keyword) ||
      slug.includes(keyword) ||
      id.includes(keyword);

    const matchType =
      selectedType.value === "ALL" ||
      String(tour.tour_type ?? "").toUpperCase() === selectedType.value;

    const matchStatus =
      selectedStatus.value === "ALL" ||
      normalizeTourStatus(tour.status) === selectedStatus.value.toUpperCase();

    return matchSearch && matchType && matchStatus;
  });
});

// =========================
// THỐNG KÊ
// =========================
const stats = computed(() => {
  const total = tours.value.length;

  const active = tours.value.filter(
    (tour: any) => normalizeTourStatus(tour.status) === "ACTIVE",
  ).length;

  const locked = tours.value.filter(
    (tour: any) => normalizeTourStatus(tour.status) === "LOCKED",
  ).length;

  const totalTicketPackages = tours.value.reduce(
    (sum: number, tour: any) =>
      sum + (Array.isArray(tour.ticket_types) ? tour.ticket_types.length : 0),
    0,
  );

  const totalPickupPoints = tours.value.reduce(
    (sum: number, tour: any) =>
      sum + (Array.isArray(tour.pickup_points) ? tour.pickup_points.length : 0),
    0,
  );

  return {
    total,
    active,
    locked,
    totalTicketPackages,
    totalPickupPoints,
  };
});
</script>

<template>
  <main class="admin-page min-h-screen bg-[#080a0f] text-white">
    <div
      class="mx-auto max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
    >
      <!-- HEADER -->
      <section
        class="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1119]"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full bg-orange-500/[0.12] blur-[100px]"
        ></div>

        <div
          class="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-72 w-72 rounded-full bg-blue-500/[0.07] blur-[100px]"
        ></div>

        <div
          class="flex flex-col gap-6 p-6 sm:p-8 xl:flex-row xl:items-center xl:justify-between"
        >
          <div class="max-w-3xl">
            <div
              class="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300"
            >
              <Compass :size="14" />
              Tour Management
            </div>

            <h1
              class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
            >
              Quản lý Tour
            </h1>

            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Quản lý danh sách tour, hạng vé, combo, hình thức tour và các điểm
              đón khách trong hệ thống.
            </p>

            <div
              class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500"
            >
              <span class="inline-flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                {{ stats.active }} tour đang mở bán
              </span>

              <span class="inline-flex items-center gap-2">
                <Ticket :size="14" />
                {{ stats.totalTicketPackages }} hạng vé
              </span>

              <span class="inline-flex items-center gap-2">
                <MapPin :size="14" />
                {{ stats.totalPickupPoints }} điểm đón
              </span>
            </div>
          </div>

          <RouterLink
            to="create"
            class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Plus :size="18" />
            Thêm tour mới
          </RouterLink>
        </div>
      </section>

      <!-- THỐNG KÊ -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          class="group rounded-2xl border border-white/[0.07] bg-[#0d1117] p-5 transition duration-200 hover:border-white/[0.14]"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Tổng số tour</p>
              <p class="mt-3 text-3xl font-bold tracking-tight">
                {{ stats.total }}
              </p>
            </div>

            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/15 bg-sky-400/[0.08] text-sky-300"
            >
              <Compass :size="21" />
            </div>
          </div>

          <div
            class="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500"
          >
            <TrendingUp :size="14" />
            Tổng số tour trong hệ thống
          </div>
        </article>

        <article
          class="group rounded-2xl border border-white/[0.07] bg-[#0d1117] p-5 transition duration-200 hover:border-emerald-400/20"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Đang mở bán</p>
              <p
                class="mt-3 text-3xl font-bold tracking-tight text-emerald-400"
              >
                {{ stats.active }}
              </p>
            </div>

            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400"
            >
              <CircleCheck :size="21" />
            </div>
          </div>

          <div
            class="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Tour đang nhận booking
          </div>
        </article>

        <article
          class="group rounded-2xl border border-white/[0.07] bg-[#0d1117] p-5 transition duration-200 hover:border-red-400/20"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Tour đã khóa</p>
              <p class="mt-3 text-3xl font-bold tracking-tight text-red-300">
                {{ stats.locked }}
              </p>
            </div>

            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.08] text-red-300"
            >
              <LockKeyhole :size="21" />
            </div>
          </div>

          <div
            class="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500"
          >
            Trạng thái LOCKED
          </div>
        </article>

        <article
          class="group rounded-2xl border border-white/[0.07] bg-[#0d1117] p-5 transition duration-200 hover:border-orange-400/20"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Hạng vé & Combo</p>
              <p class="mt-3 text-3xl font-bold tracking-tight text-orange-300">
                {{ stats.totalTicketPackages }}
              </p>
            </div>

            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/15 bg-orange-400/[0.08] text-orange-300"
            >
              <Ticket :size="21" />
            </div>
          </div>

          <div
            class="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500"
          >
            Vé lẻ, combo và gói đoàn
          </div>
        </article>
      </section>

      <!-- BỘ LỌC -->
      <section
        class="rounded-2xl border border-white/[0.07] bg-[#0d1117] p-4 sm:p-5"
      >
        <div
          class="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200"
        >
          <SlidersHorizontal :size="17" class="text-orange-300" />
          Tìm kiếm và bộ lọc
        </div>

        <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div class="relative min-w-0 flex-1">
            <Search
              :size="18"
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm theo tên tour, mã tour hoặc slug..."
              class="h-12 w-full rounded-xl border border-white/[0.08] bg-[#080b10] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/50 focus:ring-4 focus:ring-orange-400/[0.06]"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              v-model="selectedType"
              class="h-12 min-w-0 rounded-xl border border-white/[0.08] bg-[#080b10] px-4 text-sm text-slate-300 outline-none transition focus:border-orange-400/50 sm:min-w-[200px]"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="SIC">Tour ghép (SIC)</option>
              <option value="PRIVATE">Gia đình / Riêng</option>
              <option value="GROUP">Tour đoàn / MICE</option>
              <option value="CUSTOM">Thiết kế riêng</option>
            </select>

            <select
              v-model="selectedStatus"
              class="h-12 min-w-0 rounded-xl border border-white/[0.08] bg-[#080b10] px-4 text-sm text-slate-300 outline-none transition focus:border-orange-400/50 sm:min-w-[180px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang mở bán</option>
              <option value="INACTIVE">Tạm ngưng</option>
              <option value="LOCKED">Đã khóa</option>
            </select>
          </div>
        </div>
      </section>

      <!-- DANH SÁCH TOUR -->
      <section
        class="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1117]"
      >
        <header
          class="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold">Danh sách tour</h2>

              <span
                class="rounded-md border border-orange-400/15 bg-orange-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-orange-300"
              >
                {{ filteredTours.length }}
              </span>
            </div>

            <p class="mt-1.5 text-xs text-slate-500">
              Danh sách tour theo điều kiện tìm kiếm hiện tại
            </p>
          </div>

          <div
            class="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-slate-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Tổng cộng {{ tours.length }} tour
          </div>
        </header>

        <!-- ĐANG TẢI -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center px-5 py-24"
        >
          <div class="relative flex h-12 w-12 items-center justify-center">
            <div
              class="absolute inset-0 animate-spin rounded-full border-2 border-orange-400/15 border-t-orange-400"
            ></div>
            <Compass :size="19" class="text-orange-300" />
          </div>

          <p class="mt-5 text-sm font-medium text-slate-300">
            Đang tải danh sách tour
          </p>

          <p class="mt-1 text-xs text-slate-500">
            Vui lòng chờ trong giây lát...
          </p>
        </div>

        <!-- LỖI API -->
        <div
          v-else-if="isError"
          class="flex flex-col items-center justify-center px-5 py-20 text-center"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.07] text-red-300"
          >
            <RotateCw :size="23" />
          </div>

          <p class="mt-4 text-sm font-semibold text-red-300">
            Không thể tải danh sách tour
          </p>

          <p class="mt-2 max-w-md text-xs leading-5 text-slate-500">
            {{ (error as Error)?.message || "Đã xảy ra lỗi khi tải dữ liệu." }}
          </p>

          <button
            type="button"
            class="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            @click="refetch()"
          >
            <RotateCw :size="15" />
            Thử tải lại
          </button>
        </div>

        <!-- BẢNG -->
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[1250px]">
            <thead>
              <tr class="border-b border-white/[0.07] bg-white/[0.02]">
                <th
                  class="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:px-6"
                >
                  Thông tin tour
                </th>

                <th
                  class="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Quy mô
                </th>

                <th
                  class="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Giá khởi điểm
                </th>

                <th
                  class="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Hạng vé / Combo
                </th>

                <th
                  class="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Điểm đón
                </th>

                <th
                  class="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Trạng thái
                </th>

                <th
                  class="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:px-6"
                >
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/[0.055]">
              <!-- KHÔNG CÓ DỮ LIỆU -->
              <tr v-if="filteredTours.length === 0">
                <td colspan="7" class="px-5 py-24 text-center">
                  <div
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-slate-500"
                  >
                    <Search :size="27" />
                  </div>

                  <p class="mt-5 text-sm font-semibold text-slate-300">
                    Không tìm thấy tour
                  </p>

                  <p class="mt-2 text-xs text-slate-500">
                    Thử thay đổi từ khóa hoặc bộ lọc.
                  </p>
                </td>
              </tr>

              <tr
                v-for="tour in filteredTours"
                :key="tour.id"
                class="group transition-colors duration-150 hover:bg-white/[0.025]"
              >
                <!-- THÔNG TIN TOUR -->
                <td class="px-5 py-5 sm:px-6">
                  <div class="flex items-start gap-4">
                    <div
                      class="relative h-[76px] w-[108px] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#080b10]"
                    >
                      <img
                        v-if="tour.thumbnail"
                        :src="tour.thumbnail"
                        :alt="tour.name || 'Tour'"
                        loading="lazy"
                        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      <div
                        v-else
                        class="flex h-full w-full items-center justify-center text-slate-600"
                      >
                        <Compass :size="25" />
                      </div>

                      <div
                        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                      ></div>
                    </div>

                    <div class="min-w-0 max-w-[330px]">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-500">
                          #{{ tour.id }}
                        </span>

                        <span
                          class="inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-bold"
                          :class="getTourTypeBadge(tour.tour_type).class"
                        >
                          {{ getTourTypeBadge(tour.tour_type).label }}
                        </span>
                      </div>

                      <p
                        class="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-100"
                      >
                        {{ tour.name || "Chưa có tên tour" }}
                      </p>

                      <p
                        v-if="tour.category?.name"
                        class="mt-1.5 text-[11px] text-slate-400"
                      >
                        {{ tour.category.name }}
                      </p>

                      <p
                        v-if="tour.slug"
                        class="mt-1.5 truncate font-mono text-[10px] text-slate-600"
                      >
                        /{{ tour.slug }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- QUY MÔ -->
                <td class="px-4 py-5 align-top">
                  <div class="space-y-3">
                    <div class="flex items-center gap-2.5">
                      <Clock3 :size="15" class="shrink-0 text-slate-500" />
                      <span class="text-xs font-semibold text-slate-200">
                        {{ tour.duration_days ?? 0 }}N
                        {{ tour.duration_nights ?? 0 }}Đ
                      </span>
                    </div>

                    <div class="flex items-center gap-2.5">
                      <Users :size="15" class="shrink-0 text-slate-500" />
                      <span class="text-xs text-slate-400">
                        {{ tour.min_people ?? 0 }} -
                        {{ tour.max_people ?? 0 }} khách
                      </span>
                    </div>

                    <div
                      v-if="tour.transportation"
                      class="max-w-[150px] truncate rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-slate-500"
                    >
                      {{ tour.transportation }}
                    </div>
                  </div>
                </td>

                <!-- GIÁ -->
                <td class="px-4 py-5 align-top">
                  <p
                    class="whitespace-nowrap text-sm font-bold text-orange-300"
                  >
                    {{ formatPrice(tour.base_price) }}
                  </p>

                  <p class="mt-1.5 text-[10px] text-slate-500">/ khách</p>

                  <div
                    v-if="tour.difficulty_level"
                    class="mt-3 inline-flex rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-400"
                  >
                    {{ tour.difficulty_level }}
                  </div>
                </td>

                <!-- HẠNG VÉ / COMBO -->
                <td class="px-4 py-5 align-top">
                  <div
                    v-if="tour.ticket_types?.length"
                    class="max-w-[280px] space-y-2"
                  >
                    <div
                      v-for="ticket in tour.ticket_types"
                      :key="ticket.id"
                      class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.12]"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <span
                            v-if="ticket.category === 'PACKAGE'"
                            class="inline-flex rounded-md bg-orange-400/10 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-orange-300"
                          >
                            Combo
                          </span>

                          <span
                            v-else-if="ticket.category === 'GROUP'"
                            class="inline-flex rounded-md bg-sky-400/10 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-sky-300"
                          >
                            Đoàn
                          </span>

                          <span
                            v-else
                            class="inline-flex rounded-md bg-white/[0.06] px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-400"
                          >
                            Vé
                          </span>

                          <p
                            class="mt-2 truncate text-[11px] font-medium text-slate-200"
                          >
                            {{ ticket.name }}
                          </p>
                        </div>

                        <span
                          class="shrink-0 whitespace-nowrap text-[10px] font-bold text-orange-300"
                        >
                          {{ formatPrice(ticket.price) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    v-else
                    class="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/[0.09] px-3 py-2 text-[10px] text-slate-500"
                  >
                    <Ticket :size="13" />
                    Chưa tạo hạng vé
                  </span>
                </td>

                <!-- ĐIỂM ĐÓN -->
                <td class="px-4 py-5 align-top">
                  <div
                    v-if="tour.pickup_points?.length"
                    class="max-w-[230px] space-y-3"
                  >
                    <div
                      v-for="point in tour.pickup_points"
                      :key="point.id"
                      class="flex items-center justify-between gap-2"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <span
                          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/[0.08] text-sky-300"
                        >
                          <MapPin :size="14" />
                        </span>

                        <span class="truncate text-[11px] text-slate-300">
                          {{ point.name }}
                        </span>
                      </div>

                      <span
                        v-if="Number(point.surcharge) > 0"
                        class="shrink-0 text-[10px] font-semibold text-amber-300"
                      >
                        +{{ formatPrice(point.surcharge) }}
                      </span>
                    </div>
                  </div>

                  <span
                    v-else
                    class="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/[0.09] px-3 py-2 text-[10px] text-slate-500"
                  >
                    <MapPin :size="13" />
                    Chưa cấu hình
                  </span>
                </td>

                <!-- TRẠNG THÁI -->
                <td class="px-4 py-5 align-top">
                  <span
                    class="inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-semibold"
                    :class="getTourStatusBadge(tour.status).class"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="getTourStatusBadge(tour.status).dot"
                    ></span>

                    {{ getTourStatusBadge(tour.status).label }}
                  </span>
                </td>

                <!-- THAO TÁC -->
                <td class="px-5 py-5 align-top sm:px-6">
                  <div class="flex items-center justify-end gap-2">
                    <RouterLink
                      :to="`tours/${tour.id}`"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết tour"
                      class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-400 transition hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-300"
                    >
                      <Eye :size="16" />
                    </RouterLink>

                    <RouterLink
                      :to="`edit/${tour.id}`"
                      title="Chỉnh sửa"
                      aria-label="Chỉnh sửa tour"
                      class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-400 transition hover:border-orange-400/30 hover:bg-orange-400/10 hover:text-orange-300"
                    >
                      <Pencil :size="15" />
                    </RouterLink>

                    <!-- GIỮ NGUYÊN: KHÔNG TỰ THÊM API XÓA TOUR -->
                    <button
                      type="button"
                      title="Xóa tour"
                      aria-label="Xóa tour"
                      :disabled="normalizeTourStatus(tour.status) === 'LOCKED'"
                      :class="
                        normalizeTourStatus(tour.status) === 'LOCKED'
                          ? 'cursor-not-allowed border-white/[0.05] bg-white/[0.015] text-white/15'
                          : 'border-red-400/10 bg-red-400/[0.04] text-red-300/60 transition hover:border-red-400/25 hover:bg-red-400/10 hover:text-red-300'
                      "
                      class="flex h-9 w-9 items-center justify-center rounded-xl border"
                    >
                      <Trash2 :size="15" />
                    </button>
                  </div>

                  <p
                    v-if="normalizeTourStatus(tour.status) === 'LOCKED'"
                    class="mt-2 text-right text-[10px] text-red-300/70"
                  >
                    Tour đã khóa
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <footer
          v-if="!isLoading && !isError && filteredTours.length > 0"
          class="flex flex-col gap-2 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <p class="text-xs text-slate-500">
            Đang hiển thị
            <span class="font-semibold text-slate-200">
              {{ filteredTours.length }}
            </span>
            /
            <span class="font-semibold text-slate-200">
              {{ tours.length }}
            </span>
            tour
          </p>

          <div
            class="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600"
          >
            Tour Management
            <ChevronRight :size="13" />
          </div>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
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
