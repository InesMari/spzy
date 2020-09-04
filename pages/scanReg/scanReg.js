import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../common/commonImport';
import req from '../../utils/request';
import md5 from '../../lib/md5';

// let cfgName = "CLIENT_273"; //测试
let cfgName = "CLIENT_287"; //生产
Page({

  /**
   * 页面的初始数据
   */
  data: {
    companyName:'**',
    isGetSmsCode:false, //是否获取短信验证码（倒计时用）
    cutdown:60, //倒计时秒数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(option) {
    await req.wxLogin();
    if(util.isNotBlank(option.cfgName)){
      cfgName = option.cfgName;
    }
    this.init();
  },
  async init(){
    let {cfgValue} = await webApi.getConfig({ cfgName});
    let companyName = cfgValue.split(",")[0];
    this.setData({ companyName})
  },
  inputSetData(e) {
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.setData({ [key]: value });
  },  
  // 获取短信验证码
  async getSmsCode(){
    let userLogin = this.data.userLogin;
    if (!util.isPhoneNumber(userLogin)){
      wxApi.showModal("请输入正确的手机号。");
      return;
    }
    let isHave = await webApi.isHaveUser({ userLogin});
    console.log(isHave);
    if(isHave == "SUCCESS"){
      await wxApi.showModal("该账户已经存在");
      return;
    }
    let sign = md5(userLogin + '1943E4E1FE023E818A1EEA9DD55743DF');
    let res = await webApi.getSmsCode({ userLogin, sign});
    if(res==0){
      wxApi.showToast("短信验证码已发送");
    }else{
      wxApi.showModal("验证码发送失败，请重新点击发送。");
      return
    }
    this.setData({ isGetSmsCode:true});
    let cutdown = this.data.cutdown
    const timer = setInterval(()=>{
      if (cutdown>0){
        this.setData({ cutdown: --cutdown});
      }else{
        this.setData({ isGetSmsCode: false, cutdown:60 });
        clearInterval(timer);
      }
    },1000)
  },
  async save(){
    let {userLogin,userName,smsCode} = this.data;
    if (util.isBlank(userName)) {
      wxApi.showModal("请输入姓名。");
      return;
    }
    if (!util.isPhoneNumber(userLogin)) {
      wxApi.showModal("请输入正确的手机号。");
      return;
    }
    if (util.isBlank(smsCode)) {
      wxApi.showModal("请输入验证码。");
      return;
    }
    let checkCode = await webApi.checkSmsCode({ userLogin, smsCode, });
    if(checkCode!="SUCCESS"){
      wxApi.showModal("验证码错误。"); 
      return;
    }
    let res = await webApi.addPurchase({ userLogin, userName });
    if(res.result == 0){
      // wx.reLaunch({ url: '/pages/index/index' });
      this.toLogin();
    }
  },
  async toLogin(){    
    let {loginRes,userInfo} = await req.wxLogin();
    let {userLogin,userName,smsCode} = this.data;
    let res = await webApi.codeLogin({ userLogin, smsCode, userName, js_code: loginRes.code });
    res.nickName = userName;
    res.avatarUrl = userInfo.avatarUrl;
    if (res.result == '0') {
      await req.resetStorage(res);
      wx.reLaunch({ url: '/pages/index/index' });
    }
  }
})