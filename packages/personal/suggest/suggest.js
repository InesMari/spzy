import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    suggestTypeList:[],
    suggestTypeIndex:0,
    showOrdNum:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    let suggestTypeList = await webApi.getStaticData({ codeType: APP_CONST.CODE_TYPE.SUGGEST_TYPE});
    this.setData({suggestTypeList})
  },
  suggestTypeChange(e){
    let { value } = e.detail;
    this.setData({
      "info.suggestType": this.data.suggestTypeList[value].codeValue,
      suggestTypeIndex: value
    })
    // 异常反馈显示单号
    this.setData({showOrdNum:this.data.info.suggestType==4});
  },
  inputSetData(e){
    let { value } = e.detail;
    let { key } = e.currentTarget.dataset;
    this.data.info[key] = value;
    this.setData({ info: this.data.info });
  },
  async save(){

  },
})