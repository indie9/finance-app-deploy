<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        ref="overlayRef"
        class="modal-overlay"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="modalTitleId"
        @click.self="close"
        @keydown.escape="close"
      >
        <div class="modal-backdrop" />
        <div class="modal-box">
          <header class="modal-header">
            <h2 :id="modalTitleId" class="modal-title">
              {{ budget ? 'Редактировать бюджет' : 'Новый бюджет' }}
            </h2>
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
            <BudgetForm :budget="budget ?? undefined" @success="onFormSuccess" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Budget } from '~/types/budget'

const props = defineProps<{
  modelValue: boolean
  budget?: Budget | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const modalTitleId = 'budget-modal-title'
const overlayRef = ref<HTMLElement | null>(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      nextTick(() => overlayRef.value?.focus())
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function onFormSuccess() {
  close()
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
  max-width: 42rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body :deep(.budget-form) {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
