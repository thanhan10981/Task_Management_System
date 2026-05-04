<template>
  <section class="min-h-full p-0 font-[Inter,system-ui,sans-serif]">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="flex items-start justify-between flex-wrap gap-4 mb-7 max-[900px]:mb-5">
      <div>
        <h1 class="text-[28px] font-extrabold m-0 tracking-[-0.5px]" style="color: var(--text-heading);">Files</h1>
        <p class="mt-1 text-[13px] m-0" style="color: var(--text-subtle);">Upload &amp; manage your folders</p>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap max-[480px]:w-full">
        <!-- Outline button -->
        <button
          class="fv-btn-outline outline-btn max-[480px]:flex-1 max-[480px]:justify-center"
          style="background: var(--btn-bg); border: 1.5px solid var(--border-medium); color: var(--text-secondary); box-shadow: 0 1px 4px rgba(0,0,0,0.04);"
          @click="showCreateFolder = true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          Create New Folder
        </button>
        <!-- Primary button -->
        <button
          class="fv-btn-primary gradient-btn max-[480px]:flex-1 max-[480px]:justify-center"
          style="box-shadow: 0 4px 14px rgba(99,102,241,0.35);"
          @click="triggerUploader"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload
        </button>
      </div>
    </header>

    <!-- ── Main grid ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-[1fr_300px] gap-5 items-start max-[1024px]:grid-cols-1 max-[900px]:gap-3.5">

      <!-- ════ Left column ════════════════════════════════════════════════ -->
      <div class="flex flex-col gap-5 max-[900px]:gap-3.5">

        <!-- Folders card -->
        <div class="page-card max-[900px]:p-4 max-[900px]:rounded-2xl" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <div class="flex items-center justify-between mb-[18px] max-[768px]:items-start max-[768px]:gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br from-indigo-500 to-violet-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span class="text-[15px] font-bold" style="color: var(--text-primary);">All Files</span>
            </div>
            <button class="fv-show-btn" @click="refreshAll">
              Show All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <!-- Skeleton -->
          <div v-if="loadingFolders" class="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[480px]:grid-cols-2 max-[480px]:gap-2.5 max-[560px]:grid-cols-1">
            <div v-for="n in 6" :key="n" class="fv-skeleton h-[100px] rounded-2xl" />
          </div>

          <!-- Empty -->
          <div v-else-if="folderRows.length === 0" class="empty-placeholder" style="color: var(--text-subtle); border-color: var(--border-medium);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <p>No folders found</p>
          </div>

          <!-- Grid -->
          <div v-else class="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[768px]:grid-cols-2 max-[768px]:gap-2.5 max-[560px]:grid-cols-1">
            <div
              v-for="row in folderRows"
              :key="row.path"
              class="folder-card relative flex flex-col px-3.5 pt-4 pb-3 rounded-2xl cursor-pointer text-left transition-all duration-200 overflow-hidden max-[560px]:px-3 max-[560px]:pt-3.5 max-[560px]:pb-2.5"
              :class="currentFolder === row.path ? 'folder-card--active' : ''"
              :style="{ border: '1.5px solid var(--fc-border-color, var(--border-medium))', background: 'var(--fc-color, var(--bg-surface-2))' }"
              role="button"
              tabindex="0"
              @click="selectFolder(row.path)"
              @keydown.enter.prevent="selectFolder(row.path)"
              @keydown.space.prevent="selectFolder(row.path)"
            >
              <div class="flex items-start justify-between mb-2.5">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :style="{ background: folderColor(row.path) }">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </div>
                <button
                  v-if="row.hasChildren"
                  class="fc-expand inline-flex items-center justify-center w-7 h-7 rounded-full border-none cursor-pointer transition-all duration-[180ms]"
                  :class="{ 'fc-expand--open': isExpanded(row.path) }"
                  @click.stop="toggleFolderExpand(row.path)"
                />
              </div>
              <p class="fc-name text-[13px] font-bold m-0 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full" style="color: var(--fc-text-color, var(--text-heading)); text-shadow: var(--fc-text-shadow, none);">{{ row.name }}</p>
              <p class="text-[11px] m-0" style="color: var(--fc-subtext-color, var(--text-secondary));">{{ row.fileCount }} files</p>
              <!-- depth indicator -->
              <div v-if="row.depth > 0" class="absolute bottom-0 left-0 h-[3px] rounded-[0_3px_3px_0] bg-gradient-to-r from-indigo-500 to-violet-500" :style="{ width: `${(row.depth / 4) * 100}%` }" />
            </div>
          </div>
        </div>

        <!-- Recent Files card -->
        <div class="page-card max-[900px]:p-4 max-[900px]:rounded-2xl" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <div class="flex items-center justify-between mb-[18px] max-[768px]:items-start max-[768px]:gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-[15px] font-bold" style="color: var(--text-primary);">Recent Files</span>
              <span v-if="currentFolder" class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 bg-indigo-50 rounded-md px-2 py-0.5 max-w-[180px] max-[560px]:max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                {{ displayFolderName(currentFolder) }}
              </span>
            </div>
            <button class="fv-show-btn" @click="loadFiles">
              Reload
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
            </button>
          </div>

          <!-- Skeleton -->
          <div v-if="loadingFiles" class="flex flex-col gap-2.5">
            <div v-for="n in 5" :key="n" class="fv-skeleton h-11 rounded-[10px]" />
          </div>

          <!-- Empty -->
          <div v-else-if="recentFiles.length === 0" class="empty-placeholder" style="color: var(--text-subtle); border-color: var(--border-medium);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No files in this folder</p>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto max-[768px]:overflow-visible">
            <table class="file-table w-full border-collapse min-w-[560px] max-[768px]:min-w-0 max-[768px]:border-separate max-[768px]:border-spacing-y-2.5">
              <thead class="max-[768px]:hidden">
                <tr>
                  <th class="fv-th" style="color: var(--text-subtle); border-color: var(--border-base);">
                    Name <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="inline-block align-middle"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th class="fv-th" style="color: var(--text-subtle); border-color: var(--border-base);">
                    Size <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="inline-block align-middle"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th class="fv-th" style="color: var(--text-subtle); border-color: var(--border-base);">
                    Last Modified <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="inline-block align-middle"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th class="fv-th" style="color: var(--text-subtle); border-color: var(--border-base);">
                    Members <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="inline-block align-middle"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th class="border-b-[1.5px]" style="border-color: var(--border-base);" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in recentFiles" :key="file.publicId" class="file-row transition-colors duration-150 max-[768px]:block max-[768px]:border max-[768px]:rounded-[14px] max-[768px]:overflow-hidden" style="border-color: var(--border-medium);">
                  <td class="fv-td" style="color: var(--text-primary); border-color: var(--border-soft);" data-label="Name">
                    <div class="flex items-center gap-2.5">
                      <template v-if="isImageFile(file)">
                        <img
                          :src="file.secureUrl"
                          :alt="file.fileName || fileName(file.publicId)"
                          class="w-9 h-9 rounded-lg object-cover border flex-shrink-0 cursor-pointer transition-transform duration-150 hover:scale-[1.03]"
                          style="border-color: var(--border-base);"
                          loading="lazy"
                          @click.stop="openImagePreview(file)"
                        >
                      </template>
                      <span
                        v-else
                        class="inline-flex items-center justify-center min-w-[38px] h-7 px-1.5 rounded-lg text-[10px] font-[800] tracking-[0.03em] whitespace-nowrap flex-shrink-0"
                        :style="{ background: fileTypeBg(file.format) }"
                        style="color: var(--text-heading);"
                      >
                        {{ getFileIconText(file.format) }}
                      </span>
                      <span class="font-semibold max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap max-[768px]:max-w-[calc(100vw-180px)]" style="color: var(--text-heading);">{{ file.fileName || fileName(file.publicId) }}</span>
                    </div>
                  </td>
                  <td class="fv-td" style="color: var(--text-secondary); border-color: var(--border-soft);" data-label="Size">{{ formatBytes(file.bytes) }}</td>
                  <td class="fv-td" style="color: var(--text-secondary); border-color: var(--border-soft);" data-label="Last Modified">{{ formatDate(file.createdAt) }}</td>
                  <!-- Members -->
                  <td class="fv-td" style="border-color: var(--border-soft);" data-label="Members">
                    <div class="flex items-center py-0.5">
                      <template v-if="file.shared_with && file.shared_with.length">
                        <div
                          v-for="(member, idx) in file.shared_with.slice(0, 4)"
                          :key="member.id"
                          class="member-avatar w-7 h-7 rounded-full border-2 overflow-hidden flex items-center justify-center text-[9px] font-[800] text-white cursor-default transition-transform duration-150 relative flex-shrink-0 first:ml-0 -ml-2 max-[768px]:-ml-1.5"
                          :style="{ zIndex: 10 - idx, background: member.avatar ? 'transparent' : memberColor(member.id), borderColor: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }"
                          :title="member.name"
                        >
                          <img v-if="member.avatar" :src="member.avatar" :alt="member.name" class="w-full h-full object-cover block" />
                          <span v-else>{{ memberInitials(member.name) }}</span>
                        </div>
                        <div
                          v-if="file.shared_with.length > 4"
                          class="member-avatar w-7 h-7 rounded-full border-2 overflow-hidden flex items-center justify-center text-[9px] font-[800] cursor-default -ml-2 relative flex-shrink-0"
                          :style="{ zIndex: 6, borderColor: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }"
                          :title="`${file.shared_with.length - 4} more members`"
                        >
                          +{{ file.shared_with.length - 4 }}
                        </div>
                      </template>
                      <span v-else class="text-[13px]" style="color: var(--text-muted);">—</span>
                    </div>
                  </td>
                  <!-- Actions -->
                  <td class="fv-td max-[768px]:border-b-0" style="border-color: var(--border-soft);" data-label="Actions">
                    <div class="flex items-center justify-end max-[768px]:justify-start">
                      <div class="relative inline-flex">
                        <button
                          class="w-[30px] h-[30px] rounded-lg inline-flex items-center justify-center border-[1.5px] cursor-pointer transition-all duration-150"
                          :class="openMenuId === file.publicId ? 'fv-action-active' : 'fv-action-btn'"
                          style="background: var(--btn-bg); border-color: var(--border-medium);"
                          title="More options"
                          @click.stop="toggleMenu(file.publicId)"
                        >
                          <svg v-if="deletingFile === file.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/></svg>
                          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                        </button>
                        <!-- Dropdown -->
                        <Transition name="menu-fade">
                          <div v-if="openMenuId === file.publicId" class="absolute top-[calc(100%+6px)] right-0 max-[768px]:left-0 max-[768px]:right-auto z-[200] min-w-[140px] rounded-xl border p-1 overflow-hidden" style="background: var(--dropdown-bg); border-color: var(--modal-border); box-shadow: 0 8px 24px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06);">
                            <button
                              class="fv-dropdown-item flex items-center gap-2.5 w-full px-3 py-2.5 border-none rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-[130ms] text-left whitespace-nowrap"
                              style="background: transparent; color: var(--text-primary);"
                              @click.stop="openFile(file); closeMenu()"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              Open
                            </button>
                            <button
                              class="fv-dropdown-item fv-dropdown-danger flex items-center gap-2.5 w-full px-3 py-2.5 border-none rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-[130ms] text-left whitespace-nowrap text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              style="background: transparent;"
                              :disabled="deletingFile === file.id"
                              @click.stop="requestDelete(file); closeMenu()"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              Delete
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ════ Right sidebar ════════════════════════════════════════════ -->
      <aside class="flex flex-col gap-5 max-[900px]:gap-3.5">

        <!-- Storage Donut card -->
        <div class="page-card max-[900px]:p-4 max-[900px]:rounded-2xl" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <h3 class="text-base font-bold m-0 mb-[18px]" style="color: var(--text-heading);">Available Storage</h3>
          <!-- Donut -->
          <div class="relative w-[110px] h-[110px] mx-auto mb-2.5">
            <svg class="w-[110px] h-[110px] -rotate-90" viewBox="0 0 100 100">
              <circle class="fill-none stroke-[12]" style="stroke: var(--bg-surface-3);" cx="50" cy="50" r="38" />
              <circle
                class="fill-none stroke-[12] stroke-indigo-500 [stroke-linecap:round] transition-[stroke-dasharray] duration-1000 ease-in-out"
                cx="50" cy="50" r="38"
                :stroke-dasharray="`${storagePercent * 2.388} 238.8`"
                stroke-dashoffset="0"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-[22px] font-[800]" style="color: var(--text-heading);">{{ storagePercent }}%</span>
            </div>
          </div>
          <p class="text-center text-xs mb-[18px]" style="color: var(--text-secondary);">{{ usedStorage }} / {{ totalStorage }}</p>

          <!-- Breakdown -->
          <div class="flex flex-col gap-2.5">
            <div v-for="item in storageItems" :key="item.label" class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm" :style="{ background: item.color + '22', color: item.color }">
                  <svg v-if="item.icon === 'media'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5 15 12l-5 2.5z" fill="currentColor" stroke="none"/></svg>
                  <svg v-else-if="item.icon === 'document'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M10 13h4M10 17h4"/></svg>
                  <svg v-else-if="item.icon === 'image'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5.2-5.2a1 1 0 0 0-1.4 0L8 17"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13"/><path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11"/></svg>
                </div>
                <span class="text-[13px] font-semibold" style="color: var(--text-primary);">{{ item.label }}</span>
              </div>
              <span class="text-xs font-semibold" style="color: var(--text-secondary);">{{ item.size }}</span>
            </div>
            <!-- Bar -->
            <div class="h-1 rounded mt-1" style="background: var(--bg-surface-3);">
              <div class="h-full rounded transition-all duration-[800ms] ease-in-out bg-gradient-to-r from-indigo-500 to-violet-500" :style="{ width: `${storagePercent}%` }" />
            </div>
          </div>
        </div>

        <!-- Uploader card -->
        <div ref="uploaderRef" class="page-card pl-8 max-[900px]:p-4" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <h3 class="text-base font-bold m-0 mb-[18px]" style="color: var(--text-heading);">Upload Files</h3>
          <CloudinaryUploader :folder="currentFolder" @uploaded="handleUploaded" />
        </div>
      </aside>
    </div>

    <!-- ── Create Folder Modal ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCreateFolder" class="modal-overlay" @click.self="showCreateFolder = false">
          <div class="modal-panel" style="background: var(--modal-bg); border-color: var(--modal-border); box-shadow: 0 24px 64px rgba(0,0,0,0.18);">
            <div class="modal-icon bg-gradient-to-br from-violet-100 to-violet-200 text-indigo-500">
              <img :src="folderPlusIcon" alt="" width="24" height="24" aria-hidden="true">
            </div>
            <h3 class="text-lg font-[800] m-0 mb-1.5" style="color: var(--text-heading);">Create New Folder</h3>
            <p class="text-[13px] m-0 mb-5" style="color: var(--text-secondary);">Enter a path like <code class="rounded px-1.5 text-xs text-indigo-500" style="background: var(--bg-surface-3);">tasks/attachments/design</code></p>
            <input
              v-model="newFolderName"
              class="modal-input w-full rounded-xl border-[1.5px] px-4 py-3 text-sm mb-5 outline-none transition-all duration-200"
              style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);"
              placeholder="Folder path..."
              autocomplete="off"
              @keyup.enter="createFolder"
            >
            <div class="flex gap-2.5">
              <button class="fv-btn-ghost flex-1 justify-center px-5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-semibold cursor-pointer transition-colors duration-150" style="border-color: var(--border-medium); color: var(--text-muted); background: transparent;" @click="showCreateFolder = false">Cancel</button>
              <button
                class="fv-btn-primary-sm gradient-btn flex-1"
                :disabled="creatingFolder || !newFolderName.trim()"
                @click="createFolder"
              >
                <svg v-if="creatingFolder" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/></svg>
                {{ creatingFolder ? 'Creating...' : 'Create Folder' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete File Modal ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm">
          <div class="modal-panel" style="background: var(--modal-bg); border-color: var(--modal-border); box-shadow: 0 24px 64px rgba(0,0,0,0.18);">
            <div class="modal-icon bg-gradient-to-br from-red-100 to-red-200 text-red-600">
              <img :src="trashIcon" alt="" width="24" height="24" aria-hidden="true">
            </div>
            <h3 class="text-lg font-[800] m-0 mb-1.5" style="color: var(--text-heading);">Delete File</h3>
            <p class="text-[13px] m-0 mb-5" style="color: var(--text-secondary);">
              Are you sure you want to delete <code class="rounded px-1.5 text-xs text-indigo-500" style="background: var(--bg-surface-3);">{{ pendingDeleteFileName }}</code>?
            </p>
            <div class="flex gap-2.5">
              <button class="fv-btn-ghost flex-1 justify-center px-5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150" style="border-color: var(--border-medium); color: var(--text-muted); background: transparent;" :disabled="confirmingDelete" @click="closeDeleteConfirm">Cancel</button>
              <button
                class="flex-1 inline-flex items-center justify-center gap-[7px] px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold border-none cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="confirmingDelete"
                @click="confirmDelete"
              >
                <svg v-if="confirmingDelete" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/></svg>
                {{ confirmingDelete ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Image Preview Modal ─────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="imagePreviewOpen" class="modal-overlay" @click.self="closeImagePreview">
          <div class="modal-panel image-preview-panel" style="background: var(--modal-bg); border-color: var(--modal-border); box-shadow: 0 24px 64px rgba(0,0,0,0.28);">
            <div class="flex items-center justify-between gap-3 mb-4">
              <div class="min-w-0">
                <p class="text-[14px] font-[800] m-0" style="color: var(--text-heading);">Image Preview</p>
                <p class="text-[12px] m-0 mt-1 truncate" style="color: var(--text-subtle);">{{ imagePreviewTitle }}</p>
              </div>
              <button class="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500" style="background: var(--bg-surface-3); color: var(--text-muted);" @click="closeImagePreview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="w-full max-h-[64vh] overflow-hidden rounded-2xl border flex items-center justify-center p-3" style="border-color: var(--border-base); background: var(--bg-surface-2);">
              <img :src="imagePreviewUrl" :alt="imagePreviewTitle" class="max-w-full max-h-[60vh] object-contain block" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CloudinaryUploader from '../components/CloudinaryUploader.vue'
import folderPlusIcon from '@/assets/icons/folder-plus.svg?url'
import trashIcon from '@/assets/icons/trash.svg?url'
import {
  createCloudinaryFolder,
  normalizeFolderPath,
  type CloudinaryUploadResult,
} from '@/api/cloudinary'
import { useToast } from '@/composables/useToast'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useProjectStore } from '@/stores/project.store'
import { useQueryClient } from '@tanstack/vue-query'
import { useFiles } from '../composables/useFiles'
import { useFolders } from '../composables/useFolders'
import { useStorageRefined } from '../composables/useStorageRefined'
import { storeToRefs } from 'pinia'
import type { CloudinaryFile } from '../types/files-view.types'
import {
  extractErrorMessage,
  fileName,
  fileTypeBg,
  folderColor,
  formatBytes,
  formatDate,
  getFileIconText,
  memberColor,
  memberInitials,
} from '../utils/file.utils'

const DEFAULT_FOLDER = ''
const MAX_FOLDER_REFRESH_RETRY = 3
const FOLDER_REFRESH_DELAY_MS = 350
const DOWNLOAD_EVENT_KEY = 'tms:file-download-event'

const IMAGE_FORMATS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'])

const currentFolder = ref(DEFAULT_FOLDER)
const openMenuId = ref<string | null>(null)

function toggleMenu(publicId: string) { openMenuId.value = openMenuId.value === publicId ? null : publicId }
function closeMenu() { openMenuId.value = null }
function handleGlobalClick() { closeMenu() }

const creatingFolder = ref(false)
const showCreateFolder = ref(false)
const newFolderName = ref('')
const uploaderRef = ref<HTMLElement | null>(null)
const showDeleteConfirm = ref(false)
const confirmingDelete = ref(false)
const pendingDeleteFile = ref<CloudinaryFile | null>(null)
const imagePreviewOpen = ref(false)
const imagePreviewUrl = ref('')
const imagePreviewTitle = ref('')
const pendingDeleteFileName = computed(() => {
  const file = pendingDeleteFile.value
  if (!file) return 'this file'
  return (file.fileName || fileName(file.publicId) || 'this file').trim()
})

const toast = useToast()
const router = useRouter()
const queryClient = useQueryClient()
const projectStore = useProjectStore()
const { currentProjectId } = storeToRefs(projectStore)

function errorMessage(error: unknown, fallback: string) { return extractErrorMessage(error, fallback) }

const { folders, folderRows, loadingFolders, loadFolders, expandAncestors, toggleFolderExpand, isExpanded, resetFoldersState } =
  useFolders({ currentFolder, currentProjectId, toast, errorMessage })

const { recentFiles, allFiles, loadingFiles, deletingFile, loadFiles, loadAllFiles, deleteFile, refreshAfterUpload, mergeOptimisticUploadedFiles, resetFilesState } =
  useFiles({ currentFolder, currentProjectId, folders, loadFolders, toast, errorMessage })

const { usedStorage, storagePercent, totalStorage, storageItems, applyFolderCountsFromFiles } =
  useStorageRefined({ allFiles, folders })

const lastAppliedFilesRef = ref<typeof allFiles.value | null>(null)

function syncFolderCounts() {
  const files = allFiles.value
  if (lastAppliedFilesRef.value === files) return
  applyFolderCountsFromFiles(files)
  lastAppliedFilesRef.value = files
}

async function loadAllData() {
  await loadFolders()
  await Promise.all([loadFiles(), loadAllFiles()])
  syncFolderCounts()
}

onMounted(async () => {
  window.addEventListener('storage', handleStorageEvent)
  window.addEventListener('click', handleGlobalClick)
  if (!currentProjectId.value) return
  await loadAllData()
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageEvent)
  window.removeEventListener('click', handleGlobalClick)
})

watch(currentProjectId, async () => {
  resetFoldersState(); resetFilesState()
  currentFolder.value = DEFAULT_FOLDER
  lastAppliedFilesRef.value = null
  if (!currentProjectId.value) { applyFolderCountsFromFiles([]); return }
  await loadAllData()
})

watch(() => allFiles.value, (nextFiles, prevFiles) => {
  if (nextFiles === prevFiles) return
  syncFolderCounts()
}, { deep: false })

async function refreshAll() {
  if (currentProjectId.value) await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all })
  await loadAllData()
}

function selectFolder(path: string) {
  currentFolder.value = normalizeFolderPath(path)
  expandAncestors(currentFolder.value)
  void loadFiles()
}

async function createFolder() {
  const path = normalizeFolderPath(newFolderName.value)
  if (!path) return
  creatingFolder.value = true
  try {
    if (!currentProjectId.value) throw new Error('Missing current project. Please create a project first.')
    await createCloudinaryFolder(currentProjectId.value, path)
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all })
    showCreateFolder.value = false
    newFolderName.value = ''
    await refreshFoldersUntilVisible(path)
    currentFolder.value = normalizeFolderPath(path)
    expandAncestors(currentFolder.value)
    await Promise.all([loadFiles(), loadAllFiles()])
    syncFolderCounts()
    toast.success('Folder created')
  } catch (error) {
    toast.error(errorMessage(error, 'Create folder failed'))
  } finally {
    creatingFolder.value = false
  }
}

async function refreshFoldersUntilVisible(path: string) {
  for (let attempt = 0; attempt < MAX_FOLDER_REFRESH_RETRY; attempt++) {
    await loadFolders()
    if (folders.value.some((folder) => folder.path === path)) return
    await new Promise((resolve) => { window.setTimeout(resolve, FOLDER_REFRESH_DELAY_MS) })
  }
}

async function handleUploaded(results: CloudinaryUploadResult[]) {
  if (results.length) toast.success(`Uploaded ${results.length} file${results.length > 1 ? 's' : ''}`)
  const uploadedPublicIds = results.map((result) => result.publicId)
  const synced = await refreshAfterUpload(uploadedPublicIds)
  if (!synced && results.length) mergeOptimisticUploadedFiles(results)
  syncFolderCounts()
}

function triggerUploader() { uploaderRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

function isImageFile(file: CloudinaryFile) {
  const format = (file.format || '').toLowerCase()
  const resourceType = (file.resourceType || '').toLowerCase()
  return resourceType === 'image' || IMAGE_FORMATS.has(format)
}

function openImagePreview(file: CloudinaryFile) {
  if (!isImageFile(file)) return
  imagePreviewUrl.value = file.secureUrl
  imagePreviewTitle.value = (file.fileName || fileName(file.publicId) || 'Image').trim()
  imagePreviewOpen.value = true
}

function closeImagePreview() {
  imagePreviewOpen.value = false
  imagePreviewUrl.value = ''
  imagePreviewTitle.value = ''
}

function openFile(file: { id: string | null; format?: string | null; resourceType?: string | null; fileName?: string | null; publicId?: string | null; secureUrl: string }) {
  if (!file.id) { window.open(file.secureUrl, '_blank', 'noopener,noreferrer'); return }
  const normalizedFormat = (file.format ?? '').toLowerCase()
  const normalizedResourceType = (file.resourceType ?? '').toLowerCase()
  const previewableVideoFormats = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi'])
  const mode = normalizedResourceType === 'image' || normalizedResourceType === 'video' || previewableVideoFormats.has(normalizedFormat) ? 'preview' : 'download'
  const resolvedRoute = router.resolve({ name: 'file-open', params: { id: file.id }, query: { mode } })
  const openedWindow = window.open(resolvedRoute.href, '_blank', 'noopener,noreferrer')
  if (!openedWindow) toast.error('Browser blocked popup. Please allow popups and try again.')
}

function requestDelete(file: CloudinaryFile) {
  if (!file.id) return
  pendingDeleteFile.value = file
  showDeleteConfirm.value = true
}

function closeDeleteConfirm() {
  if (confirmingDelete.value) return
  showDeleteConfirm.value = false
  pendingDeleteFile.value = null
}

async function confirmDelete() {
  const file = pendingDeleteFile.value
  if (!file) return
  confirmingDelete.value = true
  try {
    await deleteFile(file)
    showDeleteConfirm.value = false
    pendingDeleteFile.value = null
  } finally {
    confirmingDelete.value = false
  }
}

function displayFolderName(path: string) { return normalizeFolderPath(path).split('/').filter(Boolean).pop() ?? 'Root' }

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== DOWNLOAD_EVENT_KEY || !event.newValue) return
  try {
    const payload = JSON.parse(event.newValue) as { fileName?: string }
    const fileNameLabel = payload.fileName?.trim() || 'file'
    toast.success(`Downloaded ${fileNameLabel} successfully`)
  } catch {
    toast.success('Downloaded file successfully')
  }
}
</script>

<style scoped>
/* ── Skeleton shimmer — @keyframes ───────────────────────────────────────── */
.fv-skeleton {
  background: linear-gradient(90deg, var(--bg-surface-2) 25%, var(--border-base) 50%, var(--bg-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* ── Spin animation ───────────────────────────────────────────────────────── */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Folder card — dynamic CSS var–based hover + dark mode override ───────── */
.folder-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, filter 0.2s; }
.folder-card:hover {
  border-color: var(--fc-border-hover, #cbd5e1) !important;
  box-shadow: 0 6px 20px rgba(0,0,0,0.22);
  transform: translateY(-2px);
  filter: brightness(1.08);
}
.folder-card--active {
  border-color: var(--fc-border-active, #94a3b8) !important;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;
  filter: brightness(1.05);
}
:global([data-theme="dark"]) .folder-card {
  --fc-border-color: transparent;
  --fc-border-hover: rgba(255,255,255,0.3);
  --fc-border-active: rgba(255,255,255,0.45);
  --fc-text-color: rgba(255,255,255,0.95);
  --fc-subtext-color: rgba(255,255,255,0.75);
  --fc-text-shadow: 0 1px 3px rgba(0,0,0,0.25);
}

/* ── Folder expand button — ::before chevron via pseudo-element ───────────── */
.fc-expand {
  background: var(--fc-expand-bg, linear-gradient(180deg, rgba(255,255,255,0.96), rgba(241,245,249,0.9)));
  color: var(--fc-expand-color, #475569);
  font-size: 0;
  padding: 0;
  transition: background 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
}
.fc-expand:hover {
  background: var(--fc-expand-hover-bg, linear-gradient(180deg, #ffffff, #e2e8f0));
  color: var(--fc-expand-hover-color, #4f46e5);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(99,102,241,0.10);
}
.fc-expand:active { transform: translateY(0); box-shadow: none; }
.fc-expand::before {
  content: '';
  width: 8px; height: 8px;
  display: block;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
  margin-right: 1px;
  transition: transform 0.18s ease;
}
.fc-expand--open::before { transform: rotate(135deg); }
:global([data-theme="dark"]) .fc-expand {
  --fc-expand-bg: transparent;
  --fc-expand-color: rgba(255,255,255,0.9);
  --fc-expand-hover-bg: rgba(255,255,255,0.12);
  --fc-expand-hover-color: #ffffff;
}

/* ── File table row hover — uses CSS var(--bg-hover) ───────────────────── */
.file-row:hover { background: var(--bg-hover); }
.file-row:last-child td { border-bottom: none; }

/* ── Responsive table: card layout on mobile ──────────────────────────── */
@media (max-width: 768px) {
  .file-row { background: var(--bg-surface-2) !important; border-radius: 14px; overflow: hidden; }
  .file-row td { border-bottom: 1px solid var(--border-soft); }
  .file-row td:last-child { border-bottom: none; }
  .file-row td::before {
    content: attr(data-label);
    display: block;
    font-size: 10px; line-height: 1.2;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-subtle);
    margin-bottom: 6px; font-weight: 700;
  }
  .file-row td[data-label='Name']::before { margin-bottom: 8px; }
}

/* ── Member avatar hover ──────────────────────────────────────────────── */
.member-avatar:hover { transform: translateY(-3px) scale(1.1); z-index: 20 !important; }

/* ── Action button hover states — CSS var(--bg-hover) ───────────────── */
.fv-action-btn { color: var(--text-secondary); }
.fv-action-btn:hover { border-color: #6366f1 !important; color: #818cf8; background: var(--bg-hover) !important; }
.fv-action-active { border-color: #6366f1 !important; color: #818cf8 !important; background: var(--bg-hover) !important; }

/* ── Dropdown item hover — CSS var(--dropdown-item-hover) ───────────── */
.fv-dropdown-item:hover { background: var(--dropdown-item-hover); color: var(--text-heading); }
.fv-dropdown-danger:hover { background: rgba(239,68,68,0.12) !important; color: #f87171 !important; }

/* ── Outline / ghost / show-all button hovers — CSS vars ─────────────── */
.fv-btn-outline:hover { border-color: #6366f1; color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,0.12); }
.fv-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.fv-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.fv-btn-ghost:hover { background: var(--bg-surface-2); }
.fv-show-btn:hover { background: #ede9fe; }

/* ── Modal input focus — CSS var ─────────────────────────────────────── */
.modal-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.modal-input::placeholder { color: var(--text-subtle); }

/* ── Vue transitions ──────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.menu-fade-enter-active, .menu-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.menu-fade-enter-from, .menu-fade-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ── Image preview modal sizing ───────────────────────────────────────── */
.image-preview-panel {
  width: min(94vw, 980px);
  max-width: 980px;
  padding: 24px;
}
@media (max-width: 640px) {
  .image-preview-panel { width: 94vw; padding: 18px; }
}
</style>
