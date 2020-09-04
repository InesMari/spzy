import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
import md5 from '../../../lib/md5.js';
import req from '../../../utils/request';
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad({ orderId, userLogin, attributionType }) {
    console.log("orderId：" + orderId);
    console.log("userLogin" + userLogin);
    console.log("attributionType：" + attributionType);
    await webApi.loginState();
    let unlogin = wx.getStorageSync("UNLOGIN");//是否登录
    if (unlogin){
      await wxApi.showModal("登录状态已失效，请先登录。");
      req.reLogin();
      return
    }
    console.log("登录信息有效");
    if (util.isNotBlank(userLogin) && util.isNotBlank(attributionType)){  //
      let result = await webApi.getUserId({userLogin}); //根据手机号查询用户id
      console.log(result);
      let id = undefined;
      if(util.isNotBlank(result)){
        if(util.isNotBlank(result.userId)){
          let userList = await webApi.getUserList({userId:result.userId});  //查询是否有多个店铺或者供销商
          console.log(userList);
          if(userList.length>0){
            id = userList[0].id;  //默认选择第一个店铺/经销商
          }
        }
      }
      //登录
      let res = await webApi.changeUser({ attributionType, userLogin,id });
      if (res.result == '0') {
        await req.resetStorage(res);
      }
    }
    let res = await webApi.orderDetail({ orderId });
    this.setData({ ...res, orderId });
    //查询是否东莞客户
    if(util.isNotBlank(res.cmWarehouse)){
      this.setData({warehouseNature:res.cmWarehouse.warehouseNature});
    }
    // 判断是否东莞客户
    let {cfgValue} = await webApi.getConfig({ cfgName: "PURCHASE_TENANT" });  //查询东莞用户id
    let tenantId = wx.getStorageSync(APP_CONST.STORAGE.TENANT_ID);  //查询用户类型
    if(cfgValue==tenantId&&res.order.orderType==2){
      this.setData({warehouseNature:4});
    }
  },
  async doPay() {
    let loginRes = await wxApi.login();
    let orderId = Number(this.data.orderId);
    let res = await webApi.pay({ orderId, js_code: loginRes.code}); //支付测试
    let timeStamp = new Date().getTime().toString();  //时间戳
    let prepay_id = 'prepay_id=' + res.prepay_id; //与支付ID
    let obj = {
      appId: "wxbb9e6757232356eb",
      timeStamp,
      nonceStr: res.nonce_str,
      package: prepay_id,
      signType: "MD5",
    }
    obj = util.sort_ASCII(obj);   //ASCII码排序
    //对象传字符串（appId=1&timeStamp=2）格式
    let objStr = JSON.stringify(obj).replace(/[\''"{}]/g, "").replace(/,/g, '&').replace(/:/g, '=');
    //转义后再加上商户秘钥
    objStr += "&key=FA05BCEF08F214ED3D495D3D132CB97B";
    //md5加密并大写
    let paySign = md5(objStr).toUpperCase();
    let _this = this;
    wx.requestPayment({
      timeStamp,
      nonceStr: res.nonce_str,
      package: prepay_id,
      signType: 'MD5',
      paySign,
      success(result) {
        _this.doNext(res.flowId)
      },
      fail(result) {
        console.log(res);
      }
    })
  },
  async doNext(flowId) {
    webApi.paysuccess({ flowId });
    let { confirm } = await wxApi.showModal("付款成功");
    if (confirm){
      let prePage = util.getPrePage();
      prePage.doQuery(true);
      wx.navigateBack();
    }
  },
  // 长按复制文本
  async copyText(e){
    let {label,value} = e.currentTarget.dataset;
    await wxApi.setClipboardData(value);
    wxApi.showToast(`${label}已复制`);
  }
})