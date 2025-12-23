//vue 跳转事件
import router from '@/router/index.js'
export const goViewEvent = ({name,params,query})=>{
    router.push({name, params, query});
}
