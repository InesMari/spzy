import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isShowTips: false,
    info:{
      
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ info}) {
    info = JSON.parse(decodeURIComponent(info));
    let ordNumType = wx.getStorageSync(APP_CONST.STORAGE.ORD_NUM_TYPE);  //查询单号类型(详细见下单页头部注释)
    this.setData({ info, receiptIndex: info.receiptType,ordNumType})
    this.init();
  },
  //查询回单类型
  async init() {
    let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);
    this.setData({ userType });
    let receiptList = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.RECEIPT_TYPE });
    let maxLowestCost = await webApi.getMaxLowestCost(); //获取保险与代收货款最大值
    //遍历回显回单类型
    receiptList.forEach((el,index) => {
      if (el.codeValue == this.data.info.receiptType){
        this.setData({ receiptIndex:index});
      }
    })
    this.setData({ receiptList, maxLowestCost });
    this.getOrdNumRule();
  },
  async getOrdNumRule(){
    let {items} = await webApi.getOrdNumRule({orderType:this.data.info.orderType});
    items.forEach(el => {
      //客户单号规则
      if(el.checkKey=="ordNum"){
        this.setData({ordNumRule:el});
      }
      //采购单号规则
      if(el.checkKey=="purchaseNum"){
        this.setData({purchaseNumRule:el});
      }
    })
  },
  inputSetData(e) {
    let key = e.target.dataset.key;
    let value = e.detail.value;
    this.data.info[key] = value;
    this.setData({ info: this.data.info });
  },
  checkValue(e) {
    let key = e.target.dataset.key;
    let value = e.detail.value;
    this.checkMax(value,key);
  },
  checkMax(value,key){
    let { maxLowestCost, maxCost } = this.data.maxLowestCost;
    if (key == "goodsPriceDouble" && Number(maxLowestCost) < value) {
      wxApi.showModal(`货物保价最高${maxLowestCost}元`)
      return false
    }
    if (key == "collectingMoneyDouble" && Number(maxCost) < value) {
      wxApi.showModal(`代收货款最高${maxCost}元`)
      return false
    }
    return true
  },
  //选择运单类型
  receiptChange(e) {
    let { value } = e.detail;
    this.setData({
      "info.receiptType": this.data.receiptList[value].codeValue,
      "info.receiptTypeName": this.data.receiptList[value].codeName,
      receiptIndex: value
    })
  },
  // 显示快递弹窗
  showTips() {
    this.setData({ isShowTips: true });
  },
  //隐藏快递弹窗
  hideTips() {
    this.setData({ isShowTips: false });
  },
  sure(){
    let { collectingMoneyDouble, goodsCount, goodsPriceDouble, receiptType } = this.data.info;
    let prePage = util.getPrePage();
    prePage.serviceCallback(this.data.info);
    this.back();
  },
  back(){
    wx.navigateBack();
  }
})