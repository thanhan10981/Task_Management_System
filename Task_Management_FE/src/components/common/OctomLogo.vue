<template>
  <div :class="['flex items-center', orientationClass]">
    <img
      :src="octomLogo"
      :width="iconSize"
      :height="iconSize"
      alt="Octom logo"
      class="object-contain shrink-0"
    />
    <span
      v-if="showText"
      :class="['font-extrabold tracking-tight select-none', textClass]"
      :style="textStyle"
    >
      OCTOM<span class="text-[#5046E5]">.</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import octomLogo from "@/assets/octom-logo.svg";

const props = withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
    orientation?: "row" | "col";
    textColor?: string;
  }>(),
  {
    size: "md",
    showText: true,
    orientation: "row",
    textColor: "",
  },
);

const iconSize = computed(() => {
  return { sm: 28, md: 36, lg: 48, xl: 72 }[props.size];
});

const textClass = computed(() => {
  const sizeMap = {
    sm: "text-base ml-0.5",
    md: "text-xl ml-0.5",
    lg: "text-3xl ml-1",
    xl: "text-5xl mt-0",
  };
  return `${sizeMap[props.size]} ${props.textColor || ""}`;
});

const textStyle = computed(() => {
  if (props.textColor) {
    return undefined;
  }
  return { color: "var(--text-heading)" };
});

const orientationClass = computed(() => {
  return props.orientation === "col"
    ? "flex-col items-center"
    : "flex-row items-center";
});
</script>
