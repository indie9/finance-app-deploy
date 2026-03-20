<template>
  <div
    class="uploader"
    :class="[
      isDragging && 'uploader--dragging',
      error && 'uploader--error',
    ]"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input
      ref="inputEl"
      class="uploader__input"
      type="file"
      accept=".csv,text/csv"
      @change="onFileChange"
    >

    <div class="uploader__content" @click="triggerPick">
      <div class="uploader__icon" aria-hidden="true">⤒</div>
      <div class="uploader__text">
        <div class="uploader__title">Загрузите CSV</div>
        <div class="uploader__hint">или перетащите файл в эту область</div>
      </div>
    </div>

    <div class="uploader__meta">
      <div v-if="fileName" class="uploader__file">
        <span class="uploader__file-label">Файл:</span>
        <span class="uploader__file-name">{{ fileName }}</span>
      </div>
      <div v-else class="uploader__file uploader__file--empty">
        Файл не выбран
      </div>
    </div>

    <div v-if="error" class="uploader__error" role="alert">
      {{ error }}
    </div>

    <div class="uploader__actions">
      <button
        v-if="fileName"
        type="button"
        class="uploader__clear"
        :disabled="isDragging"
        @click="clearFile"
      >
        Очистить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

type UploaderEmits = {
  'file-selected': [file: File]
}

const emit = defineEmits<UploaderEmits>()

const inputEl = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const fileName = ref<string>('')
const error = ref<string>('')

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.csv')
}

function setFile(file: File) {
  error.value = ''
  if (!isCsvFile(file)) {
    fileName.value = ''
    error.value = 'Поддерживаются только файлы формата .csv'
    return
  }

  fileName.value = file.name
  emit('file-selected', file)
}

function triggerPick() {
  inputEl.value?.click()
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  const file = files?.[0]
  if (!file) return
  setFile(file)
}

function onDragEnter() {
  isDragging.value = true
}
function onDragOver() {
  isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  setFile(file)
}

function clearFile() {
  error.value = ''
  fileName.value = ''
  if (inputEl.value) inputEl.value.value = ''
}
</script>

<style scoped>
.uploader {
  border-radius: 0.9rem;
  border: 1px dashed #cbd5e1;
  background: #ffffff;
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.uploader--dragging {
  border-color: #2563eb;
  background: #eff6ff;
}

.uploader--error {
  border-color: #ef4444;
  background: #fef2f2;
}

.uploader__input {
  display: none;
}

.uploader__content {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.uploader__icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #475569;
  flex: none;
}

.uploader__text {
  display: grid;
  gap: 0.15rem;
}

.uploader__title {
  font-weight: 700;
  color: #0f172a;
}

.uploader__hint {
  font-size: 0.85rem;
  color: #64748b;
}

.uploader__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: baseline;
}

.uploader__file {
  font-size: 0.9rem;
  color: #0f172a;
}

.uploader__file--empty {
  color: #94a3b8;
}

.uploader__file-label {
  color: #64748b;
  font-weight: 500;
  margin-right: 0.35rem;
}

.uploader__file-name {
  word-break: break-word;
}

.uploader__error {
  font-size: 0.85rem;
  color: #b91c1c;
}

.uploader__actions {
  display: flex;
  justify-content: flex-end;
}

.uploader__clear {
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 0.4rem 0.75rem;
  font: inherit;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.uploader__clear:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.uploader__clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

