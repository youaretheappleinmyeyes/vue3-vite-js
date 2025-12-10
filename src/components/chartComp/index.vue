<template>
  <div ref="chartRef" class="echarts-container" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
import * as echarts from 'echarts'

// 1. 定义 props（支持外部传参）
const props = defineProps({
  // 图表配置项
  option: {
    type: Object,
    required: true
  },
  // 宽度（默认100%）
  width: {
    type: String,
    default: '100%'
  },
  // 高度（默认400px）
  height: {
    type: String,
    default: '400px'
  },
  // 是否开启窗口自适应
  autoResize: {
    type: Boolean,
    default: true
  }
})

// 2. 定义事件
const emit = defineEmits(['chartInit', 'chartUpdate'])

// 3. 核心变量
const chartRef = ref(null)
let myChart = null
let resizeObserver = null

// 4. 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  // 避免重复创建实例
  if (myChart) {
    myChart.dispose()
  }
  // 创建实例
  myChart = echarts.init(chartRef.value)
  // 设置配置项
  myChart.setOption(props.option, true)
  // 触发初始化事件
  emit('chartInit', myChart)
  // 开启自适应
  if (props.autoResize) {
    initResizeObserver()
  }
}

// 5. 窗口自适应（使用 ResizeObserver 性能更优）
const initResizeObserver = () => {
  if (!myChart || !window.ResizeObserver) return
  // 销毁旧的监听
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  // 监听容器尺寸变化
  resizeObserver = new ResizeObserver(() => {
    myChart.resize()
  })
  resizeObserver.observe(chartRef.value)
}

// 6. 监听 option 变化，更新图表
watch(
  () => props.option,
  (newOption) => {
    if (myChart) {
      myChart.setOption(newOption, true)
      emit('chartUpdate', myChart)
    }
  },
  { deep: true } // 深度监听对象变化
)

// 7. 生命周期
onMounted(() => {
  initChart()
})

onUnmounted(() => {
  // 销毁图表实例
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  // 销毁尺寸监听
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.echarts-container {
  transition: all 0.3s;
}
</style>
