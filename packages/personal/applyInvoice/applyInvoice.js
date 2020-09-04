import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    info:{},
    invoiceTypeIndex:0,
    disabledEdit:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad({invoiceId}) {
    let userId = wx.getStorageSync(APP_CONST.STORAGE.USER_ID);  //查询用户id
    let invoiceTypeList = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.INVOICE_TYPE});
    this.setData({invoiceTypeList,'info.invoiceType':invoiceTypeList[0].codeValue});
    //有传invoiceId设置为详情页
    if(util.isNotBlank(invoiceId)){
      this.setData({disabledEdit:true});
    }
    //遍历回显抬头类型
    let info = await webApi.getInvoice({userId,invoiceId});
    if(util.isNotBlank(info)){
      info.invoiceId = "";
      this.setData({info});
      invoiceTypeList.forEach((el,index) => {
        if(el.codeValue==info.invoiceType){
          this.setData({invoiceTypeIndex:index});
        }
      }) 
    }else{
      this.setData({info:{}});
    }
  },
  inputSetData(e){
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.data.info[key] = value;
    this.setData({ info: this.data.info });
  },
  radioChange(e){
    this.setData({"info.invoiceType":e.detail.value});
  },
  async save(){
    let {invoiceFee,invoiceTitle,taxNo,receiverMail} = this.data.info;
    if (util.isBlank(invoiceFee)){
      wxApi.showToast("请填写开票金额");
      return
    }
    if (util.isBlank(invoiceTitle)){
      wxApi.showToast("请填写发票抬头");
      return
    }
    if (util.isBlank(taxNo)){
      wxApi.showToast("请填写税号");
      return
    }
    if (!util.isEmail(receiverMail)){
      wxApi.showToast("请填写正确的电子邮件");
      return
    }
    this.data.info.invoiceFee = this.data.info.invoiceFeeDouble
    let {result} = await webApi.saveInvoice(this.data.info);
    if(result==0){
      await wxApi.showModal("提交成功。")
      wx.navigateBack();
    }
  }
})