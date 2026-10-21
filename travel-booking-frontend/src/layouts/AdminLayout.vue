<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import AdminFooter from "../components/admin/AdminFooter.vue";
import AdminHeader from "../components/admin/AdminHeader.vue";
import AdminSidebar from "../components/admin/AdminSidebar.vue";

const route = useRoute();
const isMobileSidebarOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false;
  },
);
</script>

<template>
  <!-- h-screen để khoá khung hình bằng đúng màn hình trình duyệt -->
  <div class="admin-layout flex min-h-screen overflow-hidden antialiased lg:h-screen">
    <!-- Sidebar cố định bên trái -->
    <aside
      class="pointer-events-none fixed inset-0 z-50 lg:pointer-events-auto lg:static lg:inset-auto lg:z-auto lg:w-[265px] lg:shrink-0"
    >
      <button
        v-if="isMobileSidebarOpen"
        type="button"
        aria-label="Đóng menu quản trị"
        class="pointer-events-auto fixed inset-0 z-40 bg-slate-900/35 lg:hidden"
        @click="isMobileSidebarOpen = false"
      />
      <AdminSidebar
        :mobile-open="isMobileSidebarOpen"
        @close="isMobileSidebarOpen = false"
      />
    </aside>

    <!-- Khu vực làm việc bên phải -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header cố định trên cùng -->
      <header class="admin-header-frame sticky top-0 z-40 shrink-0 border-b">
        <AdminHeader
          :mobile-sidebar-open="isMobileSidebarOpen"
          @toggle-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen"
        />
      </header>

      <!-- Vùng cuộn chính chứa cả RouterView lẫn Footer -->
      <main class="flex-1 overflow-y-auto">
        <div
          class="mx-auto flex min-h-full w-full max-w-7xl flex-col justify-between p-4 sm:p-6"
        >
          <!-- Nội dung view -->
          <div class="flex-1">
            <RouterView />
          </div>

          <!-- Footer ở đáy trang -->
          <footer
            class="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500"
          >
            <AdminFooter />
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>
