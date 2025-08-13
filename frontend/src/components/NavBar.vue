<template>
  <nav class="navbar">
    <div class="container">
      <h1 class="logo">HelpDesk</h1>
      <div class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <button @click="handleAuthAction" class="auth-button">
          {{ isLoggedIn ? 'Logout' : 'Login' }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Import external CSS
import '../assets/NavBar.css'  // adjust path according to your folder structure

const router = useRouter()
const isLoggedIn = ref(false)

function handleAuthAction() {
  if (isLoggedIn.value) {
    alert('Logging out...')
    isLoggedIn.value = false
    router.push('/')
  } else {
    alert('Redirecting to login page')
    router.push('/login') // Assuming you have a Login route
  }
}
</script>
