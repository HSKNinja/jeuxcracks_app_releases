<template>
  <div v-if="show" class="fixed top-4 right-4 z-50">
    <div 
      :class="[
        'px-6 py-4 rounded-lg shadow-lg border-l-4 max-w-sm',
        type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : '',
        type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : '',
        type === 'warning' ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100' : '',
        type === 'info' ? 'bg-blue-900/90 border-blue-500 text-blue-100' : ''
      ]"
    >
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          <CheckCircleIcon v-if="type === 'success'" class="w-5 h-5" />
          <ExclamationTriangleIcon v-else-if="type === 'error'" class="w-5 h-5" />
          <ExclamationCircleIcon v-else-if="type === 'warning'" class="w-5 h-5" />
          <InformationCircleIcon v-else-if="type === 'info'" class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">{{ message }}</p>
        </div>
        <button 
          @click="close"
          class="flex-shrink-0 text-current hover:opacity-75 transition"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/vue/24/solid'

interface Props {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000
})

const show = ref(true)

function close() {
  show.value = false
}

onMounted(() => {
  if (props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script> 