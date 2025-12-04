<!--技术栈-->
<template>
  <div class="SkillView">
    <template v-for="(gt,gi) in groupList" :key="gt.lab+gi.type">
      <div class="SkillTit">
        {{ gt.lab }}
      </div>
      <van-grid>
        <template v-for="(it,index) in uiList.filter(its=>its.type ===gt.type)" :key="it.name">
          <van-grid-item :icon="it.logo" :text="it.name" @click="giEvent(it)"/>
        </template>
      </van-grid>
<!--      -->
    </template>
  </div>
</template>
<script setup>
import {antImg,vueImg} from "@/assets/skillFile/exportSkillFile.js";

const groupList = [
  {
    lab: "技术栈",
    type: "1"
  }, {
    lab: "UI 库",
    type: "2"
  }, {
    lab: "资源库",
    type: "3"
  }
];
const uiList = [
  {
    type: "1",
    name: "Vue.js",
    logo: vueImg,
    link: "https://cn.vuejs.org/"
  }, {
    type: "1",
    name: "React",
    //logo: ()=>await import('@/assets/skillFile/react.png'),
    link: "https://zh-hans.react.dev/"
  }, {
    type: "2",
    name: "Element UI",
    //logo: ()=>await import('@/assets/skillFile/element.png'),
    link: "https://element.eleme.io/#/zh-CN"
  }, {
    type: "2",
    name: "View Design",
    //logo: ()=>await import('@/assets/skillFile/iview.svg'),
    link: "https://www.iviewui.com/"
  }, {
    type: "2",
    name: "NativeBase",
    //logo: ()=>await import('@/assets/skillFile/NativeBase.png'),
    link: "https://nativebase.io/"
  }, {
    type: "2",
    name: "Ant Design",
    //logo: ()=>await import('@/assets/skillFile/ant.svg'),
    link: "https://ant-design.antgroup.com/index-cn"
  }, {
    type: "2",
    name: "Vant",
    //logo: ()=>await import('@/assets/skillFile/vant.png'),
    link: "https://vant-ui.github.io/vant/#/zh-CN"
  }, {
    type: "2",
    name: "uView",
    //logo: ()=>await import('@/assets/skillFile/uView.png'),
    link: "https://uviewui.com/"
  }, {
    type: "2",
    name: "Mint UI",
    //logo: ()=>await import('@/assets/skillFile/Mint.png'),
    link: "https://mint-ui.github.io/#!/zh-cn"
  }, {
    type: "3",
    name: "Echarts",
    //logo: ()=>await import('@/assets/skillFile/echarts.png'),
    link: "https://echarts.apache.org/zh/index.html"
  }, {
    type: "3",
    name: "highcharts",
    //logo: ()=>await import('@/assets/skillFile/highcharts.png'),
    link: "https://highcharts.com.cn/"
  }, {
    type: "3",
    name: "百度地图",
    //logo: ()=>await import('@/assets/skillFile/baidumap.png'),
    link: "https://lbsyun.baidu.com/index.php?title=jspopularGL"
  }, {
    type: "3",
    name: "lottiefiles",
    //logo: ()=>await import('@/assets/skillFile/lottiefiles.png'),
    link: "https://lottiefiles.com/free-animations/gold"
  }, {
    type: "3",
    name: "iconfont",
    //logo: ()=>await import('@/assets/skillFile/iconfont.png'),
    link: "https://www.iconfont.cn/"
  }, {
    type: "3",
    name: "npm",
    //logo: ()=>await import('@/assets/skillFile/npm.png'),
    link: "https://www.npmjs.com/"
  }, {
    type: "3",
    name: "github",
    //logo: ()=>await import('@/assets/skillFile/github.png'),
    link: "https://github.com//"

  }
];

function giEvent(it) {
  window.open(it.link)
}
</script>


<style lang="less" scoped>
.SkillView {
  .SkillTit {
    font-size: 0.16rem;
    font-weight: bold;
    text-align: left;
    padding: 0.1rem 0 0.1rem 0.14rem;
  }
}
</style>
