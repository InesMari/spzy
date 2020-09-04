import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../common/commonImport';
Page({
  //授权
  getuserinfoHandler() {
    wx.showLoading({ title: '检查登录...', mask: true });
    wx.navigateBack();
    // //登录
    // let loginRes = await wxApi.login();
    // //获取用户信息
    // let { userInfo } = await wxApi.getUserInfo();
    // // 从内存获取电话密文
    // let encryptedData = wx.getStorageSync(APP_CONST.STORAGE.ENCRYPTED_DATA);
    // let iv = wx.getStorageSync(APP_CONST.STORAGE.IV);
    // if (util.isBlank(nickName)){  //内存没有的时候跳转到登录页重新获取并存储
    //   wx.reLaunch({ url: '/pages/login/login' });
    // }else{
    //   let params = {
    //     encrypData,
    //     iv,
    //     js_code: loginRes.code,
    //     userName: userInfo.nickName
    //   }
    //   let res = await webApi.login(params);
    //   res.nickName = userInfo.nickName;
    //   if (res.result=='0'){
    //     await req.resetStorage(res);
    //     wx.reLaunch({ url: '/pages/index/index' });
    //   }
    // }
  }
});