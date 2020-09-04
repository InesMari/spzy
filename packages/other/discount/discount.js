// packages/discount/discount.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  toDetail() {
    wx.navigateTo({ url: '/packages/other/discountDetail/discountDetail' });
  }
})