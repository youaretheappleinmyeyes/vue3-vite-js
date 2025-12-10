<template>
  <div class="pdf-reader">
    <!-- 操作区 -->
    <input type="file" accept=".pdf" @change="handleFileUpload" class="file-input" />
    <button @click="loadStaticPdf('/zh.pdf')" class="btn">加载静态PDF</button>

    <!-- 渲染区 -->
    <div class="pdf-container" v-show="isLoaded">
      <div v-if="isRendering" class="skeleton"></div>
      <canvas
        ref="pdfCanvas"
        class="pdf-canvas"
        :style="{ display: isRendering ? 'none' : 'block' }"
        key="pdf-canvas"
      ></canvas>

      <!-- 控制栏（无需旋转按钮） -->
      <div class="controls">
        <button @click="prevPage" :disabled="currentPage <= 1">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage >= totalPages">下一页</button>
        <button @click="handleZoom(0.1)">放大</button>
        <button @click="handleZoom(-0.1)">缩小</button>
      </div>
    </div>

    <!-- 状态提示 -->
    <div v-if="isLoading" class="loading">PDF加载中（{{ loadProgress }}%）</div>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import {loadScript} from '@/libs/public.js'
// ========== 防抖函数 ==========
const debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

// ========== 状态管理 ==========
const pdfCanvas = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(1.0);
const isLoading = ref(false);
const isLoaded = ref(false);
const isRendering = ref(false);
const errorMsg = ref('');
const loadProgress = ref(0);
let pdfjsLib = null;
let pdfDoc = null;
const pageCache = new Map();

// ========== 预加载PDF.js库 ==========
onMounted(async () => {
  try {
    // 国内CDN
    await loadScript('/pdf/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.bootcdn.net/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    window.pdfjsLib.GlobalWorkerOptions.cMapPacked = true;
    pdfjsLib = window.pdfjsLib;
  } catch (err) {
    // 降级unpkg
    await loadScript('https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
    window.pdfjsLib.GlobalWorkerOptions.cMapUrl = 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/';
    window.pdfjsLib.GlobalWorkerOptions.cMapPacked = true;
    pdfjsLib = window.pdfjsLib;
  }
});



// ========== 加载PDF ==========
const loadPdf = async (source) => {
  if (!pdfjsLib) {
    errorMsg.value = 'PDF库未加载完成';
    return;
  }

  isLoading.value = true;
  isLoaded.value = false;
  errorMsg.value = '';
  pageCache.clear();
  loadProgress.value = 0;

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: source,
      enableStreaming: true,
      disableFontFace: true,
      disableAnnotationRendering: true,
      progress: (progress) => {
        loadProgress.value = Math.floor(progress * 100);
      },
    });

    pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;
    isLoaded.value = true;
    isLoading.value = false;

    await nextTick();
    await renderPage(currentPage.value);
    if (totalPages.value > 1) {
      setTimeout(() => preloadPage(2), 500);
    }
  } catch (err) {
    errorMsg.value = `加载失败：${err.message}`;
    isLoading.value = false;
  }
};

// ========== 核心修复：渲染页面（垂直翻转Y轴，矫正上下颠倒） ==========
const renderPage = async (pageNum) => {
  if (!pdfDoc || pageNum < 1 || pageNum > totalPages.value) {
    errorMsg.value = '无效的页码或PDF实例';
    return;
  }

  await nextTick();
  if (!pdfCanvas.value) {
    errorMsg.value = 'Canvas元素未找到，无法渲染';
    isRendering.value = false;
    return;
  }

  isRendering.value = true;
  try {
    let page = pageCache.get(pageNum);
    if (!page) {
      page = await pdfDoc.getPage(pageNum);
      pageCache.set(pageNum, page);
    }

    if (!pdfCanvas.value) throw new Error('Canvas元素已被销毁');

    // 1. 基础视口配置（无旋转）
    const viewport = page.getViewport({
      scale: scale.value,
      rotate: 0, // 强制旋转为0，排除旋转影响
      dontFlip: true,
    });

    const canvas = pdfCanvas.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');

    // 2. 重置画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // ========== 关键修复：垂直翻转Y轴 ==========
    // 步骤1：保存当前画布状态
    ctx.save();
    // 步骤2：将画布原点移到左下角（匹配PDF坐标系）
    ctx.translate(0, canvas.height);
    // 步骤3：垂直翻转Y轴（scaleY(-1) 实现上下翻转）
    ctx.scale(1, -1);

    // 3. 渲染PDF（此时画布已翻转，内容不再颠倒）
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      renderInteractiveForms: false,
    }).promise;

    // 4. 恢复画布状态（避免后续操作受影响）
    ctx.restore();

    errorMsg.value = '';
  } catch (err) {
    errorMsg.value = `渲染失败：${err.message}`;
    console.error('渲染详情：', err);
  } finally {
    isRendering.value = false;
  }
};

// ========== 辅助方法 ==========
const preloadPage = async (pageNum) => {
  if (!pdfDoc || pageCache.has(pageNum) || pageNum > totalPages.value) return;
  try {
    const page = await pdfDoc.getPage(pageNum);
    pageCache.set(pageNum, page);
  } catch (err) {
    console.warn('预加载页面失败：', err);
  }
};

const handleZoom = debounce((delta) => {
  const newScale = Math.max(0.5, Math.min(2, scale.value + delta));
  if (newScale !== scale.value) {
    scale.value = newScale;
    nextTick(() => renderPage(currentPage.value));
  }
}, 100);

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    nextTick(() => renderPage(currentPage.value));
    if (currentPage.value > 1) preloadPage(currentPage.value - 1);
  }
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    nextTick(() => renderPage(currentPage.value));
    if (currentPage.value < totalPages.value) preloadPage(currentPage.value + 1);
  }
};

const loadStaticPdf = (path) => loadPdf(path);

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file || !file.name.endsWith('.pdf')) {
    errorMsg.value = '请选择PDF文件';
    return;
  }
  const blobUrl = URL.createObjectURL(file);
  loadPdf(blobUrl);
  e.target.value = '';
};

// ========== 监听缩放变化 ==========
watch(scale, () => {
  if (isLoaded.value && !isRendering.value && pdfCanvas.value) {
    renderPage(currentPage.value);
  }
}, { immediate: false });
</script>

<style lang="less" scoped>
.pdf-reader {
  margin: 20px auto;
  padding: 0 5px;
}
.file-input {
  margin-right: 12px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.btn {
  padding: 8px 16px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.pdf-container {
  margin-top: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  .pdf-canvas{
    width: 100%;
  }
}
.skeleton {
  width: 100%;
  height: 600px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  align-items: center;
  flex-wrap: wrap;
}
.controls button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #646cff;
  color: #fff;
  cursor: pointer;
}
.controls button:disabled {
  background: #ccc;
}
.loading {
  margin-top: 20px;
  color: #666;
  font-size: 18px;
}
.error {
  margin-top: 20px;
  color: #ff4d4f;
  font-size: 18px;
}
.pdf-canvas {
  display: block;
  margin: 0 auto;
}
</style>
