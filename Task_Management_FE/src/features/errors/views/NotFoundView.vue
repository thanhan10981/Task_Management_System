<template>
  <div class="nf-root">
    <div class="nf-content">
      <div class="nf-badge">404</div>
      <h1 class="nf-title">Page Not Found</h1>
      <p class="nf-desc">The page you're looking for doesn't exist or has been moved.</p>
      <RouterLink to="/" class="nf-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Go back home
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.nf-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: #f8fafc;
}

.nf-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  max-width: 480px;
  width: 100%;
}

.nf-badge {
  font-size: clamp(5rem, 20vw, 9rem);
  font-weight: 900;
  color: #e2e8f0;
  line-height: 1;
  letter-spacing: -4px;
  user-select: none;
}

.nf-title {
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.nf-desc {
  font-size: clamp(0.8125rem, 3vw, 0.9375rem);
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: opacity 0.18s, transform 0.15s;
}
.nf-btn:hover { opacity: 0.88; transform: translateY(-1px); }

@media (max-width: 480px) {
  .nf-btn { padding: 10px 20px; font-size: 0.8125rem; }
}
</style>
