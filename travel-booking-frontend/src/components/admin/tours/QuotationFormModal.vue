<script setup>
import { computed, reactive, ref, watch } from 'vue'
import tourService from '../../../services/tour.service'

const props = defineProps({
  visible: { type: Boolean, default: false },
  request: { type: Object, default: null },
  quotation: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isSaving = ref(false)
const isLoadingTours = ref(false)
const isLoadingSchedules = ref(false)
const errorMessage = ref('')
const tours = ref([])
const schedules = ref([])

const form = reactive({
  title: '',
  tour_id: '',
  schedule_id: '',
  tour_type: 'GROUP',
  departure_date: '',
  return_date: '',
  pax: { total: 1 },
  itinerary: '',
  items: [],
  surcharge: 0,
  discount: 0,
  deposit_percentage: 30,
  terms: '',
  notes: '',
  valid_until: '',
})

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function resetForm() {
  const quotation = props.quotation
  const request = props.request
  const details = quotation?.details || {}

  const resolvedTourId = String(
    details.tour_id || request?.tour_id || request?.tour?.id || '',
  )

  form.title = quotation?.title || ''
  form.tour_id = resolvedTourId
  form.schedule_id = String(details.schedule_id || '')
  form.tour_type = details.tour_type || 'GROUP'
  form.departure_date = toDateInput(details.departure_date)
  form.return_date = toDateInput(details.return_date)
  form.pax = {
    total: Number(details.pax?.total || request?.estimated_pax || 1),
  }
  form.itinerary = details.itinerary || ''
  form.items = Array.isArray(details.items) && details.items.length
    ? details.items.map((item) => ({
        name: item.name || '',
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
      }))
    : [{ name: '', quantity: 1, unit_price: 0 }]
  form.surcharge = Number(details.surcharge || 0)
  form.discount = Number(details.discount || 0)
  form.deposit_percentage = Number(details.deposit_percentage ?? 30)
  form.terms = quotation?.terms || ''
  form.notes = quotation?.notes || ''
  form.valid_until = toDateInput(quotation?.valid_until)
  errorMessage.value = ''
  schedules.value = []
}

const subtotal = computed(() =>
  form.items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0,
  ),
)

const total = computed(() =>
  Math.max(subtotal.value + Number(form.surcharge || 0) - Number(form.discount || 0), 0),
)

const depositAmount = computed(() => {
  const percentage = Math.min(Math.max(Number(form.deposit_percentage) || 0, 0), 100)
  return Math.round((total.value * percentage) / 100)
})

const selectedTourName = computed(() => {
  if (!form.tour_id) return ''
  if (props.quotation?.details?.tour?.name) return props.quotation.details.tour.name
  const found = tours.value.find((tour) => String(tour.id) === String(form.tour_id))
  if (found?.name) return found.name
  const requestTour = props.request?.tour
  if (requestTour?.id && String(requestTour.id) === String(form.tour_id) && requestTour?.name) {
    return requestTour.name
  }
  if (props.request?.tour_name) return props.request.tour_name
  if (props.request?.tourName) return props.request.tourName
  return `Tour #${form.tour_id}`
})

const hasLinkedTour = computed(() => Boolean(form.tour_id))

function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function addItem() {
  form.items.push({ name: '', quantity: 1, unit_price: 0 })
}

function removeItem(index) {
  if (form.items.length <= 1) return
  form.items.splice(index, 1)
}

async function loadTours() {
  isLoadingTours.value = true
  try {
    const response = await tourService.getAll()
    const body = response?.data
    tours.value = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
        ? body
        : []
  } catch {
    tours.value = []
  } finally {
    isLoadingTours.value = false
  }
}

async function loadSchedules(tourId) {
  if (!tourId) {
    schedules.value = []
    return
  }
  isLoadingSchedules.value = true
  try {
    const response = await tourService.getSchedulesByTour(tourId)
    const body = response?.data
    schedules.value = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
        ? body
        : []
  } catch {
    schedules.value = []
  } finally {
    isLoadingSchedules.value = false
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    resetForm()
    await loadTours()
    if (form.tour_id) await loadSchedules(form.tour_id)
  },
  { immediate: true },
)

watch(
  () => [props.request, props.quotation],
  async ([request, quotation]) => {
    if (!props.visible) return
    resetForm()
    if (tours.value.length === 0) {
      await loadTours()
    }
    if (form.tour_id) {
      await loadSchedules(form.tour_id)
    }
  },
  { deep: true },
)

watch(
  () => form.tour_id,
  async (tourId) => {
    if (!props.visible) return
    if (quotationEditing()) {
      return
    }
    form.schedule_id = ''
    await loadSchedules(tourId)
  },
)

function quotationEditing() {
  return Boolean(props.quotation?.id)
}

function validate() {
  if (!props.request?.id) return 'Không xác định được yêu cầu tour.'
  if (!form.tour_id) {
    return 'Yêu cầu tour đoàn này chưa được liên kết với tour. Vui lòng liên kết tour cho yêu cầu trước khi tạo báo giá.'
  }
  if (!form.pax.total || form.pax.total < 1) return 'Tổng số người tham gia không hợp lệ.'
  if (!form.items.length) return 'Cần ít nhất một dịch vụ.'
  for (const item of form.items) {
    if (!item.name?.trim()) return 'Tên dịch vụ không được để trống.'
    if (!item.quantity || item.quantity < 1) return 'Số lượng dịch vụ không hợp lệ.'
    if (Number(item.unit_price) < 0) return 'Đơn giá không hợp lệ.'
  }
  if (total.value <= 0) return 'Tổng tiền báo giá phải lớn hơn 0.'
  if (Number(form.deposit_percentage) < 0 || Number(form.deposit_percentage) > 100) {
    return 'Tỷ lệ đặt cọc phải từ 0 đến 100%.'
  }
  return ''
}

async function submit() {
  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  errorMessage.value = ''
  isSaving.value = true

  const details = {
    tour_id: String(form.tour_id),
    schedule_id: form.schedule_id ? String(form.schedule_id) : null,
    tour_type: form.tour_type,
    departure_date: form.departure_date || null,
    return_date: form.return_date || null,
    pax: {
      total: Number(form.pax.total),
    },
    itinerary: form.itinerary?.trim() || null,
    items: form.items.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
    surcharge: Number(form.surcharge || 0),
    discount: Number(form.discount || 0),
    deposit_percentage: Number(form.deposit_percentage || 0),
  }

  const payload = {
    request_id: String(props.request.id),
    title: form.title?.trim() || undefined,
    currency: 'VND',
    valid_until: form.valid_until || null,
    terms: form.terms?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
    details,
  }

  try {
    if (props.quotation?.id) {
      await tourService.updateQuotation(props.quotation.id, payload)
    } else {
      await tourService.createQuotation(payload)
    }
    emit('saved')
    emit('close')
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      error?.message ||
      'Không thể lưu báo giá. Vui lòng thử lại.'
  } finally {
    isSaving.value = false
  }
}
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
      <section class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(23,43,77,0.18)] sm:max-h-[calc(100dvh-3rem)]" role="dialog" aria-modal="true" aria-labelledby="quotation-form-title">
        <header class="flex items-start justify-between gap-4 border-b border-slate-100 bg-sky-50/70 px-5 py-5 sm:px-7">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-sky-600">
              {{ quotation?.id ? 'Chỉnh sửa báo giá' : 'Tạo báo giá' }}
            </p>
            <h2 id="quotation-form-title" class="mt-1 text-xl font-bold">
              Yêu cầu #{{ request?.id }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Backend sẽ tự tính lại tổng tiền và tiền cọc.
            </p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-500 hover:bg-slate-100"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <div class="max-h-[calc(100dvh-11rem)] space-y-6 overflow-y-auto overscroll-contain p-4 sm:max-h-[calc(100dvh-13rem)] sm:p-7">
          <div
            v-if="errorMessage"
            class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {{ errorMessage }}
          </div>

          <!-- Thông tin chung -->
          <section class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Tiêu đề báo giá</span>
              <input
                v-model="form.title"
                type="text"
                maxlength="200"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
                placeholder="VD: Báo giá tour đoàn công ty ABC"
              />
            </label>

            <label class="block sm:col-span-2">
              <span class="mb-1 block text-sm font-medium text-slate-700">
                Tour báo giá <span class="text-rose-500">*</span>
              </span>
              <div class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                <div v-if="hasLinkedTour" class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-semibold text-slate-800">{{ selectedTourName }}</p>
                    <p class="text-xs text-slate-500">Tour được xác định từ yêu cầu tour đoàn (không cho thay đổi).</p>
                  </div>
                  <span class="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">Đã liên kết</span>
                </div>
                <div v-else class="text-rose-700">
                  <p class="font-semibold">Yêu cầu chưa được liên kết với tour</p>
                  <p class="mt-1 text-xs">Không thể tạo báo giá khi chưa xác định tour. Vui lòng gắn tour cho yêu cầu này trước khi tạo báo giá.</p>
                </div>
              </div>
              <p v-if="quotation?.id" class="mt-1 text-xs text-slate-500">
                Đang chỉnh sửa báo giá — tour sẽ được giữ nguyên theo phiên bản hiện tại.
              </p>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Lịch khởi hành tham chiếu (không giữ chỗ)</span>
              <select
                v-model="form.schedule_id"
                :disabled="!form.tour_id || isLoadingSchedules"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-50 disabled:bg-slate-100"
              >
                <option value="">
                  {{ isLoadingSchedules ? 'Đang tải...' : '-- Không chọn lịch tham chiếu --' }}
                </option>
                <option v-for="schedule in schedules" :key="schedule.id" :value="String(schedule.id)">
                  {{ toDateInput(schedule.departure_date) }} · còn {{ schedule.available_slots }} chỗ
                </option>
              </select>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Hạn hiệu lực</span>
              <input
                v-model="form.valid_until"
                type="date"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
              />
            </label>
          </section>

          <!-- Số người & ngày -->
          <section class="rounded-2xl border border-slate-100 p-4">
            <h3 class="mb-3 font-bold text-slate-800">Số người & thời gian</h3>
            <div class="grid gap-4 sm:grid-cols-3">
              <label class="block">
                <span class="mb-1 block text-xs text-slate-500">Tổng số người tham gia <span class="text-rose-500">*</span></span>
                <div class="flex items-center gap-2">
                  <input v-model.number="form.pax.total" type="number" min="1" step="1" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <span class="text-xs text-slate-500">người</span>
                </div>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs text-slate-500">Ngày đi</span>
                <input v-model="form.departure_date" type="date" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs text-slate-500">Ngày về</span>
                <input v-model="form.return_date" type="date" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
            </div>
            <label class="mt-4 block">
              <span class="mb-1 block text-xs text-slate-500">Lịch trình tóm tắt</span>
              <textarea v-model="form.itinerary" rows="3" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Mô tả lịch trình..."></textarea>
            </label>
          </section>

          <!-- Dịch vụ -->
          <section class="rounded-2xl border border-slate-100 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="font-bold text-slate-800">Danh sách dịch vụ</h3>
              <button type="button" class="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50" @click="addItem">
                + Thêm dịch vụ
              </button>
            </div>

            <div class="space-y-3">
              <div v-for="(item, index) in form.items" :key="index" class="grid gap-2 sm:grid-cols-[1fr_100px_140px_40px]">
                <input v-model="item.name" type="text" placeholder="Tên dịch vụ" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input v-model.number="item.quantity" type="number" min="1" placeholder="SL" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input v-model.number="item.unit_price" type="number" min="0" placeholder="Đơn giá" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <button type="button" class="rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40" :disabled="form.items.length <= 1" @click="removeItem(index)">
                  ×
                </button>
              </div>
            </div>
          </section>

          <!-- Tổng hợp -->
          <section class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Phụ phí</span>
              <input v-model.number="form.surcharge" type="number" min="0" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Giảm giá</span>
              <input v-model.number="form.discount" type="number" min="0" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Tỷ lệ đặt cọc (%)</span>
              <input v-model.number="form.deposit_percentage" type="number" min="0" max="100" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <div class="rounded-2xl bg-sky-50 p-4 text-sm">
              <div class="flex justify-between"><span>Tạm tính</span><span class="font-semibold">{{ formatMoney(subtotal) }}</span></div>
              <div class="mt-1 flex justify-between"><span>Tổng cộng</span><span class="font-bold text-sky-700">{{ formatMoney(total) }}</span></div>
              <div class="mt-1 flex justify-between"><span>Tiền cọc</span><span class="font-semibold">{{ formatMoney(depositAmount) }}</span></div>
            </div>
          </section>

          <section class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Điều kiện thanh toán / hủy</span>
              <textarea v-model="form.terms" rows="3" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"></textarea>
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Ghi chú gửi khách</span>
              <textarea v-model="form.notes" rows="3" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"></textarea>
            </label>
          </section>
        </div>

        <footer class="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <button type="button" class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" @click="emit('close')">
            Hủy
          </button>
          <button
            type="button"
            :disabled="isSaving"
            class="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            @click="submit"
          >
            {{ isSaving ? 'Đang lưu...' : 'Lưu báo giá' }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
