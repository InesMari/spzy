import { util, wxApi, webApi, APP_CONST, regeneratorRuntime } from '../../../common/commonImport';

Component({
  properties: {
    
  },
  data: {
    userType:2
  },
  methods: {
    change(){
      let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);
      let unlogin = wx.getStorageSync("UNLOGIN");
      this.setData({ userType, unlogin })
    },
    // 首页
    toHome() {
      wx.navigateTo({ url: '/pages/index/index' });
    },
    // 算费
    toFeeCalc() {
      if (this.isToLogin()) return
      wx.navigateTo({ url: '/packages/fee/feeCalc/feeCalc' });
    },
    // 入库
    toStorage() {
      wxApi.showToast("暂未开放，敬请期待~");
      return;
      wx.navigateTo({ url: '/packages/order/storage/storage/storage' });
    },
    // 下单
    toBilling() {
      if (this.isToLogin()) return
      wx.navigateTo({ url: '/packages/order/billing/billing' });
    },
    // 订单
    toOrderList() {
      if (this.isToLogin()) return
      wx.navigateTo({ url: '/packages/order/orderList/orderList' });
    },
    // 我的
    toPersonal() {
      wx.navigateTo({ url: '/packages/personal/personal/personal' });
    },
    isToLogin(){
      if (this.data.unlogin){
        wxApi.showToast("登录后才能使用该功能~");
        return true;
      }else{
        return false;
      }
    },
  }
});
