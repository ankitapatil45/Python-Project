import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import global CSS here
import './assets/app.css'

createApp(App)
  .use(router)
  .mount('#app')
