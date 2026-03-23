<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-import-title"
        tabindex="-1"
        ref="overlayRef"
        @click.self="close"
      >
        <div class="modal-backdrop" />

        <div class="modal-box modal-box--csv">
          <header class="modal-header">
            <h2 id="csv-import-title" class="modal-title">Импорт CSV</h2>
            <button
              type="button"
              class="modal-close"
              aria-label="Закрыть"
              @click="close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>

          <div class="modal-body">
            <FileUploader
              :key="uploaderKey"
              @file-selected="onFileSelected"
            />

            <div v-if="parseStatus !== 'idle'" class="csv-meta">
              <div class="csv-meta__row">
                <span class="csv-meta__k">Строк всего</span>
                <span class="csv-meta__v">{{ totalRows }}</span>
              </div>
              <div class="csv-meta__row">
                <span class="csv-meta__k">Валидных</span>
                <span class="csv-meta__v csv-meta__v--ok">{{ validRowsCount }}</span>
              </div>
              <div class="csv-meta__row">
                <span class="csv-meta__k">Проблемных</span>
                <span class="csv-meta__v csv-meta__v--bad">{{ invalidRowsCount }}</span>
              </div>
            </div>

            <div v-if="parseStatus === 'parsing'" class="csv-parsing">
              <div class="csv-parsing__spinner" aria-hidden="true" />
              <span>Парсим CSV...</span>
            </div>

            <div v-if="parseStatus === 'ready'" class="csv-import-actions">
              <button
                type="button"
                class="csv-import-actions__btn"
                :disabled="!canImport || importStatus === 'importing'"
                @click="importAll"
              >
                <span v-if="importStatus === 'importing'">Импортируем...</span>
                <span v-else>Импортировать все</span>
              </button>

              <div v-if="importStatus === 'error'" class="csv-import-actions__error" role="alert">
                {{ importError }}
              </div>
            </div>

            <div v-if="parseStatus === 'ready'" class="preview">
              <div v-if="previewRows.length === 0" class="preview__empty">
                Нет данных для превью.
              </div>

              <div v-else class="preview__table-wrap">
                <table class="preview__table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Описание</th>
                      <th>Категория</th>
                      <th>Тип</th>
                      <th>Сумма</th>
                      <th>Проблема</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in previewRows"
                      :key="row.uid"
                      :class="[
                        row.status === 'invalid' && 'preview__row--invalid',
                        row.reasonClass,
                      ]"
                    >
                      <td>{{ row.date || '—' }}</td>
                      <td>{{ row.description || '—' }}</td>
                      <td>{{ row.category || '—' }}</td>
                      <td>{{ row.type ? toTypeLabel(row.type) : row.typeRaw || '—' }}</td>
                      <td>
                        {{ row.amount != null ? formatAmount(row.amount) : row.amountRaw || '—' }}
                      </td>
                      <td class="preview__reason">
                        {{ row.reason || '' }}
                      </td>
                      <td class="preview__actions">
                        <button
                          type="button"
                          class="preview__remove"
                          aria-label="Удалить строку из импорта"
                          @click="removeRow(row.uid)"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="parseStatus === 'error'" class="csv-error" role="alert">
              {{ parseError }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import FileUploader from '~/components/FileUploader.vue'
import { parseTransactionsCsvFile } from '~/utils/transactionsCsv'
import type { Transaction, TransactionCreatePayload } from '~/types/transaction'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'import-success': []
}>()

const overlayRef = ref<HTMLElement | null>(null)
watch(
  () => props.modelValue,
  (open) => {
    if (open) nextTick(() => overlayRef.value?.focus())
  }
)

const uploaderKey = ref(0)

function resetModalState() {
  parseStatus.value = 'idle'
  parseError.value = ''
  importStatus.value = 'idle'
  importError.value = ''
  previewRows.value = []
  uploaderKey.value += 1
}

function close() {
  resetModalState()
  emit('update:modelValue', false)
}

type ParseStatus = 'idle' | 'parsing' | 'ready' | 'error'
const parseStatus = ref<ParseStatus>('idle')
const parseError = ref<string>('')

type ImportStatus = 'idle' | 'importing' | 'error'
const importStatus = ref<ImportStatus>('idle')
const importError = ref<string>('')

type PreviewRowStatus = 'valid' | 'invalid'

type PreviewRow = {
  uid: string
  rowIndex: number
  status: PreviewRowStatus
  date: string | null
  description: string | null
  category: string | null
  type: Transaction['type'] | null
  typeRaw: string | null
  amount: number | null
  amountRaw: string | null
  reason: string | null
  reasonClass: string
  txCreate: TransactionCreatePayload | null
}

const previewRows = ref<PreviewRow[]>([])

const totalRows = computed(() => previewRows.value.length)
const validRowsCount = computed(() => previewRows.value.filter(r => r.status === 'valid').length)
const invalidRowsCount = computed(() => totalRows.value - validRowsCount.value)

const canImport = computed(() => validRowsCount.value > 0)

function toTypeLabel(type: Transaction['type'] | null): string {
  if (!type) return '—'
  return type === 'income' ? 'Доход' : 'Расход'
}

function getReasonClass(reason: string): string {
  if (reason.includes('Пустая категория')) return 'preview__row--missing-category'
  if (reason.includes('Некорректная сумма')) return 'preview__row--bad-amount'
  if (reason.includes('Неизвестный тип')) return 'preview__row--unknown-type'
  return 'preview__row--invalid'
}

const { formatAmount } = useFormatters()

function buildPreviewRows(parsed: Awaited<ReturnType<typeof parseTransactionsCsvFile>>) {
  const invalidMap = new Map<number, { reason: string; row: { date?: string; description?: string; category?: string; type?: string; amount?: string } }>()
  for (const inv of parsed.invalidRows) {
    invalidMap.set(inv.rowIndex, { reason: inv.reason, row: inv.row })
  }

  const transactionsMap = new Map<number, Transaction>()
  for (const v of parsed.transactions) {
    transactionsMap.set(v.rowIndex, v.tx)
  }

  const rows: PreviewRow[] = []

  for (let i = 0; i < parsed.totalRows; i++) {
    const invalid = invalidMap.get(i)
    const tx = transactionsMap.get(i)

    if (tx) {
      rows.push({
        uid: `row-${i}`,
        rowIndex: i,
        status: 'valid',
        date: tx.date,
        description: tx.description ?? null,
        category: tx.category ?? null,
        type: tx.type,
        typeRaw: null,
        amount: tx.amount,
        amountRaw: null,
        reason: null,
        reasonClass: '',
        txCreate: {
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          date: tx.date,
          description: tx.description || undefined,
        },
      })
      continue
    }

    if (invalid) {
      rows.push({
        uid: `row-${i}`,
        rowIndex: i,
        status: 'invalid',
        date: invalid.row.date ?? null,
        description: invalid.row.description ?? null,
        category: invalid.row.category ?? null,
        type: null,
        typeRaw: invalid.row.type ?? null,
        amount: null,
        amountRaw: invalid.row.amount ?? null,
        reason: invalid.reason,
        reasonClass: getReasonClass(invalid.reason),
        txCreate: null,
      })
      continue
    }
  }

  // Убираем пустые (если parser не вернул запись для строки)
  previewRows.value = rows.filter(r => r.reason || r.txCreate)
}

async function onFileSelected(file: File) {
  parseStatus.value = 'parsing'
  parseError.value = ''
  importStatus.value = 'idle'
  importError.value = ''
  previewRows.value = []

  try {
    const parsed = await parseTransactionsCsvFile(file)
    buildPreviewRows(parsed)
    parseStatus.value = 'ready'
  } catch (e) {
    parseStatus.value = 'error'
    parseError.value = 'Не удалось разобрать CSV. Проверь формат и повтори попытку.'
  }
}

function removeRow(uid: string) {
  previewRows.value = previewRows.value.filter(r => r.uid !== uid)
}

async function importAll() {
  if (!canImport.value) return

  importStatus.value = 'importing'
  importError.value = ''

  const payload = previewRows.value
    .filter((r) => r.status === 'valid' && r.txCreate)
    .map((r) => r.txCreate as TransactionCreatePayload)

  try {
    await $fetch('/api/transactions/batch', {
      method: 'POST',
      body: { transactions: payload },
    })

    resetModalState()
    emit('import-success')
    emit('update:modelValue', false)
  } catch (e: unknown) {
    importStatus.value = 'error'
    const err = e as { data?: { message?: string } }
    importError.value = err?.data?.message || 'Не удалось импортировать CSV.'
    return
  }

  importStatus.value = 'idle'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}

.modal-box {
  position: relative;
  width: 100%;
  max-width: 56rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-box--csv {
  max-width: 60rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: #64748b;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.csv-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
}

.csv-meta__row {
  display: inline-flex;
  gap: 0.5rem;
  align-items: baseline;
}

.csv-meta__k {
  font-size: 0.8rem;
  color: #64748b;
}

.csv-meta__v {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.csv-meta__v--ok {
  color: #15803d;
}

.csv-meta__v--bad {
  color: #b91c1c;
}

.csv-parsing {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: #475569;
}

.csv-parsing__spinner {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: table-spin 0.8s linear infinite;
}

.preview {
  display: grid;
  gap: 0.75rem;
}

.preview__empty {
  padding: 0.75rem;
  color: #64748b;
  border: 1px dashed #e2e8f0;
  border-radius: 0.75rem;
}

.preview__table-wrap {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.preview__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.preview__table thead th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.85rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 0.9rem;
  z-index: 1;
}

.preview__table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.65rem 0.9rem;
  font-size: 0.9rem;
  color: #0f172a;
}

.preview__row--invalid {
  background: #fef2f2;
}

.preview__row--missing-category {
  background: #fffbeb;
}

.preview__row--bad-amount {
  background: #fef2f2;
}

.preview__row--unknown-type {
  background: #fff7ed;
}

.preview__reason {
  color: #7f1d1d;
  font-size: 0.85rem;
}

.preview__actions {
  width: 120px;
  text-align: right;
}

.preview__remove {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 0.5rem;
  padding: 0.35rem 0.6rem;
  font: inherit;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.preview__remove:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.csv-error {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.csv-import-actions {
  display: grid;
  gap: 0.75rem;
}

.csv-import-actions__btn {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  padding: 0.65rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.csv-import-actions__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.csv-import-actions__btn:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.csv-import-actions__error {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.9rem;
}

/* reuse keyframes from other components */
@keyframes table-spin {
  to { transform: rotate(360deg); }
}
</style>

