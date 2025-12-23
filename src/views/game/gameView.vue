<script setup>
import {useRoute,useRouter} from "vue-router";
import GameGuessNumber from "@/views/game/GameGuessNumber.vue";
import GameCardFlipping from "@/views/game/GameCardFlipping.vue";
import GameCardMatching from "@/views/game/GameCardMatching.vue";
import Game2048 from "@/views/game/Game2048.vue";
import router from "@/router/index.js";
const {params} = useRoute();
const {back} = useRouter();

console.log(params);
</script>

<template>
  <tcb class="">
    <template #header>
      <div class="backView box_col jus_center align_center" @click="back()">
        <van-icon color="#ff6b6b" name="share" size="28"/></div></template>
    <game-guess-number v-if="params.gameName === 'GameGuessNumber'"></game-guess-number>
    <game-card-flipping v-else-if="params.gameName === 'GameCardFlipping'"></game-card-flipping>
    <game-card-matching v-else-if="params.gameName === 'GameCardMatching'"></game-card-matching>
    <game2048 v-else-if="params.gameName === 'Game2048'"></game2048>
    <div v-else></div>
  </tcb>
</template>

<style scoped lang="less">
.backView{
  position: fixed;
  left: 0.1rem;
  top: 0.1rem;
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 100%;
  //background:#00bd7e;
  z-index: 10;
  i{
    transform: rotateY(180deg);
  }
}
</style>
