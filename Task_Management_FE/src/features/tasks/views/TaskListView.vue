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
                class="kb-avatar-lg text-[11px] ring-2 ring-[var(--bg-app)] opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-150 cursor-default"
                :style="{ background: m.color }"
                :title="m.name"
              >{{ m.initials }}</button>

              <!-- Overflow badge -->
              <button
                v-if="store.members.length > visibleAvatarCount"
                class="kb-avatar-lg text-[10px] ring-2 ring-[var(--bg-app)] cursor-pointer hover:scale-105 transition-transform"
                style="background:var(--bg-surface-3);color:var(--text-muted)"
                title="Show all members"
                @click.stop="openMemberPicker()"
              >+{{ store.members.length - visibleAvatarCount }}</button>
            </div>

            <!-- Assign / manage button -->
            <button
              class="mp-add-btn"
              :class="{ 'mp-add-btn--open': memberPickerOpen }"
              title="Manage members"
              @click.stop="memberPickerOpen ? (memberPickerOpen = false) : openMemberPicker()"
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
                <span class="text-[11px] font-bold tracking-wide" style="color:var(--text-heading)">Project Members</span>
                <span class="text-[10px]" style="color:var(--text-subtle)">{{ store.members.length }} people</span>
              </div>

              <!-- Search -->
              <div class="mp-search-wrap">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-subtle)"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                <input
                  v-model="memberSearch"
                  class="mp-search"
                  placeholder="Search user to add…"
                  ref="memberSearchInput"
                />
              </div>

              <!-- Member list -->
              <div class="mp-list">
                <div
                  v-for="m in filteredPickerMembers" :key="m.id"
                  class="mp-item"
                >
                  <div class="mp-item-avatar" :style="{ background: m.color }">{{ m.initials }}</div>
                  <div class="mp-item-info">
                    <span class="mp-item-name">{{ m.name }}</span>
                  </div>
                </div>

                <div v-if="memberSearch.trim()" class="mp-dropdown-head">
                  <span class="text-[11px] font-bold tracking-wide" style="color:var(--text-heading)">Search Results</span>
                  <span class="text-[10px]" style="color:var(--text-subtle)">{{ searchedUsers.length }} available</span>
                </div>

                <button
                  v-for="user in searchedUsers"
                  :key="user.id"
                  type="button"
                  class="mp-item w-full text-left"
                  :disabled="addingMemberId === user.id"
                  @click="addMemberFromPicker(user)"
                >
                  <div class="mp-item-avatar" :style="{ background: userAvatarColor(user) }">
                    {{ userInitials(user) }}
                  </div>
                  <div class="mp-item-info">
                    <span class="mp-item-name">{{ user.fullName || user.email }}</span>
                  </div>
                  <span class="mp-item-check" style="color:#6366f1;font-size:11px">
                    {{ addingMemberId === user.id ? 'Adding...' : 'Add' }}
                  </span>
                </button>

                <div
                  v-if="assignableUsersQuery.isPending.value && memberSearch.trim()"
                  class="py-4 text-center text-[12px]"
                  style="color:var(--text-subtle)"
                >
                  Searching users...
                </div>

                <div
                  v-else-if="memberSearch.trim() && searchedUsers.length === 0"
                  class="py-4 text-center text-[12px]"
                  style="color:var(--text-subtle)"
                >
                  No users available to add
                </div>

                <div v-else-if="filteredPickerMembers.length === 0" class="py-4 text-center text-[12px]" style="color:var(--text-subtle)">
                  No members found
                </div>
              </div>

              <!-- Footer actions -->
              <div class="mp-footer">
                <button
                  class="mp-footer-btn mp-footer-btn--ghost"
                  @click="memberSearch = ''"
                >Clear search</button>
                <button
                  class="mp-footer-btn mp-footer-btn--primary"
                  @click="memberPickerOpen = false"
                >Done</button>
              </div>
            </div>
          </Transition>
        </div><!-- /member picker -->

        <!-- Trash -->
        <button
          class="relative w-8 h-8 inline-flex items-center justify-center border-[1.5px] border-[var(--btn-border)] rounded-[10px] bg-[var(--btn-bg)] text-[var(--text-muted)] cursor-pointer transition-all duration-150 flex-shrink-0 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] hover:-translate-y-px"
          :class="trashOpen ? 'text-[var(--text-primary)] !bg-[var(--bg-surface-2)] !border-indigo-400/40' : ''"
          title="Trash"
          @click="openTrash"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span v-if="trashCount" class="absolute -top-[5px] -right-[5px] min-w-[15px] h-[15px] inline-flex items-center justify-center px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold leading-none border-[1.5px] border-[var(--bg-app)] pointer-events-none">{{ trashCount }}</span>
        </button>

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
    <div class="flex-1 min-h-0 overflow-hidden relative">

      <!-- ── KANBAN COLUMNS ──────────────────────────────────────────────── -->
      <div class="w-full h-full overflow-x-auto overflow-y-hidden">
        <draggable
          v-model="columnsModel"
          item-key="id"
          tag="div"
          handle=".kb-col-drag-handle"
          class="flex gap-2.5 sm:gap-3 md:gap-4 h-full px-2.5 sm:px-5 md:px-7 pb-3 sm:pb-4 pt-1"
          style="min-width:max-content;"
          :animation="200"
          ghost-class="kb-col-ghost"
          @change="onColumnChange"
        >
          <template #item="{ element: col }">
            <div class="kb-col group" @click.self="void 0">
              <span class="kb-col-accent" :style="{ background: col.color }"/>

              <div class="kb-col-header">
                <div class="flex items-center gap-2 min-w-0 flex-1">
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

                  <!-- Inline-edit title -->
                  <template v-if="editingColId === col.id">
                    <input
                      :ref="el => { if (el) colEditInputs[col.id] = el as HTMLInputElement }"
                      v-model="editingColTitle"
                      class="kb-col-edit-input"
                      @keydown.enter.prevent="saveColEdit"
                      @keydown.escape.prevent="cancelColEdit"
                      @click.stop
                    />
                  </template>
                  <template v-else>
                    <span class="kb-col-title truncate">{{ col.title }}</span>
                  </template>

                  <span class="kb-col-count">{{ store.tasksByCol(col.id).length }}</span>
                </div>

                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <!-- Save/Cancel when editing -->
                  <template v-if="editingColId === col.id">
                    <button class="kb-col-action" title="Save" @click.stop="saveColEdit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="kb-col-action" title="Cancel" @click.stop="cancelColEdit">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
                    </button>
                  </template>
                  <template v-else>
                    <!-- Add task -->
                    <button
                      class="kb-col-action flex-shrink-0"
                      title="Add task"
                      @click.stop="sidebarOpen=true;activeTab='task';newTask.status=col.id"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <!-- Kebab menu -->
                    <div class="relative" :ref="el => { if (el) colMenuRefs[col.id] = el as HTMLElement }">
                      <button
                        class="kb-col-action flex-shrink-0"
                        title="More options"
                        @click.stop="toggleColMenu(col.id)"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/></svg>
                      </button>
                      <Transition name="cm-drop">
                        <div v-if="openColMenuId === col.id" class="col-menu-dropdown" @click.stop>
                          <button class="col-menu-item" @click.stop="startColEdit(col)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </button>
                          <button class="col-menu-item col-menu-item--danger" @click.stop="startColDelete(col)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            Delete
                          </button>
                        </div>
                      </Transition>
                    </div>
                  </template>
                </div>
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
                        <span v-if="taskCommentCount(task.id)" class="kb-card-meta">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {{ taskCommentCount(task.id) }}
                        </span>
                        <span v-if="taskFileCount(task.id)" class="kb-card-meta">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                          {{ taskFileCount(task.id) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>

                <template #footer>
                  <div v-if="store.tasksByCol(col.id).length === 0" class="kb-col-empty">
                    <span
                      class="block mb-2 flex items-center justify-center"
                      style="width:44px;height:44px;margin:0 auto;opacity:0.35;color:var(--text-subtle)"
                      v-html="colEmptyIcon(col)"
                    />
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
        <div v-if="sidebarOpen" class="sp-panel">
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
            <button
              class="sp-tab"
              :class="{ 'sp-tab--active': activeTab === 'group' }"
              @click="activeTab = 'group'"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="16" height="11" rx="2"/><path d="M6 5V4a2 2 0 014 0v1"/></svg>
              New Group
            </button>
            <button class="fp-close ml-auto" @click="sidebarOpen = false" title="Close">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
            </button>
          </div>
          <!-- Title row -->
          <div class="sp-title-row">
            <span class="sp-title-icon">✦</span>
            <span class="sp-title-text">{{ activeTab === 'task' ? 'Create New Task' : activeTab === 'group' ? 'Create New Group' : 'Create New Status' }}</span>
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
                  <option v-for="sp in sprintOptions" :key="sp.id || '__backlog'" :value="sp.id">
                    {{ sp.name }}{{ sp.dates ? ' - ' + sp.dates : '' }}
                  </option>
                </select>
              </div>
              <div class="fp-field">
                <label class="fp-label">Label</label>
                <!-- Selected label chip -->
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-if="newTask.label" class="td-label-tag" :style="{ background: resolvedLabelBg(newTask.label), color: resolvedLabelColor(newTask.label) }">
                    {{ newTask.label }}
                    <button @click="newTask.label = ''">×</button>
                  </span>
                  <!-- Picker trigger -->
                  <div class="relative" ref="fpLabelPickerRef">
                    <button class="td-add-label" @click.stop="toggleFpLabelPicker">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Label
                    </button>
                    <!-- Popover -->
                    <div v-if="showFpLabelPicker" class="td-popover fp-label-popover" @click.stop>
                      <!-- Search / create -->
                      <div class="td-picker-search">
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                        <input
                          ref="fpLabelSearchRef"
                          v-model="fpLabelSearch"
                          class="td-picker-search-input"
                          placeholder="Search or create…"
                          @keydown.enter="fpCreateOrPickLabel"
                        />
                      </div>
                      <div class="td-popover-list">
                        <div
                          v-for="(style, lbl) in fpFilteredLabels" :key="lbl"
                          class="td-popover-item"
                          :class="{ selected: newTask.label === lbl }"
                          @click="fpSetLabel(lbl as string)"
                        >
                          <span class="inline-block w-2 h-2 rounded-full" :style="{ background: style.color }"/>
                          {{ lbl }}
                          <svg v-if="newTask.label === lbl" class="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <!-- Create new -->
                        <div
                          v-if="fpLabelSearch.trim() && !allLabelMap[fpLabelSearch.trim()]"
                          class="td-popover-item td-popover-create"
                          @click="fpCreateOrPickLabel"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Create "{{ fpLabelSearch.trim() }}"
                        </div>
                        <div v-if="Object.keys(fpFilteredLabels).length === 0 && !fpLabelSearch.trim()" class="td-popover-empty">No labels</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="fp-field">
              <label class="fp-label">Due Date</label>
              <input v-model="newTask.due" type="date" class="fp-input"/>
            </div>

            <div class="fp-field">
              <label class="fp-label">Assignees</label>
              <!-- Search box -->
              <div class="flex items-center gap-1.5 bg-[var(--bg-surface-2)] border-[1.5px] border-[var(--btn-border)] rounded-lg px-2 h-[34px] mt-1 transition-colors focus-within:border-indigo-500">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-[var(--text-subtle)]"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                <input
                  v-model="assigneeSearch"
                  class="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)]"
                  placeholder="Search by name or email…"
                />
              </div>
              <!-- Selected chips -->
              <div v-if="newTask.assigneeIds.length" class="flex flex-wrap gap-[5px] mt-1.5">
                <span
                  v-for="id in newTask.assigneeIds" :key="id"
                  class="inline-flex items-center gap-[5px] py-0.5 pl-1 pr-2 rounded-full border-[1.5px] text-[11px] font-semibold"
                  :style="{ background: store.getMember(id)?.color + '22', borderColor: store.getMember(id)?.color, color: store.getMember(id)?.color }"
                >
                  <span class="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0" :style="{ background: store.getMember(id)?.color }">{{ store.getMember(id)?.initials }}</span>
                  {{ store.getMember(id)?.name.split(' ')[0] }}
                  <button class="bg-transparent border-none cursor-pointer p-0 flex items-center opacity-60 hover:opacity-100 transition-opacity text-inherit" @click="toggleNewAssignee(id)" title="Remove">
                    <svg width="8" height="8" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
                  </button>
                </span>
              </div>
              <!-- Dropdown results -->
              <div v-if="filteredAssigneeMembers.length" class="mt-1 bg-[var(--bg-surface)] border-[1.5px] border-[var(--btn-border)] rounded-lg overflow-hidden max-h-[170px] overflow-y-auto">
                <button
                  v-for="m in filteredAssigneeMembers" :key="m.id"
                  class="flex items-center gap-2 w-full px-2.5 py-[7px] border-none bg-transparent cursor-pointer text-left transition-colors hover:bg-[var(--bg-surface-2)]"
                  :class="{ 'bg-indigo-500/5': newTask.assigneeIds.includes(m.id) }"
                  @click="toggleNewAssignee(m.id)"
                >
                  <span class="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0" :style="{ background: m.color }">{{ m.initials }}</span>
                  <span class="text-[12px] text-[var(--text-primary)] flex-1">{{ m.name }}</span>
                  <svg v-if="newTask.assigneeIds.includes(m.id)" width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="text-indigo-500 ml-auto shrink-0"><polyline points="4 10 8.5 14.5 16 7"/></svg>
                </button>
              </div>
              <div v-else-if="assigneeSearch.trim()" class="p-2.5 text-center text-[11px] text-[var(--text-subtle)]">No members found</div>
            </div>

            <!-- ── GROUP ── -->
            <div class="fp-field">
              <label class="fp-label">Group</label>
              <div class="relative" :class="{ 'group-open': groupPickerOpen }" ref="groupPickerRef">
                <!-- Trigger -->
                <button
                  type="button"
                  class="flex items-center gap-[7px] w-full h-[34px] px-2.5 rounded-[9px] border-[1.5px] border-[var(--btn-border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[12.5px] font-medium cursor-pointer text-left transition-all duration-150 hover:border-indigo-500 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                  :class="groupPickerOpen ? 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]' : ''"
                  @click.stop="groupPickerOpen = !groupPickerOpen"
                >
                  <template v-if="newTask.groupId">
                    <span class="w-[9px] h-[9px] rounded-full shrink-0" :style="{ background: taskGroups.find(g => g.id === newTask.groupId)?.color }"></span>
                    <span class="flex-1 font-semibold text-[var(--text-primary)]">{{ taskGroups.find(g => g.id === newTask.groupId)?.name }}</span>
                  </template>
                  <template v-else>
                    <span class="flex-1 text-[var(--text-subtle)]">— No group —</span>
                  </template>
                  <svg class="shrink-0 text-[var(--text-muted)] transition-transform duration-200" :class="groupPickerOpen ? 'rotate-180' : ''" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                <!-- Dropdown -->
                <Transition name="fp-group-drop">
                  <div v-if="groupPickerOpen" class="absolute top-[calc(100%+5px)] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] z-[400] p-[5px] overflow-hidden" @click.stop>
                    <!-- No group option -->
                    <button
                      type="button"
                      class="flex items-center gap-2 w-full px-[9px] py-[7px] rounded-lg border-none text-[var(--text-primary)] text-[12.5px] cursor-pointer text-left transition-colors duration-100 hover:bg-[var(--bg-hover)]"
                      :class="!newTask.groupId ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent'"
                      @click="newTask.groupId = ''; groupPickerOpen = false"
                    >
                      <span class="w-[9px] h-[9px] rounded-full shrink-0 bg-[var(--bg-surface-3)] border-[1.5px] border-[var(--border-medium)]"></span>
                      <span class="flex-1 font-medium">No group</span>
                      <svg v-if="!newTask.groupId" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>

                    <div class="h-px bg-[var(--border-base)] my-1"></div>

                    <div
                      v-if="loadingGroups"
                      class="px-[9px] py-[7px] text-[12px] text-[var(--text-subtle)]"
                    >
                      Loading groups...
                    </div>

                    <!-- Group options -->
                    <button
                      v-for="g in taskGroups"
                      :key="g.id"
                      type="button"
                      class="flex items-center gap-2 w-full px-[9px] py-[7px] rounded-lg border-none text-[var(--text-primary)] text-[12.5px] cursor-pointer text-left transition-colors duration-100 hover:bg-[var(--bg-hover)]"
                      :class="newTask.groupId === g.id ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent'"
                      @click="newTask.groupId = g.id; groupPickerOpen = false"
                    >
                      <span class="w-[9px] h-[9px] rounded-full shrink-0" :style="{ background: g.color }"></span>
                      <span class="flex-1 font-medium">{{ g.name }}</span>
                      <svg v-if="newTask.groupId === g.id" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>

                    <div
                      v-if="!loadingGroups && taskGroups.length === 0"
                      class="px-[9px] py-[7px] text-[12px] text-[var(--text-subtle)]"
                    >
                      No groups yet
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <button class="fp-submit" :disabled="!newTask.title.trim() || submittingTask" @click="addTask">
              {{ submittingTask ? 'Creating...' : 'Create Task' }}
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
              <label class="fp-label">
                Icon
              </label>
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

            <button class="fp-submit" :disabled="!newStatus.title.trim() || submittingStatus" @click="addStatus">
              {{ submittingStatus ? 'Creating...' : 'Create Column' }}
            </button>
          </template>

          <!-- ── NEW GROUP FORM ── -->
          <template v-if="activeTab === 'group'">
            <div class="fp-section-title">Group details</div>

            <div class="fp-field">
              <label class="fp-label">Name <span style="color:#ef4444">*</span></label>
              <input v-model="newGroup.name" class="fp-input" placeholder="e.g. Frontend, Backend, Research…" maxlength="40"/>
            </div>

            <div class="fp-field">
              <label class="fp-label">Color</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <button
                  v-for="c in groupColorOptions" :key="c"
                  class="kb-color-swatch"
                  :style="{ background: c, outline: newGroup.color === c ? `2.5px solid ${c}` : 'none', outlineOffset: '2px', transform: newGroup.color === c ? 'scale(1.2)' : '' }"
                  @click="newGroup.color = c"
                />
              </div>
            </div>

            <!-- Preview -->
            <div class="fp-status-preview">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: newGroup.color }"/>
              <span class="text-sm font-semibold" style="color:var(--text-primary)">
                {{ newGroup.name || 'Group name' }}
              </span>
            </div>

            <!-- Existing groups -->
            <div class="fp-field" v-if="taskGroups.length">
              <label class="fp-label" style="margin-bottom:6px">Existing groups</label>
              <div class="flex flex-col gap-1">
                <div v-for="g in taskGroups" :key="g.id" class="kb-status-item">
                  <span class="w-2 h-2 rounded-full" :style="{ background: g.color }"/>
                  <span class="text-[12px] font-medium flex-1" style="color:var(--text-primary)">{{ g.name }}</span>
                </div>
              </div>
            </div>

            <button class="fp-submit" :disabled="!newGroup.name.trim() || submittingGroup" @click="addGroup">
              {{ submittingGroup ? 'Creating...' : 'Create Group' }}
            </button>
          </template>

        </div><!-- /sp-body -->
        </div><!-- /sp-panel -->
      </Transition>

    </div><!-- /board body: flex flex-1 overflow-hidden -->


    <!-- ══ TASK DETAIL MODAL ══════════════════════════════════════════════ -->
    <TaskDetailModal v-model="modalOpen" :task-id="selectedTaskId" @deleted="onTaskDeleted"/>

    <!-- ══ DELETE STATUS MODAL ══════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="deleteColTarget" class="ds-overlay" @click.self="cancelColDelete">
        <div class="ds-panel" @click.stop>
          <!-- Header -->
          <div class="ds-header">
            <span class="ds-icon">🗑️</span>
            <div>
              <p class="ds-title">Delete "{{ deleteColTarget.title }}"?</p>
              <p class="ds-subtitle">This action cannot be undone.</p>
            </div>
            <button class="fp-close ml-auto" @click="cancelColDelete">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
            </button>
          </div>

          <!-- Has tasks: require move -->
          <template v-if="deleteColTaskCount > 0">
            <div class="ds-body">
              <div class="ds-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>This status contains <strong>{{ deleteColTaskCount }} task{{ deleteColTaskCount > 1 ? 's' : '' }}</strong>. Choose where to move them before deleting.</span>
              </div>
              <label class="fp-label" style="margin-top:12px;display:block">Move tasks to</label>
              <select v-model="deleteColMoveTarget" class="fp-select" style="margin-top:6px">
                <option value="" disabled>— Select a status —</option>
                <option
                  v-for="col in store.columns.filter(c => c.id !== deleteColTarget?.id)"
                  :key="col.id"
                  :value="col.id"
                >{{ col.title }}</option>
              </select>
            </div>
            <div class="ds-footer">
              <button class="ds-btn ds-btn--ghost" @click="cancelColDelete">Cancel</button>
              <button
                class="ds-btn ds-btn--danger"
                :disabled="!deleteColMoveTarget || deletingCol"
                @click="confirmColDelete"
              >
                {{ deletingCol ? 'Deleting…' : 'Delete & Move' }}
              </button>
            </div>
          </template>

          <!-- Empty: direct delete -->
          <template v-else>
            <div class="ds-body">
              <p style="font-size:13px;color:var(--text-muted)">This status is empty. It will be permanently removed.</p>
            </div>
            <div class="ds-footer">
              <button class="ds-btn ds-btn--ghost" @click="cancelColDelete">Cancel</button>
              <button class="ds-btn ds-btn--danger" :disabled="deletingCol" @click="confirmColDelete">
                {{ deletingCol ? 'Deleting…' : 'Delete Status' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- ══ TASK TRASH DRAWER ══════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="trashOpen" class="fixed inset-0 z-[80] flex justify-end backdrop-blur-[7px]" style="background: radial-gradient(circle at 85% 15%, rgba(239,68,68,0.14), transparent 30%), rgba(15,23,42,0.38)" @click.self="trashOpen = false">
        <div class="w-[min(430px,100%)] h-full flex flex-col border-l border-red-500/[0.18]" style="background: linear-gradient(180deg,rgba(239,68,68,0.08),transparent 180px),var(--bg-surface); box-shadow: -24px 0 70px rgba(15,23,42,0.28)" @click.stop>
          <div class="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px] border-b border-[var(--border-base)]">
            <div class="w-[42px] h-[42px] grid place-items-center rounded-[15px] text-red-500 shrink-0" style="background:linear-gradient(135deg,rgba(239,68,68,0.16),rgba(249,115,22,0.1));box-shadow:inset 0 0 0 1px rgba(239,68,68,0.14)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <div class="min-w-0">
              <p class="text-[16px] font-black text-[var(--text-heading)]">Task Trash</p>
              <p class="mt-0.5 text-[11px] leading-[1.35] text-[var(--text-subtle)]">Deleted tasks are hidden from the board and can be restored.</p>
            </div>
            <button class="fp-close ml-auto" @click="trashOpen = false" title="Close">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto p-3.5">
            <div v-if="store.loadingTrash" class="min-h-[280px] grid place-items-center text-[var(--text-subtle)]">
              <span class="w-12 h-12 grid place-items-center rounded-[18px] bg-[var(--bg-surface-2)] text-[20px]">⌛</span>
              <p class="text-sm font-black text-[var(--text-heading)] mt-2">Loading trash...</p>
            </div>

            <div v-else-if="store.trashTasks.length === 0" class="min-h-[280px] grid place-items-center text-center text-[var(--text-subtle)]">
              <span class="w-12 h-12 grid place-items-center rounded-[18px] bg-[var(--bg-surface-2)] text-emerald-500 text-[20px] font-black">✓</span>
              <p class="text-sm font-black text-[var(--text-heading)] mt-2">Trash is clean</p>
              <span class="text-xs">No deleted tasks in this project.</span>
            </div>

            <div v-else class="flex flex-col gap-2.5">
              <div v-for="task in store.trashTasks" :key="task.id" class="relative overflow-hidden p-3 border border-[var(--border-base)] rounded-2xl bg-[var(--bg-surface)] shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                <div class="absolute inset-y-0 left-0 w-[3px] rounded-r bg-gradient-to-b from-red-500 to-orange-400"></div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span v-if="task.label" class="kb-card-label" :style="{ background: task.labelBg, color: task.labelColor }">{{ task.label }}</span>
                  <span v-else class="text-[10px] font-extrabold text-[var(--text-subtle)]">T-{{ task.id.slice(-5) }}</span>
                  <span
                    class="px-[7px] py-0.5 rounded-full text-[9px] font-black uppercase"
                    :class="{
                      'text-red-500 bg-red-500/10': task.priority === 'urgent' || task.priority === 'high',
                      'text-amber-500 bg-amber-500/10': task.priority === 'medium',
                      'text-emerald-500 bg-emerald-500/10': task.priority === 'low'
                    }"
                  >{{ priorityBadge[task.priority].label }}</span>
                </div>
                <p class="mt-2 text-[13px] font-black text-[var(--text-heading)]">{{ task.title }}</p>
                <p v-if="task.description && !task.description.startsWith('<')" class="mt-1 line-clamp-2 text-[11px] leading-[1.45] text-[var(--text-muted)]">{{ task.description }}</p>
                <div class="flex items-center justify-between gap-2 mt-3 text-[10px] text-[var(--text-subtle)]">
                  <span>{{ task.due ? `Due ${formatDate(task.due)}` : 'No due date' }}</span>
                  <button
                    class="h-7 px-2.5 border-0 rounded-[10px] bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-[11px] font-black cursor-pointer shadow-[0_8px_18px_rgba(16,185,129,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="restoringTaskId === task.id"
                    @click="restoreTrashTask(task.id)"
                  >
                    {{ restoringTaskId === task.id ? 'Restoring...' : 'Restore' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { useUsersQuery } from '@/features/users/composables/useUsersQuery'
import { listProjectSprints, type SprintSummary } from '@/api/sprints'
import { listProjectGroups, createProjectGroup, type TaskGroup } from '@/api/tasks'
import { useProjectStore } from '@/stores/project.store'
import { useTaskStore } from '@/stores/task.store'
import type { Column, Task } from '@/stores/task.store'
import type { User } from '@/types/user.types'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import TaskDetailModal from './TaskDetailModal.vue'

const store = useTaskStore()
const projectStore = useProjectStore()
const { currentProjectId } = storeToRefs(projectStore)
const toast = useToast()
const route = useRoute()
const router = useRouter()

// ── Sidebar / panel ────────────────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const activeTab = ref<'task' | 'status' | 'group'>('task')

// ── Column context menu ───────────────────────────────────────────────────────────────
const openColMenuId = ref<string | null>(null)
const colMenuRefs: Record<string, HTMLElement> = {}

function toggleColMenu(colId: string) {
  openColMenuId.value = openColMenuId.value === colId ? null : colId
}

function onDocColMenuClick(e: MouseEvent) {
  if (openColMenuId.value) {
    const menuEl = colMenuRefs[openColMenuId.value]
    if (!menuEl || !menuEl.contains(e.target as Node)) openColMenuId.value = null
  }
}

// ── Column inline edit ────────────────────────────────────────────────────────────────
const editingColId = ref<string | null>(null)
const editingColTitle = ref('')
const colEditInputs: Record<string, HTMLInputElement> = {}

async function startColEdit(col: Column) {
  openColMenuId.value = null
  editingColId.value = col.id
  editingColTitle.value = col.title
  await nextTick()
  colEditInputs[col.id]?.select()
}

function cancelColEdit() {
  editingColId.value = null
  editingColTitle.value = ''
}

async function saveColEdit() {
  const id = editingColId.value
  const title = editingColTitle.value.trim()
  if (!id || !title || !currentProjectId.value) { cancelColEdit(); return }
  cancelColEdit()
  try {
    await store.updateStatusInProject(currentProjectId.value, id, { title })
    toast.success('Status updated')
  } catch {
    toast.error('Cannot update status')
  }
}

// ── Column delete ─────────────────────────────────────────────────────────────────────
const deleteColTarget = ref<Column | null>(null)
const deleteColMoveTarget = ref('')
const deletingCol = ref(false)

const deleteColTaskCount = computed(() =>
  deleteColTarget.value ? store.tasksByCol(deleteColTarget.value.id).length : 0
)

function startColDelete(col: Column) {
  openColMenuId.value = null
  deleteColTarget.value = col
  deleteColMoveTarget.value = ''
}

function cancelColDelete() {
  deleteColTarget.value = null
  deleteColMoveTarget.value = ''
}

async function confirmColDelete() {
  const col = deleteColTarget.value
  if (!col || !currentProjectId.value) return
  if (deleteColTaskCount.value > 0 && !deleteColMoveTarget.value) {
    toast.error('Please select a status to move tasks to')
    return
  }
  deletingCol.value = true
  try {
    await store.deleteStatusInProject(
      currentProjectId.value,
      col.id,
      deleteColMoveTarget.value || undefined
    )
    toast.success(`Status "${col.title}" deleted`)
    cancelColDelete()
  } catch {
    toast.error('Cannot delete status')
  } finally {
    deletingCol.value = false
  }
}


// ── Member picker ────────────────────────────────────────────────────────────────────
const memberPickerOpen = ref(false)
const memberSearch = ref('')
const memberPickerRef = ref<HTMLElement | null>(null)
const memberSearchInput = ref<HTMLInputElement | null>(null)
const visibleAvatarCount = 4
const addingMemberId = ref<string | null>(null)
const assignableUsersQuery = useUsersQuery(memberSearch, {
  enabled: computed(() => Boolean(memberPickerOpen.value && currentProjectId.value)),
})

const filteredPickerMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return store.members
  return store.members.filter((m) => m.name.toLowerCase().includes(q))
})

const selectedProjectMemberIds = computed(() => new Set(store.members.map((member) => member.id)))
const searchedUsers = computed(() =>
  (assignableUsersQuery.data.value ?? [])
    .filter((user) => !selectedProjectMemberIds.value.has(user.id))
    .slice(0, 8)
)

function userInitials(user: User) {
  const raw = (user.fullName || user.email).trim()
  return raw
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function userAvatarColor(user: User) {
  const seed = user.id || user.email
  const palette = [
    '#6366f1',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#8b5cf6',
    '#ef4444',
    '#f97316',
  ]
  const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

async function openMemberPicker() {
  memberPickerOpen.value = true
  await nextTick()
  memberSearchInput.value?.focus()
}

async function addMemberFromPicker(user: User) {
  if (!currentProjectId.value || addingMemberId.value) return

  addingMemberId.value = user.id

  try {
    await store.addMemberToProject(currentProjectId.value, user.id)
    memberSearch.value = ''
    toast.success(`Added ${user.fullName || user.email} to this project`)
  } catch (_error) {
    toast.error('Cannot add member to this project')
  } finally {
    addingMemberId.value = null
  }
}

function onDocClick(e: MouseEvent) {
  if (memberPickerRef.value && !memberPickerRef.value.contains(e.target as Node))
    memberPickerOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('click', onFpLabelDocClick)
  document.addEventListener('click', onDocColMenuClick)
  document.addEventListener('click', onGroupPickerDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('click', onFpLabelDocClick)
  document.removeEventListener('click', onDocColMenuClick)
  document.removeEventListener('click', onGroupPickerDocClick)
})


// ── Modal ──────────────────────────────────────────────────────────────────────
const modalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)
const trashOpen = ref(false)
const restoringTaskId = ref<string | null>(null)
const trashCount = computed(() => store.trashTasks.length)

function openTaskModal(id: string) {
  selectedTaskId.value = id
  modalOpen.value = true
  void router.replace({ name: 'tasks', query: { ...route.query, taskId: id } })
}

watch(
  () => route.query.taskId,
  (taskId) => {
    if (typeof taskId !== 'string') return
    selectedTaskId.value = taskId
    modalOpen.value = true
  },
  { immediate: true }
)

watch(modalOpen, (open) => {
  if (open || !route.query.taskId) return
  const nextQuery = { ...route.query }
  delete nextQuery.taskId
  void router.replace({ name: 'tasks', query: nextQuery })
})

async function openTrash() {
  trashOpen.value = true
  if (!currentProjectId.value) return

  try {
    await store.loadProjectTrash(currentProjectId.value)
  } catch {
    toast.error('Cannot load trash')
  }
}

async function restoreTrashTask(taskId: string) {
  if (!currentProjectId.value) return
  restoringTaskId.value = taskId

  try {
    await store.restoreTaskRemote(taskId, currentProjectId.value)
    toast.success('Task restored')
  } catch {
    toast.error('Cannot restore task')
  } finally {
    restoringTaskId.value = null
  }
}

async function onTaskDeleted() {
  selectedTaskId.value = null
  toast.success('Task moved to Trash')
  if (currentProjectId.value) {
    await store.loadProjectTrash(currentProjectId.value)
  }
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

async function onColumnChange(evt: { moved?: { element: Column; newIndex: number } }) {
  const moved = evt.moved
  if (!moved || !currentProjectId.value) return

  try {
    await store.updateStatusPosition(currentProjectId.value, moved.element.id, moved.newIndex + 1)
  } catch (_error) {
    toast.error('Cannot update status order')
    await syncProjectTasks(currentProjectId.value)
  }
}

async function onTaskChange(evt: { added?: { element: Task } }, toColId: string) {
  // Fires when a task is dropped into this column from another
  if (!evt.added || !currentProjectId.value) return

  try {
    await store.moveTaskToStatus(currentProjectId.value, evt.added.element.id, toColId)
  } catch (_error) {
    toast.error('Cannot update task status')
    await syncProjectTasks(currentProjectId.value)
  }
}

// ── Priority badge ──────────────────────────────────────────────────────────────────
const priorityBadge: Record<string, { cls: string; label: string }> = {
  low: { cls: 'kb-prio-low', label: 'Low' },
  medium: { cls: 'kb-prio-medium', label: 'Med' },
  high: { cls: 'kb-prio-high', label: 'High' },
  urgent: { cls: 'kb-prio-urgent', label: 'Urgent' },
}

// ── New Task form ──────────────────────────────────────────────────────────────
const newTask = ref({
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  label: '',
  due: '',
  sprint: '',
  assigneeIds: [] as string[],
  groupId: '',
})

// ── Group picker ──────────────────────────────────────────────────
const remoteSprints = ref<SprintSummary[]>([])

function formatSprintDates(start: string, end: string): string {
  if (!start && !end) return ''
  const fmt = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end)}`
}

const sprintOptions = computed(() => [
  { id: '', name: 'Backlog', dates: 'No sprint' },
  ...remoteSprints.value.map((sprint) => ({
    id: sprint.id,
    name: sprint.name,
    dates: formatSprintDates(sprint.startDate ?? '', sprint.endDate ?? ''),
  })),
])

async function loadTaskSprints(projectId: string | null) {
  if (!projectId) {
    remoteSprints.value = []
    newTask.value.sprint = ''
    return
  }

  remoteSprints.value = await listProjectSprints(projectId)
  if (newTask.value.sprint && !remoteSprints.value.some((sprint) => sprint.id === newTask.value.sprint)) {
    newTask.value.sprint = ''
  }
}

const groupPickerOpen = ref(false)
const groupPickerRef = ref<HTMLElement | null>(null)
const taskGroups = ref<TaskGroup[]>([])
const loadingGroups = ref(false)

async function loadTaskGroups(projectId: string | null) {
  if (!projectId) {
    taskGroups.value = []
    return
  }

  loadingGroups.value = true
  try {
    taskGroups.value = await listProjectGroups(projectId)
  } catch (error) {
    console.error('Failed to load groups:', error)
    taskGroups.value = []
    toast.error('Failed to load task groups')
  } finally {
    loadingGroups.value = false
  }
}

// Fetch groups when project changes
watch(
  currentProjectId,
  async (projectId) => {
    await loadTaskGroups(projectId)
  },
  { immediate: true }
)

function onGroupPickerDocClick(e: MouseEvent) {
  if (groupPickerRef.value && !groupPickerRef.value.contains(e.target as Node))
    groupPickerOpen.value = false
}

// ── Label picker (same pattern as TaskDetailModal) ───────────────────────────
const customLabels = ref<Record<string, { bg: string; color: string }>>({})

const allLabelMap = computed<Record<string, { bg: string; color: string }>>(() => ({
  ...store.labelPresets,
  ...customLabels.value,
}))

function resolvedLabelBg(label: string) {
  return allLabelMap.value[label]?.bg ?? '#f1f5f9'
}
function resolvedLabelColor(label: string) {
  return allLabelMap.value[label]?.color ?? '#475569'
}

const showFpLabelPicker = ref(false)
const fpLabelSearch = ref('')
const fpLabelSearchRef = ref<HTMLInputElement | null>(null)
const fpLabelPickerRef = ref<HTMLElement | null>(null)

const fpFilteredLabels = computed(() => {
  const q = fpLabelSearch.value.toLowerCase()
  return Object.fromEntries(
    Object.entries(allLabelMap.value).filter(([lbl]) => lbl.toLowerCase().includes(q))
  )
})

async function toggleFpLabelPicker() {
  showFpLabelPicker.value = !showFpLabelPicker.value
  if (showFpLabelPicker.value) {
    fpLabelSearch.value = ''
    await nextTick()
    fpLabelSearchRef.value?.focus()
  }
}

const FP_LABEL_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#8b5cf6', '#ef4444', '#f97316',
]
function fpCreateOrPickLabel() {
  const name = fpLabelSearch.value.trim()
  if (!name) return
  if (!allLabelMap.value[name]) {
    const color = FP_LABEL_COLORS[Math.floor(Math.random() * FP_LABEL_COLORS.length)]
    customLabels.value[name] = { bg: color + '20', color }
    store.labelPresets[name] = customLabels.value[name]
  }
  fpSetLabel(name)
}
function fpSetLabel(lbl: string) {
  newTask.value.label = lbl
  showFpLabelPicker.value = false
}

function onFpLabelDocClick(e: MouseEvent) {
  if (fpLabelPickerRef.value && !fpLabelPickerRef.value.contains(e.target as Node))
    showFpLabelPicker.value = false
}

// ── Assignee search ──────────────────────────────────────────────────────────
const assigneeSearch = ref('')

const filteredAssigneeMembers = computed(() => {
  const q = assigneeSearch.value.trim().toLowerCase()
  if (!q) return store.members
  return store.members.filter(
    (m) => m.name.toLowerCase().includes(q)
  )
})


const defaultStatusId = computed(() => store.columns[0]?.id ?? 'backlog')
const submittingTask = ref(false)
const submittingStatus = ref(false)

function toggleNewAssignee(id: string) {
  const idx = newTask.value.assigneeIds.indexOf(id)
  if (idx >= 0) newTask.value.assigneeIds.splice(idx, 1)
  else newTask.value.assigneeIds.push(id)
}

async function addTask() {
  if (!newTask.value.title.trim()) return
  if (!currentProjectId.value) {
    toast.error('Please select a project first')
    return
  }

  if (!newTask.value.status) {
    toast.error('Please select a status for the task')
    return
  }

  submittingTask.value = true

  try {
    await store.createTaskInProject({
      projectId: currentProjectId.value,
      title: newTask.value.title.trim(),
      description: newTask.value.description.trim(),
      statusId: newTask.value.status,
      priority: newTask.value.priority,
      label: newTask.value.label || undefined,
      labelBg: newTask.value.label ? resolvedLabelBg(newTask.value.label) : undefined,
      labelColor: newTask.value.label ? resolvedLabelColor(newTask.value.label) : undefined,
      dueDate: newTask.value.due || undefined,
      sprintId: newTask.value.sprint || undefined,
      assigneeIds: newTask.value.assigneeIds,
      groupId: newTask.value.groupId || undefined,
    })

    newTask.value = {
      title: '',
      description: '',
      status: defaultStatusId.value,
      priority: 'medium',
      label: '',
      due: '',
      sprint: '',
      assigneeIds: [],
      groupId: '',
    }
    sidebarOpen.value = false
    toast.success('Task created successfully')
  } catch (_error) {
    toast.error('Cannot create task')
  } finally {
    submittingTask.value = false
  }
}

// ── New Status form ────────────────────────────────────────────────────────────────────
const colorOptions = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ef4444',
  '#64748b',
  '#f97316',
  '#84cc16',
]

type IconOption = { id: string; label: string; svg: string }
const S = (p: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
const iconOptions: IconOption[] = [
  {
    id: 'list',
    label: 'List',
    svg: S(
      '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'
    ),
  },
  { id: 'check', label: 'Checkmark', svg: S('<polyline points="20 6 9 17 4 12"/>') },
  { id: 'circle', label: 'Circle', svg: S('<circle cx="12" cy="12" r="9"/>') },
  {
    id: 'clock',
    label: 'Clock',
    svg: S('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>'),
  },
  {
    id: 'star',
    label: 'Star',
    svg: S(
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
    ),
  },
  { id: 'zap', label: 'Zap', svg: S('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>') },
  {
    id: 'flag',
    label: 'Flag',
    svg: S(
      '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'
    ),
  },
  {
    id: 'box',
    label: 'Box',
    svg: S(
      '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'
    ),
  },
  {
    id: 'layers',
    label: 'Layers',
    svg: S(
      '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
    ),
  },
  {
    id: 'eye',
    label: 'Review',
    svg: S(
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    ),
  },
  {
    id: 'pause',
    label: 'On Hold',
    svg: S('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
  },
  {
    id: 'archive',
    label: 'Archive',
    svg: S(
      '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'
    ),
  },
  {
    id: 'rocket',
    label: 'Launch',
    svg: S(
      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>'
    ),
  },
  {
    id: 'target',
    label: 'Target',
    svg: S(
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>'
    ),
  },
  {
    id: 'tag',
    label: 'Tag',
    svg: S(
      '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'
    ),
  },
]
const newStatus = ref({ title: '', color: '#6366f1', iconId: 'list' })

async function addStatus() {
  if (!newStatus.value.title.trim()) return
  if (!currentProjectId.value) {
    toast.error('Please select a project first')
    return
  }

  submittingStatus.value = true

  try {
    await store.createStatusInProject({
      projectId: currentProjectId.value,
      title: newStatus.value.title.trim(),
      color: newStatus.value.color,
      icon: newStatus.value.iconId,
    })

    newStatus.value = { title: '', color: '#6366f1', iconId: 'list' }
    activeTab.value = 'task'
    if (!newTask.value.status) {
      newTask.value.status = defaultStatusId.value
    }
    toast.success('Status created successfully')
  } catch (_error) {
    toast.error('Cannot create status')
  } finally {
    submittingStatus.value = false
  }
}

// ── New Group form ──────────────────────────────────────────────────────────────
const groupColorOptions = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#64748b',
]
const newGroup = ref({ name: '', color: '#6366f1' })
const submittingGroup = ref(false)

async function addGroup() {
  if (!newGroup.value.name.trim()) return
  if (!currentProjectId.value) {
    toast.error('Please select a project first')
    return
  }

  submittingGroup.value = true
  try {
    const created = await createProjectGroup(currentProjectId.value, {
      name: newGroup.value.name.trim(),
      color: newGroup.value.color,
    })
    taskGroups.value = created?.id ? [...taskGroups.value, created] : taskGroups.value
    await loadTaskGroups(currentProjectId.value)
    newGroup.value = { name: '', color: '#6366f1' }
    activeTab.value = 'task'
    toast.success('Group created successfully')
  } catch (_error) {
    toast.error('Cannot create group')
  } finally {
    submittingGroup.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function colEmptyIcon(col: Column) {
  const svg = iconOptions.find((i) => i.id === col.icon)?.svg ?? iconOptions[0].svg
  return svg.replace('width="14" height="14"', 'width="28" height="28"')
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function taskCommentCount(taskId: string) {
  return store.commentsByTask(taskId).length || store.getTask(taskId)?.comments || 0
}

function taskFileCount(taskId: string) {
  return store.attachmentsByTask(taskId).length || store.getTask(taskId)?.files || 0
}

async function syncProjectTasks(projectId: string | null) {
  if (!projectId) {
    store.resetProjectBoard()
    remoteSprints.value = []
    newTask.value.status = defaultStatusId.value
    newTask.value.sprint = ''
    return
  }

  try {
    await Promise.all([
      store.loadProjectBoard(projectId),
      store.loadProjectTrash(projectId),
      loadTaskSprints(projectId),
    ])

    if (!store.columns.some((col) => col.id === newTask.value.status)) {
      newTask.value.status = defaultStatusId.value
    }
  } catch (error) {
    toast.error('Cannot load tasks for the current project')
  }
}

watch(
  currentProjectId,
  (projectId) => {
    void syncProjectTasks(projectId)
  },
  { immediate: true }
)
</script>

<style scoped>
/* Backdrop fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Group picker dropdown animation */
.fp-group-drop-enter-active { animation: fpGrpIn 0.16s ease; }
.fp-group-drop-leave-active { animation: fpGrpOut 0.12s ease forwards; }
@keyframes fpGrpIn  { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes fpGrpOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-4px) scale(0.97); } }

/* Drag ghost / chosen states (require :deep to pierce vuedraggable) */
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
