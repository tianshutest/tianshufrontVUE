<template>
  <div id="item-list" class="item-list" @scroll="handleScroll">
    <div v-for="item in sortedItems" :key="item.id" class="item">
      <img :src="require(`@/assets/images/${item.image}`)" :alt="item.name" :class="{ 'out-of-stock': item.delflag === 2 }" />
      <div class="item-info">
        <div class="item-name">{{ item.name }}</div>
        <div class="item-price">价格: ¥{{ item.price }}</div>
        <div class="item-district">大区: {{ item.district }}</div>
        <div class="item-number">数量: {{ item.itemNumber }}</div>
        <div class="item-solded-num">已售: {{ item.soldedNum }}</div>
        <div class="item-delflag">{{ item.delflag === 2 ? '售罄' : '在售' }}</div>
        <div v-if="item.soldedNum > 0" class="hot">HOT</div>
      </div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [], // 商品数据
      pageNum: 1, // 当前页数
      pageSize: 30, // 每次加载的商品数量（3行，30个商品）
      loading: false, // 加载状态
    };
  },
  computed: {
    // 对商品进行排序，先按 delflag 为 0，后按 itemNumber 倒序排列
    sortedItems() {
      return this.items
        .filter(item => item.delflag === 0 || item.delflag === 2) // 只显示在售或售罄的商品
        .sort((a, b) => {
          if (a.delflag === 0 && b.delflag !== 0) return -1; // 在售商品优先
          if (b.delflag === 0 && a.delflag !== 0) return 1;
          return b.itemNumber - a.itemNumber; // 根据数量倒序排列
        });
    }
  },
  methods: {
    async fetchItems() {
      const url = 'http://127.0.0.1:51385/tianshu/items/getQueryItems';
      const params = {
        pageSize: this.pageSize,
        pageNum: this.pageNum,
        name: "",
        district: "",
        type: ""
      };

      this.loading = true; // 开始加载数据

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error('获取商品数据失败');
        }

        const data = await response.json();
        // 合并新加载的商品数据
        this.items = [...this.items, ...data.map(item => ({
          ...item,
          price: item.price.includes('/')
            ? parseFloat(item.price.split('/')[0]) / parseFloat(item.price.split('/')[1])
            : parseFloat(item.price),
          soldedNum: item.soldedNum === null ? 0 : item.soldedNum
        }))];
        
        // 加载完成，更新页数
        this.pageNum += 1;
      } catch (error) {
        console.error('获取商品数据失败:', error);
      } finally {
        this.loading = false; // 加载完成
      }
    },
    handleScroll(event) {
      const scrollContainer = event.target;
      const isBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop === scrollContainer.clientHeight;
      if (isBottom && !this.loading) {
        console.log('Scrolled to bottom, loading more items...');
        this.fetchItems();
      }
    }
  },
  mounted() {
    // 初始加载第一批数据（3行）
    this.fetchItems();
  }
}
</script>

<style scoped>
.item-list {
  display: grid;
  grid-template-columns: repeat(10, 1fr); /* 默认10列，每行显示10个商品 */
  gap: 20px;
  padding: 20px;
  height: 70vh; /* 设置高度并使其可滚动 */
  overflow-y: auto; /* 使 item-list 可滚动 */
}

.item {
  border: 1px solid #ccc;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
  position: relative;
}

.item img {
  width: 100%;
  height: auto;
}

.item-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-top: 10px;
}

.item-name {
  font-size: 18px;
  font-weight: bold;
}

.item-price {
  color: #f00;
  font-size: 16px;
}

.item-district,
.item-number,
.item-solded-num,
.item-delflag {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.hot {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: red;
  color: white;
  font-size: 14px;
  padding: 5px;
  font-weight: bold;
}

.out-of-stock {
  filter: grayscale(100%) brightness(80%);
}

.loading {
  text-align: center;
  padding: 10px;
  font-size: 16px;
  color: #999;
}

@media (max-width: 900px) {
  .item-list {
    grid-template-columns: repeat(3, 1fr); /* 小屏幕下每行显示3个商品 */
  }
}

@media (max-width: 600px) {
  .item-list {
    grid-template-columns: 1fr; /* 更小屏幕下每行显示1个商品 */
  }
}
</style>
