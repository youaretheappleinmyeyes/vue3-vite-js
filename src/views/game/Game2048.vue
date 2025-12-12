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

    <!-- Canvas 游戏主区域 -->
    <canvas
        ref="gameCanvas"
        class="game-canvas"
        @touchstart.passive="handleTouchStart"
        @touchmove.passive="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel.passive="handleTouchCancel"
    ></canvas>

    <!-- 按键提示（桌面端显示） -->
    <div class="key-hint" v-show="showKeyHint">
      <p>方向键/WASD 控制移动 | R/回车 重置</p>
    </div>

    <!-- 屏幕触控按键（核心保留） -->
    <div class="screen-controls">
      <button class="control-btn up-btn" @touchstart.passive="() => handleControlBtn('up')" @click="handleControlBtn('up')">
        ↑
      </button>
      <div class="control-middle">
        <button class="control-btn left-btn" @touchstart.passive="() => handleControlBtn('left')" @click="handleControlBtn('left')">
          ←
        </button>
        <button class="control-btn down-btn" @touchstart.passive="() => handleControlBtn('down')" @click="handleControlBtn('down')">
          ↓
        </button>
        <button class="control-btn right-btn" @touchstart.passive="() => handleControlBtn('right')" @click="handleControlBtn('right')">
          →
        </button>
      </div>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// --------------- 常量配置 ---------------
const GRID_SIZE = 4
const CELL_COUNT = GRID_SIZE * GRID_SIZE
const MIN_SWIPE_DISTANCE = 15
const SWIPE_VELOCITY_THRESHOLD = 0.3
const ANIMATION_DURATION = 80
const KEY_DEBOUNCE_TIME = 100
// Canvas 样式常量
const CELL_PADDING = 6
const CORNER_RADIUS = 4
// 方块颜色映射
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
const gameCanvas = ref(null)
const currentScore = ref(0)
const bestScore = ref(Number(localStorage.getItem('2048-best-score')) || 0)
const isGameOver = ref(false)
const showKeyHint = ref(true)
// 核心状态
let ctx = null
let canvasSize = 0
let cellSize = 0
let grid = Array(CELL_COUNT).fill(0)
let isAnimating = false
let lastKeyPressTime = 0
// 滑动相关
let touchStartX = 0
let touchStartY = 0
let touchLastX = 0
let touchLastY = 0
let touchStartTime = 0
let animationFrameId = null
let tilePositions = {}
// 屏幕按键防抖
let lastBtnClickTime = 0
const BTN_DEBOUNCE_TIME = 150

// --------------- 按键映射表 ---------------
const KEY_MAP = {
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'KeyW': 'up',
  'KeyS': 'down',
  'KeyA': 'left',
  'KeyD': 'right',
  'KeyR': 'reset',
  'Enter': 'reset'
}

// --------------- Canvas 初始化 ---------------
const initCanvas = () => {
  if (!gameCanvas.value) return
  const canvas = gameCanvas.value
  ctx = canvas.getContext('2d')

  // 竖屏适配
  const containerWidth = Math.min(window.innerWidth - 20, 350)
  canvasSize = containerWidth
  cellSize = (canvasSize - (GRID_SIZE + 1) * CELL_PADDING) / GRID_SIZE

  // 高清屏适配
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvasSize * dpr
  canvas.height = canvasSize * dpr
  canvas.style.width = `${canvasSize}px`
  canvas.style.height = `${canvasSize}px`
  ctx.scale(dpr, dpr)

  resetTilePositions()
  drawGame()
}

const resetTilePositions = () => {
  tilePositions = {}
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] !== 0) {
      const row = Math.floor(i / GRID_SIZE)
      const col = i % GRID_SIZE
      tilePositions[i] = {
        x: CELL_PADDING + col * (cellSize + CELL_PADDING),
        y: CELL_PADDING + row * (cellSize + CELL_PADDING),
        targetX: null,
        targetY: null,
        value: grid[i]
      }
    }
  }
}

// --------------- 游戏核心逻辑 ---------------
const initGame = () => {
  if (isAnimating) return
  grid = Array(CELL_COUNT).fill(0)
  currentScore.value = 0
  isGameOver.value = false
  isAnimating = false

  generateRandomTile()
  generateRandomTile()
  resetTilePositions()
  drawGame()
}

const generateRandomTile = () => {
  const emptyCells = []
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] === 0) emptyCells.push(i)
  }

  if (emptyCells.length === 0) return false

  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  grid[randomIndex] = Math.random() < 0.9 ? 2 : 4

  const row = Math.floor(randomIndex / GRID_SIZE)
  const col = randomIndex % GRID_SIZE
  tilePositions[randomIndex] = {
    x: CELL_PADDING + col * (cellSize + CELL_PADDING),
    y: CELL_PADDING + row * (cellSize + CELL_PADDING),
    targetX: null,
    targetY: null,
    value: grid[randomIndex]
  }

  return true
}

const drawGame = (progress = 1) => {
  if (!ctx) return

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  // 绘制背景
  drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, CORNER_RADIUS, '#bbada0')

  // 绘制单元格
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = CELL_PADDING + col * (cellSize + CELL_PADDING)
      const y = CELL_PADDING + row * (cellSize + CELL_PADDING)
      drawRoundedRect(ctx, x, y, cellSize, cellSize, CORNER_RADIUS, 'rgba(238, 228, 218, 0.35)')
    }
  }

  // 绘制方块（支持动画）
  Object.keys(tilePositions).forEach(index => {
    const pos = tilePositions[index]
    if (!pos) return

    let drawX = pos.x
    let drawY = pos.y
    if (pos.targetX !== null && pos.targetY !== null && progress < 1) {
      drawX = pos.x + (pos.targetX - pos.x) * progress
      drawY = pos.y + (pos.targetY - pos.y) * progress
    }

    drawTile(drawX, drawY, pos.value)
  })
}

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

const drawTile = (x, y, value) => {
  const tileStyle = TILE_COLORS[value] || TILE_COLORS.super
  drawRoundedRect(ctx, x, y, cellSize, cellSize, CORNER_RADIUS, tileStyle.bg)

  ctx.fillStyle = tileStyle.text
  ctx.font = `bold ${tileStyle.size}px -apple-system, BlinkMacSystemFont, "Segoe UI"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value.toString(), x + cellSize / 2, y + cellSize / 2)
}

// 统一的移动逻辑（按键/滑动/屏幕按钮共用）
const move = (direction) => {
  if (isGameOver.value || isAnimating) return
  isAnimating = true

  const newGrid = [...grid]
  let moved = false

  switch(direction) {
    case 'up': moved = processVerticalMove(-1, newGrid); break
    case 'down': moved = processVerticalMove(1, newGrid); break
    case 'left': moved = processHorizontalMove(-1, newGrid); break
    case 'right': moved = processHorizontalMove(1, newGrid); break
  }

  if (moved) {
    updateTileTargets(newGrid, direction)

    // 执行动画
    animateMove(() => {
      grid = [...newGrid]
      const tileGenerated = generateRandomTile()
      resetTilePositions()
      drawGame()

      if (!tileGenerated && !canMove()) {
        endGame()
      }

      setTimeout(() => {
        isAnimating = false
      }, 30)
    })
  } else {
    isAnimating = false
  }
}

const updateTileTargets = (newGrid, direction) => {
  for (let i = 0; i < CELL_COUNT; i++) {
    if (newGrid[i] === 0 || grid[i] !== newGrid[i]) continue

    const oldRow = Math.floor(i / GRID_SIZE)
    const oldCol = i % GRID_SIZE
    const newIndex = newGrid.indexOf(grid[i], i)
    if (newIndex === -1) continue

    const newRow = Math.floor(newIndex / GRID_SIZE)
    const newCol = newIndex % GRID_SIZE

    tilePositions[i] = {
      ...tilePositions[i],
      targetX: CELL_PADDING + newCol * (cellSize + CELL_PADDING),
      targetY: CELL_PADDING + newRow * (cellSize + CELL_PADDING)
    }
  }
}

const animateMove = (onComplete) => {
  let startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1)

    drawGame(progress)

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    } else {
      if (onComplete) onComplete()
      cancelAnimationFrame(animationFrameId)
    }
  }

  animationFrameId = requestAnimationFrame(animate)
}

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

const canMove = () => {
  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] === 0) return true
    if ((i + 1) % GRID_SIZE !== 0 && grid[i] === grid[i + 1]) return true
    if (i + GRID_SIZE < CELL_COUNT && grid[i] === grid[i + GRID_SIZE]) return true
  }
  return false
}

const endGame = () => {
  isGameOver.value = true
  localStorage.setItem('2048-best-score', bestScore.value.toString())
}

const resetGame = () => {
  initGame()
}

// --------------- 滑动事件处理 ---------------
const handleTouchStart = (e) => {
  // 区分是滑动还是按钮点击（避免冲突）
  const target = e.target
  if (target.classList.contains('control-btn')) return

  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  touchLastX = touchStartX
  touchLastY = touchStartY
  touchStartTime = Date.now()

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
}

const handleTouchMove = (e) => {
  if (isGameOver.value || isAnimating) return

  touchLastX = e.touches[0].clientX
  touchLastY = e.touches[0].clientY

  const deltaX = touchLastX - touchStartX
  const deltaY = touchLastY - touchStartY

  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    const previewProgress = Math.min(Math.abs(deltaX) + Math.abs(deltaY) / 100, 0.3)
    drawGameWithPreview(deltaX, deltaY, previewProgress)
  }
}

const drawGameWithPreview = (deltaX, deltaY, progress) => {
  if (!ctx) return

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, CORNER_RADIUS, '#bbada0')
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = CELL_PADDING + col * (cellSize + CELL_PADDING)
      const y = CELL_PADDING + row * (cellSize + CELL_PADDING)
      drawRoundedRect(ctx, x, y, cellSize, cellSize, CORNER_RADIUS, 'rgba(238, 228, 218, 0.35)')
    }
  }

  Object.keys(tilePositions).forEach(index => {
    const pos = tilePositions[index]
    if (!pos) return

    let offsetX = 0
    let offsetY = 0
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      offsetY = deltaY * 0.1
    } else {
      offsetX = deltaX * 0.1
    }

    drawTile(
        pos.x + offsetX * progress,
        pos.y + offsetY * progress,
        pos.value
    )
  })
}

const handleTouchEnd = () => {
  if (isGameOver.value || isAnimating) return

  const deltaX = touchLastX - touchStartX
  const deltaY = touchLastY - touchStartY
  const touchDuration = Date.now() - touchStartTime
  const velocityX = deltaX / touchDuration
  const velocityY = deltaY / touchDuration

  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  const absVX = Math.abs(velocityX)
  const absVY = Math.abs(velocityY)

  if (
      (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE) &&
      (absVX < SWIPE_VELOCITY_THRESHOLD && absVY < SWIPE_VELOCITY_THRESHOLD)
  ) {
    drawGame()
    return
  }

  let direction = ''
  if (absVX > absVY) {
    direction = velocityX > 0 ? 'right' : 'left'
  } else {
    direction = velocityY > 0 ? 'down' : 'up'
  }

  move(direction)
}

const handleTouchCancel = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  drawGame()
}

// --------------- 键盘按键处理 ---------------
const handleKeyDown = (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return

  const now = Date.now()
  if (now - lastKeyPressTime < KEY_DEBOUNCE_TIME) return
  lastKeyPressTime = now

  const key = e.code
  const action = KEY_MAP[key]

  if (!action) return

  e.preventDefault()

  if (action === 'reset') {
    resetGame()
  } else {
    move(action)
    // 键盘按键视觉反馈
    const canvas = gameCanvas.value
    if (canvas) {
      canvas.style.transform = 'scale(0.98)'
      setTimeout(() => {
        canvas.style.transform = 'scale(1)'
      }, 50)
    }
  }
}

// --------------- 屏幕触控按键处理（核心保留） ---------------
const handleControlBtn = (direction) => {
  const now = Date.now()
  // 按键防抖
  if (now - lastBtnClickTime < BTN_DEBOUNCE_TIME) return
  lastBtnClickTime = now

  if (isGameOver.value || isAnimating) return

  // 执行移动
  move(direction)

  // 按钮按下视觉反馈
  const btn = document.querySelector(`.${direction}-btn`)
  if (btn) {
    btn.classList.add('pressed')
    setTimeout(() => {
      btn.classList.remove('pressed')
    }, 100)
  }
}

// --------------- 生命周期 ---------------
onMounted(() => {
  nextTick(() => {
    initCanvas()
    initGame()
  })

  // 窗口适配
  window.addEventListener('resize', initCanvas)

  // 全局键盘监听
  document.addEventListener('keydown', handleKeyDown)

  // 移动端适配
  if (/Mobile|Android|iOS/.test(navigator.userAgent)) {
    showKeyHint.value = false
  }

  onUnmounted(() => {
    window.removeEventListener('resize', initCanvas)
    document.removeEventListener('keydown', handleKeyDown)
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    isAnimating = false
  })
})
</script>

<style scoped>
.game-2048-container {
  width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  background-color: #faf8ef;
  color: #776e65;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  //justify-content: space-between; /* 适配按键布局 */
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
  -webkit-tap-highlight-color: transparent;
}

.reset-btn:active {
  background-color: #9f8b77;
}

/* Canvas 容器 */
.game-canvas {
  width: 100%;
  max-width: 350px;
  aspect-ratio: 1/1;
  border-radius: 8px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.05s ease;
  flex-shrink: 0;
}

/* 按键提示 */
.key-hint {
  font-size: 12px;
  color: #776e65;
  margin-bottom: 15px;
  opacity: 0.7;
  flex-shrink: 0;
}

/* 屏幕触控按键（核心样式） */
.screen-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-shrink: 0;
  width: 100%;
  max-width: 200px;
}

.control-middle {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 8px;
  background-color: #8f7a66;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮按下效果 */
.control-btn.pressed {
  background-color: #6b5a4b;
  transform: scale(0.95);
}

/* 响应式按钮大小 */
@media (max-width: 375px) {
  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}

@media (max-height: 600px) {
  .control-btn {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
  .game-canvas {
    max-width: 280px;
    margin-bottom: 10px;
  }
  .game-title {
    font-size: 24px;
  }
  .key-hint {
    margin-bottom: 8px;
  }
  .screen-controls {
    margin-bottom: 10px;
  }
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
  animation: popIn 0.2s ease-out;
}

@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
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
  -webkit-tap-highlight-color: transparent;
}

.restart-btn:active {
  background-color: #9f8b77;
}

@media (max-width: 480px) {
  .game-2048-container {
    padding: 8px;
  }
  .game-header {
    margin-bottom: 10px;
  }
}

:deep(*) {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
</style>
