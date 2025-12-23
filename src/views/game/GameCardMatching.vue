<template>
  <div class="game-wrapper">
    <!-- 配置面板 -->
    <div
        class="config-panel"
        :class="{ hidden: !isConfigMode, configured: gameConfig.isConfigured }"
    >
      <h3 class="config-title">游戏配置</h3>
      <div
          class="config-subtitle"
          :class="{ show: gameConfig.isConfigured }"
      >
        配置已生效，可点击开始游戏
      </div>
      <div class="grid-config">
        <div class="config-item">
          <label for="grid-cols">列数</label>
          <input
              type="number"
              id="grid-cols"
              class="config-input"
              min="3"
              max="15"
              v-model.number="gameConfig.gridCols"
          >
        </div>
        <div class="config-item">
          <label for="grid-rows">行数</label>
          <input
              type="number"
              id="grid-rows"
              class="config-input"
              min="3"
              max="15"
              v-model.number="gameConfig.gridRows"
          >
        </div>
        <div class="config-item">
          <label for="preview-time">预览时长(秒)</label>
          <input
              type="number"
              id="preview-time"
              class="config-input"
              min="1"
              max="20"
              v-model.number="gameConfig.previewTime"
          >
        </div>
        <button class="apply-btn" @click="applyConfig">应用配置</button>
      </div>
      <div class="sound-toggle">
        <span id="sound-status">{{ gameConfig.soundEnabled ? '音效：开启' : '音效：关闭' }}</span>
        <div
            class="sound-switch"
            :class="{ active: gameConfig.soundEnabled }"
            @click="toggleSound"
        ></div>
      </div>
      <div class="preview-config">
        <span id="preview-status">{{ gameConfig.previewEnabled ? '预览：开启' : '预览：关闭' }}</span>
        <div
            class="preview-switch"
            :class="{ active: gameConfig.previewEnabled }"
            @click="togglePreview"
        ></div>
      </div>
    </div>

    <!-- 预览倒计时提示 -->
    <div
        class="preview-tip"
        :class="{ show: isPreviewTipShow }"
    >{{ previewCountdown }}</div>

    <!-- 暂停遮罩 -->
    <div
        class="pause-overlay"
        :class="{ show: gameState.isPaused }"
        @click="resumeGame"
    >
      <div class="pause-text">
        游戏暂停<br>
        <small class="pause-subtext">点击任意位置继续</small>
      </div>
    </div>

    <!-- 游戏容器 -->
    <div
        class="game-container"
        :class="{ visible: !isConfigMode, ready: gameConfig.isConfigured }"
    >
      <div class="game-header">
        <h1 class="game-title">趣味翻牌配对</h1>
        <div class="score-board">
          <div>得分: {{ gameState.score }}</div>
          <div>已匹配: {{ gameState.matchedPairs }}/{{ gameState.totalPairs }}</div>
          <div>提示次数: <span class="hint-count">{{ gameState.remainingHints }}</span></div>
          <div>用时: <span class="timer-display">{{ formattedTime }}</span></div>
        </div>
        <!-- 按钮组 -->
        <div class="btn-group">
          <button
              class="game-btn start-btn"
              :class="{ ready: gameConfig.isConfigured && !gameState.isGameStarted }"
              @click="startGame"
              :disabled="!gameConfig.isConfigured || gameState.isGameStarted"
          >
            开始游戏
          </button>
          <button
              class="game-btn pause-btn"
              :class="{ ready: gameState.isGameStarted }"
              @click="togglePause"
              :disabled="!gameState.isGameStarted"
          >
            {{ gameState.isPaused ? '继续游戏' : '暂停游戏' }}
          </button>
          <button
              class="game-btn hint-btn"
              :class="{ ready: gameState.isGameStarted && !gameState.isPaused && gameState.remainingHints > 0 }"
              @click="getHint"
              :disabled="!gameState.isGameStarted || gameState.isPaused || gameState.remainingHints <= 0"
          >
            获取提示
          </button>
          <button
              class="game-btn restart-btn"
              :class="{ ready: true }"
              @click="enterConfigMode"
          >
            重新配置
          </button>
        </div>
      </div>
      <div
          class="card-grid"
          :class="{ ready: gameConfig.isConfigured }"
          :style="{ gridTemplateColumns: `repeat(${gameConfig.gridCols}, 1fr)` }"
      >
        <div
            v-for="(card, index) in gameState.cards"
            :key="card.id"
            class="card"
            :class="{
            ready: gameConfig.isConfigured,
            flipped: card.flipped,
            matched: card.matched,
            hint: card.isHint,
            'card-preview': !gameState.isGameStarted || gameState.isPaused
          }"
            :data-index="index"
            @click="flipCard(index)"
            @touchstart.prevent="flipCard(index)"
        >
          <div class="card-face card-front">?</div>
          <div class="card-face card-back">{{ card.emoji }}</div>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div
        class="game-over"
        :class="{ show: isGameOver }"
    >
      <h2 class="congrats">恭喜你!</h2>
      <p class="final-score">最终得分: {{ gameState.score }}</p>
      <p class="final-time">总用时: <span class="time-display">{{ formattedTime }}</span></p>
      <button class="game-btn restart-btn" @click="playAgain">再玩一次</button>
      <button class="game-btn start-btn reconfig-btn" @click="reconfigGame">重新配置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

// 游戏核心配置
const gameConfig = reactive({
  emojis: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🍑', '🥭', '🥑', '🥝', '🍍', '🥥', '🍅', '🥕', '🥒'],
  baseScore: 10,
  bonusMultiplier: 1.5,
  gridCols: 4,
  gridRows: 4,
  soundEnabled: true,
  previewEnabled: true,
  previewTime: 5,
  maxHints: 3,
  isConfigured: false,
  soundConfigs: {
    flip: { frequency: 440, type: 'sine', duration: 150, volume: 0.5 },
    flipBack: { frequency: 330, type: 'sine', duration: 150, volume: 0.5 },
    match: { frequency: 523, type: 'triangle', duration: 200, volume: 0.6 },
    mismatch: { frequency: 220, type: 'sawtooth', duration: 200, volume: 0.5 },
    win: { frequency: [659, 784, 880], type: 'sine', duration: [200, 200, 300], volume: 0.6 },
    hint: { frequency: 494, type: 'square', duration: 250, volume: 0.5 }
  }
});

// 游戏状态
const gameState = reactive({
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  score: 0,
  canFlip: true,
  totalPairs: 0,
  elapsedTime: 0,
  isPaused: false,
  isGameStarted: false,
  remainingHints: gameConfig.maxHints
});

// 响应式状态
const isConfigMode = ref(true);
const isPreviewTipShow = ref(false);
const previewCountdown = ref(0);
const isGameOver = ref(false);
const previewTimer = ref(null);
const countdownTimer = ref(null);
const gameTimer = ref(null);

// 格式化时间 (适配100px基准字号的显示)
const formattedTime = computed(() => {
  const totalSeconds = Math.floor(gameState.elapsedTime / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
});

// 初始化音频上下文
let audioContext = null;
const initAudioContext = () => {
  if (!audioContext && window.AudioContext) {
    audioContext = new AudioContext();
  }
};

// 播放合成音效
const playSynthesizedSound = (soundType) => {
  if (!gameConfig.soundEnabled) return;
  initAudioContext();
  if (!audioContext) return;

  const config = gameConfig.soundConfigs[soundType];
  if (!config) return;

  const frequencies = Array.isArray(config.frequency) ? config.frequency : [config.frequency];
  const durations = Array.isArray(config.duration) ? config.duration : [config.duration];
  const volumes = Array.isArray(config.volume) ? config.volume : [config.volume];

  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = config.type;
      oscillator.frequency.value = freq;
      gainNode.gain.value = volumes[index] || volumes[0];

      gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + (durations[index] || durations[0]) / 1000
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + (durations[index] || durations[0]) / 1000);
    }, index * (durations[index - 1] || 0));
  });
};

// 清除预览计时器
const clearPreviewTimers = () => {
  if (previewTimer.value) {
    clearTimeout(previewTimer.value);
    previewTimer.value = null;
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  isPreviewTipShow.value = false;
  gameState.cards.forEach(card => {
    card.flipped = false;
    card.isHint = false;
  });
};

// 开始游戏计时
const startGameTimer = () => {
  if (gameState.isPaused) return;

  const startTime = Date.now() - gameState.elapsedTime;
  if (gameTimer.value) clearInterval(gameTimer.value);

  gameTimer.value = setInterval(() => {
    gameState.elapsedTime = Date.now() - startTime;
  }, 1000);
};

// 停止游戏计时
const stopGameTimer = () => {
  if (gameTimer.value) {
    clearInterval(gameTimer.value);
    gameTimer.value = null;
  }
};

// 重置游戏计时
const resetGameTimer = () => {
  stopGameTimer();
  gameState.elapsedTime = 0;
};

// 暂停游戏
const pauseGame = () => {
  if (!gameState.isGameStarted || gameState.isPaused) return;

  gameState.isPaused = true;
  gameState.canFlip = false;
  stopGameTimer();
  playSynthesizedSound('flipBack');
};

// 继续游戏
const resumeGame = () => {
  if (!gameState.isGameStarted || !gameState.isPaused) return;

  gameState.isPaused = false;
  gameState.canFlip = true;
  startGameTimer();
  playSynthesizedSound('flip');
};

// 切换暂停/继续
const togglePause = () => {
  gameState.isPaused ? resumeGame() : pauseGame();
};

// 获取提示
const getHint = () => {
  if (!gameState.isGameStarted || gameState.isPaused || gameState.remainingHints <= 0) return;

  playSynthesizedSound('hint');
  gameState.remainingHints--;

  const unmatchedCards = gameState.cards.filter(card => !card.matched);
  if (unmatchedCards.length < 2) return;

  const randomIndex = Math.floor(Math.random() * unmatchedCards.length);
  const targetCard = unmatchedCards[randomIndex];
  const matchingCard = unmatchedCards.find(card =>
      card.emoji === targetCard.emoji && card.id !== targetCard.id
  );

  if (!matchingCard) return;

  // 标记提示状态
  targetCard.isHint = true;
  matchingCard.isHint = true;

  // 3秒后移除提示
  setTimeout(() => {
    targetCard.isHint = false;
    matchingCard.isHint = false;
  }, 3000);
};

// 显示卡牌预览
const showCardPreview = () => {
  if (!gameConfig.previewEnabled) {
    gameState.isGameStarted = true;
    gameState.canFlip = true;
    startGameTimer();
    playSynthesizedSound('flip');
    return;
  }

  gameState.canFlip = false;
  gameState.cards.forEach(card => card.flipped = true);

  isPreviewTipShow.value = true;
  previewCountdown.value = gameConfig.previewTime;

  countdownTimer.value = setInterval(() => {
    previewCountdown.value--;
    if (previewCountdown.value <= 0) {
      clearInterval(countdownTimer.value);
      countdownTimer.value = null;
      isPreviewTipShow.value = false;
    }
  }, 1000);

  previewTimer.value = setTimeout(() => {
    gameState.cards.forEach(card => card.flipped = false);
    gameState.canFlip = true;
    gameState.isGameStarted = true;
    startGameTimer();
    playSynthesizedSound('flip');
  }, gameConfig.previewTime * 1000);
};

// 创建卡牌配对
const createCardPairs = () => {
  gameState.cards = [];
  const totalPairs = gameState.totalPairs;

  let selectedEmojis = [];
  const emojiCount = gameConfig.emojis.length;

  for (let i = 0; i < totalPairs; i++) {
    selectedEmojis.push(gameConfig.emojis[i % emojiCount]);
  }

  selectedEmojis = selectedEmojis.sort(() => Math.random() - 0.5);

  selectedEmojis.forEach(emoji => {
    gameState.cards.push({
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      flipped: false,
      matched: false,
      isHint: false
    });
    gameState.cards.push({
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      flipped: false,
      matched: false,
      isHint: false
    });
  });

  // 洗牌
  for (let i = gameState.cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.cards[i], gameState.cards[j]] = [gameState.cards[j], gameState.cards[i]];
  }
};

// 初始化游戏
const initGame = (skipPreview = false) => {
  clearPreviewTimers();
  resetGameTimer();
  isGameOver.value = false;

  const totalCards = gameConfig.gridCols * gameConfig.gridRows;

  // 验证行列数
  if (gameConfig.gridCols < 3 || gameConfig.gridRows < 3) {
    alert('行列数最小值为3，请调整！');
    gameConfig.gridCols = Math.max(3, gameConfig.gridCols);
    gameConfig.gridRows = Math.max(3, gameConfig.gridRows);
    initGame(skipPreview);
    return;
  }

  if (totalCards % 2 !== 0) {
    alert('网格总数必须为偶数，请调整行列数！');
    if (gameConfig.gridCols % 2 !== 0) {
      gameConfig.gridCols = gameConfig.gridCols + 1 > 15 ? gameConfig.gridCols - 1 : gameConfig.gridCols + 1;
      gameConfig.gridCols = Math.max(3, gameConfig.gridCols);
    }
    if (gameConfig.gridRows % 2 !== 0) {
      gameConfig.gridRows = gameConfig.gridRows + 1 > 15 ? gameConfig.gridRows - 1 : gameConfig.gridRows + 1;
      gameConfig.gridRows = Math.max(3, gameConfig.gridRows);
    }
    initGame(skipPreview);
    return;
  }

  // 重置游戏状态
  gameState.matchedPairs = 0;
  gameState.score = 0;
  gameState.canFlip = false;
  gameState.totalPairs = totalCards / 2;
  gameState.remainingHints = gameConfig.maxHints;
  gameState.isGameStarted = false;
  gameState.isPaused = false;

  // 创建卡牌
  createCardPairs();
};

// 翻牌逻辑
const flipCard = (index) => {
  const card = gameState.cards[index];

  if (!gameState.canFlip || card.flipped || card.matched ||
      gameState.flippedCards.length >= 2 || gameState.isPaused || !gameState.isGameStarted) {
    return;
  }

  playSynthesizedSound('flip');
  card.flipped = true;
  gameState.flippedCards.push({ index, card });

  if (gameState.flippedCards.length === 2) {
    checkMatch();
  }
};

// 检查配对
const checkMatch = () => {
  gameState.canFlip = false;
  const [card1, card2] = gameState.flippedCards;

  if (card1.card.emoji === card2.card.emoji) {
    playSynthesizedSound('match');
    handleMatch(card1.index, card2.index);
  } else {
    playSynthesizedSound('mismatch');
    handleMismatch(card1.index, card2.index);
  }
};

// 处理配对成功
const handleMatch = (index1, index2) => {
  gameState.cards[index1].matched = true;
  gameState.cards[index2].matched = true;
  gameState.cards[index1].isHint = false;
  gameState.cards[index2].isHint = false;

  const difficultyMultiplier = 1 + (gameConfig.gridCols * gameConfig.gridRows) / 100;
  gameState.score += Math.floor(gameConfig.baseScore * gameConfig.bonusMultiplier * difficultyMultiplier);
  gameState.matchedPairs += 1;

  gameState.flippedCards = [];
  gameState.canFlip = true;

  if (gameState.matchedPairs === gameState.totalPairs) {
    endGame();
  }
};

// 处理配对失败
const handleMismatch = (index1, index2) => {
  setTimeout(() => {
    playSynthesizedSound('flipBack');
    gameState.cards[index1].flipped = false;
    gameState.cards[index2].flipped = false;
    gameState.cards[index1].isHint = false;
    gameState.cards[index2].isHint = false;

    if (gameState.score > 0) {
      gameState.score = Math.max(0, gameState.score - 2);
    }

    gameState.flippedCards = [];
    gameState.canFlip = true;
  }, 1000);
};

// 游戏结束
const endGame = () => {
  stopGameTimer();
  setTimeout(() => {
    playSynthesizedSound('win');
    gameState.isGameStarted = false;
    gameState.canFlip = false;
    isGameOver.value = true;
  }, 500);
};

// 应用配置
const applyConfig = () => {
  gameConfig.gridCols = Math.max(3, Math.min(15, gameConfig.gridCols));
  gameConfig.gridRows = Math.max(3, Math.min(15, gameConfig.gridRows));
  gameConfig.previewTime = Math.max(1, Math.min(20, gameConfig.previewTime));
  gameConfig.isConfigured = true;

  initGame(true);
  isConfigMode.value = false;

  playSynthesizedSound('flip');
  alert(`配置已生效！当前游戏布局：${gameConfig.gridCols}×${gameConfig.gridRows}，预览时长：${gameConfig.previewTime}秒`);
};

// 切换音效
const toggleSound = () => {
  gameConfig.soundEnabled = !gameConfig.soundEnabled;
};

// 切换预览
const togglePreview = () => {
  gameConfig.previewEnabled = !gameConfig.previewEnabled;
};

// 进入配置模式
const enterConfigMode = () => {
  gameConfig.isConfigured = false;
  isConfigMode.value = true;
  stopGameTimer();
  clearPreviewTimers();
  gameState.isGameStarted = false;
  gameState.isPaused = false;
  isGameOver.value = false;
};

// 开始游戏
const startGame = () => {
  if (!gameConfig.isConfigured) {
    alert('请先点击"应用配置"完成游戏配置！');
    return;
  }
  setTimeout(showCardPreview, 500);
};

// 再玩一次
const playAgain = () => {
  isGameOver.value = false;
  initGame(true);
};

// 重新配置
const reconfigGame = () => {
  isGameOver.value = false;
  enterConfigMode();
};

// 初始化
onMounted(() => {
  // 设置100px基准字号
  document.documentElement.style.fontSize = '100px';
  // 初始化音频上下文
  initAudioContext();
  // 初始化游戏
  initGame(true);
  // 防止双击缩放
  document.addEventListener('dblclick', (e) => e.preventDefault());
  // 优化触控体验
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
});

// 清理计时器和样式
onUnmounted(() => {
  clearPreviewTimers();
  stopGameTimer();
  // 恢复默认字号（可选）
  // document.documentElement.style.fontSize = '';
});

// 监听窗口大小变化（针对393px做特殊处理）
onMounted(() => {
  const handleResize = () => {
    // const width = window.innerWidth;
    // // 强制适配393px宽度
    // if (width !== 393) {
    //   // 可选择缩放页面或调整布局
    //   const scale = width / 393;
    //   document.querySelector('.game-wrapper').style.transform = `scale(${scale})`;
    //   document.querySelector('.game-wrapper').style.transformOrigin = 'top left';
    // }
  };

  handleResize(); // 初始执行
  window.addEventListener('resize', handleResize);

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
});
</script>

<style scoped lang="less">
/* 基于100px基准字号，使用rem单位适配 */
//* {
//  margin: 0;
//  padding: 0;
//  box-sizing: border-box;
//  font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
//  -webkit-tap-highlight-color: transparent;
//}

/* 根容器 - 适配393px宽度 */
.game-wrapper {
  height: 100%;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.15rem; /* 15px */
  color: white;
  touch-action: manipulation;
  overflow-x: hidden;
}

/* 配置面板样式 */
.config-panel {
  transform: translateY(0.3rem);
  width: 100%;
  max-width: 3.93rem; /* 393px */
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.12rem; /* 12px */
  padding: 0.2rem; /* 20px */
  margin-bottom: 0.15rem; /* 15px */
  box-shadow: 0 0.08rem 0.32rem rgba(0, 0, 0, 0.2); /* 8px 32px */
  backdrop-filter: blur(0.1rem); /* 10px */
  border: 0.01rem solid rgba(255, 255, 255, 0.2); /* 1px */
  transition: all 0.3s ease;
  display: block;
}

.config-panel.hidden {
  display: none;
}

.config-panel.configured {
  border-color: #4ecdc4;
  box-shadow: 0 0 0.2rem rgba(78, 205, 196, 0.3); /* 20px */
}

.config-title {
  font-size: 0.12rem; /* 12px */
  margin-bottom: 0.15rem; /* 15px */
  text-align: center;
  line-height: 1.4;
}

.config-subtitle {
  font-size: 0.08rem; /* 8px */
  color: #ffd166;
  text-align: center;
  margin-bottom: 0.1rem; /* 10px */
  display: none;
  line-height: 1.4;
}

.config-subtitle.show {
  display: block;
}

.grid-config {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem; /* 10px */
  justify-content: center;
  align-items: center;
}

.config-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem; /* 5px */
}

.config-item label {
  font-size: 0.09rem; /* 9px */
  line-height: 1.4;
}

.config-input {
  width: 0.8rem; /* 80px */
  padding: 0.08rem 0.1rem; /* 8px 10px */
  border: none;
  border-radius: 0.06rem; /* 6px */
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-align: center;
  font-size: 0.1rem; /* 10px */
  outline: none;
}

.config-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.apply-btn {
  background: #4ecdc4;
  color: white;
  border: none;
  padding: 0.08rem 0.2rem; /* 8px 20px */
  border-radius: 0.06rem; /* 6px */
  font-size: 0.09rem; /* 9px */
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.05rem; /* 5px */
  line-height: 1.4;
}

.apply-btn:hover {
  background: #3dbbba;
}

.sound-toggle, .preview-config {
  display: flex;
  align-items: center;
  gap: 0.08rem; /* 8px */
  margin-top: 0.1rem; /* 10px */
  justify-content: center;
}

.sound-toggle span, .preview-config span {
  font-size: 0.09rem; /* 9px */
  line-height: 1.4;
}

.sound-switch, .preview-switch {
  position: relative;
  width: 0.5rem; /* 50px */
  height: 0.26rem; /* 26px */
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.13rem; /* 13px */
  cursor: pointer;
  transition: background 0.3s ease;
}

.sound-switch.active, .preview-switch.active {
  background: #4ecdc4;
}

.sound-switch::after, .preview-switch::after {
  content: '';
  position: absolute;
  width: 0.22rem; /* 22px */
  height: 0.22rem; /* 22px */
  border-radius: 50%;
  background: white;
  top: 0.02rem; /* 2px */
  left: 0.02rem; /* 2px */
  transition: left 0.3s ease;
}

.sound-switch.active::after, .preview-switch.active::after {
  left: 0.26rem; /* 26px */
}

/* 预览倒计时提示 */
.preview-tip {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.2rem 0.4rem; /* 20px 40px */
  border-radius: 0.1rem; /* 10px */
  font-size: 0.2rem; /* 20px */
  z-index: 200;
  opacity: 0;
  transition: opacity 0.3s ease;
  width: 1.5rem; /* 适配393px宽度 */
  text-align: center;
}

.preview-tip.show {
  opacity: 1;
}

/* 游戏容器样式 */
.game-container {
  transform: translateY(0.3rem);
  width: 100%;
  max-width: 3.93rem; /* 393px */
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.15rem; /* 15px */
  padding: 0.2rem; /* 20px */
  box-shadow: 0 0.08rem 0.32rem rgba(0, 0, 0, 0.2); /* 8px 32px */
  backdrop-filter: blur(0.1rem); /* 10px */
  border: 0.01rem solid rgba(255, 255, 255, 0.2); /* 1px */
  opacity: 0.8;
  pointer-events: none;
  transition: all 0.3s ease;
  display: none;
}

.game-container.visible {
  display: block;
}

.game-container.ready {
  opacity: 1;
  pointer-events: all;
  border-color: #4ecdc4;
  box-shadow: 0 0 0.2rem rgba(78, 205, 196, 0.2); /* 20px */
}

.game-header {
  text-align: center;
  margin-bottom: 0.2rem; /* 20px */
}

.game-title {
  font-size: 0.18rem; /* 18px */
  margin-bottom: 0.1rem; /* 10px */
  text-shadow: 0 0.02rem 0.04rem rgba(0, 0, 0, 0.3); /* 2px 4px */
  line-height: 1.4;
}

.score-board {
  display: flex;
  justify-content: space-between;
  font-size: 0.1rem; /* 10px */
  margin-bottom: 0.1rem; /* 10px */
  padding: 0.08rem 0.15rem; /* 8px 15px */
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.08rem; /* 8px */
  flex-wrap: wrap;
  gap: 0.08rem; /* 8px */
  line-height: 1.4;
}

.timer-display {
  font-weight: bold;
  color: #ffd166;
}

.hint-count {
  color: #4ecdc4;
  font-weight: bold;
}

/* 按钮组样式 */
.btn-group {
  display: flex;
  gap: 0.1rem; /* 10px */
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 0.1rem; /* 10px */
  position: relative;
  z-index: 200;
}

.game-btn {
  border: none;
  padding: 0.08rem 0.18rem; /* 8px 18px */
  border-radius: 0.06rem; /* 6px */
  font-size: 0.09rem; /* 9px */
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  position: relative;
  z-index: 200;
  opacity: 0.6;
  pointer-events: none;
  line-height: 1.4;
}

.game-btn.ready {
  opacity: 1;
  pointer-events: all;
}

.start-btn {
  background: #4ecdc4;
}

.start-btn:hover {
  background: #3dbbba;
  transform: translateY(-0.02rem); /* -2px */
  box-shadow: 0 0.04rem 0.08rem rgba(0, 0, 0, 0.2); /* 4px 8px */
}

.pause-btn {
  background: #ff9f43;
}

.pause-btn:hover {
  background: #ff8c1a;
  transform: translateY(-0.02rem); /* -2px */
  box-shadow: 0 0.04rem 0.08rem rgba(0, 0, 0, 0.2); /* 4px 8px */
}

.hint-btn {
  background: #0abde3;
}

.hint-btn:hover {
  background: #09a2c2;
  transform: translateY(-0.02rem); /* -2px */
  box-shadow: 0 0.04rem 0.08rem rgba(0, 0, 0, 0.2); /* 4px 8px */
}

.restart-btn {
  background: #ff6b6b;
}

.restart-btn:hover {
  background: #ff5252;
  transform: translateY(-0.02rem); /* -2px */
  box-shadow: 0 0.04rem 0.08rem rgba(0, 0, 0, 0.2); /* 4px 8px */
}

/* 暂停遮罩 */
.pause-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
}

.pause-overlay.show {
  display: flex;
}

.pause-text {
  font-size: 0.3rem; /* 30px */
  color: white;
  text-shadow: 0 0 0.2rem rgba(255, 255, 255, 0.5); /* 20px */
  animation: pulse 1.5s ease infinite alternate;
  pointer-events: none;
  line-height: 1.4;
  text-align: center;
}

.pause-subtext {
  font-size: 0.1rem; /* 10px */
  margin-top: 0.05rem; /* 5px */
}

/* 提示高亮样式 */
.card.hint {
  animation: highlight 1s ease infinite alternate;
}

@keyframes highlight {
  0% {
    box-shadow: 0 0 0.1rem rgba(255, 255, 0, 0.5); /* 10px */
    transform: rotateY(0deg) scale(1);
  }
  100% {
    box-shadow: 0 0 0.2rem rgba(255, 255, 0, 0.8); /* 20px */
    transform: rotateY(0deg) scale(1.05);
  }
}

/* 卡牌网格样式 */
.card-grid {
  display: grid;
  gap: 0.08rem; /* 8px */
  perspective: 10rem; /* 1000px */
  width: 100%;
  margin: 0 auto;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.card-grid.ready {
  opacity: 1;
}

.card {
  aspect-ratio: 1/1;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  box-shadow: 0 0.04rem 0.08rem rgba(0, 0, 0, 0.1); /* 4px 8px */
  border-radius: 0.08rem; /* 8px */
  touch-action: manipulation;
  opacity: 0.8;
  pointer-events: none;
  transition: all 0.3s ease;
}

.card.ready {
  opacity: 1;
  pointer-events: auto;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card.matched {
  pointer-events: none;
  animation: pulse 0.5s ease-in-out;
}

.card-preview {
  pointer-events: none;
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 0.08rem; /* 8px */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.1rem, 4vw, 0.2rem); /* 10px - 20px */
}

.card-back {
  background: linear-gradient(45deg, #4ecdc4, #556270);
  transform: rotateY(180deg);
}

.card-front {
  background: white;
  color: #667eea;
}

/* 游戏结束弹窗 */
.game-over {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 150;
  padding: 0.2rem; /* 20px */
}

.game-over.show {
  display: flex;
}

.game-over h2 {
  font-size: 0.2rem; /* 20px */
  margin-bottom: 0.15rem; /* 15px */
  color: #ffd166;
  line-height: 1.4;
}

.game-over p {
  font-size: 0.12rem; /* 12px */
  margin-bottom: 0.15rem; /* 15px */
  line-height: 1.4;
  text-align: center;
}

.final-score {
  margin-top: 0.1rem; /* 10px */
}

.final-time {
  margin-bottom: 0.2rem; /* 20px */
}

.time-display {
  color: #4ecdc4;
  font-weight: bold;
}

.congrats {
  animation: bounce 1s ease infinite alternate;
}

.reconfig-btn {
  margin-top: 0.1rem !important; /* 10px */
}

/* 动画样式 */
@keyframes pulse {
  0% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.05); }
  100% { transform: rotateY(180deg) scale(1); }
}

@keyframes bounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(-0.1rem); /* -10px */ }
}

/* 393px 专属适配 */
@media (width: 393px) {
  .game-wrapper {
    width: 3.93rem;
    padding: 0.1rem; /* 减少内边距适配窄屏 */
  }

  .card-grid {
    gap: 0.05rem; /* 5px */
  }

  .btn-group {
    gap: 0.05rem; /* 5px */
    width: 95%;
  }

  .game-btn {
    padding: 0.08rem 0.15rem; /* 8px 15px */
    font-size: 0.085rem; /* 8.5px */
  }

  .score-board {
    flex-direction: row;
    font-size: 0.09rem; /* 9px */
    padding: 0.05rem 0.1rem; /* 5px 10px */
  }

  .preview-tip {
    width: 1.2rem; /* 120px */
    padding: 0.15rem 0.3rem; /* 15px 30px */
    font-size: 0.18rem; /* 18px */
  }

  .pause-text {
    font-size: 0.25rem; /* 25px */
  }

  .pause-subtext {
    font-size: 0.09rem; /* 9px */
  }
}

/* 通用移动端适配（覆盖393px周边宽度） */
@media (max-width: 400px) {
  .config-panel {
    padding: 0.15rem; /* 15px */
  }

  .game-container {
    padding: 0.15rem; /* 15px */
  }

  .card {
    border-radius: 0.06rem; /* 6px */
  }

  .card-face {
    border-radius: 0.06rem; /* 6px */
  }

  .score-board {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.05rem; /* 5px */
  }

  .score-board > div {
    width: 45%;
    text-align: center;
  }

  .game-title {
    font-size: 0.16rem; /* 16px */
  }

  .congrats {
    font-size: 0.18rem; /* 18px */
  }
}
</style>
