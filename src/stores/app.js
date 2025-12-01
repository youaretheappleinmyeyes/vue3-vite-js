import {defineStore} from "pinia";

export const useAppStore = defineStore("appStore",{
  state:()=>{
    return {
      appName:"noName"
    }
  },
  getters: {
    getAppName: (state) => `*${state.appName}*`,
  },
  actions: {
    updateAppName(name){
      this.appName = name;
    }
  },
})
