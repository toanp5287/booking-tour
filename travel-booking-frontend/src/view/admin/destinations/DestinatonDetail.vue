<script setup>
import destinationService from "../../../services/destination.service";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";

const route = useRoute();
const id = route.params.id;

const { data: destinationDetail, isLoading } = useQuery({
  queryKey: ["destinationDetail", id],
  queryFn: async () => {
    const res = await destinationService.getDetail(id);
    return res.data.data;
  },
});

// Helper định dạng tiền VNĐ
const formatCurrency = (val) => {
  if (!val && val !== 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val));
};

// Helper cắt giờ ISO (1970-01-01T08:00:00.000Z -> 08:00)
const formatTime = (timeStr) => {
  if (!timeStr) return "--:--";
  if (typeof timeStr === "string" && timeStr.includes("T")) {
    return timeStr.split("T")[1].substring(0, 5);
  }
  return timeStr.substring(0, 5);
};

// Helper tách chuỗi tag thành mảng
const parseTags = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- ================= BACKGROUND GLOWS ================= -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        class="h-full w-full object-cover opacity-[0.06]"
        alt=""
      />
      <div class="absolute inset-0 bg-[#07090d]/95"></div>
      <div
        class="absolute left-[10%] top-[5%] h-[480px] w-[480px] rounded-full bg-orange-400/[0.045] blur-[160px]"
      ></div>
      <div
        class="absolute right-[5%] top-[25%] h-[520px] w-[520px] rounded-full bg-purple-500/[0.035] blur-[170px]"
      ></div>
    </div>

    <!-- SKELETON LOADING -->
    <div
      v-if="isLoading"
      class="flex min-h-screen w-full items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3">
        <div
          class="h-9 w-9 animate-spin rounded-full border-2 border-orange-300 border-t-transparent"
        ></div>
        <p class="text-xs uppercase tracking-widest text-white/40">
          Đang tải thông tin điểm đến...
        </p>
      </div>
    </div>

    <!-- ================= MAIN WRAPPER (CENTERED) ================= -->
    <div
      v-else-if="destinationDetail"
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
            <router-link
              to="/admin/destinations"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Quay lại danh sách"
            >
              ←
            </router-link>
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
                Chi tiết điểm đến #{{ destinationDetail.id }}
              </div>
              <h1
                class="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
              >
                {{ destinationDetail.name }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <router-link
              :to="`/admin/destinations/${destinationDetail.id}/edit`"
              class="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-300 px-5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-orange-400"
            >
              <span>✎</span>
              <span>Chỉnh sửa</span>
            </router-link>
          </div>
        </div>
      </header>

      <!-- ================= MAIN CONTENT ================= -->
      <main class="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 space-y-8">
        <!-- 1. HERO SHOWCASE BANNER -->
        <section
          class="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl"
        >
          <div class="relative h-[380px] w-full sm:h-[460px]">
            <img
              :src="
                destinationDetail.image ||
                'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2000&q=85'
              "
              :alt="destinationDetail.name"
              class="h-full w-full object-cover"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/50 to-transparent"
            ></div>

            <!-- STATUS BADGE -->
            <div class="absolute left-6 top-6">
              <span
                v-if="destinationDetail.status === 'active'"
                class="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md"
              >
                <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                Đang hoạt động (active)
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/50 backdrop-blur-md"
              >
                Tạm ẩn
              </span>
            </div>

            <!-- BOTTOM HERO INFO -->
            <div
              class="absolute bottom-6 left-6 right-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"
            >
              <div>
                <div
                  class="flex items-center gap-2 text-xs uppercase tracking-widest text-orange-300"
                >
                  <span>⌖</span>
                  <span>{{ destinationDetail.province || "Việt Nam" }}</span>
                  <span class="text-white/30">•</span>
                  <span class="text-white/70">{{
                    destinationDetail.category?.name || "Danh mục"
                  }}</span>
                </div>
                <h2
                  class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-white"
                >
                  {{ destinationDetail.name }}
                </h2>
                <p class="mt-2 flex items-center gap-2 text-xs text-white/60">
                  <span>➤</span>
                  <span>{{
                    destinationDetail.address || "Chưa cập nhật địa chỉ cụ thể"
                  }}</span>
                </p>
              </div>

              <!-- GPS TỌA ĐỘ -->
              <div
                class="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md"
              >
                <div class="text-right font-mono text-[11px] text-white/80">
                  <p>{{ destinationDetail.latitude }}° N</p>
                  <p>{{ destinationDetail.longitude }}° E</p>
                </div>
                <a
                  v-if="
                    destinationDetail.latitude && destinationDetail.longitude
                  "
                  :href="`https://www.google.com/maps?q=${destinationDetail.latitude},${destinationDetail.longitude}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-300 text-slate-900 transition hover:bg-orange-400"
                  title="Mở trên Google Maps"
                >
                  ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. GRID 3 CỘT: VẬN HÀNH - ĐẶC TÍNH - TRAVELGO AI -->
        <section class="grid gap-6 lg:grid-cols-3">
          <!-- CỘT 1: THỜI GIAN & VẬN HÀNH -->
          <div
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-md space-y-5"
          >
            <h3
              class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-200"
            >
              <span>⏱</span>
              <span>Thời gian &amp; Vận hành</span>
            </h3>

            <div class="space-y-3.5">
              <div
                class="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 p-3.5"
              >
                <span class="text-xs text-white/40">Giờ mở cửa</span>
                <span class="text-xs font-semibold text-white">
                  {{ formatTime(destinationDetail.opening_time) }} -
                  {{ formatTime(destinationDetail.closing_time) }}
                </span>
              </div>

              <div
                class="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 p-3.5"
              >
                <span class="text-xs text-white/40">Thời lượng tham quan</span>
                <span class="text-xs font-semibold text-white">
                  {{
                    destinationDetail.estimated_visit_time
                      ? `${destinationDetail.estimated_visit_time} phút`
                      : "Tự do"
                  }}
                </span>
              </div>

              <div
                class="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 p-3.5"
              >
                <span class="text-xs text-white/40">Chi phí trung bình</span>
                <span class="text-xs font-bold text-orange-200">
                  {{ formatCurrency(destinationDetail.average_cost) }}
                </span>
              </div>
            </div>
          </div>

          <!-- CỘT 2: ĐẶC TÍNH & KHUYẾN NGHỊ -->
          <div
            class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-md space-y-5"
          >
            <h3
              class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-200"
            >
              <span>🧭</span>
              <span>Đặc tính &amp; Khuyến nghị</span>
            </h3>

            <div class="space-y-3.5">
              <div
                class="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 p-3.5"
              >
                <span class="text-xs text-white/40">Mùa lý tưởng</span>
                <span class="text-xs font-semibold text-orange-200">
                  {{ destinationDetail.best_time || "Quanh năm" }}
                </span>
              </div>

              <div
                class="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 p-3.5"
              >
                <span class="text-xs text-white/40">Độ tuổi phù hợp</span>
                <span class="text-xs font-semibold text-blue-200">
                  {{ destinationDetail.age_suitable || "Mọi lứa tuổi" }}
                </span>
              </div>

              <div class="rounded-xl border border-white/5 bg-black/25 p-3.5">
                <span class="text-xs text-white/40 block mb-1"
                  >Lưu ý thời tiết</span
                >
                <p class="text-xs text-white/80 leading-relaxed">
                  {{
                    destinationDetail.weather_note ||
                    "Thời tiết thuận lợi cho việc tham quan ngoài trời."
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- CỘT 3: TRAVELGO AI PROFILE -->
          <div
            class="rounded-[26px] border border-purple-300/15 bg-purple-300/[0.025] p-6 shadow-xl backdrop-blur-md space-y-5"
          >
            <div class="flex items-center justify-between">
              <h3
                class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-200"
              >
                <span>✦</span>
                <span>TravelGo AI Profile</span>
              </h3>
              <span
                class="rounded-full bg-purple-300/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-200"
              >
                AI READY
              </span>
            </div>

            <div>
              <p class="text-xs text-white/40 mb-2">
                Loại hình hoạt động nhận diện:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="act in parseTags(destinationDetail.activity_types)"
                  :key="act"
                  class="rounded-lg border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-xs font-medium text-purple-200"
                >
                  {{ act }}
                </span>
                <span
                  v-if="!destinationDetail.activity_types"
                  class="text-xs text-white/30 italic"
                >
                  Chưa phân loại
                </span>
              </div>
            </div>

            <div
              class="rounded-xl border border-white/5 bg-black/30 p-3.5 text-xs text-white/50 leading-relaxed"
            >
              Tọa độ GPS ({{ destinationDetail.latitude }},
              {{ destinationDetail.longitude }}), thời lượng và mức giá đã được
              số hóa sẵn sàng cho việc tính toán gợi ý hành trình AI.
            </div>
          </div>
        </section>

        <!-- 3. MÔ TẢ CHI TIẾT ĐIỂM ĐẾN -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-xl backdrop-blur-md"
        >
          <h3
            class="text-base font-bold uppercase tracking-wider text-orange-200 mb-4"
          >
            Mô tả chi tiết điểm đến
          </h3>
          <div class="text-sm leading-7 text-white/70 space-y-4">
            <p v-if="destinationDetail.description">
              {{ destinationDetail.description }}
            </p>
            <p v-else class="text-white/30 italic">
              Chưa có mô tả chi tiết cho địa danh này.
            </p>
          </div>
        </section>

        <!-- 4. CÁC TOUR ĐANG GHÉ THĂM (BẢNG tour_destinations) -->
        <section
          class="rounded-[26px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-xl backdrop-blur-md"
        >
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-white">
                Các tour đang ghé thăm địa danh này
              </h3>
              <p class="mt-1 text-xs text-white/40">
                Các tour du lịch được liên kết thông qua lịch trình ghé thăm
              </p>
            </div>
            <span
              class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60"
            >
              {{ destinationDetail.tours?.length ?? 0 }} Tours
            </span>
          </div>

          <!-- NẾU CÓ TOUR -->
          <div
            v-if="destinationDetail.tours && destinationDetail.tours.length > 0"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div
              v-for="tour in destinationDetail.tours"
              :key="tour.id"
              class="rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-orange-300/30"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span
                    class="rounded-md bg-orange-300/10 px-2 py-0.5 text-[10px] font-bold text-orange-200"
                  >
                    Ngày {{ tour.day_number || 1 }} • Thứ tự ghé #{{
                      tour.visit_order || 1
                    }}
                  </span>
                  <h4 class="mt-2 text-sm font-bold text-white line-clamp-1">
                    {{ tour.name }}
                  </h4>
                  <p class="mt-1 text-xs font-semibold text-orange-300">
                    {{ formatCurrency(tour.price) }}
                  </p>
                </div>
                <router-link
                  :to="`/admin/tours/${tour.id}/edit`"
                  class="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:text-white"
                  title="Xem tour"
                >
                  ↗
                </router-link>
              </div>
            </div>
          </div>

          <!-- NẾU CHƯA CÓ TOUR GHÉ THĂM (NHƯ RESPONSE JSON MẪU: tours: []) -->
          <div
            v-else
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 py-10 text-center"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-lg text-white/30"
            >
              ◈
            </div>
            <p class="mt-3 text-xs font-medium text-white/60">
              Chưa có tour du lịch nào thêm địa danh này vào lịch trình
            </p>
            <p class="mt-1 text-[11px] text-white/30">
              Bạn có thể gắn điểm đến này khi tạo hoặc chỉnh sửa tour ở mục
              "Tour Itinerary".
            </p>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
