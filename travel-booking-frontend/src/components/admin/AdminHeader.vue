<script setup lang="ts">
import { Menu, X } from "lucide-vue-next";

defineProps<{
  mobileSidebarOpen: boolean;
}>();

const emit = defineEmits<{
  "toggle-sidebar": [];
}>();
</script>

<template>
  <header
    class="admin-topbar sticky top-0 z-40 border-b"
  >
    <div class="flex h-[68px] items-center justify-between px-4 sm:h-[76px] sm:px-8">
      <div>
        <p class="text-[10px] uppercase tracking-[0.2em] text-travel-teal sm:tracking-[0.25em]">
          Booking Management
        </p>

        <h1 class="mt-1 text-lg font-bold sm:text-xl">Quản lý đặt tour</h1>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
          :aria-expanded="mobileSidebarOpen"
          :aria-label="mobileSidebarOpen ? 'Đóng menu' : 'Mở menu'"
          @click="emit('toggle-sidebar')"
        >
          <X v-if="mobileSidebarOpen" class="h-5 w-5" />
          <Menu v-else class="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Thông báo"
          class="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-travel-blue sm:flex"
        >
          🔔
        </button>

        <button
          type="button"
          aria-label="Cài đặt"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-travel-blue"
        >
          ⚙
        </button>
      </div>
    </div>
  </header>
</template>
