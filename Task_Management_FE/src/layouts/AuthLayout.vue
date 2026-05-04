<template>
  <div class="min-h-screen flex bg-[#0a0a1a] overflow-hidden">
    <!-- Animated background blobs -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="animate-blob animation-delay-0 absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-600/20 blur-3xl" />
      <div class="animate-blob animation-delay-2000 absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl" />
      <div class="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-violet-600/15 blur-3xl" />
    </div>

    <!-- Left decorative panel (hidden on mobile) -->
    <div class="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 overflow-hidden">
      <!-- Grid pattern overlay -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.03]"
        style="background-image: linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 40px 40px;"
      />

      <!-- Logo -->
      <div class="relative z-10">
        <OctomLogo size="md" textColor="text-white" />
      </div>

      <!-- Center hero text -->
      <div class="relative z-10 space-y-8">
        <div>
          <h2 class="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Organize your work,<br />
            <span class="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              elevate your team.
            </span>
          </h2>
          <p class="mt-4 text-slate-400 text-lg leading-relaxed max-w-md">
            The all-in-one task management platform to help your team plan, track, and deliver projects on time.
          </p>
        </div>

        <!-- Feature bullets -->
        <ul class="space-y-4">
          <li v-for="feat in features" :key="feat.text" class="flex items-start gap-3">
            <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="feat.icon" />
              </svg>
            </span>
            <div>
              <p class="text-sm font-semibold text-white">{{ feat.title }}</p>
              <p class="text-xs text-slate-500">{{ feat.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Bottom stats row -->
      <div class="relative z-10 flex gap-8">
        <div v-for="stat in stats" :key="stat.label">
          <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
          <p class="text-xs text-slate-500">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="relative flex flex-1 items-center justify-center p-6 lg:p-12">
      <div class="w-full max-w-md animate-fade-up">
        <!-- Mobile logo -->
        <div class="mb-8 lg:hidden">
          <OctomLogo size="md" textColor="text-white" />
        </div>

        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import OctomLogo from '@/components/common/OctomLogo.vue'

const features = [
  {
    title: 'Smart Task Tracking',
    text: 'Organize tasks with priorities, deadlines, and labels.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    title: 'Team Collaboration',
    text: 'Assign tasks, leave comments, and collaborate in real time.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Progress Analytics',
    text: 'Visual dashboards to track progress and spot bottlenecks.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
]

const stats = [
  { value: '10k+', label: 'Active users' },
  { value: '98%', label: 'Satisfaction' },
  { value: '4.9★', label: 'Rating' },
]
</script>
