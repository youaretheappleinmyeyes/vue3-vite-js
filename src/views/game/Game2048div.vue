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

    <!-- 游戏主区域（优化：仅更新变化的单元格） -->
    <div
        class="game-container"
        @touchstart.passive="handleTouchStart"
        @touchend="handleTouchEnd"
    >
      <div
          v-for="(cell, index) in grid"
          :key="index"
          class="cell"
          :data-index="index"
      >
        <div
            v-if="cell !== 0"
            class="tile"
            :class="getTileClass(cell)"
            :style="getTileStyle(index)"
        >
          {{ cell }}
        </div>
      </div>
    </div>

    <!-- 竖屏控制按钮（优化：防抖点击） -->
    <div class="controls">
      <button class="control-btn" @click="debouncedMove('left')">←</button>
      <div class="vertical-controls">
        <button class="control-btn" @click="debouncedMove('up')">↑</button>
        <button class="control-btn" @click="debouncedMove('down')">↓</button>
      </div>
      <button class="control-btn" @click="debouncedMove('right')">→</button>
    </div>

    <!-- 游戏结束遮罩（优化：懒渲染） -->
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
import {ref, computed, onMounted, onUnmounted, onActivated, onDeactivated} from 'vue'

// --------------- 常量配置（抽离，减少重复创建）---------------
const GRID_SIZE = 4
const CELL_COUNT = GRID_SIZE * GRID_SIZE
const MIN_SWIPE_DISTANCE = 20
const TILE_STYLES_MAP = { // 缓存样式映射，避免重复计算
  2: 'tile-2',
  4: 'tile-4',
  8: 'tile-8',
  16: 'tile-16',
  32: 'tile-32',
  64: 'tile-64',
  128: 'tile-128',
  256: 'tile-256',
  512: 'tile-512',
  1024: 'tile-1024',
  2048: 'tile-2048',
  super: 'tile-super'
}

// --------------- 响应式状态（精简，仅必要数据响应式）---------------
const grid = ref(Array(CELL_COUNT).fill(0))
const currentScore = ref(0)
const bestScore = ref(Number(localStorage.getItem('2048-best-score')) || 0)
const isGameOver = ref(false)
// 非响应式变量（减少Vue依赖追踪开销）
let touchStartX = 0
let touchStartY = 0
let isMoving = false // 移动锁，避免重复触发
let keydownHandler = null // 缓存事件处理函数，方便销毁

// --------------- 缓存计算结果（减少重复计算）---------------
const getTileClass = (value) => {
  if (value >= 4096) return TILE_STYLES_MAP.super
  return TILE_STYLES_MAP[value] || TILE_STYLES_MAP[2048]
}

// 优化：缓存单元格样式，减少重排
const getTileStyle = (index) => {
  const row = Math.floor(index / GRID_SIZE)
  const col = index % GRID_SIZE
  // 硬件加速 + 固定定位，减少重排
  return {
    transform: 'translateZ(0)',
    willChange: 'transform'
  }
}

// --------------- 防抖函数（优化交互流畅度）---------------
const debounce = (fn, delay = 100) => {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// --------------- 游戏核心逻辑（算法优化）---------------
// 初始化游戏（优化：减少数组创建次数）
const initGame = () => {
  if (isMoving) return
  isGameOver.value = false
  currentScore.value = 0
  // 优化：复用数组，而非重新创建
  grid.value.fill(0)

  // 批量生成初始方块，减少渲染次数
  generateRandomTile()
  generateRandomTile()
  isMoving = false
}

// 生成随机方块（优化：减少数组遍历次数）
const generateRandomTile = () => {
  // 优化：提前缓存空单元格，避免多次遍历
  const emptyCells = []
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid.value[i] === 0) emptyCells.push(i)
  }

  if (emptyCells.length === 0) return false

  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  grid.value[randomIndex] = Math.random() < 0.9 ? 2 : 4
  return true
}

// 处理水平移动（优化：减少数组拷贝/反转次数）
const processHorizontalMove = (direction, newGrid) => {
  let moved = false

  for (let row = 0; row < GRID_SIZE; row++) {
    const rowStart = row * GRID_SIZE
    const rowEnd = rowStart + GRID_SIZE
    const rowValues = newGrid.slice(rowStart, rowEnd)
    const filtered = rowValues.filter(val => val !== 0)

    if (filtered.length === 0) continue // 空行跳过

    const merged = []
    let i = 0
    // 优化：一次遍历完成合并，减少循环次数
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

    // 优化：按需补零，避免reverse操作
    const zeros = Array(GRID_SIZE - merged.length).fill(0)
    const newRow = direction === -1
        ? [...merged, ...zeros]
        : [...zeros, ...merged]

    // 优化：仅当行有变化时才更新
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

// 处理垂直移动（优化：转置代替旋转，减少计算）
const processVerticalMove = (direction, newGrid) => {
  let moved = false

  for (let col = 0; col < GRID_SIZE; col++) {
    // 优化：直接提取列，避免转置
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
    const newCol = direction === -1
        ? [...merged, ...zeros]
        : [...zeros, ...merged]

    if (JSON.stringify(colValues) !== JSON.stringify(newCol)) {
      moved = true
      // 优化：直接更新列，避免转置回写
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

// 移动逻辑（优化：加锁避免重复触发）
const move = (direction) => {
  if (isGameOver.value || isMoving) return
  isMoving = true

  // 优化：浅拷贝数组，减少内存占用
  const newGrid = [...grid.value]
  let moved = false

  switch (direction) {
    case 'up':
      moved = processVerticalMove(-1, newGrid);
      break
    case 'down':
      moved = processVerticalMove(1, newGrid);
      break
    case 'left':
      moved = processHorizontalMove(-1, newGrid);
      break
    case 'right':
      moved = processHorizontalMove(1, newGrid);
      break
  }

  if (moved) {
    // 优化：直接赋值，减少响应式触发次数
    grid.value = newGrid
    const tileGenerated = generateRandomTile()
    // 优化：提前判断，减少函数调用
    if (!tileGenerated && !canMove()) {
      endGame()
    }
  }

  // 优化：延迟解锁，避免快速连续操作
  setTimeout(() => {
    isMoving = false
  }, 80) // 缩短延迟，提升流畅度
}

// 防抖移动（优化：缩短防抖时间）
const debouncedMove = debounce(move, 50)

// 检查是否可移动（优化：提前终止循环）
const canMove = () => {
  // 优化：先检查空单元格
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid.value[i] === 0) return true
  }

  // 优化：一次遍历检查相邻单元格，提前终止
  for (let i = 0; i < CELL_COUNT; i++) {
    const val = grid.value[i]
    // 检查右侧
    if ((i + 1) % GRID_SIZE !== 0 && val === grid.value[i + 1]) return true
    // 检查下侧
    if (i + GRID_SIZE < CELL_COUNT && val === grid.value[i + GRID_SIZE]) return true
  }

  return false
}

// 游戏结束（优化：批量更新）
const endGame = () => {
  isGameOver.value = true
  // 优化：仅一次本地存储写入
  localStorage.setItem('2048-best-score', bestScore.value.toString())
}

// 重置游戏（优化：复用初始化逻辑）
const resetGame = () => {
  initGame()
}

// --------------- 触摸事件（优化：减少计算）---------------
const handleTouchStart = (e) => {
  // 优化：非响应式变量，减少Vue开销
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const handleTouchEnd = (e) => {
  if (isGameOver.value || isMoving) return

  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY

  // 优化：提前计算绝对值，减少重复计算
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)

  // 优化：提前过滤短距离滑动
  if (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE) return

  // 优化：竖屏优先垂直方向，减少判断
  const direction = absY > absX
      ? (deltaY > 0 ? 'down' : 'up')
      : (deltaX > 0 ? 'right' : 'left')

  move(direction) // 触摸直接触发，不防抖（提升流畅度）
}

// --------------- 生命周期（优化：及时清理）---------------
onMounted(() => {
  // 优化：缓存事件处理函数，避免重复创建
  keydownHandler = (e) => {
    if (isGameOver.value || isMoving) return
    switch (e.key) {
      case 'ArrowUp':
        move('up');
        break
      case 'ArrowDown':
        move('down');
        break
      case 'ArrowLeft':
        move('left');
        break
      case 'ArrowRight':
        move('right');
        break
      case 'r':
        resetGame();
        break
    }
  }

  document.addEventListener('keydown', keydownHandler)
  initGame()
})

// 优化：组件卸载/失活时清理资源
onUnmounted(() => {
  document.removeEventListener('keydown', keydownHandler)
  isMoving = false
})

onDeactivated(() => {
  // 组件失活时解锁，避免返回后无法操作
  isMoving = false
})

onActivated(() => {
  // 组件激活时重新渲染
  initGame()
})
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
  -webkit-font-smoothing: antialiased; /* 优化字体渲染 */
}

/* 游戏头部（优化：减少重排） */
.game-header {
  width: 100%;
  max-width: 350px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0; /* 避免压缩 */
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
  transition: background-color 0.1s ease; /* 缩短过渡时间 */
}

/* 游戏主区域（核心优化：硬件加速 + 减少重排） */
.game-container {
  width: 100%;
  max-width: 350px;
  aspect-ratio: 1/1;
  background-color: #bbada0;
  border-radius: 8px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 20px;
  position: relative;
  transform: translateZ(0); /* 硬件加速 */
  will-change: contents; /* 提示浏览器优化 */
  touch-action: none; /* 禁用浏览器默认触摸行为 */
}

.cell {
  background-color: rgba(238, 228, 218, 0.35);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden; /* 避免溢出重绘 */
}

/* 数字方块（优化：硬件加速 + 减少重绘） */
.tile {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  transition: transform 0.08s ease-out; /* 缩短过渡时间，更流畅 */
  z-index: 1;
  transform: translateZ(0); /* 硬件加速 */
  backface-visibility: hidden; /* 避免重绘 */
}

/* 方块样式（优化：精简选择器） */
.tile-2 {
  background: #eee4da;
  color: #776e65;
}

.tile-4 {
  background: #ede0c8;
  color: #776e65;
}

.tile-8 {
  background: #f2b179;
  color: #f9f6f2;
}

.tile-16 {
  background: #f59563;
  color: #f9f6f2;
}

.tile-32 {
  background: #f67c5f;
  color: #f9f6f2;
}

.tile-64 {
  background: #f65e3b;
  color: #f9f6f2;
}

.tile-128 {
  background: #edcf72;
  color: #f9f6f2;
  font-size: 16px;
}

.tile-256 {
  background: #edcc61;
  color: #f9f6f2;
  font-size: 16px;
}

.tile-512 {
  background: #edc850;
  color: #f9f6f2;
  font-size: 14px;
}

.tile-1024 {
  background: #edc53f;
  color: #f9f6f2;
  font-size: 14px;
}

.tile-2048 {
  background: #edc22e;
  color: #f9f6f2;
  font-size: 12px;
}

.tile-super {
  background: #3c3a32;
  color: #f9f6f2;
  font-size: 12px;
}

/* 控制按钮（优化：减少hover重绘） */
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
  transform: translateZ(0); /* 硬件加速 */
  transition: background-color 0.1s ease; /* 缩短过渡 */
  -webkit-tap-highlight-color: transparent; /* 移除点击高亮 */
}

.control-btn:active {
  background-color: #9f8b77; /* 用active代替hover，减少移动端重绘 */
}

.vertical-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 游戏结束遮罩（优化：硬件加速） */
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
  transform: translateZ(0); /* 硬件加速 */
}

.game-over-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  min-width: 250px;
  transform: scale(1.05); /* 轻微缩放，提升视觉流畅度 */
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
  transition: background-color 0.1s ease;
}

/* 小屏适配（优化：媒体查询精简） */
@media (max-height: 600px) {
  .game-container {
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

/* 优化：禁用文本选择，减少不必要的交互 */
:deep(*) {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
</style>
