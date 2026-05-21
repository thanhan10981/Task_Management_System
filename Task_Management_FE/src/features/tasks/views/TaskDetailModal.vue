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
              <span class="td-task-id">{{ shortTaskCode }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              <span class="td-breadcrumb-item font-semibold" style="color:var(--text-primary)">{{ task?.title?.slice(0,28) }}…</span>
            </div>
            <div class="flex items-center gap-1">
              <!-- <button class="td-topbar-btn" title="AI Create Task" @click="openAiCreateTask">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/>
                  <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z"/>
                </svg>
              </button> -->
              <button class="td-topbar-btn td-topbar-btn--danger" title="Move to trash" @click="showDeleteConfirm = true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
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
                  <button
                    class="td-desc-save"
                    :disabled="!descriptionDirty || savingDescription"
                    @click="saveDescription"
                  >
                    {{ savingDescription ? 'Saving...' : 'Save' }}
                  </button>
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
                  <button class="td-toolbar-btn" @mousedown.prevent @click="toggleList('ul')" title="Bullet list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
                  </button>
                  <!-- Ordered list -->
                  <button class="td-toolbar-btn" @mousedown.prevent @click="toggleList('ol')" title="Ordered list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" stroke-width="2"/><path d="M4 10h2" stroke-width="2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke-width="2"/></svg>
                  </button>
                  <span class="td-toolbar-divider"/>
                  <button
                    class="td-toolbar-btn td-toolbar-btn--ai"
                    :disabled="generatingDescription"
                    title="Generate with AI"
                    @mousedown.prevent
                    @click="generateInlineDescription"
                  >
                    <svg v-if="!generatingDescription" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                      <path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/>
                      <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z"/>
                    </svg>
                    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="td-spin">
                      <path d="M21 12a9 9 0 1 1-3-6.7"/>
                    </svg>
                  </button>
                </div>
                <div
                  ref="descRef"
                  class="td-editor"
                  contenteditable="true"
                  dir="ltr"
                  spellcheck="true"
                  data-placeholder="Add a description…"
                  @input="onDescInput"
                ></div>
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
                        @click="toggleSubtask(st.id)"
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
                          <UserProfileHover
                            v-if="store.getMember(st.assigneeId ?? '')"
                            :user="profileForMember(store.getMember(st.assigneeId!)!)"
                            placement="right"
                            @click.stop="toggleStAssigneePicker(st.id)"
                          >
                            <span
                              class="td-avatar-xxs cursor-pointer opacity-100"
                              :style="{ background: store.getMember(st.assigneeId!)!.color }"
                              :title="store.getMember(st.assigneeId!)!.name"
                            >{{ store.getMember(st.assigneeId!)!.initials }}</span>
                          </UserProfileHover>
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
                            @change="e => updateSubtaskDueDate(st.id, (e.target as HTMLInputElement).value)"
                          />
                        </div>

                        <!-- Delete -->
                        <button class="td-subtask-meta-btn opacity-0 group-hover:opacity-100" title="Delete" @click="deleteSubtask(st.id)">
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
                  <UserProfileHover :user="currentUserHoverProfile" placement="right">
                    <div class="td-avatar-xs" :style="{ background: currentUserHoverProfile.color }">
                      <img v-if="currentUserHoverProfile.avatarUrl" :src="currentUserHoverProfile.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                      <span v-else>{{ currentUserHoverProfile.initials }}</span>
                    </div>
                  </UserProfileHover>
                  <div class="td-comment-input-wrap gap-2">
                    <div class="relative w-full">
                      <textarea
                        v-model="newComment"
                        class="td-comment-textarea"
                        placeholder="Write a comment… (use @ to mention)"
                        rows="2"
                        @input="onCommentInput($event, 'comment')"
                        @keydown="onCommentKeydown($event, 'comment')"
                        @keydown.ctrl.enter="submitComment"
                      />
                      <!-- Mention Popover for new comment -->
                      <div v-if="mentionState.active && mentionState.target === 'comment'" class="td-mention-popover">
                        <div v-if="filteredMentionMembers.length === 0" class="td-popover-empty">No matching members</div>
                        <div
                          v-for="(m, idx) in filteredMentionMembers" :key="m.id"
                          class="td-popover-item"
                          :class="{ selected: mentionSelectedIndex === idx }"
                          @mousedown.prevent="insertMention(m)"
                        >
                          <span class="td-avatar-xxs" :style="{ background: m.color }">{{ m.initials }}</span>
                          {{ m.name }}
                        </div>
                      </div>
                    </div>
                    <div v-if="pendingCommentFiles.length > 0" class="flex flex-wrap gap-2 mt-2">
                      <div v-for="(file, idx) in pendingCommentFiles" :key="idx" class="td-comment-file-chip">
                        <img v-if="file.type.startsWith('image/')" :src="getObjectUrl(file)" class="td-comment-file-thumb" />
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span class="truncate max-w-[100px] text-xs">{{ file.name }}</span>
                        <button class="td-comment-file-remove" @click="removePendingCommentFile(idx)" title="Remove">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    <div class="flex justify-between items-center mt-1">
                      <label class="td-comment-upload-btn" title="Attach image">
                        <input type="file" multiple class="hidden" @change="onCommentFileSelect" accept="image/*,application/pdf" />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>Attach image</span>
                      </label>
                      <button class="td-comment-submit" :disabled="(!newComment.trim() && pendingCommentFiles.length === 0) || uploadingCommentFiles" @click="submitComment">
                        {{ uploadingCommentFiles ? 'Sending...' : 'Send' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Activity + comments merged -->
                <div class="flex flex-col gap-2 mt-2">
                  <template v-for="entry in mergedActivity" :key="entry.id">
                    <!-- Comment: card style -->
                    <div
                      v-if="entry.isComment"
                      class="td-comment-card"
                      :class="{ 'td-comment-card--highlight': highlightedCommentId === entry.id }"
                      :data-comment-id="entry.id"
                    >
                      <UserProfileHover :user="profileForAuthor(entry.authorId)" placement="right">
                        <div class="td-avatar-xs" :style="{ background: profileForAuthor(entry.authorId).color ?? '#94a3b8' }">
                          <img v-if="profileForAuthor(entry.authorId).avatarUrl" :src="profileForAuthor(entry.authorId).avatarUrl!" alt="avatar" class="w-full h-full object-cover">
                          <span v-else>{{ profileForAuthor(entry.authorId).initials }}</span>
                        </div>
                      </UserProfileHover>
                      <div class="td-comment-card-body">
                        <div class="flex items-center gap-2 mb-1">
                          <UserProfileHover :user="profileForAuthor(entry.authorId)" placement="top" inline>
                            <span class="td-activity-user">{{ store.getMember(entry.authorId)?.name ?? 'User' }}</span>
                          </UserProfileHover>
                          <span class="td-activity-time">{{ timeAgo(entry.createdAt) }}</span>
                          <button class="td-comment-action" @click="startReply(entry.id)">
                            Reply
                          </button>
                          <button
                            v-if="canRemoveComment(entry.authorId)"
                            class="td-comment-action danger"
                            @click="removeComment(entry.id)"
                          >
                            Remove
                          </button>
                        </div>
                        <p v-if="entry.text && !(entry.text === 'Attached an image' && getCommentAttachments(entry.id).length > 0)" class="td-comment-card-text">{{ entry.text }}</p>

                        <div v-if="getCommentAttachments(entry.id).length > 0" class="td-comment-media-grid mt-2">
                          <div v-for="att in getCommentAttachments(entry.id)" :key="att.id" class="td-comment-media-item" @click="openAttachmentPreview(att)">
                            <div v-if="att.type === 'image'" class="td-comment-media-frame">
                              <div v-if="isCommentImageLoading(att.id)" class="td-comment-media-loading">
                                <span class="td-comment-spinner" aria-label="Loading image" />
                              </div>
                              <img
                                v-if="getCommentImageUrl(att)"
                                :src="getCommentImageUrl(att)"
                                :alt="att.name"
                                class="td-comment-media-img"
                                @load="markCommentImageLoaded(att.id)"
                                @error="markCommentImageFailed(att.id)"
                              />
                              <div
                                v-else-if="!isCommentImageLoading(att.id)"
                                class="td-comment-media-file"
                              >
                                <span class="text-xs truncate max-w-full px-1">{{ att.name }}</span>
                              </div>
                            </div>
                            <div v-else class="td-comment-media-file">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                              <span class="text-xs truncate max-w-full px-1">{{ att.name }}</span>
                            </div>
                          </div>
                        </div>

                        <div v-if="entry.replies?.length" class="flex flex-col gap-1.5 mt-3">
                          <div
                            v-for="reply in entry.replies"
                            :key="reply.id"
                            class="td-comment-reply"
                            :class="{ 'td-comment-card--highlight': highlightedCommentId === reply.id }"
                            :data-comment-id="reply.id"
                          >
                            <UserProfileHover :user="profileForAuthor(reply.authorId)" placement="right">
                              <div
                                class="td-avatar-xxs"
                                :style="{ background: profileForAuthor(reply.authorId).color ?? '#94a3b8' }"
                              >
                                <img v-if="profileForAuthor(reply.authorId).avatarUrl" :src="profileForAuthor(reply.authorId).avatarUrl!" alt="avatar" class="w-full h-full object-cover">
                                <span v-else>{{ profileForAuthor(reply.authorId).initials }}</span>
                              </div>
                            </UserProfileHover>
                            <div class="min-w-0 flex-1">
                              <div class="flex items-center gap-2 mb-0.5">
                                <UserProfileHover :user="profileForAuthor(reply.authorId)" placement="top" inline>
                                  <span class="td-activity-user">{{ store.getMember(reply.authorId)?.name ?? 'User' }}</span>
                                </UserProfileHover>
                                <span class="td-activity-time">{{ timeAgo(reply.createdAt) }}</span>
                                <button
                                  v-if="canRemoveComment(reply.authorId)"
                                  class="td-comment-action danger"
                                  @click="removeComment(reply.id)"
                                >
                                  Remove
                                </button>
                              </div>
                              <p v-if="reply.text && !(reply.text === 'Attached an image' && getCommentAttachments(reply.id).length > 0)" class="td-comment-card-text">{{ reply.text }}</p>
                              
                              <div v-if="getCommentAttachments(reply.id).length > 0" class="td-comment-media-grid mt-2">
                                <div v-for="att in getCommentAttachments(reply.id)" :key="att.id" class="td-comment-media-item" @click="openAttachmentPreview(att)">
                                  <div v-if="att.type === 'image'" class="td-comment-media-frame">
                                    <div v-if="isCommentImageLoading(att.id)" class="td-comment-media-loading">
                                      <span class="td-comment-spinner" aria-label="Loading image" />
                                    </div>
                                    <img
                                      v-if="getCommentImageUrl(att)"
                                      :src="getCommentImageUrl(att)"
                                      :alt="att.name"
                                      class="td-comment-media-img"
                                      @load="markCommentImageLoaded(att.id)"
                                      @error="markCommentImageFailed(att.id)"
                                    />
                                    <div
                                      v-else-if="!isCommentImageLoading(att.id)"
                                      class="td-comment-media-file"
                                    >
                                      <span class="text-xs truncate max-w-full px-1">{{ att.name }}</span>
                                    </div>
                                  </div>
                                  <div v-else class="td-comment-media-file">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                    <span class="text-xs truncate max-w-full px-1">{{ att.name }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div v-if="replyingToCommentId === entry.id" class="td-reply-box">
                          <div class="relative w-full">
                            <textarea
                              v-model="replyText"
                              class="td-comment-textarea"
                              rows="2"
                              placeholder="Write a reply... (use @ to mention)"
                              @input="onCommentInput($event, 'reply')"
                              @keydown="onCommentKeydown($event, 'reply')"
                              @keydown.ctrl.enter="submitReply(entry.id)"
                            />
                            <!-- Mention Popover for reply -->
                            <div v-if="mentionState.active && mentionState.target === 'reply'" class="td-mention-popover" style="bottom: 100%; top: auto; margin-bottom: 4px;">
                              <div v-if="filteredMentionMembers.length === 0" class="td-popover-empty">No matching members</div>
                              <div
                                v-for="(m, idx) in filteredMentionMembers" :key="m.id"
                                class="td-popover-item"
                                :class="{ selected: mentionSelectedIndex === idx }"
                                @mousedown.prevent="insertMention(m)"
                              >
                                <span class="td-avatar-xxs" :style="{ background: m.color }">{{ m.initials }}</span>
                                {{ m.name }}
                              </div>
                            </div>
                          </div>
                          <!-- Pending reply files preview -->
                          <div v-if="pendingReplyFiles.length > 0" class="flex flex-wrap gap-2 mt-2">
                            <div v-for="(file, idx) in pendingReplyFiles" :key="idx" class="td-comment-file-chip">
                              <img v-if="file.type.startsWith('image/')" :src="getObjectUrl(file)" class="td-comment-file-thumb" />
                              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              <span class="truncate max-w-[80px] text-xs">{{ file.name }}</span>
                              <button class="td-comment-file-remove" @click="pendingReplyFiles.splice(idx, 1)" title="Remove">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          </div>
                          <div class="flex justify-between items-center mt-1">
                            <label class="td-comment-upload-btn" title="Attach image to reply">
                              <input type="file" multiple class="hidden" @change="onReplyFileSelect" accept="image/*,application/pdf" />
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              <span>Attach image</span>
                            </label>
                            <div class="flex gap-2">
                              <button class="td-comment-action" @click="cancelReply">Cancel</button>
                              <button
                                class="td-comment-submit"
                                :disabled="(!replyText.trim() && pendingReplyFiles.length === 0) || uploadingReplyFiles"
                                @click="submitReply(entry.id)"
                              >
                                {{ uploadingReplyFiles ? 'Sending...' : 'Reply' }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Activity log: compact line -->
                    <div v-else class="td-log-row">
                      <div class="td-log-dot"/>
                      <UserProfileHover :user="profileForAuthor(entry.authorId)" placement="right" inline>
                        <span class="td-log-user">{{ store.getMember(entry.authorId)?.name?.split(' ')[0] ?? 'User' }}</span>
                      </UserProfileHover>
                      <span class="td-log-text" :title="entry.text">{{ entry.text }}</span>
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
                  <span class="text-[13px] font-semibold">{{ uploadingAttachments ? 'Uploading...' : 'Drop files here or click to upload' }}</span>
                  <span class="text-xs" style="color:var(--text-subtle)">Images, PDFs, Docs…</span>
                </label>
                <input id="file-upload-input" type="file" multiple class="hidden" :disabled="uploadingAttachments" @change="onFileUpload" />
                <p v-if="attachmentUploadError" class="text-xs text-red-500 m-0">{{ attachmentUploadError }}</p>

                <div v-if="taskAttachments.length > 0" class="td-attach-grid mt-2">
                  <div v-for="att in taskAttachments" :key="att.id" class="td-attach-item group">
                    <button class="td-attach-preview-btn" type="button" @click="openAttachmentPreview(att)">
                    <img v-if="att.type === 'image'" :src="att.url" :alt="att.name" class="td-attach-img" />
                    <div v-else class="td-attach-file">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted)"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                      <span class="truncate w-full text-center">{{ att.name }}</span>
                      <span>{{ att.size }}</span>
                    </div>
                    </button>
                    <div class="td-attach-caption" :title="att.name">{{ att.name }}</div>
                    <button
                      class="td-attach-remove"
                      :disabled="deletingAttachmentId === att.id"
                      @click.stop="deleteAttachment(att)"
                    >
                      {{ deletingAttachmentId === att.id ? '...' : '×' }}
                    </button>
                  </div>
                </div>

                <Transition name="td-modal">
                  <div v-if="previewAttachment" class="td-preview-overlay" @click.self="closeAttachmentPreview">
                    <div class="td-preview-panel">
                      <div class="td-preview-head">
                        <div class="min-w-0">
                          <p class="td-preview-title">{{ previewAttachment.name }}</p>
                          <p class="td-preview-meta">{{ previewAttachment.format?.toUpperCase() || previewAttachment.resourceType || 'FILE' }} - {{ previewAttachment.size }}</p>
                        </div>
                        <button class="td-topbar-btn" title="Close preview" @click="closeAttachmentPreview">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <div class="td-preview-body">
                        <img
                          v-if="previewAttachment.type === 'image'"
                          :src="previewUrl || previewAttachment.url"
                          :alt="previewAttachment.name"
                          class="td-preview-image"
                        />
                        <iframe
                          v-else-if="canInlinePreview(previewAttachment)"
                          :src="previewUrl || previewAttachment.url"
                          class="td-preview-frame"
                          :title="previewAttachment.name"
                        />
                        <div v-else class="td-preview-empty">
                          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                          <p>Preview is not available for this file type.</p>
                          <a class="td-preview-link" :href="previewUrl || previewAttachment.url" target="_blank" rel="noreferrer">Open file</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
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
                <div class="relative" ref="priorityDropdownRef">
                  <button
                    class="td-status-trigger"
                    @click.stop="showPriorityDrop = !showPriorityDrop"
                  >
                    <span class="td-priority-badge" :class="`prio-${task.priority}`" style="flex:1; width:auto; text-align:center; margin-right: 8px;">
                      {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div v-if="showPriorityDrop" class="td-status-drop" @click.stop>
                    <div
                      v-for="p in priorityOptions" :key="p.value"
                      class="td-status-option"
                      :class="{ active: task.priority === p.value }"
                      @click="onPriorityChange(p.value)"
                    >
                      <span class="td-priority-badge" :class="`prio-${p.value}`" style="flex: 1; text-align:center;">
                        {{ p.label }}
                      </span>
                      <svg v-if="task.priority === p.value" class="ml-auto" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Group -->
              <div class="td-prop">
                <p class="td-prop-label">Group</p>
                <div class="relative" ref="groupDropdownRef">
                  <button
                    class="td-status-trigger"
                    @click.stop="showGroupDrop = !showGroupDrop"
                  >
                    <template v-if="currentGroup">
                      <span class="td-status-dot" :style="{ background: currentGroup.color ?? '#94a3b8' }"/>
                      <span class="truncate flex-1 text-left">{{ currentGroup.name }}</span>
                    </template>
                    <template v-else>
                      <span class="td-status-dot" style="background:var(--bg-surface-3);border:1px solid var(--border-medium)"/>
                      <span class="truncate flex-1 text-left" style="color:var(--text-muted)">No group</span>
                    </template>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div v-if="showGroupDrop" class="td-status-drop" @click.stop>
                    <div
                      class="td-status-option"
                      :class="{ active: !task.groupId }"
                      @click="onGroupChange('')"
                    >
                      <span class="td-status-dot" style="background:var(--bg-surface-3);border:1px solid var(--border-medium)"/>
                      <span class="flex-1">No group</span>
                      <svg v-if="!task.groupId" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div v-if="loadingGroups" class="td-popover-empty">Loading groups...</div>
                    <div
                      v-for="group in taskGroups"
                      :key="group.id"
                      class="td-status-option"
                      :class="{ active: task.groupId === group.id }"
                      @click="onGroupChange(group.id)"
                    >
                      <span class="td-status-dot" :style="{ background: group.color ?? '#94a3b8' }"/>
                      <span class="flex-1">{{ group.name }}</span>
                      <svg v-if="task.groupId === group.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div v-if="!loadingGroups && taskGroups.length === 0" class="td-popover-empty">No groups yet</div>
                  </div>
                </div>
              </div>

              <!-- Due Date -->
              <div class="td-prop">
                <p class="td-prop-label">Due Date</p>
                <input
                  type="datetime-local"
                  class="td-prop-input"
                  :value="toDateTimeLocalValue(task.due)"
                  @change="onDueDateChange"
                />
              </div>

              <!-- Start Date -->
              <div class="td-prop">
                <p class="td-prop-label">Start Date</p>
                <input
                  type="datetime-local"
                  class="td-prop-input"
                  :value="toDateTimeLocalValue(task.start)"
                  @change="onStartDateChange"
                />
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
                    <UserProfileHover :user="profileForMember(m)" placement="left">
                      <span class="td-avatar-xxs" :style="{ background: m.color }">
                        <img v-if="m.avatarUrl" :src="m.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                        <span v-else>{{ m.initials }}</span>
                      </span>
                    </UserProfileHover>
                    <UserProfileHover :user="profileForMember(m)" placement="left" inline>
                      <span>{{ m.name.split(' ')[0] }}</span>
                    </UserProfileHover>
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
                    <button @click="clearLabel">×</button>
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
                <p class="td-meta-row">Created {{ formatDateTime(task.createdAt) }}</p>
                <p class="td-meta-row mt-0.5">Updated {{ formatDateTime(task.updatedAt) }}</p>
              </div>

            </div><!-- /td-sidebar -->

          </div><!-- /td-body -->

          <Transition name="td-confirm">
            <div v-if="showDeleteConfirm" class="td-delete-layer" @click.self="showDeleteConfirm = false">
              <div class="td-delete-card" @click.stop>
                <div class="td-delete-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
                <p class="td-delete-title">Move this task to Trash?</p>
                <p class="td-delete-copy">"{{ task?.title }}" will be hidden from the board. You can restore it from Trash later.</p>
                <p v-if="deleteTaskError" class="td-delete-error">{{ deleteTaskError }}</p>
                <div class="td-delete-actions">
                  <button class="td-delete-btn td-delete-btn--ghost" :disabled="deletingTask" @click="showDeleteConfirm = false">Cancel</button>
                  <button class="td-delete-btn td-delete-btn--danger" :disabled="deletingTask" @click="confirmDeleteTask">
                    {{ deletingTask ? 'Moving...' : 'Move to Trash' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div><!-- /td-panel -->
        <AICreateTaskModal
          v-model="aiCreateOpen"
          :project-id="detailProjectId"
          :status-id="task?.status ?? null"
          :sprint-id="task?.sprint ?? null"
          :group-id="task?.groupId ?? null"
          @created="onAiTaskCreated"
        />
      </div><!-- /td-overlay -->
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { getFilePreviewUrl } from '@/api/cloudinary'
import { useToast } from '@/composables/useToast'
import UserProfileHover, { type UserHoverProfile } from '@/components/common/UserProfileHover.vue'
import { generateAiTaskDescription } from '@/features/tasks/services/ai-task.service'
import {
  useDeleteFileMutation,
  useSignedFileUploadMutation,
} from '@/features/files/composables/useFileMutations'
import type { TaskGroup } from '@/api/tasks'
import { fetchProjectGroupsQuery } from '@/features/tasks/composables/useTaskGroupsQuery'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectStore } from '@/stores/project.store'
import { useTaskStore } from '@/stores/task.store'
import type { Attachment, Comment as TaskComment, Member, Subtask } from '@/stores/task.store'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import AICreateTaskModal from '../components/AICreateTaskModal.vue'

// ── Props / Emits ─────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue: boolean
  taskId: string | null
  focusCommentId?: string | null
}>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  deleted: [taskId: string]
}>()

type MergedActivityEntry = {
  id: string
  authorId: string
  text: string
  createdAt: string
  isComment: boolean
  replies?: TaskComment[]
}

// ── Store ─────────────────────────────────────────────────────────────────────
const store = useTaskStore()
const toast = useToast()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const { currentProject, currentProjectId } = storeToRefs(projectStore)
const signedFileUploadMutation = useSignedFileUploadMutation()
const deleteFileMutation = useDeleteFileMutation()

const currentUserHoverProfile = computed<UserHoverProfile>(() => {
  const user = authStore.user
  const name = user?.fullName?.trim() || user?.email || 'User'
  return {
    id: user?.id,
    name,
    initials: initialsFromText(name),
    color: '#6366f1',
    email: user?.email,
    avatarUrl: user?.avatarUrl,
    coverUrl: user?.coverUrl,
    jobTitle: user?.jobTitle,
    phone: user?.phone,
    bio: user?.bio,
  }
})

function initialsFromText(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  return (parts.length ? parts.slice(0, 2).map((part) => part.charAt(0)).join('') : 'U').toUpperCase()
}

function profileForMember(member: Member): UserHoverProfile {
  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    color: member.color,
    role: member.role,
    email: member.email,
    avatarUrl: member.avatarUrl,
    coverUrl: member.coverUrl,
    jobTitle: member.jobTitle,
    phone: member.phone,
    bio: member.bio,
  }
}

function profileForAuthor(authorId: string): UserHoverProfile {
  const member = store.getMember(authorId)
  if (member) return profileForMember(member)
  if (authorId === authStore.user?.id) return currentUserHoverProfile.value
  return { id: authorId, name: 'User', initials: '?', color: '#94a3b8' }
}

// ── Task ref ──────────────────────────────────────────────────────────────────
const task = computed(() => (props.taskId ? store.getTask(props.taskId) : null))
const detailProjectId = computed(
  () => currentProjectId.value ?? task.value?.projectId ?? store.loadedProjectId
)
const shortTaskCode = computed(() => `T-${task.value?.id?.slice(-5) ?? ''}`)
const showDeleteConfirm = ref(false)
const deletingTask = ref(false)
const deleteTaskError = ref('')
const aiCreateOpen = ref(false)
const progress = computed(() =>
  props.taskId ? store.subtaskProgress(props.taskId) : { done: 0, total: 0 }
)
const sortedSubtasks = computed(() => {
  if (!props.taskId) return []
  const all = store.subtasksByTask(props.taskId)
  return [...all.filter((s) => !s.completed), ...all.filter((s) => s.completed)]
})
const taskAttachments = computed(() =>
  props.taskId ? store.attachmentsByTaskOnly(props.taskId) : []
)
const highlightedCommentId = ref<string | null>(null)
const commentImagePreviewUrls = ref<Record<string, string>>({})
const commentImagePreviewLoading = ref<Record<string, boolean>>({})
const commentThreads = computed(() => {
  if (!props.taskId) return []
  const all = store.commentsByTask(props.taskId)
  const repliesByParent = new Map<string, typeof all>()

  all.forEach((comment) => {
    if (!comment.parentCommentId) return
    const replies = repliesByParent.get(comment.parentCommentId) ?? []
    replies.push(comment)
    repliesByParent.set(comment.parentCommentId, replies)
  })

  return all
    .filter((comment) => !comment.parentCommentId)
    .map((comment) => ({
      ...comment,
      replies: [...(repliesByParent.get(comment.id) ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }))
})
const mergedActivity = computed<MergedActivityEntry[]>(() => {
  if (!props.taskId) return []
  const cmts = commentThreads.value.map((c) => ({
    id: c.id,
    authorId: c.authorId,
    text: c.text,
    createdAt: c.createdAt,
    replies: c.replies,
    isComment: true,
  }))
  const acts = store.activityByTask(props.taskId).map((a) => ({
    id: a.id,
    authorId: a.authorId,
    text: a.action,
    createdAt: a.createdAt,
    isComment: false,
  }))
  return [...cmts, ...acts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

function getCommentElement(commentId: string) {
  const escapedId = typeof CSS !== 'undefined' && CSS.escape
    ? CSS.escape(commentId)
    : commentId.replace(/["\\]/g, '\\$&')
  return document.querySelector<HTMLElement>(`[data-comment-id="${escapedId}"]`)
}

async function scrollToFocusedComment() {
  const commentId = props.focusCommentId
  if (!props.modelValue || !commentId) return

  await nextTick()
  const element = getCommentElement(commentId)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  highlightedCommentId.value = commentId
  window.setTimeout(() => {
    if (highlightedCommentId.value === commentId) {
      highlightedCommentId.value = null
    }
  }, 2600)
}

watch(
  [
    () => props.modelValue,
    () => props.taskId,
    () => props.focusCommentId,
    () => mergedActivity.value.length,
  ],
  () => {
    void scrollToFocusedComment()
  },
  { immediate: true }
)

watch(
  () => [props.modelValue, props.taskId] as const,
  async ([open, id]) => {
    if (!open || !id) return
    showDeleteConfirm.value = false
    deleteTaskError.value = ''
    await store.loadTaskDetail(id)
  },
  { immediate: true }
)

watch(
  () =>
    store.attachments
      .filter(
        (attachment) => attachment.commentId && attachment.type === 'image' && attachment.fileId
      )
      .map((attachment) => attachment.fileId as string),
  (fileIds) => {
    fileIds.forEach((fileId) => {
      if (commentImagePreviewUrls.value[fileId] || commentImagePreviewLoading.value[fileId]) return

      commentImagePreviewLoading.value = {
        ...commentImagePreviewLoading.value,
        [fileId]: true,
      }

      void getFilePreviewUrl(fileId)
        .then((url) => {
          commentImagePreviewUrls.value = {
            ...commentImagePreviewUrls.value,
            [fileId]: url,
          }
        })
        .catch(() => {
          store.attachments
            .filter((attachment) => attachment.fileId === fileId)
            .forEach((attachment) => markCommentImageFailed(attachment.id))
        })
        .finally(() => {
          const { [fileId]: _done, ...rest } = commentImagePreviewLoading.value
          commentImagePreviewLoading.value = rest
        })
    })
  },
  { immediate: true }
)

async function confirmDeleteTask() {
  if (!task.value) return

  deletingTask.value = true
  deleteTaskError.value = ''

  try {
    const deletedTaskId = task.value.id
    await store.deleteTaskRemote(deletedTaskId, currentProjectId.value)
    showDeleteConfirm.value = false
    emit('deleted', deletedTaskId)
    emit('update:modelValue', false)
  } catch (error) {
    deleteTaskError.value =
      error instanceof Error ? error.message : 'Cannot move this task to Trash.'
  } finally {
    deletingTask.value = false
  }
}

async function onAiTaskCreated() {
  if (detailProjectId.value) {
    await store.loadProjectBoard(detailProjectId.value)
  }

  if (task.value) {
    await store.loadTaskDetail(task.value.id)
  }
}

// ── Title editing ─────────────────────────────────────────────────────────────
const titleRef = ref<HTMLElement | null>(null)
watch(
  () => props.taskId,
  async () => {
    await nextTick()
    if (titleRef.value && task.value) {
      titleRef.value.textContent = task.value.title
    }
  }
)
async function onTitleBlur() {
  if (!task.value || !titleRef.value) return
  const newTitle = titleRef.value.textContent?.trim() || task.value.title
  if (newTitle === task.value.title) return
  await store.updateTaskRemote(task.value.id, { title: newTitle })
}

// ── Description ───────────────────────────────────────────────────────────────
const descRef = ref<HTMLElement | null>(null)
const descHtml = ref('')
const descriptionDirty = ref(false)
const savingDescription = ref(false)
const generatingDescription = ref(false)

function syncDescriptionFromTask() {
  if (!props.modelValue || !descRef.value) return
  if (descriptionDirty.value) return

  const serverDesc = task.value?.description ?? ''
  descHtml.value = serverDesc
  const renderedDesc = renderDescriptionForEditor(serverDesc)
  if (descRef.value.innerHTML !== renderedDesc) {
    descRef.value.innerHTML = renderedDesc
  }
}

watch(
  () => props.taskId,
  async (id) => {
    if (!id) return
    await nextTick()
    const t = store.getTask(id)
    descHtml.value = t?.description ?? ''
    descriptionDirty.value = false
    if (descRef.value) descRef.value.innerHTML = renderDescriptionForEditor(t?.description ?? '')
  },
  { immediate: true }
)

watch(
  [() => props.modelValue, () => task.value?.description, descRef],
  async ([open]) => {
    if (!open) return
    await nextTick()
    syncDescriptionFromTask()
  },
  { immediate: true }
)
function fmt(cmd: string) {
  ensureDescriptionSelection()
  document.execCommand(cmd, false)
  descRef.value?.focus()
  markDescriptionDirty()
}
function onDescInput() {
  markDescriptionDirty()
}
function markDescriptionDirty() {
  if (!descRef.value) return
  descHtml.value = descRef.value.innerHTML
  descriptionDirty.value = true
}
async function saveDescription() {
  if (!task.value || !descRef.value) return
  const nextDescription = descRef.value.innerHTML
  savingDescription.value = true

  try {
    await store.updateTaskRemote(task.value.id, { description: nextDescription })
    const refreshed = store.getTask(task.value.id)
    const serverDesc = refreshed?.description ?? ''
    descHtml.value = serverDesc
    await nextTick()
    if (descRef.value) descRef.value.innerHTML = renderDescriptionForEditor(serverDesc)
    descriptionDirty.value = false
  } finally {
    savingDescription.value = false
  }
}

async function generateInlineDescription() {
  if (!task.value || !descRef.value) return

  generatingDescription.value = true
  try {
    const currentDescription = normalizeEditorText(descRef.value.innerText || '')
    const generatedMarkdown = await generateAiTaskDescription(task.value.title, currentDescription)
    const mergedMarkdown = mergeInlineAiMarkdown(currentDescription, generatedMarkdown)
    descRef.value.innerHTML = renderDescriptionForEditor(mergedMarkdown)
    descHtml.value = descRef.value.innerHTML
    descriptionDirty.value = true
    const createdSubtasks = await createSuggestedSubtasksFromMarkdown(generatedMarkdown)
    toast.success('AI description inserted')
    if (createdSubtasks > 0) {
      toast.success(`${createdSubtasks} suggested subtask${createdSubtasks > 1 ? 's' : ''} added`)
    }
  } catch (error) {
    toast.error(extractInlineAiError(error))
  } finally {
    generatingDescription.value = false
  }
}

function toggleList(type: 'ul' | 'ol') {
  if (!descRef.value) return
  ensureDescriptionSelection()
  const command = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'
  const hadList = Boolean(descRef.value.querySelector(type))
  const executed = document.execCommand(command, false)

  if (!executed || (!hadList && !descRef.value.querySelector(type))) {
    wrapCurrentDescriptionLines(type)
  }

  markDescriptionDirty()
}
function ensureDescriptionSelection() {
  if (!descRef.value) return
  descRef.value.focus()

  const selection = window.getSelection()
  if (
    selection?.rangeCount &&
    selection.anchorNode &&
    descRef.value.contains(selection.anchorNode)
  ) {
    return
  }

  const range = document.createRange()
  range.selectNodeContents(descRef.value)
  range.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(range)
}
function wrapCurrentDescriptionLines(type: 'ul' | 'ol') {
  if (!descRef.value) return
  const tag = type === 'ul' ? 'ul' : 'ol'
  const lines = (descRef.value.innerText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    descRef.value.innerHTML = `<${tag}><li><br></li></${tag}>`
    return
  }

  descRef.value.innerHTML = `<${tag}>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</${tag}>`
}
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderDescriptionForEditor(value: string) {
  const normalized = value.replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''
  if (/<[a-z][\s\S]*>/i.test(normalized)) return normalized

  const lines = normalized.split('\n')
  const output: string[] = []
  let paragraph: string[] = []
  let listOpen = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    output.push(`<p>${paragraph.join('<br>')}</p>`)
    paragraph = []
  }

  const closeList = () => {
    if (!listOpen) return
    output.push('</ul>')
    listOpen = false
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      closeList()
      return
    }

    const heading = trimmed.match(/^(#{2,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      closeList()
      output.push(`<h3>${escapeHtml(heading[2])}</h3>`)
      return
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      if (!listOpen) {
        output.push('<ul>')
        listOpen = true
      }
      output.push(`<li>${escapeHtml(bullet[1])}</li>`)
      return
    }

    closeList()
    paragraph.push(escapeHtml(trimmed))
  })

  flushParagraph()
  closeList()

  return output.join('')
}

function normalizeEditorText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function mergeInlineAiMarkdown(currentDescription: string, generatedMarkdown: string) {
  const current = normalizeEditorText(currentDescription)
  const generated = normalizeEditorText(generatedMarkdown)
  if (!current) return generated

  const aiSections = extractAiSections(generated)
  const base = removeExistingAiSections(current)
  return [base, aiSections].filter(Boolean).join('\n\n')
}

function extractAiSections(markdown: string) {
  const sectionStart = findFirstAiSectionIndex(markdown)
  if (sectionStart < 0) return markdown
  return markdown.slice(sectionStart).trim()
}

async function createSuggestedSubtasksFromMarkdown(markdown: string) {
  if (!task.value) return 0

  const titles = extractSuggestedSubtaskTitles(markdown)
  if (!titles.length) return 0

  const existingTitles = new Set(
    store
      .subtasksByTask(task.value.id)
      .map((subtask) => subtask.title.trim().toLowerCase())
      .filter(Boolean)
  )
  const uniqueTitles = titles.filter((title) => !existingTitles.has(title.toLowerCase()))

  for (const title of uniqueTitles) {
    await store.createSubtaskRemote(task.value.id, title)
    existingTitles.add(title.toLowerCase())
  }

  return uniqueTitles.length
}

function extractSuggestedSubtaskTitles(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const headingIndex = lines.findIndex((line) => /^##\s+Suggested Subtasks\s*$/i.test(line.trim()))

  if (headingIndex < 0) return []

  const sectionLines: string[] = []
  for (const line of lines.slice(headingIndex + 1)) {
    if (/^##\s+/.test(line.trim())) break
    sectionLines.push(line)
  }

  return sectionLines
    .map(
      (line) =>
        line
          .trim()
          .match(/^[-*]\s+(.+)$/)?.[1]
          ?.trim() ?? ''
    )
    .map((title) => title.replace(/\s+/g, ' ').slice(0, 255))
    .filter(Boolean)
}

function removeExistingAiSections(markdown: string) {
  const sectionStart = findFirstAiSectionIndex(markdown)
  if (sectionStart < 0) return markdown.trim()
  return markdown.slice(0, sectionStart).trim()
}

function findFirstAiSectionIndex(markdown: string) {
  const matches = [
    markdown.search(/^##\s+Behavior\b/im),
    markdown.search(/^##\s+Acceptance Criteria\b/im),
    markdown.search(/^##\s+Suggested Subtasks\b/im),
    markdown.search(/^Behavior\s*$/im),
    markdown.search(/^Acceptance Criteria\s*$/im),
    markdown.search(/^Suggested Subtasks\s*$/im),
  ].filter((index) => index >= 0)

  return matches.length ? Math.min(...matches) : -1
}

function extractInlineAiError(error: unknown) {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || (error instanceof Error ? error.message : 'Cannot generate description')
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
async function commitSubtask() {
  if (!task.value) return
  if (newSubtaskTitle.value.trim()) {
    await store.createSubtaskRemote(task.value.id, newSubtaskTitle.value.trim())
    newSubtaskTitle.value = ''
  }
  addingSubtask.value = false
}
function onSubtaskBackspace() {
  if (!newSubtaskTitle.value) {
    addingSubtask.value = false
  }
}
async function startEditSubtask(st: Subtask) {
  editingSubtaskId.value = st.id
  editingSubtaskTitle.value = st.title
  await nextTick()
  editInputRef.value?.focus()
}
async function saveSubtaskEdit(id: string) {
  if (editingSubtaskTitle.value.trim()) {
    await store.updateSubtaskRemote(props.taskId ?? '', id, {
      title: editingSubtaskTitle.value.trim(),
    })
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
async function toggleSubtask(subtaskId: string) {
  if (!props.taskId) return
  await store.toggleSubtaskRemote(props.taskId, subtaskId)
}
async function updateSubtaskDueDate(subtaskId: string, dueDate: string) {
  if (!props.taskId) return
  await store.updateSubtaskRemote(props.taskId, subtaskId, {
    dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
  })
}
async function deleteSubtask(subtaskId: string) {
  if (!props.taskId) return
  await store.deleteSubtaskRemote(props.taskId, subtaskId)
}
// Close picker on outside click
function onModalClick() {
  stAssigneePickerId.value = null
  showStatusDrop.value = false
  showPriorityDrop.value = false
  showGroupDrop.value = false
}

// Subtask date picker
const stDateInputs: Record<string, HTMLInputElement> = {}
function openStDatePicker(id: string) {
  const el = stDateInputs[id]
  if (!el) return
  try {
    el.showPicker()
  } catch {
    el.click()
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────
const newComment = ref('')
const replyingToCommentId = ref<string | null>(null)
const replyText = ref('')

// Mention Logic
const mentionState = ref({
  active: false,
  query: '',
  target: '' as 'comment' | 'reply',
  cursorPos: 0,
  startIdx: 0,
})
const mentionSelectedIndex = ref(0)

const filteredMentionMembers = computed(() => {
  const q = mentionState.value.query.toLowerCase()
  return store.members.filter((m) => m.name.toLowerCase().includes(q))
})

function onCommentInput(e: Event, target: 'comment' | 'reply') {
  const el = e.target as HTMLTextAreaElement
  const val = el.value
  const cursor = el.selectionStart

  const lastAtIdx = val.lastIndexOf('@', cursor - 1)
  if (lastAtIdx >= 0) {
    if (lastAtIdx === 0 || /[\s\n]/.test(val[lastAtIdx - 1])) {
      const query = val.slice(lastAtIdx + 1, cursor)
      if (!/\s/.test(query)) {
        mentionState.value = {
          active: true,
          query,
          target,
          cursorPos: cursor,
          startIdx: lastAtIdx,
        }
        mentionSelectedIndex.value = 0
        return
      }
    }
  }
  mentionState.value.active = false
}

function onCommentKeydown(e: KeyboardEvent, target: 'comment' | 'reply') {
  if (!mentionState.value.active || mentionState.value.target !== target) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    mentionSelectedIndex.value =
      (mentionSelectedIndex.value + 1) % filteredMentionMembers.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mentionSelectedIndex.value =
      (mentionSelectedIndex.value - 1 + filteredMentionMembers.value.length) %
      filteredMentionMembers.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const member = filteredMentionMembers.value[mentionSelectedIndex.value]
    if (member) insertMention(member)
  } else if (e.key === 'Escape') {
    mentionState.value.active = false
  }
}

function insertMention(member: Member) {
  const { target, startIdx, cursorPos } = mentionState.value
  const replacement = `@${member.name} `

  if (target === 'comment') {
    const text = newComment.value
    newComment.value = text.slice(0, startIdx) + replacement + text.slice(cursorPos)
  } else {
    const text = replyText.value
    replyText.value = text.slice(0, startIdx) + replacement + text.slice(cursorPos)
  }

  mentionState.value.active = false
}

const pendingCommentFiles = ref<File[]>([])
const uploadingCommentFiles = ref(false)
const pendingReplyFiles = ref<File[]>([])
const uploadingReplyFiles = ref(false)

// Object URL cache for local file previews
const objectUrlCache = new WeakMap<File, string>()
function getObjectUrl(file: File): string {
  if (!objectUrlCache.has(file)) {
    objectUrlCache.set(file, URL.createObjectURL(file))
  }
  return objectUrlCache.get(file)!
}

function onCommentFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    pendingCommentFiles.value.push(...Array.from(input.files))
  }
  input.value = ''
}

function onReplyFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    pendingReplyFiles.value.push(...Array.from(input.files))
  }
  input.value = ''
}

function removePendingCommentFile(idx: number) {
  pendingCommentFiles.value.splice(idx, 1)
}

async function submitComment() {
  if (!task.value || (!newComment.value.trim() && pendingCommentFiles.value.length === 0)) return
  const text =
    newComment.value.trim() || (pendingCommentFiles.value.length > 0 ? 'Attached an image' : '')
  const projectId = detailProjectId.value
  if (pendingCommentFiles.value.length > 0 && !projectId) {
    toast.error('Please select a project before uploading comment images.')
    return
  }
  const mentionIds = store.members
    .filter((m) => new RegExp(`@${m.name}(?:\\s|$)`).test(text))
    .map((m) => m.id)

  uploadingCommentFiles.value = true
  try {
    const created = await store.addCommentRemote(task.value.id, text, undefined, mentionIds)
    if (created && created.id && pendingCommentFiles.value.length > 0 && projectId) {
      const folderPath = buildCommentAttachmentFolderPath(created.id)
      await Promise.all(
        pendingCommentFiles.value.map(async (file) => {
          const result = await signedFileUploadMutation.mutateAsync({
            projectId: projectId!,
            file,
            taskId: task.value!.id,
            commentId: created.id,
            folderPath,
          })
          store.addAttachment(task.value!.id, {
            fileId: result.id ?? null,
            name: result.originalFilename || file.name,
            url: result.secureUrl,
            type: result.resourceType === 'image' ? 'image' : 'file',
            format: result.format,
            resourceType: result.resourceType,
            size: formatFileSize(result.bytes || file.size),
            commentId: result.commentId ?? created.id,
          })
        })
      )
    }
    await store.loadTaskDetail(task.value.id)
    newComment.value = ''
  } catch (error) {
    console.error('Failed to submit comment with attachment', error)
  } finally {
    uploadingCommentFiles.value = false
    pendingCommentFiles.value = []
  }
}

async function submitReply(commentId: string) {
  if (!task.value || (!replyText.value.trim() && pendingReplyFiles.value.length === 0)) return
  const text =
    replyText.value.trim() || (pendingReplyFiles.value.length > 0 ? 'Attached an image' : '')
  const projectId = detailProjectId.value
  if (pendingReplyFiles.value.length > 0 && !projectId) {
    toast.error('Please select a project before uploading reply images.')
    return
  }
  const mentionIds = store.members
    .filter((m) => new RegExp(`@${m.name}(?:\\s|$)`).test(text))
    .map((m) => m.id)

  uploadingReplyFiles.value = true
  try {
    const created = await store.addCommentRemote(task.value.id, text, commentId, mentionIds)
    if (created && created.id && pendingReplyFiles.value.length > 0 && projectId) {
      const folderPath = buildCommentAttachmentFolderPath(created.id)
      await Promise.all(
        pendingReplyFiles.value.map(async (file) => {
          const result = await signedFileUploadMutation.mutateAsync({
            projectId: projectId!,
            file,
            taskId: task.value!.id,
            commentId: created.id,
            folderPath,
          })
          store.addAttachment(task.value!.id, {
            fileId: result.id ?? null,
            name: result.originalFilename || file.name,
            url: result.secureUrl,
            type: result.resourceType === 'image' ? 'image' : 'file',
            format: result.format,
            resourceType: result.resourceType,
            size: formatFileSize(result.bytes || file.size),
            commentId: result.commentId ?? created.id,
          })
        })
      )
    }
    await store.loadTaskDetail(task.value.id)
    cancelReply()
  } catch (error) {
    console.error('Failed to submit reply with attachment', error)
  } finally {
    uploadingReplyFiles.value = false
    pendingReplyFiles.value = []
  }
}
function startReply(commentId: string) {
  replyingToCommentId.value = commentId
  replyText.value = ''
  pendingReplyFiles.value = []
}
function cancelReply() {
  replyingToCommentId.value = null
  replyText.value = ''
  pendingReplyFiles.value = []
}
async function removeComment(commentId: string) {
  if (!task.value) return
  await store.deleteCommentRemote(task.value.id, commentId)
  if (replyingToCommentId.value === commentId) cancelReply()
}
function canRemoveComment(authorId: string) {
  return Boolean(authStore.user?.id && authStore.user.id === authorId)
}

function getCommentAttachments(commentId: string) {
  return store.attachments.filter((a) => a.commentId === commentId)
}

function getCommentImageUrl(attachment: Attachment) {
  return attachment.fileId ? commentImagePreviewUrls.value[attachment.fileId] : attachment.url
}

// ── File upload ───────────────────────────────────────────────────────────────
const uploadingAttachments = ref(false)
const deletingAttachmentId = ref<string | null>(null)
const attachmentUploadError = ref('')
const previewAttachment = ref<Attachment | null>(null)
const previewUrl = ref('')
const commentImageLoaded = ref<Record<string, boolean>>({})

async function onFileUpload(e: Event) {
  if (!task.value) return
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files) return

  const projectId = detailProjectId.value
  if (!projectId) {
    attachmentUploadError.value = 'Please select a project before uploading attachments.'
    input.value = ''
    return
  }

  uploadingAttachments.value = true
  attachmentUploadError.value = ''

  try {
    const folderPath = buildTaskAttachmentFolderPath()
    const uploadedFiles = await Promise.all(
      Array.from(files).map(async (file) => {
        const result = await signedFileUploadMutation.mutateAsync({
          projectId,
          file,
          taskId: task.value!.id,
          folderPath,
        })

        return { file, result }
      })
    )

    uploadedFiles.forEach(({ file, result }) => {
      store.addAttachment(task.value!.id, {
        fileId: result.id ?? null,
        name: result.originalFilename || file.name,
        url: result.secureUrl,
        type: result.resourceType === 'image' ? 'image' : 'file',
        format: result.format,
        resourceType: result.resourceType,
        size: formatFileSize(result.bytes || file.size),
      })
    })

    await store.loadTaskDetail(task.value!.id)
  } catch (error) {
    attachmentUploadError.value =
      error instanceof Error ? error.message : 'Cannot upload attachments.'
  } finally {
    uploadingAttachments.value = false
    input.value = ''
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function deleteAttachment(attachment: Attachment) {
  if (!task.value) return
  const fileId = attachment.fileId ?? attachment.id
  if (!fileId) return

  deletingAttachmentId.value = attachment.id
  attachmentUploadError.value = ''

  try {
    await deleteFileMutation.mutateAsync(fileId)
    if (previewAttachment.value?.id === attachment.id) {
      closeAttachmentPreview()
    }
    await store.loadTaskDetail(task.value.id)
  } catch (error) {
    attachmentUploadError.value =
      error instanceof Error ? error.message : 'Cannot delete attachment.'
  } finally {
    deletingAttachmentId.value = null
  }
}

async function openAttachmentPreview(attachment: Attachment) {
  previewAttachment.value = attachment
  previewUrl.value = attachment.url

  if (attachment.fileId) {
    try {
      previewUrl.value =
        attachment.type === 'image' && commentImagePreviewUrls.value[attachment.fileId]
          ? commentImagePreviewUrls.value[attachment.fileId]
          : await getFilePreviewUrl(attachment.fileId)
    } catch {
      previewUrl.value = attachment.url
    }
  }
}

function closeAttachmentPreview() {
  previewAttachment.value = null
  previewUrl.value = ''
}

function canInlinePreview(attachment: Attachment) {
  const format = attachment.format?.toLowerCase()
  return ['pdf', 'txt', 'json', 'csv'].includes(format ?? '')
}

function isCommentImageLoading(attachmentId: string) {
  return commentImageLoaded.value[attachmentId] !== true
}

function markCommentImageLoaded(attachmentId: string) {
  commentImageLoaded.value = {
    ...commentImageLoaded.value,
    [attachmentId]: true,
  }
}

function markCommentImageFailed(attachmentId: string) {
  commentImageLoaded.value = {
    ...commentImageLoaded.value,
    [attachmentId]: true,
  }
}

function buildTaskAttachmentFolderPath() {
  const projectFolderName = slugifyFolderSegment(
    currentProject.value?.name || currentProjectId.value || 'project'
  )
  return `${projectFolderName}/task-attachments`
}

function buildCommentAttachmentFolderPath(commentId: string) {
  return `comments/${commentId}`
}

function slugifyFolderSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
  )
}

// ── Assignees ─────────────────────────────────────────────────────────────────
const showAssigneePicker = ref(false)
const assigneeSearch = ref('')
const assigneeSearchRef = ref<HTMLInputElement | null>(null)

const filteredMembers = computed(() =>
  store.members.filter((m) => m.name.toLowerCase().includes(assigneeSearch.value.toLowerCase()))
)

async function toggleAssigneePicker() {
  showAssigneePicker.value = !showAssigneePicker.value
  if (showAssigneePicker.value) {
    assigneeSearch.value = ''
    await nextTick()
    assigneeSearchRef.value?.focus()
  }
}
async function toggleAssignee(m: Member) {
  if (!task.value) return
  const existing = task.value.assignees.find((a) => a.id === m.id)
  if (existing) await store.unassignTaskMemberRemote(task.value.id, m.id)
  else await store.assignTaskMemberRemote(task.value.id, m.id)
}
async function removeAssignee(id: string) {
  if (!task.value) return
  await store.unassignTaskMemberRemote(task.value.id, id)
}

// ── Labels ────────────────────────────────────────────────────────────────────
const showLabelPicker = ref(false)
const labelSearch = ref('')
const labelSearchRef = ref<HTMLInputElement | null>(null)

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

const LABEL_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#ef4444',
  '#f97316',
]
async function createOrPickLabel() {
  const name = labelSearch.value.trim()
  if (!name) return
  if (!store.labelPresets[name]) {
    const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]
    store.labelPresets[name] = { bg: color + '20', color }
  }
  await setLabel(name)
}

async function setLabel(lbl: string) {
  if (!task.value) return
  const style = store.labelPresets[lbl]
  await store.updateTaskLabelRemote(task.value.id, lbl, style.bg, style.color)
  showLabelPicker.value = false
}

async function clearLabel() {
  if (!task.value) return
  await store.updateTaskLabelRemote(task.value.id, '')
  showLabelPicker.value = false
}

// ── Status / Priority ─────────────────────────────────────────────────────────
const showStatusDrop = ref(false)
const showPriorityDrop = ref(false)
const currentColumn = computed(() => store.columns.find((c) => c.id === task.value?.status))
const showGroupDrop = ref(false)
const taskGroups = ref<TaskGroup[]>([])
const loadingGroups = ref(false)
const currentGroup = computed(() =>
  taskGroups.value.find((group) => group.id === task.value?.groupId)
)

async function loadTaskGroups(projectId: string | null) {
  if (!projectId) {
    taskGroups.value = []
    return
  }

  loadingGroups.value = true
  try {
    taskGroups.value = await fetchProjectGroupsQuery(projectId)
  } catch (error) {
    console.error('Failed to load task groups:', error)
    taskGroups.value = []
  } finally {
    loadingGroups.value = false
  }
}

watch(
  [() => props.modelValue, currentProjectId],
  async ([open, projectId]) => {
    if (!open) return
    await loadTaskGroups(projectId)
  },
  { immediate: true }
)

async function onStatusChange2(colId: string) {
  if (!task.value) return
  await store.updateTaskRemote(task.value.id, { statusId: colId })
  showStatusDrop.value = false
}

async function onGroupChange(groupId: string) {
  if (!task.value) return
  await store.updateTaskRemote(task.value.id, { groupId: groupId || null })
  showGroupDrop.value = false
}

const priorityOptions = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]
async function onPriorityChange(priority: string) {
  if (!task.value) return
  await store.updateTaskRemote(task.value.id, {
    priority: priority.toUpperCase(),
  })
  showPriorityDrop.value = false
}
async function onDueDateChange(e: Event) {
  if (!task.value) return
  const value = (e.target as HTMLInputElement).value
  await store.updateTaskRemote(task.value.id, {
    dueDate: value ? new Date(value).toISOString() : null,
  })
}
async function onStartDateChange(e: Event) {
  if (!task.value) return
  const value = (e.target as HTMLInputElement).value
  await store.updateTaskRemote(task.value.id, {
    startDate: value ? new Date(value).toISOString() : null,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateTimeLocalValue(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
function formatDateTime(d: string) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
.td-topbar-btn--danger {
  color: #ef4444;
}
.td-topbar-btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}
.td-toolbar-btn--ai {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
}
.td-toolbar-btn--ai:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.14);
  color: #6d28d9;
}
.td-toolbar-btn--ai:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.td-spin {
  animation: tdSpin 0.8s linear infinite;
}
@keyframes tdSpin {
  to { transform: rotate(360deg); }
}
.td-editor :deep(h3) {
  margin: 18px 0 8px;
  color: var(--text-heading);
  font-size: 15px;
  font-weight: 800;
}
.td-editor :deep(p) {
  margin: 0 0 12px;
}
.td-editor :deep(ul) {
  margin: 0 0 12px 18px;
  padding: 0;
}
.td-editor :deep(li) {
  margin: 5px 0;
}
.td-confirm-enter-active,
.td-confirm-leave-active {
  transition: opacity 0.16s ease;
}
.td-confirm-enter-from,
.td-confirm-leave-to {
  opacity: 0;
}
.td-delete-layer {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 50% 42%, rgba(239, 68, 68, 0.16), transparent 34%),
    rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(8px);
}
.td-delete-card {
  width: min(380px, 100%);
  border: 1px solid rgba(239, 68, 68, 0.22);
  border-radius: 22px;
  padding: 22px;
  background: var(--bg-surface);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.34);
  text-align: center;
}
.td-delete-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(249, 115, 22, 0.12));
}
.td-delete-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-heading);
}
.td-delete-copy {
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-muted);
}
.td-delete-error {
  margin-top: 10px;
  font-size: 12px;
  color: #ef4444;
}
.td-delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.td-delete-btn {
  height: 34px;
  padding: 0 13px;
  border: 0;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.14s ease, opacity 0.14s ease;
}
.td-delete-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
.td-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.td-delete-btn--ghost {
  color: var(--text-muted);
  background: var(--bg-surface-2);
}
.td-delete-btn--danger {
  color: #fff;
  background: linear-gradient(135deg, #ef4444, #f97316);
  box-shadow: 0 10px 24px rgba(239, 68, 68, 0.28);
}
.td-mention-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 220px;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-base);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.18);
  z-index: 100;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}

/* ── Comment upload button ───────────────────────────────────────────── */
.td-comment-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-surface-2);
  border: 1.5px solid var(--border-base);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  user-select: none;
}
.td-comment-upload-btn:hover {
  color: var(--text-primary);
  background: var(--bg-surface-3);
  border-color: var(--border-medium);
}

/* ── Comment file chip (pending) ─────────────────────────────────────── */
.td-comment-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border-radius: 8px;
  border: 1.5px solid var(--border-base);
  background: var(--bg-surface-2);
  font-size: 11px;
  color: var(--text-primary);
  max-width: 160px;
}
.td-comment-file-thumb {
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}
.td-comment-file-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-muted);
  margin-left: 2px;
  flex-shrink: 0;
  transition: color 0.12s ease;
}
.td-comment-file-remove:hover {
  color: #ef4444;
}

/* ── Comment media grid (in-comment image display) ───────────────────── */
.td-comment-media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.td-comment-media-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid var(--border-base);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
  flex-shrink: 0;
}
.td-comment-media-frame {
  position: relative;
  width: 80px;
  height: 80px;
  background: var(--bg-surface-2);
}
.td-comment-media-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.35);
  z-index: 1;
}
.td-comment-spinner {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: tdSpin 0.8s linear infinite;
}
.td-comment-media-item:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}
.td-comment-media-img {
  display: block;
  width: 80px;
  height: 80px;
  object-fit: cover;
}
.td-comment-media-file {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--bg-surface-2);
  color: var(--text-muted);
  padding: 4px;
}
</style>
