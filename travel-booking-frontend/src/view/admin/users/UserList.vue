<script setup>
import { useQuery } from "@tanstack/vue-query";
import userService from "../../../services/users.service";
import { computed, ref } from "vue";
const {
  data: usersData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["getAllUser"],
  queryFn: async () => {
    const res = await userService.getAll();
    return res.data.data;
  },
  staleTime: 1000 * 60 * 5,
});
const shearch = ref("");

const usersFilter = computed(() => {
  let users = usersData.value || [];

  if (shearch.value.trim()) {
    const keyword = shearch.value.toLowerCase().trim();

    users = users.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(keyword);

      const idMatch = String(item.id).includes(keyword);

      const emailMatch = item.email?.toLowerCase().includes(keyword);

      return nameMatch || idMatch || emailMatch;
    });
  }

  return users;
});
const print = () => {
  window.print();
};
</script>

<template>
  <div class="min-h-screen bg-[#07090d] font-sans text-white antialiased">
    <!-- BACKGROUND EFFECTS -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 bg-[#07090d]"></div>
      <div
        class="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-orange-400/[0.06] blur-[150px]"
      ></div>
      <div
        class="absolute right-0 top-[35%] h-[550px] w-[550px] rounded-full bg-purple-500/[0.035] blur-[160px]"
      ></div>
    </div>

    <div class="min-h-screen lg:flex">
      <!-- SIDEBAR -->

      <!-- MAIN CONTENT -->
      <main class="min-w-0 flex-1">
        <!-- TOPBAR -->
        <header
          class="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07090d]/80 backdrop-blur-2xl"
        >
          <div class="flex h-[76px] items-center justify-between px-5 sm:px-8">
            <div>
              <p
                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300/55"
              >
                Administration
              </p>
              <h1 class="mt-1 text-lg font-bold">
                Quản lý người dùng & Xét duyệt đối tác
              </h1>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45 transition hover:bg-white/10 hover:text-white"
              >
                🔔
              </button>
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-500 font-bold text-slate-900"
              >
                V
              </div>
            </div>
          </div>
        </header>

        <div class="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
          <!-- TAB SWITCHER -->
          <div
            class="mb-8 flex items-center gap-8 border-b border-white/[0.08] text-sm"
          >
            <button
              type="button"
              class="border-b-2 border-orange-300 pb-3 font-semibold text-orange-200"
            >
              Tất cả tài khoản (12,486)
            </button>

            <button
              type="button"
              class="pb-3 font-semibold text-white/45 transition hover:text-white"
            >
              Hồ sơ đăng ký Chủ tour
              <span
                class="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300"
              >
                2 chờ duyệt
              </span>
            </button>
          </div>

          <!-- KPI CARDS -->
          <section class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
              class="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"
            >
              <div class="flex items-center justify-between">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300"
                  >♙</span
                >
                <span class="text-xs text-emerald-300">+12.4%</span>
              </div>
              <p class="mt-5 text-3xl font-bold">12,486</p>
              <p class="mt-1 text-xs text-white/35">Tổng người dùng</p>
            </div>

            <div
              class="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"
            >
              <div class="flex items-center justify-between">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"
                  >🏢</span
                >
                <span class="text-xs text-amber-300">Hoạt động</span>
              </div>
              <p class="mt-5 text-3xl font-bold text-amber-300">42</p>
              <p class="mt-1 text-xs text-white/35">Đơn vị tổ chức tour</p>
            </div>

            <div
              class="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"
            >
              <div class="flex items-center justify-between">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"
                  >✓</span
                >
                <span class="text-xs text-emerald-300">96.8%</span>
              </div>
              <p class="mt-5 text-3xl font-bold">12,087</p>
              <p class="mt-1 text-xs text-white/35">Tài khoản hoạt động</p>
            </div>

            <div
              class="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"
            >
              <div class="flex items-center justify-between">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300"
                  >!</span
                >
                <span class="text-xs text-rose-300">Cần xử lý</span>
              </div>
              <p class="mt-5 text-3xl font-bold text-rose-300">2</p>
              <p class="mt-1 text-xs text-white/35">Hồ sơ chờ phê duyệt</p>
            </div>
          </section>

          <!-- SECTION 1: HỒ SƠ CHỜ DUYỆT ĐỐI TÁC TOUR -->
          <section
            class="mb-10 overflow-hidden rounded-2xl border border-amber-400/20 bg-white/[0.02]"
          >
            <div
              class="flex items-center justify-between border-b border-white/[0.08] bg-amber-400/[0.04] px-6 py-4"
            >
              <div>
                <h3 class="font-bold text-amber-200">
                  Hồ sơ xin làm Nhà cung cấp tour (Chờ duyệt)
                </h3>
                <p class="text-xs text-white/40">
                  Duyệt để mở quyền đại diện nhà tour, đăng lịch trình và quản
                  lý booking
                </p>
              </div>
              <span
                class="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300"
              >
                2 hồ sơ cần xử lý
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr
                    class="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-white/40"
                  >
                    <th class="py-4 pl-6 pr-3">Đơn vị & Thương hiệu</th>
                    <th class="px-3 py-4">Người đại diện</th>
                    <th class="px-3 py-4">Pháp lý (MST / GP)</th>
                    <th class="px-3 py-4">Ngày nộp</th>
                    <th class="px-3 py-4">Chứng từ đính kèm</th>
                    <th class="py-4 pl-3 pr-6 text-right">Quyết định</th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-white/[0.05]">
                  <tr class="transition hover:bg-white/[0.02]">
                    <td class="py-4 pl-6 pr-3">
                      <div class="font-bold text-white">
                        CÔNG TY TNHH DU LỊCH TRẢI NGHIỆM VIỆT
                      </div>
                      <div class="font-medium text-amber-300">
                        Thương hiệu: VietTrek Discovery
                      </div>
                      <div class="text-[10px] text-white/40">
                        Quận 1, TP. Hồ Chí Minh
                      </div>
                    </td>

                    <td class="px-3 py-4">
                      <div class="font-semibold text-slate-200">
                        Nguyễn Văn An
                      </div>
                      <div class="text-[10px] text-white/40">
                        Giám đốc (CEO) • 0908 123 456
                      </div>
                      <div class="font-mono text-[10px] text-slate-400">
                        CCCD: 079201008899
                      </div>
                    </td>

                    <td class="px-3 py-4 font-mono">
                      <div class="text-white/80">MST: 0109887766</div>
                      <div class="text-[10px] text-emerald-400">
                        GP: 79-888/2025/TCDL
                      </div>
                    </td>

                    <td class="px-3 py-4 font-mono text-white/60">
                      14/09/2026
                    </td>

                    <td class="px-3 py-4">
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          class="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300"
                        >
                          📄 GPKD.pdf
                        </span>
                        <span
                          class="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300"
                        >
                          🪪 CCCD.pdf
                        </span>
                      </div>
                    </td>

                    <td class="py-4 pl-3 pr-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                        >
                          ✓ Duyệt
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500 hover:text-white"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr class="transition hover:bg-white/[0.02]">
                    <td class="py-4 pl-6 pr-3">
                      <div class="font-bold text-white">
                        HỘ KINH DOANH SAPA ECO TREK
                      </div>
                      <div class="font-medium text-amber-300">
                        Thương hiệu: SaPa Local Guides
                      </div>
                      <div class="text-[10px] text-white/40">
                        Thị xã Sa Pa, Lào Cai
                      </div>
                    </td>

                    <td class="px-3 py-4">
                      <div class="font-semibold text-slate-200">
                        Giàng A Pháo
                      </div>
                      <div class="text-[10px] text-white/40">
                        Chủ hộ kinh doanh • 0977 888 999
                      </div>
                      <div class="font-mono text-[10px] text-slate-400">
                        CCCD: 010200001234
                      </div>
                    </td>

                    <td class="px-3 py-4 font-mono">
                      <div class="text-white/80">MST: 8399128392</div>
                      <div class="text-[10px] text-slate-500">
                        Nội địa / Trải nghiệm
                      </div>
                    </td>

                    <td class="px-3 py-4 font-mono text-white/60">
                      13/09/2026
                    </td>

                    <td class="px-3 py-4">
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          class="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300"
                        >
                          📄 DKKD_HoCaThe.pdf
                        </span>
                      </div>
                    </td>

                    <td class="py-4 pl-3 pr-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                        >
                          ✓ Duyệt
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500 hover:text-white"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- SECTION 2: BẢNG NGƯỜI DÙNG & TỔ CHỨC ĐANG HOẠT ĐỘNG -->
          <section class="space-y-5">
            <!-- TOOLBAR -->
            <div
              class="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
            >
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div class="relative flex-1">
                  <span
                    class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    >⌕</span
                  >
                  <input
                    v-model="shearch"
                    type="text"
                    placeholder="Tìm theo tên, email hoặc số điện thoại..."
                    class="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-orange-300/30 focus:bg-black/30"
                  />
                </div>

                <select
                  class="h-11 rounded-xl border border-white/10 bg-[#0d1118] px-4 text-sm text-white/70 outline-none focus:border-orange-300/30"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="customer">Khách hàng</option>
                  <option value="partner">Chủ tour (Partner)</option>
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>

                <select
                  class="h-11 rounded-xl border border-white/10 bg-[#0d1118] px-4 text-sm text-white/70 outline-none focus:border-orange-300/30"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="suspended">Tạm khóa</option>
                </select>

                <button
                  type="button"
                  class="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white/55 transition hover:bg-white/10 hover:text-white"
                >
                  Đặt lại
                </button>
              </div>
            </div>

            <!-- TABLE -->
            <div
              class="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]"
            >
              <div
                class="flex flex-col justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 class="font-semibold">Danh sách người dùng & Nhà tour</h3>
                  <p class="mt-1 text-xs text-white/30">
                    Hiển thị 1–4 trong 12,486 người dùng
                  </p>
                </div>
                <button
                  @click="print"
                  type="button"
                  class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/40 hover:text-white"
                >
                  Xuất dữ liệu
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full min-w-[950px] text-left">
                  <thead>
                    <tr
                      class="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-white/40"
                    >
                      <th class="px-5 py-3.5">Người dùng / Doanh nghiệp</th>
                      <th class="px-4 py-3.5">Vai trò</th>
                      <th class="px-4 py-3.5">Trạng thái</th>
                      <th class="px-4 py-3.5">Email</th>
                      <th class="px-4 py-3.5">Tham gia</th>
                      <th class="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody class="divide-y divide-white/[0.05]">
                    <tr
                      v-for="value in usersFilter"
                      :key="value.id"
                      class="group transition-colors duration-150 hover:bg-white/[0.03]"
                    >
                      <!-- Người dùng -->
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-xs font-bold text-slate-900 shadow-sm"
                          >
                            {{
                              value.full_name
                                ?.trim()
                                .split(/\s+/)
                                .map((word) => word[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            }}
                          </div>
                          <div class="min-w-0">
                            <p
                              class="truncate text-sm font-medium text-white/90"
                            >
                              {{ value.full_name }}
                            </p>
                            <p class="truncate text-xs text-white/40">
                              ID: #{{ value.id }}
                            </p>
                          </div>
                        </div>
                      </td>

                      <!-- Vai trò -->
                      <td class="px-4 py-4">
                        <span
                          class="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300"
                        >
                          {{
                            value.role_name === "ADMIN"
                              ? "Admin"
                              : value.role_name === "TOUR_GUIDE"
                                ? "Hướng dẫn viên"
                                : value.role_name === "TOUR_OPERATOR_OWNER"
                                  ? "Chủ tour"
                                  : value.role_name === "STAFF"
                                    ? "Nhân viên"
                                    : "Người dùng"
                          }}
                        </span>
                      </td>

                      <!-- Trạng thái -->
                      <td class="px-4 py-4">
                        <span
                          :class="[
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            value.status
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                          ]"
                        >
                          <span
                            :class="[
                              'h-1.5 w-1.5 rounded-full',
                              value.status ? 'bg-emerald-400' : 'bg-rose-400',
                            ]"
                          ></span>
                          {{ value.status ? "Hoạt động" : "Ngưng" }}
                        </span>
                      </td>

                      <!-- Email -->
                      <td class="px-4 py-4 text-sm font-mono text-white/70">
                        {{ value.email }}
                      </td>

                      <!-- Ngày tham gia -->
                      <td class="px-4 py-4 text-xs font-mono text-white/40">
                        {{
                          new Date(value.created_at).toLocaleDateString("vi-VN")
                        }}
                      </td>

                      <!-- Thao tác: Xem chi tiết & Xoá -->
                      <td class="px-5 py-4 text-right">
                        <div class="inline-flex items-center gap-1.5">
                          <!-- Nút Chi tiết -->
                          <RouterLink
                            type="button"
                            :to="`users/${value.id}`"
                            title="Xem chi tiết"
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/50 transition hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-400"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </RouterLink>

                          <!-- Nút Xoá -->
                          <button
                            type="button"
                            @click="handleDelete(value.id)"
                            title="Xóa người dùng"
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/50 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- PAGINATION -->
              <div
                class="flex flex-col justify-between gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center"
              >
                <p class="text-xs text-white/30">
                  Hiển thị 1–4 trong 12,486 người dùng
                </p>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs text-white/30 hover:bg-white/5"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-300 text-xs font-bold text-slate-900"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs text-white/45 hover:bg-white/5"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs text-white/45 hover:bg-white/5"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs text-white/30 hover:bg-white/5"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>
