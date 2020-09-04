let animation = wx.createAnimation({
  duration: 400,
  timingFunction: 'ease'
});
let start = 0, end = 0;
Component({
  externalClasses: ['extends-class'],
  properties: {
    isShow: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        if (newVal) {
          this.show();
        } else {
          this.hide();
        }
      }
    },
    width: { type: String, value: null }
  },
  data: {
    animationData: {},
    currentState: false
  },
  methods: {
    show() {
      this.setData({ currentState: true });
      animation.translateX('-100%').step();
      this.setData({ animationData: animation.export(), isShow:true });
      this.triggerEvent('show');
    },
    hide() {
      this.setData({ currentState: false });
      animation.translateX('100%').step();
      this.setData({ animationData: animation.export(), isShow: false });
      start = 0;
      end = 0;
      this.triggerEvent('hide');
    },
    touchstartHandler(e) {
      if (e && e.changedTouches && e.changedTouches.length) {
        start = e.changedTouches[0].pageX;
      }
    },
    touchendHandler(e) {
      if (e && e.changedTouches && e.changedTouches.length) {
        end = e.changedTouches[0].pageX;
      }
      if (end - start > 80) {
        this.hide();
      } else if (end == start && e && e.target && e.target.id == 'container') {
        this.hide();
      }
    },
    tapHandler(e) {
      if (e && e.target && e.target.id == 'shade') {
        this.hide();
      }
    },
    touchmoveHandler() {
      // wx.pageScrollTo({ scrollTop: 1 });
    }
  }
});
