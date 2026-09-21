<script setup lang="ts">
import { RouterLink } from "vue-router";

// Dữ liệu số liệu nổi bật
const stats = [
  {
    value: "10,000+",
    label: "Khách hàng đồng hành",
    detail: "Hài lòng và quay lại",
  },
  { value: "150+", label: "Tour tuyển chọn", detail: "Trải dài khắp cả nước" },
  {
    value: "99.2%",
    label: "Tỷ lệ phản hồi tích cực",
    detail: "Đánh giá 4.8★ trở lên",
  },
  {
    value: "24/7",
    label: "Hỗ trợ khách hàng",
    detail: "Đồng hành suốt hành trình",
  },
];

// Dữ liệu giá trị cốt lõi
const coreValues = [
  {
    icon: "🎯",
    title: "Minh bạch tuyệt đối",
    desc: "Báo giá trọn gói, cam kết không phát sinh phụ phí ẩn, rõ ràng từng bữa ăn, khách sạn và phương tiện.",
  },
  {
    icon: "✨",
    title: "Trải nghiệm bản địa",
    desc: "Không chỉ đi ngắm cảnh, TravelGo đưa bạn chạm vào văn hóa, nếp sống và ẩm thực địa phương đích thực.",
  },
  {
    icon: "🛡️",
    title: "An toàn & Linh hoạt",
    desc: "Chính sách dời hủy rõ ràng, bảo hiểm du lịch toàn diện và đội ngũ chăm sóc sẵn sàng hỗ trợ tại chỗ.",
  },
  {
    icon: "🌿",
    title: "Du lịch có trách nhiệm",
    desc: "Ưu tiên hợp tác cùng các nhà cung ứng bản địa, gìn giữ vệ sinh môi trường và bảo tồn di sản vùng miền.",
  },
];

// Dữ liệu đội ngũ / Lãnh đạo
const team = [
  {
    name: "Quang Vinh",
    role: "Founder & Lead Architect",
    avatar: "/avatars/vinh.jpg",
    bio: "Đam mê xê dịch và công nghệ, luôn tìm cách đơn giản hóa trải nghiệm đặt tour trực tuyến.",
  },
  {
    name: "Minh Thư",
    role: "Head of Operations",
    avatar: "/avatars/thu.jpg",
    bio: "Hơn 8 năm điều hành tour nội địa và quốc tế, phụ trách kiểm định chất lượng các đối tác.",
  },
  {
    name: "Hoàng Nam",
    role: "Customer Experience Lead",
    avatar: "/avatars/nam.jpg",
    bio: "Từng là hướng dẫn viên kỳ cựu, người đảm bảo từng chuyến đi của khách luôn an tâm trọn vẹn.",
  },
];
</script>

<template>
  <div
    class="relative min-h-screen bg-[#090b10] font-sans text-slate-100 antialiased selection:bg-amber-300/20 selection:text-amber-200"
  >
    <!-- BACKGROUND ATMOSPHERE -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#090b10]/60 via-[#090b10]/95 to-[#090b10]"
      ></div>
      <div
        class="absolute left-1/2 top-10 h-72 w-[650px] -translate-x-1/2 rounded-full bg-amber-400/5 blur-[130px]"
      ></div>
      <div
        class="absolute right-0 top-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-[150px]"
      ></div>
    </div>

    <main class="relative z-10 pt-24 pb-20">
      <!-- =========================================================
           1. HERO SECTION
      ========================================================== -->
      <section class="border-b border-white/[0.06] pb-16 pt-10">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div class="max-w-3xl">
            <div
              class="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-amber-200/90 backdrop-blur-md"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-amber-300"></span>
              <span>Câu chuyện TravelGo</span>
            </div>

            <h1
              class="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Định hình lại cách bạn
              <span
                class="bg-gradient-to-r from-amber-200 via-amber-100 to-white/70 bg-clip-text text-transparent"
              >
                khám phá Việt Nam
              </span>
            </h1>

            <p class="mt-5 text-sm leading-relaxed text-slate-400 sm:text-base">
              TravelGo ra đời từ niềm trăn trở: Làm sao để mỗi chuyến đi không
              còn là danh sách điểm check-in vội vã, mà trở thành những kỷ niệm
              giàu cảm xúc, minh bạch về chi phí và tiện lợi đến từng thao tác
              bấm.
            </p>
          </div>
        </div>
      </section>

      <!-- =========================================================
           2. STATS SECTION (CÁC CON SỐ ẤN TƯỢNG)
      ========================================================== -->
      <section class="border-b border-white/[0.06] py-14">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <div
              v-for="(item, idx) in stats"
              :key="idx"
              class="rounded-2xl border border-white/[0.06] bg-[#0f131c] p-6 text-center transition hover:border-amber-300/30"
            >
              <p
                class="font-mono text-3xl font-extrabold text-amber-200 sm:text-4xl"
              >
                {{ item.value }}
              </p>
              <p class="mt-2 text-xs font-bold text-white sm:text-sm">
                {{ item.label }}
              </p>
              <p class="mt-1 text-[11px] text-slate-500">
                {{ item.detail }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================
           3. SỨ MỆNH & GIÁ TRỊ CỐT LÕI
      ========================================================== -->
      <section class="py-20">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div class="max-w-2xl">
            <span
              class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80"
            >
              Nguyên tắc vận hành
            </span>
            <h2
              class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Điều gì giữ khách hàng ở lại với chúng tôi?
            </h2>
            <p class="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Chúng tôi không cạnh tranh bằng tour giá rẻ cắt xén dịch vụ, mà
              tập trung xây dựng sự an tâm và tôn trọng thời gian của bạn.
            </p>
          </div>

          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article
              v-for="(val, idx) in coreValues"
              :key="idx"
              class="group flex flex-col rounded-2xl border border-white/[0.08] bg-[#0f131c] p-6 transition duration-300 hover:-translate-y-1 hover:border-amber-300/30"
            >
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.03] text-xl"
              >
                {{ val.icon }}
              </div>
              <h3
                class="mt-4 text-base font-bold text-white transition group-hover:text-amber-200"
              >
                {{ val.title }}
              </h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">
                {{ val.desc }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <!-- =========================================================
           4. ĐỘI NGŨ SÁNG LẬP
      ========================================================== -->
      <section class="border-t border-white/[0.06] py-20">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div
            class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
          >
            <div>
              <span
                class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80"
              >
                Những người đứng sau
              </span>
              <h2
                class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                Đội ngũ điều hành
              </h2>
            </div>
            <p class="max-w-md text-xs text-slate-400">
              Kết hợp giữa kỹ sư công nghệ và những chuyên gia lữ hành giàu kinh
              nghiệm thực địa.
            </p>
          </div>

          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(member, idx) in team"
              :key="idx"
              class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f131c] p-5 transition hover:border-amber-300/30"
            >
              <div class="flex items-center gap-3.5">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 font-mono text-base font-bold text-amber-200"
                >
                  {{ member.name.charAt(0) }}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">
                    {{ member.name }}
                  </h4>
                  <p class="text-[11px] text-amber-200/80">{{ member.role }}</p>
                </div>
              </div>
              <p class="mt-4 text-xs leading-relaxed text-slate-400">
                {{ member.bio }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================
           5. BANNER KÊU GỌI HÀNH ĐỘNG (CTA)
      ========================================================== -->
      <section class="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10">
        <div
          class="flex flex-col items-start justify-between gap-6 rounded-3xl border border-amber-300/20 bg-gradient-to-r from-[#0f131c] via-[#131824] to-[#0f131c] p-8 sm:p-12 md:flex-row md:items-center"
        >
          <div class="max-w-xl">
            <span
              class="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200"
            >
              ✦ Sẵn sàng cho chuyến đi kế tiếp?
            </span>
            <h3
              class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Cùng TravelGo viết nên câu chuyện của bạn
            </h3>
            <p class="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Tìm kiếm hành trình theo sở thích hoặc để trợ lý AI lập kế hoạch
              cá nhân hóa trong vài phút.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <RouterLink
              to="/tours"
              class="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-95"
            >
              <span>Xem danh sách tour</span>
              <span>→</span>
            </RouterLink>
            <RouterLink
              to="/aiTripPlanner"
              class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-medium text-white transition hover:bg-white/10 active:scale-95"
            >
              <span>Lập lịch trình AI</span>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
