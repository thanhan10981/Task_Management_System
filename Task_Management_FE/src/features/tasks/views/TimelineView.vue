<template>
  <div class="board-page">

    <!-- ══ PAGE HEADER ══════════════════════════════════════════════ -->
    <div class="board-header">
      <div class="board-header-left">
        <div class="board-title-wrap">
          <svg class="board-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="18" rx="2"/><rect x="14" y="3" width="7" height="11" rx="2"/>
          </svg>
          <h1 class="board-title">Board</h1>
        </div>

        <!-- Sprint Selector -->
        <div class="sprint-selector" :class="{ open: sprintMenuOpen }">
          <button class="sprint-btn" @click="sprintMenuOpen = !sprintMenuOpen">
            <span class="sprint-dot" :style="{ background: currentSprint.color }"></span>
            <span class="sprint-btn-label">{{ currentSprint.name }}</span>
            <svg class="sprint-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="sprint-dropdown" v-if="sprintMenuOpen">
            <div class="sprint-dropdown-header">Sprint</div>
            <button
              v-for="s in sprints" :key="s.id"
              class="sprint-option"
              :class="{ active: s.id === selectedSprintId }"
              @click="selectSprint(s.id)"
            >
              <span class="sprint-opt-dot" :style="{ background: s.color }"></span>
              <span class="sprint-opt-label">{{ s.name }}</span>
              <span class="sprint-opt-dates">{{ s.dates }}</span>
              <svg v-if="s.id === selectedSprintId" class="sprint-opt-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="board-header-right">
        <!-- Group by -->
        <button class="toolbar-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
          Group
        </button>

        <div class="divider-v"></div>

        <!-- Invite -->
        <button class="invite-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Invite
        </button>

        <!-- Member avatars -->
        <div class="member-stack">
          <div
            v-for="(m, i) in currentSprint.members.slice(0, 4)"
            :key="i"
            class="member-avatar"
            :style="{ background: m.color, zIndex: 10 - i }"
            :title="m.name"
          >{{ m.initial }}</div>
          <div v-if="currentSprint.members.length > 4" class="member-avatar member-avatar--more">
            +{{ currentSprint.members.length - 4 }}
          </div>
        </div>

        <div class="divider-v"></div>

        <!-- Toggle sidebar -->
        <button class="toolbar-btn sidebar-toggle-btn" :class="{ active: sidebarOpen }" @click="sidebarOpen = !sidebarOpen" title="Task Groups">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ══ SPRINT STATS BAR ═══════════════════════════════════════════ -->
    <div class="sprint-stats-bar">
      <div class="sprint-stat" v-for="stat in sprintStats" :key="stat.label">
        <span class="sprint-stat-val" :style="{ color: stat.color }">{{ stat.value }}</span>
        <span class="sprint-stat-label">{{ stat.label }}</span>
      </div>
      <div class="sprint-progress-wrap">
        <span class="sprint-progress-label">Sprint progress</span>
        <div class="sprint-progress-track">
          <div class="sprint-progress-fill" :style="{ width: sprintProgress + '%' }"></div>
        </div>
        <span class="sprint-progress-pct">{{ sprintProgress }}%</span>
      </div>
    </div>

    <!-- ══ BOARD + SIDEBAR WRAPPER ════════════════════════════════════ -->
    <div class="board-workspace">

    <!-- ══ LEFT SIDEBAR ════════════════════════════════════════════════ -->
    <Transition name="sidebar">
      <aside v-if="sidebarOpen" class="task-sidebar">
        <!-- Sidebar header -->
        <div class="sb-header">
          <span class="sb-title">Task Groups</span>
          <button class="sb-close" @click="sidebarOpen = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Group list -->
        <div class="sb-body">
          <div
            v-for="group in taskGroups"
            :key="group.id"
            class="sb-group"
          >
            <!-- Group row -->
            <div class="sb-group-row" @click="toggleSidebarGroup(group.id)">
              <button class="sb-toggle">
                <svg v-if="group.expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg>
              </button>
              <span class="sb-group-icon" :style="{ background: group.color }">
                {{ group.expanded ? '−' : '+' }}
              </span>
              <span class="sb-group-name">{{ group.name }}</span>
              <div class="sb-group-members">
                <div
                  v-for="(m, mi) in group.members.slice(0, 3)"
                  :key="mi"
                  class="sb-avatar"
                  :style="{ background: m.color }"
                  :title="m.name"
                >{{ m.initial }}</div>
              </div>
              <button class="sb-more" @click.stop>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
              </button>
            </div>

            <!-- Task list -->
            <Transition name="sb-tasks">
              <div v-if="group.expanded" class="sb-tasks">
                <div
                  v-for="task in group.tasks"
                  :key="task.id"
                  class="sb-task-row"
                  @click="scrollToTask(task.id)"
                >
                  <span class="sb-task-status-dot" :style="{ background: statusColor(task.status) }"></span>
                  <span class="sb-task-name">{{ task.name }}</span>
                  <span class="sb-task-priority" :class="`sbp-${task.priority}`">{{ priorityIcon(task.priority) }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </aside>
    </Transition>

    <!-- ══ BOARD COLUMNS ═══════════════════════════════════════════════ -->
    <div class="board-body" @click.self="closeAllMenus">
      <div
        v-for="col in columns"
        :key="col.id"
        class="board-col"
        :class="[`board-col--${col.id}`, { 'col-drag-over': draggingOverCol === col.id }]"
      >
        <!-- Column header -->
        <div class="col-header">
          <div class="col-header-left">
            <span class="col-status-dot" :style="{ background: col.color }"></span>
            <span class="col-title">{{ col.title }}</span>
            <span class="col-count">{{ columnList(col.id).length }}</span>
          </div>
          <div class="col-header-right">
            <button class="col-action-btn" @click="addTask(col.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button class="col-action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- ── vuedraggable list ── -->
        <div class="col-body">
          <draggable
            :list="columnList(col.id)"
            group="tasks"
            item-key="id"
            class="cards-list"
            ghost-class="card-ghost"
            chosen-class="card-chosen"
            drag-class="card-drag"
            :animation="220"
            @start="onDragStart"
            @end="onDragEnd"
            @change="(evt: any) => onColChange(evt, col.id)"
          >
            <template #item="{ element: task }">
              <div
                class="task-card"
                :class="`priority-${task.priority}`"
                @click="openTask(task)"
              >
                <!-- Card top row: priority + options -->
                <div class="card-top">
                  <span class="priority-badge" :class="`priority-badge--${task.priority}`">
                    <span class="priority-icon">{{ priorityIcon(task.priority) }}</span>
                    {{ task.priority }}
                  </span>
                  <div class="card-actions">
                    <button class="card-menu-btn" @click.stop="toggleCardMenu(task.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                      </svg>
                    </button>
                    <!-- Card dropdown -->
                    <div class="card-dropdown" v-if="activeCardMenu === task.id" @click.stop>
                      <button class="card-dropdown-item" @click="moveTask(task, 'todo')">
                        <span class="dd-dot dd-dot--todo"></span> To Do
                      </button>
                      <button class="card-dropdown-item" @click="moveTask(task, 'inprogress')">
                        <span class="dd-dot dd-dot--inprogress"></span> In Progress
                      </button>
                      <button class="card-dropdown-item" @click="moveTask(task, 'done')">
                        <span class="dd-dot dd-dot--done"></span> Done
                      </button>
                      <div class="card-dropdown-divider"></div>
                      <button class="card-dropdown-item card-dropdown-item--danger" @click="deleteTask(task.id)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Task title -->
                <p class="card-title">{{ task.name }}</p>

                <!-- Description snippet -->
                <p v-if="task.desc" class="card-desc">{{ task.desc }}</p>

                <!-- Tags -->
                <div v-if="task.tags && task.tags.length" class="card-tags">
                  <span v-for="tag in task.tags" :key="tag" class="card-tag">{{ tag }}</span>
                </div>

                <!-- Progress bar -->
                <div v-if="task.progress !== undefined" class="card-progress">
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: task.progress + '%', background: col.color }"></div>
                  </div>
                  <span class="progress-pct">{{ task.progress }}%</span>
                </div>

                <!-- Card footer -->
                <div class="card-footer">
                  <div class="card-meta">
                    <span class="card-due" :class="{ overdue: isOverdue(task.due) }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ formatDue(task.due) }}
                    </span>
                    <span v-if="task.subtasks" class="card-subtasks">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                      {{ task.subtasks.done }}/{{ task.subtasks.total }}
                    </span>
                  </div>
                  <div class="card-assignees">
                    <div
                      v-for="(m, i) in task.assignees"
                      :key="i"
                      class="assignee-avatar"
                      :style="{ background: m.color, zIndex: 10 - Number(i) }"
                      :title="m.name"
                    >{{ m.initial }}</div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Empty state slot -->
            <template #footer>
              <div v-if="columnList(col.id).length === 0 && !isDragging" class="col-empty">
                <div class="col-empty-icon">{{ col.emptyIcon }}</div>
                <p class="col-empty-text">{{ col.emptyText }}</p>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Add task button -->
        <button class="add-task-btn" @click="addTask(col.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Task
        </button>
      </div>
    </div>

    </div><!-- end board-workspace -->

    <!-- ══ ADD TASK MODAL ═══════════════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">New Task</h2>
            <button class="modal-close" @click="showAddModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="modal-label">Task name</label>
            <input v-model="newTask.name" class="modal-input" placeholder="e.g. Design landing page" @keydown.enter="submitNewTask"/>

            <label class="modal-label">Description <span class="optional">(optional)</span></label>
            <textarea v-model="newTask.desc" class="modal-textarea" placeholder="Add more details…" rows="3"></textarea>

            <div class="modal-row">
              <div class="modal-field">
                <label class="modal-label">Status</label>
                <select v-model="newTask.status" class="modal-select">
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div class="modal-field">
                <label class="modal-label">Priority</label>
                <select v-model="newTask.priority" class="modal-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div class="modal-row">
              <div class="modal-field">
                <label class="modal-label">Due date</label>
                <input v-model="newTask.due" type="date" class="modal-select"/>
              </div>
              <div class="modal-field">
                <label class="modal-label">Assignee</label>
                <select v-model="newTask.assigneeIdx" class="modal-select">
                  <option :value="-1">Unassigned</option>
                  <option v-for="(m,i) in currentSprint.members" :key="i" :value="i">{{ m.name }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-cancel" @click="showAddModal = false">Cancel</button>
            <button class="modal-submit" @click="submitNewTask" :disabled="!newTask.name.trim()">Create Task</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Overlay to close menus -->
    <div v-if="sprintMenuOpen || activeCardMenu" class="global-overlay" @click="closeAllMenus"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'

/* ── Types ─────────────────────────────────────────────────────── */
interface Member { initial: string; name: string; color: string }
interface Subtasks { done: number; total: number }
interface Task {
  id: string
  name: string
  desc?: string
  status: 'todo' | 'inprogress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress?: number
  due: string
  assignees: Member[]
  tags?: string[]
  subtasks?: Subtasks
}
interface Sprint {
  id: string
  name: string
  color: string
  dates: string
  members: Member[]
}

/* ── Columns (hardcoded 3) ─────────────────────────────────────── */
const columns = [
  { id: 'todo',       title: 'To Do',       color: '#6366f1', emptyIcon: '📋', emptyText: 'No tasks here yet. Add one!' },
  { id: 'inprogress', title: 'In Progress',  color: '#f59e0b', emptyIcon: '🚧', emptyText: 'Nothing in progress. Start a task!' },
  { id: 'done',       title: 'Done',         color: '#10b981', emptyIcon: '🎉', emptyText: 'No completed tasks yet.' },
]

/* ── Members ───────────────────────────────────────────────────── */
const allMembers: Member[] = [
  { initial: 'A', name: 'Alice', color: '#6366f1' },
  { initial: 'B', name: 'Bob',   color: '#ec4899' },
  { initial: 'C', name: 'Carol', color: '#f59e0b' },
  { initial: 'D', name: 'David', color: '#10b981' },
  { initial: 'E', name: 'Eva',   color: '#0ea5e9' },
]

/* ── Sprints ────────────────────────────────────────────────────── */
const sprints = ref<Sprint[]>([
  { id: 's1', name: 'Sprint 1', color: '#10b981', dates: 'Apr 1 – Apr 14',  members: allMembers.slice(0, 3) },
  { id: 's2', name: 'Sprint 2', color: '#6366f1', dates: 'Apr 15 – Apr 28', members: allMembers.slice(0, 4) },
  { id: 's3', name: 'Sprint 3', color: '#f59e0b', dates: 'Apr 29 – May 12', members: allMembers },
  { id: 's4', name: 'Sprint 4', color: '#ec4899', dates: 'May 13 – May 26', members: allMembers.slice(1) },
  { id: 's5', name: 'Sprint 5', color: '#0ea5e9', dates: 'May 27 – Jun 9',  members: allMembers.slice(0, 5) },
])

const selectedSprintId = ref('s2')
const sprintMenuOpen = ref(false)
const currentSprint = computed(() => sprints.value.find(s => s.id === selectedSprintId.value)!)

function selectSprint(id: string) {
  selectedSprintId.value = id
  sprintMenuOpen.value = false
}

/* ── Tasks per sprint ───────────────────────────────────────────── */
function ds(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const tasksBySprintId = ref<Record<string, Task[]>>({
  s1: [
    { id: 's1-1', name: 'Market Research',     status: 'done',       priority: 'high',   due: ds(-5),  assignees: [allMembers[0]], tags: ['research'], subtasks: { done: 3, total: 3 } },
    { id: 's1-2', name: 'Competitor Analysis', status: 'done',       priority: 'medium', due: ds(-3),  assignees: [allMembers[1]], tags: ['analysis'] },
    { id: 's1-3', name: 'User Surveys',        status: 'inprogress', priority: 'high',   due: ds(2),   assignees: [allMembers[0], allMembers[2]], progress: 72, subtasks: { done: 4, total: 6 } },
    { id: 's1-4', name: 'Persona Creation',    status: 'todo',       priority: 'low',    due: ds(5),   assignees: [allMembers[2]] },
  ],
  s2: [
    { id: 's2-1',  name: 'Profile Design',        status: 'todo',       priority: 'medium', due: ds(3),  assignees: [allMembers[0]], tags: ['design', 'ux'], subtasks: { done: 1, total: 4 } },
    { id: 's2-2',  name: 'Navigation Menu',        status: 'todo',       priority: 'low',    due: ds(5),  assignees: [allMembers[1]], tags: ['ui'] },
    { id: 's2-3',  name: 'Login Flow',             status: 'todo',       priority: 'urgent', due: ds(1),  assignees: [allMembers[0], allMembers[2]], subtasks: { done: 0, total: 3 } },
    { id: 's2-4',  name: 'Draw Sketches',          status: 'todo',       priority: 'high',   due: ds(4),  assignees: [allMembers[1]], tags: ['design'] },
    { id: 's2-5',  name: 'Settings Page',          status: 'inprogress', priority: 'high',   due: ds(2),  assignees: [allMembers[2], allMembers[0]], tags: ['ui', 'ux'], progress: 65, subtasks: { done: 3, total: 5 } },
    { id: 's2-6',  name: 'Build Wireframe',        status: 'inprogress', priority: 'urgent', due: ds(0),  assignees: [allMembers[1]], desc: 'Complete all screens for wireframing phase', progress: 40, subtasks: { done: 2, total: 5 } },
    { id: 's2-7',  name: 'User Interface Design',  status: 'inprogress', priority: 'medium', due: ds(6),  assignees: [allMembers[2], allMembers[1]], tags: ['ui'], progress: 15 },
    { id: 's2-8',  name: 'Homepage Redesign',      status: 'done',       priority: 'high',   due: ds(-2), assignees: [allMembers[0], allMembers[2]], subtasks: { done: 4, total: 4 } },
    { id: 's2-9',  name: 'Integrate API Flows',    status: 'done',       priority: 'medium', due: ds(-1), assignees: [allMembers[1]], tags: ['dev'] },
    { id: 's2-10', name: 'Services Module',        status: 'done',       priority: 'low',    due: ds(-3), assignees: [allMembers[2]], desc: 'Backend service layer complete' },
  ],
  s3: [
    { id: 's3-1', name: 'Backend Architecture', status: 'todo',       priority: 'urgent', due: ds(7),  assignees: [allMembers[0], allMembers[3]], tags: ['dev'] },
    { id: 's3-2', name: 'API Design',           status: 'inprogress', priority: 'high',   due: ds(4),  assignees: [allMembers[3]], progress: 30, subtasks: { done: 1, total: 5 } },
    { id: 's3-3', name: 'Database Schema',      status: 'done',       priority: 'high',   due: ds(-1), assignees: [allMembers[0]] },
  ],
  s4: [
    { id: 's4-1', name: 'QA Testing Phase',  status: 'todo',       priority: 'high',   due: ds(10), assignees: [allMembers[1], allMembers[4]] },
    { id: 's4-2', name: 'Bug Fixing Sprint', status: 'inprogress', priority: 'urgent', due: ds(5),  assignees: [allMembers[0]], progress: 55, subtasks: { done: 3, total: 7 } },
    { id: 's4-3', name: 'Code Review',       status: 'done',       priority: 'medium', due: ds(-2), assignees: [allMembers[2]] },
  ],
  s5: [
    { id: 's5-1', name: 'Deploy to Production', status: 'todo',       priority: 'urgent', due: ds(14), assignees: allMembers },
    { id: 's5-2', name: 'Performance Audit',    status: 'inprogress', priority: 'high',   due: ds(8),  assignees: [allMembers[0], allMembers[1]], progress: 20 },
    { id: 's5-3', name: 'Documentation',        status: 'done',       priority: 'low',    due: ds(-1), assignees: [allMembers[4]] },
  ],
})

/* ── Derived lists per column ───────────────────────────────────── */
// vuedraggable mutates the array in place on drop,
// so we use computed arrays that filter by status + search.
// We hand these arrays directly to <draggable :list="...">
// and let vuedraggable update them; we reconcile status
// via the @change event.

function columnList(colId: string): Task[] {
  const all = tasksBySprintId.value[selectedSprintId.value] ?? []
  return all.filter(t => t.status === colId)
}

/* ── Sprint Stats ───────────────────────────────────────────────── */
const currentTasks = computed(() => tasksBySprintId.value[selectedSprintId.value] ?? [])

const sprintStats = computed(() => {
  const tasks = currentTasks.value
  return [
    { label: 'To Do',       value: tasks.filter(t => t.status === 'todo').length,       color: '#6366f1' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'inprogress').length, color: '#f59e0b' },
    { label: 'Done',        value: tasks.filter(t => t.status === 'done').length,       color: '#10b981' },
    { label: 'Urgent',      value: tasks.filter(t => t.priority === 'urgent').length,   color: '#ef4444' },
  ]
})
const sprintProgress = computed(() => {
  const tasks = currentTasks.value
  if (!tasks.length) return 0
  return Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
})

/* ── Right Sidebar ──────────────────────────────────────────────── */
const sidebarOpen = ref(true)

// Group definition for sidebar (static per sprint)
interface SidebarGroup {
  id: string
  name: string
  color: string
  members: Member[]
  expanded: boolean
  tasks: Task[]
}

const sidebarGroupExpanded = ref<Record<string, boolean>>({})

const taskGroups = computed<SidebarGroup[]>(() => {
  const tasks = tasksBySprintId.value[selectedSprintId.value] ?? []
  // Build groups by priority buckets (or tags if exists)
  const groupDefs = [
    { id: 'ux',     name: 'UX Research',       color: '#6366f1', tags: ['ux', 'design', 'research'] },
    { id: 'dev',    name: 'Development',        color: '#0ea5e9', tags: ['dev'] },
    { id: 'ui',     name: 'UI Design',          color: '#8b5cf6', tags: ['ui'] },
    { id: 'other',  name: 'General',            color: '#f59e0b', tags: [] },
  ]
  return groupDefs.map(gd => {
    const matched = tasks.filter(t =>
      gd.tags.length === 0
        ? !(t.tags?.some(tag => groupDefs.filter(g => g.id !== 'other').flatMap(g => g.tags).includes(tag)))
        : t.tags?.some(tag => gd.tags.includes(tag))
    )
    // Collect unique assignees across these tasks
    const memberMap = new Map<string, Member>()
    matched.forEach(t => t.assignees.forEach(m => memberMap.set(m.initial, m)))
    return {
      id: gd.id,
      name: gd.name,
      color: gd.color,
      members: [...memberMap.values()],
      expanded: sidebarGroupExpanded.value[gd.id] ?? true,
      tasks: matched,
    }
  }).filter(g => g.tasks.length > 0)
})

function toggleSidebarGroup(id: string) {
  sidebarGroupExpanded.value[id] = !(sidebarGroupExpanded.value[id] ?? true)
}

function statusColor(status: string): string {
  return ({ todo: '#6366f1', inprogress: '#f59e0b', done: '#10b981' } as Record<string,string>)[status] ?? '#94a3b8'
}

function scrollToTask(_id: string) {
  // future: highlight card on board
}

/* ── Drag & Drop (vuedraggable) ──────────────────────────────────── */
const isDragging = ref(false)
const draggingOverCol = ref<string | null>(null)

function onDragStart() { isDragging.value = true }
function onDragEnd()   { isDragging.value = false; draggingOverCol.value = null }

/**
 * Called by vuedraggable when an item is added to this column via drag.
 * We update the task's status to match the target column.
 */
function onColChange(evt: any, colId: string) {
  if (evt.added) {
    const task = evt.added.element as Task
    const arr = tasksBySprintId.value[selectedSprintId.value]

    // Find the task in the master list and update status
    const master = arr.find(t => t.id === task.id)
    if (master) {
      master.status = colId as Task['status']
      // Auto-set progress when moved into "In Progress"
      if (colId === 'inprogress' && master.progress === undefined) master.progress = 0
      // Clear progress when moved out of "In Progress"
      if (colId !== 'inprogress') master.progress = undefined
    }
  }
}

/* ── Card menu ──────────────────────────────────────────────────── */
const activeCardMenu = ref<string | null>(null)
function toggleCardMenu(id: string) {
  activeCardMenu.value = activeCardMenu.value === id ? null : id
}
function moveTask(task: Task, status: Task['status']) {
  const arr = tasksBySprintId.value[selectedSprintId.value]
  const master = arr.find(t => t.id === task.id)
  if (master) {
    master.status = status
    if (status === 'inprogress' && master.progress === undefined) master.progress = 0
    if (status !== 'inprogress') master.progress = undefined
  }
  activeCardMenu.value = null
}
function deleteTask(id: string) {
  const arr = tasksBySprintId.value[selectedSprintId.value]
  const idx = arr.findIndex(t => t.id === id)
  if (idx !== -1) arr.splice(idx, 1)
  activeCardMenu.value = null
}
function openTask(_task: Task) { /* future: open detail panel */ }

/* ── Add task modal ─────────────────────────────────────────────── */
const showAddModal  = ref(false)
const newTask = ref({ name: '', desc: '', status: 'todo', priority: 'medium', due: '', assigneeIdx: -1 })

function addTask(colId: string) {
  newTask.value = { name: '', desc: '', status: colId, priority: 'medium', due: '', assigneeIdx: -1 }
  showAddModal.value = true
}
function submitNewTask() {
  if (!newTask.value.name.trim()) return
  const m = newTask.value.assigneeIdx >= 0 ? [currentSprint.value.members[newTask.value.assigneeIdx]] : []
  const task: Task = {
    id: `${selectedSprintId.value}-${Date.now()}`,
    name: newTask.value.name.trim(),
    desc: newTask.value.desc || undefined,
    status: newTask.value.status as Task['status'],
    priority: newTask.value.priority as Task['priority'],
    due: newTask.value.due || ds(7),
    assignees: m,
    progress: newTask.value.status === 'inprogress' ? 0 : undefined,
  }
  tasksBySprintId.value[selectedSprintId.value].push(task)
  showAddModal.value = false
}

/* ── Helpers ────────────────────────────────────────────────────── */
function priorityIcon(p: string) {
  return ({ low: '▽', medium: '◈', high: '▲', urgent: '⚡' } as Record<string,string>)[p] ?? '◈'
}
function isOverdue(due: string) { return due ? new Date(due) < new Date() : false }
function formatDue(due: string): string {
  if (!due) return ''
  const diff = Math.round((new Date(due).getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return diff < 0 ? `${Math.abs(diff)}d ago` : `${diff}d left`
}
function closeAllMenus() { sprintMenuOpen.value = false; activeCardMenu.value = null }
</script>

<style scoped>
* { box-sizing: border-box; }

/* ══ Page ═══════════════════════════════════════════════════════ */
.board-page {
  display: flex; flex-direction: column;
  height: calc(100vh - 64px);
  background: var(--bg-app);
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}

/* ══ Workspace (board + sidebar) ════════════════════════════════ */
.board-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
.board-workspace > .board-body {
  flex: 1;
  min-width: 0;
}

/* ══ Header ══════════════════════════════════════════════════════ */
.board-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 60px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-base);
  flex-shrink: 0; gap: 12px;
}
.board-header-left  { display: flex; align-items: center; gap: 14px; }
.board-header-right { display: flex; align-items: center; gap: 10px; }

.board-title-wrap { display: flex; align-items: center; gap: 8px; }
.board-title-icon { width: 20px; height: 20px; color: #6366f1; }
.board-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0; letter-spacing: -0.02em; }

/* ── Sprint Selector ── */
.sprint-selector { position: relative; }
.sprint-btn {
  display: flex; align-items: center; gap: 7px;
  height: 34px; padding: 0 12px; border-radius: 10px;
  border: 1.5px solid var(--border-medium);
  background: var(--bg-surface); color: var(--text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.sprint-btn:hover, .sprint-selector.open .sprint-btn {
  border-color: #6366f1; background: #eef2ff; color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.sprint-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.sprint-chevron { width: 14px; height: 14px; transition: transform 0.2s; }
.sprint-selector.open .sprint-chevron { transform: rotate(180deg); }

.sprint-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0;
  min-width: 230px; background: var(--bg-surface);
  border: 1px solid var(--border-medium); border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.14); z-index: 200;
  padding: 6px; animation: dropIn 0.18s ease;
}
@keyframes dropIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }

.sprint-dropdown-header {
  font-size: 10px; font-weight: 700; color: var(--text-subtle);
  letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 10px 4px;
}
.sprint-option {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 10px; border-radius: 8px; border: none;
  background: transparent; color: var(--text-primary);
  font-size: 13px; cursor: pointer; text-align: left; transition: background 0.12s;
}
.sprint-option:hover { background: var(--bg-hover); }
.sprint-option.active { background: #eef2ff; color: #6366f1; }
.sprint-opt-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.sprint-opt-label { flex: 1; font-weight: 600; }
.sprint-opt-dates { font-size: 11px; color: var(--text-muted); }
.sprint-opt-check { width: 14px; height: 14px; color: #6366f1; flex-shrink: 0; }

/* ── Toolbar ── */
.board-search {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px; border-radius: 10px;
  border: 1.5px solid var(--border-medium); background: var(--bg-surface-2);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.board-search.focused { border-color: #6366f1; background: var(--bg-surface); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.search-icon { width: 14px; height: 14px; color: var(--text-muted); flex-shrink: 0; }
.search-input { border: none; background: transparent; outline: none; font-size: 13px; color: var(--text-primary); width: 160px; }
.search-input::placeholder { color: var(--text-subtle); }
.search-kbd { font-size: 10px; color: var(--text-subtle); border: 1px solid var(--border-medium); border-radius: 4px; padding: 1px 5px; font-family: monospace; }

.toolbar-btn {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px; border-radius: 10px;
  border: 1.5px solid var(--border-medium); background: var(--bg-surface);
  color: var(--text-secondary); font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.toolbar-btn svg { width: 14px; height: 14px; }
.toolbar-btn:hover, .toolbar-btn.active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.filter-badge { background: #6366f1; color: #fff; font-size: 10px; border-radius: 99px; padding: 0 5px; }

.divider-v { width: 1px; height: 28px; background: var(--border-medium); flex-shrink: 0; }

.invite-btn {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer;
  box-shadow: 0 3px 12px rgba(99,102,241,0.3);
  transition: opacity 0.15s, transform 0.15s;
}
.invite-btn svg { width: 14px; height: 14px; }
.invite-btn:hover { opacity: 0.88; transform: translateY(-1px); }

.member-stack { display: flex; align-items: center; }
.member-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 11px; font-weight: 700;
  border: 2px solid var(--bg-surface); margin-left: -8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.14); cursor: pointer;
  transition: transform 0.15s;
}
.member-avatar:first-child { margin-left: 0; }
.member-avatar:hover { transform: translateY(-2px); z-index: 99 !important; }
.member-avatar--more { background: var(--bg-surface-3); color: var(--text-muted); font-size: 10px; }

/* ══ Sprint Stats Bar ════════════════════════════════════════════ */
.sprint-stats-bar {
  display: flex; align-items: center; gap: 24px;
  padding: 8px 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-base);
  flex-shrink: 0;
}
.sprint-stat { display: flex; align-items: center; gap: 6px; }
.sprint-stat-val  { font-size: 20px; font-weight: 800; line-height: 1; }
.sprint-stat-label { font-size: 11px; color: var(--text-muted); font-weight: 500; }

.sprint-progress-wrap { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.sprint-progress-label { font-size: 11px; color: var(--text-muted); font-weight: 600; white-space: nowrap; }
.sprint-progress-track { width: 120px; height: 6px; background: var(--bg-surface-3); border-radius: 99px; overflow: hidden; }
.sprint-progress-fill  { height: 100%; background: linear-gradient(90deg, #6366f1, #10b981); border-radius: 99px; transition: width 0.6s ease; }
.sprint-progress-pct   { font-size: 12px; font-weight: 700; color: var(--text-primary); min-width: 36px; }

/* ══ Board body ══════════════════════════════════════════════════ */
.board-body {
  display: flex; gap: 16px; padding: 20px 24px;
  flex: 1; overflow-x: auto; overflow-y: hidden;
}
.board-body::-webkit-scrollbar { height: 6px; }
.board-body::-webkit-scrollbar-track { background: var(--scrollbar-track); border-radius: 999px; }
.board-body::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 999px; }

/* ── Column ── */
.board-col {
  display: flex; flex-direction: column;
  flex: 1; min-width: 280px; max-width: 340px;
  background: var(--bg-surface-2);
  border: 1.5px solid var(--border-base);
  border-radius: 18px; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.board-col.col-drag-over {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18), inset 0 0 0 2px rgba(99,102,241,0.1);
}
.board-col--todo       { --col-accent: #6366f1; }
.board-col--inprogress { --col-accent: #f59e0b; }
.board-col--done       { --col-accent: #10b981; }

.board-col::before {
  content: ''; display: block; height: 3px;
  border-radius: 18px 18px 0 0;
  background: var(--col-accent); flex-shrink: 0;
}

/* ── Column header ── */
.col-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 10px;
  flex-shrink: 0;
}
.col-header-left { display: flex; align-items: center; gap: 8px; }
.col-status-dot  { width: 10px; height: 10px; border-radius: 50%; }
.col-title  { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.col-count  { background: var(--bg-surface-3); color: var(--text-muted); font-size: 11px; font-weight: 700; border-radius: 99px; padding: 1px 7px; }
.col-header-right { display: flex; gap: 2px; }
.col-action-btn {
  width: 26px; height: 26px; border-radius: 7px; border: none;
  background: transparent; color: var(--text-subtle); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.col-action-btn svg { width: 14px; height: 14px; }
.col-action-btn:hover { background: var(--bg-surface-3); color: var(--text-primary); }

/* ── Column body ── */
.col-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 0 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
.col-body::-webkit-scrollbar { width: 4px; }
.col-body::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 99px; }

/* vuedraggable wrapper */
.cards-list {
  display: flex; flex-direction: column; gap: 10px;
  padding: 4px 0 8px; min-height: 60px;
}

/* ── Task card ── */
.task-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-soft);
  border-radius: 14px; padding: 14px;
  cursor: grab; position: relative;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  user-select: none;
}
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.1);
  border-color: var(--border-medium);
}
.task-card:active { cursor: grabbing; }

/* SortableJS ghost/chosen/drag classes */
.card-ghost {
  opacity: 0.35;
  background: var(--bg-surface-3) !important;
  border: 2px dashed #6366f1 !important;
  border-radius: 14px;
  box-shadow: none !important;
}
.card-chosen {
  box-shadow: 0 12px 36px rgba(99,102,241,0.25) !important;
  border-color: #6366f1 !important;
  transform: scale(1.02);
}
.card-drag {
  opacity: 0.9;
  transform: rotate(2deg) scale(1.03);
  box-shadow: 0 20px 50px rgba(0,0,0,0.22) !important;
  cursor: grabbing !important;
}

/* Priority border */
.task-card.priority-urgent { border-left: 3px solid #ef4444; }
.task-card.priority-high   { border-left: 3px solid #f97316; }
.task-card.priority-medium { border-left: 3px solid #f59e0b; }
.task-card.priority-low    { border-left: 3px solid #6366f1; }

/* ── Card top ── */
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.card-actions { position: relative; flex-shrink: 0; }

.priority-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 99px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
}
.priority-badge--urgent { background: #fee2e2; color: #ef4444; }
.priority-badge--high   { background: #ffedd5; color: #f97316; }
.priority-badge--medium { background: #fef9c3; color: #ca8a04; }
.priority-badge--low    { background: #eef2ff; color: #6366f1; }
.priority-icon { font-size: 9px; }

.card-menu-btn {
  width: 26px; height: 26px; border-radius: 7px; border: none;
  background: transparent; color: var(--text-subtle); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s; opacity: 0;
}
.card-menu-btn svg { width: 14px; height: 14px; }
.task-card:hover .card-menu-btn { opacity: 1; }
.card-menu-btn:hover { background: var(--bg-surface-3); color: var(--text-primary); }

.card-dropdown {
  position: absolute; right: 0; top: 100%; z-index: 100;
  background: var(--bg-surface); border: 1px solid var(--border-medium);
  border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.14);
  padding: 6px; min-width: 160px; animation: dropIn 0.15s ease;
}
.card-dropdown-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 10px; border-radius: 7px; border: none;
  background: transparent; color: var(--text-primary);
  font-size: 12.5px; cursor: pointer; transition: background 0.1s;
}
.card-dropdown-item:hover { background: var(--bg-hover); }
.card-dropdown-item--danger { color: #ef4444; }
.card-dropdown-item--danger:hover { background: #fee2e2; }
.card-dropdown-item svg { width: 13px; height: 13px; }
.card-dropdown-divider { height: 1px; background: var(--border-base); margin: 4px 0; }
.dd-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dd-dot--todo      { background: #6366f1; }
.dd-dot--inprogress { background: #f59e0b; }
.dd-dot--done      { background: #10b981; }

/* ── Card content ── */
.card-title {
  font-size: 13.5px; font-weight: 700; color: var(--text-primary);
  margin: 0 0 4px; line-height: 1.45;
}
.card-desc {
  font-size: 12px; color: var(--text-muted); margin: 0 0 8px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.card-tag {
  background: var(--bg-surface-3); color: var(--text-muted);
  font-size: 10px; font-weight: 600; padding: 2px 7px;
  border-radius: 99px; border: 1px solid var(--border-base);
}

/* ── Progress bar ── */
.card-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.progress-track { flex: 1; height: 5px; background: var(--bg-surface-3); border-radius: 99px; overflow: hidden; }
.progress-fill  { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
.progress-pct   { font-size: 10.5px; font-weight: 700; color: var(--text-muted); min-width: 28px; text-align: right; }

/* ── Card footer ── */
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.card-meta   { display: flex; align-items: center; gap: 10px; }
.card-due {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--text-muted);
}
.card-due svg { width: 11px; height: 11px; }
.card-due.overdue { color: #ef4444; }
.card-subtasks { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-muted); }
.card-subtasks svg { width: 11px; height: 11px; }
.card-assignees { display: flex; align-items: center; }
.assignee-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 9px; font-weight: 700;
  border: 2px solid var(--bg-surface); margin-left: -6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.14);
}
.card-assignees .assignee-avatar:first-child { margin-left: 0; }

/* ── Empty state ── */
.col-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 16px; text-align: center;
}
.col-empty-icon { font-size: 28px; margin-bottom: 8px; }
.col-empty-text { font-size: 12px; color: var(--text-subtle); line-height: 1.5; }

/* ── Add task button ── */
.add-task-btn {
  display: flex; align-items: center; gap: 6px;
  width: calc(100% - 24px); margin: 0 12px 12px;
  padding: 9px 12px; border-radius: 10px;
  border: 1.5px dashed var(--border-medium); background: transparent;
  color: var(--text-muted); font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.add-task-btn svg { width: 14px; height: 14px; }
.add-task-btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; border-style: solid; }

/* ══ Modal ════════════════════════════════════════════════════════ */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(15,23,42,0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--bg-surface); border-radius: 20px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.3); width: 100%; max-width: 500px;
  overflow: hidden; border: 1px solid var(--border-medium);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border-base);
}
.modal-title { font-size: 17px; font-weight: 800; color: var(--text-heading); margin: 0; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: var(--bg-surface-3); color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.modal-close svg { width: 14px; height: 14px; }
.modal-close:hover { background: #fee2e2; color: #ef4444; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-label { display: block; font-size: 11.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
.optional { text-transform: none; font-weight: 400; color: var(--text-subtle); }
.modal-input, .modal-textarea, .modal-select {
  width: 100%; border-radius: 10px; border: 1.5px solid var(--border-medium);
  background: var(--bg-surface-2); color: var(--text-primary);
  font-size: 13px; padding: 9px 12px; outline: none; font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.modal-input:focus, .modal-textarea:focus, .modal-select:focus {
  border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}
.modal-textarea { resize: vertical; min-height: 80px; }
.modal-select   { appearance: none; cursor: pointer; }
.modal-row  { display: flex; gap: 12px; }
.modal-field { flex: 1; }
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px 20px; border-top: 1px solid var(--border-base);
}
.modal-cancel {
  height: 36px; padding: 0 16px; border-radius: 10px;
  border: 1.5px solid var(--border-medium); background: transparent;
  color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.12s;
}
.modal-cancel:hover { background: var(--bg-surface-2); }
.modal-submit {
  height: 36px; padding: 0 20px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 14px rgba(99,102,241,0.3);
  transition: opacity 0.15s, transform 0.15s;
}
.modal-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.modal-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.modal-enter-active .modal-box { animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.modal-leave-active .modal-box { animation: modalOut 0.2s ease forwards; }
@keyframes modalIn  { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes modalOut { from { opacity: 1; } to { opacity: 0; transform: scale(0.95); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.global-overlay { position: fixed; inset: 0; z-index: 100; }

/* ══ Sidebar toggle button ══════════════════════════════════════ */
.sidebar-toggle-btn { width: 34px; padding: 0; justify-content: center; }
.sidebar-toggle-btn svg { width: 16px; height: 16px; }
.sidebar-toggle-btn.active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }

/* ══ Right Sidebar ══════════════════════════════════════════════ */
.task-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-base);
  overflow: hidden;
}

/* Sidebar slide transition */
.sidebar-enter-active { animation: sbIn 0.22s cubic-bezier(0.22,1,0.36,1); }
.sidebar-leave-active { animation: sbOut 0.18s ease forwards; }
@keyframes sbIn  { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes sbOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }

/* ── Sidebar header ── */
.sb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border-base);
  flex-shrink: 0;
}
.sb-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.sb-close {
  width: 26px; height: 26px; border-radius: 7px; border: none;
  background: transparent; color: var(--text-subtle); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.sb-close svg { width: 13px; height: 13px; }
.sb-close:hover { background: #fee2e2; color: #ef4444; }

/* ── Sidebar body ── */
.sb-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
.sb-body::-webkit-scrollbar { width: 4px; }
.sb-body::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 99px; }

/* ── Group block ── */
.sb-group {
  margin-bottom: 2px;
}

/* ── Group row ── */
.sb-group-row {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 0;
}
.sb-group-row:hover { background: var(--bg-hover); }

.sb-toggle {
  width: 16px; height: 16px; border: none; background: transparent;
  color: var(--text-muted); cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; padding: 0;
  transition: color 0.12s;
}
.sb-toggle svg { width: 12px; height: 12px; }
.sb-group-row:hover .sb-toggle { color: var(--text-primary); }

.sb-group-icon {
  width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700;
}
.sb-group-name {
  flex: 1; font-size: 12.5px; font-weight: 700; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── Group member stack ── */
.sb-group-members { display: flex; flex-shrink: 0; }
.sb-avatar {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 8.5px; font-weight: 700;
  border: 1.5px solid var(--bg-surface);
  margin-left: -5px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
.sb-group-members .sb-avatar:first-child { margin-left: 0; }

.sb-more {
  width: 22px; height: 22px; border-radius: 6px; border: none;
  background: transparent; color: var(--text-subtle); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.1s, background 0.12s;
  flex-shrink: 0;
}
.sb-more svg { width: 13px; height: 13px; }
.sb-group-row:hover .sb-more { opacity: 1; }
.sb-more:hover { background: var(--bg-surface-3); color: var(--text-primary); }

/* ── Task list ── */
.sb-tasks { padding: 0 0 4px; }

.sb-task-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 38px;
  cursor: pointer; border-radius: 0;
  transition: background 0.1s;
}
.sb-task-row:hover { background: var(--bg-hover); }

.sb-task-status-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.sb-task-name {
  flex: 1; font-size: 12px; font-weight: 500; color: var(--text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sb-task-priority {
  font-size: 10px; flex-shrink: 0; opacity: 0.7;
}
.sbp-urgent { color: #ef4444; }
.sbp-high   { color: #f97316; }
.sbp-medium { color: #f59e0b; }
.sbp-low    { color: #6366f1; }

/* ── Task list slide transition ── */
.sb-tasks-enter-active { animation: sbTasksIn 0.2s ease; }
.sb-tasks-leave-active { animation: sbTasksOut 0.15s ease forwards; }
@keyframes sbTasksIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes sbTasksOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-4px); } }
</style>
