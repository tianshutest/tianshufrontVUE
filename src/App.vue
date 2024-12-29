<template>
  <div id="app">
    <ItemList />
  </div>
</template>

<script>
import ItemList from './components/ItemList.vue'

export default {
  name: 'App',
  components: {
    ItemList
  }
}
</script>

<style scoped>
/* 可以在这里加一些全局样式 */
</style>
