<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-6 bg-slate-50">
    <div class="flex flex-col items-center text-center gap-4 max-w-[480px] w-full">

      <!-- 404 number -->
      <div class="font-black text-slate-200 leading-none tracking-[-4px] select-none text-[clamp(5rem,20vw,9rem)]">
        404
      </div>

      <!-- Title -->
      <h1 class="text-[clamp(1.25rem,4vw,1.75rem)] font-bold text-slate-800 m-0">
        Page Not Found
      </h1>

      <!-- Description -->
      <p class="text-[clamp(0.8125rem,3vw,0.9375rem)] text-slate-500 m-0 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <!-- Back button -->
      <RouterLink
        to="/"
        class="nf-btn mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-semibold no-underline transition-all duration-[180ms] max-[480px]:px-5 max-[480px]:py-2.5 max-[480px]:text-[0.8125rem]"
        style="box-shadow: 0 4px 14px rgba(99,102,241,0.35);"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Go back home
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* Hover transform + opacity — không thể dùng Tailwind với inline style */
.nf-btn:hover { opacity: 0.88; transform: translateY(-1px); }
</style>
