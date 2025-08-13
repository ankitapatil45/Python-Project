<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/utils/api' // ⬅️ Import your API helper function

const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const res = await login(email.value, password.value)
    console.log('Login success:', res.data)

    // Save token in localStorage
    localStorage.setItem('access_token', res.data.access_token)

    // Redirect to dashboard or home
    router.push('/dashboard')
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message)
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
}
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
}
button {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
}
</style>
