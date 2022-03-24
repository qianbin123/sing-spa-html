import { apps } from './single-spa.js'

// 简单版状态
export const NOT_LOADED = 'NOT_LOADED';  // 应用默认状态是未加载状态
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';  // 正在加载文件资源

export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 此时没有调用bootstrap
export const BOOTSTRAPPING = 'BOOTSTRAPPING'; // 正在启动中，此时bootstrap调用完毕之后，需要表示成没有挂载

export const NOT_MOUNTED = 'NOT_MOUNTED'; // 调用了mount方法
export const MOUNTED = 'MOUNTED'; // 表示挂载成功

export const UNMOUNTTNG = 'UNMOUNTTNG'; // 卸载中， 返回NOT_MOUNTED

// 当前应用是否被挂载，状态是不是 MOUNTED
export function isActive(app){
  return app.status == MOUNTED
}

// 路径匹配才会加载应用
export function shouldBeActive(app){
  return app.activeWhen(window.location)
}

// 拿不到所有app
export function getAppChanges(){
  const appsToLoad = []; // 需要加载的列表
  const appsToMount = []; // 需要挂载的列表
  const appsToUnmount = []; // 需要移除的列表
  apps.forEach(app => {
    const appShouldBeActive = shouldBeActive(app);          // 查看这个app是否要加载
    switch(app.status){
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if(appShouldBeActive){
          appsToLoad.push(app);     // 没有要加载的，就是需要加载的app，如果正在加载资源，说明也没有被加载过
        }
        break;
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        if(appShouldBeActive){
          appsToMount.push(app);     // 没启动，并且没挂载过，说明等会挂载他
        }
        break;
      case MOUNTED:
        if(!appShouldBeActive){
          appsToUnmount.push(app);     // 正在挂载中，但是路径不匹配了，就是要卸载
        }
      default:
        break;
    }
  });

  return { appsToLoad, appsToMount, appsToUnmount }
}