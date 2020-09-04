import { util, wxApi, regeneratorRuntime } from '../../commonImport';
import req from '../../../utils/request';

Component({
  properties: {
    urls: {
      type: Array, value: [], observer() {
        this.emptyUrlsFilter();
      }
    },
    count: { type: Number, value: 20 },          //图片可选数量
    height: { type: String, value: '120rpx' },
    width: { type: String, value: '120rpx' },
    isRechoose: { type: Boolean, value: true },  //当urls存在时，默认可以重新选择，设置为false时将不能重新选择
    parentData:{
      type:Object,
      value:{}
    },
  },
  data: {
    _urls: [],
    flowIds:[],
  },
  ready() {
    this.emptyUrlsFilter();
  },
  methods: {
    emptyUrlsFilter() {
      
      let { urls } = this.data;
      let tempUrls = [];
      for (let item of urls) {
        if (util.isNotBlank(item.picFullUrl)) tempUrls.push(item);
      }
      this.setData({ _urls: tempUrls });
    },
    fail() {
      wx.showModal({ title: '提示信息', content: '选择照片失败，请重试或者联系管理员！', showCancel: false });
    },
    async chooseHandler() {
      try {
        wx.showLoading({ title: '正在打开相册...', });
        let { errMsg, tempFilePaths } = await wxApi.chooseImage({ count: (this.data.count - this.data._urls.length), complete: () => wx.hideLoading() });
        if (errMsg == 'chooseImage:ok') {   //微信返回选择图片成功
          // 处理微信返回的图片数据
          let { _urls } = this.data, promiseArr = [];
          for (let tempFilePath of tempFilePaths) promiseArr.push(wxApi.getImageInfo({ src: tempFilePath }));
          let paths = await Promise.all(promiseArr);
          for (let { path } of paths) _urls.push({ picFullUrl: path, flowId: null, picUrl: null });          
          this.setData({ _urls });
          // 将图片存储到后台服务器
          let res = await req.uploadFile(tempFilePaths[0]);
          this.data.flowIds.push(res.flowId);
          this.setData({flowIds:this.data.flowIds});
        } else {
          this.fail();
        }
      } catch (error) {
        this.fail();
        console.log(error);
      }
    },
    previewHandler(e) {
      let { _urls } = this.data;
      let { url } = e.currentTarget.dataset;
      let previewUrls = [];
      for (let { picFullUrl } of _urls) {
        if (picFullUrl.includes('http://tmp') || picFullUrl.includes('wxfile://')) previewUrls.push(picFullUrl);
        else previewUrls.push(util.getBigUrl(picFullUrl));
      }
      if (!url.includes('http://tmp') && !url.includes('wxfile://')) url = util.getBigUrl(url);
      wxApi.previewImage({ urls: previewUrls, current: url });
    },
    remove(e) {
      let { _urls } = this.data;
      let { url } = e.currentTarget.dataset;
      let index = null;
      _urls.some(({ picFullUrl }, curIndex) => {
        if (picFullUrl == url) {
          index = curIndex;
          return true;
        }
      });
      if (util.isNotBlank(index)) _urls.splice(index, 1);
      this.setData({ _urls });
    },
    clean() {
      this.setData({ _urls: [] });
    },
    getData() {
      return this.data.flowIds;
    }
  }
});
