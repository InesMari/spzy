import util from './util.js';
import APP_CONST from '../common/const/app.const';
import appConfig from '../common/const/app.config';
import wxApi from '../common/wxApi/wx.api';
import regeneratorRuntime from '../lib/regenerator-runtime/runtime';

import md5 from '../lib/md5.js';
import CryptoJS from '../lib/sha.js';

const IntfUrl = appConfig.intfUrl;
const webUrl = appConfig.webUrl;

const appId = appConfig.appId;
const intfKey = appConfig.intfKey;
const ver = appConfig.ver;
let tokenId = wx.getStorageSync(APP_CONST.STORAGE.TOKEN_ID) || appConfig.tokenId;
let urlManager = {}

//重新登录
let reLogin = () => {
  tokenId = '';
  wx.clearStorageSync();
  wx.reLaunch({ url: '/pages/login/login' });
};
// 重设storage
let resetStorage = async res => {
  wx.clearStorageSync();
  await Promise.all([
    wxApi.setStorage({ key: APP_CONST.STORAGE.TOKEN_ID, data: res.tokenId }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.TENANT_ID, data: res.tenantId }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.TENANT_NAME, data: res.tenantName }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.USER_ID, data: res.userId }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.USER_NAME, data: res.userName }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.USER_TYPE, data: res.userType }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.LOGIN_ACCT, data: res.loginAcct }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.NICK_NAME, data: res.nickName }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.AVATARURL, data: res.avatarUrl }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.USER_ROLE_TYPE, data: res.userRoleType }),
    wxApi.setStorage({ key: APP_CONST.STORAGE.ORD_NUM_TYPE, data: res.ordNumType }),
  ]);
}
const post = function (inCode = '', beanName = '', methodName = '', param = {}, postType = 'POST', isLoading = true,repeat = false) {
  tokenId = wx.getStorageSync(APP_CONST.STORAGE.TOKEN_ID);
  var url = IntfUrl + inCode;
  //计算sign
  var inParam = {};
  inParam.inCode = inCode;
  inParam.beanName = beanName;
  inParam.method = methodName;
  inParam.appId = appId;
  inParam.tokenId = tokenId;
  inParam.time = new Date().getTime().toString();
  inParam.rd = Math.round(Math.random() * 1000).toString();
  param.inCode = inCode;
  inParam.content = param;
  inParam.ver = ver;
  
  var paramArray = [intfKey, inParam.tokenId, inParam.time, inParam.rd, JSON.stringify(inParam.content)].sort();
  var str = "[";
  for (let item of paramArray) str += (item + ', ');
  str = str.replace(/, $/, '');
  str += "]";

  var sign = CryptoJS.SHA1(str).toString();
  inParam.sign = sign;
  return new Promise((resolve, reject) => {
    //显示加载中动画
    isLoading && wx.showLoading({ title: '请稍等...', mask: true });
    //限制重复请求
    if (!repeat){
      let urlstr = url + encodeURIComponent(JSON.stringify(param));
      if (urlManager[urlstr] == undefined) {
        urlManager[urlstr] = "1";
      } else {
        wx.showLoading({ title: '操作过于频繁', mask: true });
        console.log(inCode+'：频繁请求');
        const timeout = setTimeout(() => {
          wx.hideLoading();
          clearTimeout(timeout);
        }, 500)
        return
      }
      const timer = setTimeout(() => {
        delete urlManager[urlstr];
        clearTimeout(timer);
      }, 500);
    }
    //限制重复请求 end
    wx.request({
      url: url,
      data: inParam,
      method: postType,
      header:{
        'Wechat-Agent':"Wechat-Agent"
      },
      success: function (res) {
        let status = res.data.status;
        if (status == 200) {
          resolve(res.data.content);
        } else if (status == 406 || status == 500 || status == 501) {
          wx.showModal({ title: '提示信息', content: res.data.message || '网络可能存在异常，请稍后再试~~~', showCancel: false });
          reject(res.data);
        } else if (status == 403) {
          console.log("登录失效,接口：" + inCode)
          wx.clearStorageSync();
          wx.setStorageSync('UNLOGIN', true);
          resolve();
        } else {
          reject(res.data);
        }
      },
      fail: res => {
        reject(res);
        wx.showModal({ title: '提示信息', content: '网络可能存在异常，发送请求失败！', showCancel: false });
      },
      complete: function () {
        // const timer = setTimeout(() => {
        //   delete urlManager[url];
        //   clearTimeout(timer);
        // }, 300)
        isLoading && wx.hideLoading();
      }
    });
  });
};
let postByCode = function (inCode, param, postType, isLoading,reload) {
  return post(inCode, "", "", param, postType, isLoading, reload);
};
let postByBeanName = function (beanName, methodName, param, postType, isLoading) {
  return post("", beanName, methodName, param, postType, isLoading);
};
//get URL加密
let signUrl = function (orgiUrl) {
  var paramArray = new Array();
  var paramStr;
  if (!util.isBlank(orgiUrl)) {
    var realUrl = orgiUrl.substring(0, orgiUrl.indexOf("?"));
    var index = realUrl.lastIndexOf("/");
    var url = orgiUrl.substring(index + 1);
    var idx = 0;
    if ((idx = url.indexOf("&")) > 0) {
      paramStr = url.substring(0, idx);
      var params = url.substring(idx + 1).split("&");
      for (var i in params) {
        if (params[i].split("=")[1] !== "null" && params[i].split("=")[1] !== "") {
          paramArray.push(params[i]);
        }
      }
    } else {
      paramStr = url;
    }
  }
  if (paramArray.length > 0) paramStr += "&" + paramArray.sort().join("&");
  paramStr += "&sign=" + md5(paramStr);
  return webUrl + paramStr;
};

let urlEncode = function (param, key, encode) {
  if (!param) return '';
  let paramStr = '';
  let t = typeof (param);
  if (t == 'string' || t == 'number' || t == 'boolean') {
    paramStr += '&' + key + '=' + ((encode == null || encode) ? encodeURIComponent(param) : param);
  } else {
    for (let i in param) {
      let k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i);
      paramStr += urlEncode(param[i], k, encode);
    }
  }
  return paramStr;
};

let uploadFile = (filePath, param = {}, isLoading = true, title = '正在上传...') => {
  if (!tokenId) tokenId = wx.getStorageSync(APP_CONST.STORAGE.TOKEN_ID);

  let url = signUrl('WXSysAttachFileBO.ajax?cmd=doUpload' + urlEncode({ tokenId, ...param }));
  isLoading && wx.showLoading({ title, mask: true });
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url,
      filePath,
      name: 'file',
      success(res) {
        console.log(res)
        if (res.statusCode != 200) {
          wx.showModal({ title: '提示', content: '上传失败', showCancel: false });
          reject(res);
        } else {
          let { data } = res;
          if (data && typeof data == 'string') data = JSON.parse(data);
          resolve(data);
        }
      },
      fail(res) {
        wx.showModal({ title: '提示', content: '上传失败', showCancel: false });
        reject(res);
      },
      complete() {
        isLoading && wx.hideLoading();
      }
    });
  });
};

//微信调用第三方接口
let wxByPost = function(url,data,method){

  let isLoading = true ;
  //显示加载中动画
  isLoading && wx.showLoading({ title: '请稍等...', mask: true });

  return new Promise((resolve, reject)=>{
    wx.request({
      url: url,
      data: data||{},
      method: method||"get", 
      success: function (res) {
        resolve(res.data);
      },
      fail: res => {
        reject(res);
        wx.showModal({ title: '提示信息', content: '微信第三方接口调用失败', showCancel: false });
      },
      complete: function () {
        isLoading && wx.hideLoading();
      }
    });
  })
}

const wxLogin = async function(){
  try{
    let loginRes = await wxApi.login();
    let { userInfo } = await wxApi.getUserInfo();
    return {loginRes,userInfo}
  } catch (error){
    if (error && error.errMsg && error.errMsg.indexOf('getUserInfo:fail') >= 0) {
      //跳转到授权页面            
      wx.navigateTo({ url: '/pages/authorize/authorize' });
    }
  }
}

export default { postByCode, postByBeanName, signUrl, uploadFile, reLogin,resetStorage,wxByPost,wxLogin };
