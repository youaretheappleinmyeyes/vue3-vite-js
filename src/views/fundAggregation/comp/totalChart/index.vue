<script setup>
import {ref} from "vue";
import chartComp from "@/components/chartComp/index.vue";
const option = ref({
  title:{
    text:"title",
    show:true,
  },
  tooltip:{
    show: true
  },
  legend: {
    top: 'bottom'
  },
  series: [
    {
      name: 'hello',
      type: 'pie',
      radius: [50, 150],
      center: ['50%', '50%'],
      roseType: 'area',
      itemStyle: {
        borderRadius: 8
      },
      labelLine:{
        show: false,
        length:-10
      },
      label:{
        show: true,
        position: 'inside', // 标签位置
        formatter: '{b}: {d}%', // 文本格式化
      },
      data: [
        { value: 40, name: '黄金' },
        { value: 38, name: '股票' },
        { value: 32, name: '基金' },
        { value: 30, name: '债卷' }
      ]
    }
  ]
})
</script>
<template>
  <chart-comp :option="option" ></chart-comp>
</template>


<style scoped>
.echarts-container {
  width: 100%;
  height: 400px; /* 必须设置高度 */
}
</style>
