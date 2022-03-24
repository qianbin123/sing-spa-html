import { getAppChanges, LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED, NOT_LOADED, MOUNTED, BOOTSTRAPPING, NOT_MOUNTED, shouldBeActive } from './help.js';
import { apps, started } from './single-spa.js'


// 将多个 Promise 组合成Promise链
/* 

Promise.resolve().then(() => {
  return fn1(resultPromise)
}).then(() => {
  return fn2(resultPromise)
} 

demo:
let func = [
    async () => {console.log(1); return 2},
    async (param) => {console.log(param)},
]
func.reduce((p, func) => {
    return p.then(func)
},Promise.resolve());

*/
function flattenFnArray(fns){
  fns = Array.isArray(fns)? fns: [fns];
  return function(customProps){
    // 依次执行，需要有先后等待的效果，不能用forEach
    return fns.reduce((resultPromise, fn) => resultPromise.then(() => {
      return fn(resultPromise)
    }), Promise.resolve());
  }
}

function toLoadPromise(app){
  return Promise.resolve().then(() => {
    // 获取应用的钩子方法 接入协议
    // 只有当他是 NOT_LOADED 的时候财需要加载
    if(app.status !== NOT_LOADED){
      return app;
    }
    // 转换状态
    app.status = LOADING_SOURCE_CODE;
    // 只走一次，另外loadApps是一个Promise函数
    return app.loadApp().then(val => {
      // 获取应用接入协议，即子应用白松露
      let { bootstrap, mount, unmount } = val;

      // bootstrap是一个数组，需要拍平
      app.status = NOT_BOOTSTRAPPED;
      app.bootstrap = flattenFnArray(bootstrap);
      app.mount = flattenFnArray(mount);
      app.unmount = flattenFnArray(unmount);
      return app;
    })
  })
}

function loadApps(){
  const loadPromises = appsToLoad.map(toLoadPromise);
  return Promise.all(loadPromises)
}

function toUnmountPromise(app){
  return Promise.resolve().then(() => {
    if(app.status !== MOUNTED){                          // 如果不是挂载状态，直接跳出
      return app;
    }
    app.status = UNMOUNTTNG;                             // 标记成正在卸载，调用卸载逻辑，并且标记成未挂载
    return app.unmount(app.customProps).then(() => {
      app.status = NOT_MOUNTED
    })
  })
}

function performAppChanges(){
  // 应用启用了，卸载不需要的应用
  // 应用可能加载过（如果没加载，还是需要加载的）=> 启动并挂载需要的
  let unmountPromise = Promise.all(appsToUnmount.map(toUnmountPromise)) // 卸载，我就启动

  // toLoadPromise(app) 需要拿到加载完的app继续.then
  appsToLoad.map(app=>toLoadPromise(app).then(app => tryBootstrapAndMount(app, unmountPromise)))

  // 有可能start是异步加载的，此时loadApp已经被调用过了，需要直接挂载就可以了
  appsToMount.map(app => tryBootstrapAndMount(app, unmountPromise))
}

function toBootstrapPromise(app){
  return Promise.resolve().then(() => {
    if(app.status !== NOT_BOOTSTRAPPED){
      return app;
    }
    app.status = BOOTSTRAPPING;
    return app.bootstrap().then(() => {
      app.status = NOT_MOUNTED;
    })
  })
}

// function appsToLoad(app){
//   return Promise.resolve().then(() => {
//     if(app.status !== NOT_MOUNTED){
//       return app;
//     }
//     return app.mount(app.customProps).then(() => {
//       app.status = MOUNTED;
//     })
//   })
// }

function tryBootstrapAndMount(app, unmountPromises){
  // a->b b->a a->b
  return Promise.resolve().then(() => {
    if(shouldBeActive(app)){
      toBootstrapPromise(app).then(app => unmountPromises.then(() => toUnmountPromise(app)))
    } 
  })
}

export function reroute(){

  // 在reroute中，我需要知道，挂载哪些应用以及要卸载哪些应用
  // 每次都调一次这个，是因为需要知道每次应用是否要挂载
  const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();
  
  // 需要去加载应用，预先加载

  if(started){
    return performAppChanges()
  }


  // 应用加载就是把应用的钩子拿到（至于应用是如何加载的，可以让用户自己去定义，比如：jsonp、fetch、SystemJs）
  return loadApps();
}