import { VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { queryClient } from './lib/query-client'
import router from './router'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

const vueQueryOptions: VueQueryPluginOptions = {
  queryClient,
}

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, vueQueryOptions)

app.mount('#app')
