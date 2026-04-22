<template>
  <div class="flex flex-col h-full overflow-hidden relative" :style="{ background: 'var(--bg-app)' }">

    <!-- ══ PAGE HEADER ══════════════════════════════════════════════════════════════════════════ -->
    <div class="flex items-center justify-between px-3 sm:px-5 md:px-7 pt-2.5 sm:pt-4 md:pt-5 pb-2 sm:pb-3 shrink-0">
      <div class="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <span class="text-lg sm:text-2xl">🔥</span>
        <h1 class="text-sm sm:text-xl md:text-2xl font-extrabold tracking-tight truncate" style="color:var(--text-heading)">Task</h1>
      </div>

      <div class="flex items-center gap-2 sm:gap-3 shrink-0">

        <!-- ── MEMBER PICKER ─────────────────────────────────── -->
        <div class="relative" ref="memberPickerRef">
          <div class="flex items-center gap-1.5">

            <!-- Avatar stack -->
            <div class="flex items-center -space-x-2">
              <button
                v-for="m in store.members.slice(0, visibleAvatarCount)" :key="m.id"
                class="kb-avatar-lg text-[11px] ring-2 ring-[var(--bg-app)] transition-all duration-150 cursor-pointer"
                :class="filterMembers.includes(m.id) ? 'ring-indigo-500 scale-110' : 'opacity-90 hover:opacity-100 hover:scale-105'"
                :style="{ background: m.color }"
                :title="m.name"
                @click.stop="toggleFilterMember(m.id)"
              >{{ m.initials }}</button>

              <!-- Overflow badge -->
              <button
                v-if="store.members.length > visibleAvatarCount"
                class="kb-avatar-lg text-[10px] ring-2 ring-[var(--bg-app)] cursor-pointer hover:scale-105 transition-transform"
                style="background:var(--bg-surface-3);color:var(--text-muted)"
                title="Show all members"
                @click.stop="memberPickerOpen = true"
              >+{{ store.members.length - visibleAvatarCount }}</button>
            </div>

            <!-- Assign / manage button -->
            <button
              class="mp-add-btn"
              :class="{ 'mp-add-btn--open': memberPickerOpen }"
              title="Manage members"
              @click.stop="memberPickerOpen = !memberPickerOpen"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="10" y1="4" x2="10" y2="16"/>
                <line x1="4" y1="10" x2="16" y2="10"/>
              </svg>
            </button>
          </div>

          <!-- Dropdown -->
          <Transition name="mp-drop">
            <div v-if="memberPickerOpen" class="mp-dropdown" @click.stop>
              <!-- Header -->
              <div class="mp-dropdown-head">
                <span class="text-[11px] font-bold tracking-wide" style="color:var(--text-heading)">Board Members</span>
                <span class="text-[10px]" style="color:var(--text-subtle)">{{ store.members.length }} people</span>
              </div>

              <!-- Filter active notice -->
              <div v-if="filterMembers.length" class="mp-filter-notice">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 10 13 17 6"/></svg>
                Filtering by {{ filterMembers.length }} member{{ filterMembers.length > 1 ? 's' : '' }}
                <button class="mp-clear" @click="filterMembers = []">Clear</button>
              </div>

              <!-- Search -->
              <div class="mp-search-wrap">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-subtle)"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                <input
                  v-model="memberSearch"
                  class="mp-search"
                  placeholder="Search member…"
                  ref="memberSearchInput"
                />
              </div>

              <!-- Member list -->
              <div class="mp-list">
                <div
                  v-for="m in filteredPickerMembers" :key="m.id"
                  class="mp-item"
                  :class="{ 'mp-item--on': filterMembers.includes(m.id) }"
                  @click="toggleFilterMember(m.id)"
                >
                  <div class="mp-item-avatar" :style="{ background: m.color }">{{ m.initials }}</div>
                  <div class="mp-item-info">
                    <span class="mp-item-name">{{ m.name }}</span>
                  </div>
                  <!-- Checkmark -->
                  <svg
                    v-if="filterMembers.includes(m.id)"
                    class="mp-item-check"
                    width="14" height="14" viewBox="0 0 20 20"
                    fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"
                  ><polyline points="4 10 8 14 16 6"/></svg>
                </div>

                <!-- Empty state -->
                <div v-if="filteredPickerMembers.length === 0" class="py-4 text-center text-[12px]" style="color:var(--text-subtle)">
                  No members found
                </div>
              </div>

              <!-- Footer actions -->
              <div class="mp-footer">
                <button
                  class="mp-footer-btn mp-footer-btn--ghost"
                  @click="filterMembers = []; memberPickerOpen = false"
                >Reset filter</button>
                <button
                  class="mp-footer-btn mp-footer-btn--primary"
                  @click="memberPickerOpen = false"
                >Done</button>
              </div>
            </div>
          </Transition>
        </div><!-- /member picker -->

        <!-- Toggle panel button -->
        <button
          class="w-8 h-8 rounded-xl border-none flex items-center justify-center cursor-pointer transition-all duration-150"
          :style="sidebarOpen
            ? 'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 14px rgba(99,102,241,0.3);'
            : 'background:var(--btn-bg);color:var(--text-muted);border:1.5px solid var(--btn-border);'"
          :title="sidebarOpen ? 'Close panel' : 'Open panel'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </button>

      </div>
    </div>

    <!-- ══ BOARD BODY ════════════════════════════════════════════════════════ -->
    <div class="flex flex-1 min-h-0 overflow-hidden">

      <!-- ── KANBAN COLUMNS ──────────────────────────────────────────────── -->
      <div class="flex-1 h-full overflow-x-auto overflow-y-hidden min-w-0" :class="{ 'board-compact': sidebarOpen }">
        <draggable
          v-model="columnsModel"
          item-key="id"
          tag="div"
          handle=".kb-col-drag-handle"
          class="flex gap-2.5 sm:gap-3 md:gap-4 h-full px-2.5 sm:px-5 md:px-7 pb-3 sm:pb-4 pt-1"
          :style="sidebarOpen ? '' : 'min-width:max-content;'"
          :animation="200"
          ghost-class="kb-col-ghost"
        >
          <template #item="{ element: col }">
            <div class="kb-col group">
              <span class="kb-col-accent" :style="{ background: col.color }"/>

              <div class="kb-col-header">
                <div class="flex items-center gap-2 min-w-0">
                  <!-- Drag handle -->
                  <span
                    class="kb-col-drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing
                           opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                    title="Drag to reorder"
                  >
                    <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor" style="color:var(--text-subtle)">
                      <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
                      <circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
                      <circle cx="2" cy="14" r="1.5"/><circle cx="8" cy="14" r="1.5"/>
                    </svg>
                  </span>
                  <!-- Color dot -->
                  <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: col.color }"/>
                  <span class="kb-col-title truncate">{{ col.title }}</span>
                  <span class="kb-col-count">{{ store.tasksByCol(col.id).length }}</span>
                </div>
                <button
                  class="kb-col-action flex-shrink-0 ml-1"
                  title="Add task"
                  @click.stop="sidebarOpen=true;activeTab='task';newTask.status=col.id"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>

              <!-- Task cards -->
              <draggable
                :model-value="store.tasksByCol(col.id)"
                @update:model-value="(val: any) => onTasksReorder(col.id, val)"
                @change="(evt: any) => onTaskChange(evt, col.id)"
                item-key="id"
                tag="div"
                group="tasks"
                class="kb-col-body flex flex-col gap-2"
                :animation="180"
                ghost-class="kb-card-ghost"
                chosen-class="kb-card-chosen"
              >
                <template #item="{ element: task }">
                  <div
                    class="kb-task-card group/card"
                    :class="`card-prio-${task.priority}`"
                    @click="openTaskModal(task.id)"
                  >
                    <!-- Label + priority badge row -->
                    <div class="flex items-center justify-between mb-2">
                      <span
                        v-if="task.label"
                        class="kb-card-label"
                        :style="{ background: task.labelBg, color: task.labelColor }"
                      >{{ task.label }}</span>
                      <span v-else class="flex-1"/>
                      <span
                        class="kb-prio-badge"
                        :class="`kb-prio-${task.priority}`"
                      >{{ priorityBadge[task.priority].label }}</span>
                    </div>

                    <!-- Title -->
                    <p class="kb-card-title">{{ task.title }}</p>

                    <!-- Description -->
                    <p v-if="task.description && !task.description.startsWith('<')" class="kb-card-desc">{{ task.description }}</p>

                    <!-- Subtask progress bar -->
                    <template v-if="store.subtaskProgress(task.id).total > 0">
                      <div class="kb-card-progress">
                        <div
                          class="kb-card-progress-fill"
                          :style="{ width: `${(store.subtaskProgress(task.id).done / store.subtaskProgress(task.id).total)*100}%` }"
                        />
                      </div>
                    </template>

                    <!-- Due date -->
                    <span v-if="task.due" class="kb-card-date">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ formatDate(task.due) }}
                    </span>

                    <!-- Footer -->
                    <div class="kb-card-footer">
                      <div class="flex items-center -space-x-1.5">
                        <div
                          v-for="m in task.assignees.slice(0,3)" :key="m.id"
                          class="kb-avatar-sm"
                          :style="{ background: m.color }"
                          :title="m.name"
                        >{{ m.initials }}</div>
                        <span
                          v-if="task.assignees.length > 3"
                          class="kb-avatar-sm text-[8px]"
                          style="background:var(--bg-surface-3);color:var(--text-muted)"
                        >+{{ task.assignees.length - 3 }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span v-if="store.subtaskProgress(task.id).total > 0" class="kb-card-meta">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                          {{ store.subtaskProgress(task.id).done }}/{{ store.subtaskProgress(task.id).total }}
                        </span>
                        <span v-if="task.comments" class="kb-card-meta">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {{ task.comments }}
                        </span>
                        <span v-if="task.files" class="kb-card-meta">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                          {{ task.files }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>

                <template #footer>
                  <div v-if="store.tasksByCol(col.id).length === 0" class="kb-col-empty">
                    <span class="block mb-2 opacity-20 flex items-center justify-center" v-html="iconOptions.find(i => i.id === col.icon)?.svg ?? col.icon" style="font-size:2rem;width:36px;height:36px;margin:0 auto"/>
                    <p class="text-[11px] font-semibold" style="color:var(--text-subtle)">No tasks</p>
                  </div>
                </template>
              </draggable>
            </div>
          </template>

        </draggable>
      </div><!-- /kanban scroll area -->

      <!-- ══ INLINE SIDE PANEL (pushes columns left) ══════════════════════ -->
      <Transition name="sp-slide">
        <div v-if="sidebarOpen" class="sp-panel h-full">
        <!-- Panel header — underline tabs -->
        <div class="sp-header">
          <div class="sp-tab-row">
            <button
              class="sp-tab"
              :class="{ 'sp-tab--active': activeTab === 'status' }"
              @click="activeTab = 'status'"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="5" height="14" rx="1.5"/><rect x="10.5" y="3" width="5" height="9" rx="1.5"/></svg>
              New Status
            </button>
            <button
              class="sp-tab"
              :class="{ 'sp-tab--active': activeTab === 'task' }"
              @click="activeTab = 'task'"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="14" height="14" rx="3"/><polyline points="7 10 9.5 12.5 13 8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              New Task
            </button>
            <button class="fp-close ml-auto" @click="sidebarOpen = false" title="Close">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
            </button>
          </div>
          <!-- Title row -->
          <div class="sp-title-row">
            <span class="sp-title-icon">✦</span>
            <span class="sp-title-text">{{ activeTab === 'task' ? 'Create New Task' : 'Create New Status' }}</span>
          </div>
        </div>

        <!-- Panel body -->
        <div class="fp-body">

          <!-- ── NEW TASK FORM ── -->
          <template v-if="activeTab === 'task'">
            <div class="fp-section-title">Task details</div>

            <div class="fp-field">
              <label class="fp-label">Title <span style="color:#ef4444">*</span></label>
              <input v-model="newTask.title" class="fp-input" placeholder="What needs to be done?" />
            </div>

            <div class="fp-field">
              <label class="fp-label">Description</label>
              <textarea v-model="newTask.description" class="fp-textarea" placeholder="Add more context…" rows="2"/>
            </div>

            <div class="fp-row">
              <div class="fp-field">
                <label class="fp-label">Status</label>
                <select v-model="newTask.status" class="fp-select">
                  <option v-for="col in store.columns" :key="col.id" :value="col.id">{{ col.title }}</option>
                </select>
              </div>
              <div class="fp-field">
                <label class="fp-label">Priority</label>
                <select v-model="newTask.priority" class="fp-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div class="fp-row">
              <div class="fp-field">
                <label class="fp-label">Sprint</label>
                <select v-model="newTask.sprint" class="fp-select">
                  <option value="">— Backlog</option>
                  <option v-for="sp in store.sprints" :key="sp.id" :value="sp.id">{{ sp.title }}</option>
                </select>
              </div>
              <div class="fp-field">
                <label class="fp-label">Label</label>
                <select v-model="newTask.label" class="fp-select">
                  <option value="">None</option>
                  <option v-for="lbl in Object.keys(store.labelPresets)" :key="lbl" :value="lbl">{{ lbl }}</option>
                </select>
              </div>
            </div>

            <div class="fp-field">
              <label class="fp-label">Due Date</label>
              <input v-model="newTask.due" type="date" class="fp-input"/>
            </div>

            <div class="fp-field">
              <label class="fp-label">Assignees</label>
              <div class="fp-assignees">
                <button
                  v-for="m in store.members" :key="m.id"
                  class="fp-assignee"
                  :class="{ 'fp-assignee--on': newTask.assigneeIds.includes(m.id) }"
                  :style="newTask.assigneeIds.includes(m.id)
                    ? `background:${m.color};border-color:${m.color};color:#fff`
                    : ''"
                  @click="toggleNewAssignee(m.id)"
                >
                  <span class="fp-avatar" :style="{ background: m.color }">{{ m.initials }}</span>
                  {{ m.name.split(' ')[0] }}
                  <svg v-if="newTask.assigneeIds.includes(m.id)" width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polyline points="4 10 8.5 14.5 16 7"/></svg>
                </button>
              </div>
            </div>

            <button class="fp-submit" :disabled="!newTask.title.trim()" @click="addTask">
              Create Task
            </button>
          </template>

          <!-- ── NEW STATUS FORM ── -->
          <template v-if="activeTab === 'status'">
            <div class="fp-section-title">Column details</div>

            <div class="fp-field">
              <label class="fp-label">Status name <span style="color:#ef4444">*</span></label>
              <input v-model="newStatus.title" class="fp-input" placeholder="e.g. In Review, Testing…"/>
            </div>

            <div class="fp-field">
              <label class="fp-label">Color</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <button
                  v-for="c in colorOptions" :key="c"
                  class="kb-color-swatch"
                  :style="{ background: c, outline: newStatus.color === c ? `2.5px solid ${c}` : 'none', outlineOffset: '2px', transform: newStatus.color === c ? 'scale(1.2)' : '' }"
                  @click="newStatus.color = c"
                />
              </div>
            </div>

            <div class="fp-field">
              <label class="fp-label">Icon</label>
              <div class="flex flex-wrap gap-1.5 mt-1">
                <button
                  v-for="ic in iconOptions" :key="ic.id"
                  class="kb-icon-swatch"
                  :class="{ 'kb-icon-swatch--active': newStatus.iconId === ic.id }"
                  :style="newStatus.iconId === ic.id ? `border-color:${newStatus.color};background:${newStatus.color}18;` : ''"
                  :title="ic.label"
                  @click="newStatus.iconId = ic.id"
                  v-html="ic.svg"
                />
              </div>
            </div>

            <!-- Preview -->
            <div class="fp-status-preview">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: newStatus.color }"/>
              <span class="flex items-center gap-1.5 text-sm font-semibold" style="color:var(--text-primary)">
                <span v-html="iconOptions.find(i => i.id === newStatus.iconId)?.svg" class="flex items-center" style="width:14px;height:14px"/>
                {{ newStatus.title || 'Column name' }}
              </span>
            </div>

            <!-- Existing columns list -->
            <div class="fp-field">
              <label class="fp-label" style="margin-bottom:6px">Existing columns</label>
              <div class="flex flex-col gap-1">
                <div v-for="col in store.columns" :key="col.id" class="kb-status-item">
                  <span class="w-2 h-2 rounded-full" :style="{ background: col.color }"/>
                  <span class="text-[12px] font-medium flex-1" style="color:var(--text-primary)">{{ col.title }}</span>
                  <span class="kb-col-count text-[10px]">{{ store.tasksByCol(col.id).length }}</span>
                </div>
              </div>
            </div>

            <button class="fp-submit" :disabled="!newStatus.title.trim()" @click="addStatus">
              Create Column
            </button>
          </template>

        </div><!-- /sp-body -->
        </div><!-- /sp-panel -->
      </Transition>

    </div><!-- /board body: flex flex-1 overflow-hidden -->


    <!-- ══ TASK DETAIL MODAL ══════════════════════════════════════════════ -->
    <TaskDetailModal v-model="modalOpen" :task-id="selectedTaskId"/>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useTaskStore } from '@/stores/task.store'
import type { Task, Column } from '@/stores/task.store'
import TaskDetailModal from './TaskDetailModal.vue'

const store = useTaskStore()

// ── Sidebar / panel ────────────────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const activeTab = ref<'task' | 'status'>('task')

// ── Member picker ────────────────────────────────────────────────────────────────────
const memberPickerOpen  = ref(false)
const memberSearch      = ref('')
const memberPickerRef   = ref<HTMLElement | null>(null)
const memberSearchInput = ref<HTMLInputElement | null>(null)
const filterMembers     = ref<string[]>([])          // ids to filter tasks by
const visibleAvatarCount = 4                          // how many to show before +N

const filteredPickerMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return store.members
  return store.members.filter(m => m.name.toLowerCase().includes(q))
})

function toggleFilterMember(id: string) {
  const idx = filterMembers.value.indexOf(id)
  if (idx >= 0) filterMembers.value.splice(idx, 1)
  else filterMembers.value.push(id)
}

async function openMemberPicker() {
  memberPickerOpen.value = true
  await nextTick()
  memberSearchInput.value?.focus()
}

function onDocClick(e: MouseEvent) {
  if (memberPickerRef.value && !memberPickerRef.value.contains(e.target as Node))
    memberPickerOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

// ── Modal ──────────────────────────────────────────────────────────────────────
const modalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)

function openTaskModal(id: string) {
  selectedTaskId.value = id
  modalOpen.value = true
}

// ── Columns drag ───────────────────────────────────────────────────────────────
const columnsModel = computed({
  get: () => store.columns,
  set: (val: Column[]) => store.reorderColumns(val),
})

// ── Task drag ──────────────────────────────────────────────────────────────────
function onTasksReorder(_colId: string, _newList: Task[]) {
  // vuedraggable v4: cross-column moves handled by @change
}

function onTaskChange(evt: { added?: { element: Task } }, toColId: string) {
  // Fires when a task is dropped into this column from another
  if (evt.added) {
    store.moveTask(evt.added.element.id, toColId)
  }
}

// ── Priority badge ──────────────────────────────────────────────────────────────────
const priorityBadge: Record<string, { cls: string; label: string }> = {
  low:    { cls: 'kb-prio-low',    label: 'Low' },
  medium: { cls: 'kb-prio-medium', label: 'Med' },
  high:   { cls: 'kb-prio-high',   label: 'High' },
  urgent: { cls: 'kb-prio-urgent', label: 'Urgent' },
}

// ── New Task form ──────────────────────────────────────────────────────────────
const newTask = ref({
  title: '', description: '', status: 'backlog',
  priority: 'medium' as 'low'|'medium'|'high'|'urgent',
  label: '', due: '', sprint: '', assigneeIds: [] as string[],
})

function toggleNewAssignee(id: string) {
  const idx = newTask.value.assigneeIds.indexOf(id)
  if (idx >= 0) newTask.value.assigneeIds.splice(idx, 1)
  else newTask.value.assigneeIds.push(id)
}

function addTask() {
  if (!newTask.value.title.trim()) return
  const assignees = store.members.filter(m => newTask.value.assigneeIds.includes(m.id))
  store.addTask({
    title: newTask.value.title,
    description: newTask.value.description,
    status: newTask.value.status,
    priority: newTask.value.priority,
    label: newTask.value.label,
    labelBg: '',
    labelColor: '',
    due: newTask.value.due,
    sprint: newTask.value.sprint,
    assignees,
  })
  newTask.value = { title: '', description: '', status: 'backlog', priority: 'medium', label: '', due: '', sprint: '', assigneeIds: [] }
  sidebarOpen.value = false
}

// ── New Status form ────────────────────────────────────────────────────────────────────
const colorOptions = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444','#64748b','#f97316','#84cc16']

type IconOption = { id: string; label: string; svg: string }
const S = (p: string) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
const iconOptions: IconOption[] = [
  { id: 'list',     label: 'List',       svg: S('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>') },
  { id: 'check',    label: 'Checkmark',  svg: S('<polyline points="20 6 9 17 4 12"/>') },
  { id: 'circle',   label: 'Circle',     svg: S('<circle cx="12" cy="12" r="9"/>') },
  { id: 'clock',    label: 'Clock',      svg: S('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>') },
  { id: 'star',     label: 'Star',       svg: S('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>') },
  { id: 'zap',      label: 'Zap',        svg: S('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>') },
  { id: 'flag',     label: 'Flag',       svg: S('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>') },
  { id: 'box',      label: 'Box',        svg: S('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>') },
  { id: 'layers',   label: 'Layers',     svg: S('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>') },
  { id: 'eye',      label: 'Review',     svg: S('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>') },
  { id: 'pause',    label: 'On Hold',    svg: S('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>') },
  { id: 'archive',  label: 'Archive',    svg: S('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>') },
  { id: 'rocket',   label: 'Launch',     svg: S('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>') },
  { id: 'target',   label: 'Target',     svg: S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>') },
  { id: 'tag',      label: 'Tag',        svg: S('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
]
const newStatus = ref({ title: '', color: '#6366f1', iconId: 'list' })

function addStatus() {
  if (!newStatus.value.title.trim()) return
  store.addColumn({ title: newStatus.value.title, icon: newStatus.value.iconId, color: newStatus.value.color })
  newStatus.value = { title: '', color: '#6366f1', iconId: 'list' }
  activeTab.value = 'task'
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
/* Backdrop fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Drag states */
:deep(.kb-col-ghost) {
  opacity: 0.4;
  border: 2px dashed #6366f1 !important;
  background: rgba(99,102,241,0.06) !important;
}
:deep(.kb-card-ghost) {
  opacity: 0.35;
  border: 1.5px dashed #6366f1 !important;
  background: rgba(99,102,241,0.05) !important;
}
:deep(.kb-card-chosen) {
  box-shadow: 0 16px 40px rgba(0,0,0,0.2) !important;
  transform: rotate(1.5deg) scale(1.02);
  z-index: 999;
}
</style>
