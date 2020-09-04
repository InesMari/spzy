import promisify from '../../utils/promisify.js';

export default {
    authorize: promisify(wx.authorize),
    getSetting: promisify(wx.getSetting),
    checkSession: promisify(wx.checkSession),
    openSetting: promisify(wx.openSetting),
    chooseImage: promisify(wx.chooseImage),
    previewImage: promisify(wx.previewImage),
    getImageInfo: promisify(wx.getImageInfo),
    login: promisify(wx.login),
    getUserInfo: promisify(wx.getUserInfo),
    authorize: promisify(wx.authorize),
    setStorage: promisify(wx.setStorage),
    getStorage: promisify(wx.getStorage),
    clearStorage: promisify(wx.clearStorage),
    showModal: params => {
        if (typeof params == 'object') return promisify(wx.showModal)(params);
        if (typeof params == 'string') {
            return new Promise((resolve, reject) => {
                wx.showModal({
                    title: '提示信息',
                    content: params,
                    showCancel: false,
                    success: res => { resolve(res); },
                    fail: res => { reject(res); }
                });
            })
        }
    },
    showToast: params => {
    if (typeof params == 'object') return promisify(wx.showToast)(params);
      if (typeof params == 'string') {
        return new Promise((resolve, reject) => {
          wx.showToast({
            title: params,
            icon: 'none',
            duration: 1500,
            success: res => { resolve(res); },
            fail: res => { reject(res); }
          });
        })
      }
    },
    checkSession: promisify(wx.checkSession),
    makePhoneCall: promisify(wx.makePhoneCall),
    getStorageInfo: promisify(wx.getStorageInfo),
    setNavigationBarTitle: promisify(wx.setNavigationBarTitle),
    showNavigationBarLoading: promisify(wx.showNavigationBarLoading),
    hideNavigationBarLoading: promisify(wx.hideNavigationBarLoading),    
    getSystemInfo: promisify(wx.getSystemInfo),
    getLocation:() =>{
      return new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'wgs84',
          success: res => { resolve(res);},
          fail: res => { reject(res);}
        })
      })
    },
  getSettingWithSubscriptions:() => {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        withSubscriptions: true,
        success: res => { resolve(res); },
        fail: res => { reject(res); }
      })
    })
  },
  setClipboardData : value => {
    return new Promise((resolve, reject) => {
      wx.setClipboardData({
        data: String(value),
        success: res => { resolve(res); },
        fail: res => { reject(res); }
      })
    })
  }
};
