import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../../../common/commonImport';
import req from '../../../utils/request';
import md5 from '../../../lib/md5';

//引入语音编译插件
const plugin = requirePlugin("WechatSI")
const manager = plugin.getRecordRecognitionManager();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    info:{
      addressType: 1,  //1发件地址2收件地址
      warehouseFullName:'',
      warehousePeople:'',
    },
    siteList:[],
    isDefault:false,
    isRecord:false,        //是否正在录音
    isShowRecord:false,   //展示录音弹窗
    recordBtnText: "按住说话",
    isGetSmsCode: false, //是否获取短信验证码（倒计时用）
    cutdown: 60, //倒计时秒数
    isShowSmsCode:false,  //是否展示验证码输入框
  },
  /**
   * 生命周期函数--监听页面加载
   * addressType:1为发货，2为收货
   * item：数据回想
   * page：进入页面的来源
   * isSan：是否扫码进入
   */
  onLoad({ addressType, item,page,isScan }) {
    let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);  //查询用户类型
    this.setData({ ['info.addressType']: addressType, userType, isScan });
    if(util.isNotBlank(item)){
      this.initEdit(item);
    }
    if (util.isNotBlank(page)) {
      this.setData({page})
    }
    // this.doQuery();
    this.initRecord();
  },
  //初始化修改数据
  async initEdit(item){
    item = JSON.parse(decodeURIComponent(item));
    // let { warehouseId, warehouseFullName, warehousePeople, warehousePhone, warehouseAddress, provinceId, cityId, districtId} = item;
    let res = await webApi.getSiteInfo({ warehouseId: item.warehouseId });
    res.isDefault = res.isDefault==1?true:false;
    this.setData({ info: res });
    let { provinceId, cityId, countyId } = res;
    this.setData({ regionIds: { provinceId, cityId, districtId: countyId}})
  },
  async doQuery(){
    let res = await webApi.siteList({ addressType:this.data.info.addressType});
    this.setData({ siteList:res}) 
  },
  inputSetData(e){
    let key = e.target.dataset.key;
    let value = e.detail.value;
    this.data.info[key] = value;
    this.setData({ info: this.data.info});
  },
  //省市区选择回调
  regionChange(e){
    let { city, district, province} = e.detail.value;
    this.setData({
      ['info.provinceId']: province.id,
      ['info.provinceName']: province.name, 
      ['info.cityId']: city.id,
      ['info.cityName']: city.name, 
      ['info.districtId']: district.id,
      ['info.districtName']: district.name,
    });
  },
  switchChange(e){
    let value = e.detail.value;
    this.setData({ ['info.isDefault']: value});
  },
  // 初始化语音输入
  initRecord(){
    let _this = this;
    manager.onStart = function (res) {
      console.log("成功开始录音识别", res)
    }
    manager.onRecognize = function (res) {
      console.log("current result", res.result)
    }
    manager.onStop = function (res) {
      if(util.isBlank(res.result)) return;
      let result = res.result.replace(/[,，。]/ig, "");
      console.log("result", result)
      let resultArr = result.split("");
      let name = '';
      let phone = '';
      let siteStartIndex = 0;
      let phoneStart = false;
      console.log(resultArr)
      for (let index = 0; index < resultArr.length;index++){
        let el = resultArr[index];
        //名字
        if (isNaN(parseInt(el)) && !phoneStart) {
          name += el;
          continue;
        }
        //电话
        if (!isNaN(parseInt(el))) {
          phoneStart = true;
          phone += el;
          continue;
        }
        // 地址开始下标
        if (isNaN(parseInt(el)) && phoneStart) {
          siteStartIndex = index;
          break;
        }
      }
      let site = result.substring(siteStartIndex, result.length);
      let recordInfo = name + '，' + phone + '，' + site;
      _this.setData({ ['info.recordInfo']: recordInfo});
    }
  },
  //打开语音输入弹窗
  record(){
    this.setData({ isShowRecord:true});
  },
  //开始语音输入
  startRecord(){
    manager.start();
    let timeout = setTimeout(() => {
      this.setData({ isRecord: true, recordBtnText:"放开结束"});
      clearTimeout(timeout)
    },500);
  },
  //结束语音输入
  endRecord(){
    manager.stop();
    this.setData({ isRecord: false, recordBtnText: "按住说话", isShowRecord:false})
  },
  //识别
  async distinguish(){
    let recordInfo = this.data.info.recordInfo;
    if (util.isBlank(recordInfo)){
      wxApi.showModal("无识别内容");
      return
    }
    recordInfo = recordInfo.replace(/[,，]/ig, "，");
    let arr = recordInfo.split("，");
    this.setData({
      ['info.warehousePeople']: arr[0],
      ['info.warehousePhone']: arr[1],
    });
    let result = await webApi.distinguishSite({ cityName: arr[2] });
    let { provinceId, provinceName, cityId, cityName, countyId, countyName } = result;
    if(provinceId==-1){
      wxApi.showToast("识别失败");
      return false;
    }
    let warehouseAddress = '';
    if(recordInfo.indexOf(provinceName)>-1&&util.isNotBlank(provinceName)){
      let index = recordInfo.indexOf(provinceName)+provinceName.length;
      warehouseAddress = recordInfo.substr(index);
    }
    if(recordInfo.indexOf(cityName)>-1&&util.isNotBlank(cityName)){
      let index = recordInfo.indexOf(cityName)+cityName.length;
      warehouseAddress = recordInfo.substr(index);
    }
    if(recordInfo.indexOf(countyName)>-1&&util.isNotBlank(countyName)){
      let index = recordInfo.indexOf(countyName)+countyName.length;
      warehouseAddress = recordInfo.substr(index);
    }
    this.setData({ 
      regionIds: { provinceId, cityId:cityId!=-1?cityId:undefined, districtId: countyId!=-1?countyId:undefined },
      ['info.provinceId']: provinceId,
      ['info.provinceName']: provinceName,
      ['info.cityId']: cityId,
      ['info.cityName']: cityName,
      ['info.districtId']: countyId,
      ['info.districtName']: countyName,
      ['info.warehouseAddress']: warehouseAddress,
    });
  },
  // 保存地址
  async save(){
    try{
      //默认地址处理
      if (this.data.info.isDefault){
        this.data.info.isDefault = 1;
      }else{
        this.data.info.isDefault = 2;
      }
      if (util.isBlank(this.data.info.warehouseFullName) && util.isBlank(this.data.info.warehousePeople)) {
        wxApi.showModal("请输入单位名称或者联系人");
        return;
      }
      if (util.isBlank(this.data.info.warehousePhone)) {
        wxApi.showModal("请输入手机号或座机号");
        return;
      }
      if (util.isBlank(this.data.info.provinceId)) {
        wxApi.showModal("请选择省市区");
        return;
      }
      if (util.isBlank(this.data.info.warehouseAddress)){
        wxApi.showModal("请输入详细地址");
        return;
      }
      //扫码进来需要先登录
      if(this.data.isScan){
        let userLogin = this.data.info.warehousePhone;
        let smsCode = this.data.info.smsCode;
        let username = wx.getStorageSync("username");
        let js_code = wx.getStorageSync("jscode");
        let tenantId = wx.getStorageSync("tenantId");
        this.data.info.tenantId = tenantId;
        let {cfgValue} = await webApi.getConfig({ cfgName: "PURCHASE_TENANT" });  //查询东莞用户id
        console.log(this.data.info);
        if(tenantId==cfgValue){
          var {id} = await webApi.saveScanUser(this.data.info); //保存扫码用户
        }else{
          var {id} = await webApi.saveScanOtherUser(this.data.info); //保存扫码用户(非志高)
        }
        let res = await webApi.codeLogin({ userLogin, smsCode, username, js_code });  //验证码登录
        await req.resetStorage(res);
        let result = await webApi.changeUser({ id, attributionType: 2, userLogin}); //切换用户（用户登录）
        await req.resetStorage(result);
        // await webApi.saveUserState({ operatingType: 2 }); //保存用户状态operatingType,2为扫码进入小程序
      }
      let prePage = util.getPrePage();
      if (this.data.page == "billing") { //下单页面进来的交互处理
        let info = this.data.info;
        let item = {
          ...info,
          addressName: info.provinceName + info.cityName + info.districtName + info.warehouseAddress,
        }
        prePage.addressCallback(item, this.data.info.addressType);
      } else if (this.data.isScan) {
        let info = this.data.info;
        let item = {
          ...info,
          addressName: info.provinceName + info.cityName + info.districtName + info.warehouseAddress,
          addressType:1,
        }
        let param = encodeURIComponent(JSON.stringify(item));
        wx.reLaunch({ url: `/packages/order/billing/billing?isScan=true&param=${param}` });
      }else{
        //地址列表进来的交互处理
        let { result, warehouseId} = await webApi.addSite(this.data.info);
        if (result == 0){
          let { confirm } = await wxApi.showModal({ title: '提示', content: '操作成功', showCancel: false });
          if (confirm) {
            prePage.doQuery(true);
          }
        }
      }
      wx.navigateBack();
    }catch(e){
      console.log(e);
    }
  },
  //清空地址
  cleanSite(){
    let addressType = this.data.info.addressType;
    this.data.info = { addressType};
    this.setData({ info: this.data.info});
    this.selectComponent("#regionPicker").cleanData();
  },
  // 获取短信验证码
  async getSmsCode() {
    let userLogin = this.data.info.warehousePhone;
    if (!util.isPhoneNumber(userLogin)) {
      wxApi.showModal("请输入正确的手机号。");
      return;
    }
    let sign = md5(userLogin + '1943E4E1FE023E818A1EEA9DD55743DF');
    let res = await webApi.getSmsCode({ userLogin, sign });
    if (res == 0) {
      wxApi.showToast("短信验证码已发送");
    } else {
      wxApi.showModal("验证码发送失败，请重新点击发送。");
      return
    }
    this.setData({ isGetSmsCode: true, isShowSmsCode:true});
    let cutdown = this.data.cutdown
    const timer = setInterval(() => {
      if (cutdown > 0) {
        this.setData({ cutdown: --cutdown });
      } else {
        this.setData({ isGetSmsCode: false, cutdown: 60 });
        clearInterval(timer);
      }
    }, 1000)
  },
})