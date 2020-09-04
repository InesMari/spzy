import { util, wxApi, webApi, regeneratorRuntime, APP_CONST } from '../../../common/commonImport';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    addressType:2,
    allName :'',
    siteList:[],
    isReadyDbClick:false, //是否处于双击准备状态
    userType:'',
    addressSelect:false,  //是否指向选择（指向收件或者寄件）
    page:1,
    rows:10,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) { //options参数，addressType：收件人(1)/寄件人(2),canSelect:是否可以选择,warehouseNature：是否扫码用户
    //获取用户类型
    let userType = wx.getStorageSync(APP_CONST.STORAGE.USER_TYPE);
    let userRoleType = wx.getStorageSync(APP_CONST.STORAGE.USER_ROLE_TYPE);
    let { addressType, canSelect, orderTypeId,warehouseNature,brandId } = options;
    console.log(options)
    if (util.isNotBlank(addressType)){
      this.setData({ addressSelect: true,addressType})
    }
    this.setData({ canSelect, userRoleType, userType, orderTypeId,warehouseNature,brandId})
    this.doQuery();
  },
  //下拉刷新
  async onPullDownRefresh() {
    await this.doQuery(true);
    const timeout = setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500)
  },
  onReachBottom() {
    this.scrolltolowerHandler();
  },
  async doQuery(clear) {
    if (clear) {
      this.setData({ page: 1 });
    }
    let { page, rows, addressType, allName, orderTypeId} = this.data;
    /* 
      orderTypeId   1:仓库始发，2:任意调拨，3:逆向回货，4:工厂直发，5:云仓电商

      仓库始发：发货方为 仓库（选项），收货方为任意地址（含经销商店铺/仓）
      任意调拨：发货方为 店铺（选项），收货方为店铺（选项）
      逆向回货：发货方为 店铺（选项）， 收货方为仓库（选项）
      工厂直发：发货方为工厂地址，支持手输（系统未维护工厂地址）或选择仓库地址
      云仓电商：发货方为仓库/店铺（选项）， 收货方不做限制
      门店／经销商可选订单类型为任意调拨/逆向回货/云仓电商（很多客户是从门店发货）

      传参：attributionType   1店铺 2仓库 3虚拟客户 不传查询全部
    */
    let attributionType = null;
    if (addressType==1){  //发货方
      if (orderTypeId == 1) {  //仓库始发
        attributionType = '2';
      } else if (orderTypeId == 2) { //任意调拨
        attributionType = '1';
      } else if (orderTypeId == 3) { //逆向回货
        attributionType = '1';
      } else if (orderTypeId == 4) { //工厂直发
        attributionType = '2';
      } else if (orderTypeId == 5) { //云仓电商
        attributionType = '1,2';
      }
    } else if (addressType==2){   //收货方
      if (orderTypeId == 2) {  //任意调拨
        attributionType = '1';
      } else if (orderTypeId == 3) { //逆向回货
        attributionType = '2';
      } else if (orderTypeId == 4) { //工厂直发
        attributionType = '2';
      } else if (orderTypeId == 5) { //云仓电商
        attributionType = '3';
      }
    }
    let warehouseNature = this.data.warehouseNature;
    if(warehouseNature==4){   //扫码用户查全部
      attributionType = null;
    }
    let { items, hasNext } = await webApi.siteList({ page,rows, addressType, allName,warehouseNature,attributionType,brandId:this.data.brandId  });
    if (clear) {
      this.setData({ siteList: [] });
    }
    this.setData({ siteList: [...this.data.siteList, ...items], hasNext })
  },
  // 寄件人/收件人切换
  changeType(e){
    if (util.isNotBlank(e)) { //tab切换才又event传递
      //1是收件人，2是寄件人
      let addressType = e.currentTarget.dataset.type;
      this.setData({ addressType })
      this.doQuery(true);
    }
  },
  //滚动加载
  scrolltolowerHandler() {
    if (this.data.hasNext) {
      this.setData({ page: ++this.data.page });
      this.doQuery();
    }
  },
  searchList(e) {
    let value = e.detail.value;
    this.setData({ allName: value });
    //延迟查询
    if (this.data.searchTimeout) clearTimeout(this.data.searchTimeout);
    this.data.searchTimeout = setTimeout(() => {
      this.doQuery(true)
      clearTimeout(this.data.searchTimeout);
    },300)
  },
  //选择条目
  selectItem(e){
    if (!this.data.canSelect) return;
    let {index} = e.currentTarget.dataset;
    let { siteList} = this.data;
    siteList.forEach(item => {
      item.selected = false;
    })
    siteList[index].selected = true;
    this.setData({ siteList, currentItem: siteList[index]});
    //判断是否双击条目
    if (this.data.isReadyDbClick){
      this.sureSelect();
    }
    this.data.isReadyDbClick = true;
    let timeout = setTimeout(()=>{
      this.data.isReadyDbClick = false;
      clearTimeout(timeout);
    },1000)
  },
  // 新增地址
  toEditAddress() {
    wx.navigateTo({
      url: `/packages/order/editAddress/editAddress?addressType=${this.data.addressType}`});
  },
  //修改地址
  editAddress(e){
    let { index } = e.currentTarget.dataset;
    let item = this.data.siteList[index]
    wx.navigateTo({
      url: `/packages/order/editAddress/editAddress?addressType=${this.data.addressType}&item=${encodeURIComponent(JSON.stringify(item))}`
    });
  },
  async delAddress(e){
    try{
      let { confirm } = await wxApi.showModal({ title: '提示', content: '是否删除该地址？' });
      if (!confirm) return
      let { index } = e.currentTarget.dataset;
      let { result } = await webApi.delSite({ warehouseId: this.data.siteList[index].warehouseId});
      if (result==0){
        await wxApi.showModal({ title: '提示', content: '删除成功', showCancel: false });
      }else{
        await wxApi.showModal({ title: '提示', content: '删除失败', showCancel: false });
      }
      this.doQuery(true);
    }catch(e){
      await wxApi.showModal({ title: '提示', content: '删除失败', showCancel: false });
    }
  },
  sureSelect(){
    if (util.isBlank(this.data.currentItem)){
      wxApi.showModal('请选择地址');
    }
    let prePage = util.getPrePage();
    prePage.addressCallback(this.data.currentItem, this.data.addressType);
    wx.navigateBack();
  }
})