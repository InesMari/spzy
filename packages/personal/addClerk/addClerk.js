import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.init();
  },
  async init(){
    let { items } = await webApi.siteList({ attributionType:1,addressType:1});
    this.setData({
      ['info.storeId']:items[0].warehouseId,
      ['info.warehouseFullName']:items[0].warehouseFullName,
  })
  },
  inputSetData(e){
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.data.info[key] = value;
    this.setData({ info: this.data.info });
  },
  async save(){
    let {userName,userPhone,userPassword} = this.data.info;
    if (util.isBlank(userName)){
      wxApi.showToast("请填写店员姓名。");
      return
    }
    if (!util.isPhoneNumber(userPhone)){
      wxApi.showToast("请输入正确的手机号。");
      return
    }
    if (util.isBlank(userPassword)){
      wxApi.showToast("请填写登录密码。");
      return
    }
    this.data.info.userLogin = this.data.info.userPhone;
    let res = await webApi.addClerk(this.data.info);
    if(res=="success"){
      await wxApi.showModal("添加店员成功！");
      wx.navigateBack();
    }
  }
})