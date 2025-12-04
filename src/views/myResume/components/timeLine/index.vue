<template>
  <div class="timeLineView box_col" style="text-align: left">
    <van-steps direction="vertical" :active="timeMessage.length">
      <template v-for="(it,i) in timeMessage" :key="i">
        <van-step>
          <div class="box_row align_center">
            <div class="timeLineView-time">{{it.time}} &nbsp;</div>
            <div class="timeLineView-local">{{it.local}}</div>
          </div>
          <p>{{it.company}}</p>
          <p>{{it.Job}}</p>
        </van-step>
      </template>

    </van-steps>
  </div>
</template>
<script setup>
const timeMessage = [
  {
    time:"2020.04 - 2025.07",
    company:"武汉向辰大数据科技有限公司",
    Job:"前端开发工程师",
    local:"武汉"
  },{
    time:"2019.02 - 2020.04",
    company:"北京亿法科技有限公司",
    Job:"前端开发工程师（前端项目负责人）",
    local:"上海"
  },{
    time:"2017.11 - 2019.02",
    company:"武汉创伟博科技有限公司",
    Job:"前端开发工程师",
    local:"武汉"
  },{
    time:"2017.07 - 2017.11",
    company:"武汉天源迪科信息技术有限公司",
    Job:"前端开发工程师",
    local:"武汉"
  },{
    time:"2016.07 - 2017.07",
    company:"荣汇集团",
    Job:"实习生",
    local:"北京"
  }
]
</script>


<style scoped lang="less">
.timeLineView{
  --van-step-circle-size:12px;
  height: auto!important;
  p{
    margin: 0.12rem 0;
  }
  &-time{
    font-size: 0.16rem;
    font-weight: bold;
  }
  &-local{
    font-size: 0.14rem;
    font-weight: bold;
    text-decoration: underline;
  }
}
</style>
