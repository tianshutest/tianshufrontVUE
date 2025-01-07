<template>
  <div id="app">
    <header>
      <h1>天书知识库</h1>
    </header>
    <main>
      <div class="chat-container" id="chat-container">
        <div class="question-section">
          <div class="question-box user-question" v-if="displayedQuestions.length > 0">
            <img :src="require('@/assets/images/87.jpg')" alt="User Avatar" class="avatar" style="width: 30px; height: 30px;">
            <span>现有知识库：</span>
            <div v-for="(question, index) in displayedQuestions" :key="index">
              <p>{{ question }}</p>
            </div>
            <p v-if="typing">{{ currentQuestion }}</p>
          </div>
          <div class="question-box" v-for="(qa, index) in qaHistory" :key="index">
            <img :src="qa.avatar" :alt="qa.alt" class="avatar" style="width: 30px; height: 30px;">
            <div v-if="qa.text.substring(0, 6) === 'images'">
              <!-- 如果是图片类型，则显示图片 -->
              <img :src="qa.text" alt="Image" style="width: 60vw;" @click="openImageLink(qa.text)">
            </div>
            <div v-else>
              <!-- 否则显示文本 -->
              <p>{{ qa.text }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 输入框区域 -->
      <div class="input-section">
        <input type="text" v-model="inputValue" @keydown.enter="sendMessage" placeholder="输入问题编号">
        <button @click="sendMessage" :class="{ 'button disabled': typing || displayedQuestions.length === 0 }">发送</button>
      </div>
      <!-- 图片弹窗 -->
      <div class="image-modal-overlay" v-if="enlargedImageIndex !== -1" @click="toggleImageSize(-1)">
        <div class="image-modal">
          <img :src="qaHistory[enlargedImageIndex].text" alt="Enlarged Image">
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      enlargedImageIndex: -1, // 跟踪当前展示的原图索引，默认为 -1 表示没有展示原图
      questions: [
        "1.幻影辅助地址", "2.八卦升级材料", "3.宠物经验表（觉醒）", "4.宠物经验表（未觉醒）", "5.宠物飞升技能",
        "6.装备附魔", "7.宠物完美计划", "8.装备成本", "9.精灵/萝莉加成属性", "10.游历材料", "11.宠物进化加成",
        "12.宠物内丹经验表", "13.宠物炼化技能加成", "14.各种尘的出处", "15.骑宠图鉴加成"
      ],
      displayedQuestions: [], // 存放已经显示的问题
      currentQuestionIndex: -1, // 当前问题索引
      currentQuestion: '', // 当前问题
      typing: false, // 是否正在打印问题
      inputValue: '', // 用户输入的值
      answer: '', // 存放答案
      qaHistory: [], // 存放问题和答案的历史记录
      isModalVisible: false,
      modalIndex: null,
    };
  },
  mounted() {
    // 页面加载后开始显示问题，并禁用发送按钮
    this.typing = true;
    this.displayQuestions();
    // 在加载问题完成后，启用发送按钮
    setTimeout(() => {
      this.typing = false;
    }, this.questions.length * 500); // 等待所有问题加载完成后设置 typing 为 false
  },
  computed: {
    sendButtonClass() {
      return {
        disabled: this.typing || this.displayedQuestions.length === 0
      };
    }
  },
  methods: {
    toggleImageSize(index) {
      // 如果当前点击的图片已经是放大状态，则关闭弹窗，否则显示对应的图片
      this.enlargedImageIndex = this.enlargedImageIndex === index ? -1 : index;
    },
    displayQuestions() {
      let index = 0;
      const interval = setInterval(() => {
        if (index < this.questions.length) {
          this.displayedQuestions.push(this.questions[index]);
          index++;
        } else {
          clearInterval(interval);
          // 当问题加载完成后启用发送按钮
          this.typing = false;
        }
      }, 500); // 每秒显示一个问题
    },
    sendMessage() {
      // 如果当前没有正在打印问题，并且输入值为有效的数字，则发送问题
      if (!this.typing && /^\d+(\.\d+)?$/.test(this.inputValue)) {
        const questionId = parseFloat(this.inputValue) - 1; // 问题编号从0开始
        if (questionId >= 0 && questionId < this.questions.length) {
          const question = this.questions[questionId];
          this.typing = true; // 在发送请求前设置为true
          this.currentQuestionIndex = questionId;
          this.currentQuestion = question;
          this.inputValue = ''; // 清空输入框
          this.answer = ''; // 清空之前的答案
          this.printQuestion();
          this.addToHistory(question, 'user');
        }
      }
    },
    openImageLink(link) {
      // 使用 window.open() 打开图片链接
      window.open(link, '_blank');
    },
    printQuestion() {
      const question = this.currentQuestion;
      let i = 0;
      const timer = setInterval(() => {
        if (i <= question.length) {
          this.currentQuestion = question.substring(0, i);
          i++;
        } else {
          clearInterval(timer);
          this.typing = false;
          // 发送请求到后端
          if (!this.typing) { // 检查当前是否正在打印
            setTimeout(() => {
              fetch(`http://wl.tsjiaoyi.asia:51385/tianshu/FAQRobot/QuestionAnswer?question_id=${this.currentQuestionIndex + 1}`)
                .then(response => response.json())
                .then(data => {
                  if (data.status === 'success') {
                    if (data.type === 'string') {
                      // 如果类型是string，显示链接
                      this.answer = data.answer;
                    } else if (data.type === 'image') {
                      // 如果类型是image，显示图片
                      this.answer = data.answer;
                    }
                    // 添加到历史记录并滚动到底部
                    this.addToHistory(this.answer, 'bot');
                    this.scrollChatContainerToBottom();
                  } else {
                    console.error('请求失败：', data.message);
                  }
                })
                .catch(error => {
                  console.error('请求失败：', error);
                });
            }, 500); // 延迟1秒
          }
        }
      }, 50);
    },
    addToHistory(text, role) {
       const avatar = role === 'user' ? require('@/assets/images/user.jpg') : require('@/assets/images/87.jpg');
      const alt = role === 'user' ? 'User Avatar' : 'Bot Avatar';
      this.qaHistory.push({ text, avatar, alt });
      this.scrollChatContainerToBottom(); // 新内容添加后滚动到底部
    },
    scrollChatContainerToBottom() {
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 100); // 100 毫秒延迟
    }
  }
};
</script>

<style scoped>
/* CSS 样式 */
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 0;
}

#app {
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

header {
  background-color: #007bff;
  color: #fff;
  text-align: center;
  padding: 20px 0;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

h1 {
  margin: 0;
  font-size: 18px;
}

main {
  padding: 3px;
}

.question-section {
  margin-bottom: 20px;
}

.question-box {
  margin-bottom: 10px;
  align-items: center;
}

.user-question .question-box p,
.bot-answer .question-box p {
  margin: 0;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 10px;
  display: inline-block;
}

.user-question .question-box img.avatar {
  margin-left: auto;
  margin-right: 10px;
}

.input-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
  border-top: 1px solid #ccc;
}

.input-section input[type="text"] {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  margin-right: 20px;
}

.input-section button {
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
}

.input-section button:hover {
  background-color: #0056b3;
}

footer {
  text-align: center;
  background-color: #007bff;
  color: #fff;
  padding: 10px 0;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.avatar {
  margin-right: 10px;
}

.question-box {
  margin-bottom: 10px;
}

.user-question .avatar {
  visibility: hidden;
}

.bot-answer .avatar {
  display: none;
}

.user-question .avatar:first-child {
  visibility: visible;
}

.bot-answer:first-child .avatar {
  display: inline-block;
}

.question-box.user-question span {
  margin-right: 15px;
}

.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.image-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 5px;
}

.button.disabled {
  background-color: gray;
  color: white;
  cursor: not-allowed;
}
</style>
