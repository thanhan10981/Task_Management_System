<template>
  <Teleport to="body">
    <Transition name="ai-task-modal">
      <div v-if="modelValue" class="ai-overlay" @click.self="closeModal">
        <div class="ai-panel">
          <div class="ai-header">
            <div class="ai-title-wrap">
              <div class="ai-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/>
                  <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z"/>
                  <path d="M19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14z"/>
                </svg>
              </div>
              <h2>AI Create Task</h2>
            </div>
            <button class="ai-close" title="Close" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="ai-body">
            <div class="ai-field">
              <label>Requirement</label>
              <textarea
                v-model="prompt"
                class="ai-textarea ai-textarea--large"
                placeholder="Describe what you want to build..."
                :maxlength="maxPromptLength"
              />
              <div class="ai-counter" :class="{ danger: prompt.length >= maxPromptLength }">
                {{ prompt.length }}/{{ maxPromptLength }}
              </div>
            </div>

            <div v-if="errorMessage" class="ai-error">{{ errorMessage }}</div>

            <template v-if="draft">
              <div class="ai-divider"></div>

              <div class="ai-field">
                <label>Title</label>
                <input v-model="draft.title" class="ai-input" maxlength="255" />
              </div>

              <div class="ai-grid">
                <div class="ai-field">
                  <label>Priority</label>
                  <select v-model="draft.priority" class="ai-select">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div class="ai-field">
                <label>Description</label>
                <textarea v-model="draft.description" class="ai-textarea" rows="4" />
              </div>

              <div class="ai-field">
                <label>Behavior</label>
                <textarea v-model="draft.behavior" class="ai-textarea" rows="3" />
              </div>

              <div class="ai-list-section">
                <div class="ai-list-head">
                  <label>Acceptance Criteria</label>
                  <button class="ai-mini-btn" @click="addCriterion">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="ai-list">
                  <div v-for="(_, index) in draft.acceptanceCriteria" :key="index" class="ai-list-row">
                    <input v-model="draft.acceptanceCriteria[index]" class="ai-input" />
                    <button class="ai-row-remove" @click="removeCriterion(index)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="ai-list-section">
                <div class="ai-list-head">
                  <label>Subtasks</label>
                  <button class="ai-mini-btn" @click="addSubtask">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="ai-list">
                  <div v-for="(subtask, index) in draft.suggestedSubtasks" :key="index" class="ai-subtask-row">
                    <input v-model="subtask.title" class="ai-input" placeholder="Subtask title" maxlength="255" />
                    <textarea v-model="subtask.description" class="ai-textarea" placeholder="Subtask description" rows="2" />
                    <button class="ai-row-remove ai-row-remove--floating" @click="removeSubtask(index)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="ai-footer">
            <button class="ai-secondary" @click="closeModal">Cancel</button>
            <button
              v-if="draft"
              class="ai-secondary"
              :disabled="generating || !canGenerate"
              @click="generateDraft"
            >
              {{ generating ? 'Generating...' : 'Regenerate' }}
            </button>
            <button
              v-if="!draft"
              class="ai-primary"
              :disabled="generating || !canGenerate"
              @click="generateDraft"
            >
              {{ generating ? 'Generating...' : 'Generate task' }}
            </button>
            <button
              v-else
              class="ai-primary"
              :disabled="creating || !canCreate"
              @click="createTask"
            >
              {{ creating ? 'Creating...' : 'Create Task' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { useTaskStore } from '@/stores/task.store'
import { computed, ref, watch } from 'vue'
import {
  buildAiTaskDescriptionMarkdown,
  generateAiTaskDraft,
  promptMaxLength,
  type AiTaskDraft,
} from '../services/ai-task.service'

const props = defineProps<{
  modelValue: boolean
  projectId: string | null
  statusId: string | null
  sprintId?: string | null
  groupId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

const store = useTaskStore()
const toast = useToast()
const maxPromptLength = promptMaxLength()
const prompt = ref('')
const draft = ref<AiTaskDraft | null>(null)
const generating = ref(false)
const creating = ref(false)
const errorMessage = ref('')

const canGenerate = computed(() => Boolean(props.projectId && prompt.value.trim()))
const canCreate = computed(() => Boolean(props.projectId && props.statusId && draft.value?.title.trim()))

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    errorMessage.value = ''
  }
)

function closeModal() {
  if (generating.value || creating.value) return
  emit('update:modelValue', false)
}

async function generateDraft() {
  if (!props.projectId || !prompt.value.trim()) return

  generating.value = true
  errorMessage.value = ''
  try {
    draft.value = await generateAiTaskDraft(props.projectId, prompt.value.trim())
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Cannot generate task draft.')
  } finally {
    generating.value = false
  }
}

async function createTask() {
  if (!props.projectId || !props.statusId || !draft.value) return

  creating.value = true
  errorMessage.value = ''
  try {
    await store.createTaskInProject({
      projectId: props.projectId,
      title: draft.value.title.trim(),
      description: buildAiTaskDescriptionMarkdown(
        draft.value.description,
        draft.value.behavior,
        draft.value.acceptanceCriteria
      ),
      statusId: props.statusId,
      priority: draft.value.priority.toLowerCase() as 'low' | 'medium' | 'high',
      sprintId: props.sprintId || undefined,
      groupId: props.groupId || undefined,
      suggestedSubtasks: draft.value.suggestedSubtasks
        .map((subtask) => ({
          title: subtask.title.trim(),
          description: subtask.description?.trim() || undefined,
        }))
        .filter((subtask) => subtask.title),
    })

    toast.success('AI task created successfully')
    emit('created')
    emit('update:modelValue', false)
    resetState()
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Cannot create task.')
  } finally {
    creating.value = false
  }
}

function resetState() {
  prompt.value = ''
  draft.value = null
  errorMessage.value = ''
}

function addCriterion() {
  draft.value?.acceptanceCriteria.push('')
}

function removeCriterion(index: number) {
  draft.value?.acceptanceCriteria.splice(index, 1)
}

function addSubtask() {
  draft.value?.suggestedSubtasks.push({ title: '', description: '' })
}

function removeSubtask(index: number) {
  draft.value?.suggestedSubtasks.splice(index, 1)
}

function extractErrorMessage(error: unknown, fallback: string) {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  if (Array.isArray(responseMessage)) return responseMessage.join(', ')
  if (responseMessage) return responseMessage
  return error instanceof Error ? error.message : fallback
}
</script>

<style scoped>
.ai-overlay {
  position: fixed;
  inset: 0;
  z-index: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(4px);
}

.ai-panel {
  width: min(760px, 100%);
  max-height: min(92vh, 920px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-medium);
  border-radius: 18px;
  background: var(--bg-surface);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.3);
}

.ai-header,
.ai-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-base);
}

.ai-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border-base);
  border-bottom: 0;
}

.ai-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-title-wrap h2 {
  margin: 0;
  color: var(--text-heading);
  font-size: 16px;
  font-weight: 800;
}

.ai-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.ai-icon svg,
.ai-close svg,
.ai-mini-btn svg,
.ai-row-remove svg {
  width: 15px;
  height: 15px;
}

.ai-close,
.ai-mini-btn,
.ai-row-remove {
  border: 0;
  cursor: pointer;
  color: var(--text-muted);
  background: var(--bg-surface-3);
}

.ai-close,
.ai-mini-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.ai-field,
.ai-list-section {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 14px;
}

.ai-field label,
.ai-list-head label {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ai-input,
.ai-select,
.ai-textarea {
  width: 100%;
  border: 1.5px solid var(--border-medium);
  border-radius: 10px;
  background: var(--bg-surface-2);
  color: var(--text-primary);
  font: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.16s, box-shadow 0.16s;
}

.ai-input,
.ai-select {
  height: 38px;
  padding: 0 11px;
}

.ai-textarea {
  min-height: 88px;
  padding: 10px 11px;
  resize: vertical;
}

.ai-textarea--large {
  min-height: 150px;
}

.ai-input:focus,
.ai-select:focus,
.ai-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.ai-counter {
  text-align: right;
  color: var(--text-subtle);
  font-size: 11px;
  font-weight: 600;
}

.ai-counter.danger,
.ai-error {
  color: #ef4444;
}

.ai-error {
  padding: 10px 12px;
  margin-bottom: 14px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  font-size: 13px;
  font-weight: 600;
}

.ai-divider {
  height: 1px;
  margin: 18px 0;
  background: var(--border-base);
}

.ai-grid {
  display: grid;
  grid-template-columns: minmax(160px, 220px);
}

.ai-list-head,
.ai-list-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-list-head {
  justify-content: space-between;
}

.ai-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-row-remove {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.ai-subtask-row {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
  padding: 10px 42px 10px 10px;
  border: 1px solid var(--border-base);
  border-radius: 12px;
  background: var(--bg-surface);
}

.ai-row-remove--floating {
  position: absolute;
  top: 10px;
  right: 10px;
}

.ai-primary,
.ai-secondary {
  height: 38px;
  border-radius: 10px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
}

.ai-primary {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.ai-secondary {
  border: 1.5px solid var(--border-medium);
  color: var(--text-secondary);
  background: transparent;
}

.ai-primary:disabled,
.ai-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.ai-task-modal-enter-active .ai-panel {
  animation: aiIn 0.22s cubic-bezier(0.34, 1.1, 0.64, 1);
}

.ai-task-modal-enter-active,
.ai-task-modal-leave-active {
  transition: opacity 0.2s;
}

.ai-task-modal-enter-from,
.ai-task-modal-leave-to {
  opacity: 0;
}

@keyframes aiIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 640px) {
  .ai-overlay {
    padding: 10px;
  }

  .ai-header,
  .ai-footer,
  .ai-body {
    padding-left: 14px;
    padding-right: 14px;
  }

  .ai-footer {
    flex-wrap: wrap;
  }
}
</style>
