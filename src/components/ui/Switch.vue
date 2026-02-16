<template>
  <button 
      class="w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none"
      :class="modelValue ? 'bg-indigo-600' : 'bg-zinc-700'"
      @click="toggle"
  >
      <div 
        class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
      ></div>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

const toggle = () => {
    emit('update:modelValue', !props.modelValue);
};
</script>
