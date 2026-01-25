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

console.log("main.ts chargé");
console.log("router chargé");

createApp(App)
  .use(router)
  .use(pinia)
  .use(vfm)
  .use(Notifications)
  // .use(Vuex)
  // .use(store)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })