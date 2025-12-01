import { fileURLToPath, URL } from 'node:url'

import { defineConfig , loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'



// https://vite.dev/config/
export default defineConfig(({command,mode})=>{
  // 这里不能获取 import.meta.env ，所以要通过 loadEnv 获取
  const env = loadEnv(mode, process.cwd());

  let _private = {}
  const _public = {
    base:env.VITE_API_BASE_URL,
    plugins: [
      vue(),
      // vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },

  }

  if (mode === 'development') {
    // console.log('Vite 配置：当前是开发环境')
    _private = {
      server:{//开发环境
        port:8080,
        proxy: {
          // 匹配所有以 /baidu-map-weather 开头的请求（自定义前缀，避免和其他接口冲突）
          '/baidu-weather': {
            target: 'https://api.map.baidu.com', // 百度地图接口域名
            changeOrigin: true, // 开启跨域请求头模拟
            // 关键：把前端的 /baidu-weather 替换成后端接口的 /weather/v1/
            rewrite: (path) => path.replace(/^\/baidu-weather/, '/weather/v1/')
          }
        }
      }
    }
  } else if (mode === 'production') {
    // console.log('Vite 配置：当前是生产环境')
    _private = {
      build:{
        minify: 'terser', // 切换到 terser 压缩器（默认是 esbuild）
        terserOptions: {
          compress: {
            drop_console: true, // 移除所有 console.*
            drop_debugger: true, // 移除 debugger
            // 可选：保留特定 console（如 console.error）
            // pure_funcs: ['console.log', 'console.info'] // 只移除 console.log/info
          }
        }
      }
    }
  }
  if (command === 'serve') {
    // return {
      // dev 独有配置
    // }
  } else {
    // command === 'build'
    // return {
      // build 独有配置
    // }
  }
  return Object.assign(_public,_private)
})
