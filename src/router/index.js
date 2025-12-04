import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path:'/',
      redirect:'/main',
    },
    {
      path:'/main',
      name:'main',
      redirect:'/home',
      component:()=>import('../views/main/index.vue'),
      children:[
        {
          path: '/home',
          name: 'home',
          component:()=>import('../views/home/index.vue')
        },
        {
          path: '/myResume',
          name: 'myResume',
          component:()=>import('../views/myResume/index.vue')
        }
      ]
    },
    {
      path: '/homev',
      name: 'homev',
      component: ()=>import('../views/HomeView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/:o+',
      name: '*',
      redirect: '/'
    }
  ],
})

export default router
