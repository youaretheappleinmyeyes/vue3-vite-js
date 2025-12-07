<!--技术栈-->
<template>
  <div class="SkillView">
    <!-- 水平滚动彩色条 -->
    <div class="color-scroll-horizontal">
      <div class="color-strip-horizontal"></div>
    </div>
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
import {
  antImg, baidumapImg,
  elementImg, githubImg, highchartsImg, iconfontImg,
  iviewImg, lottiefilesImg, mintImg, nativeBaseImg, npmImg,
  reactImg, uViewImg, vantImg,
  vueImg
} from "@/assets/skillFile/exportSkillFile.js";

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
    logo: reactImg,
    link: "https://zh-hans.react.dev/"
  }, {
    type: "2",
    name: "Element UI",
    logo: elementImg,
    link: "https://element.eleme.io/#/zh-CN"
  }, {
    type: "2",
    name: "View Design",
    logo: iviewImg,
    link: "https://www.iviewui.com/"
  }, {
    type: "2",
    name: "NativeBase",
    logo: nativeBaseImg,
    link: "https://nativebase.io/"
  }, {
    type: "2",
    name: "Ant Design",
    logo: antImg,
    link: "https://ant-design.antgroup.com/index-cn"
  }, {
    type: "2",
    name: "Vant",
    logo: vantImg,
    link: "https://vant-ui.github.io/vant/#/zh-CN"
  }, {
    type: "2",
    name: "uView",
    logo: uViewImg,
    link: "https://uviewui.com/"
  }, {
    type: "2",
    name: "Mint UI",
    logo: mintImg,
    link: "https://mint-ui.github.io/#!/zh-cn"
  }, {
    type: "3",
    name: "Echarts",
    logo: elementImg,
    link: "https://echarts.apache.org/zh/index.html"
  }, {
    type: "3",
    name: "highcharts",
    logo: highchartsImg,
    link: "https://highcharts.com.cn/"
  }, {
    type: "3",
    name: "百度地图",
    logo: baidumapImg,
    link: "https://lbsyun.baidu.com/index.php?title=jspopularGL"
  }, {
    type: "3",
    name: "lottiefiles",
    logo: lottiefilesImg,
    link: "https://lottiefiles.com/free-animations/gold"
  }, {
    type: "3",
    name: "iconfont",
    logo: iconfontImg,
    link: "https://www.iconfont.cn/"
  }, {
    type: "3",
    name: "npm",
    logo: npmImg,
    link: "https://www.npmjs.com/"
  }, {
    type: "3",
    name: "github",
    logo: githubImg,
    link: "https://github.com//"

  }
];

function giEvent(it) {
  window.open(it.link)
}
</script>


<style lang="less" scoped>
@import "@/assets/css/preset.less";
.SkillView {
  .SkillTit {
    font-size: 0.16rem;
    font-weight: bold;
    text-align: left;
    padding: 0.1rem 0 0.1rem 0.14rem;
  }
}
</style>
