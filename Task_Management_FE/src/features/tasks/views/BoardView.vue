<template>
  <div
    class="flex flex-col overflow-hidden"
    :style="{ height: isMobile ? 'calc(100dvh - 48px - 56px)' : 'calc(100vh - 64px)', background: 'var(--bg-app)', fontFamily: '\'Inter\',system-ui,sans-serif' }"
  >
    <!-- PAGE HEADER -->
    <div
      class="flex items-center justify-between shrink-0 gap-2 md:gap-3 px-3 md:px-6 h-12 md:h-[60px]"
      style="background:var(--bg-surface);border-bottom:1px solid var(--border-base);overflow:hidden;"
    >
      <div class="flex items-center gap-1.5 md:gap-3.5 min-w-0 relative z-[210]">
        <h1 class="text-sm md:text-lg font-extrabold tracking-tight m-0 shrink-0" style="color:var(--text-heading);">Board</h1>

        <!-- Sprint Selector -->
        <div class="relative">
          <button
            ref="sprintBtnRef"
            class="flex items-center gap-1 md:gap-1.5 max-w-[100px] md:max-w-none h-[28px] md:h-[34px] px-1.5 md:px-3 rounded-lg md:rounded-[10px] border-[1.5px] text-[11px] md:text-[13px] font-semibold cursor-pointer transition-all overflow-hidden"
            :class="sprintMenuOpen ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-[var(--border-medium)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'"
            @click="toggleSprintMenu"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: currentSprint.color }"></span>
            <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ currentSprint.name }}</span>
            <svg class="w-3 h-3 shrink-0 transition-transform duration-200" :class="sprintMenuOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <!-- Sprint dropdown teleported to body to escape overflow:hidden -->
          <Teleport to="body">
            <div
              v-if="sprintMenuOpen"
              class="sprint-drop fixed min-w-[230px] rounded-[14px] border p-1.5 z-[9999]"
              :style="sprintDropStyle"
              style="background:var(--bg-surface);border-color:var(--border-medium);box-shadow:0 16px 48px rgba(0,0,0,0.14);"
              @click.stop
            >
              <div class="text-[10px] font-bold tracking-widest uppercase px-2.5 pt-1.5 pb-1" style="color:var(--text-subtle);">Sprint</div>
              <button
                v-for="s in sprints" :key="s.id"
                class="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg border-none text-[13px] font-semibold cursor-pointer text-left transition-colors"
                :class="s.id === selectedSprintId ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'"
                @click="selectSprint(s.id)"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: s.color }"></span>
                <span class="flex-1">{{ s.name }}</span>
                <span class="text-[11px] text-[var(--text-muted)]">{{ s.dates }}</span>
                <svg v-if="s.id === selectedSprintId" class="w-3.5 h-3.5 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <div class="h-px my-1" style="background:var(--border-base);"></div>
              <div v-if="!showNewSprintForm" class="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[12.5px] font-semibold text-indigo-500 cursor-pointer hover:bg-indigo-50 transition-colors" @click.stop="showNewSprintForm = true">
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Sprint
              </div>
              <div v-else class="flex flex-col gap-2 p-2 pb-1" @click.stop>
                <input v-model="newSprint.name" class="sprint-inp h-[30px] px-2.5 rounded-lg border-[1.5px] text-[12.5px] outline-none font-[inherit] transition-all" style="border-color:var(--border-medium);background:var(--bg-surface-2);color:var(--text-primary);" placeholder="Sprint name" @keydown.enter="createSprint" @keydown.esc="showNewSprintForm = false" ref="sprintNameInput" maxlength="30"/>
                <div class="sprint-date-row flex items-center gap-1.5">
                  <input v-model="newSprint.startDate" type="date" class="sprint-inp flex-1 h-[30px] px-1.5 rounded-lg border-[1.5px] text-[11px] outline-none font-[inherit]" style="border-color:var(--border-medium);background:var(--bg-surface-2);color:var(--text-primary);" title="Start date"/>
                  <span class="text-[11px] text-[var(--text-muted)]">→</span>
                  <input v-model="newSprint.endDate" type="date" class="sprint-inp flex-1 h-[30px] px-1.5 rounded-lg border-[1.5px] text-[11px] outline-none font-[inherit]" style="border-color:var(--border-medium);background:var(--bg-surface-2);color:var(--text-primary);" title="End date"/>
                </div>
                <div class="flex gap-[5px] flex-wrap">
                  <button v-for="c in sprintColorOptions" :key="c" class="w-5 h-5 rounded-full border-2 cursor-pointer transition-transform hover:scale-110" :class="newSprint.color === c ? 'scale-110 border-white shadow-[0_0_0_2px_#6366f1]' : 'border-transparent'" :style="{ background: c }" @click.stop="newSprint.color = c"></button>
                </div>
                <div class="flex gap-1.5 justify-end">
                  <button class="h-7 px-2.5 rounded-[7px] border-[1.5px] bg-transparent text-[12px] font-semibold cursor-pointer hover:bg-[var(--bg-surface-2)] transition-colors" style="border-color:var(--border-medium);color:var(--text-secondary);" @click.stop="showNewSprintForm = false">Cancel</button>
                  <button class="flex items-center gap-1 h-7 px-3 rounded-[7px] border-none text-white text-[12px] font-bold cursor-pointer bg-gradient-to-br from-indigo-500 to-violet-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" :disabled="!newSprint.name.trim()" @click.stop="createSprint">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Create
                  </button>
                </div>
              </div>
            </div>
          </Teleport>
        </div>
      </div>

      <!-- Header right -->
      <div class="flex items-center gap-1 md:gap-2.5 shrink-0">
        <button
          class="hidden sm:inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[10px] border-none text-[12.5px] font-bold text-white cursor-pointer transition-all bg-gradient-to-br from-indigo-500 to-violet-500 hover:opacity-90 hover:-translate-y-px"
          style="box-shadow:0 3px 12px rgba(99,102,241,0.3);"
          title="AI Create Task"
          @click="openAiCreateTask"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/>
            <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z"/>
          </svg>
         
        </button>

        <!-- Group button -->
        <button
          class="flex items-center gap-1 md:gap-1.5 h-[28px] md:h-[34px] px-1.5 md:px-3 rounded-lg md:rounded-[10px] border-[1.5px] text-[11px] md:text-[12.5px] font-semibold cursor-pointer transition-all"
          :class="groupByGroup ? 'border-indigo-400 text-indigo-600 bg-indigo-50' : ''"
          :style="!groupByGroup ? 'border-color:var(--border-medium);background:var(--bg-surface);color:var(--text-secondary);' : ''"
          @click="groupByGroup = !groupByGroup"
          title="Group tasks"
        >
          <svg class="w-3 md:w-3.5 h-3 md:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
          <span class="hidden md:inline">Group</span>
        </button>
        <div class="hidden md:block w-px h-7" style="background:var(--border-medium);"></div>
        <!-- Divider before group on mobile -->
        <div class="block md:hidden w-px h-5" style="background:var(--border-medium);"></div>
        <!-- Invite / members - desktop only -->
        <div class="hidden md:flex items-center gap-2 relative" ref="memberPickerRef">
          <div class="flex items-center">
            <button
              v-for="m in store.members.slice(0, visibleAvatarCount)"
              :key="m.id"
              class="-ml-2 first:ml-0"
            >
              <UserProfileHover :user="profileForMember(m)" placement="bottom">
                <span
                  class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[11px] font-bold border-2 border-[var(--bg-surface)] shadow-sm cursor-default transition-transform hover:-translate-y-0.5 overflow-hidden"
                  :style="{ background: m.color }"
                  :title="m.name"
                >
                  <img v-if="m.avatarUrl" :src="m.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                  <span v-else>{{ m.initials }}</span>
                </span>
              </UserProfileHover>
            </button>
            <button
              v-if="store.members.length > visibleAvatarCount"
              class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[var(--bg-surface)] -ml-2 cursor-pointer transition-transform hover:-translate-y-0.5"
              style="background:var(--bg-surface-3);color:var(--text-muted);"
              title="Show all members"
              @click.stop="openMemberPicker"
            >+{{ store.members.length - visibleAvatarCount }}</button>
          </div>
          <button
            ref="memberPickerBtnRef"
            class="flex items-center gap-1.5 h-[34px] px-3.5 rounded-[10px] border-none text-[12.5px] font-bold text-white cursor-pointer transition-all bg-gradient-to-br from-indigo-500 to-violet-500 hover:opacity-90 hover:-translate-y-px"
            :class="{ 'opacity-90 -translate-y-px': memberPickerOpen }"
            style="box-shadow:0 3px 12px rgba(99,102,241,0.3);"
            title="Manage members"
            @click.stop="memberPickerOpen ? (memberPickerOpen = false) : openMemberPicker()"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Invite
          </button>

          <Teleport to="body">
            <Transition name="mp-drop">
              <div
                v-if="memberPickerOpen"
                ref="memberPickerDropRef"
                class="mp-dropdown board-mp-dropdown"
                :style="[
                  memberPickerStyle,
                  {
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-base)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: '9999',
                  },
                ]"
                @click.stop
              >
              <div class="mp-dropdown-head">
                <span class="text-[11px] font-bold tracking-wide" style="color:var(--text-heading)">Project Members</span>
                <span class="text-[10px]" style="color:var(--text-subtle)">{{ store.members.length }} people</span>
              </div>

              <div class="mp-search-wrap">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-subtle)"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                <input
                  v-model="memberSearch"
                  class="mp-search"
                  placeholder="Search user to add..."
                  ref="memberSearchInput"
                />
              </div>

              <div class="px-2 pt-1 pb-2">
                <button
                  type="button"
                  class="w-full h-[32px] px-2.5 rounded-[8px] border text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                  :class="!canManageProjectMembers ? 'opacity-50 cursor-not-allowed' : ''"
                  :title="canManageProjectMembers ? 'Copy invite link' : 'Only project owner or admin can create invite links'"
                  style="border-color:var(--border-medium);background:var(--bg-surface-2);color:var(--text-secondary);"
                  :disabled="!canManageProjectMembers"
                  @click="copyInviteLink"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l2.92-2.92a5 5 0 0 0-7.07-7.07L11.8 5"/><path d="M14 11a5 5 0 0 0-7.54-.54L3.54 13.38a5 5 0 0 0 7.07 7.07L12.2 19"/></svg>
                  Copy invite link
                </button>
              </div>

              <div class="mp-list">
                <div class="mp-dropdown-head">
                  <span class="text-[11px] font-bold tracking-wide" style="color:var(--text-heading)">Current Members</span>
                  <span class="text-[10px]" style="color:var(--text-subtle)">{{ store.members.length }} people</span>
                </div>

                <div
                  v-for="m in store.members"
                  :key="m.id"
                  class="mp-item w-full text-left"
                >
                  <UserProfileHover :user="profileForMember(m)" placement="left">
                    <div class="mp-item-avatar" :style="{ background: m.color }">
                      <img v-if="m.avatarUrl" :src="m.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                      <span v-else>{{ m.initials }}</span>
                    </div>
                  </UserProfileHover>
                  <div class="mp-item-info">
                    <span class="mp-item-name">{{ m.name }}</span>
                    <span class="text-[10px] font-semibold uppercase" style="color:var(--text-subtle)">
                      {{ (m.role || 'DEVELOPER').toUpperCase() }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <select
                      v-if="canUpdateMemberRole(m)"
                      class="h-[24px] px-1.5 rounded-md border text-[10px] font-semibold"
                      style="border-color:var(--border-medium);background:var(--bg-surface-2);color:var(--text-secondary);"
                      :disabled="updatingRoleMemberId === m.id"
                      :value="(m.role || 'DEVELOPER').toUpperCase()"
                      @change="updateMemberRoleFromPicker(m, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="role in memberRoleOptions" :key="role" :value="role">{{ role }}</option>
                    </select>
                    <button
                      v-if="canManageProjectMembers && !isProjectOwner(m) && m.id !== authStore.user?.id"
                      type="button"
                      class="mp-item-check"
                      style="color:#ef4444;font-size:11px"
                      :disabled="removingMemberId === m.id"
                      @click="removeMemberFromPicker(m)"
                    >
                      {{ removingMemberId === m.id ? 'Removing...' : 'Remove' }}
                    </button>
                    <span
                      v-else
                      class="mp-item-check"
                      style="color:var(--text-subtle);font-size:10px"
                    >
                      {{ isProjectOwner(m) ? 'Owner' : m.id === authStore.user?.id ? 'You' : '' }}
                    </span>
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
                  <UserProfileHover :user="profileForUser(user)" placement="left">
                    <div class="mp-item-avatar" :style="{ background: userAvatarColor(user) }">
                      <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                      <span v-else>{{ userInitials(user) }}</span>
                    </div>
                  </UserProfileHover>
                  <div class="mp-item-info">
                    <span class="mp-item-name">{{ user.fullName || user.email }}</span>
                  </div>
                  <span class="mp-item-check" style="color:#6366f1;font-size:11px">
                    {{ addingMemberId === user.id ? 'Adding...' : 'Add' }}
                  </span>
                </button>

                <div v-if="assignableUsersQuery.isPending.value && memberSearch.trim()" class="py-4 text-center text-[12px]" style="color:var(--text-subtle)">
                  Searching users...
                </div>

                <div v-else-if="memberSearch.trim() && searchedUsers.length === 0" class="py-4 text-center text-[12px]" style="color:var(--text-subtle)">
                  No users available to add
                </div>

                <div v-else class="py-4 text-center text-[12px]" style="color:var(--text-subtle)">
                  Type a name or email to search users
                </div>
              </div>

              <div class="mp-footer">
                <button class="mp-footer-btn mp-footer-btn--ghost" @click="memberSearch = ''">Clear search</button>
                <button class="mp-footer-btn mp-footer-btn--primary" @click="memberPickerOpen = false">Done</button>
              </div>
              </div>
            </Transition>
          </Teleport>
        </div>
        <div class="hidden md:block w-px h-7" style="background:var(--border-medium);"></div>
        <!-- New Status -->
        <button
          class="flex items-center gap-1 md:gap-1.5 h-[28px] md:h-[34px] px-1.5 md:px-3 rounded-lg md:rounded-[10px] border-[1.5px] text-[11px] md:text-[12.5px] font-semibold cursor-pointer transition-all whitespace-nowrap"
          :class="statusPanelOpen ? 'border-violet-400 text-violet-600 bg-violet-50' : ''"
          :style="!statusPanelOpen ? 'border-color:var(--border-medium);background:var(--bg-surface);color:var(--text-secondary);' : ''"
          @click="statusPanelOpen = !statusPanelOpen" title="New Status"
        >
          <svg class="w-3 md:w-3.5 h-3 md:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span class="hidden md:inline">New Status</span>
        </button>
        <div class="w-px h-5 md:h-7 hidden md:block" style="background:var(--border-medium);"></div>
        <!-- Toggle sidebar -->
        <button
          class="flex items-center justify-center w-[28px] md:w-[34px] h-[28px] md:h-[34px] rounded-lg md:rounded-[10px] border-[1.5px] cursor-pointer transition-all"
          :class="sidebarOpen ? 'border-indigo-400 text-indigo-500 bg-indigo-50' : ''"
          :style="!sidebarOpen ? 'border-color:var(--border-medium);background:var(--bg-surface);color:var(--text-secondary);' : ''"
          @click="sidebarOpen = !sidebarOpen" title="Task Groups"
        >
          <svg class="w-3.5 md:w-4 h-3.5 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </button>
      </div>
    </div>

    <!-- SPRINT PROGRESS BAR -->
    <div class="flex items-center justify-end gap-2 px-4 md:px-6 py-1.5 shrink-0" style="background:var(--bg-surface);border-bottom:1px solid var(--border-base);">
      <span class="text-[11px] font-semibold whitespace-nowrap" style="color:var(--text-muted);">Sprint progress</span>
      <div class="w-[80px] md:w-[120px] h-1.5 rounded-full overflow-hidden" style="background:var(--bg-surface-3);">
        <div class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-emerald-500" :style="{ width: sprintProgress + '%' }"></div>
      </div>
      <span class="text-[12px] font-bold min-w-[36px]" style="color:var(--text-primary);">{{ sprintProgress }}%</span>
    </div>

    <!-- BOARD + SIDEBAR WRAPPER -->
    <div class="flex flex-1 overflow-hidden relative">
    <!-- LEFT SIDEBAR BACKDROP (mobile) -->
    <Transition name="sidebar-backdrop">
      <div v-if="sidebarOpen && isMobile" class="fixed left-0 right-0 top-[81px] bottom-0 z-[199] bg-[rgba(15,23,42,0.5)] backdrop-blur-sm" @click="sidebarOpen = false"></div>
    </Transition>

    <!-- LEFT SIDEBAR -->
    <Transition name="sidebar">
      <aside
        v-if="sidebarOpen"
        class="board-sidebar flex flex-col shrink-0 overflow-hidden"
        :class="isMobile ? 'fixed z-[200] left-0 top-[81px] bottom-0 w-[min(240px,68vw)] shadow-[4px_0_32px_rgba(0,0,0,0.22)]' : 'w-[260px] relative z-0'"
        style="background:var(--bg-surface);border-right:1px solid var(--border-base);"
      >
        <div class="board-sidebar-head flex items-center justify-between px-4 py-3.5 pb-3 shrink-0" style="border-bottom:1px solid var(--border-base);">
          <span class="text-[13px] font-bold" style="color:var(--text-primary);">Task Groups</span>
          <button class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500" style="color:var(--text-subtle);" @click="sidebarOpen = false">
            <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="board-sidebar-body flex-1 overflow-y-auto overflow-x-hidden py-2" style="scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb) transparent;">
          <div v-for="group in taskGroups" :key="group.id" class="mb-0.5">
            <div class="board-sidebar-group-row group/sbrow flex items-center gap-1.5 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-[var(--bg-hover)]" @click="toggleSidebarGroup(group.id)">
              <span class="w-5 h-5 rounded-[6px] flex items-center justify-center text-white text-[12px] font-bold shrink-0" :style="{ background: group.color }">{{ group.expanded ? '−' : '+' }}</span>
              <span class="flex-1 text-[12.5px] font-bold truncate" style="color:var(--text-primary);">{{ group.name }}</span>
              <div class="flex shrink-0">
                <UserProfileHover v-for="(m, mi) in group.members.slice(0, 3)" :key="mi" :user="m" placement="bottom" class="-ml-[5px] first:ml-0">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8.5px] font-bold border-[1.5px] border-[var(--bg-surface)] overflow-hidden" :style="{ background: m.color }" :title="m.name">
                    <img v-if="m.avatarUrl" :src="m.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                    <span v-else>{{ m.initial }}</span>
                  </div>
                </UserProfileHover>
              </div>
              <button class="w-[22px] h-[22px] rounded-[6px] border-none bg-transparent flex items-center justify-center cursor-pointer opacity-0 group-hover/sbrow:opacity-100 transition-all hover:bg-[var(--bg-surface-3)]" style="color:var(--text-subtle);" @click.stop>
                <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
              </button>
            </div>
            <Transition name="sb-tasks">
              <div v-if="group.expanded" class="pb-1">
                <div v-for="task in group.tasks" :key="task.id" class="board-sidebar-task-row flex items-center gap-2 px-3.5 py-1.5 pl-[38px] cursor-pointer transition-colors hover:bg-[var(--bg-hover)]" @click="scrollToTask(task.id)">
                  <span class="w-[7px] h-[7px] rounded-full shrink-0" :style="{ background: statusColor(task.status) }"></span>
                  <span class="flex-1 text-[12px] font-medium truncate" style="color:var(--text-muted);">{{ task.name }}</span>
                  <span class="text-[10px] shrink-0 opacity-70" :class="{ 'text-red-500': task.priority==='urgent', 'text-orange-500': task.priority==='high', 'text-amber-500': task.priority==='medium', 'text-indigo-500': task.priority==='low' }">{{ priorityIcon(task.priority) }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </aside>
    </Transition>

    <!-- BOARD COLUMNS -->
    <div ref="boardWrapRef" class="flex items-stretch gap-3 px-3 md:px-6 py-3 md:py-5 flex-1 overflow-x-auto overflow-y-hidden" style="scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb) var(--scrollbar-track);" @click.self="closeAllMenus">
      <div
        v-for="col in columns"
        :key="col.id"
        class="board-col flex flex-col rounded-[18px] overflow-hidden border-[1.5px] transition-all flex-none min-w-[300px] shrink-0"
        :class="draggingOverCol === col.id ? 'border-indigo-400 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]' : 'border-[var(--border-base)]'"
        :style="{ background: 'var(--bg-surface-2)', ...(colWidth ? { width: colWidth + 'px' } : {}) }"
      >
        <!-- Col accent bar -->
        <div class="h-[4px] rounded-t-[18px] shrink-0" :style="{ background: col.color }"></div>
        <!-- Column header -->
        <div class="flex items-center justify-between px-5 py-4 pb-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full" :style="{ background: col.color }"></span>
            <template v-if="editingColId === col.id">
              <input
                :ref="el => { if (el) colEditInputs[col.id] = el as HTMLInputElement }"
                v-model="editingColTitle"
                class="text-[15px] font-extrabold bg-transparent border-b-2 outline-none"
                style="color:var(--text-primary);border-color:#818cf8;min-width:0;width:140px;"
                @keydown.enter.prevent="saveColEdit"
                @keydown.escape.prevent="cancelColEdit"
                @click.stop
              />
            </template>
            <template v-else>
              <span class="text-[15px] font-extrabold" style="color:var(--text-primary);">{{ col.title }}</span>
            </template>
            <span class="text-[12px] font-bold px-2 py-0.5 rounded-full" style="background:var(--bg-surface-3);color:var(--text-muted);">{{ columnList(col.id).length }}</span>
          </div>
          <div class="flex items-center gap-0.5">
            <template v-if="editingColId === col.id">
              <button class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]" title="Save" @click.stop="saveColEdit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]" style="color:var(--text-subtle);" title="Cancel" @click.stop="cancelColEdit">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
              </button>
            </template>
            <template v-else>
              <button class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]" style="color:var(--text-subtle);" @click="addTask(col.id)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <div class="relative" :ref="el => { if (el) colMenuRefs[col.id] = el as HTMLElement }">
                <button
                  class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]"
                  style="color:var(--text-subtle);"
                  title="More options"
                  @click.stop="toggleColMenu(col.id)"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                <Transition name="cm-drop">
                  <div v-if="openColMenuId === col.id" class="absolute right-0 top-[calc(100%+4px)] z-[200] min-w-[148px] rounded-[12px] border p-1 shadow-[0_12px_36px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)]" style="background:var(--bg-surface);border-color:var(--border-medium);" @click.stop>
                    <button class="flex items-center gap-2 w-full px-[10px] py-[7px] rounded-lg border-none bg-transparent text-[12.5px] font-medium font-[inherit] cursor-pointer text-left transition-[background] duration-[120ms] hover:bg-[var(--bg-hover)]" style="color:var(--text-primary);" @click.stop="startColEdit(col)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button class="flex items-center gap-2 w-full px-[10px] py-[7px] rounded-lg border-none bg-transparent text-[12.5px] font-medium font-[inherit] cursor-pointer text-left transition-[background] duration-[120ms] text-red-500 hover:bg-red-500/[0.08]" @click.stop="startColDelete(col)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete
                    </button>
                  </div>
                </Transition>
              </div>
            </template>
          </div>
        </div>
        <!-- Column body -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden px-2.5" style="scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb) transparent;">
          <draggable
            :list="columnList(col.id)"
            group="tasks"
            item-key="id"
            class="flex flex-col gap-2.5 py-1 pb-2 min-h-[60px]"
            ghost-class="card-ghost"
            chosen-class="card-chosen"
            drag-class="card-drag"
            :animation="220"
            @start="onDragStart"
            @end="onDragEnd"
            @change="(evt: any) => onColChange(evt, col.id)"
          >
            <template #item="{ element: task }">
              <div class="flex flex-col gap-2">
                <div
                  v-if="groupByGroup && shouldShowGroupHeader(task, col.id)"
                  class="flex items-center gap-2 px-1 pt-1"
                >
                  <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: groupColor(task.groupId) }"></span>
                  <span class="text-[10.5px] font-extrabold uppercase tracking-[0.08em]" style="color:var(--text-muted);">{{ groupName(task.groupId) }}</span>
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style="background:var(--bg-surface-3);color:var(--text-subtle);">{{ groupTaskCount(col.id, task.groupId) }}</span>
                  <span class="h-px flex-1" style="background:var(--border-base);"></span>
                </div>
                <div
                  class="group/card rounded-[14px] p-3.5 cursor-grab relative transition-all border hover:border-[var(--border-medium)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] active:cursor-grabbing"
                  :class="{
                    'border-l-[3px] border-l-red-500': task.priority==='urgent',
                    'border-l-[3px] border-l-orange-500': task.priority==='high',
                    'border-l-[3px] border-l-amber-400': task.priority==='medium',
                    'border-l-[3px] border-l-indigo-400': task.priority==='low',
                  }"
                  style="background:var(--bg-surface);border-color:var(--border-soft);box-shadow:0 1px 6px rgba(0,0,0,0.05);"
                  @click="openTask(task)"
                >
                <!-- Top row -->
                <div class="flex items-center justify-between mb-2">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.06em]"
                    :class="{
                      'bg-red-100 text-red-500': task.priority==='urgent',
                      'bg-orange-100 text-orange-500': task.priority==='high',
                      'bg-yellow-100 text-yellow-700': task.priority==='medium',
                      'bg-indigo-50 text-indigo-500': task.priority==='low',
                    }"
                  >
                    <span class="text-[9px]">{{ priorityIcon(task.priority) }}</span>{{ task.priority }}
                  </span>
                  <div class="relative shrink-0">
                    <button class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover/card:opacity-100 hover:bg-[var(--bg-surface-3)]" style="color:var(--text-subtle);" @click.stop="toggleCardMenu(task.id)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                    </button>
                    <div v-if="activeCardMenu === task.id" class="absolute right-0 top-full z-[100] rounded-[12px] border p-1.5 min-w-[160px] card-drop" style="background:var(--bg-surface);border-color:var(--border-medium);box-shadow:0 12px 36px rgba(0,0,0,0.14);" @click.stop>
                      <button v-for="targetCol in columns" :key="targetCol.id" class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-[7px] border-none bg-transparent text-[12.5px] cursor-pointer text-left transition-colors hover:bg-[var(--bg-hover)]" style="color:var(--text-primary);" @click="moveTask(task, targetCol.id)"><span class="w-2 h-2 rounded-full shrink-0" :style="{ background: targetCol.color }"></span> {{ targetCol.title }}</button>
                      <div class="h-px my-1" style="background:var(--border-base);"></div>
                      <button class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-[7px] border-none bg-transparent text-[12.5px] cursor-pointer text-left text-red-500 transition-colors hover:bg-red-50" @click="deleteTask(task.id)">
                        <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>Delete
                      </button>
                    </div>
                  </div>
                </div>
                <!-- Title -->
                <p class="text-[13.5px] font-bold m-0 mb-1 leading-[1.45]" style="color:var(--text-primary);">{{ task.name }}</p>
                <!-- Desc -->
                <p v-if="task.desc" class="text-[12px] m-0 mb-2 leading-[1.5] line-clamp-2" style="color:var(--text-muted);">{{ task.desc }}</p>
                <!-- Tags -->
                <div v-if="task.tags && task.tags.length" class="flex flex-wrap gap-1 mb-2">
                  <span v-for="tag in task.tags" :key="tag" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border" style="background:var(--bg-surface-3);color:var(--text-muted);border-color:var(--border-base);">{{ tag }}</span>
                </div>
                <!-- Progress -->
                <div v-if="task.progress !== undefined" class="flex items-center gap-2 mb-2.5">
                  <div class="flex-1 h-[5px] rounded-full overflow-hidden" style="background:var(--bg-surface-3);">
                    <div class="h-full rounded-full transition-all duration-500" :style="{ width: task.progress + '%', background: col.color }"></div>
                  </div>
                  <span class="text-[10.5px] font-bold min-w-[28px] text-right" style="color:var(--text-muted);">{{ task.progress }}%</span>
                </div>
                <!-- Footer -->
                <div class="flex items-center justify-between mt-2.5">
                  <div class="flex items-center gap-2.5">
                    <span class="flex items-center gap-1 text-[11px] font-semibold" :class="isOverdue(task.due) ? 'text-red-500' : ''" :style="!isOverdue(task.due) ? 'color:var(--text-muted);' : ''">
                      <svg class="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ formatDue(task.due) }}
                    </span>
                    <span v-if="task.subtasks" class="flex items-center gap-1 text-[11px] font-semibold" style="color:var(--text-muted);">
                      <svg class="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                      {{ task.subtasks.done }}/{{ task.subtasks.total }}
                    </span>
                  </div>
                  <div class="flex items-center">
                    <UserProfileHover v-for="(m, i) in task.assignees" :key="i" :user="m" placement="top" class="-ml-1.5 first:ml-0" :style="{ zIndex: 10 - Number(i) }">
                      <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-[var(--bg-surface)] overflow-hidden" :style="{ background: m.color }" :title="m.name">
                        <img v-if="m.avatarUrl" :src="m.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                        <span v-else>{{ m.initial }}</span>
                      </div>
                    </UserProfileHover>
                  </div>
                </div>
              </div>
              </div>
            </template>
            <template #footer>
              <div v-if="columnList(col.id).length === 0 && !isDragging" class="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div class="mb-3 flex items-center justify-center w-12 h-12 rounded-2xl" :style="{ background: col.color + '18' }">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" :stroke="col.color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="8" y="2" width="8" height="4" rx="1.5"/>
                    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                    <line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                </div>
                <p class="text-[12px] leading-[1.5] m-0" style="color:var(--text-subtle);">{{ col.emptyText }}</p>
              </div>
            </template>
          </draggable>
        </div>
        <!-- Add task button -->
        <button class="flex items-center gap-1.5 mx-3 mb-3 px-3 py-2.5 rounded-[10px] border-[1.5px] border-dashed bg-transparent text-[12.5px] font-semibold cursor-pointer transition-all shrink-0 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 hover:border-solid" style="border-color:var(--border-medium);color:var(--text-muted);" @click="addTask(col.id)">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>
    </div>

    </div><!-- end wrapper -->

    <!-- DELETE STATUS MODAL -->
    <Transition name="modal">
      <div v-if="deleteColTarget" class="fixed inset-0 z-[600] flex items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-[4px]" @click.self="cancelColDelete">
        <div class="rounded-[20px] border overflow-hidden flex flex-col" style="background:var(--bg-surface);border-color:var(--border-medium);box-shadow:0 32px 80px rgba(0,0,0,0.3);width:calc(100% - 32px);max-width:420px;">
          <!-- Header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b" style="border-color:var(--border-base);">
            <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,rgba(239,68,68,0.16),rgba(249,115,22,0.1));">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[15px] font-extrabold m-0" style="color:var(--text-heading);">Delete "{{ deleteColTarget.title }}"?</p>
              <p class="text-[12px] m-0 mt-0.5" style="color:var(--text-subtle);">This action cannot be undone.</p>
            </div>
            <button class="w-[28px] h-[28px] rounded-[8px] border-none flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]" style="background:var(--bg-surface-2);color:var(--text-muted);" @click="cancelColDelete">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
            </button>
          </div>
          <!-- Body -->
          <div class="p-5 flex flex-col gap-4">
            <template v-if="deleteColTaskCount > 0">
              <div class="flex items-start gap-2.5 px-3.5 py-3 rounded-[12px]" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);">
                <svg class="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span class="text-[12.5px] leading-[1.5]" style="color:var(--text-primary);">This column has <strong>{{ deleteColTaskCount }} task{{ deleteColTaskCount > 1 ? 's' : '' }}</strong>. Choose where to move them before deleting.</span>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Move tasks to</label>
                <select v-model="deleteColMoveTarget" class="w-full rounded-[10px] border-[1.5px] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 modal-input focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]">
                  <option value="" disabled>— Select a status —</option>
                  <option v-for="col in columns.filter(c => c.id !== deleteColTarget?.id)" :key="col.id" :value="col.id">{{ col.title }}</option>
                </select>
              </div>
            </template>
          </div>
          <!-- Footer -->
          <div class="flex items-center justify-end gap-2.5 px-5 py-4" style="border-top:1px solid var(--border-base);">
            <button class="h-9 px-4 rounded-[10px] border-[1.5px] bg-transparent text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--bg-surface-2)]" style="border-color:var(--border-medium);color:var(--text-secondary);" @click="cancelColDelete">Cancel</button>
            <button
              class="h-9 px-5 rounded-[10px] border-none text-white text-[13px] font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style="background:linear-gradient(135deg,#ef4444,#f97316);box-shadow:0 4px 14px rgba(239,68,68,0.3);"
              :disabled="(deleteColTaskCount > 0 && !deleteColMoveTarget) || deletingCol"
              @click="confirmColDelete"
            >{{ deletingCol ? 'Deleting…' : deleteColTaskCount > 0 ? 'Delete & Move' : 'Delete' }}</button>
          </div>
        </div>
      </div>
    </Transition>


    <!-- RIGHT STATUS PANEL -->
    <Transition name="status-panel">
      <aside v-if="statusPanelOpen" class="fixed right-0 flex flex-col overflow-hidden z-[300]" style="top:48px;height:calc(100dvh - 48px - 56px);width:min(300px,100%);background:var(--bg-surface);border-left:1px solid var(--border-base);box-shadow:-8px 0 32px rgba(0,0,0,0.18);">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3.5 pb-3 shrink-0" style="border-bottom:1px solid var(--border-base);background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(99,102,241,0.04));">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-indigo-500">
              <svg class="w-3.5 h-3.5 stroke-white" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <span class="text-[13.5px] font-extrabold tracking-tight" style="color:var(--text-primary);">New Status</span>
          </div>
          <button class="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500" style="color:var(--text-subtle);" @click="statusPanelOpen = false">
            <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-5" style="scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb) transparent;">

          <!-- Preview -->
          <div class="sp-preview flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] border-[1.5px] border-dashed transition-all" style="background:var(--bg-surface-2);border-color:var(--border-medium);">
            <div class="w-2.5 h-2.5 rounded-full shrink-0 transition-colors shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" :style="{ background: newStatus.color }"></div>
            <span class="sp-preview-name flex-1 text-[13px] font-bold flex items-center gap-1.5" style="color:var(--text-primary);">
              <span v-html="statusIconOptions.find(i => i.value === newStatus.iconId)?.svg" class="sp-status-preview-icon w-[14px] h-[14px] flex items-center" :style="{ color: newStatus.color }"></span>
              {{ newStatus.title || 'Status Name' }}
            </span>
            <span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style="background:var(--bg-surface-3);color:var(--text-muted);">0</span>
          </div>

          <!-- Status Name -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-bold uppercase tracking-[0.06em]" style="color:var(--text-muted);">Status Name</label>
            <input v-model="newStatus.title" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] transition-[border-color,box-shadow] duration-150 sp-input" placeholder="e.g. Review, Blocked..." maxlength="100"/>
          </div>

          <!-- Color picker -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-bold uppercase tracking-[0.06em]" style="color:var(--text-muted);">Color</label>
            <div class="grid grid-cols-8 gap-1.5">
              <button
                v-for="c in statusColors" :key="c"
                class="w-7 h-7 rounded-[7px] border-[2.5px] cursor-pointer flex items-center justify-center transition-all hover:scale-110"
                :class="newStatus.color === c ? 'border-white shadow-[0_0_0_2px_currentColor] scale-110' : 'border-transparent'"
                :style="{ background: c }"
                @click="newStatus.color = c"
              >
                <svg v-if="newStatus.color === c" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <!-- Custom color -->
              <label class="sp-color-custom w-7 h-7 rounded-[7px] border-[2.5px] border-transparent" title="Custom color">
                <input type="color" v-model="newStatus.color" class="sp-color-input"/>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
              </label>
            </div>
          </div>

          <!-- Icon picker -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-bold uppercase tracking-[0.06em]" style="color:var(--text-muted);">Icon</label>
            <div class="grid grid-cols-8 gap-[5px]">
              <button
                v-for="ic in statusIconOptions" :key="ic.value"
                class="sp-icon-option w-8 h-8 rounded-[8px] border-[1.5px] flex items-center justify-center text-[15px] cursor-pointer transition-all hover:scale-110 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                :class="newStatus.iconId === ic.value ? 'shadow-[0_0_0_2px_rgba(139,92,246,0.25)]' : 'border-[var(--border-base)] bg-[var(--bg-surface-2)] hover:border-violet-400 hover:bg-[var(--bg-hover)]'"
                :style="newStatus.iconId === ic.value ? { borderColor: newStatus.color, background: `${newStatus.color}18`, color: newStatus.color } : undefined"
                :title="ic.label"
                @click="newStatus.iconId = ic.value"
                v-html="ic.svg"
              ></button>
            </div>
          </div>

          <!-- Current Statuses -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-bold uppercase tracking-[0.06em]" style="color:var(--text-muted);">Current Statuses</label>
            <div class="flex flex-col rounded-[12px] overflow-hidden border" style="border-color:var(--border-base);">
              <div v-for="col in columns" :key="col.id" class="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[var(--bg-hover)]" style="background:var(--bg-surface-2);border-bottom:1px solid var(--border-base);">
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: col.color }"></span>
                <span class="flex-1 text-[12.5px] font-semibold" style="color:var(--text-primary);">{{ col.title }}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style="background:var(--bg-surface-3);color:var(--text-muted);">{{ columnList(col.id).length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-4 py-3 pb-4 shrink-0" style="border-top:1px solid var(--border-base);background:var(--bg-surface);">
          <button class="h-[34px] px-3.5 rounded-[9px] border-[1.5px] bg-transparent text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-[var(--bg-surface-2)]" style="border-color:var(--border-medium);color:var(--text-secondary);" @click="resetNewStatus">Reset</button>
          <button class="flex items-center gap-1.5 h-[34px] px-4 rounded-[9px] border-none text-white text-[12.5px] font-bold cursor-pointer bg-gradient-to-br from-violet-500 to-indigo-500 hover:opacity-90 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed" style="box-shadow:0 4px 14px rgba(139,92,246,0.3);" :disabled="!newStatus.title.trim() || submittingStatus" @click="createStatus">
            <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ submittingStatus ? 'Creating...' : 'Create Status' }}
          </button>
        </div>
      </aside>
    </Transition>

    <!-- ADD TASK MODAL -->
    <Transition name="modal">
      <div v-if="showAddModal" class="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-[4px]" @click.self="showAddModal = false">
        <div class="modal-box rounded-[20px] border overflow-hidden flex flex-col" style="background:var(--bg-surface);border-color:var(--border-medium);box-shadow:0 32px 80px rgba(0,0,0,0.3);width:calc(100% - 32px);max-width:560px;max-height:90vh;">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 shrink-0" style="border-bottom:1px solid var(--border-base);">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-[8px] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500">
                <svg class="w-3.5 h-3.5 stroke-white" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><rect x="3" y="3" width="14" height="14" rx="3"/><polyline points="7 10 9.5 12.5 13 8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <h2 class="text-[16px] font-extrabold m-0" style="color:var(--text-heading);">New Task</h2>
            </div>
            <button class="w-[30px] h-[30px] rounded-[8px] border-none flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500" style="background:var(--bg-surface-3);color:var(--text-muted);" @click="showAddModal = false">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4" style="scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb) transparent;">

            <!-- Title -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Title <span style="color:#ef4444">*</span></label>
              <input v-model="newTask.name" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] transition-[border-color,box-shadow] duration-150 modal-input" placeholder="What needs to be done?" @keydown.enter="submitNewTask"/>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Description <span class="normal-case font-normal" style="color:var(--text-subtle);">(optional)</span></label>
              <textarea v-model="newTask.desc" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] transition-[border-color,box-shadow] duration-150 resize-y min-h-[80px] modal-textarea" placeholder="Add more context…" rows="2"></textarea>
            </div>

            <!-- Status + Priority -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Status</label>
                <select v-model="newTask.status" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 modal-select">
                  <option v-for="col in columns" :key="col.id" :value="col.id">{{ col.title }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Priority</label>
                <select v-model="newTask.priority" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 modal-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <!-- Sprint + Label -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <label class="block text-[11px] font-bold uppercase tracking-[0.06em]" style="color:var(--text-muted);">Sprint</label>
                  <span class="text-[10.5px] font-semibold truncate" style="color:var(--text-subtle);max-width:150px;" :title="currentSprint.name">
                    {{ currentSprint.name }}
                  </span>
                </div>
                <select v-model="newTask.sprintId" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 modal-select">
                  <option v-for="sp in modalSprintOptions" :key="sp.id || '__backlog'" :value="sp.id">
                    {{ sp.name }}{{ sp.dates ? ' - ' + sp.dates : '' }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Label</label>
                <div class="flex flex-wrap gap-1">
                  <span v-if="newTask.label" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold" :style="{ background: store.labelPresets[newTask.label]?.bg, color: store.labelPresets[newTask.label]?.color }">
                    {{ newTask.label }}
                    <button class="border-none bg-transparent cursor-pointer p-0 leading-none opacity-60 hover:opacity-100" @click="newTask.label = ''">×</button>
                  </span>
                  <div class="relative">
                    <button class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border-none text-[11.5px] font-semibold cursor-pointer transition-all" style="background:var(--bg-surface-3);color:var(--text-subtle);" @click.stop="modalLabelPickerOpen = !modalLabelPickerOpen">
                      <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Label
                    </button>
                    <div v-if="modalLabelPickerOpen" class="absolute left-0 top-full mt-1 w-[190px] rounded-[12px] border py-1 z-[50]" style="background:var(--bg-surface);border-color:var(--border-medium);box-shadow:0 12px 36px rgba(0,0,0,0.14);" @click.stop>
                      <div class="flex items-center gap-1.5 px-2.5 py-1.5 border-b" style="border-color:var(--border-base);">
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-subtle)"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                        <input v-model="modalLabelSearch" class="flex-1 bg-transparent border-none outline-none text-[12px] font-[inherit]" style="color:var(--text-primary);" placeholder="Search or create…" @keydown.enter="modalCreateOrPickLabel"/>
                      </div>
                      <div class="max-h-[160px] overflow-y-auto" style="scrollbar-width:thin;">
                        <div v-for="([lbl, style]) in modalFilteredLabels" :key="lbl" class="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-[var(--bg-hover)]" :class="{ 'bg-indigo-50': newTask.label === lbl }" @click="modalSetLabel(lbl)">
                          <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: style.color }"/>
                          <span class="flex-1 text-[12px]" style="color:var(--text-primary);">{{ lbl }}</span>
                          <svg v-if="newTask.label === lbl" class="w-3 h-3 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div v-if="modalLabelSearch.trim() && !store.labelPresets[modalLabelSearch.trim()]" class="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-indigo-500 transition-colors hover:bg-indigo-50" @click="modalCreateOrPickLabel">
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          <span class="text-[12px] font-semibold">Create "{{ modalLabelSearch.trim() }}"</span>
                        </div>
                        <div v-if="!modalFilteredLabels.length && !modalLabelSearch.trim()" class="px-2.5 py-3 text-center text-[11px]" style="color:var(--text-subtle);">No labels yet</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Due Date + Start Date -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Due Date</label>
                <input v-model="newTask.due" type="date" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 modal-select"/>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Start Date</label>
                <input v-model="newTask.startDate" type="date" class="w-full rounded-[10px] border-[1.5px] border-[var(--border-medium)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[13px] px-3 py-[9px] outline-none font-[inherit] appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 modal-select"/>
              </div>
            </div>

            <!-- Assignees (multi-search) -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Assignees</label>
              <div class="flex items-center gap-1.5 rounded-[10px] border-[1.5px] px-2.5 h-[36px] transition-colors focus-within:border-indigo-500" style="background:var(--bg-surface-2);border-color:var(--border-medium);">
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-subtle)"><circle cx="8.5" cy="8.5" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>
                <input v-model="modalAssigneeSearch" class="flex-1 bg-transparent border-none outline-none text-[12.5px] font-[inherit]" style="color:var(--text-primary);" placeholder="Search members…"/>
              </div>
              <div v-if="newTask.assigneeIds.length" class="flex flex-wrap gap-1.5 mt-1.5">
                <span v-for="id in newTask.assigneeIds" :key="id" class="inline-flex items-center gap-1 py-0.5 pl-1 pr-2 rounded-full border-[1.5px] text-[11px] font-semibold" :style="{ background: store.getMember(id)?.color + '22', borderColor: store.getMember(id)?.color, color: store.getMember(id)?.color }">
                  <span class="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0" :style="{ background: store.getMember(id)?.color }">{{ store.getMember(id)?.initials }}</span>
                  {{ store.getMember(id)?.name.split(' ')[0] }}
                  <button class="bg-transparent border-none cursor-pointer p-0 flex items-center opacity-60 hover:opacity-100 text-inherit" @click="modalToggleAssignee(id)">
                    <svg class="w-2 h-2" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
                  </button>
                </span>
              </div>
              <div v-if="modalFilteredAssignees.length" class="mt-1 rounded-[10px] border-[1.5px] overflow-hidden max-h-[150px] overflow-y-auto" style="background:var(--bg-surface);border-color:var(--border-medium);">
                <button v-for="m in modalFilteredAssignees" :key="m.id" class="flex items-center gap-2 w-full px-3 py-[7px] border-none bg-transparent cursor-pointer text-left transition-colors hover:bg-[var(--bg-surface-2)]" :class="{ 'bg-indigo-500/5': newTask.assigneeIds.includes(m.id) }" @click="modalToggleAssignee(m.id)">
                  <span class="w-[20px] h-[20px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0" :style="{ background: m.color }">{{ m.initials }}</span>
                  <span class="text-[12.5px] flex-1" style="color:var(--text-primary);">{{ m.name }}</span>
                  <svg v-if="newTask.assigneeIds.includes(m.id)" class="w-3 h-3 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>

            <!-- Group (dropdown) -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5" style="color:var(--text-muted);">Group</label>
              <div class="relative">
                <button type="button" class="flex items-center gap-2 w-full h-[36px] px-2.5 rounded-[10px] border-[1.5px] text-[12.5px] font-medium cursor-pointer text-left transition-all" :class="modalGroupPickerOpen ? 'border-indigo-500' : ''" style="background:var(--bg-surface-2);border-color:var(--border-medium);color:var(--text-primary);" @click.stop="modalGroupPickerOpen = !modalGroupPickerOpen">
                  <template v-if="newTask.groupId">
                    <span class="w-[9px] h-[9px] rounded-full shrink-0" :style="{ background: projectGroups.find(g => g.id === newTask.groupId)?.color }"/>
                    <span class="flex-1 font-semibold">{{ projectGroups.find(g => g.id === newTask.groupId)?.name }}</span>
                  </template>
                  <template v-else>
                    <span class="flex-1" style="color:var(--text-subtle);">— No group —</span>
                  </template>
                  <svg class="w-3 h-3 shrink-0 transition-transform" :class="modalGroupPickerOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-if="modalGroupPickerOpen" class="absolute left-0 right-0 top-[calc(100%+4px)] rounded-[12px] border p-1 z-[50]" style="background:var(--bg-surface);border-color:var(--border-medium);box-shadow:0 12px 36px rgba(0,0,0,0.14);" @click.stop>
                  <button type="button" class="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg border-none text-[12.5px] cursor-pointer text-left transition-colors hover:bg-[var(--bg-hover)]" :class="!newTask.groupId ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent'" style="color:var(--text-primary);" @click="newTask.groupId = ''; modalGroupPickerOpen = false">
                    <span class="w-[9px] h-[9px] rounded-full shrink-0" style="background:var(--bg-surface-3);border:1.5px solid var(--border-medium);"/>
                    <span class="flex-1 font-medium">No group</span>
                    <svg v-if="!newTask.groupId" class="w-3 h-3 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <div class="h-px my-1" style="background:var(--border-base);"/>
                  <button v-for="g in projectGroups" :key="g.id" type="button" class="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg border-none text-[12.5px] cursor-pointer text-left transition-colors hover:bg-[var(--bg-hover)]" :class="newTask.groupId === g.id ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent'" style="color:var(--text-primary);" @click="newTask.groupId = g.id; modalGroupPickerOpen = false">
                    <span class="w-[9px] h-[9px] rounded-full shrink-0" :style="{ background: g.color }"/>
                    <span class="flex-1 font-medium">{{ g.name }}</span>
                    <svg v-if="newTask.groupId === g.id" class="w-3 h-3 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <div v-if="!projectGroups.length" class="px-2.5 py-3 text-center text-[11px]" style="color:var(--text-subtle);">No groups yet</div>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2.5 px-6 py-4 shrink-0" style="border-top:1px solid var(--border-base);">
            <button class="h-9 px-4 rounded-[10px] border-[1.5px] bg-transparent text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--bg-surface-2)]" style="border-color:var(--border-medium);color:var(--text-secondary);" @click="showAddModal = false">Cancel</button>
            <button class="h-9 px-5 rounded-[10px] border-none text-white text-[13px] font-bold cursor-pointer bg-gradient-to-br from-indigo-500 to-violet-500 hover:opacity-90 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed" style="box-shadow:0 4px 14px rgba(99,102,241,0.3);" @click="submitNewTask" :disabled="!newTask.name.trim() || !newTask.status || submittingTask">
              {{ submittingTask ? 'Creating...' : 'Create Task' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>


    <!-- Global overlay (close menus) -->
    <div v-if="sprintMenuOpen || activeCardMenu" class="fixed inset-0 z-[80]" @click="closeAllMenus"></div>
    <TaskDetailModal v-model="detailOpen" :task-id="selectedTaskId" @deleted="onTaskDeleted"/>
    <AICreateTaskModal
      v-model="aiCreateOpen"
      :project-id="effectiveProjectId"
      :status-id="aiDefaultStatusId"
      :sprint-id="selectedModalSprintId"
      @created="onAiTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import type { TaskGroup } from '@/api/tasks'
import { useProjectSettingsQuery } from '@/api/projects'
import { extractApiErrorMessage } from '@/composables/useApiError'
import { useToast } from '@/composables/useToast'
import UserProfileHover, { type UserHoverProfile } from '@/components/common/UserProfileHover.vue'
import { fetchProjectGroupsQuery } from '@/features/tasks/composables/useTaskGroupsQuery'
import {
  useBoardMembers,
  type ProjectMember,
} from '@/features/tasks/composables/useBoardMembers'
import { useBoardSprints } from '@/features/tasks/composables/useBoardSprints'
import {
  useBoardStatuses,
  type BoardStatusColumn,
} from '@/features/tasks/composables/useBoardStatuses'
import { useCreateProjectSprintMutation } from '@/features/tasks/composables/useSprintsQuery'
import { useProjectStore } from '@/stores/project.store'
import { useTaskStore } from '@/stores/task.store'
import { useAuthStore } from '@/stores/auth.store'
import { storeToRefs } from 'pinia'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import AICreateTaskModal from '../components/AICreateTaskModal.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import type { User } from '@/types/user.types'

const store = useTaskStore()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const { currentProjectId } = storeToRefs(projectStore)
const createSprintMutation = useCreateProjectSprintMutation()
const toast = useToast()
const route = useRoute()
const routeProjectId = computed(() =>
  typeof route.params.projectId === 'string' ? route.params.projectId : null
)
const effectiveProjectId = computed(() => routeProjectId.value ?? currentProjectId.value)
const projectSettingsQuery = useProjectSettingsQuery(effectiveProjectId)

/* ── Types ─────────────────────────────────────────────────────── */
interface Member extends UserHoverProfile { initial: string; color: string }
interface Subtasks { done: number; total: number }
interface Task {
  id: string
  name: string
  desc?: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress?: number
  due: string
  assignees: Member[]
  tags?: string[]
  subtasks?: Subtasks
  groupId?: string | null
  sprintId?: string
}

/* ── Columns ─────────────────────────────────────────────────────── */
const columns = [
  { id: 'todo',       title: 'To Do',       color: '#6366f1', emptyIcon: '📋', emptyText: 'No tasks here yet. Add one!' },
  { id: 'inprogress', title: 'In Progress',  color: '#f59e0b', emptyIcon: '🚧', emptyText: 'Nothing in progress. Start a task!' },
  { id: 'done',       title: 'Done',         color: '#10b981', emptyIcon: '🎉', emptyText: 'No completed tasks yet.' },
]
const activeCardMenu = ref<string | null>(null)
const tasksBySprintId = ref<Record<string, Task[]>>({})

const {
  sprints,
  selectedSprintId,
  sprintMenuOpen,
  sprintBtnRef,
  sprintDropStyle,
  currentSprint,
  showNewSprintForm,
  sprintColorOptions,
  newSprint,
  remoteSprintCache,
  toggleSprintMenu,
  selectSprint,
  createSprint,
  loadProjectSprints,
  persistSelectedSprint,
} = useBoardSprints({
  effectiveProjectId,
  createSprint: createSprintMutation.mutateAsync,
  onSprintCreated: (id) => {
    tasksBySprintId.value[id] = []
  },
  toast,
  activeCardMenu,
})

const {
  memberPickerOpen,
  memberSearch,
  memberPickerRef,
  memberPickerBtnRef,
  memberPickerDropRef,
  memberSearchInput,
  memberPickerStyle,
  visibleAvatarCount,
  addingMemberId,
  removingMemberId,
  updatingRoleMemberId,
  memberRoleOptions,
  assignableUsersQuery,
  searchedUsers,
  canManageProjectMembers,
  canCurrentUserCreateTask,
  userInitials,
  userAvatarColor,
  isProjectOwner,
  canUpdateMemberRole,
  updateMemberPickerPos,
  openMemberPicker,
  addMemberFromPicker,
  removeMemberFromPicker,
  updateMemberRoleFromPicker,
  onMemberPickerDocClick,
  copyInviteLink,
} = useBoardMembers({
  authUserId: computed(() => authStore.user?.id ?? null),
  members: computed(() => store.members as ProjectMember[]),
  effectiveProjectId,
  projectRolePermissions: computed(() => projectSettingsQuery.data.value?.rolePermissions),
  sprintMenuOpen,
  activeCardMenu,
  syncBoardFromStore,
  addMemberToProject: store.addMemberToProject,
  removeMemberFromProject: store.removeMemberFromProject,
  updateMemberRoleInProject: store.updateMemberRoleInProject,
  toast,
})

/* -- Tasks per sprint --------------------------------------------- */
const projectGroups = ref<TaskGroup[]>([])
const groupByGroup = ref(false)

function profileForMember(member: ProjectMember): UserHoverProfile {
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

function profileForUser(user: User): UserHoverProfile {
  const name = user.fullName?.trim() || user.email || 'User'
  return {
    id: user.id,
    name,
    initials: userInitials(user),
    color: userAvatarColor(user),
    email: user.email,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    jobTitle: user.jobTitle,
    phone: user.phone,
    bio: user.bio,
  }
}

function toBoardMember(member: ProjectMember): Member {
  return {
    id: member.id,
    initials: member.initials ?? member.name.charAt(0).toUpperCase(),
    initial: member.initials ?? member.name.charAt(0).toUpperCase(),
    name: member.name,
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

function readTags(tags: unknown): string[] {
  if (!tags || typeof tags !== 'object') return []
  const label = (tags as { label?: unknown }).label
  return typeof label === 'string' && label.trim() ? [label.trim()] : []
}

function toBoardTask(task: import('@/stores/task.store').Task): Task {
  const progress = store.subtaskProgress(task.id)
  return {
    id: task.id,
    name: task.title,
    desc: task.description?.startsWith('<') ? '' : task.description,
    status: task.status,
    priority: task.priority,
    due: task.due,
    assignees: task.assignees.map(toBoardMember),
    tags: task.label ? [task.label] : readTags(task.tags),
    subtasks: progress.total ? progress : undefined,
    groupId: task.groupId,
    sprintId: task.sprint,
  }
}

function tasksForSprint(sprintId: string) {
  return store.tasks.filter((task) => !task.parentTaskId && (task.sprint || '') === sprintId)
}

function syncBoardFromStore() {
  columns.splice(
    0,
    columns.length,
    ...store.columns.map((col) => ({
      id: col.id,
      title: col.title,
      color: col.color,
      emptyIcon: col.icon || '•',
      emptyText: `No tasks in ${col.title}. Add one!`,
    }))
  )

  const nextTasksBySprint: Record<string, Task[]> = {
    '': tasksForSprint('').map(toBoardTask),
  }

  remoteSprintCache.value.forEach((sprint) => {
    nextTasksBySprint[sprint.id] = tasksForSprint(sprint.id).map(toBoardTask)
  })
  tasksBySprintId.value = nextTasksBySprint

  if (!tasksBySprintId.value[selectedSprintId.value]) {
    selectedSprintId.value = ''
    persistSelectedSprint('')
  }
}

async function syncProjectBoard(projectId: string | null) {
  if (!projectId) {
    store.resetProjectBoard()
    remoteSprintCache.value = []
    projectGroups.value = []
    syncBoardFromStore()
    return
  }

  await Promise.all([
    store.loadProjectBoard(projectId),
    store.loadProjectTrash(projectId),
    loadProjectSprints(projectId),
    fetchProjectGroupsQuery(projectId).then((groups) => { projectGroups.value = groups }),
  ])
  syncBoardFromStore()
}

watch(
  routeProjectId,
  async (projectId) => {
    try {
      await syncProjectBoard(projectId)
    } catch {
      toast.error('Cannot load board data')
    }
  },
  { immediate: true }
)

watch(
  () => [store.tasks, store.columns, store.members] as const,
  () => syncBoardFromStore(),
  { deep: true }
)

function columnList(colId: string): Task[] {
  const all = tasksBySprintId.value[selectedSprintId.value] ?? []
  const tasks = all.filter(t => t.status === colId)
  if (!groupByGroup.value) return tasks

  return [...tasks].sort((a, b) => {
    const groupDiff = groupSortIndex(a.groupId) - groupSortIndex(b.groupId)
    if (groupDiff !== 0) return groupDiff
    return a.name.localeCompare(b.name)
  })
}

function groupKey(groupId?: string | null) {
  return groupId || '__ungrouped'
}

function groupSortIndex(groupId?: string | null) {
  const key = groupKey(groupId)
  if (key === '__ungrouped') return projectGroups.value.length + 1
  const idx = projectGroups.value.findIndex((group) => group.id === key)
  return idx >= 0 ? idx : projectGroups.value.length
}

function groupName(groupId?: string | null) {
  if (!groupId) return 'No group'
  return projectGroups.value.find((group) => group.id === groupId)?.name ?? 'No group'
}

function groupColor(groupId?: string | null) {
  if (!groupId) return '#64748b'
  return projectGroups.value.find((group) => group.id === groupId)?.color ?? '#64748b'
}

function groupTaskCount(colId: string, groupId?: string | null) {
  return columnList(colId).filter((task) => groupKey(task.groupId) === groupKey(groupId)).length
}

function shouldShowGroupHeader(task: Task, colId: string) {
  const tasks = columnList(colId)
  const index = tasks.findIndex((item) => item.id === task.id)
  if (index <= 0) return true
  return groupKey(tasks[index - 1].groupId) !== groupKey(task.groupId)
}

/* ── Sprint Stats ───────────────────────────────────────────────── */
const currentTasks = computed(() => tasksBySprintId.value[selectedSprintId.value] ?? [])

const {
  statusPanelOpen,
  statusColors,
  statusIconOptions,
  newStatus,
  submittingStatus,
  resetNewStatus,
  createStatus,
  sprintProgress,
  openColMenuId,
  colMenuRefs,
  toggleColMenu,
  onDocColMenuClick,
  editingColId,
  editingColTitle,
  colEditInputs,
  startColEdit,
  cancelColEdit,
  saveColEdit,
  deleteColTarget,
  deleteColMoveTarget,
  deletingCol,
  deleteColTaskCount,
  startColDelete,
  cancelColDelete,
  confirmColDelete,
} = useBoardStatuses<Task>({
  columns: columns as BoardStatusColumn[],
  currentTasks,
  effectiveProjectId,
  sprintMenuOpen,
  activeCardMenu,
  columnList,
  createStatusInProject: store.createStatusInProject,
  updateStatusInProject: store.updateStatusInProject,
  deleteStatusInProject: store.deleteStatusInProject,
  syncProjectBoard,
  toast,
  taskStatus: (task) => task.status,
})

/* ── Left Sidebar ──────────────────────────────────────────────── */
const isMobile = ref(false)
const sidebarOpen = ref(false)
function handleBoardWindowResize() {
  isMobile.value = window.innerWidth < 768
  if (memberPickerOpen.value) updateMemberPickerPos()
}

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  sidebarOpen.value = !isMobile.value // open by default on desktop only
  document.addEventListener('click', onMemberPickerDocClick)
  document.addEventListener('click', onDocColMenuClick)
  window.addEventListener('resize', handleBoardWindowResize)
  window.addEventListener('scroll', updateMemberPickerPos, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onMemberPickerDocClick)
  document.removeEventListener('click', onDocColMenuClick)
  window.removeEventListener('resize', handleBoardWindowResize)
  window.removeEventListener('scroll', updateMemberPickerPos, true)
})

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
  const groups = projectGroups.value.length
    ? projectGroups.value
    : [{ id: '__ungrouped', name: 'No group', color: '#64748b' }]

  return groups.map(gd => {
    const matched = gd.id === '__ungrouped'
      ? tasks.filter((task) => !task.groupId)
      : tasks.filter((task) => task.groupId === gd.id)
    const memberMap = new Map<string, Member>()
    matched.forEach(t => t.assignees.forEach(m => memberMap.set(m.initial, m)))
    return {
      id: gd.id,
      name: gd.name,
      color: gd.color ?? '#64748b',
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
  return columns.find((col) => col.id === status)?.color ?? '#94a3b8'
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
async function onColChange(evt: any, colId: string) {
  if (!evt.added || !effectiveProjectId.value) return

  try {
    await store.moveTaskToStatus(effectiveProjectId.value, (evt.added.element as Task).id, colId)
    syncBoardFromStore()
  } catch {
    toast.error('Cannot update task status')
    await syncProjectBoard(effectiveProjectId.value)
  }
}

/* ── Card menu ──────────────────────────────────────────────────── */
function toggleCardMenu(id: string) {
  activeCardMenu.value = activeCardMenu.value === id ? null : id
}
async function moveTask(task: Task, status: string) {
  if (!effectiveProjectId.value) return
  try {
    await store.moveTaskToStatus(effectiveProjectId.value, task.id, status)
    syncBoardFromStore()
  } catch {
    toast.error('Cannot update task status')
  }
  activeCardMenu.value = null
}
async function deleteTask(id: string) {
  try {
    await store.deleteTaskRemote(id, effectiveProjectId.value)
    if (effectiveProjectId.value) await syncProjectBoard(effectiveProjectId.value)
  } catch {
    toast.error('Cannot delete task')
  }
  activeCardMenu.value = null
}
function openTask(task: Task) {
  selectedTaskId.value = task.id
  detailOpen.value = true
}

async function onTaskDeleted() {
  selectedTaskId.value = null
  detailOpen.value = false
  if (effectiveProjectId.value) await syncProjectBoard(effectiveProjectId.value)
}

/* ── Add task modal ─────────────────────────────────────────────── */
const showAddModal  = ref(false)
const detailOpen = ref(false)
const selectedTaskId = ref<string | null>(null)
const aiCreateOpen = ref(false)
const submittingTask = ref(false)

const newTaskDefault = () => ({
  name: '', desc: '', status: 'todo', priority: 'medium',
  due: '', startDate: '', assigneeIds: [] as string[], groupId: '',
  sprintId: '', label: '',
})
const newTask = ref(newTaskDefault())
const modalSprintOptions = computed(() => sprints.value)
const selectedModalSprintId = computed(() => {
  return modalSprintOptions.value.some((sprint) => sprint.id === selectedSprintId.value)
    ? selectedSprintId.value
    : ''
})
const aiDefaultStatusId = computed(() => store.columns[0]?.id ?? columns[0]?.id ?? null)

function openAiCreateTask() {
  if (!effectiveProjectId.value) {
    toast.error('Please select a project first')
    return
  }
  if (!canCurrentUserCreateTask.value) {
    toast.error('Your role is not allowed to create tasks')
    return
  }

  if (!aiDefaultStatusId.value) {
    toast.error('Please create a status before creating tasks')
    return
  }

  aiCreateOpen.value = true
}

async function onAiTaskCreated() {
  if (effectiveProjectId.value) {
    await syncProjectBoard(effectiveProjectId.value)
  }
}

/* label picker for modal */
const modalLabelPickerOpen = ref(false)
const modalLabelSearch = ref('')
const modalFilteredLabels = computed(() => {
  const q = modalLabelSearch.value.toLowerCase()
  return Object.entries(store.labelPresets).filter(([lbl]) => lbl.toLowerCase().includes(q))
})
function modalSetLabel(lbl: string) {
  newTask.value.label = newTask.value.label === lbl ? '' : lbl
  modalLabelPickerOpen.value = false
  modalLabelSearch.value = ''
}
const MODAL_LABEL_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#06b6d4','#8b5cf6','#ef4444','#f97316']
function modalCreateOrPickLabel() {
  const name = modalLabelSearch.value.trim()
  if (!name) return
  if (!store.labelPresets[name]) {
    const color = MODAL_LABEL_COLORS[Math.floor(Math.random() * MODAL_LABEL_COLORS.length)]
    store.labelPresets[name] = { bg: color + '20', color }
  }
  modalSetLabel(name)
}

/* assignee search for modal */
const modalAssigneeSearch = ref('')
const modalFilteredAssignees = computed(() => {
  const q = modalAssigneeSearch.value.trim().toLowerCase()
  if (!q) return []
  return store.members.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.initials.toLowerCase().includes(q) ||
    (m.email ?? '').toLowerCase().includes(q)
  )
})
function modalToggleAssignee(id: string) {
  const ids = newTask.value.assigneeIds
  const idx = ids.indexOf(id)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(id)
}

/* group picker for modal */
const modalGroupPickerOpen = ref(false)

function addTask(colId: string) {
  if (!canCurrentUserCreateTask.value) {
    toast.error('Your role is not allowed to create tasks')
    return
  }
  newTask.value = { ...newTaskDefault(), status: colId,
    sprintId: selectedModalSprintId.value }
  modalLabelPickerOpen.value = false
  modalGroupPickerOpen.value = false
  showAddModal.value = true
}

async function submitNewTask() {
  if (!newTask.value.name.trim() || !effectiveProjectId.value) return
  if (!canCurrentUserCreateTask.value) {
    toast.error('Your role is not allowed to create tasks')
    return
  }
  if (!newTask.value.status) {
    toast.error('Please select a status for the task')
    return
  }

  submittingTask.value = true
  try {
    const labelStyle = newTask.value.label ? store.labelPresets[newTask.value.label] : undefined
    await store.createTaskInProject({
      projectId: effectiveProjectId.value,
      title: newTask.value.name.trim(),
      description: newTask.value.desc.trim(),
      statusId: newTask.value.status,
      priority: newTask.value.priority as Task['priority'],
      dueDate: newTask.value.due || undefined,
      startDate: newTask.value.startDate || undefined,
      assigneeIds: newTask.value.assigneeIds.length ? newTask.value.assigneeIds : undefined,
      groupId: newTask.value.groupId || undefined,
      sprintId: newTask.value.sprintId || undefined,
      label: newTask.value.label || undefined,
      labelBg: labelStyle?.bg,
      labelColor: labelStyle?.color,
    })
    await syncProjectBoard(effectiveProjectId.value)
    showAddModal.value = false
  } catch (error) {
    toast.error(extractApiErrorMessage(error, 'Cannot create task'))
  } finally {
    submittingTask.value = false
  }
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
function closeAllMenus() { sprintMenuOpen.value = false; activeCardMenu.value = null; openColMenuId.value = null }

/* ── Column context menu ──────────────────────────────────────── */
/* ── Column inline edit ───────────────────────────────────────── */
/* ── Column delete ────────────────────────────────────────────── */
const boardWrapRef = ref<HTMLElement | null>(null)
const boardWrapWidth = ref(0)
const colWidth = computed<number | null>(() => {
  if (window.innerWidth < 768) return null  // let CSS handle mobile
  if (boardWrapWidth.value <= 0) return 340
  const hPad = 48
  const gaps = 24
  const available = boardWrapWidth.value - hPad - gaps
  const w = Math.floor(available / 3)
  return Math.max(300, Math.min(480, w))
})

let boardWrapObserver: ResizeObserver | null = null
onMounted(() => {
  if (boardWrapRef.value) {
    boardWrapObserver = new ResizeObserver((entries) => {
      // contentRect.width = content-box width (including padding due to box-sizing)
      boardWrapWidth.value = entries[0].target.getBoundingClientRect().width
    })
    boardWrapObserver.observe(boardWrapRef.value)
    boardWrapWidth.value = boardWrapRef.value.getBoundingClientRect().width
  }
})
onUnmounted(() => {
  boardWrapObserver?.disconnect()
})
</script>

<style scoped>
/* ── Sidebar transition ── */
.sidebar-enter-active { animation: sbIn 0.22s cubic-bezier(0.22,1,0.36,1); }
.sidebar-leave-active { animation: sbOut 0.18s ease forwards; }
@keyframes sbIn  { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes sbOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }

/* ── Sidebar backdrop transition ── */
.sidebar-backdrop-enter-active { transition: opacity 0.22s ease; }
.sidebar-backdrop-leave-active { transition: opacity 0.18s ease; }
.sidebar-backdrop-enter-from, .sidebar-backdrop-leave-to { opacity: 0; }

* { box-sizing: border-box; }

/* ── Sprint/card dropdown animation ── */
.sprint-drop, .card-drop { animation: dropIn 0.18s ease; }
@keyframes dropIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }


/* ── Sprint form input focus ── */
.sprint-inp:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }

/* ── vuedraggable drag states (:deep needed) ── */
:deep(.card-ghost) {
  opacity: 0.35;
  background: var(--bg-surface-3) !important;
  border: 2px dashed #6366f1 !important;
  border-radius: 14px;
  box-shadow: none !important;
}
:deep(.card-chosen) {
  box-shadow: 0 12px 36px rgba(99,102,241,0.25) !important;
  border-color: #6366f1 !important;
  transform: scale(1.02);
}
:deep(.card-drag) {
  opacity: 0.9;
  transform: rotate(2deg) scale(1.03);
  box-shadow: 0 20px 50px rgba(0,0,0,0.22) !important;
  cursor: grabbing !important;
}


/* ── Sidebar task list transition ── */
.sb-tasks-enter-active { animation: sbTasksIn 0.2s ease; }
.sb-tasks-leave-active { animation: sbTasksOut 0.15s ease forwards; }
@keyframes sbTasksIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes sbTasksOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-4px); } }

/* ── Status panel transition ── */
.status-panel-enter-active { animation: spIn 0.24s cubic-bezier(0.22,1,0.36,1); }
.status-panel-leave-active { animation: spOut 0.18s ease forwards; }
@keyframes spIn  { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
@keyframes spOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(28px); } }

/* ── Modal transition ── */
.modal-enter-active .modal-box { animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.modal-leave-active .modal-box { animation: modalOut 0.2s ease forwards; }
@keyframes modalIn  { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes modalOut { from { opacity: 1; } to { opacity: 0; transform: scale(0.95); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* ── Status panel sp-preview :has() ── */
.sp-preview:has(.sp-preview-name:not(:empty)) { border-color: #8b5cf6; border-style: solid; }

.sp-status-preview-icon :deep(svg),
.sp-icon-option :deep(svg) {
  width: 15px;
  height: 15px;
  color: inherit;
  stroke: currentColor;
}

/* ── Custom color swatch (conic-gradient) ── */
.sp-color-custom {
  background: conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #0ea5e9, #8b5cf6, #ec4899, #ef4444);
  position: relative; overflow: hidden; cursor: pointer;
}
.sp-color-input {
  position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%;
  cursor: pointer; border: none; padding: 0;
}
.sp-color-custom svg { width: 12px; height: 12px; stroke: #fff; position: relative; z-index: 1; }

/* ── sp-input focus ring ── */
.sp-input:focus, .sp-textarea:focus {
  border-color: #8b5cf6 !important;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
  outline: none;
}
/* ── modal input focus ring ── */
.modal-input:focus, .modal-textarea:focus, .modal-select:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  outline: none;
}

/* ── Board col mobile override ── */
@media (max-width: 767px) {
  .sprint-drop {
    width: min(260px, calc(100vw - 24px));
    min-width: 0 !important;
    max-width: calc(100vw - 24px);
  }

  .sprint-date-row {
    align-items: stretch;
    flex-direction: column;
  }

  .sprint-date-row > span {
    display: none;
  }

  .sprint-date-row .sprint-inp {
    width: 100%;
  }

  .board-sidebar {
    max-width: 240px;
  }

  .board-sidebar-head {
    padding: 10px 12px 9px;
  }

  .board-sidebar-body {
    padding-top: 6px;
  }

  .board-sidebar-group-row {
    gap: 6px;
    padding: 8px 10px;
  }

  .board-sidebar-group-row > span:first-child {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    font-size: 11px;
  }

  .board-sidebar-group-row > span:nth-child(2) {
    font-size: 12px;
  }

  .board-sidebar-group-row > button {
    display: none;
  }

  .board-sidebar-task-row {
    gap: 7px;
    padding: 5px 10px 5px 30px;
  }

  .board-sidebar-task-row > span:nth-child(2) {
    font-size: 11px;
  }

  .board-col {
    width: calc(100vw - 32px) !important;
    min-width: 240px;
    max-width: calc(100vw - 32px);
  }
}

/* ── cm-drop animation ───────────────────────────────────────────── */
.cm-drop-enter-active { animation: cmDropIn 0.15s ease; }
.cm-drop-leave-active { animation: cmDropOut 0.1s ease forwards; }
@keyframes cmDropIn  { from { opacity: 0; transform: translateY(-6px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes cmDropOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-4px) scale(0.96); } }

</style>





