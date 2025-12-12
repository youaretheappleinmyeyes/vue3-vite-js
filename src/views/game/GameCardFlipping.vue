<template>
  <div class="container">
    <!-- 游戏标题 -->
    <div class="text-center mb-6">
      <h1 class="game-title">♦ 翻牌大挑战</h1>
      <p class="game-subtitle">自定义网格大小，翻到钻石得分，翻到炸弹游戏结束！</p>
    </div>

    <!-- 控制面板 -->
    <div class="bg-white rounded-xl p-4 shadow mb-6 control-panel grid gap-4">
      <!-- 网格行数 -->
      <div class="flex flex-col">
        <label class="control-label">网格行数</label>
        <div class="flex items-center">
          <button
              @click="decreaseRows"
              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"
          >-</button>
          <input
              type="number"
              v-model.number="gridRows"
              min="3"
              max="8"
              class="input-number"
              :disabled="isPlaying"
          >
          <button
              @click="increaseRows"
              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"
          >+</button>
        </div>
      </div>

      <!-- 网格列数 -->
      <div class="flex flex-col">
        <label class="control-label">网格列数</label>
        <div class="flex items-center">
          <button
              @click="decreaseCols"
              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"
          >-</button>
          <input
              type="number"
              v-model.number="gridCols"
              min="3"
              max="8"
              class="input-number"
              :disabled="isPlaying"
          >
          <button
              @click="increaseCols"
              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"
          >+</button>
        </div>
      </div>

      <!-- 炸弹数量 -->
      <div class="flex flex-col">
        <label class="control-label">炸弹数量</label>
        <div class="flex items-center">
          <button
              @click="decreaseBombs"
              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"
          >-</button>
          <input
              type="number"
              v-model.number="bombCount"
              :min="1"
              :max="totalCards - 1"
              class="input-number"
              :disabled="isPlaying"
          >
          <button
              @click="increaseBombs"
              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"
          >+</button>
        </div>
      </div>

      <!-- 游戏控制 -->
      <div class="flex flex-col">
        <label class="control-label">游戏控制</label>
        <div class="grid gap-2 game-controls">
          <button
              @click="startGame"
              :class="['btn btn-primary', { 'btn-disabled': isPlaying }]"
          >{{ isPlaying ? '⏸ 游戏中' : '▶ 开始' }}</button>
          <button
              @click="restartGame"
              :class="['btn btn-secondary', { 'btn-disabled': !isPlaying }]"
          >↻ 重开</button>
          <button
              @click="resetSettings"
          >↺ 重置</button>
<!--              :class="['btn btn-gray', { 'btn-disabled': isPlaying }]"-->
        </div>
      </div>

      <!-- 得分显示 -->
      <div class="flex flex-col control-colspan-4">
        <label class="control-label">当前得分 / 总卡牌数: {{ totalCards }}</label>
        <div class="score-display">
          <span>🏆</span>
          <span class="score-value">{{ score }}</span>
          <span class="score-high">(最高: {{ highScore }})</span>
        </div>
      </div>
    </div>

    <!-- 游戏区域 -->
    <div
        ref="gameBoardRef"
        class="game-board grid"
        :style="{
        '--grid-cols': gridCols,
        '--grid-rows': gridRows,
        'grid-template-columns': `repeat(var(--grid-cols), 1fr)`,
        'grid-template-rows': `repeat(var(--grid-rows), 1fr)`,
        'gap': '0.06rem',
        'aspect-ratio': gridRows !== gridCols ? `${gridCols}/${gridRows}` : '1/1'
      }"
    >
      <!-- 初始提示 -->
      <div v-if="!isPlaying && !cards.length" class="initial-hint">
        <span>🎮</span>
        <p>设置网格大小后点击"开始"按钮</p>
      </div>

      <!-- 卡牌列表 -->
      <div
          v-for="(card, index) in cards"
          :key="index"
          class="card-flip"
          :class="{ 'card-flipped': card.revealed }"
          @click="flipCard(index)"
          @touchend.prevent="flipCard(index)"
          :data-index="index"
      >
        <!-- 卡牌正面 -->
        <div class="card-face card-front">?</div>
        <!-- 卡牌背面 -->
        <div
            :class="['card-face', card.isBomb ? 'card-back-bomb' : 'card-back-diamond']"
        >
          {{ card.isBomb ? '💣' : '♦' }}
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <div
        v-if="showModal"
        class="modal-overlay"
        @click.self="closeModal"
        @touchmove.prevent
    >
      <div
          class="modal-content"
          :class="{ 'show': showModal }"
      >
        <div
            class="modal-icon"
            :style="{
            backgroundColor: isWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isWin ? '#10b981' : '#ef4444'
          }"
        >
          {{ isWin ? '🏆' : '💣' }}
        </div>
        <h2 class="modal-title">{{ isWin ? '恭喜获胜！' : '游戏结束！' }}</h2>
        <p class="modal-message">
          {{ isWin
            ? `你成功翻出了所有钻石，最终得分：${score}`
            : `很遗憾，你翻到了炸弹，最终得分：${score}`
          }}
        </p>
        <p class="modal-stats">
          网格: {{ gridRows }}×{{ gridCols }} | 炸弹数: {{ bombCount }}
        </p>
        <div class="modal-buttons">
          <button @click="restartGame" class="btn btn-primary">↻ 再来一局</button>
          <button @click="closeModal" class="btn btn-gray">✓ 完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

// 游戏状态
const isPlaying = ref(false);
const gridRows = ref(5);
const gridCols = ref(5);
const bombCount = ref(5);
const score = ref(0);
const highScore = ref(0);
const cards = ref([]);
const revealedCards = ref(new Set());
const bombs = ref([]);
const showModal = ref(false);
const isWin = ref(false);
const gameBoardRef = ref(null);

// 计算属性
const totalCards = computed(() => gridRows.value * gridCols.value);
const isMobile = computed(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

// 音效管理器（Web Audio API）
const SoundManager = {
  audioContext: null,
  get volume() {
    return isMobile.value ? 0.08 : 0.1;
  },

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playTone(frequencies, duration = 0.3, type = 'sine', volumeMultiplier = 1) {
    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;

    // 设置频率变化
    if (Array.isArray(frequencies)) {
      frequencies.forEach((freq, index) => {
        const time = this.audioContext.currentTime + (index * 0.1);
        oscillator.frequency.setValueAtTime(freq, time);
      });
    } else {
      oscillator.frequency.setValueAtTime(frequencies, this.audioContext.currentTime);
    }

    // 设置音量
    gainNode.gain.setValueAtTime(this.volume * volumeMultiplier, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  },

  playFlipSound() {
    this.playTone([392, 440], 0.3);
  },

  playDiamondSound() {
    this.playTone([523.25, 659.25, 783.99], 0.4, 'triangle');
  },

  playBombSound() {
    // 主音
    this.playTone([100, 50], 0.8, 'sawtooth', 2);
    // 辅助音
    setTimeout(() => {
      this.playTone([800, 200], 0.5, 'sawtooth', 1.5);
    }, 0);
  },

  playWinSound() {
    const notes = [659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, index === 4 ? 0.3 : 0.15);
      }, index * 150);
    });
  },

  playRestartSound() {
    this.playTone([440, 392], 0.2, 'sine', 0.8);
  }
};

// 生成炸弹位置
const generateBombPositions = (count) => {
  const positions = new Set();
  while (positions.size < count) {
    positions.add(Math.floor(Math.random() * totalCards.value));
  }
  return Array.from(positions);
};

// 创建游戏卡牌
const createGameCards = () => {
  cards.value = [];
  for (let i = 0; i < totalCards.value; i++) {
    const isBomb = bombs.value.includes(i);
    cards.value.push({
      isBomb,
      revealed: false
    });
  }
};

// 翻牌逻辑
const flipCard = (index) => {
  if (!isPlaying.value || revealedCards.value.has(index)) return;

  // 播放翻牌音效
  SoundManager.playFlipSound();

  // 更新卡牌状态
  cards.value[index].revealed = true;
  revealedCards.value.add(index);

  // 翻到炸弹
  if (bombs.value.includes(index)) {
    setTimeout(() => SoundManager.playBombSound(), 300);
    isPlaying.value = false;
    revealAllBombs();
    updateHighScore();
    isWin.value = false;
    setTimeout(() => showModal.value = true, 800);
    return;
  }

  // 翻到钻石
  setTimeout(() => SoundManager.playDiamondSound(), 300);
  score.value += 10;

  // 检查胜利条件
  const totalSafeCards = totalCards.value - bombCount.value;
  if (revealedCards.value.size === totalSafeCards) {
    isPlaying.value = false;
    SoundManager.playWinSound();
    updateHighScore();
    isWin.value = true;
    setTimeout(() => showModal.value = true, 500);
  }
};

// 显示所有炸弹
const revealAllBombs = () => {
  bombs.value.forEach(index => {
    if (cards.value[index]) {
      cards.value[index].revealed = true;
    }
  });
};

// 更新最高分
const updateHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('flipGameHighScore', highScore.value);
  }
};

// 打开弹窗
const openModal = () => {
  showModal.value = true;
  if (isMobile.value) {
    window.scrollTo(0, 0);
  }
};

// 关闭弹窗
const closeModal = () => {
  showModal.value = false;
};

// 开始游戏
const startGame = () => {
  // if (isPlaying.value) return;

  // 初始化音效
  SoundManager.init();

  // 重置游戏状态
  resetState(true)

  // 生成炸弹位置
  bombs.value = generateBombPositions(Math.min(bombCount.value, totalCards.value - 1));

  // 创建卡牌
  createGameCards();

  // 滚动到游戏区域
  if (gameBoardRef.value) {
    gameBoardRef.value.scrollIntoView({
      behavior: 'smooth',
      block: isMobile.value ? 'center' : 'start'
    });
  }

  // 移动端失焦输入框
  if (isMobile.value) {
    document.activeElement?.blur();
  }
};

// 重新开始游戏
const restartGame = () => {
  closeModal();
  SoundManager.playRestartSound();
  startGame();
};

// 重置游戏状态
const resetState = (is) => {
  isPlaying.value = is;
  score.value = 0;
  revealedCards.value.clear();
};

// 重置设置
const resetSettings = () => {
  // createGameCards();
  gridRows.value = 5;
  gridCols.value = 5;
  bombCount.value = 5;
  cards.value = [];
  resetState(false);
};

// 调整行数/列数/炸弹数
const decreaseRows = () => {
  if (gridRows.value > 3) gridRows.value--;
  createGameCards();
};
const increaseRows = () => {
  if (gridRows.value < 8) gridRows.value++;
  createGameCards();
};
const decreaseCols = () => {
  if (gridCols.value > 3) gridCols.value--;
  createGameCards();
};
const increaseCols = () => {
  if (gridCols.value < 8) gridCols.value++;
  createGameCards();
};
const decreaseBombs = () => {
  if (bombCount.value > 1) bombCount.value--;
  createGameCards();
};
const increaseBombs = () => {
  const maxBombs = totalCards.value - 1;
  if (bombCount.value < maxBombs) bombCount.value++;
  createGameCards();
};

// 监听炸弹数最大值
watch([gridRows, gridCols], () => {
  const maxBombs = totalCards.value - 1;
  if (bombCount.value > maxBombs) {
    bombCount.value = maxBombs;
  }
});

// 窗口大小调整处理
const handleResize = () => {
  if (isPlaying.value) {
    createGameCards();
  }
};

// 初始化
onMounted(() => {
  // 加载最高分
  highScore.value = parseInt(localStorage.getItem('flipGameHighScore')) || 0;

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);

  // 移动端优化
  if (isMobile.value) {
    document.body.style.touchAction = 'manipulation';
  }
});

// 清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* 基础样式重置 - 基于rem单位（1rem = 100px） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  min-height: 100vh;
  color: #1f2937;
  padding: 0.16rem; /* 16px */
  padding-bottom: 0.8rem; /* 80px */
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
}

/* 通用样式 - 全部转为rem单位 */
.container {
  width: 100%;
}

.text-center {
  text-align: center;
}

.mb-6 {
  margin-bottom: 0.24rem; /* 24px */
}

.rounded-xl {
  border-radius: 0.16rem; /* 16px */
}

.shadow {
  box-shadow: 0 0.1rem 0.25rem -0.05rem rgba(99, 102, 241, 0.2); /* 10px 25px -5px */
}

.bg-white {
  background-color: #ffffff;
}

.p-4 {
  padding: 0.16rem; /* 16px */
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.grid {
  display: grid;
}

.gap-4 {
  gap: 0.16rem; /* 16px */
}

.gap-2 {
  gap: 0.08rem; /* 8px */
}

.control-colspan-4 {
  grid-column: span 2; /* 适配393px宽度，固定2列布局 */
}

/* 自定义样式 */
.game-title {
  font-size: 0.22rem; /* 22px - 适配393px宽度 */
  font-weight: bold;
  color: #6366f1;
  margin-bottom: 0.08rem; /* 8px */
}

.game-subtitle {
  color: #6b7280;
  font-size: 0.14rem; /* 14px */
}

.control-label {
  font-size: 0.12rem; /* 12px */
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.04rem; /* 4px */
}

.btn {
  padding: 0.1rem 0.12rem; /* 10px 12px */
  border-radius: 0.08rem; /* 8px */
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  font-size: 0.12rem; /* 12px */
}

.btn-primary {
  background-color: #6366f1;
  color: white;
}

.btn-secondary {
  background-color: #f59e0b;
  color: white;
}

.btn-gray {
  background-color: #e5e7eb;
  color: #4b5563;
}

.btn:hover {
  transform: translateY(-0.02rem); /* -2px */
  box-shadow: 0 0.1rem 0.15rem -0.03rem rgba(99, 102, 241, 0.3); /* 10px 15px -3px */
}

.btn:active {
  transform: scale(0.95);
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

.input-number {
  width: 100%;
  text-align: center;
  border-top: 0.01rem solid rgba(99, 102, 241, 0.2); /* 1px */
  border-bottom: 0.01rem solid rgba(99, 102, 241, 0.2); /* 1px */
  border-left: none;
  border-right: none;
  padding: 0.08rem 0; /* 8px */
  font-size: 0.16rem; /* 16px */
  outline: none;
  background: transparent;
}

.input-number:disabled {
  opacity: 0.7;
}

.score-display {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 0.08rem; /* 8px */
  padding: 0.08rem 0.12rem; /* 8px 12px */
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 0.2rem; /* 20px */
  font-weight: bold;
  margin: 0 0.08rem; /* 8px */
}

.score-high {
  font-size: 0.12rem; /* 12px */
  color: rgba(16, 185, 129, 0.7);
}

/* 卡牌样式 - 适配393px宽度 */
.game-board {
  background-color: white;
  border-radius: 0.16rem; /* 16px */
  padding: 0.08rem; /* 8px */
  box-shadow: 0 0.1rem 0.25rem -0.05rem rgba(99, 102, 241, 0.2); /* 10px 25px -5px */
  width: 100%;
  aspect-ratio: 1/1;
}

.card-flip {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  touch-action: manipulation;
  cursor: pointer;
  position: relative;
  height: 100%;
}

.card-flipped {
  transform: rotateY(180deg);
}

.card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0.08rem; /* 8px */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.2rem; /* 20px - 适配393px宽度 */
}

.card-front {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.card-back-bomb {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  transform: rotateY(180deg);
}

.card-back-diamond {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  transform: rotateY(180deg);
}

/* 弹窗样式 - 适配393px宽度 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.16rem; /* 16px */
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 0.16rem; /* 16px */
  padding: 0.24rem; /* 24px */
  width: 90%; /* 适配393px宽度 */
  max-width: 3.5rem; /* 350px */
  transform: scale(0.95);
  opacity: 0;
  transition: all 0.3s ease;
}

.modal-content.show {
  transform: scale(1);
  opacity: 1;
}

.modal-icon {
  width: 0.64rem; /* 64px */
  height: 0.64rem; /* 64px */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.16rem; /* 16px */
  font-size: 0.24rem; /* 24px */
}

.modal-title {
  font-size: 0.18rem; /* 18px */
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.08rem; /* 8px */
}

.modal-message {
  color: #6b7280;
  text-align: center;
  margin-bottom: 0.08rem; /* 8px */
  font-size: 0.14rem; /* 14px */
}

.modal-stats {
  color: #9ca3af;
  font-size: 0.12rem; /* 12px */
  text-align: center;
  margin-bottom: 0.24rem; /* 24px */
}

.modal-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.12rem; /* 12px */
}

/* 初始提示 - 适配393px宽度 */
.initial-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  text-align: center;
  padding: 0.16rem; /* 16px */
  grid-column: 1 / -1;
  font-size: 0.14rem; /* 14px */
}

.initial-hint span {
  font-size: 0.3rem; /* 30px */
  margin-bottom: 0.16rem; /* 16px */
}

/* 控制面板布局 - 固定2列适配393px宽度 */
.control-panel {
  grid-template-columns: repeat(2, 1fr);
}

.game-controls {
  grid-template-columns: repeat(3, 1fr);
}

/* 393px宽度下的特殊优化 */
@media (width: 393px) {
  .game-board {
    max-height: 3.5rem; /* 350px - 适配393px屏幕高度 */
  }

  .btn {
    padding: 0.09rem 0.11rem; /* 微调按钮内边距 */
  }

  .modal-content {
    width: 95%; /* 最大化利用宽度 */
  }
}

/* 防止宽度溢出 */
* {
  max-width: 100%;
  overflow-wrap: break-word;
}
</style>
