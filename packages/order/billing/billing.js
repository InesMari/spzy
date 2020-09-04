/**
 * isPurchase   东莞客户（夏目）
 */
/*
  *warehouseNature==4的时候是扫码客户
  *独有功能：
  *不能新增收件地址，
  *默认调拨、月结
  *客服单号改为采购单号
*/
/**
 * ordNumType逻辑
 * 1  客户单号必填
 * 2  客户单号非必填
 * 3  采购单号必填
 * 4  采购单号非必填
 */

import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
import req from '../../../utils/request';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isShowTips: false,
    isShowSelectGoods:false,
    editOrder:false,    //是否修改订单
    info:{
      
    },
    orderTypeList:[], //运单类型列表
    goodsList: [    //所寄物品选项
      { name: '服饰鞋包' },
      { name: '化妆品' },
      { name: '生活用品' },
      { name: '仪器设备' },
      { name: '文件资料' },
      { name: '食品' },
      { name: '电子产品'},
      { name: '其它' },
    ],
    isShowInputGood: false,  //展示所寄物品-输入其它
    inputGood: '', //所寄物品-输入其它暂存值
    isReadyDbClick:"",  //双击识别
    paymentTypeIndex:0, //c端结算方式默认为现付
    isShowPopover:false,  //结算门店侧边弹窗
    triplePayment: false, //三方结算
    agreement: false, //服务协议
    billingSuccess:false,//下单成功弹窗提示
    showSwiper:false,
    isScan: false, //是否从扫码流程进入
    userListIndex: 0,
    paymentTypeList:[], //结算方式
    userList: [],  //店铺列表
    isShowSelectDiy:false,//是否展示自定义字段选择弹窗
    isShowInputDiy: false,  //展示自定义字段-输入其它
    purchaseList:[],//采购人员数组
    purchaseListShow:[],//采购人员展示数组
    isShowPurchaseListPopover:false,//是否展示采购人员侧边弹窗
    isSave:false, //是否正常保存
    orderTransportTypeList:[],//供应商类型/运输方式枚举
  },

  /**
   * 生命周期函数--监听页面加载
   * orderId:单号，修改订单时传入
   * param:带参，扫码填写发货人信息是返回
   * isScan:是否从扫码流程进入
   */
  onLoad({ orderId,param,isScan }) {
    this.startInit(orderId, param, isScan)
    if (util.isNotBlank(isScan)){
      this.setData({ isScan});
    }
  },
  async startInit(orderId, param, isScan) {  
    let { isOperating} = await webApi.isReadStep(); //是否阅读过操作流程  
    if (isOperating === false && !isScan){  //扫码进来不展示操作流程提示
      this.setData({ showSwiper:true})
    }    
    await this.init();  //初始化开单
    if (util.isNotBlank(orderId)) {
      await this.initEditOrder(orderId); //初始化修改订单
    } else {
      await this.initInfo();    
    }
    //扫码等填写地址后数据回显
    if(util.isNotBlank(param)){
      let params = JSON.parse(decodeURIComponent(param));
      this.addressCallback(params);
    }
  },
  async init() {
    let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);  //查询用户类型
    let userLogin = wx.getStorageSync(APP_CONST.STORAGE.LOGIN_ACCT);  //查询手机号
    // let ordNumType = wx.getStorageSync(APP_CONST.STORAGE.ORD_NUM_TYPE);  //查询单号类型(详细见头部注释)
    // let purchaseNumRule = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.PURCHASE_NUM_RULE});
    //isUserWx为true有个人账户，isClient为true有企业账户
    let { isUserWx, isClient } = await webApi.getPersonalInfo();
    
    let userIdRes= await webApi.getUserId({ userLogin });//获取用户id
    if (util.isNotBlank(userIdRes)&&util.isNotBlank(userIdRes.userId)) {
      let userList = await webApi.getUserList({ userId:userIdRes.userId });  //获取店铺列表信息
      this.setData({userList})
    }
    let paymentTypeList = await webApi.paymentType(); //查询结算方式
    //查询运输方式
    let orderTransportTypeList = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.ORDER_TRANSPORT_TYPE_WX });
    let orderTypeList = await webApi.getOrderType();  //查询运单类型
    let { isJudge } = await webApi.isOpenTriplePayment();  //是否开启三方审核    
    let maxLowestCost = await webApi.getMaxLowestCost(); //获取保险与代收货款最大值
    if (userType ==2){  //b端客户时查询自定义字段
      let customize = await webApi.getCustomize();
      if(customize.selectType==1){
        customize.customizeList.push({enumerateName:'其它'})
      }
      this.setData({ customize, ['info.customizeFiledName']: customize.fieldName,customizeType:customize.selectType});
    }
    // 判断是否东莞客户PURCHASE_TENANT
    let {cfgValue} = await webApi.getConfig({ cfgName: "PURCHASE_TENANT" });  //查询东莞用户id
    let tenantId = wx.getStorageSync(APP_CONST.STORAGE.TENANT_ID);  //查询用户类型
    console.log(cfgValue);
    if(cfgValue==tenantId){
      this.setData({isPurchase:true});
    }
    let purchaseList = await webApi.getPurchaseList();  //查询采购人员列表
    purchaseList.forEach(item => {
      item.showName = `${item.userName}/${item.userLogin}`;
    })
    this.setData({ 
      userType, 
      // ordNumType,
      // purchaseNumRule:purchaseNumRule[0],
      paymentTypeList, 
      orderTypeList, 
      isJudge, 
      isUserWx, 
      isClient, 
      triplePayment: false,  //取消勾选三方结算
      agreement:false,      //取消勾选协议
      logistics:[],         //清空运输类型
      orderTransportTypeList,
      orderTypeIndex:0,   //运单类型默认第一个
      maxLowestCost,
      purchaseList,
      purchaseListShow:purchaseList
    });
  },
  async initInfo(){
    let info = {
      packageWeight: 1,
      packageNumber: 1,
      paymentType: this.data.paymentTypeList[this.data.paymentTypeIndex].codeValue,
      orderType:this.data.orderTypeList[0].codeValue,
    }
    this.setData({info})
    //默认地址
    let { userType} = this.data;
    if (userType == 2) {
      //b端查询默认发件门店
      let consignorInfo = await webApi.getSiteInfo({ addressType: 1 }); 
      if (util.isNotBlank(consignorInfo)) {   //有默认门店
        await this.addressCallback(consignorInfo, 1);
      }else{  //没有默认门店，查询是否只有单个地址，单个则默认选择
        let {items} = await webApi.siteList({ addressType:1});
        if(items.length==1){
          await this.addressCallback(items[0], 1);
        }
      }
    } else if (userType == 4) {
      //c端查询默认发件人
      let consignorInfo = await webApi.getSiteInfo({ addressType: 1 });
      if (util.isNotBlank(consignorInfo)) {
        await this.addressCallback(consignorInfo, 1);
      }
      //c端查询默认收件人
      let consigneeInfo = await webApi.getSiteInfo({ addressType: 2 });
      if (util.isNotBlank(consigneeInfo)) {
        await this.addressCallback(consigneeInfo, 2);
      }
    }
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
  //初始化修改订单
  async initEditOrder(orderId){
    let res = await webApi.orderDetail({ orderId });
    let info = { ...res.order, goods:res.goods, ...res.orderExt, ...res.orderFee};
    //寄件人完整地址
    info.sourceAddressName = info.sourceProvinceName + info.sourceCityName + info.sourceCountyName + info.sourceStreetName + info.sourceAddress;
    //查询是否扫码客户
    if(util.isNotBlank(res.cmWarehouse)){
      this.setData({warehouseNature:res.cmWarehouse.warehouseNature});
    }
    //东莞客户运单类型为任意调拨时认为扫码用户处理   
    if(this.data.isPurchase&&info.orderType==2){
      this.setData({warehouseNature:4});
    }
    //收件人完整地址
    info.destAddressName = info.destProvinceName + info.destCityName + info.destCountyName + info.destStreetName + info.destAddress;
    // 上门时间回显
    if (util.isNotBlank(info.preEndPickupDate)){
      info.prePickupDate = info.preBeginPickupDate + "," + info.preEndPickupDate;
      info.prePickupDateShow = info.preBeginPickupDate + "-" + info.preEndPickupDate.split(" ")[1];
    }
    //采购人员回显
    let {purchaseList} = this.data;
    if (util.isNotBlank(info.purchaseUserId) && purchaseList.length>0){
      purchaseList.forEach(item => {
        if(info.purchaseUserId == item.userId){
          this.setData({
            purchaseShow : item.showName,
          })
        }
      })
    }
    let agreement = true; //同意服务协议
    if (Number(res.order.payConsignorId)>0){
      var triplePayment = true
    }
    this.setData({ info, agreement, editOrder: true, triplePayment});
    this.initPicker();  //picker组件数据回显
    this.calcFee(); //计算费用
    this.getOrdNumRule();
  },
  //切换账号
  async changeUser() {
    let userLogin = wx.getStorageSync(APP_CONST.STORAGE.LOGIN_ACCT);
    if (this.data.userType == 2){
      var attributionType = 4;
    } else if(this.data.userType == 4){
      var attributionType = 2;
    }    
    let {userList,userListIndex} = this.data;
    let id = undefined;
    if (userList.length > 0 && attributionType==2){
      id = userList[userListIndex].id;
    }
    let res = await webApi.changeUser({ attributionType, userLogin,id });
    if (res.result == '0') {
      await req.resetStorage(res);
      this.setData({warehouseNature:null});
      await this.startInit();
    }
  },
  // picker组件数据回显（修改订单）
  initPicker(){
    //回单类型
    this.data.orderTypeList.forEach((item,index) => {
      if (item.codeValue == this.data.info.orderType){
        this.setData({ 
          orderTypeIndex:index,
          "info.orderType": item.codeValue,
        });
      }
    })
    //结算方式
    this.data.paymentTypeList.forEach((item, index) => {
      if (item.codeValue == this.data.info.paymentType) {
        this.setData({ paymentTypeIndex: index });
      }
    })
  },
  //查询地址列表（结算门店）
  async querySiteList() {
    let {items} = await webApi.siteList({ allName: this.data.allName, addressType:3});
    let consignor = '';
    let consignee = '';
    items.forEach((el,index) => {
      if(el.warehouseId==this.data.info.consignorId){
        consignor = el;
        items.splice(index,1);
      }
      if(el.warehouseId==this.data.info.consigneeId){
        consignee = el;
        items.splice(index,1);
      }
    })
    if(util.isNotBlank(consignor)){
      items.unshift(consignor);
    }
    if(util.isNotBlank(consignee)){
      items.unshift(consignee);
    }
    this.setData({siteList:items });
  },
  //选择运单类型
  orderTypeChange(e) {
    let { value } = e.detail;
    let codeValue = this.data.orderTypeList[value].codeValue;
    this.setData({
      "info.orderType": codeValue,
      orderTypeIndex: value
    })
    this.getOrdNumRule();
    //东莞客户特殊逻辑
    if(this.data.isPurchase){      
      if(codeValue==2){   //任意调拨情况下认为是扫码用户
        this.setData({warehouseNature:4});
      }else{  //非任意调拨复原成发货店铺所属类型
        this.setData({warehouseNature:this.data.addressWarehouseNature});
      }
    }
    //东莞客户特殊逻辑 end
    let userRoleType = wx.getStorageSync(APP_CONST.STORAGE.USER_ROLE_TYPE);
    if(userRoleType!=3&&userRoleType!=6){   //店长或者店员是默认选择店铺，不清空
      this.cleanConsignor();//清空寄件人
    }
    this.cleanConsignee();//清空收件人
    this.calcFee();
  },
  //选择供应商类型
  orderTransportTypeChange(e) {
    let { value } = e.detail;
    this.setData({
      "info.transportType": this.data.orderTransportTypeList[value].codeValue,
      orderTransportTypeIndex: value
    })
  },
  //选择结算方式
  paymentTypeChange(e) {
    let { value } = e.detail;
    this.setData({
      "info.paymentType": this.data.paymentTypeList[value].codeValue,
      paymentTypeIndex: value
    })
    this.calcFee();
  },
  //选择自定义字段逻辑
  customizeChange(e) {
    let { value } = e.detail;
    this.setData({
      "info.customizeFiledValue": this.data.customize.customizeList[value].enumerateName,
      customizeIndex: value
    })
  },
  inputDiySetData(e){
    let { value } = e.detail;
    this.setData({
      inputDiy: value
    })
  },
  showDiySelect(){
    this.setData({isShowSelectDiy:true})
  },
  hideDiySelect(){
    this.setData({isShowSelectDiy:false});
  },  
  chooseDiy(e){
    this.data.customize.customizeList.forEach((item,index) => {
      this.setData({ ['customize.customizeList[' + index + '].active']: false });
    })
    let {diy,index} = e.currentTarget.dataset;
    if(diy.enumerateName=="其它"){
      this.setData({isShowInputDiy:true})
    }else{
      this.setData({ isShowInputDiy: false })
    }
    this.setData({ ['customize.customizeList[' + index +'].active']:true});
  },
  sureDiy(){
    this.data.customize.customizeList.forEach(item => {
      if (item.active){
        if (item.enumerateName == "其它"){
          this.setData({ ['info.customizeFiledValue']: this.data.inputDiy });
        }else{
          this.setData({ ['info.customizeFiledValue']: item.enumerateName });
        }
        this.hideDiySelect();
      }
    })
  },
  //选择自定义字段逻辑 - end
  // 东莞客户采购逻辑
  filterPurchaseList(e){
    let { value } = e.detail;
    let purchaseListShow = [];
    this.data.purchaseList.forEach(item => {
      if(item.showName.indexOf(value)>-1){
        purchaseListShow.push(item);
      }
    })
    this.setData({purchaseListShow})
  },
  selectPurchase(e){
    let {item} = e.currentTarget.dataset;
    this.setData({
      ['info.purchaseUserId'] : item.userId,
      ['info.purchaseUserName'] : item.userName,
      purchaseShow : item.showName,
      isShowPurchaseListPopover:false
    })
  },
  showPurchaseFilter(){
    this.setData({isShowPurchaseListPopover:true});
  },
  // 东莞客户采购逻辑 end
  //地址选择回调
  async addressCallback(item={}, addressType){
    let { provinceName, cityName, districtName, warehouseAddress } = item;
    if (addressType==1){    //寄件人
      this.setData({
        ['info.consignorId']: item.warehouseId,
        ['info.consignorName']: item.warehouseFullName,
        ['info.consignorLinkmanName']: item.warehousePeople,
        ['info.consignorBill']: item.warehousePhone,
        ['info.consignorTelephone']: item.warehouseTelephone,
        ['info.sourceProvince']: item.provinceId,
        ['info.sourceProvinceName']: item.provinceName,
        ['info.sourceCity']: item.cityId,
        ['info.sourceCityName']: item.cityName,
        ['info.sourceCounty']: item.districtId,
        ['info.sourceCountyName']: item.districtName,
        ['info.sourceAddress']: item.warehouseAddress,
        ['info.sourceAddressName']: provinceName + (cityName ? cityName : '') + (districtName ? districtName : '') + (warehouseAddress ? warehouseAddress:''),
        "brandId":item.brandId,
      })
      this.cleanConsignee();//清空收件人
      if(item.warehouseNature == 4){  //扫码店铺
        var orderTypeList = await webApi.getScanUserOrderType();  //扫码店铺查询运单类型
        //扫码发货如果如果收货地址只有一个的时候默认回显
        let { items } = await webApi.siteList({ addressType:2,warehouseNature:4  });
        if(items.length==1){
          this.addressCallback(items[0],2);
        }
        orderTypeList.forEach((el,index) => { //扫码店铺默认任意调拨
          if(el.codeValue == 2){
            this.setData({
              orderTypeIndex : index,
              "info.orderType": el.codeValue
            })
          }
        })
      }else{
        var orderTypeList = await webApi.getOrderType();  //非扫码店铺查询运单类型
        //运单类型没有值时默认赋值第一个
        if(util.isBlank(this.data.info.orderType)){
          this.setData({"info.orderType": orderTypeList[0].codeValue,orderTypeIndex : 0,})
        }
      }
      this.setData({
        orderTypeList,
        warehouseNature:item.warehouseNature,
        addressWarehouseNature:item.warehouseNature,  //存储店铺是否属于扫码用户
      })
    } else if(addressType == 2){    //收件人
      this.setData({
        ['info.consigneeId']: item.warehouseId,
        ['info.consigneeName']: item.warehouseFullName,
        ['info.consigneeLinkmanName']: item.warehousePeople,
        ['info.consigneeBill']: item.warehousePhone,
        ['info.consigneeTelephone']: item.warehouseTelephone,
        ['info.destProvince']: item.provinceId,
        ['info.destProvinceName']: item.provinceName,
        ['info.destCity']: item.cityId,
        ['info.destCityName']: item.cityName,
        ['info.destCounty']: item.districtId,
        ['info.destCountyName']: item.districtName,
        ['info.destAddress']: item.warehouseAddress,
        ['info.destAddressName']: provinceName + (cityName ? cityName : '') + (districtName ? districtName : '') + (warehouseAddress ? warehouseAddress : ''),
      })
    }
    this.calcFee();
  },
  //清空寄件人
  cleanConsignor(){    
    this.setData({
      ['info.consignorId']: '',
      ['info.consignorName']: '',
      ['info.consignorLinkmanName']: '',
      ['info.consignorBill']: '',
      ['info.consignorTelephone']: '',
      ['info.sourceProvince']: '',
      ['info.sourceProvinceName']: '',
      ['info.sourceCity']: '',
      ['info.sourceCityName']: '',
      ['info.sourceCounty']: '',
      ['info.sourceCountyName']: '',
      ['info.sourceAddress']: '',
      ['info.sourceAddressName']: '',
      "brandId":'',
    })
  },
  //清空收件人
  cleanConsignee(){    
    this.setData({
      ['info.consigneeId']: '',
      ['info.consigneeName']: '',
      ['info.consigneeLinkmanName']: '',
      ['info.consigneeBill']: '',
      ['info.consigneeTelephone']: '',
      ['info.destProvince']: '',
      ['info.destProvinceName']: '',
      ['info.destCity']: '',
      ['info.destCityName']: '',
      ['info.destCounty']: '',
      ['info.destCountyName']: '',
      ['info.destAddress']: '',
      ['info.destAddressName']: '',
    })
  },
  //获取上门时间
  getTimeRange(e){
    let {value} = e.detail;
    let arr = value.split(' ');
    let timeArr = arr[1].split('-');
    let date = arr[0] + ' ' + timeArr[0] + ',' + arr[0] + ' ' + timeArr[1];
    this.setData({ ['info.prePickupDate']: date});
  },
  //长宽高输入计算体积
  inputCalcVolumn(e){
    let {value} = e.detail;
    let {key} = e.currentTarget.dataset;
    this.setData({ [key]: value});
    let {height,long,width} = this.data;
    if (util.isBlank(height)) return
    if (util.isBlank(long)) return
    if (util.isBlank(width)) return
    let volumn = (height/100 * long/100 * width/100).toFixed(4);
    this.setData({ ['info.packageVolume']: volumn });
    this.calcFee();
  },
  //产品算费
  async calcFee(){
    let { sourceProvince, sourceProvinceName, sourceCity, sourceCityName, sourceCounty, sourceCountyName, sourceAddress, destProvince, destProvinceName, destCity, destCityName, destCounty, destCountyName, destAddress, packageWeight, packageNumber, packageVolume, goodsPriceDouble, collectingMoneyDouble, orderType, consignorId, consigneeId,paymentType  } = this.data.info;
    if (util.isBlank(sourceProvince)) return
    if (util.isBlank(destProvince)) return
    if(paymentType==3){   //月结不展示费用
      this.setData({logistics:[]});
      return;
    }
    sourceProvinceName = sourceProvinceName?sourceProvinceName:"";
    sourceCityName = sourceCityName?sourceCityName:"";
    sourceCountyName = sourceCountyName?sourceCountyName:"";
    destProvinceName = destProvinceName?destProvinceName:"";
    destCityName = destCityName?destCityName:"";
    destCountyName = destCountyName?destCountyName:"";
    let params = {
      startCityName: sourceProvinceName + sourceCityName + sourceCountyName,
      startWarehouseAddress: sourceAddress,
      endCityName: destProvinceName + destCityName + destCountyName,
      endWarehouseAddress: destAddress,
      startProvinceId: sourceProvince,
      startCityId: sourceCity,
      startDistrictId: sourceCounty,
      endProvinceId: destProvince,
      endCityId: destCity,
      endDistrictId: destCounty,
      num: packageNumber,
      weight: packageWeight,
      volume: packageVolume,
      goodsPrice: goodsPriceDouble,
      collectingMoney: collectingMoneyDouble,
      orderType: orderType,
      warehouseId: consignorId,
      receiveWarehouseId: consigneeId,
      paymentType,
    }
    if (this.data.userType == 2) {  //b端算费
      var logistics = await webApi.businessCalcFee(params); 
    } else if (this.data.userType == 4){  //c端算费
      var logistics = await webApi.clientCalcFee(params);
    }
    let logisticsDefaultIndex = 0;
    let priceType = '', collectingMoneyHandlingFee = '', priceName = '', logisticsArr=[],calculateFeeParams='';
    logistics.forEach((item,index) => {
      if (item.isDefault==1){
        logisticsDefaultIndex = index;
        if(this.data.userType == 4){  //c端才有产品类型
          priceType = item.priceType;
        }
        collectingMoneyHandlingFee = item.collectingMoneyHandlingFee;
        priceName = item.priceName;
        calculateFeeParams = JSON.stringify(item);
      }
      if (item.showType == 2){  //为2的时候没有线路
        item.sumCost = "";
      }
      logisticsArr.push(item);
    })
    this.setData({ 
      logistics: logisticsArr, 
      ['info.calculateFeeParams']:calculateFeeParams,
      ['info.productType']: priceType,    //产品类型
      ['info.priceName']: priceName,    //线路名称
      ['info.procedureFeeDouble']: collectingMoneyHandlingFee,  //代收货款手续费
    })
    this.chooseFee(logisticsDefaultIndex);
  },
  inputSetData(e){
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    if(key == 'packageVolume'){
      value = value.replace(/^\D*(\d*(?:\.\d{0,4})?).*$/g, '$1')
    }
    this.data.info[key] = value;
    this.setData({ info: this.data.info });
    //算费
    if (key == 'packageNumber' || key == 'packageWeight' || key == 'packageVolume'){
      this.calcFee();
    }
  },
  //预估重量加减
  reduceWeight() {
    if (this.data.info.packageWeight==1) return
    let weight = --this.data.info.packageWeight;
    this.setData({ ['info.packageWeight']: weight });
    this.calcFee();
  },
  addWeight() {
    let weight = ++this.data.info.packageWeight;
    this.setData({ ['info.packageWeight']: weight });
    this.calcFee();
  },
  //所寄物品逻辑
  selectGoods(){
    this.setData({ isShowSelectGoods: true });
  },
  hideGoods(){
    this.setData({ isShowSelectGoods: false });
  },
  inputGoodSetData(e){
    let value = e.detail.value;
    this.setData({ inputGood:value});
  },
  chooseGood(e){
    this.data.goodsList.forEach((item,index) => {
      this.setData({ ['goodsList[' + index + '].active']: false });
    })
    let {good,index} = e.currentTarget.dataset;
    if(good.name=="其它"){
      this.setData({isShowInputGood:true})
    }else{
      this.setData({ isShowInputGood: false })
    }
    this.setData({ ['goodsList[' + index +'].active']:true});
  },
  sureGood(){
    this.data.goodsList.forEach(item => {
      if (item.active){
        if (item.name == "其它"){
          this.setData({ ['info.goodsName']: this.data.inputGood });
        }else{
          this.setData({ ['info.goodsName']: item.name });
        }
      }
    })
    this.hideGoods();
  },
  //所寄物品逻辑  end
  //增值服务选择回调
  serviceCallback(item){
    let { collectingMoneyDouble, goodsCount, goodsPriceDouble, receiptType, receiptTypeName,ordNum,purchaseNum } = item;
    this.setData({
      ['info.collectingMoneyDouble']: collectingMoneyDouble,
      ['info.goodsCount']: goodsCount,
      ['info.goodsPriceDouble']: goodsPriceDouble,
      ['info.receiptType']: receiptType,
      ['info.receiptTypeName']: receiptTypeName,
    })
    // if(this.data.ordNumType==2){
    if(!this.data.ordNumRule.checkRequired){
      this.setData({['info.ordNum']:ordNum});
    }
    if(!this.data.purchaseNumRule.checkRequired){
      this.setData({['info.purchaseNum']:purchaseNum});
    }
    this.calcFee();
  },
  // 单击选择类型，双击显示快递弹窗
  async showTips(e) {
    let {index} = e.currentTarget.dataset;
    this.chooseFee(index);
    //b端不能看产品详情
    if (this.data.userType == 2) return;
    //判断是否双击条目
    if (this.data.isReadyDbClick) {
      let productType = this.data.logistics[index].priceType;
      let productDetail = await webApi.productDetail({ productType });
      this.setData({ isShowTips: true, productDetail });
    }
    this.data.isReadyDbClick = true;
    let timeout = setTimeout(() => {
      this.data.isReadyDbClick = false;
      clearTimeout(timeout);
    }, 1000)
  },
  chooseFee(index){
    let { logistics} = this.data;
    //用户可以手动切换更高级的产品。越左产品级别越高，不能往下选。
    // if (index > logisticsDefaultIndex){
    //   wxApi.showToast("该类型不提供选择");
    //   return;
    // }
    logistics.forEach(item => {
      item.isDefault = 0;
    })
    logistics[index].isDefault = 1; //重新设置选中（推荐）状态
    let preOrderIncomeDouble = logistics[index].sumCost;  //快递费
    let priceName = logistics[index].priceName;  //线路名称
    let priceType = '';  //产品类型
    if (this.data.userType == 4) {  //c端才有产品类型
      priceType = logistics[index].priceType;
    }
    let freightDouble = logistics[index].freightDouble;  //运费
    let insurance = logistics[index].insurance;  //保险费
    let collectingMoneyHandlingFee = logistics[index].collectingMoneyHandlingFee;  //代收货款手续费
    let facelistFeeDouble = logistics[index].facelistCost;  //面单费
    let packingCostsDouble = logistics[index].publicCost;  //包装费
    let upstairFeeDouble = logistics[index].upstairsCost;  //上楼费
    let otherFeeDouble = logistics[index].otherCost;  //其他费
    let pickingCostsDouble = logistics[index].pickupCost;  //提货费
    let deliveryCostsDouble = logistics[index].deliveryCost;  //送货费
    let handingCostsDouble = logistics[index].handingCost;  //装卸费
    let floatingPriceDouble = logistics[index].floatingPrice;  //到付上浮费
    let calculateFeeParams = JSON.stringify(logistics[index]);
    
    this.setData({ 
      logistics,
      ['info.calculateFeeParams']:calculateFeeParams,
      ['info.preOrderIncomeDouble']: preOrderIncomeDouble,  //预计快递费
      ['info.productType']: priceType,    //产品类型
      ['info.priceName']: priceName,    //线路名称
      ['info.freightDouble']: freightDouble,  //运费
      ['info.insureFeeDouble']: insurance, //保险费
      ['info.collectingMoneyDouble']: collectingMoneyHandlingFee,  //代收货款手续费
      ['info.facelistFeeDouble']: facelistFeeDouble,  //面单费
      ['info.packingCostsDouble']: packingCostsDouble,  //包装费
      ['info.upstairFeeDouble']: upstairFeeDouble,  //上楼费
      ['info.otherFeeDouble']: otherFeeDouble,  //其他费
      ['info.pickingCostsDouble']: pickingCostsDouble,  //提货费
      ['info.deliveryCostsDouble']: deliveryCostsDouble,  //送货费
      ['info.handingCostsDouble']: handingCostsDouble,  //装卸费
      ['info.floatingPriceDouble']: floatingPriceDouble,  //到付上浮费
    });
  },
  //隐藏快递弹窗
  hideTips() {
    this.setData({ isShowTips: false });
  },
  // 三方结算
  triplePaymentChange(e) {
    let value = false;
    if (e.detail.value.length>0){
      value = true;
    }else{
      value = false;
    }
    if(!value){
      this.setData({ ['info.payConsignorName']: '', ['info.payConsignorId']: ''})
    }
    this.setData({ triplePayment:value});
  },
  //挑选结算门店
  async payConsignorNameShow() {
    await this.querySiteList(); //查询地址列表(三方结算门店)
    this.setData({ isShowPopover: true })
  },
  //筛选结算门店
  searchList(e) {
    let value = e.detail.value;
    this.setData({ allName: value });
    //延迟查询
    if (this.data.searchTimeout) clearTimeout(this.data.searchTimeout);
    this.data.searchTimeout = setTimeout(() => {
      this.querySiteList()
      clearTimeout(this.data.searchTimeout);
    }, 300)
  },
  //选择结算门店
  selectConsignorName(e) {
    let { name, id } = e.currentTarget.dataset;
    this.setData({ ['info.payConsignorName']: name, ['info.payConsignorId']: id, isShowPopover:false })
  },
  // 服务协议
  agreementChange(e){
    let value = Boolean(e.detail.value[0]);
    this.setData({agreement:value});
  },
  //下单
  async save(){
    try{
      let info = {...this.data.info};
      if (util.isBlank(info.orderType) && this.data.userType == 2){
        wxApi.showToast("请选择运单类型");
        return
      }
      if (util.isBlank(info.sourceProvince)){
        wxApi.showToast("请选择寄件地址");
        return
      }
      if (util.isBlank(info.destProvince)) {
        wxApi.showToast("请选择收件地址");
        return
      }
      if (util.isBlank(info.goodsName)) {
        wxApi.showToast("请选择货品名称");
        return
      }
      //客户单号是否必填
      if (util.isBlank(info.ordNum) && this.data.ordNumRule.checkRequired && this.data.userType == 2) {
        wxApi.showToast("请填写客户单号");
        return
      }
      if (util.isBlank(info.customizeFiledValue) && util.isNotBlank(this.data.customize) && this.data.warehouseNature != 4) {
        if(this.data.customize.fieldType==1){          
          wxApi.showToast("请填写"+this.data.customize.fieldName);
          return
        }
      }
      // 东莞客户特有逻辑
      if (util.isBlank(info.purchaseUserId) && this.data.warehouseNature == 4) {
        wxApi.showToast("请选择采购人员");
        return
      }
      //采购单号验证
      if (this.data.purchaseNumRule.checkRequired) {
        if(util.isBlank(info.purchaseNum)){
          wxApi.showToast("请填写采购单号");
          return;
        }
        if(this.data.warehouseNature == 4 && this.checkPurchaseNum() == "FALSE"){
          return;
        }
      }
      if (this.data.triplePayment && util.isBlank(info.payConsignorName)) {
        wxApi.showToast("请选择三方结算门店");
        return
      }
      if(util.isBlank(info.paymentType)){
        wxApi.showToast("请选择结算方式");
        return
      }
      if (!this.data.agreement){
        wxApi.showToast("请勾选同意服务协议");
        return
      }
      this.setData({isSave:true});
      const timer = setTimeout(()=>{
        this.setData({isSave:false});
        clearTimeout(timer);
      },5000)
      let { result, trackingNum} = await webApi.saveOrder(info);
      if (result == 0) {
        clearTimeout(timer);  //成功直接禁用
        //判断用户是否订阅，未订阅则弹窗订阅
        let tmplIds = [];
        let res1 = await webApi.getConfig({ cfgName:"PAY_MOBAN_ID"});
        let res2 = await webApi.getConfig({ cfgName:"SUCCESSFUL_NOTICE_IN"});
        let res3 = await webApi.getConfig({ cfgName:"SIGN_FOR_NOTICE_IN"});
        if (util.isNotBlank(res1.cfgValue)){
          tmplIds.push(res1.cfgValue)
        }
        if (util.isNotBlank(res2.cfgValue)){
          tmplIds.push(res2.cfgValue)
        }
        if (util.isNotBlank(res3.cfgValue)){
          tmplIds.push(res3.cfgValue)
        }
        if(tmplIds.length>0){
          await this.subscribeMessage(tmplIds);
        }
        //判断用户是否订阅，未订阅则弹窗订阅 end
        if(this.data.editOrder){
          await wxApi.showModal("修改订单成功");
          let prepage = util.getPrePage();
          prepage.doQuery(true);
          wx.navigateBack();
        }else{
          // this.setData({ info: { packageWeight: 1, packageNumber: 1 }, logistics: null })
          // await wxApi.showModal(`恭喜您成功下单！`);
          this.setData({ trackingNum, billingSuccess: true })
        }
      }else{
        await wxApi.showModal("操作失败，请重新操作")
      }
    }catch(e){
      console.log(e);
    }
  },
  // 订阅消息模板
  async subscribeMessage(tmplIds){
    //判断用户是否订阅，未订阅则弹窗订阅
    let res = await wxApi.getSettingWithSubscriptions();
    //判断是否已订阅
    // if (res.subscriptionsSetting[tmplId] == 'accept') return;
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
    // let resAgain = await wxApi.getSettingWithSubscriptions();
    // console.log(resAgain);
    // if (resAgain.subscriptionsSetting[tmplIds] == 'accept') {   //同意
      
    // }
  },
  closeBillingAlert(){
    this.setData({ billingSuccess:false});
    this.billingSuccessClose();
  },
  billingSuccessClose(){
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  //选择增值服务
  toAddService(){
    let { collectingMoneyDouble, goodsCount, goodsPriceDouble, receiptType, receiptTypeName,ordNum} = this.data.info;
    let item = {
      collectingMoneyDouble,
      goodsCount,
      goodsPriceDouble,
      receiptType,
      receiptTypeName,
      ordNum,
      warehouseNature:this.data.warehouseNature
    }
    let info = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({ url: `/packages/order/addService/addService?info=${info}` });
  },
  // 选择地址
  toSelectAddress(e) {
    let type = e.currentTarget.dataset.type;
    if (this.data.userType == 2){
      if (util.isBlank(this.data.orderTypeIndex)){
        wxApi.showToast("请先选择运单类型");
        return;
      }else{
        var orderTypeId = this.data.orderTypeList[this.data.orderTypeIndex].codeValue;
      }
    }
    let warehouseNature = this.data.warehouseNature;
    wx.navigateTo({
      url: `/packages/order/selectAddress/selectAddress?addressType=${type}&canSelect=true&orderTypeId=${orderTypeId}&warehouseNature=${warehouseNature}&brandId=${this.data.brandId}` });
  },
  // 新增地址
  toEditAddress(e) {
    let type = e.currentTarget.dataset.type;
    //b端寄件人、扫码下单、任意调拨不能新增地址
    if ((this.data.userType == 2 && type==1) || this.data.warehouseNature==4 || this.data.info.orderType==2){
      this.toSelectAddress(e);
      return;
    }
    wx.navigateTo({
      url: `/packages/order/editAddress/editAddress?addressType=${type}&page=billing`
    });
  },
  //服务协议
  toAgreement(){
    wx.navigateTo({ url: `/packages/agreement/agreement`});
  },
  //下单提示 - 下一步
  toNext(e){
    let {index} = e.currentTarget.dataset;
    this.setData({ "swiperIndex": index})
  },
  //下单提示 - 结束
  swiperEnd(){
    this.setData({"showSwiper":false})
    //保存操作状态
    webApi.saveUserState({ 'operatingType':1});
  },
  //切换店铺/经销商
  userListChange(e) {
    let { value } = e.detail;
    this.setData({
      userListIndex: value
    })
    this.changeUser();
  },
  //正则验证采购单号
  checkPurchaseNum(){
    if(util.isBlank(this.data.purchaseNumRule.checkRule)) return;
    let {remarks,checkRule} = this.data.purchaseNumRule;
    if(!new RegExp(checkRule).test(this.data.info.purchaseNum)){
      wxApi.showToast(remarks);
      return "FALSE";
    }
  },
  checkCostValue(e){
    let key = e.target.dataset.key;
    let value = e.detail.value;
    let { maxLowestCost } = this.data.maxLowestCost;
    if (Number(maxLowestCost) < value) {
      wxApi.showModal(`货物保价最高${maxLowestCost}元`)
      return false
    }
    this.calcFee();
  }
})