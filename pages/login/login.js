import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../common/commonImport';
import req from '../../utils/request';
import md5 from '../../lib/md5';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loginRes:'',
    userInfo:'',
    isLogin:false,
    isGetSmsCode:false, //是否获取短信验证码（倒计时用）
    cutdown:60, //倒计时秒数
    userList: [],  //店铺列表
    userListIndex: null,
    isPhoneLogin:false,   //手机号登录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.login();
    // this.wxlogin();
  },
  onShow(){
    this.wxlogin();
  },
  async wxlogin(){
    let loginInfo = await req.wxLogin();
    if(util.isNotBlank(loginInfo)){
      let {loginRes,userInfo} = loginInfo;
      this.setData({ loginRes, userInfo, isLogin:true});
    }
  },
  // 获取微信绑定的手机号
  async getPhoneNumber(e) {
    await this.wxlogin();
    if (util.isNotBlank(e)){
      let params = {
        encrypData: e.detail.encryptedData,
        iv: e.detail.iv,
        js_code: this.data.loginRes.code,
        userName: encodeURI(this.data.userInfo.nickName)
      }
      let res = await webApi.login(params);
      res.nickName = this.data.userInfo.nickName;
      res.avatarUrl = this.data.userInfo.avatarUrl;
      if (res.result=='0'){
        this.toLoginNext(res);
      }
    }
  },
  // 验证码登录
  async codeLogin(){
    if(!this.data.isPhoneLogin){
      this.setData({isPhoneLogin:true})
      return
    }
    await this.wxlogin();
    let { userLogin, smsCode } = this.data;
    let userName = encodeURI(this.data.userInfo.nickName);
    if (!util.isPhoneNumber(userLogin)) {
      wxApi.showModal("请输入正确的手机号。");
      return;
    }
    if (util.isBlank(smsCode)) {
      wxApi.showModal("请输入验证码。");
      return;
    }
    let res = await webApi.codeLogin({ userLogin, smsCode, userName, js_code: this.data.loginRes.code });
    res.nickName = userName;
    res.avatarUrl = this.data.userInfo.avatarUrl;
    if (res.result == '0') {
      this.toLoginNext(res);
    }
  },
  async toLoginNext(res) {
    /* 
      userRoleType：1超级管理员，2普通员工，3店长，4网点，5经销商，6店员,8采购人员
      3、6请选择店铺,5 请选择经销商
    */
    this.setData({ loginAcct: res.loginAcct, shopType: res.userRoleType});
    await req.resetStorage(res);
    let result = await webApi.getUserId({userLogin: res.loginAcct});
    if(util.isNotBlank(result) && util.isNotBlank(result.userId)){
      await this.checkUserList(result.userId);
    }
    let {userList} = this.data;
    if (userList.length == 0) {
      wx.reLaunch({ url: '/pages/index/index' });
    } else if (userList.length == 1) {
      this.setData({ userListIndex:0});
      this.shopLogin();
    } else if (userList.length > 1) { //多个时默认先登录第一个
      let { id } = this.data.userList[0];
      let res = await webApi.changeUser({ id, attributionType: 2, userLogin: this.data.loginAcct});
      await req.resetStorage(res);
    }
  },
  // 查询店铺列表
  async checkUserList(userId){
    if (util.isNotBlank(userId)){
      let res = await webApi.getUserList({userId});
      this.setData({userList:res});
    }
  },
  inputSetData(e){
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
    let sign = md5(userLogin + '1943E4E1FE023E818A1EEA9DD55743DF');
    // surroundingsType:1时，不发短信，默认验证码：1234
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
  userListChange(e){
    let { value } = e.detail;
    this.setData({
      userListIndex: value
    })
  },
  async shopLogin(){
    if (util.isNotBlank(this.data.userListIndex)){
      let { name, id } = this.data.userList[this.data.userListIndex];
      let res = await webApi.changeUser({ id, attributionType: 2, userLogin: this.data.loginAcct});
      await req.resetStorage(res);
      wx.reLaunch({ url: '/pages/index/index' });
    }else{
      let {shopType} = this.data;
      if (shopType == 3 || shopType==6){
        wxApi.showToast('请选择店铺');
      } else if (shopType==5){
        wxApi.showToast('请选择经销商');
      }
    }
  }
})