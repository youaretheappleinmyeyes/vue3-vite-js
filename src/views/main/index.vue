<script setup>
import {ref, watch,} from "vue";
import {goViewEvent} from "@/libs/private.js";
import {RouterView,useRouter,useRoute} from "vue-router";

const {name} = useRoute();
const active = ref(name);

function tabbarEvent(name){
  goViewEvent({name})
}
const route = useRoute();
watch(
    route, (newRoute) => {
      active.value = newRoute.name;
    }
)
</script>

<template>
<tcb>
  <template #header></template>
  <RouterView />
  <template #footer>
    <van-tabbar v-model="active" @change="tabbarEvent" :fixed="false">
      <van-tabbar-item name="home" icon="home-o">标签</van-tabbar-item>
      <van-tabbar-item name="gameList" icon="fire-o">游戏</van-tabbar-item>
      <van-tabbar-item name="myResume" icon="search">标签</van-tabbar-item>
    </van-tabbar>
  </template>
</tcb>
</template>

<style scoped lang="less">

</style>
