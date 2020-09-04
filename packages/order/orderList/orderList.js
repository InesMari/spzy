import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderType:"1",  //订单状态
    list:[],    //订单列表数据
    mineType:'', //待确认订单，b端时tab栏状态,2:收到，1:发起
    intervalList:[],  //定时器储存数组
    currentOrderId:'',  //当前选择订单id
    isShowCancelOrder:false,  //取消订单弹窗
    isShowRejectOrder:false, //拒绝三方结算订单弹窗
    allInName:'',//查询条件
    page:1,
    isRefresh:false,
    hideWaitSure:false, //b端是否隐藏待确认
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.checkWaitSure();
    this.doQuery();
    let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);
    this.setData({ userType})
  },
  //识别是否展示待确认
  async checkWaitSure(){
    let {isJudge} = await webApi.isOpenTriplePayment();  //是否开启三方审核
    let { items } = await webApi.getOrderList({ orderType: 2, mineType: 2});
    // 关闭三方审核，且我收到的没数据时，不展示代取件tab
    if(items.length==0&&!isJudge){
      this.setData({hideWaitSure:true})
    }
  },
  async doQuery(clean) {
    if (clean) {  //clean为true的时候清空数组和页码
      this.setData({ page: 1 });
    }
    let { items, hasNext } = await webApi.getOrderList({ orderType: this.data.orderType, mineType: this.data.mineType, allInName: this.data.allInName,page:this.data.page});
    if (clean) {  //clean为true的时候清空数组
      this.setData({ list: [] });
    }
    this.initBtnEntity(items); //初始化按钮权限
    this.setData({ list: [...this.data.list, ...items], hasNext, isRefresh: false});
    this.clearTimeDown();
    //代取件时计算倒计时
    if (this.data.orderType ==1){
      this.getTimeDown();
    }
  },
  //初始化按钮权限
  initBtnEntity(items) {
    items.forEach(el => {
      if (el.showTypeList.includes(1)) {  //是否有修改按钮权限
        el.showEdit = true;
      }
      if (el.showTypeList.includes(2)) {  //是否有取消按钮权限
        el.showCancel = true;
      }
      if (el.showTypeList.includes(3)) {  //是否有三方结算按钮权限
        el.showPayment = true;
      }
      if (el.showTypeList.includes(4)) {  //是否有付款按钮权限
        el.showPay = true;
      }
      if (el.showTypeList.includes(5)) {  //是否有重新按钮权限
        el.showRebilling = true;
      }
      if (el.showTypeList.includes(7)) {  //是否有付款按钮权限,但按钮禁用
        el.showPayDisabled = true;
      }
    })
  },
  scrolltolowerHandler(){
    if (this.data.hasNext) {
      this.setData({ page: ++this.data.page });
      this.doQuery()
    }
  },
  //条件查询
  searchList(e) {
    let value = e.detail.value;
    this.setData({ allInName: value });
    //延迟查询
    if (this.data.searchTimeout) clearTimeout(this.data.searchTimeout);
    this.data.searchTimeout = setTimeout(() => {
      this.doQuery(true)
      clearTimeout(this.data.searchTimeout);
    }, 300)
  },
  //扫码
  getCode() {
    let _this = this;
    wx.scanCode({
      success(res) {
        _this.setData({ allInName: res.result, scanValue: res.result });
        _this.doQuery(true);
      }
    })
  },
  //订单状态切换
  changeState(e){
    let {state} = e.currentTarget.dataset;
    if(state==2){
      this.setData({ mineType: 2 })
    }else{
      this.setData({ mineType: '' })
    }
    this.setData({ orderType: state, allInName: "", scanValue:""});
    this.doQuery(true)
  },
  // 待确认订单，b端时tab栏状态切换
  queryOrder(e){
    let { type } = e.currentTarget.dataset;
    this.setData({ mineType: type })
    this.doQuery(true)
  },
  getTimeDown(){
    //获取需要倒计时的时间
    this.data.list.forEach((item, index) => {
      if (util.isNotBlank(item.dateTime) && Number(item.dateTime)>0){
        this.cutDown(item.dateTime,index);
      }
    })
  },
  //清空倒计时的循环器
  clearTimeDown(){
    this.data.intervalList.forEach(el => {
      clearInterval(el);
    })
  },
  cutDown(time,index){
    time = parseInt(time);
    this.data.intervalList[index] = setInterval(() => {
      time--;
      let second = time%60%60;
      let min = parseInt(time/60)%60;
      let hour = parseInt(time/60/60)%24
      let day = parseInt(time/60/60/24);
      if (second < 10) second = '0' + second;
      if (min < 10) min = '0' + min;
      if (hour < 10) hour = '0' + hour;
      if (day>0){
        day = day + "天";
      }else{
        day = ''
      }
      let timeDown = day + hour + ':' + min + ':' + second;
      this.setData({ ['list['+index+'].timeDown']: timeDown})
    },1000)
  },

  //展示取消订单弹窗
  showCancelOrder(e){
    let {id} = e.currentTarget.dataset;
    this.setData({ currentOrderId: id,isShowCancelOrder:true});
  },
  //隐藏取消订单弹窗
  hideCancelOrder(){
    this.setData({ isShowCancelOrder: false, orderCancelMark:'' });
  },
  inputCancelMark(e){
    this.setData({ orderCancelMark:e.detail.value})
  },
  //取消订单
  async cancelOrder(){
    this.setData({ isShowCancelOrder: false, orderCancelMark:''})
    let res = await webApi.cancelOrder({ orderId: this.data.currentOrderId, cancelRemark : this.data.orderCancelMark});
    if(res.result == 0){
      await wxApi.showModal({ title: '提示', content: '取消订单成功', showCancel: false });
      this.doQuery(true);
    }
  },
  //修改订单
  editOrder(e){
    let { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/order/billing/billing?orderId=${id}`,
    })
  },
  //展示拒绝三方结算订单弹窗
  showRejectOrder(e) {
    let { id } = e.currentTarget.dataset;
    this.setData({ currentOrderId: id, isShowRejectOrder: true });
  },
  //隐藏拒绝三方结算订单弹窗
  hideRejectOrder() {
    this.setData({ isShowRejectOrder: false, ordeRejectMark:'' });
  },
  inputRejectMark(e) {
    this.setData({ ordeRejectMark: e.detail.value })
  },
  //拒绝三方结算订单
  async rejectOrder() {
    this.setData({ isShowRejectOrder: false, ordeRejectMark:'' })
    let res = await webApi.rejectOrder({ orderId: this.data.currentOrderId, rejectlRemark: this.data.ordeRejectMark });
    if (res.result == 0) {
      await wxApi.showModal({ title: '提示', content: '已拒绝', showCancel: false });
      this.doQuery(true);
    }
  },
  //同意三方结算订单
  async agreeOrder(e){
    let { id } = e.currentTarget.dataset;
    let { confirm } = await wxApi.showModal({ title: '提示', content: '是否同意该订单' });
    if (confirm){
      let res = await webApi.agreeOrder({ orderId: id});
      if (res.result == 0) {
        await wxApi.showModal({ title: '提示', content: '已同意', showCancel: false });
        this.doQuery(true);
      }
    }
  },
  //重新开单
  async reBilling(e) {
    let { id } = e.currentTarget.dataset;
    let { confirm } = await wxApi.showModal({ title: '提示', content: '是否要重新开单' });
    if (confirm) {
      let res = await webApi.reBilling({ orderId: id });
      if (res.result == 0) {
        await wxApi.showModal({ title: '提示', content: '已重新开单', showCancel: false });
        this.doQuery(true);
      }
    }
  },
  //拨打电话
  phoneCall(e){
    let {phone} = e.currentTarget.dataset;
    wx.makePhoneCall({ phoneNumber:phone});
  },
  toupper(){
    this.setData({ isRefresh:true})
    this.doQuery(true);
  },
  topay(e){
    let { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/order/orderPay/orderPay?orderId=${id}`,
    })
  },
  toDetail(e) {
    let { id, type } = e.currentTarget.dataset;
    let showTypeList = type.toString();
    wx.navigateTo({
      url: `/packages/order/orderDetail/orderDetail?orderId=${id}&showTypeList=${showTypeList}`,
    })
  },
  // 长按复制文本
  async copyText(e){
    let {label,value} = e.currentTarget.dataset;
    await wxApi.setClipboardData(value);
    wxApi.showToast(`${label}已复制`);
  }
})