import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    info:{
      weight:1,
    },
    isShowCalcFee:false,
    clacFeeList:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) {

  },
  goodsPriceSetData(e) {
    let value = e.detail.value;
    this.setData({ ['info.goodsPrice']: value });
  },
  inputSetData(e) {
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.data.info[key] = value;
    this.setData({ info: this.data.info });
  },
  startRegionChange(e) {
    let { province, city, district } = e.detail.value;
    this.setData({
      ['info.startCityName']: province.name + city.name + district.name,
      ['info.startProvinceId']: province.id,
      ['info.startCityId']: city.id,
      ['info.startDistrictId']: district.id,
    })
  },
  endRegionChange(e) {
    let { province, city, district } = e.detail.value;
    this.setData({
      ['info.endCityName']: province.name + city.name + district.name,
      ['info.endProvinceId']: province.id,
      ['info.endCityId']: city.id,
      ['info.endDistrictId']: district.id,
    })
  },
  reduceWeight() {
    if (this.data.info.weight == 1) return
    let weight  = --this.data.info.weight;
    this.setData({ ['info.weight']: weight });
  },
  addWeight() {
    let weight = ++this.data.info.weight;
    this.setData({ ['info.weight']: weight });
  },
  async calcFee() {
    let info = this.data.info;
    if (util.isBlank(info.startCityName)){
      wxApi.showToast('请选择出发地');
      return
    }
    if (util.isBlank(info.endCityName)) {
      wxApi.showToast('请选择目的地');
      return
    }
    if (util.isBlank(info.startCityName)) {
      wxApi.showToast('请填写货物保价');
      return
    }
    let res = await webApi.clientCalcFee(this.data.info);
    // 计算费用最低
    // let minFee = 0;
    // let minFeeIndex = 0;
    // res.forEach((item,index) => {
    //   let fee = Number(item.sumCost);
    //   if (index==0){
    //     minFee = fee;
    //   }
    //   if (minFee>fee){
    //     minFee = fee;
    //   }
    // })
    // res.forEach(item => {
    //   let fee = Number(item.sumCost);
    //   if (fee == minFee){
    //     item.recommend = true;
    //   }
    // })
    //遍历查看费用是否未  数字
    res.forEach(item => {
      if (isNaN(Number(item.sumCost))){
        item.noFee = true;
      }else{
        item.noFee = false;
      }
    })
    this.setData({ clacFeeList:res, isShowCalcFee:true})
  },
  hideFeeDialog(){
    this.setData({ isShowCalcFee: false })
  },
  toBilling(){
    wx.navigateTo({ url: '/packages/order/billing/billing' });
  }
})