<template>
  <Teleport to="body">
    <Transition name="td-modal">
      <div v-if="modelValue" class="td-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="td-panel" @click="onModalClick">

          <!-- ══ TOP BAR ═══════════════════════════════════════════════════ -->
          <div class="td-topbar">
            <div class="flex items-center gap-2">
              <span class="td-breadcrumb-item">Tasks</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              <span class="td-task-id">T-{{ task?.id }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              <span class="td-breadcrumb-item font-semibold" style="color:var(--text-primary)">{{ task?.title?.slice(0,28) }}…</span>
            </div>
            <div class="flex items-center gap-1">
              <button class="td-topbar-btn" title="Close" @click="$emit('update:modelValue', false)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- ══ BODY ══════════════════════════════════════════════════════ -->
          <div class="td-body" v-if="task">

            <!-- ── MAIN CONTENT ──────────────────────────────────────────── -->
            <div class="td-main">

              <!-- Title -->
              <div
                ref="titleRef"
                class="td-title"
                contenteditable="true"
                data-placeholder="Task title…"
                @blur="onTitleBlur"
                @keydown.enter.prevent="(titleRef as HTMLElement)?.blur()"
              >{{ task.title }}</div>

              <!-- ── DESCRIPTION ── -->
              <div class="td-section">
                <div class="td-section-hd">
                  <h3 class="td-section-title">Description</h3>
                </div>
                <div class="td-toolbar">
                  <!-- Bold -->
                  <button class="td-toolbar-btn" @mousedown.prevent @click="fmt('bold')" title="Bold">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
                  </button>
                  <!-- Italic -->
                  <button class="td-toolbar-btn" @mousedown.prevent @click="fmt('italic')" title="Italic">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
                  </button>
                  <!-- Underline -->
                  <button class="td-toolbar-btn" @mousedown.prevent @click="fmt('underline')" title="Underline">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
                  </button>
                  <span class="td-toolbar-divider"/>
                  <!-- Bullet list -->
                  <button class="td-toolbar-btn" @mousedown.prevent @click="fmt('insertUnorderedList')" title="Bullet list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
                  </button>
                  <!-- Ordered list -->
                  <button class="td-toolbar-btn" @mousedown.prevent @click="fmt('insertOrderedList')" title="Ordered list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" stroke-width="2"/><path d="M4 10h2" stroke-width="2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke-width="2"/></svg>
                  </button>
                </div>
                <div
                  ref="descRef"
                  class="td-editor"
                  contenteditable="true"
                  data-placeholder="Add a description…"
                  @blur="onDescBlur"
                  v-html="descHtml"
                />
              </div>

              <!-- ── SUBTASKS ── -->
              <div class="td-section">
                <div class="td-section-hd">
                  <h3 class="td-section-title">Subtasks</h3>
                  <span class="td-progress-label">{{ progress.done }}/{{ progress.total }} completed</span>
                </div>

                <!-- Progress bar -->
                <div v-if="progress.total > 0" class="td-progress-track">
                  <div class="td-progress-fill" :style="{ width: progress.total ? `${(progress.done/progress.total)*100}%` : '0%' }"/>
                </div>

                <!-- Subtask list -->
                <div class="flex flex-col gap-0.5">
                  <template v-for="st in sortedSubtasks" :key="st.id">
                    <div class="td-subtask-row group">
                      <!-- Checkbox -->
                      <button
                        class="td-check-box shrink-0"
                        :class="{ checked: st.completed }"
                        @click="store.toggleSubtask(st.id)"
                      >
                        <svg v-if="st.completed" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>

                      <!-- Title / edit input -->
                      <template v-if="editingSubtaskId === st.id">
                        <input
                          :ref="el => { if (el) editInputRef = el as HTMLInputElement }"
                          v-model="editingSubtaskTitle"
                          class="td-subtask-edit-input"
                          @blur="saveSubtaskEdit(st.id)"
                          @keydown.enter="saveSubtaskEdit(st.id)"
                          @keydown.escape="editingSubtaskId = null"
                        />
                      </template>
                      <template v-else>
                        <span
                          class="td-subtask-title"
                          :class="{ done: st.completed }"
                          @dblclick="startEditSubtask(st)"
                        >{{ st.title }}</span>
                      </template>

                      <!-- ── Actions: assignee | date | delete ── -->
                      <div class="flex items-center gap-1 ml-auto shrink-0">

                        <!-- Assignee -->
                        <div class="relative">
                          <div
                            v-if="store.getMember(st.assigneeId ?? '')"
                            class="td-avatar-xxs cursor-pointer opacity-100"
                            :style="{ background: store.getMember(st.assigneeId!)!.color }"
                            :title="store.getMember(st.assigneeId!)!.name"
                            @click.stop="toggleStAssigneePicker(st.id)"
                          >{{ store.getMember(st.assigneeId!)!.initials }}</div>
                          <button
                            v-else
                            class="td-subtask-meta-btn opacity-0 group-hover:opacity-100"
                            title="Assign member"
                            @click.stop="toggleStAssigneePicker(st.id)"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                          </button>
                          <div v-if="stAssigneePickerId === st.id" class="td-mini-popover" @click.stop>
                            <div
                              v-for="m in store.members" :key="m.id"
                              class="td-popover-item"
                              :class="{ selected: st.assigneeId === m.id }"
                              @click="setStAssignee(st.id, m.id)"
                            >
                              <span class="td-avatar-xxs" :style="{ background: m.color }">{{ m.initials }}</span>
                              {{ m.name.split(' ')[0] }}
                            </div>
                            <div class="td-popover-item" style="border-top:1px solid var(--border-base);color:var(--text-muted)" @click="setStAssignee(st.id, '')">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Unassign
                            </div>
                          </div>
                        </div>

                        <!-- Due date -->
                        <div class="relative" style="line-height:1">
                          <!-- Has date -->
                          <span
                            v-if="st.dueDate"
                            class="td-subtask-date-label cursor-pointer"
                            title="Click to change date"
                            @click.stop="openStDatePicker(st.id)"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {{ formatDate(st.dueDate) }}
                          </span>
                          <!-- No date: ghost icon -->
                          <button
                            v-else
                            class="td-subtask-meta-btn opacity-0 group-hover:opacity-100"
                            title="Set due date"
                            @click.stop="openStDatePicker(st.id)"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          </button>
                          <!-- Hidden native date input -->
                          <input
                            :ref="el => { if (el) stDateInputs[st.id] = el as HTMLInputElement }"
                            type="date"
                            :value="st.dueDate"
                            style="position:absolute;inset:0;opacity:0;width:100%;cursor:pointer;pointer-events:none"
                            @change="e => store.updateSubtask(st.id, { dueDate: (e.target as HTMLInputElement).value })"
                          />
                        </div>

                        <!-- Delete -->
                        <button class="td-subtask-meta-btn opacity-0 group-hover:opacity-100" title="Delete" @click="store.deleteSubtask(st.id)">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>

                      </div><!-- /actions -->

                    </div>
                  </template>
                </div>

                <!-- Add subtask input -->
                <div v-if="addingSubtask" class="flex items-center gap-2 mt-1">
                  <span class="td-check-box-ph shrink-0"/>
                  <input
                    ref="subtaskInputRef"
                    v-model="newSubtaskTitle"
                    class="td-check-input flex-1"
                    placeholder="Subtask title… (Enter to save)"
                    @keydown.enter="commitSubtask"
                    @keydown.backspace="onSubtaskBackspace"
                    @keydown.escape="addingSubtask = false; newSubtaskTitle = ''"
                    @blur="commitSubtask"
                  />
                </div>
                <button class="td-subtask-add-btn" @click="startAddSubtask">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add subtask
                </button>
              </div>

              <!-- ── COMMENTS / ACTIVITY ── -->
              <div class="td-section">
                <h3 class="td-section-title">Comments & Activity</h3>

                <!-- Comment input -->
                <div class="td-comment-wrap">
                  <div class="td-avatar-xs" style="background:#6366f1">AJ</div>
                  <div class="td-comment-input-wrap gap-2">
                    <textarea
                      v-model="newComment"
                      class="td-comment-textarea"
                      placeholder="Write a comment… (use @ to mention)"
                      rows="2"
                      @keydown.ctrl.enter="submitComment"
                    />
                    <div class="flex justify-end mt-1">
                      <button class="td-comment-submit" :disabled="!newComment.trim()" @click="submitComment">
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Activity + comments merged -->
                <div class="flex flex-col gap-2 mt-2">
                  <template v-for="entry in mergedActivity" :key="entry.id">
                    <!-- Comment: card style -->
                    <div v-if="entry.isComment" class="td-comment-card">
                      <div class="td-avatar-xs" :style="{ background: store.getMember(entry.authorId)?.color ?? '#94a3b8' }">
                        {{ store.getMember(entry.authorId)?.initials ?? '?' }}
                      </div>
                      <div class="td-comment-card-body">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="td-activity-user">{{ store.getMember(entry.authorId)?.name ?? 'User' }}</span>
                          <span class="td-activity-time">{{ timeAgo(entry.createdAt) }}</span>
                        </div>
                        <p class="td-comment-card-text">{{ entry.text }}</p>
                      </div>
                    </div>
                    <!-- Activity log: compact line -->
                    <div v-else class="td-log-row">
                      <div class="td-log-dot"/>
                      <span class="td-log-user">{{ store.getMember(entry.authorId)?.name?.split(' ')[0] ?? 'User' }}</span>
                      <span class="td-log-text">{{ entry.text }}</span>
                      <span class="td-activity-time">{{ timeAgo(entry.createdAt) }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- ── ATTACHMENTS ── -->
              <div class="td-section">
                <h3 class="td-section-title">Attachments</h3>
                <label class="td-drop-zone" for="file-upload-input">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span class="text-[13px] font-semibold">Drop files here or click to upload</span>
                  <span class="text-xs" style="color:var(--text-subtle)">Images, PDFs, Docs…</span>
                </label>
                <input id="file-upload-input" type="file" multiple class="hidden" @change="onFileUpload" />

                <div v-if="taskAttachments.length > 0" class="td-attach-grid mt-2">
                  <div v-for="att in taskAttachments" :key="att.id" class="td-attach-item group">
                    <img v-if="att.type === 'image'" :src="att.url" :alt="att.name" class="td-attach-img" />
                    <div v-else class="td-attach-file">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted)"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                      <span class="truncate w-full text-center">{{ att.name }}</span>
                      <span>{{ att.size }}</span>
                    </div>
                    <button class="td-attach-remove" @click="store.removeAttachment(att.id)">×</button>
                  </div>
                </div>
              </div>

            </div><!-- /td-main -->

            <!-- ── RIGHT SIDEBAR (properties) ────────────────────────────── -->
            <div class="td-sidebar">

              <!-- Status -->
              <div class="td-prop">
                <p class="td-prop-label">Status</p>
                <div class="relative" ref="statusDropdownRef">
                  <button
                    class="td-status-trigger"
                    @click.stop="showStatusDrop = !showStatusDrop"
                  >
                    <span class="td-status-dot" :style="{ background: currentColumn?.color ?? '#94a3b8' }"/>
                    <span class="truncate flex-1 text-left">{{ currentColumn?.title ?? 'Select…' }}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div v-if="showStatusDrop" class="td-status-drop" @click.stop>
                    <div
                      v-for="col in store.columns" :key="col.id"
                      class="td-status-option"
                      :class="{ active: task.status === col.id }"
                      @click="onStatusChange2(col.id)"
                    >
                      <span class="td-status-dot" :style="{ background: col.color ?? '#94a3b8' }"/>
                      <span class="flex-1">{{ col.title }}</span>
                      <svg v-if="task.status === col.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Priority -->
              <div class="td-prop">
                <p class="td-prop-label">Priority</p>
                <button class="td-priority-badge" :class="`prio-${task.priority}`" @click="cyclePriority">
                  {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
                </button>
              </div>

              <!-- Due Date -->
              <div class="td-prop">
                <p class="td-prop-label">Due Date</p>
                <input type="date" class="td-prop-input" :value="task.due" @change="e => store.updateTask(task!.id, { due: (e.target as HTMLInputElement).value })" />
              </div>

              <!-- Sprint -->
              <div class="td-prop">
                <p class="td-prop-label">Sprint</p>
                <select class="td-prop-select" :value="task.sprint" @change="e => store.updateTask(task!.id, { sprint: (e.target as HTMLSelectElement).value })">
                  <option value="">None (Backlog)</option>
                  <option v-for="sp in store.sprints" :key="sp.id" :value="sp.id">{{ sp.title }}</option>
                </select>
              </div>

              <!-- Assignees -->
              <div class="td-prop">
                <p class="td-prop-label">Assignees</p>
                <div class="flex flex-wrap gap-1.5 mt-1">
                  <div v-for="m in task.assignees" :key="m.id" class="td-assignee-chip" :style="{ borderColor: m.color + '55', background: m.color + '15' }">
                    <span class="td-avatar-xxs" :style="{ background: m.color }">{{ m.initials }}</span>
                    <span>{{ m.name.split(' ')[0] }}</span>
                    <button @click="removeAssignee(m.id)" title="Remove">×</button>
                  </div>
                </div>
                <div class="relative mt-1.5" ref="assigneePickerRef">
                  <button class="td-add-assignee" @click="toggleAssigneePicker">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add member
                  </button>
                  <div v-if="showAssigneePicker" class="td-popover absolute left-0 top-full z-50" style="min-width:200px">
                    <!-- Search -->
                    <div class="td-picker-search">
                      <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                      <input
                        ref="assigneeSearchRef"
                        v-model="assigneeSearch"
                        class="td-picker-search-input"
                        placeholder="Search member…"
                      />
                    </div>
                    <div class="td-popover-list">
                      <div
                        v-for="m in filteredMembers" :key="m.id"
                        class="td-popover-item"
                        :class="{ selected: task.assignees.some(a => a.id === m.id) }"
                        @click="toggleAssignee(m)"
                      >
                        <span class="td-avatar-xxs" :style="{ background: m.color }">{{ m.initials }}</span>
                        {{ m.name }}
                        <svg v-if="task.assignees.some(a => a.id === m.id)" class="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div v-if="filteredMembers.length === 0" class="td-popover-empty">No members found</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Label -->
              <div class="td-prop">
                <p class="td-prop-label">Label</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-if="task.label" class="td-label-tag" :style="{ background: task.labelBg, color: task.labelColor }">
                    {{ task.label }}
                    <button @click="store.updateTask(task!.id, { label: '', labelBg: '#f1f5f9', labelColor: '#475569' })">×</button>
                  </span>
                  <div class="relative" ref="labelPickerRef">
                    <button class="td-add-label" @click="toggleLabelPicker">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Label
                    </button>
                    <div v-if="showLabelPicker" class="td-popover absolute left-0 top-full z-50" style="min-width:180px">
                      <!-- Search / create -->
                      <div class="td-picker-search">
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                        <input
                          ref="labelSearchRef"
                          v-model="labelSearch"
                          class="td-picker-search-input"
                          placeholder="Search or create…"
                          @keydown.enter="createOrPickLabel"
                        />
                      </div>
                      <div class="td-popover-list">
                        <div
                          v-for="(style, lbl) in filteredLabels" :key="lbl"
                          class="td-popover-item"
                          :class="{ selected: task.label === lbl }"
                          @click="setLabel(lbl as string)"
                        >
                          <span class="inline-block w-2 h-2 rounded-full" :style="{ background: style.color }"/>
                          {{ lbl }}
                          <svg v-if="task.label === lbl" class="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <!-- Create new -->
                        <div
                          v-if="labelSearch.trim() && !store.labelPresets[labelSearch.trim()]"
                          class="td-popover-item td-popover-create"
                          @click="createOrPickLabel"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Create "{{ labelSearch.trim() }}"
                        </div>
                        <div v-if="Object.keys(filteredLabels).length === 0 && !labelSearch.trim()" class="td-popover-empty">No labels</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Meta -->
              <div class="td-prop mt-2 pt-4" style="border-top:1px solid var(--border-base)">
                <p class="td-meta-row">Created {{ formatDate(task.createdAt) }}</p>
                <p class="td-meta-row mt-0.5">Updated {{ formatDate(task.updatedAt) }}</p>
              </div>

            </div><!-- /td-sidebar -->

          </div><!-- /td-body -->
        </div><!-- /td-panel -->
      </div><!-- /td-overlay -->
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTaskStore } from '@/stores/task.store'
import type { Member, Subtask } from '@/stores/task.store'

// ── Props / Emits ─────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue: boolean
  taskId: string | null
}>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()

// ── Store ─────────────────────────────────────────────────────────────────────
const store = useTaskStore()

// ── Task ref ──────────────────────────────────────────────────────────────────
const task = computed(() => props.taskId ? store.getTask(props.taskId) : null)
const progress = computed(() => props.taskId ? store.subtaskProgress(props.taskId) : { done: 0, total: 0 })
const sortedSubtasks = computed(() => {
  if (!props.taskId) return []
  const all = store.subtasksByTask(props.taskId)
  return [...all.filter(s => !s.completed), ...all.filter(s => s.completed)]
})
const taskAttachments = computed(() => props.taskId ? store.attachmentsByTask(props.taskId) : [])
const mergedActivity = computed(() => {
  if (!props.taskId) return []
  const cmts = store.commentsByTask(props.taskId).map(c => ({
    id: c.id, authorId: c.authorId, text: c.text, createdAt: c.createdAt, isComment: true,
  }))
  const acts = store.activityByTask(props.taskId).map(a => ({
    id: a.id, authorId: a.authorId, text: a.action, createdAt: a.createdAt, isComment: false,
  }))
  return [...cmts, ...acts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// ── Title editing ─────────────────────────────────────────────────────────────
const titleRef = ref<HTMLElement | null>(null)
watch(() => props.taskId, async () => {
  await nextTick()
  if (titleRef.value && task.value) {
    titleRef.value.textContent = task.value.title
  }
})
function onTitleBlur() {
  if (!task.value || !titleRef.value) return
  const newTitle = titleRef.value.textContent?.trim() || task.value.title
  store.updateTask(task.value.id, { title: newTitle })
}

// ── Description ───────────────────────────────────────────────────────────────
const descRef = ref<HTMLElement | null>(null)
const descHtml = ref('')
watch(() => props.taskId, async (id) => {
  if (!id) return
  await nextTick()
  const t = store.getTask(id)
  descHtml.value = t?.description ?? ''
  if (descRef.value) descRef.value.innerHTML = t?.description ?? ''
}, { immediate: true })
function fmt(cmd: string) {
  document.execCommand(cmd, false)
  descRef.value?.focus()
}
function onDescBlur() {
  if (!task.value || !descRef.value) return
  store.updateTask(task.value.id, { description: descRef.value.innerHTML })
}

// ── Subtasks ──────────────────────────────────────────────────────────────────
const addingSubtask = ref(false)
const newSubtaskTitle = ref('')
const subtaskInputRef = ref<HTMLInputElement | null>(null)
const editingSubtaskId = ref<string | null>(null)
const editingSubtaskTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

async function startAddSubtask() {
  addingSubtask.value = true
  newSubtaskTitle.value = ''
  await nextTick()
  subtaskInputRef.value?.focus()
}
function commitSubtask() {
  if (!task.value) return
  if (newSubtaskTitle.value.trim()) {
    store.addSubtask(task.value.id, newSubtaskTitle.value.trim())
    newSubtaskTitle.value = ''
  }
  addingSubtask.value = false
}
function onSubtaskBackspace() {
  if (!newSubtaskTitle.value) { addingSubtask.value = false }
}
async function startEditSubtask(st: Subtask) {
  editingSubtaskId.value = st.id
  editingSubtaskTitle.value = st.title
  await nextTick()
  editInputRef.value?.focus()
}
function saveSubtaskEdit(id: string) {
  if (editingSubtaskTitle.value.trim()) {
    store.updateSubtask(id, { title: editingSubtaskTitle.value.trim() })
  }
  editingSubtaskId.value = null
}

// Subtask inline assignee picker
const stAssigneePickerId = ref<string | null>(null)
function toggleStAssigneePicker(id: string) {
  stAssigneePickerId.value = stAssigneePickerId.value === id ? null : id
}
function setStAssignee(subtaskId: string, memberId: string) {
  store.updateSubtask(subtaskId, { assigneeId: memberId || undefined })
  stAssigneePickerId.value = null
}
// Close picker on outside click
function onModalClick() {
  stAssigneePickerId.value = null
  showStatusDrop.value = false
}

// Subtask date picker
const stDateInputs: Record<string, HTMLInputElement> = {}
function openStDatePicker(id: string) {
  const el = stDateInputs[id]
  if (!el) return
  try { el.showPicker() } catch { el.click() }
}

// ── Comments ──────────────────────────────────────────────────────────────────
const newComment = ref('')
function submitComment() {
  if (!task.value || !newComment.value.trim()) return
  store.addComment(task.value.id, newComment.value.trim())
  newComment.value = ''
}

// ── File upload ───────────────────────────────────────────────────────────────
function onFileUpload(e: Event) {
  if (!task.value) return
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  Array.from(files).forEach(f => {
    const isImg = f.type.startsWith('image/')
    const url = isImg ? URL.createObjectURL(f) : ''
    store.addAttachment(task.value!.id, {
      name: f.name,
      url,
      type: isImg ? 'image' : 'file',
      size: `${(f.size / 1024).toFixed(0)} KB`,
    })
  })
}

// ── Assignees ─────────────────────────────────────────────────────────────────
const showAssigneePicker = ref(false)
const assigneeSearch = ref('')
const assigneeSearchRef = ref<HTMLInputElement | null>(null)
const assigneePickerRef = ref<HTMLElement | null>(null)

const filteredMembers = computed(() =>
  store.members.filter(m =>
    m.name.toLowerCase().includes(assigneeSearch.value.toLowerCase())
  )
)

async function toggleAssigneePicker() {
  showAssigneePicker.value = !showAssigneePicker.value
  if (showAssigneePicker.value) {
    assigneeSearch.value = ''
    await nextTick()
    assigneeSearchRef.value?.focus()
  }
}
function toggleAssignee(m: Member) {
  if (!task.value) return
  const existing = task.value.assignees.find(a => a.id === m.id)
  const newAssignees = existing
    ? task.value.assignees.filter(a => a.id !== m.id)
    : [...task.value.assignees, m]
  store.updateTask(task.value.id, { assignees: newAssignees })
}
function removeAssignee(id: string) {
  if (!task.value) return
  store.updateTask(task.value.id, { assignees: task.value.assignees.filter(a => a.id !== id) })
}

// ── Labels ────────────────────────────────────────────────────────────────────
const showLabelPicker = ref(false)
const labelSearch = ref('')
const labelSearchRef = ref<HTMLInputElement | null>(null)
const labelPickerRef = ref<HTMLElement | null>(null)

const filteredLabels = computed(() => {
  const q = labelSearch.value.toLowerCase()
  return Object.fromEntries(
    Object.entries(store.labelPresets).filter(([lbl]) => lbl.toLowerCase().includes(q))
  )
})

async function toggleLabelPicker() {
  showLabelPicker.value = !showLabelPicker.value
  if (showLabelPicker.value) {
    labelSearch.value = ''
    await nextTick()
    labelSearchRef.value?.focus()
  }
}

const LABEL_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#06b6d4','#8b5cf6','#ef4444','#f97316']
function createOrPickLabel() {
  const name = labelSearch.value.trim()
  if (!name) return
  if (!store.labelPresets[name]) {
    const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]
    store.labelPresets[name] = { bg: color + '20', color }
  }
  setLabel(name)
}

function setLabel(lbl: string) {
  if (!task.value) return
  const style = store.labelPresets[lbl]
  store.updateTask(task.value.id, { label: lbl, labelBg: style.bg, labelColor: style.color })
  showLabelPicker.value = false
}

// ── Status / Priority ─────────────────────────────────────────────────────────
const showStatusDrop = ref(false)
const statusDropdownRef = ref<HTMLElement | null>(null)
const currentColumn = computed(() => store.columns.find(c => c.id === task.value?.status))

function onStatusChange(e: Event) {
  if (!task.value) return
  store.moveTask(task.value.id, (e.target as HTMLSelectElement).value)
}
function onStatusChange2(colId: string) {
  if (!task.value) return
  store.moveTask(task.value.id, colId)
  showStatusDrop.value = false
}
const priorityOrder: Array<'low'|'medium'|'high'|'urgent'> = ['low','medium','high','urgent']
const priorityMeta: Record<string, { color: string; label: string }> = {
  low:    { color: '#10b981', label: 'Low' },
  medium: { color: '#6366f1', label: 'Medium' },
  high:   { color: '#f59e0b', label: 'High' },
  urgent: { color: '#ef4444', label: 'Urgent' },
}
function cyclePriority() {
  if (!task.value) return
  const idx = priorityOrder.indexOf(task.value.priority)
  store.updateTask(task.value.id, { priority: priorityOrder[(idx + 1) % 4] })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<style scoped>
.td-modal-enter-active { animation: tdIn 0.25s cubic-bezier(0.34,1.1,0.64,1); }
.td-modal-leave-active { animation: tdIn 0.18s ease reverse; }
@keyframes tdIn {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
