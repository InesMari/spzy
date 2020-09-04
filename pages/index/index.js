import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../common/commonImport';
import md5 from '../../lib/md5.js';
import req from '../../utils/request';

Page({
  data: {
    showAd:false,   //广告弹窗
    isShowTips:false, //产品介绍弹窗
    orderList:[],   //订单列表
    mineType:1,     // 寄出/收到
    isSeeMore:false, //是否查看更多
    page:1,         //列表页码
  },
  onShow(){
    this.init();
  },
  //下拉刷新
  async onPullDownRefresh(){
    await this.init();
    const timeout = setTimeout(()=>{
      wx.stopPullDownRefresh();
    },500)
  },
  onReachBottom(){
    this.scrolltolowerHandler();
  },
  async onLoad() {
    try{      
      this.isUpdate();  //强制更新
      await this.isLogin();
      await webApi.loginState();
      let unlogin = wx.getStorageSync("UNLOGIN");//是否登录
      this.setData({ unlogin});
      this.init();
    }catch(e){
      console.log(e);
    }
  },
  async isUpdate(){
    //发布前更改后台版本号，
    // await webApi.setVersion({version:appConfig.version});
    let version = await webApi.getVersion();
    console.log(version);
    if(version==appConfig.version) return;
    //后台版本号与前端版本号不一时强制更新
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
  },
  async init() {
    try{
      let nav = this.selectComponent("#nav");
      nav.change();
      this.queryOrder(true); 
      let productList = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.PRODUCT_TYPE });
      let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);  //查询用户类型
      this.setData({ productList, userType})
    }catch(e){
      console.log(e);
    }
  },
  async isLogin(){
    try {
      //判断session_key是否有效
      let checkSession = await wxApi.checkSession();
      //有效是请求后台查看后台登录是否过期
      if (checkSession.errMsg != "checkSession:ok") {
        wx.reLaunch({ url: '/pages/login/login' });
      }
    } catch (e) {
      console.log(e)
    }
  },
  setMineType(e) {
    let mineType = e.currentTarget.dataset.type;
    this.setData({ mineType});
    this.queryOrder(true);
  },
  //首页运单跟踪查询
  async queryOrder(clear) {
    try{
      if (clear){
        this.setData({page:1});
      }
      let {mineType,page} = this.data;
      let { items, hasNext } = await webApi.orderList({ mineType, page });
      if (clear) {
        this.setData({ orderList: [] });
      }
      this.setData({ orderList: [...this.data.orderList, ...items], hasNext})
    } catch (e) {
      console.log(e)
    }
  },
  inputSetData(e) {
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.setData({ [key]: value });
  },
  //滚动加载
  scrolltolowerHandler() {
    if (this.data.isSeeMore && this.data.hasNext) {
      this.setData({ page: ++this.data.page });
      this.queryOrder();
    }
  },
  //查看更多
  seeMore(){
    this.setData({ isSeeMore: true })
    this.queryOrder();
  },
  //条件查询
  async queryTrackingNum() {
    let { orderId, showTypeList} = await webApi.queryTrackingNum({ trackingNum: this.data.trackingNum });
    if (util.isNotBlank(orderId)){
      wx.navigateTo({
        url: `/packages/order/orderDetail/orderDetail?orderId=${orderId}&showTypeList=${showTypeList}`,
      })
    }else{
      wxApi.showModal("没查询到该订单号。")
    }
  },
  // 显示快递弹窗
  async showTips(e) {
    //b端不查看详情
    if(this.data.userType == 2) return;
    let productType = e.currentTarget.dataset.type;
    let productDetail = await webApi.productDetail({ productType });
    this.setData({ isShowTips: true, productDetail });
  },
  //隐藏快递弹窗
  hideTips() {
    this.setData({ isShowTips: false });
  },
  //隐藏我的优惠广告弹窗
  hideAd(){
    this.setData({ showAd: false });
  },
  //跳转到我的优惠界面
  toDiscount(){
    wx.navigateTo({ url: '/packages/other/discount/discount' });
  },
  toLogin(){
    req.reLogin();
  },
  //扫码
  getCode(){
    let _this = this;
    wx.scanCode({
      success(res) {
        console.log(res);
        _this.setData({ trackingNum: res.result }); 
        _this.queryTrackingNum();
      }
    })
  },
  //消息
  toMsg(){
    wxApi.showToast("暂未开放，敬请期待~");
  },
  //订单详情
  toDetail(e) {
    let { id, type } = e.currentTarget.dataset;
    // if (this.data.mineType==2) return;  //我收到的不能查到订单详情
    let showTypeList = type.toString();
    wx.navigateTo({
      url: `/packages/order/orderDetail/orderDetail?orderId=${id}&showTypeList=${showTypeList}&mineType=${this.data.mineType}`,
    })
  },
  // 长按复制文本
  async copyText(e){
    let {label,value} = e.currentTarget.dataset;
    await wxApi.setClipboardData(value);
    wxApi.showToast(`${label}已复制`);
  }
})
