import { ref, onMounted, onUnmounted } from 'vue'

// 按照惯例，组合式函数名以“use”开头
export function useMouse() {
  // 被组合式函数封装和管理的状态
  const x = ref(0)
  const y = ref(0)

  // 组合式函数可以随时更改其状态。
  function update(event) {
    x.value = event.pageX
    y.value = event.pageY
  }

  // 一个组合式函数也可以挂靠在所属组件的生命周期上
  // 来启动和卸载副作用
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  // 通过返回值暴露所管理的状态
  return { x, y }
}

import $J from 'jquery';
export function setFontSize() {
  let window_width = window.innerWidth;
  let font_size = parseFloat((window_width / 3.93).toString());
  // console.log(font_size);
  $J('html').css('font-size', font_size);
}

//vue3 跳转事件
// import {useRouter} from "vue-router";
// const route = useRouter()
import router from '@/router/index.js'
export const goViewEvent = ({name,params,query})=>{
  router.push({name, params, query});
}
