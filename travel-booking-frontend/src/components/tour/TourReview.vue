<script setup>
import { useQuery } from "@tanstack/vue-query";
import reviewService from "../../services/review.service";
import { computed, ref } from "vue";

const props = defineProps({
  idTour: {
    type: String,
    default: "",
  },
});

const isExpanded = ref(false);

const {
  data: tourReviewDetailData,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["reviewTour", props.idTour],
  queryFn: async () => {
    const res = await reviewService.tourReviewDetail(props.idTour);
    return res.data.data || [];
  },
  staleTime: 1000 * 60 * 5,
  enabled: computed(() => !!props.idTour),
});

const reviewTour = computed(() => {
  return Array.isArray(tourReviewDetailData.value)
    ? tourReviewDetailData.value
    : [];
});

// Giới hạn 3 bình luận nếu chưa bấm xem thêm
const displayedReviews = computed(() => {
  if (isExpanded.value) return reviewTour.value;
  return reviewTour.value.slice(0, 3);
});

// Tính điểm trung bình thực tế từ danh sách đánh giá
const averageRating = computed(() => {
  if (!reviewTour.value.length) return "5.0";
  const sum = reviewTour.value.reduce(
    (acc, curr) => acc + (Number(curr.rating) || 0),
    0,
  );
  return (sum / reviewTour.value.length).toFixed(1);
});

const formatDate = (isoStr) => {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
</script>

<template>
  <section
    class="rounded-[26px] border border-white/10 bg-black/25 p-6 backdrop-blur-xl sm:p-8"
  >
    <div class="flex items-end justify-between">
      <div>
        <p
          class="text-xs uppercase tracking-[0.2em] text-white/70 font-semibold"
        >
          Reviews
        </p>

        <h2 class="mt-2 text-2xl font-bold text-white">Khách hàng nói gì?</h2>
      </div>

      <span class="text-sm font-semibold text-white">
        {{ averageRating }} / 5 ({{ reviewTour.length }})
      </span>
    </div>

    <!-- Trạng thái Loading -->
    <div v-if="isLoading" class="py-10 text-center text-xs text-white/50">
      Đang tải nhận xét...
    </div>

    <div v-else class="mt-7 space-y-5">
      <!-- Danh sách hiển thị -->
      <article
        v-for="value in displayedReviews"
        :key="value._id"
        class="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-semibold text-white uppercase"
            >
              {{ value.full_name?.trim()?.split(" ")?.pop()?.charAt(0) || "U" }}
            </div>

            <div>
              <div class="text-sm font-semibold text-white">
                {{ value.full_name || "Người đi tour" }}
              </div>

              <div class="text-xs text-white/70">
                {{ formatDate(value.joined_date) }}
              </div>
            </div>
          </div>

          <div class="text-amber-300">
            {{
              "★".repeat(Math.min(Math.max(Number(value.rating) || 5, 1), 5))
            }}
          </div>
        </div>

        <p class="mt-4 text-sm leading-6 text-white/80">
          {{ value.content }}
        </p>
      </article>

      <!-- Trạng thái trống -->
      <article
        v-if="reviewTour.length === 0"
        class="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
      >
        <div class="flex items-center justify-center text-white/70 text-sm">
          Chưa có đánh giá nào cho chuyến đi này.
        </div>
      </article>
    </div>

    <!-- Nút Xem thêm / Thu gọn (chỉ hiển thị khi tổng số đánh giá > 3) -->
    <button
      v-if="reviewTour.length > 3"
      type="button"
      @click="isExpanded = !isExpanded"
      class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-300 transition hover:text-orange-200 cursor-pointer"
    >
      <span>
        {{
          isExpanded
            ? "Thu gọn đánh giá ↑"
            : `Xem thêm ${reviewTour.length - 3} đánh giá khác ↓`
        }}
      </span>
    </button>
  </section>
</template>
