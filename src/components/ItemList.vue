<template>
  <div class="container" @touchstart="handleTouchStart" @touchmove="handleTouchMove">
    <!-- 左侧查询条件部分 -->
    <div class="sidebar">
      <div class="query-box">
        <!-- 大区选择 -->
        <div class="query-item">
          <label for="district">大区：</label>
          <div class="button-group">
            <button 
              v-for="(item, index) in districtOptions" 
              :key="index" 
              :class="{ active: searchParams.district === item }"
              @click="setSearchParam('district', item)">
              {{ item }}
            </button>
          </div>
        </div>

        <!-- 类型选择 -->
        <div class="query-item">
          <label for="type">类型：</label>
          <div class="button-group">
            <button 
              v-for="(item, index) in typeOptions" 
              :key="index" 
              :class="{ active: searchParams.type === item }"
              @click="setSearchParam('type', item)">
              {{ item }}
            </button>
          </div>
        </div>

        <!-- 商品名称输入框 -->
        <div class="query-item">
          <label for="name">商品名称：</label>
          <input type="text" id="name" v-model="searchParams.name" @input="fetchItems" placeholder="请输入商品名称" />
        </div>

        <div>
          <img :src="require('@/assets/images/qq_qr.png')" alt="QR Code" class="qr-image" />
        </div>
      <!-- FAQRobot 组件嵌入 -->
      <FAQRobot />
      </div>

    </div>

    <!-- 右侧商品信息部分 -->
    <div class="item-list" @scroll="handleScroll">
      <!-- 商品项循环渲染 -->
      <div v-for="item in sortedItems" :key="item.id" class="item">
        <img 
          :src="require(`@/assets/images/${item.image}`)" 
          :alt="item.name" 
          :class="{ 'out-of-stock': item.delflag === 2, 'placeholder': item.name === '待上架' }" 
        />
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <!-- 如果是占位符商品，显示待上架提示 -->
          <div class="item-price" v-if="item.name !== '待上架'">价格: ¥{{ item.price }}</div>
          <div class="item-district" v-if="item.name !== '待上架'">大区: {{ item.district }}</div>
          <div class="item-number" v-if="item.name !== '待上架'">数量: {{ item.itemNumber }}</div>
          <div class="item-solded-num" v-if="item.name !== '待上架'">已售: {{ item.soldedNum }}</div>
          <div class="item-delflag" v-if="item.name !== '待上架'">{{ item.delflag === 2 ? '售罄' : '在售' }}</div>
          <div v-if="item.soldedNum > 0" class="hot">HOT</div>
          <!-- 占位符商品显示 -->
          <div v-if="item.name === '待上架'" class="item-price">待上架</div>
        </div>
      </div>
      
      <!-- 加载中提示 -->
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="isRefreshing" class="loading">正在刷新...</div>
    </div>
  </div>
</template>


<script>
import FAQRobot from './FAQRobot'; 
export default {
  data() {
    return {
      isRefreshing: false, // 下拉刷新状态
      items: [], // 商品数据
      pageNum: 1, // 当前页数
      pageSize: 21, // 每次加载的商品数量（3行，21个商品）
      loading: false, // 加载状态
      isRefreshing: false, // 是否正在进行下拉刷新
      searchParams: {
        name: "",
        district: "",
        type: ""
      },
      districtOptions: ['i99', 'i26', 'i51', 'i88', 's7', 'u1'], // 大区选项
      typeOptions: ['道具', '宠物骑宠', '人物账号'], // 类型选项
      touchStartY: 0, // 触摸开始的 Y 坐标
    };
  },
  computed: {
    sortedItems() {
      return this.items.map(item => ({
        ...item,
        isHot: item.delflag === 0 && item.type === '道具' && item.soldedNum > 0 // 判断是否为“在售道具并且销量 > 0”
      }));
    }
  },
  components: {
    FAQRobot, // 注册 FAQRobot 组件
  },
  methods: {
    // 设置搜索参数
    setSearchParam(param, value) {
      // 如果已经选中该选项，点击后取消选中（将值设为空字符串）
      if (this.searchParams[param] === value) {
        this.searchParams[param] = ""; 
      } else {
        this.searchParams[param] = value;
      }

      // 重置页数为 1
      this.pageNum = 1;

      // 清空现有商品数据
      this.items = []; 

      // 每次设置条件后立即查询
      this.fetchItems(); 
    },


    async fetchItems(isRefresh = false) {
      if (isRefresh) {
        this.isRefreshing = true;  // 显示刷新中的状态
        this.pageNum = 1;  // 重置页数为 1
        this.items = []; // 清空商品列表
      }

      const url = 'http://wl.tsjiaoyi.asia:51385/tianshu/items/getQueryItems';
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
        const newItems = data.map(item => ({
          ...item,
          price: item.price.includes('/')
            ? parseFloat(item.price.split('/')[0]) / parseFloat(item.price.split('/')[1])
            : parseFloat(item.price),
          soldedNum: item.soldedNum === null ? 0 : item.soldedNum
        }));

        // 将新商品数据按需过滤和排序
        this.allItems = newItems
          .filter(item => item.delflag === 0 || item.delflag === 2) // 只显示在售或售罄的商品
          .sort((a, b) => {
            if (a.delflag === 0 && b.delflag !== 0) return -1; // 在售商品优先
            if (b.delflag === 0 && a.delflag !== 0) return 1;
            return b.itemNumber - a.itemNumber; // 根据 itemNumber 倒序排列
          });

        // 根据分页信息获取前 21 个商品
        const displayedItems = this.allItems.slice(0, 21);

        // 更新商品列表
        if (isRefresh) {
          this.items = [...displayedItems]; // 如果是刷新，重置商品列表
        } else {
          this.items.push(...displayedItems); // 否则，追加新的商品
        }

        // 补充占位符商品，确保总共有 21 个商品
        const remainingCount = 21 - this.items.length;
        if (remainingCount > 0) {
          const placeholderItems = Array.from({ length: remainingCount }, (_, index) => ({
            id: `placeholder-${index}`,
            name: "待上架",
            price: 0,
            soldedNum: 0,
            itemNumber: 0,
            delflag: 0,
            image: 'placeholder.jpg',
            district: "",
            type: ""
          }));
          this.items = [...this.items, ...placeholderItems];
        }

        // 更新页数
        this.pageNum += 1;
      } catch (error) {
        console.error('获取商品数据失败:', error);
      } finally {
        this.loading = false; // 加载完成
        if (isRefresh) {
          this.isRefreshing = false; // 刷新结束
        }
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
    },

    handleTouchStart(event) {
      // 记录触摸开始位置
      this.touchStartY = event.touches[0].pageY;
    },

    handleTouchMove(event) {
      const touchMoveY = event.touches[0].pageY;

      // 检测是否向下拖动
      if (this.touchStartY - touchMoveY > 50 && window.scrollY === 0) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.refreshData();
        }
      }
    },

    refreshData() {
      // 模拟刷新操作，可以根据实际需求进行API调用进行刷新
      setTimeout(() => {
        this.isRefreshing = false; // 刷新完成
        this.pageNum = 1; // 重置页数
        this.fetchItems(true); // 重新加载数据并保持顺序
      }, 2000); // 假设刷新耗时 2 秒
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
  display: grid;
  gap: 1vw; /* 设置商品之间的间隔为 1vw */
  margin-left: 5vw;
  width: 80%; /* 商品列表占剩余的 80% 宽度 */
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* 自动填充列，每列最小宽度 150px */
  grid-auto-rows: auto; /* 自动调整行高 */
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

/* 查询条件项的样式 */
.query-item {
  margin-bottom: 20px;
}

.query-item label {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

/* 查询按钮组的样式 */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.button-group button {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;
}

.button-group button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.button-group button:hover {
  background-color: #ddd;
}

/* 商品名称输入框 */
.query-item input {
  width: 90%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-top: 8px;
  font-size: 14px;
}

/* 查询按钮 */
.search-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.search-button:hover {
  background-color: #0056b3;
}

/* 商品项的样式 */
.item {
  padding: 2vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
  position: relative;
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* 商品项阴影效果 */
  height: auto; /* 高度自适应 */
}

.item img {
  width: 100%;
  height: auto;
  border-radius: 8px;
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
  color: #333;
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

.qr-image {
  width: 100%;  /* 图片宽度占满父容器 */
  max-width: 200px;  /* 最大宽度为 200px */
  height: auto;
  display: block;
  margin-top: 20px;  /* 上边距 20px */
  margin-left: auto;
  margin-right: auto;
}

.item.placeholder {
  background-color: #f0f0f0; /* 给占位符商品一个浅灰色背景 */
  color: #999; /* 文本颜色为灰色 */
  cursor: not-allowed; /* 禁止点击 */
}

.item.placeholder .item-info {
  justify-content: center;
}

.item.placeholder .item-name {
  font-size: 16px;
  font-weight: bold;
}

.item.placeholder .item-price {
  font-size: 14px;
  font-weight: bold;
}

.query-box FAQRobot {
  margin-left: 20px; /* 设置FAQRobot与左侧的距离 */
}

#app[data-v-42e911b8] {
  width: 100%;
  margin: 30px;
}


@media (max-width: 900px) {
  .item-list {
    grid-template-columns: repeat(5, 1fr); /* 中等屏幕下每行显示 5 个商品 */
  }
  .item {
    width: 85%; /* 每个商品占 100% 的宽度 */
  }
}

@media (max-width: 600px) {
  .item-list {
    grid-template-columns: repeat(2, 1fr); /* 每行显示 3 个商品 */
  }
  .item {
    width: 75%; /* 每个商品占 100% 的宽度 */
  }
}
</style>
