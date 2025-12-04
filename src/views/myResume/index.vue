<script setup>
import txfile from './file/tx.jpeg';
import TimeLine from "@/views/myResume/components/timeLine/index.vue";
import SkillView from "@/views/myResume/components/skillView/index.vue";

</script>

<template>
<tcb class="myResumeView">
  <template #header>
    <van-nav-bar
      title="简历"/>
  </template>
  <div class="myResumeView-topCard box_row">
    <div class="box_row_100 box_col align_start jus_center">
      <div class="myResumeView-name">
        姓名
      </div>
      <div class="myResumeView-job">
        <i class="jlicon icon-zhiye" style="color: #00affa"></i> 前端开发工程师
      </div>
    </div>
    <div class="box_col jus_center align_center">
      <van-image
        width="100"
        height="100"
        :src="txfile"
      />
    </div>
  </div>

  <time-line></time-line>

  <skill-view></skill-view>

</tcb>
</template>

<style scoped lang="less">
@import "index.less";
.myResumeView{

}
</style>
