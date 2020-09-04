import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../../common/commonImport';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    invoiceTypeIndex: null,
    list:[],
    query:{
      page:1,
      rows:20
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad (options) {    
    let invoiceTypeList = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.INVOICE_TYPE});
    let userId = wx.getStorageSync(APP_CONST.STORAGE.USER_ID);  //查询用户id
    this.setData({'query.userId':userId,invoiceTypeList});
    this.doQuery();
  },
  //下拉刷新
  async onPullDownRefresh() {
    await this.doQuery(true);
    const timeout = setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500)
  },
  // 滚动到底部加载下一页数据
  onReachBottom() {
    this.scrolltolowerHandler();
  },
  async doQuery(clear) {
    if (clear) {
      this.setData({ invoiceTypeIndex: null, ['query.page']: 1 });
    }
    let { items, hasNext } = await webApi.invoiceHistory(this.data.query);
    items.forEach(el => {
      let arr = el.createDate.split(' ');
      el.date = arr[0];
      el.time = arr[1];
    })
    if (clear) {
      this.setData({ list: [] });
    }
    this.setData({ list: [...this.data.list, ...items], hasNext })
  },
  //滚动加载
  scrolltolowerHandler() {
    if (this.data.hasNext) {
      this.setData({ 'query.page': ++this.data.query.page });
      this.doQuery();
    }
  },
  filter(){
    this.setData({ isShowPopover:true});
  },
  // 开始时间
  changeStartDate(e){
    this.setData({ ['query.createDateStart']: e.detail });
  },
  // 结束时间
  changeEndDate(e) {
    this.setData({ ['query.createDateEnd']: e.detail });
  },
  //选择消费方式
  invoiceTypeChange(e) {
    let { value } = e.detail;
    this.setData({
      "query.invoiceType": this.data.invoiceTypeList[value].codeValue,
      invoiceTypeIndex: value
    })
  },
  // 单号
  inputOrdId(e){
    let { value } = e.detail;
    this.setData({ ['query.trackingNum']: value });
  },
  // 清空筛选条件
  cleanSearch(){
    this.setData({
      invoiceTypeIndex:null,
      query:{
        page: this.data.query.page,
        rows: 20
      },
    });
    this.selectComponent("#startDate").cleanDate();
    this.selectComponent("#endDate").cleanDate();
  },
  // 取消筛选
  cancelFilter(){
    this.setData({ isShowPopover:false});
  },
  sureFilter(){
    this.cancelFilter();
    this.doQuery(true);
  },
  toDetail(e){
    let {invoiceId} = e.currentTarget.dataset;
    wx.navigateTo({ url: `/packages/personal/applyInvoice/applyInvoice?invoiceId=${invoiceId}` });
  }
})