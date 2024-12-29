<template>
  <div class="container">
    <!-- 左侧查询条件部分 -->
    <div class="sidebar">
      <div class="query-box">
        <div class="query-item">
          <label for="name">商品名称：</label>
          <input type="text" id="name" v-model="searchParams.name" />
        </div>
        <div class="query-item">
          <label for="district">大区：</label>
          <input type="text" id="district" v-model="searchParams.district" />
        </div>
        <div class="query-item">
          <label for="type">类型：</label>
          <input type="text" id="type" v-model="searchParams.type" />
        </div>
        <!-- 更多查询条件 -->
        <button @click="fetchItems">查询</button>
      </div>
    </div>

    <!-- 右侧商品信息部分 -->
    <div class="item-list" @scroll="handleScroll">
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
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [], // 商品数据
      pageNum: 1, // 当前页数
      pageSize: 28, // 每次加载的商品数量（3行，30个商品）
      loading: false, // 加载状态
      searchParams: {
        name: "",
        district: "",
        type: ""
      }
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
        name: this.searchParams.name,
        district: this.searchParams.district,
        type: this.searchParams.type
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
    handleScroll() {
      // 页面滚动到底部时加载更多
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= documentHeight - 10 && !this.loading) {
        console.log('Scrolled to bottom, loading more items...');
        this.fetchItems();
      }
    }
  },
  mounted() {
    // 初始加载第一批数据（3行）
    this.fetchItems();

    // 监听滚动事件，触发加载更多数据
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    // 在组件销毁前移除事件监听器
    window.removeEventListener('scroll', this.handleScroll);
  }
};
</script>


<style scoped>
/* 商品列表的样式，右侧占 80% */
.item-list {
  gap: 1vw; /* 设置商品之间的间隔为 1vw */
  margin-left: 5vw;
  width: 80%; /* 商品列表占剩余的 80% 宽度 */
  display: flex;
  flex-wrap: wrap;
  flex-grow: 1; /* 确保商品列表占据剩余空间 */
  height: auto; /* 高度自动调整 */
}

body {
  overflow-y: scroll; /* 确保页面可以滚动 */
  margin: 0; /* 移除默认的 body margin */
}

.container {
  display: flex; /* 使用 flexbox 布局 */
  height: 100vh; /* 确保容器充满视口高度 */
  flex-direction: row; /* 默认是横向排列 */
}

/* 查询条件的样式，左侧占 20% */
.sidebar {
  width: 20%; /* 查询条件部分占 20% 宽度 */
  padding: 20px;
  position: sticky;
  top: 0; /* 固定在顶部，随滚动条滚动 */
  height: 100vh; /* 确保查询条件区域充满视口高度 */
}

/* 商品项的样式 */
.item {
  border: 1px solid #ccc;
  width: 7%; 
  padding: 2vw;
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


/* 响应式设计：屏幕宽度小于 900px 时调整商品列表布局 */
@media (max-width: 900px) {
  .item-list {
    grid-template-columns: repeat(5, 1fr); /* 中等屏幕下每行显示 5 个商品 */
  }
  .item {
    width: 20%; /* 每个商品占 20% 的宽度 */
  }
}

/* 响应式设计：屏幕宽度小于 600px 时调整商品列表布局 */
@media (max-width: 600px) {
  .item-list {
    grid-template-columns: 1fr; /* 更小屏幕下每行显示 1 个商品 */
  }
  .item {
    width: 100%; /* 每个商品占 100% 的宽度 */
  }
}
</style>
