<script setup>
import {RouterView} from 'vue-router'
import {setFontSize} from "@/libs/public.js";
setFontSize();

</script>

<template>
  <div class="appView">
    <RouterView />
  </div>
</template>

<style lang="less" scoped>
.appView {
  height: 100vh;

}
</style>
