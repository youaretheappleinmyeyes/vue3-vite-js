<template>
  <div class="game-2048-container">
    <!-- 游戏头部 -->
    <div class="game-header">
      <div class="game-title">2048</div>
      <div class="score-container">
        <div class="score">得分: <span>{{ currentScore }}</span></div>
        <div class="best-score">最高分: <span>{{ bestScore }}</span></div>
        <button class="reset-btn" @click="resetGame">重置</button>
      </div>
    </div>

    <!-- Canvas 游戏主区域（竖屏核心） -->
    <canvas
        ref="gameCanvas"
        class="game-canvas"
        @touchstart.passive="handleTouchStart"
        @touchend="handleTouchEnd"
    ></canvas>

    <!-- 简化版控制按钮（可选，Canvas 优先触摸） -->
    <div class="controls" v-if="showControls">
      <button class="control-btn" @click="move('left')">←</button>
      <div class="vertical-controls">
        <button class="control-btn" @click="move('up')">↑</button>
        <button class="control-btn" @click="move('down')">↓</button>
      </div>
      <button class="control-btn" @click="move('right')">→</button>
    </div>

    <!-- 游戏结束遮罩 -->
    <Teleport to="body">
      <div class="game-over" v-if="isGameOver" @click.self="resetGame">
        <div class="game-over-content">
          <div class="game-over-title">游戏结束！</div>
          <div class="game-over-score">最终得分: <span>{{ currentScore }}</span></div>
          <div class="game-over-score">最高分: <span>{{ bestScore }}</span></div>
          <button class="restart-btn" @click="resetGame">重新开始</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

// --------------- 常量配置 ---------------
const GRID_SIZE = 4
const CELL_COUNT = GRID_SIZE * GRID_SIZE
const MIN_SWIPE_DISTANCE = 20
// Canvas 样式常量
const CELL_PADDING = 6 // 单元格间距
const CORNER_RADIUS = 4 // 圆角半径
// 方块颜色映射（缓存，避免重复创建）
const TILE_COLORS = {
  2: { bg: '#eee4da', text: '#776e65', size: 18 },
  4: { bg: '#ede0c8', text: '#776e65', size: 18 },
  8: { bg: '#f2b179', text: '#f9f6f2', size: 18 },
  16: { bg: '#f59563', text: '#f9f6f2', size: 18 },
  32: { bg: '#f67c5f', text: '#f9f6f2', size: 18 },
  64: { bg: '#f65e3b', text: '#f9f6f2', size: 18 },
  128: { bg: '#edcf72', text: '#f9f6f2', size: 16 },
  256: { bg: '#edcc61', text: '#f9f6f2', size: 16 },
  512: { bg: '#edc850', text: '#f9f6f2', size: 14 },
  1024: { bg: '#edc53f', text: '#f9f6f2', size: 14 },
  2048: { bg: '#edc22e', text: '#f9f6f2', size: 12 },
  super: { bg: '#3c3a32', text: '#f9f6f2', size: 12 }
}

// --------------- 响应式状态 ---------------
const gameCanvas = ref(null) // Canvas 引用
const currentScore = ref(0)
const bestScore = ref(Number(localStorage.getItem('2048-best-score')) || 0)
const isGameOver = ref(false)
const showControls = ref(true) // 是否显示控制按钮（移动端可隐藏）
// 非响应式状态（性能优先）
let ctx = null // Canvas 上下文
let canvasSize = 0 // Canvas 边长（竖屏正方形）
let cellSize = 0 // 单元格边长
let grid = Array(CELL_COUNT).fill(0) // 游戏网格数据
let isAnimating = false // 动画锁
let touchStartX = 0
let touchStartY = 0
let animationFrameId = null // 动画帧 ID（用于取消）

// --------------- Canvas 初始化 ---------------
const initCanvas = () => {
  if (!gameCanvas.value) return
  // 获取 Canvas 元素和上下文
  const canvas = gameCanvas.value
  ctx = canvas.getContext('2d')

  // 适配竖屏：设置 Canvas 尺寸（取容器宽度，最大 350px）
  const containerWidth = Math.min(window.innerWidth - 20, 350)
  canvasSize = containerWidth
  cellSize = (canvasSize - (GRID_SIZE + 1) * CELL_PADDING) / GRID_SIZE

  // 设置 Canvas 实际尺寸（避免模糊）
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvasSize * dpr
  canvas.height = canvasSize * dpr
  canvas.style.width = `${canvasSize}px`
  canvas.style.height = `${canvasSize}px`
  ctx.scale(dpr, dpr) // 适配高清屏

  // 初始化绘制
  drawGame()
}

// --------------- 游戏核心逻辑 ---------------
// 初始化游戏
const initGame = () => {
  if (isAnimating) return
  grid = Array(CELL_COUNT).fill(0)
  currentScore.value = 0
  isGameOver.value = false
  isAnimating = false

  // 生成初始方块
  generateRandomTile()
  generateRandomTile()
  // 绘制游戏
  drawGame()
}

// 生成随机方块
const generateRandomTile = () => {
  const emptyCells = []
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] === 0) emptyCells.push(i)
  }

  if (emptyCells.length === 0) return false

  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  grid[randomIndex] = Math.random() < 0.9 ? 2 : 4
  return true
}

// 绘制整个游戏（Canvas 核心）
const drawGame = () => {
  if (!ctx) return

  // 1. 清空画布
  ctx.clearRect(0, 0, canvasSize, canvasSize)

  // 2. 绘制游戏背景
  drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, CORNER_RADIUS, '#bbada0')

  // 3. 绘制单元格
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = CELL_PADDING + col * (cellSize + CELL_PADDING)
      const y = CELL_PADDING + row * (cellSize + CELL_PADDING)
      // 绘制单元格背景
      drawRoundedRect(ctx, x, y, cellSize, cellSize, CORNER_RADIUS, 'rgba(238, 228, 218, 0.35)')

      // 绘制数字方块（如果有值）
      const index = row * GRID_SIZE + col
      const value = grid[index]
      if (value !== 0) {
        drawTile(x, y, value)
      }
    }
  }
}

// 绘制圆角矩形（工具函数）
const drawRoundedRect = (ctx, x, y, width, height, radius, color) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

// 绘制数字方块
const drawTile = (x, y, value) => {
  // 获取方块样式
  const tileStyle = TILE_COLORS[value] || TILE_COLORS.super
  // 绘制方块背景
  drawRoundedRect(ctx, x, y, cellSize, cellSize, CORNER_RADIUS, tileStyle.bg)
  // 绘制数字
  ctx.fillStyle = tileStyle.text
  ctx.font = `bold ${tileStyle.size}px -apple-system, BlinkMacSystemFont, "Segoe UI"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value.toString(), x + cellSize / 2, y + cellSize / 2)
}

// 处理移动逻辑（Canvas 版优化：无 DOM 操作，仅更新数据后重绘）
const move = (direction) => {
  if (isGameOver.value || isAnimating) return
  isAnimating = true

  let moved = false
  const newGrid = [...grid]

  // 处理方向逻辑（复用之前的算法，仅更新数据）
  switch(direction) {
    case 'up': moved = processVerticalMove(-1, newGrid); break
    case 'down': moved = processVerticalMove(1, newGrid); break
    case 'left': moved = processHorizontalMove(-1, newGrid); break
    case 'right': moved = processHorizontalMove(1, newGrid); break
  }

  if (moved) {
    grid = [...newGrid]
    const tileGenerated = generateRandomTile()
    // 重绘游戏（Canvas 核心：数据更新后立即重绘）
    drawGame()

    // 检查游戏结束
    if (!tileGenerated && !canMove()) {
      endGame()
    }
  }

  // 解锁动画（短延迟避免快速操作）
  setTimeout(() => {
    isAnimating = false
  }, 80)
}

// 水平移动处理（仅更新数据，无 DOM 操作）
const processHorizontalMove = (direction, newGrid) => {
  let moved = false

  for (let row = 0; row < GRID_SIZE; row++) {
    const rowStart = row * GRID_SIZE
    const rowValues = newGrid.slice(rowStart, rowStart + GRID_SIZE)
    const filtered = rowValues.filter(val => val !== 0)

    if (filtered.length === 0) continue

    const merged = []
    let i = 0
    while (i < filtered.length) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2
        merged.push(mergedVal)
        currentScore.value += mergedVal
        i += 2
        moved = true
      } else {
        merged.push(filtered[i])
        i += 1
      }
    }

    const zeros = Array(GRID_SIZE - merged.length).fill(0)
    const newRow = direction === -1 ? [...merged, ...zeros] : [...zeros, ...merged]

    if (JSON.stringify(rowValues) !== JSON.stringify(newRow)) {
      moved = true
      newGrid.splice(rowStart, GRID_SIZE, ...newRow)
    }
  }

  if (currentScore.value > bestScore.value) {
    bestScore.value = currentScore.value
  }

  return moved
}

// 垂直移动处理
const processVerticalMove = (direction, newGrid) => {
  let moved = false

  for (let col = 0; col < GRID_SIZE; col++) {
    const colValues = []
    for (let row = 0; row < GRID_SIZE; row++) {
      colValues.push(newGrid[row * GRID_SIZE + col])
    }

    const filtered = colValues.filter(val => val !== 0)
    if (filtered.length === 0) continue

    const merged = []
    let i = 0
    while (i < filtered.length) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2
        merged.push(mergedVal)
        currentScore.value += mergedVal
        i += 2
        moved = true
      } else {
        merged.push(filtered[i])
        i += 1
      }
    }

    const zeros = Array(GRID_SIZE - merged.length).fill(0)
    const newCol = direction === -1 ? [...merged, ...zeros] : [...zeros, ...merged]

    if (JSON.stringify(colValues) !== JSON.stringify(newCol)) {
      moved = true
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row * GRID_SIZE + col] = newCol[row]
      }
    }
  }

  if (currentScore.value > bestScore.value) {
    bestScore.value = currentScore.value
  }

  return moved
}

// 检查是否可移动
const canMove = () => {
  // 检查空单元格
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] === 0) return true
  }

  // 检查相邻单元格
  for (let i = 0; i < CELL_COUNT; i++) {
    const val = grid[i]
    if ((i + 1) % GRID_SIZE !== 0 && val === grid[i + 1]) return true
    if (i + GRID_SIZE < CELL_COUNT && val === grid[i + GRID_SIZE]) return true
  }

  return false
}

// 游戏结束
const endGame = () => {
  isGameOver.value = true
  localStorage.setItem('2048-best-score', bestScore.value.toString())
}

// 重置游戏
const resetGame = () => {
  initGame()
}

// --------------- 触摸事件处理 ---------------
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const handleTouchEnd = (e) => {
  if (isGameOver.value || isAnimating) return

  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY

  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)

  if (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE) return

  const direction = absY > absX
      ? (deltaY > 0 ? 'down' : 'up')
      : (deltaX > 0 ? 'right' : 'left')

  move(direction)
}

// --------------- 生命周期 & 适配 ---------------
onMounted(() => {
  // 初始化 Canvas
  nextTick(() => {
    initCanvas()
    initGame()
  })

  // 窗口大小变化时重新适配
  window.addEventListener('resize', initCanvas)

  // 键盘控制（调试用）
  const keydownHandler = (e) => {
    if (isGameOver.value || isAnimating) return
    switch(e.key) {
      case 'ArrowUp': move('up'); break
      case 'ArrowDown': move('down'); break
      case 'ArrowLeft': move('left'); break
      case 'ArrowRight': move('right'); break
      case 'r': resetGame(); break
    }
  }
  document.addEventListener('keydown', keydownHandler)

  // 卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', initCanvas)
    document.removeEventListener('keydown', keydownHandler)
    // 取消动画帧（避免内存泄漏）
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    isAnimating = false
  })
})

// 监听最高分变化（可选）
watch(bestScore, (newVal) => {
  localStorage.setItem('2048-best-score', newVal.toString())
}, { immediate: false })
</script>

<style scoped>
.game-2048-container {
  width: 100vw;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  background-color: #faf8ef;
  color: #776e65;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* 游戏头部 */
.game-header {
  width: 100%;
  max-width: 350px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;
}

.game-title {
  font-size: 28px;
  font-weight: bold;
}

.score-container {
  text-align: right;
}

.score, .best-score {
  font-size: 14px;
  margin-bottom: 3px;
}

.reset-btn {
  background-color: #8f7a66;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

/* Canvas 容器（竖屏正方形） */
.game-canvas {
  width: 100%;
  max-width: 350px;
  aspect-ratio: 1/1;
  border-radius: 8px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  margin-bottom: 20px;
}

/* 控制按钮（移动端可隐藏） */
.controls {
  width: 100%;
  max-width: 300px;
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.control-btn {
  width: 65px;
  height: 65px;
  border: none;
  border-radius: 8px;
  background-color: #8f7a66;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateZ(0);
  transition: background-color 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}

.control-btn:active {
  background-color: #9f8b77;
}

.vertical-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 游戏结束遮罩 */
.game-over {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transform: translateZ(0);
}

.game-over-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  min-width: 250px;
}

.game-over-title {
  font-size: 22px;
  margin-bottom: 10px;
}

.game-over-score {
  font-size: 16px;
  margin-bottom: 15px;
}

.restart-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #8f7a66;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

/* 小屏适配 */
@media (max-height: 600px) {
  .game-canvas {
    max-width: 280px;
  }
  .control-btn {
    width: 55px;
    height: 55px;
    font-size: 20px;
  }
  .game-title {
    font-size: 24px;
  }
}

/* 移动端隐藏控制按钮（优先触摸） */
@media (max-width: 480px) {
  .controls {
    display: none; /* 隐藏按钮，仅保留触摸 */
  }
}

:deep(*) {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
</style>
