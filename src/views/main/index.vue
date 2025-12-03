<script setup>
import {ref} from "vue";
import {goViewEvent} from "@/libs/public.js";
import {RouterView} from "vue-router";

const active = ref(0);
function tabbarEvent(name){
  console.log(name);
  if(name===1){
    goViewEvent({name:'myResume'})
  }else if(name === 0){
    goViewEvent({name:'home'})

  }
}
</script>

<template>
<tcb>
  <template #header>
    mainheader
  </template>
  <RouterView />
  <template #footer>
    <van-tabbar v-model="active" @change="tabbarEvent">
      <van-tabbar-item icon="home-o">标签</van-tabbar-item>
      <van-tabbar-item icon="search">标签</van-tabbar-item>
    </van-tabbar>
  </template>
</tcb>
</template>

<style scoped lang="less">

</style>
