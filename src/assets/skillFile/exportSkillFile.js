
// 批量导入当前目录下的 svg/png 资源（自动映射为 { 资源名: 资源URL }）
//eager: true：表示同步导入（默认是异步）
//import: 'default'：直接取资源的默认导出（即资源 URL
const assets = import.meta.glob('./{ant.svg,vue.png}', { eager: true, import: 'default' });
// 导出（解构为单独变量）
// export const antImg = assets['./ant.svg'];
// export const vueImg = assets['./vue.png'];


export { default as antImg } from './ant.svg';
export { default as vueImg } from './vue.png';
