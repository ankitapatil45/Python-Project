<template>
  <NavBar />
  <router-view />
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
/* Optional: Add top padding so content is not hidden behind fixed navbar */
body, #app {
  padding-top: 60px; /* adjust based on navbar height */
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
