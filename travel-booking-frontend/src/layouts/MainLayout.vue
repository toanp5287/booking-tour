<script setup>
import { useRoute } from "vue-router";

import AppHeader from "../components/common/AppHeader.vue";
import AppFooter from "../components/common/AppFooter.vue";

const route = useRoute();
</script>

<template>
  <div class="customer-layout flex min-h-screen flex-col justify-between">
    <AppHeader />

    <!-- Nội dung các trang -->
    <RouterView />

    <!-- Truyền trạng thái tự động theo URL đang đứng -->
    <AppFooter :transparent-background="Boolean(route.meta.hasHeroBg)" />
  </div>
</template>
