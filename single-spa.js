import { NOT_LOADED } from './help.js';
import { reroute } from './reroute.js';

export let apps = []; //用于存放所有应用
export let started = false;

// 作用：注册应用实现应用加载（其实就在获取钩子）
export function registerApplication(appName, loadApp, activeWhen, customProps){
  let registeration = {
    name: appName,
    loadApp,
    activeWhen,
    customProps,
    status: NOT_LOADED
  }
  apps.push(registeration); // 保存到数组中，后续可以在数组里筛选需要的app，是加载，还是卸载，还是挂载

  // 需要加载应用，注册完毕后，需要进行应用的加载
  reroute();
}

// 作用：执行应用和启动应用的钩子（可能钩子不存在，需要去加载）
export function start(){
  started = true;
  reroute();
}
