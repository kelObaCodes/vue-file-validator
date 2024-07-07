import './assets/main.css'
import imageValidatorPlugin from '../lib/vue-file-validator'; // Adjust the path as necessary
import { createApp } from 'vue'
import App from './App.vue'
import { useNotification } from "@kyvg/vue3-notification";
const app = createApp(App)

const { notify }  = useNotification()
// Define the notify function

app.use(imageValidatorPlugin);

app.mount('#app')
