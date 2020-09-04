const dateTimePicker = require('../../../lib/dateTimePicker.js');
Component({
  ready: function () {
    var obj = dateTimePicker.dateTimePicker(this.data.startYear, this.data.endYear);
    this.setData({
      dateTime: obj.dateTime,
      dateTimeArray: obj.dateTimeArray,
      dateShow: false
    });
    // this.syncAttrUpdate(this.getDate(obj.dateTime))
  },
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    dateTime: Object,
    dStyle: {
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: '选填',
    },
    initValue: {
      type: String,
      value: ''
    },
    isInit: {
      type: Boolean,
      value: false
    }
  },
  data: {
    startYear: 2000,
    endYear: 2099,
  },
  methods: {
    bindDateChange(e) {
      this.setData({
        'event.eventDate': dateTimePicker.getDate(this.data.dateTimeArray, e.detail.value),
        dateTime: e.detail.value,
        dateShow: true,
        isInit: false
      });

      this.syncAttrUpdate(this.getDate(e.detail.value))
    },
    changeDateTimeColumn(e){
      let { column, value } = e.detail;
      this.data.dateTime[column] = value;
      this.setData({ dateTime: this.data.dateTime});
      if(column==1){
        let date = dateTimePicker.getDate(this.data.dateTimeArray, this.data.dateTime);
        var obj = dateTimePicker.dateTimePicker(this.data.startYear, this.data.endYear, date);
        this.setData({
          dateTime: obj.dateTime,
          dateTimeArray: obj.dateTimeArray
        });
      }
    },
    syncAttrUpdate(datetime) {
      this.triggerEvent('change', datetime)
    },
    getDate(arr) {
      var data = this.data.dateTimeArray;
      var datatime = "";
      for (var i in arr) {
        if (i < 2) {
          datatime += data[i][arr[i]] + "-"
        } else if (i == 2) {
          datatime += data[i][arr[i]] + " "
        } else if (2 < i && i < 5) {
          datatime += data[i][arr[i]] + ":"
        } else {
          datatime += data[i][arr[i]]
        }
      }
      return datatime;
    },
    cleanDate() {
      this.setData({
        dateShow: false,
        isInit: false
      })
    }
  }
});
