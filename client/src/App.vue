<template>
  <Browser-Dialer/>
</template>

<script>
import BrowserDialer from './components/BrowserDialer.vue'

export default {
  name: 'App',
  components: {
    BrowserDialer
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
