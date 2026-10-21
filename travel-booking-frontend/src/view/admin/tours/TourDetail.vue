<script setup lang="ts">
import TourSchedule from "../../../components/tour/TourSchedule.vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter, RouterLink } from "vue-router";
import tourService from "../../../services/tour.service.js";
import bookingService from "../../../services/booking.service.js";

const route = useRoute();
const router = useRouter();

const id = route.params.id as string;
const {
  data: tourDetailData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["tourDetail", id],

  queryFn: async () => {
    const result = await tourService.getOne(id);

    return result.data?.data ?? null;
  },

  staleTime: 5 * 60 * 1000,
});

// =====================================================
// BOOKING GẦN NHẤT
// =====================================================

const { data: bookingLaster } = useQuery({
  queryKey: ["bookingLaster", id],

  queryFn: async () => {
    const result = await bookingService.latestBookings(id);

    return result.data?.data ?? [];
  },

  staleTime: 5 * 60 * 1000,
});

// =====================================================
// FORMAT GIÁ
// =====================================================

const formatPrice = (price: string | number | null | undefined) => {
  if (price === null || price === undefined || price === "") {
    return "Chưa đặt";
  }

  const num = Number(price);

  if (num === 0) {
    return "Miễn phí";
  }

  return num.toLocaleString("vi-VN") + "₫";
};

// =====================================================
// XỬ LÝ URL ẢNH
// =====================================================

const getTourImage = (path: string | null | undefined) => {
  if (!path) {
    return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80";
  }

  const cleanPath = path.replaceAll("\\", "/");

  // Nếu backend đã trả URL đầy đủ
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  return `http://localhost:8080/${cleanPath}`;
};
</script>

<template>
  <div class="admin-page min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- =====================================================
         BACKGROUND
    ====================================================== -->

    <div class="fixed inset-0 -z-10 overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        class="h-full w-full object-cover opacity-[0.08]"
        alt=""
      />

      <div class="absolute inset-0 bg-[#07090d]/95"></div>

      <div
        class="absolute left-[10%] top-[5%] h-[450px] w-[450px] rounded-full bg-orange-400/[0.05] blur-[150px]"
      ></div>

      <div
        class="absolute right-[5%] top-[30%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.035] blur-[160px]"
      ></div>
    </div>

    <!-- =====================================================
         MAIN
    ====================================================== -->

    <div class="flex min-h-screen w-full flex-col items-center">
      <!-- ===================================================
           HEADER
      ==================================================== -->

      <header
        class="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#080b10]/80 backdrop-blur-2xl"
      >
        <div
          class="mx-auto flex h-[82px] max-w-[1500px] items-center justify-between px-5 sm:px-8"
        >
          <!-- LEFT -->

          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="router.back()"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Quay lại"
            >
              ←
            </button>

            <div>
              <p
                class="text-[10px] uppercase tracking-[0.25em] text-orange-300/60"
              >
                Tour Management / Chi tiết
              </p>

              <h1 class="mt-1 max-w-md truncate text-xl font-bold">
                {{ tourDetailData?.name || "Đang tải thông tin..." }}
              </h1>
            </div>
          </div>

          <!-- RIGHT -->

          <div class="flex items-center gap-3">
            <RouterLink
              :to="`/admin/edit/${id}`"
              class="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-slate-100"
            >
              ✎ Chỉnh sửa
            </RouterLink>
          </div>
        </div>
      </header>

      <!-- ===================================================
           BODY
      ==================================================== -->

      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <!-- =================================================
             LOADING
        ================================================== -->

        <div v-if="isLoading" class="py-20 text-center text-sm text-white/40">
          Đang tải thông tin tour...
        </div>

        <!-- =================================================
             ERROR
        ================================================== -->

        <div
          v-else-if="isError || !tourDetailData"
          class="rounded-[26px] border border-red-400/10 bg-red-400/[0.04] px-6 py-16 text-center"
        >
          <p class="text-lg font-semibold text-red-300">
            Không thể tải thông tin tour
          </p>

          <p class="mt-2 text-sm text-white/40">
            Tour không tồn tại hoặc đã xảy ra lỗi khi tải dữ liệu.
          </p>

          <button
            type="button"
            @click="router.back()"
            class="mt-6 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            ← Quay lại
          </button>
        </div>

        <!-- =================================================
             TOUR DATA
        ================================================== -->

        <template v-else>
          <!-- ===============================================
               HERO
          ================================================ -->

          <section
            class="relative mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8"
          >
            <div
              class="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-400/[0.08] blur-[120px]"
            ></div>

            <div
              class="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center"
            >
              <!-- TOUR INFO -->

              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-3">
                  <!-- ID -->

                  <span
                    class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.07] px-3 py-1 text-[11px] font-semibold text-orange-200"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>

                    Mã tour: #{{ tourDetailData.id }}
                  </span>

                  <!-- STATUS -->

                  <span
                    v-if="tourDetailData.status === 'active'"
                    class="rounded-full bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-300"
                  >
                    ● Đang mở bán
                  </span>

                  <span
                    v-else
                    class="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/50"
                  >
                    ● Tạm ngưng
                  </span>

                  <!-- SLUG -->

                  <span
                    class="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/50"
                  >
                    Slug: {{ tourDetailData.slug }}
                  </span>
                </div>

                <!-- NAME -->

                <h2
                  class="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                >
                  {{ tourDetailData.name }}
                </h2>

                <!-- DESCRIPTION -->

                <p class="max-w-2xl text-sm leading-6 text-white/60">
                  {{
                    tourDetailData.description ||
                    "Chưa có mô tả chi tiết cho tour này."
                  }}
                </p>
              </div>

              <!-- ===========================================
                   PRICE
              ============================================ -->

              <div
                class="flex flex-wrap gap-4 border-t border-white/[0.08] pt-4 lg:border-t-0 lg:pt-0"
              >
                <!-- NGƯỜI LỚN -->

                <div
                  class="min-w-[130px] rounded-2xl border border-white/10 bg-black/40 px-5 py-3"
                >
                  <p class="text-[11px] text-white/40">Vé Người lớn</p>

                  <p class="mt-0.5 text-xl font-bold text-white">
                    {{ formatPrice(tourDetailData.price) }}
                  </p>
                </div>

                <!-- TRẺ EM -->

                <div
                  class="min-w-[130px] rounded-2xl border border-orange-400/20 bg-black/40 px-5 py-3"
                >
                  <p class="text-[11px] text-orange-300/70">
                    Vé Trẻ em (5-11t)
                  </p>

                  <p class="mt-0.5 text-xl font-bold text-orange-300">
                    {{ formatPrice(tourDetailData.child_price) }}
                  </p>
                </div>

                <!-- EM BÉ -->

                <div
                  class="min-w-[120px] rounded-2xl border border-white/10 bg-black/40 px-5 py-3"
                >
                  <p class="text-[11px] text-white/40">Vé Em bé (&lt;5t)</p>

                  <p class="mt-0.5 text-xl font-bold text-white/80">
                    {{ formatPrice(tourDetailData.infant_price) }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- =================================================
               DETAIL GRID
          ================================================== -->

          <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <!-- =============================================
                 LEFT
            ============================================== -->

            <div class="space-y-8 lg:col-span-2">
              <!-- ===========================================
                   GALLERY
              ============================================ -->

              <section
                class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6"
              >
                <h3 class="mb-4 text-base font-bold">Hình ảnh Tour</h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <!-- THUMBNAIL -->

                  <div class="sm:col-span-2">
                    <img
                      :src="getTourImage(tourDetailData.thumbnail)"
                      alt="Ảnh đại diện tour"
                      class="h-64 w-full rounded-2xl border border-white/10 object-cover"
                    />
                  </div>

                  <!-- GALLERY -->

                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-1">
                    <img
                      v-for="img in (tourDetailData.gallery_images || []).slice(
                        0,
                        2,
                      )"
                      :key="img.id"
                      :src="getTourImage(img.image_url)"
                      alt="Ảnh phụ tour"
                      class="h-[120px] w-full rounded-2xl border border-white/10 object-cover"
                    />

                    <div
                      v-if="!tourDetailData.gallery_images?.length"
                      class="flex h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-xs text-white/30"
                    >
                      Chưa có ảnh phụ
                    </div>
                  </div>
                </div>
              </section>

              <!-- ===========================================
                   ITINERARY
              ============================================ -->

              <TourSchedule :itineraries="tourDetailData.itineraries || []" />
            </div>

            <!-- =============================================
                 RIGHT
            ============================================== -->

            <div class="space-y-6">
              <!-- ===========================================
                   THÔNG SỐ TOUR
              ============================================ -->

              <div
                class="space-y-4 rounded-[26px] border border-white/10 bg-white/[0.035] p-6"
              >
                <h3
                  class="border-b border-white/[0.07] pb-3 text-base font-bold"
                >
                  Thông số vận hành & Biểu giá
                </h3>

                <!-- CATEGORY -->

                <div class="flex items-center justify-between py-1 text-sm">
                  <span class="text-white/40"> Danh mục </span>

                  <span class="font-medium text-orange-200">
                    {{ tourDetailData.category?.name || "Chưa phân loại" }}
                  </span>
                </div>

                <!-- DURATION -->

                <div class="flex items-center justify-between py-1 text-sm">
                  <span class="text-white/40"> Thời lượng </span>

                  <span class="font-medium">
                    {{ tourDetailData.duration_days }}
                    ngày
                    {{ tourDetailData.duration_nights }}
                    đêm
                  </span>
                </div>

                <!-- PRICE DETAIL -->

                <div
                  class="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs"
                >
                  <div class="flex justify-between">
                    <span class="text-white/50"> Vé người lớn: </span>

                    <span class="font-bold text-white">
                      {{ formatPrice(tourDetailData.price) }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span class="text-white/50"> Vé trẻ em: </span>

                    <span class="font-semibold text-orange-300">
                      {{ formatPrice(tourDetailData.child_price) }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span class="text-white/50"> Vé em bé: </span>

                    <span class="text-white/80">
                      {{ formatPrice(tourDetailData.infant_price) }}
                    </span>
                  </div>
                </div>

                <!-- TRANSPORTATION -->

                <div class="flex items-center justify-between py-1 text-sm">
                  <span class="text-white/40"> Phương tiện </span>

                  <span class="font-medium">
                    {{ tourDetailData.transportation || "Đang cập nhật" }}
                  </span>
                </div>

                <!-- DIFFICULTY -->

                <div class="flex items-center justify-between py-1 text-sm">
                  <span class="text-white/40"> Độ khó hành trình </span>

                  <span
                    class="inline-flex items-center rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300"
                  >
                    {{ tourDetailData.difficulty_level || "Dễ" }}
                  </span>
                </div>

                <!-- MAX PEOPLE -->

                <div class="flex items-center justify-between py-1 text-sm">
                  <span class="text-white/40"> Quy mô đoàn tối đa </span>

                  <span class="font-medium">
                    {{ tourDetailData.max_people }}
                    khách / tour
                  </span>
                </div>

                <!-- =========================================
                     LỊCH GẦN NHẤT
                ========================================== -->

                <div
                  v-if="tourDetailData.schedules?.length"
                  class="border-t border-white/[0.07] pt-4"
                >
                  <div class="mb-2 flex justify-between text-xs">
                    <span class="text-white/40">
                      Đợt gần nhất ({{
                        new Date(
                          tourDetailData.schedules[0].departure_date,
                        ).toLocaleDateString("vi-VN")
                      }})
                    </span>

                    <span class="font-semibold text-emerald-300">
                      {{
                        tourDetailData.schedules[0].total_slots -
                        tourDetailData.schedules[0].available_slots
                      }}
                      /
                      {{ tourDetailData.schedules[0].total_slots }}
                      chỗ
                    </span>
                  </div>

                  <div
                    class="h-2 w-full overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      class="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      :style="{
                        width: `${
                          tourDetailData.schedules[0].total_slots > 0
                            ? ((tourDetailData.schedules[0].total_slots -
                                tourDetailData.schedules[0].available_slots) /
                                tourDetailData.schedules[0].total_slots) *
                              100
                            : 0
                        }%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- ===========================================
                   BOOKING GẦN NHẤT
              ============================================ -->

              <div
                class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6"
              >
                <div class="mb-4 flex items-center justify-between">
                  <h3 class="text-base font-bold">Booking gần nhất</h3>

                  <RouterLink
                    to="/admin/bookings"
                    class="text-xs text-orange-300/80 hover:underline"
                  >
                    Tất cả
                  </RouterLink>
                </div>

                <div class="space-y-3">
                  <template v-if="bookingLaster?.length">
                    <div
                      v-for="value in bookingLaster"
                      :key="value.id"
                      class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3 text-xs"
                    >
                      <div>
                        <p class="font-semibold text-white">
                          {{ value.booker_name || "Khách vãng lai" }}
                        </p>

                        <p class="mt-0.5 text-[10px] text-white/40">
                          {{ value.total_people }}
                          người

                          <span class="text-white/20"> • </span>

                          ({{ value.adult_count || 0 }}
                          lớn,

                          {{ value.child_count || 0 }}
                          trẻ,

                          {{ value.infant_count || 0 }}
                          bé)
                        </p>
                      </div>

                      <span class="font-semibold text-emerald-300">
                        +{{
                          Number(value.total_amount).toLocaleString("vi-VN")
                        }}₫
                      </span>
                    </div>
                  </template>

                  <!-- KHÔNG CÓ BOOKING -->

                  <div
                    v-else
                    class="rounded-xl border border-white/5 bg-black/20 p-4 text-center"
                  >
                    <p class="font-semibold text-white/60">
                      Chưa có booking nào
                    </p>

                    <p class="mt-1 text-[10px] text-white/30">
                      Tour này hiện chưa có lượt đặt nào.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
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
