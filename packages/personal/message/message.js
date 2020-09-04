import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../../common/commonImport';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    date:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) {
    let year = new Date().getFullYear();
    let month = new Date().getMonth()+1;
    if(month<10){
      month = "0"+month;
    }
    this.setData({date:year+"-"+month});
    this.doQuery();
  },
  async doQuery(){
    let newsDate = this.data.date.replace("-","");
    let {items} = await webApi.getMessageList({newsDate});
    this.setData({list:items})
  },
  bindDateChange(e){
    let value = e.detail.value;
    this.setData({date:value});
    this.doQuery();
  },
  async toDetail(e){
    let {item} = e.currentTarget.dataset;
    if(item.pushState!=3){
      let yyyyMMId = this.data.date.replace("-","")+"_"+item.id;
      await webApi.updateMessage({yyyyMMId});
      this.doQuery();
    }
    let orderId = JSON.parse(item.pushParams).orderId;
    wx.navigateTo({
      url: `/packages/order/orderDetail/orderDetail?orderId=${orderId}`,
    })
  }
})