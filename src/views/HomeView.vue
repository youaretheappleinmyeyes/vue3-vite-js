<script setup>

import {computed} from "vue";
import {useAppStore} from "@/stores/app.js";
const appStore = useAppStore();

setTimeout(()=>{
  appStore.updateAppName('王小玮')
},2*1000)
computed(()=>{

})


// watch(()=>appStore.appName,(n,o)=>{
//   console.log(n);
//   console.log(o);
// })

import {useMouse} from "@/libs/public.js";
import {watch} from "vue";
const {x,y} = useMouse();



</script>

<template>
  <main>
    {{x}}---{{y}}
    <div>
      {{appStore.appName}}
      {{appStore.getAppName}}
    </div>

  </main>
</template>
