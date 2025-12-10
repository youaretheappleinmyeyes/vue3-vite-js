<script setup>
import chartComp from "@/components/chartComp/index.vue";
import * as echarts from 'echarts'

import {ref} from "vue";
const option = ref({
  // 标题优化：增加样式层次，适配整体风格
  title: {
    text: 'Stacked Line',
    left: 'center',
    textStyle: {
      fontSize: 18,
      fontWeight: 500,
      color: '#333',
      fontFamily: 'Arial, sans-serif'
    }
  },

  // 提示框优化：更精致的样式和交互
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: '#e0e0e0',
        width: 1,
        type: 'dashed'
      },
      z: 1 // 确保轴线在最上层
    },
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: [12, 15],
    textStyle: {
      color: '#333',
      fontSize: 12
    },
    // 格式化提示文本，增加单位说明
    formatter: function(params) {
      let res = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValue}</div>`;
      params.forEach(item => {
        res += `<div style="margin:4px 0">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};margin-right:6px;"></span>
          ${item.seriesName}: <strong>${item.value}</strong>
        </div>`;
      });
      return res;
    },
    // 延迟显示/隐藏，提升交互顺滑度
    showDelay: 20,
    hideDelay: 100
  },

  // 图例优化：位置和样式精细化
  legend: {
    data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine'],
    top: 60,
    left: 'center',
    itemGap: 20,
    itemWidth: 12,
    itemHeight: 12,
    textStyle: {
      color: '#666',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif'
    },
    // 图例hover效果
    emphasis: {
      textStyle: {
        color: '#333',
        fontWeight: 500
      }
    },
    // 图例图标样式
    icon: 'roundRect'
  },

  // 网格优化：更舒适的边距和样式
  grid: {
    left: '5%',
    right: '4%',
    bottom: '8%',
    top: '100px',
    containLabel: true,
    // 网格线样式
    lineStyle: {
      color: '#f8f8f8',
      width: 1
    }
  },

  // X轴优化：细节质感提升
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisLine: {
      lineStyle: {
        color: '#e5e5e5',
        width: 1
      }
    },
    axisTick: {
      show: true,
      length: 6,
      lineStyle: {
        color: '#e5e5e5'
      }
    },
    axisLabel: {
      color: '#666',
      fontSize: 11,
      margin: 10,
      // 增加hover高亮
      emphasis: {
        color: '#333',
        fontSize: 12
      }
    },
    // 刻度线样式
    splitLine: {
      show: false
    }
  },

  // Y轴优化：视觉更轻盈
  yAxis: {
    type: 'value',
    axisLine: {
      show: false // 隐藏Y轴线，更简洁
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#666',
      fontSize: 11,
      margin: 10,
      inside: true, // 强制标签显示在轴内侧
      // 数值格式化，增加千分位
      formatter: '{value}',
      emphasis: {
        color: '#333'
      }
    },
    splitLine: {
      lineStyle: {
        color: '#f5f5f5',
        width: 1,
        type: 'solid'
      }
    },
    // 增加Y轴最小值，避免折线贴顶/贴底
    min: function(value) {
      return value.min - Math.abs(value.min) * 0.1;
    },
    max: function(value) {
      return value.max + Math.abs(value.max) * 0.1;
    }
  },

  // 系列数据优化：精细化样式和交互
  series: [
    {
      name: 'Email',
      type: 'line',
      stack: 'Total',
      data: [120, 132, 101, 134, 90, 230, 210],
      // 折线样式
      lineStyle: {
        width: 2.5,
        color: '#409eff'
      },
      // 填充区域（堆叠图必备）
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      // 拐点样式
      symbol: 'circle',
      symbolSize: 6,
      // 拐点hover放大
      emphasis: {
        symbolSize: 10,
        focus: 'series'
      },
      // 拐点默认隐藏，hover显示
      showSymbol: false,
      // 平滑曲线
      smooth: true,
      // 动画配置
      animationDuration: 1500,
      animationEasing: 'cubicInOut'
    },
    {
      name: 'Union Ads',
      type: 'line',
      stack: 'Total',
      data: [220, 182, 191, 234, 290, 330, 310],
      lineStyle: {
        width: 2.5,
        color: '#67c23a'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.4)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 6,
      emphasis: {
        symbolSize: 10,
        focus: 'series'
      },
      showSymbol: false,
      smooth: true
    },
    {
      name: 'Video Ads',
      type: 'line',
      stack: 'Total',
      data: [150, 232, 201, 154, 190, 330, 410],
      lineStyle: {
        width: 2.5,
        color: '#e6a23c'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(230, 162, 60, 0.4)' },
          { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 6,
      emphasis: {
        symbolSize: 10,
        focus: 'series'
      },
      showSymbol: false,
      smooth: true
    },
    {
      name: 'Direct',
      type: 'line',
      stack: 'Total',
      data: [320, 332, 301, 334, 390, 330, 320],
      lineStyle: {
        width: 2.5,
        color: '#f56c6c'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 108, 108, 0.4)' },
          { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 6,
      emphasis: {
        symbolSize: 10,
        focus: 'series'
      },
      showSymbol: false,
      smooth: true
    },
    {
      name: 'Search Engine',
      type: 'line',
      stack: 'Total',
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      lineStyle: {
        width: 2.5,
        color: '#909399'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(144, 147, 153, 0.4)' },
          { offset: 1, color: 'rgba(144, 147, 153, 0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 6,
      emphasis: {
        symbolSize: 10,
        focus: 'series'
      },
      showSymbol: false,
      smooth: true
    }
  ],

  // 全局动画配置：更顺滑的过渡
  animationDuration: 1800,
  animationEasingUpdate: 'quinticInOut',

  // 颜色模式适配（可选）
  color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],

  // 工具箱（可选，增加实用功能）
  toolbox: {
    show: false,
    right: 20,
    top: 20,
    feature: {
      saveAsImage: {
        title: '保存图片',
        pixelRatio: 2,
        backgroundColor: '#fff'
      },
      restore: {
        title: '重置'
      },
      dataView: {
        title: '数据视图',
        readOnly: false
      },
      // 堆叠/取消堆叠切换
      magicType: {
        title: {
          line: '切换为折线图',
          stack: '切换为堆叠图'
        },
        type: ['line', 'stack']
      }
    }
  }
})
</script>

<template>
  <chart-comp :option="option" ></chart-comp>
</template>

<style scoped lang="less">

</style>
