import req from '../../utils/request';
import APP_CONST from '../../common/const/app.const';
//版本验证
const setVersion = params => req.postByCode('500056', params);   //更新微信版本号
const getVersion = params => req.postByCode('500057', params);   //获取微信版本号

// 登录
const login = params => req.postByCode('500001', params);   //微信登录
const relogin = params => req.postByCode('500026', params);   //退出登录
const loginState = params => req.postByCode('500012', params);   //查询登录状态是否有效
const getSmsCode = params => req.postByCode('500040', params);   //获取登陆验证码
const codeLogin = params => req.postByCode('500041', params);   //手机验证码登录
const getUserList = params => req.postByCode('500045', params);   //获取登录方列表
const getUserId = params => req.postByCode('500046', params);   //获取客户端id
const isHaveUser = params => req.postByCode('500054', params);   //判断是否存在用户
const checkSmsCode = params => req.postByCode('500055', params);   //判断手机验证码是否正确

// 首页
const getRegionList = params => req.postByCode('500015', params,undefined,undefined,true);   //获取省市区全部数据(可重复请求)
const getStaticData = params => req.postByCode('500006', params,undefined,undefined,true);   //获取静态数据类型
const productDetail = params => req.postByCode('500023', params);   //产品详情
const queryTrackingNum = params => req.postByCode('500024', params);   //首页查询订单
//地址管理
const siteList = params => req.postByCode('500007', params);   //获取地址列表
const addSite = params => req.postByCode('500011', params);   //新增地址
const delSite = params => req.postByCode('500008', params);   //删除地址
const getSiteInfo = params => req.postByCode('500009', params);   //获取地址信息
const distinguishSite = params => req.postByCode('500013', params);   //识别地址信息
//地址管理 end
//订单
const orderList = params => req.postByCode('500022', params);   //订单列表(首页)
const getOrderList = params => req.postByCode('500030', params);   //订单列表(子页)
const cancelOrder = params => req.postByCode('500031', params);   //取消订单
const rejectOrder = params => req.postByCode('500032', params);   //拒绝三方结算订单
const agreeOrder = params => req.postByCode('500033', params);   //同意三方结算订单
const reBilling = params => req.postByCode('500034', params);   //重新开单
const paymentType = params => req.postByCode('500035', params);   //结算方式
const orderDetail = params => req.postByCode('500025', params);   //订单详情
const clientCalcFee = params => req.postByCode('500029', params);   //c端算费
const businessCalcFee = params => req.postByCode('500028', params);   //b端算费
const saveOrder = params => req.postByCode('500021', params);   //下单
const isOpenTriplePayment = params => req.postByCode('500020', params);   //是否开启三方审核
const getScanUserOrderType = params => req.postByCode('500051', params);   //获取扫码用户订单类型
//保存用户状态operatingType，1为已经订单指引，2为扫码进入小程序
const saveUserState = params => req.postByCode('500043', params);   
const isReadStep = params => req.postByCode('500044', params);   //判断用户是否阅读过开单步骤
const getPurchaseList = params => req.postByCode('500053', params);   //获取采购人员
const getOrdNumRule = params => req.postByCode('500063', params);   //获取定制单号规则
//增值服务费
const getOrderType = params => req.postByCode('500018', params,undefined,undefined,true);   //获取运单类型
const getCustomize = params => req.postByCode('500019', params);   //获取自定义字段
const getMaxLowestCost = params => req.postByCode('500027', params);   //获取保险与代收货款最大值
//订单end
//我的
const getPersonalInfo = params => req.postByCode('500016', params);   //我的信息
const changeUser = params => req.postByCode('500017', params);   //切换B/C端
const createUser = params => req.postByCode('500002', params);   //创建C端
const payHistory = params => req.postByCode('500039', params);   //消费记录
const getConfig = params => req.postByCode('500042', params);   //配置信息
const addClerk = params => req.postByCode('500058', params);   //添加店员
const saveInvoice = params => req.postByCode('500059', params);   //保存开票信息
const getInvoice = params => req.postByCode('500060', params);   //获取开票信息
const invoiceHistory = params => req.postByCode('500061', params);   //获取开票历史
const supportSuggest = params => req.postByCode('500062', params);   //提交建议反馈
const getMessageList = params => req.postByCode('500064', params);   //消息推送列表
const updateMessage = params => req.postByCode('500065', params);   //消息推送状态改动
const getPictrue = params => req.postByCode('500067', params);   //查询图片

// 支付
const pay = params => req.postByCode('500036', params);   //支付
const paysuccess = params => req.postByCode('500038', params);   //支付成功

// 扫码登录注册
const getCompanyName = params => req.postByCode('500047', params);   //获取客户公司名称
const checkCompanyName = params => req.postByCode('500048', params);   //验证客户公司名称
const scanLogin = params => req.postByCode('500049', params);   //扫码登录
const saveScanUser = params => req.postByCode('500050', params);   //保存扫码用户
const saveScanOtherUser = params => req.postByCode('500068', params);   //保存扫码用户（非志高）
const addPurchase = params => req.postByCode('500052', params);   //新增采购人员



//上传照片
// const uploadPictrue = (filePath, params, isLoading, title) => req.uploadFile(filePath, params, isLoading, title);
//获取access_token
const getAccess_token = params => req.wxByPost("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx7e2f7d7968bdf4b2&secret=89266511dda882f5a8c1be419db64413", params);

export default {
  setVersion,
  getVersion,
  login,
  relogin,
  loginState,
  getSmsCode,
  codeLogin,
  getUserList,
  getUserId,
  isHaveUser,
  checkSmsCode,
  siteList,
  getStaticData,
  productDetail,
  queryTrackingNum,
  getRegionList,
  addSite,
  delSite,
  getSiteInfo,
  distinguishSite,
  orderList,
  getOrderList,
  cancelOrder,
  rejectOrder,
  agreeOrder,
  reBilling,
  orderDetail,
  paymentType,
  clientCalcFee,
  businessCalcFee,
  saveOrder,
  isOpenTriplePayment,
  getScanUserOrderType,
  saveUserState,
  isReadStep,
  getPurchaseList,
  getOrdNumRule,
  getOrderType,
  getCustomize,
  getMaxLowestCost,
  getPersonalInfo,
  changeUser,
  createUser,
  payHistory,
  getConfig,
  addClerk,
  saveInvoice,
  getInvoice,
  invoiceHistory,
  supportSuggest,
  getMessageList,
  updateMessage,
  pay,
  paysuccess,
  getCompanyName,
  checkCompanyName,
  scanLogin,
  saveScanUser,
  saveScanOtherUser,
  addPurchase,
  getPictrue
};