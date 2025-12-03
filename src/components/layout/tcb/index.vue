<template>
  <div name="tcb" class="box_col" :style="{backgroundColor:bgColor,height:'100%'}">
    <div>
      <slot name="header"></slot>
    </div>
    <div id="tcbCenter" class="box_col_autoY tcbCenter">
      <slot></slot>
    </div>
    <div>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import {watch} from "vue";
import {useRoute} from "vue-router";

const props = defineProps({
  bgColor: {
    type: String,
    // required: true // 必传
    default: () => "#fff" // 对象默认值需用函数
  },
  isWatchScrolltop:{
    type:Boolean,
    default:()=>false
  }
})
const route = useRoute();
if (props.isScrollTop){
  watch(
    route, (newRoute) => {
      document.getElementById('tcbCenter').scrollTop = 0
    }
  )
}

</script>

<style lang="less" scoped>
.tcbCenter {
  //padding-bottom: 220px;
}
</style>
