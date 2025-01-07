<template>
  <div id="trading-system">
    <ItemList />
  </div>
</template>

<script>
import ItemList from './components/ItemList.vue'

export default {
  name: 'trading-system',
  components: {
    ItemList
  },
  mounted() {
    document.title = '商品交易系统'; // 修改页面的标题
  }
}
</script>

<style scoped>
/* 可以在这里加一些全局样式 */
</style>
