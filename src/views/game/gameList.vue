<script setup>
import GameCardMatching from "@/views/game/GameCardMatching.vue";

// Vue3 setup 语法（纯JS版）
import { ref } from 'vue';
import {goViewEvent} from "@/libs/private.js";
import {
  game2048Logo, game2048Lp,
  gameCardflippingLogo, gameCardflippingLp,
  gameCardMatchingLogo, gameCardMatchingLp,
  gameGuessNumberLogo, gameGuessNumberLp
} from "@/views/game/file/logo/exportGameLogo.js";

// 定义应用列表数据（响应式）
const appsData = ref([
  { name: "猜数字", color: "#98be2c",logo:gameGuessNumberLogo ,link:'gameView',gameName:"GameGuessNumber" },
  { name: "翻纸牌", color: "#255c8e",logo:gameCardflippingLogo ,link:'gameView',gameName:"GameCardFlipping" },
  { name: "对对碰", color: "#667eea",logo:gameCardMatchingLogo ,link:'gameView',gameName:"GameCardMatching" },
  { name: "2048", color: "#fea9a2",logo:game2048Logo ,link:'gameView',gameName:"Game2048" },

  { name: "微信", color: "#07C160" },
  { name: "支付宝", color: "#1677FF" },
  { name: "抖音", color: "#FE2C55" },
  { name: "淘宝", color: "#FF4400" },
  { name: "QQ", color: "#12B7F5" },
  { name: "微博", color: "#E6162D" },
  { name: "小红书", color: "#FE2C55" },
  { name: "B站", color: "#FB7299" },
  { name: "高德地图", color: "#3E92FF" },
  { name: "网易云音乐", color: "#E83F5B" },
  { name: "拼多多", color: "#E02020" },
  { name: "京东", color: "#E61610" },
  { name: "腾讯视频", color: "#00A0E9" },
  { name: "爱奇艺", color: "#2383E2" },
  { name: "美团", color: "#FFD100" },
  { name: "饿了么", color: "#FF5C00" },
  { name: "百度", color: "#2319DC" },
  { name: "知乎", color: "#0084FF" },
  { name: "携程", color: "#00BFFF" },
  { name: "钉钉", color: "#2788FF" },
  { name: "腾讯文档", color: "#00B56A" },
  { name: "WPS", color: "#FF7D00" },
  { name: "飞书", color: "#007DFF" },
  { name: "邮箱", color: "#4285F4" },
  { name: "日历", color: "#F09300" },
  { name: "相册", color: "#00C853" },
  { name: "设置", color: "#9E9E9E" },
  { name: "天气", color: "#03A9F4" },
  { name: "计算器", color: "#607D8B" },
  { name: "时钟", color: "#795548" },
  { name: "相机", color: "#607D8B" },
  { name: "笔记", color: "#FFC107" }
]);
const swipeFile = ref([
  {
    img:gameGuessNumberLp
  },{
    img:gameCardflippingLp
  },{
    img:gameCardMatchingLp
  },{
    img:game2048Lp
  },
])
// 应用点击事件处理函数
const handleAppClick = (app) => {
  goViewEvent({
    name:app.link,
    params:{
      id:1,
      gameName:app.gameName
    }
  })
};
</script>

<template>
<tcb class="presrtRoot">
  <template #header>
    <van-swipe class="swipeView" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="(sp,index) in swipeFile">
        <div class="swipeView-itemView">
          <img :src="sp.img" alt="">
        </div>
      </van-swipe-item>
<!--      <van-swipe-item>-->
<!--        <div class="swipeView-itemView">-->
<!--        </div>-->
<!--      </van-swipe-item>-->
<!--      <van-swipe-item>-->
<!--        <div class="swipeView-itemView">-->
<!--        </div>-->
<!--      </van-swipe-item>-->
    </van-swipe>
  </template>
<!--  pdf-GuessNumber-game2048-GameCardFlipping-->
<!--  <game-card-matching></game-card-matching>-->
  <div class="app-list-container">
    <!-- 应用网格布局 - 四列核心展示 -->
    <div class="apps-grid">
      <!-- 循环渲染应用图标 -->
      <div
          class="app-icon"
          v-for="(app, index) in appsData"
          :key="index"
          @click="handleAppClick(app)"
      >
        <!-- 应用图标背景（动态绑定颜色） -->
        <div class="app-icon__bg" :style="{backgroundImage:`url(${app.logo?app.logo:''})`, backgroundColor: app.color }">
          {{ app.logo?'':app.name.charAt(0) }}
        </div>
        <!-- 应用名称 -->
        <div class="app-icon__name">{{ app.name }}</div>
      </div>
    </div>
  </div>
</tcb>
</template>

<style scoped lang="less">
.swipeView{
  &-itemView{
    width: 100%;
    height: 200px;
    background:var(--lgc-6);
    img{
      width: 100%;
      height: 100%;
    }
  }
}
/* 容器样式 */
.app-list-container {
}

/* 应用网格核心布局 - 四列 */
.apps-grid {
  max-width: 100%;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 20px 15px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 四列布局 */
  grid-gap: 15px;
  min-height: calc(100vh - 40px);
}

/* 应用图标样式 */
.app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease; /* 过渡动画 */
}

/* hover 缩放效果 */
.app-icon:hover {
  transform: scale(1.05);
}

/* 图标背景 */
.app-icon__bg {
  width: 50px;
  height: 50px;
  background-repeat: no-repeat;
  background-size: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

/* 应用名称 */
.app-icon__name {
  font-size: 12px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 60px;
}

/* 滚动条美化 */
.apps-grid::-webkit-scrollbar {
  width: 4px;
}
.apps-grid::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 2px;
}

/* 响应式适配 - 小屏幕自动调整列数 */
@media (max-width: 400px) {
  .apps-grid {
    grid-template-columns: repeat(3, 1fr); /* 小屏3列 */
    padding: 15px 10px;
    border-radius: 0;
    min-height: 100vh;
  }
  .app-icon__bg {
    width: 45px;
    height: 45px;
  }
}
@media (max-width: 300px) {
  .apps-grid {
    grid-template-columns: repeat(2, 1fr); /* 超小屏2列 */
  }
}
</style>
