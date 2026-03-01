import { createApp } from 'vue'
import "./style.css"
import App from './App.vue'
import './samples/node-api'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
import { createVfm } from 'vue-final-modal'
import Notifications from '@kyvg/vue3-notification'

const vfm = createVfm()




import { notify } from '@kyvg/vue3-notification'

const app = createApp(App)

app.config.errorHandler = (err: any, instance, info) => {
  console.error("❌ Global Error Catch:", err);
  
  // Prevent infinite loops if notification system breaks
  try {
      notify({
          type: 'error',
          title: 'Erreur Application',
          text: `Une erreur inattendue est survenue: ${err.message || 'Inconnu'}`,
          duration: 10000,
      });
  } catch (e) {
      console.error("Failed to notify:", e);
  }
};

app.use(router)
  .use(pinia)
  .use(vfm)
  .use(Notifications)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })