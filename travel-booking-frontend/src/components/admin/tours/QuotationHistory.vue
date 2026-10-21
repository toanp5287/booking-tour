<script setup>
import { ref, watch } from 'vue'
import tourService from '../../../services/tour.service'

const props = defineProps({
  visible: { type: Boolean, default: false },
  requestId: { type: [String, Number], default: null },
})

const emit = defineEmits(['close', 'create', 'edit', 'sent'])

const quotations = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const sendingId = ref(null)

const statusMap = {
  draft: { label: 'Bản nháp', class: 'bg-slate-100 text-slate-600 ring-slate-200' },
  sent: { label: 'Đã gửi khách', class: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  accepted: { label: 'Đã chấp nhận', class: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  revision_requested: { label: 'Yêu cầu chỉnh sửa', class: 'bg-amber-50 text-amber-700 ring-amber-200' },
  rejected: { label: 'Đã từ chối', class: 'bg-rose-50 text-rose-700 ring-rose-200' },
  expired: { label: 'Hết hạn', class: 'bg-slate-100 text-slate-500 ring-slate-200' },
}

function statusInfo(status) {
  return (
    statusMap[status] || {
      label: status || 'Không xác định',
      class: 'bg-slate-100 text-slate-600 ring-slate-200',
    }
  )
}

function getTourName(quotation) {
  const details = quotation?.details || {}
  if (details?.tour?.name) return details.tour.name
  if (details.tour_name) return details.tour_name
  if (details.tourId || details.tour_id) return `Tour #${details.tour_id || details.tourId}`
  return null
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

async function loadList() {
  if (!props.requestId) {
    quotations.value = []
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await tourService.getQuotationsByRequest(props.requestId)
    const body = response?.data
    quotations.value = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
        ? body
        : []
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Không tải được danh sách báo giá.'
    quotations.value = []
  } finally {
    isLoading.value = false
  }
}

async function send(quotation) {
  sendingId.value = quotation.id
  errorMessage.value = ''
  try {
    await tourService.sendQuotation(quotation.id)
    await loadList()
    emit('sent')
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Không thể gửi báo giá.'
  } finally {
    sendingId.value = null
  }
}

watch(
  () => [props.visible, props.requestId],
  ([visible]) => {
    if (visible) loadList()
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-900/40 p-3 sm:p-6"
      @click.self="emit('close')"
      @keydown.esc.stop="emit('close')"
      tabindex="-1"
    >
      <section class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(23,43,77,0.18)] sm:max-h-[calc(100dvh-3rem)]" role="dialog" aria-modal="true" aria-labelledby="quotation-history-title">
        <header class="flex items-start justify-between gap-4 border-b border-slate-100 bg-sky-50/70 px-5 py-5 sm:px-7">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-sky-600">Lịch sử báo giá</p>
            <h2 id="quotation-history-title" class="mt-1 text-xl font-bold">Yêu cầu #{{ requestId }}</h2>
          </div>
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-500 hover:bg-slate-100" @click="emit('close')">×</button>
        </header>

        <div class="max-h-[calc(100dvh-10rem)] space-y-4 overflow-y-auto overscroll-contain p-4 sm:max-h-[calc(100dvh-12rem)] sm:p-7">
          <div v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {{ errorMessage }}
          </div>

          <div class="flex justify-end">
            <button type="button" class="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700" @click="emit('create')">
              + Tạo báo giá mới
            </button>
          </div>

          <div v-if="isLoading" class="py-10 text-center text-sm text-slate-500">Đang tải...</div>

          <div v-else-if="!quotations.length" class="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            Chưa có báo giá nào cho yêu cầu này.
          </div>

          <article
            v-for="quotation in quotations"
            :key="quotation.id"
            class="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-800">
                  Phiên bản {{ quotation.version }}
                  <span v-if="quotation.title">· {{ quotation.title }}</span>
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span v-if="getTourName(quotation)">
                    Tour: <span class="font-medium text-slate-700">{{ getTourName(quotation) }}</span>
                  </span>
                  <span>·</span>
                  <span>
                    Tạo lúc {{ formatDateTime(quotation.created_at) }}
                    <span v-if="quotation.creator?.full_name"> · {{ quotation.creator.full_name }}</span>
                  </span>
                </div>
              </div>
              <span class="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset" :class="statusInfo(quotation.status).class">
                {{ statusInfo(quotation.status).label }}
              </span>
            </div>

            <div class="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div><span class="text-slate-500">Tổng tiền: </span><span class="font-semibold">{{ formatMoney(quotation.total_amount) }}</span></div>
              <div><span class="text-slate-500">Tiền cọc: </span><span class="font-semibold">{{ formatMoney(quotation.deposit_amount) }}</span></div>
              <div><span class="text-slate-500">Hiệu lực: </span><span class="font-medium">{{ formatDateTime(quotation.valid_until) }}</span></div>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                @click="emit('edit', quotation)"
              >
                Xem / Sửa
              </button>
              <button
                v-if="quotation.status === 'draft'"
                type="button"
                :disabled="sendingId === quotation.id"
                class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                @click="send(quotation)"
              >
                {{ sendingId === quotation.id ? 'Đang gửi...' : 'Gửi khách' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </Teleport>
</template>
