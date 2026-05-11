<template>
  <Teleport to="body">
    <Transition name="ai-task-modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[700] flex items-center justify-center p-4 sm:p-5 bg-slate-950/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <!-- Panel -->
        <div
          class="ai-panel relative w-full max-w-[760px] max-h-[92vh] flex flex-col rounded-2xl overflow-hidden
                 border border-white/10 bg-[#0f1117]/95 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        >
          <!-- Gradient top-bar glow -->
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent pointer-events-none" />

          <!-- Header -->
          <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.07]">
            <div class="flex items-center gap-3">
              <!-- AI icon -->
              <div class="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-violet-500/30 shrink-0">
                <svg class="w-[15px] h-[15px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/>
                  <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z"/>
                  <path d="M19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-bold text-white leading-none tracking-tight">AI Create Task</h2>
                
              </div>
            </div>
            <button
              title="Close"
              class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-150"
              @click="closeModal"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

            <!-- Prompt field -->
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Requirement
              </label>
              <textarea
                v-model="prompt"
                class="ai-field-input min-h-[140px] resize-y"
                placeholder="Describe what you want to build..."
                :maxlength="maxPromptLength"
              />
              <div
                class="text-right text-[11px] font-semibold transition-colors"
                :class="prompt.length >= maxPromptLength ? 'text-red-400' : 'text-slate-600'"
              >
                {{ prompt.length }}/{{ maxPromptLength }}
              </div>
            </div>

            <!-- Error -->
            <div
              v-if="errorMessage"
              class="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium"
            >
              <svg class="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMessage }}
            </div>

            <!-- Draft section -->
            <template v-if="draft">
              <!-- Divider -->
              <div class="flex items-center gap-3">
                <div class="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                <span class="text-[10px] font-bold uppercase tracking-widest text-violet-400/70 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">AI Draft</span>
                <div class="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              </div>

              <!-- Title -->
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Title</label>
                <input v-model="draft.title" class="ai-field-input" maxlength="255" />
              </div>

              <!-- Priority -->
              <div class="space-y-2 max-w-[220px]">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Priority</label>
                <div class="relative">
                  <select v-model="draft.priority" class="ai-field-input appearance-none pr-9 cursor-pointer">
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🔴 High</option>
                  </select>
                  <svg class="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              <!-- Description -->
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Description</label>
                <textarea v-model="draft.description" class="ai-field-input min-h-[96px] resize-y" rows="4" />
              </div>

              <!-- Behavior -->
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Behavior</label>
                <textarea v-model="draft.behavior" class="ai-field-input min-h-[72px] resize-y" rows="3" />
              </div>

              <!-- Acceptance Criteria -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Acceptance Criteria</label>
                  <button
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 hover:text-violet-300 transition-all duration-150"
                    @click="addCriterion"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(_, index) in draft.acceptanceCriteria"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <div class="w-1.5 h-1.5 rounded-full bg-violet-400/60 shrink-0" />
                    <input v-model="draft.acceptanceCriteria[index]" class="ai-field-input flex-1" />
                    <button
                      class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0"
                      @click="removeCriterion(index)"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <p v-if="!draft.acceptanceCriteria.length" class="text-[12px] text-slate-600 italic px-1">No criteria yet — click + to add</p>
                </div>
              </div>

              <!-- Subtasks -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subtasks</label>
                  <button
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 hover:text-violet-300 transition-all duration-150"
                    @click="addSubtask"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="(subtask, index) in draft.suggestedSubtasks"
                    :key="index"
                    class="relative group rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 pr-11 space-y-2
                           hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all duration-150"
                  >
                    <input
                      v-model="subtask.title"
                      class="ai-field-input"
                      placeholder="Subtask title"
                      maxlength="255"
                    />
                    <textarea
                      v-model="subtask.description"
                      class="ai-field-input min-h-[60px] resize-y"
                      placeholder="Subtask description"
                      rows="2"
                    />
                    <button
                      class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                      @click="removeSubtask(index)"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <p v-if="!draft.suggestedSubtasks.length" class="text-[12px] text-slate-600 italic px-1">No subtasks yet — click + to add</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-white/[0.07]">
            <button
              class="h-9 px-4 rounded-xl border border-white/10 text-slate-400 text-[13px] font-semibold hover:bg-white/5 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              @click="closeModal"
            >
              Cancel
            </button>

            <!-- Regenerate (when draft exists) -->
            <button
              v-if="draft"
              class="h-9 px-4 rounded-xl border border-violet-500/30 text-violet-400 text-[13px] font-semibold hover:bg-violet-500/10 hover:border-violet-400/50 hover:text-violet-300 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="generating || !canGenerate"
              @click="generateDraft"
            >
              <span v-if="generating" class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Generating...
              </span>
              <span v-else>↺ Regenerate</span>
            </button>

            <!-- Generate (initial) -->
            <button
              v-if="!draft"
              class="h-9 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                     bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-violet-500/25
                     hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98] transition-all duration-150"
              :disabled="generating || !canGenerate"
              @click="generateDraft"
            >
              <span v-if="generating" class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Generating...
              </span>
              <span v-else class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/>
                </svg>
                Generate Task
              </span>
            </button>

            <!-- Create Task -->
            <button
              v-else
              class="h-9 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                     bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-violet-500/25
                     hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98] transition-all duration-150"
              :disabled="creating || !canCreate"
              @click="createTask"
            >
              <span v-if="creating" class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Creating...
              </span>
              <span v-else class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Create Task
              </span>
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
/* Shared field styling kept minimal — Tailwind handles layout/spacing */
.ai-field-input {
  @apply w-full rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 text-[13px]
         placeholder:text-slate-600 px-3 py-2.5 outline-none font-[inherit]
         focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 focus:bg-white/[0.06]
         transition-all duration-150;
}

select.ai-field-input option {
  background: #1a1d27;
  color: #e2e8f0;
}

/* Modal transition */
.ai-task-modal-enter-active,
.ai-task-modal-leave-active {
  transition: opacity 0.2s ease;
}

.ai-task-modal-enter-active .ai-panel {
  animation: aiPanelIn 0.25s cubic-bezier(0.34, 1.1, 0.64, 1);
}

.ai-task-modal-enter-from,
.ai-task-modal-leave-to {
  opacity: 0;
}

@keyframes aiPanelIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Thin scrollbar */
.scrollbar-thin::-webkit-scrollbar { width: 5px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
.scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
</style>
