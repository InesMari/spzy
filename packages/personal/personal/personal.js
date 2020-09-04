import { util, wxApi, webApi, regeneratorRuntime,appConfig, APP_CONST } from '../../../common/commonImport';
import req from '../../../utils/request';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    info:{},
    headImg:"/common/images/u3395.png",
    userListIndex: 0,
    userList: [],  //店铺列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.doQuery();
  },
  async queryStorage() {
    let unlogin = wx.getStorageSync("UNLOGIN");//是否登录
    let headImg = wx.getStorageSync(APP_CONST.STORAGE.AVATARURL);//获取微信头像
    let nickName = wx.getStorageSync(APP_CONST.STORAGE.NICK_NAME);//获取微信昵称
    let shopType = wx.getStorageSync(APP_CONST.STORAGE.USER_ROLE_TYPE);//获取用户类型
    let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);//获取用户类型
    let loginAcct = wx.getStorageSync(APP_CONST.STORAGE.LOGIN_ACCT);//获取手机号码
    this.setData({ unlogin, headImg, nickName, shopType,userType,ver:appConfig.ver });
    let result = await webApi.getUserId({ userLogin: loginAcct });//获取用户id
    if (util.isNotBlank(result) && util.isNotBlank(result.userId)) {
      let userList = await webApi.getUserList({ userId:result.userId });  //获取店铺列表信息
      this.setData({userList });
    }
  },
  async doQuery() {
    try{
      await this.queryStorage();
      let info = await webApi.getPersonalInfo();
      info.userName = decodeURI(info.userName);
      let { cfgValue } = await webApi.getConfig({ cfgName: "CONSUMER_HOTLINE" });
      this.setData({ info, cfgValue });
    } catch (e) {
      console.log(e)
    }
  },
  // 点击注册/登录
  toLogin(){
    req.reLogin();
  },
  // 退出登录
  async relogin(){
    let { confirm } = await wxApi.showModal({ title: '提示', content: '确定退出登录？' });
    let content = await webApi.relogin();
    if (content == 0) {
      req.reLogin();
    }
  },
  changeUser(e){
    let { type } = e.currentTarget.dataset;
    this.goChange(type)
  },
  //跳转账号
  async goChange(attributionType) {
    let userLogin = wx.getStorageSync(APP_CONST.STORAGE.LOGIN_ACCT);
    let {userList,userListIndex} = this.data;
    let id = undefined;
    if (userList.length > 0 && attributionType==2){
      id = userList[userListIndex].id;
    }
    let res = await webApi.changeUser({ attributionType, userLogin,id });
    if (res.result == '0') {
      res.nickName = this.data.nickName;
      res.avatarUrl = this.data.headImg;
      await req.resetStorage(res);
      await this.doQuery();    
    }
  },
  //创建个人账号
  async createUser() {
    let userLogin = wx.getStorageSync(APP_CONST.STORAGE.LOGIN_ACCT);
    let nickName = wx.getStorageSync(APP_CONST.STORAGE.NICK_NAME);
    let res = await webApi.createUser({ userLogin, userName: nickName });
    if (res.result == '0'){
      let { confirm } = await wxApi.showModal({ title: '提示', content: '创建个人账号成功，是否跳转到个人账号'});
      if (confirm){
        this.goChange('4');
      }else{
        this.doQuery();
      }
    }
  },
  //切换店铺/经销商
  userListChange(e) {
    let { value } = e.detail;
    this.setData({
      userListIndex: value
    })
    this.goChange(2);
  },
  // 拨打电话
  call(){
    wx.makePhoneCall({
      phoneNumber: this.data.info.customerUserPhone
    })
  },
  toAddClerk(){
    wx.navigateTo({ url: `/packages/personal/addClerk/addClerk` });
  },
  toAddress(){
    wx.navigateTo({ url: `/packages/order/selectAddress/selectAddress` });
  },
  toPayHistory() {
    wx.navigateTo({ url: `/packages/personal/payHistory/payHistory` });
  },
  toApplyInvoice() {
    wx.navigateTo({ url: `/packages/personal/applyInvoice/applyInvoice` });
  },
  toInvoiceHistory() {
    wx.navigateTo({ url: `/packages/personal/invoiceHistory/invoiceHistory` });
  },
  toSuggese(){
    wx.navigateTo({ url: `/packages/personal/suggest/suggest` });
  },
  toMessage(){
    this.subscribeMessage();
    wx.navigateTo({ url: `/packages/personal/message/message` });
  },
  wait() {
    wxApi.showToast("暂未开放，敬请期待~");
  },
  
  //订阅消息模板
  async subscribeMessage(){
    let tmplIds = [];
    let res1 = await webApi.getConfig({ cfgName:"SIGN_FOR_NOTICE_OUT"});
    let res2 = await webApi.getConfig({ cfgName:"SUCCESSFUL_NOTICE_OUT"});
    if (util.isNotBlank(res1.cfgValue)){
      tmplIds.push(res1.cfgValue)
    }
    if (util.isNotBlank(res2.cfgValue)){
      tmplIds.push(res2.cfgValue)
    }
    if(tmplIds.length>0){
      //调起订阅
      await new Promise((resolve, reject) => {
        wx.requestSubscribeMessage({
          tmplIds: tmplIds,
          success: result => { 
            console.log(result)
            resolve(result); 
          },
          fail: result => { 
            console.log(result)
            resolve(result); 
          }
        })
      })
    }
  },
})