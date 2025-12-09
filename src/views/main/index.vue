<script setup>
import {ref,} from "vue";
import {goViewEvent} from "@/libs/public.js";
import {RouterView} from "vue-router";

import {useRoute} from 'vue-router'
const {name} = useRoute();
const active = ref(name);
console.log('..',name);

function tabbarEvent(name){
  console.log(name);
  goViewEvent({name})
}

</script>

<template>
<tcb>
  <template #header></template>
  <RouterView />
  <template #footer>
    <van-tabbar v-model="active" @change="tabbarEvent" :fixed="false">
      <van-tabbar-item name="home" icon="home-o">标签</van-tabbar-item>
      <van-tabbar-item name="myResume" icon="search">标签</van-tabbar-item>
    </van-tabbar>
  </template>
</tcb>
</template>

<style scoped lang="less">

</style>
