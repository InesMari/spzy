import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../common/commonImport';
import req from '../../utils/request';
let tenantId = '285';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    companyName:'**',
    loginParams:"",
    name2focus:false,
    showPhoneNumber:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (option) {
    if(util.isNotBlank(option.tenantId)){
      tenantId = option.tenantId;
    }
    this.init();
  },
  onShow(){
    this.wxlogin();
  },
  async wxlogin() {    
    let {loginRes,userInfo} = await req.wxLogin();
    wx.setStorageSync("username", userInfo.nickName);
    wx.setStorageSync("jscode", loginRes.code);
    wx.setStorageSync("tenantId", tenantId);
    this.setData({ loginRes, userInfo, isLogin:true});
  },
  async init(){
    let companyName = await webApi.getCompanyName({ tenantId});
    this.setData({ companyName})
  },
  inputSetData(e) {
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.setData({ [key]: value });
    let {name1,name2} = this.data;
    if(key == "name1" && util.isNotBlank(name1)){
      this.setData({ name2focus:true });
    }
    if(util.isNotBlank(name1) && util.isNotBlank(name2)){
      this.setData({ showPhoneNumber:true });
    }else{
      this.setData({ showPhoneNumber:false });
    }
  },
  checkInput(){
    wxApi.showToast("请填写验证信息");
  },
  // 获取微信绑定的手机号
  async getPhoneNumber(e) {
    await this.wxlogin();
    if (util.isNotBlank(e)) {
      if(util.isBlank(this.data.loginParams)){
        var loginParams = {
          encrypData: e.detail.encryptedData,
          iv: e.detail.iv,
          js_code: this.data.loginRes.code,
        }
      }else{
        
      }
      this.setData({ loginParams}); //保存参数防止用户二次验证
      await this.doCheckCompany();  //校验公司名称
      let state = await webApi.scanLogin(loginParams);  //判断手机后是否第一次登录
      if (state =="SUCCESS"){
        wx.reLaunch({
          url: '/pages/index/index',
        })
      } else if (state == "FAIL") {        
        wx.reLaunch({
          url: '/packages/order/editAddress/editAddress?isScan=ture',
        })
      }
    }
  },
  async getPhoneNumberLogin(e){
    await this.wxlogin();
    let loginParams = {
      encrypData: e.detail.encryptedData,
      iv: e.detail.iv,
      js_code: this.data.loginRes.code,
    }
    this.setData({ loginParams});
    let state = await webApi.scanLogin(loginParams);
    if (state =="SUCCESS"){
      wx.reLaunch({
        url: '/pages/index/index',
      })
    } else if (state == "FAIL") {        
      wxApi.showToast("未检测到已有账号");
    } 
  },
  async doCheckCompany(){
    let { name1, name2 } = this.data;
    if (util.isBlank(name1) || util.isBlank(name2)) {
      wxApi.showToast("请输入隐藏的公司名")
    }
    let name = name1 + name2;
    await webApi.checkCompanyName({ name, tenantId });
  },
  doVerification(){

  }
})