import { ref, onMounted, onUnmounted } from 'vue'

// 加载静态 script 脚本文件
export const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
// 按照惯例，组合式函数名以“use”开头
export function useMouse() {
  // 被组合式函数封装和管理的状态
  const x = ref(0)
  const y = ref(0)

  // 组合式函数可以随时更改其状态。
  function update(event) {
    x.value = event.pageX
    y.value = event.pageY
  }

  // 一个组合式函数也可以挂靠在所属组件的生命周期上
  // 来启动和卸载副作用
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  // 通过返回值暴露所管理的状态
  return { x, y }
}
//设置顶层字体
import $J from 'jquery';
export function setFontSize() {
  let window_width = window.innerWidth;
  let font_size = parseFloat((window_width / 3.93).toString());
  // console.log(font_size);
  $J('html').css('font-size', font_size);
}

/**
 * 放宽移动端判断（避免真实手机被误判）
 * 优先保证手机能触发检测，平板可选包含
 */
export function isMobile(isDebug) {
    if (typeof navigator === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;

    // 核心判断：UA包含移动端标识 + 屏幕宽度<1024px（兼容平板）
    const isMobileUA = /iphone|ipod|ipad|android|windows phone|mobile|micromessenger|alipayclient/.test(userAgent);
    const isSmallScreen = screenWidth < 1024;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 调试日志
    if (isDebug) {
        console.log('[OrientationChecker] 移动端检测:', {
            isMobileUA,
            isSmallScreen,
            isTouchDevice,
            screenWidth,
            userAgent: userAgent.substring(0, 100) // 截断UA避免日志过长
        });
    }

    // 放宽条件：满足UA+触摸 或 小屏幕+触摸（确保真实手机必被识别）
    return (isMobileUA && isTouchDevice) || (isSmallScreen && isTouchDevice);
}

/**
 * 检测是否为移动端H5环境，非移动端则显示蒙版和二维码提示
 * @param {Object} options 配置项
 * @param {string} options.qrcodeUrl 二维码图片地址（必填）
 * @param {string} options.tipText 提示文本（可选，默认值：请使用手机扫码访问）
 * @param {string} options.closeText 关闭按钮文本（可选，默认值：关闭）
 * @param {string} options.containerId 挂载容器ID（可选，默认挂载到body）
 * @param {Function} options.onClose 蒙版关闭后的回调函数（可选）
 */
export function tipMobile(options = {}) {
    // 默认配置
    const defaultOptions = {
        qrcodeUrl: '',
        tipText: '请使用手机扫码访问',
        closeText: '关闭',
        containerId: '',
        onClose: null // 关闭回调函数
    };

    // 合并配置
    const config = { ...defaultOptions, ...options };

    // 校验必填参数
    if (!config.qrcodeUrl) {
        console.error('二维码图片地址（qrcodeUrl）为必填项');
        return;
    }

    /**
     * 创建蒙版和二维码提示层
     */
    function createQrcodeOverlay() {
        // 获取挂载容器
        const container = config.containerId
            ? document.getElementById(config.containerId)
            : document.body;

        if (!container) {
            console.error(`挂载容器${config.containerId}不存在`);
            return;
        }

        // 避免重复创建
        if (document.getElementById('mobile-qrcode-overlay')) {
            return;
        }

        // 创建样式
        const style = document.createElement('style');
        style.textContent = `
            #mobile-qrcode-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            }
            .qrcode-container {
                background: #fff;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                max-width: 320px;
                width: 100%;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            }
            .qrcode-img {
                width: 200px;
                height: 200px;
                margin: 0 auto 20px;
                display: block;
                border: 1px solid #eee;
                padding: 8px;
            }
            .qrcode-tip {
                font-size: 16px;
                color: #333;
                margin-bottom: 20px;
            }
            .qrcode-close {
                padding: 8px 24px;
                background: #007bff;
                color: #fff;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .qrcode-close:hover {
                background: #0056b3;
            }
            @media (max-width: 767px) {
                #mobile-qrcode-overlay {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        // 创建蒙版DOM
        const overlay = document.createElement('div');
        overlay.id = 'mobile-qrcode-overlay';
        overlay.innerHTML = `
            <div class="qrcode-container">
                <img src="${config.qrcodeUrl}" alt="手机扫码访问" class="qrcode-img">
                <p class="qrcode-tip">${config.tipText}</p>
                <button class="qrcode-close">${config.closeText}</button>
            </div>
        `;
        container.appendChild(overlay);

        // 关闭按钮事件
        const closeBtn = overlay.querySelector('.qrcode-close');
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';

            // 执行关闭回调函数
            if (typeof config.onClose === 'function') {
                try {
                    config.onClose({
                        overlay: overlay,
                        closeButton: closeBtn,
                        timestamp: new Date().getTime()
                    });
                } catch (error) {
                    console.error('关闭回调函数执行出错:', error);
                }
            }
        });

        // 支持点击蒙版空白处关闭（可选功能）
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';

                // 执行关闭回调函数
                if (typeof config.onClose === 'function') {
                    try {
                        config.onClose({
                            overlay: overlay,
                            closeButton: closeBtn,
                            trigger: 'overlay-click',
                            timestamp: new Date().getTime()
                        });
                    } catch (error) {
                        console.error('关闭回调函数执行出错:', error);
                    }
                }
            }
        });

        // 阻止容器内点击事件冒泡到蒙版
        const qrcodeContainer = overlay.querySelector('.qrcode-container');
        qrcodeContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 主逻辑：非移动端则创建蒙版
    if (!isMobile()) {
        // 确保DOM加载完成后执行
        if (document.readyState === 'complete') {
            createQrcodeOverlay();
        } else {
            window.addEventListener('load', createQrcodeOverlay);
        }
    }
}

/**
 * 移动端横竖屏检测并提示（修复版：确保蒙版正常显示）
 * @param {Object} options 配置项
 * @param {string} options.requiredOrientation 要求的方向（portrait/landscape）
 * @param {string} options.tipText 提示文本
 * @param {string} options.containerId 挂载容器ID
 * @param {Function} options.onSuccess 方向正确回调
 * @param {Function} options.onError 方向错误回调
 * @param {boolean} options.debug 调试模式（打印日志）
 */
export function checkScreenOrientation(options = {}) {
    // 默认配置
    const defaultOptions = {
        requiredOrientation: 'portrait',
        tipText: '',
        containerId: '',
        onSuccess: null,
        onError: null,
        debug: false // 新增调试模式
    };

    const config = { ...defaultOptions, ...options };

    // 校验参数
    if (!['portrait', 'landscape'].includes(config.requiredOrientation)) {
        console.error('[OrientationChecker] requiredOrientation参数错误，仅支持portrait/landscape');
        return;
    }

    // 自动生成提示文本
    if (!config.tipText) {
        config.tipText = config.requiredOrientation === 'portrait'
            ? '为获得最佳体验,请将手机竖屏使用本页面'
            : '为获得最佳体验,请将手机横屏使用本页面';
    }


    /**
     * 精准检测屏幕方向（强制优先宽高比判断，避免API兼容问题）
     */
    function getCurrentOrientation() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const orientation = width < height ? 'portrait' : 'landscape';

        if (config.debug) {
            console.log('[OrientationChecker] 屏幕方向检测:', {
                width,
                height,
                currentOrientation: orientation,
                requiredOrientation: config.requiredOrientation
            });
        }

        return orientation;
    }

    function isOrientationCorrect() {
        return getCurrentOrientation() === config.requiredOrientation;
    }

    /**
     * 强制创建蒙版（修复样式/层级问题）
     */
    function createOrientationOverlay() {
        // 优先挂载到body（避免容器不存在导致蒙版丢失）
        const container = config.containerId
            ? document.getElementById(config.containerId) || document.body
            : document.body;

        // 移除旧蒙版（避免重复）
        const oldOverlay = document.getElementById('orientation-overlay');
        if (oldOverlay) oldOverlay.remove();

        // 创建样式（强制最高层级，避免被覆盖）
        const styleId = 'orientation-overlay-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #orientation-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: rgba(0, 0, 0, 0.95) !important;
                    z-index: 999999 !important; /* 强制最高层级 */
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: center !important;
                    color: #fff !important;
                    font-size: 18px !important;
                    text-align: center !important;
                    padding: 20px !important;
                    box-sizing: border-box !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    pointer-events: auto !important; /* 确保可点击 */
                }
                .orientation-icon {
                    font-size: 60px !important;
                    margin-bottom: 20px !important;
                }
                .orientation-tip {
                    margin: 0 0 10px 0 !important;
                    line-height: 1.5 !important;
                    padding: 0 20px !important;
                }
                .orientation-subtip {
                    font-size: 14px !important;
                    color: #ccc !important;
                    margin: 0 !important;
                }
                /* 强制移动端显示，PC端隐藏 */
                @media (min-width: 1024px) {
                    #orientation-overlay {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 创建蒙版DOM（强制插入到容器最前面）
        const overlay = document.createElement('div');
        overlay.id = 'orientation-overlay';
        overlay.innerHTML = `
            <span class="orientation-icon">${config.requiredOrientation === 'portrait' ? '📱' : '📺'}</span>
            <p class="orientation-tip">${config.tipText}</p>
            <p class="orientation-subtip">旋转手机后将自动关闭提示</p>
        `;
        // 强制插入到容器第一个位置，避免被其他元素覆盖
        container.insertBefore(overlay, container.firstChild);

        if (config.debug) {
            console.log('[OrientationChecker] 蒙版已创建:', overlay);
        }

        return overlay;
    }

    // 关闭蒙版
    function closeOverlay() {
        const overlay = document.getElementById('orientation-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);

            if (typeof config.onSuccess === 'function') {
                config.onSuccess({
                    orientation: getCurrentOrientation(),
                    timestamp: Date.now()
                });
            }
            if (config.debug) {
                console.log('[OrientationChecker] 蒙版已关闭（方向正确）');
            }
        }
    }

    // 显示蒙版（强制显示，忽略样式冲突）
    function showOverlay() {
        const overlay = createOrientationOverlay();
        // 强制设置display，避免样式覆盖
        overlay.style.display = 'flex !important';

        if (typeof config.onError === 'function') {
            config.onError({
                required: config.requiredOrientation,
                current: getCurrentOrientation(),
                timestamp: Date.now()
            });
        }
        if (config.debug) {
            console.log('[OrientationChecker] 蒙版已显示（方向错误）');
        }
    }

    // 核心检测逻辑（强制立即执行，不等待load）
    function checkAndHandleOrientation() {
        // 调试日志
        if (config.debug) {
            console.log('[OrientationChecker] 执行检测:', {
                isMobile: isMobile(),
                isOrientationCorrect: isOrientationCorrect()
            });
        }

        // 非移动端直接返回
        if (!isMobile()) {
            if (config.debug) console.log('[OrientationChecker] 非移动端，跳过检测');
            return;
        }

        // 方向判断
        if (isOrientationCorrect()) {
            closeOverlay();
        } else {
            showOverlay(); // 强制创建并显示蒙版
        }
    }

    // ========== 修复初始化逻辑（核心！） ==========
    // 1. 立即执行一次检测（不等待load，避免DOM加载完成前方向已变化）
    setTimeout(checkAndHandleOrientation, 0);

    // 2. DOM加载完成后再执行一次（兜底）
    if (document.readyState === 'complete') {
        checkAndHandleOrientation();
    } else {
        window.addEventListener('load', checkAndHandleOrientation);
    }

    // 3. 监听事件（移除防抖，确保实时响应）
    const handleChange = () => {
        checkAndHandleOrientation();
    };
    window.addEventListener('orientationchange', handleChange);
    window.addEventListener('resize', handleChange);

    // 暴露方法
    return {
        check: checkAndHandleOrientation,
        getCurrentOrientation: getCurrentOrientation,
        isOrientationCorrect: isOrientationCorrect,
        isMobile: isMobile,
        forceShowOverlay: showOverlay // 强制显示蒙版
    };
}

