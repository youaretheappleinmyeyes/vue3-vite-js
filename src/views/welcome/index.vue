<template>
  <div class="welcomeView box_col jus_center align_center">
    <div class="welcomeView-text" @click="goHome('home')">
      <span :class="'itemTextSty'+index%2" v-for="(it,index) in text">{{it}}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted ,onUnmounted} from 'vue';
import {goViewEvent} from "@/libs/private.js";
const text = ref(["W","E","L","C","O","M","E"]);
const goHome = (name)=>{
  goViewEvent({name})
}
</script>

<style lang="less" scoped>
/* 全局重置样式 */
.welcomeView {
  background: #000; /* 纯黑背景 */
  color: #fff; /* 纯白文字 */
  &-text{
    font-size: 0.6rem;
    font-weight: bold;
    transform: translateY(-1rem);
    .itemTextSty0{
      animation: rotateWord1 2s ease-in-out infinite alternate;
    }
    .itemTextSty1{
      animation: rotateWord2 2s ease-in-out infinite alternate 0.5s;
    }
  }
}

@keyframes rotate3d {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}


@keyframes rotateWord1 {
  0% {
    transform: rotate(0deg) scale(1);
    color: #2c3e50;
  }
  50% {
    transform: rotate(15deg) scale(1.2);
    color: #e74c3c;
  }
  100% {
    transform: rotate(-15deg) scale(1);
    color: #2c3e50;
  }
}

@keyframes rotateWord2 {
  0% {
    transform: rotate(0deg) scale(1);
    color: #2c3e50;
  }
  50% {
    transform: rotate(-15deg) scale(1.2);
    color: #3498db;
  }
  100% {
    transform: rotate(15deg) scale(1);
    color: #2c3e50;
  }
}
</style>
