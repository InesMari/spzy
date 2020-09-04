import { util, webApi, APP_CONST, regeneratorRuntime } from '../../commonImport';

let regionList = [];

Component({
  externalClasses: ['placeholder-class', 'extends-class'],
  properties: {
    value: {
      type: Object,
      value: {},
      observer(n, o){
        if(n != o && util.isNotBlank(n)){
          this.valueListener(n);
        }
      }
    },
    disabled: {
      type: Boolean,
      value: false
    },
    fields: {
      type: String,
      value: APP_CONST.REGION_TYPE.PROVINCE
    },
    placeholder: {
      type: String,
      value: '请选择'
    }
  },
  data: {
    range: [],
    selected: [0, 0, 0],
    isChange: false
  },
  ready() {
    this. init();
  },
  methods: {
    async init(){
      try {
        await this.getRegionList({pareee:1});
        if(this.data.range.length == 0){
          //默认北京
          let province = regionList.provinceList;
          let provinceId = regionList.provinceList[0].id;
          //获取北京下级市
          let city = this.getCity(provinceId)
          let cityId = city[0].id;
          //获取北京下级区
          let district = this.getDistrict(cityId);

          let range = [province, city, district]
          this.setData({ range });
        };
      } catch (error) {
        console.log(error);
      }
    },
    async getRegionList() {
      //获取全部省市区
      regionList = await webApi.getRegionList();
    },
    //获取对应的市
    getCity(provinceId){
      let city = [];
      regionList.cityList.forEach(item => {
        if (item.provId == provinceId) {
          city.push(item);
        }
      })
      return city;
    },
    //获取对应的区
    getDistrict(cityId) {
      let district = [];
      regionList.districtList.forEach(item => {
        if (item.cityId == cityId) {
          district.push(item);
        }
      })
      return district;
    },
    changeHandler(e) {
      let { value } = e.detail;
      this.setData({ selected: value, isChange: true });
      let { range } = this.data;
      let result = {};
      result.province = { id: range[0][value[0]].id, name: range[0][value[0]].name };
      result.city = { id: range[1][value[1]].id, name: range[1][value[1]].name };
      result.district = { id: range[2][value[2]].id, name: range[2][value[2]].name };
      this.triggerEvent('change', { value: result });
    },
    cancelHandler() {
      this.triggerEvent('cancel');
    },
    //滚动时刷新子区域列表
    columnchangeHandler(e) {
      let { column, value } = e.detail;
      this.setData({ ['selected['+column+']']: value})
      // console.log(e.detail)
      if (column==0){
        let provinceId = this.data.range[column][value].id;
        //获取下级市
        let city = this.getCity(provinceId)
        //获取下级区
        let cityId = city[0].id;
        let district = this.getDistrict(cityId);
        this.setData({ ['range[1]']: city, ['range[2]']: district})
      }else if (column == 1){
        let cityId = this.data.range[column][value].id;
        let district = this.getDistrict(cityId);
        this.setData({ ['range[2]']: district })
      }
    },
    //地址回显
    async valueListener(){
      // let { range: { provinceList, cityList, districtList},value:{provinceId, cityId, districtId}} = this.data;
      if (this.data.range.length == 0) {
        await this.init();
      }
      if (regionList.length == 0) {
        await this.getRegionList();
      }
      let { provinceId, cityId, districtId } = this.data.value;
      regionList.provinceList.forEach((item,index) => {
        if (item.id == provinceId){
          this.data.selected[0] = index;
          this.setData({ provinceName: item.name, provinceId});
        }
      })
      let cityList = this.getCity(provinceId);
      cityList.forEach((item, index) => {
        if (item.id == cityId) {
          this.data.selected[1] = index;
          this.setData({ cityName: item.name, cityId });
        }
      })
      let districtList = this.getDistrict(cityId);
      districtList.forEach((item, index) => {
        if (item.id == districtId) {
          this.data.selected[2] = index;
          this.setData({ districtName: item.name, districtId });
        }
      })
      let range = [regionList.provinceList, cityList, districtList];
      this.setData({ isChange: true, selected: this.data.selected, range});
    },
    cleanData(){
      this.setData({ isChange: false});
    }
  },
});
