<template>
  <div class="guess-number-game">
    <h2>猜数字小游戏</h2>
    <!-- 新增：显示当前可输入范围 -->
    <p class="tip">
      <!--      系统生成了 {{ minRange }}-{{ maxRange }} 之间的随机数（已排除重复猜测），快来猜猜看！-->
      数字在{{ minRange }}-{{ maxRange }} 之间，快来猜猜看！
    </p>

    <div class="input-group">
      <input
          v-model="inputValue"
          type="number"
          :placeholder="`请输入${minRange}-${maxRange}的数字`"
          @keyup.enter="handleGuess"
          @focus="resetInput"
          :disabled="isWon"
          class="num-input"
      >
      <button @click="handleGuess" :disabled="isWon || !isInputValid" class="guess-btn">
        {{ isWon ? '已猜对' : '提交猜测' }}
      </button>
    </div>

    <!-- 提示信息 -->
    <div class="tip-text" :class="tipType">{{ tipText }}</div>

    <!-- 历史记录区域 -->
    <div class="history-section" v-if="guessHistory.length">
      <h3>猜测历史</h3>
      <ul class="history-list">
        <li
            v-for="(item, index) in guessHistory"
            :key="index"
            :class="`history-item ${item.resultType}`"
        >
          第 {{guessHistory.length- index }} 次：输入 {{ item.number }} → {{ item.result }}
        </li>
      </ul>
    </div>

    <!-- 重置按钮 -->
    <button v-if="isWon" @click="resetGame" class="reset-btn">再来一局</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const target = ref(0) // 目标数字
const inputValue = ref('') // 输入框值
const tipText = ref('请输入数字开始猜测～') // 提示文本
const isWon = ref(false) // 是否猜对
const guessHistory = ref([]) // 猜测历史
// 新增：动态输入范围（初始1-100）
const minRange = ref(1)
const maxRange = ref(100)

// 计算属性：校验输入是否有效
const isInputValid = computed(() => {
  const num = Number(inputValue.value)
  // 1. 是有效数字 2. 在当前范围内 3. 未重复
  return !isNaN(num) &&
      num >= minRange.value &&
      num <= maxRange.value &&
      !guessHistory.value.some(item => item.number === num)
})

// 计算属性：提示文本类型
const tipType = computed(() => {
  if (isWon.value) return 'success'
  if (inputValue.value) {
    const num = Number(inputValue.value)
    // 重复数字提示类型
    if (guessHistory.value.some(item => item.number === num)) return 'error'
    // 超出范围提示类型
    if (num < minRange.value || num > maxRange.value) return 'error'
    // 大小提示类型
    if (tipText.value.includes('大了')) return 'warning'
    if (tipText.value.includes('小了')) return 'info'
  }
  return ''
})

// 生成随机数（在当前范围）
const generateRandomNum = () => {
  target.value = Math.floor(Math.random() * (maxRange.value - minRange.value + 1)) + minRange.value
  console.log('本次目标数字：', target.value) // 调试用
}

// 提交猜测逻辑
const handleGuess = () => {
  const inputNum = Number(inputValue.value)

  // 1. 校验是否重复
  if (guessHistory.value.some(item => item.number === inputNum)) {
    tipText.value = `❌ 数字 ${inputNum} 已猜测过，请换一个！`
    return
  }

  // 2. 校验是否超出范围
  if (inputNum < minRange.value || inputNum > maxRange.value) {
    tipText.value = `❌ 请输入 ${minRange.value}-${maxRange.value} 之间的数字！`
    return
  }

  // 3. 正常判断大小
  let resultText = ''
  let resultType = ''

  if (inputNum > target.value) {
    resultText = `猜大了！当前数字比 ${inputNum} 小`
    resultType = 'warning'
    // 缩小范围：最大值更新为当前数字-1
    maxRange.value = inputNum - 1
  } else if (inputNum < target.value) {
    resultText = `猜小了！当前数字比 ${inputNum} 大`
    resultType = 'info'
    // 缩小范围：最小值更新为当前数字+1
    minRange.value = inputNum + 1
  } else {
    resultText = `🎉 猜对了！答案就是 ${target.value} ～`
    resultType = 'success'
    isWon.value = true
  }

  // 更新提示文本
  tipText.value = resultText

  // 添加到历史记录（最新的在最前面）
  guessHistory.value.unshift({
    number: inputNum,
    result: resultText,
    resultType: resultType
  })
}

// 重置游戏
const resetGame = () => {
  inputValue.value = ''
  tipText.value = '请输入数字开始猜测～'
  isWon.value = false
  guessHistory.value = []
  // 恢复初始范围
  minRange.value = 1
  maxRange.value = 100
  generateRandomNum()
}

// 输入框获取焦点时重置
const resetInput = () => {
  if (!isWon.value) {
    inputValue.value = ''
    // 重置错误提示
    if (tipText.value.includes('❌')) {
      tipText.value = `请输入${minRange.value}-${maxRange.value}的数字开始猜测～`
    }
  }
}

// 初始化
onMounted(() => {
  generateRandomNum()
})
</script>

<style scoped>
.guess-number-game {
  width: 450px;
  margin: 50px auto;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: Arial, sans-serif;
}

.input-group {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.num-input {
  padding: 10px 15px;
  width: 180px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

/* 焦点样式 */
.num-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.guess-btn, .reset-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.guess-btn:disabled {
  background: #b3d8ff;
  cursor: not-allowed;
}

.guess-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.tip-text {
  height: 24px;
  line-height: 24px;
  font-size: 16px;
  margin: 10px 0;
}

.tip-text.success {
  color: #67c23a;
  font-weight: bold;
}

.tip-text.error {
  color: #f56c6c;
}

.tip-text.warning {
  color: #e6a23c;
}

.tip-text.info {
  color: #909399;
}

/* 历史记录样式 */
.history-section {
  margin-top: 30px;
  text-align: left;
}

.history-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.history-list {
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.history-item {
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
  font-size: 14px;
  transition: background 0.2s;
}

/* 不同结果类型的样式 */
.history-item.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.history-item.info {
  background: #f8f9fa;
  color: #909399;
}

.history-item.success {
  background: #f0f9ff;
  color: #67c23a;
  font-weight: bold;
}

.history-item:last-child {
  margin-bottom: 0;
}

.reset-btn {
  background: #67c23a;
  margin-top: 10px;
}

.reset-btn:hover {
  background: #85ce61;
}

.tip {
  color: #666;
  font-size: 14px;
}
</style>
