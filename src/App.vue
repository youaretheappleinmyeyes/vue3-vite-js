<script setup>
import {RouterView} from 'vue-router'
import {setFontSize ,tipMobile , checkScreenOrientation} from "@/libs/public.js";

setFontSize();
// tipMobile({
//   qrcodeUrl: 'https://example.com/qrcode.png', // 替换为你的二维码地址
//   tipText: '请使用手机扫码访问本页面',
//   closeText: '关闭提示',
//   onClose: function (data) {
//     console.log('蒙版已关闭', data);
//     // 示例：显示感谢提示
//   }
// });

checkScreenOrientation({
  requiredOrientation: 'portrait',
  onSuccess: (data) => {
    console.log('✅ 屏幕方向正确（竖屏）', data);
    // 业务逻辑：初始化页面、加载内容等
  },
  onError: (data) => {
    console.log('❌ 屏幕方向错误', data);
  }
});
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
