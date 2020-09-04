import { Base64 } from '../lib/base64.min';
import wxApi from '../common/wxApi/wx.api';
import APP_CONST from '../common/const/app.const';
import regeneratorRuntime from '../lib/regenerator-runtime/runtime';

let webApi = null, checkPhoneReg = null, checkLoginPasswordReg = null, checkPayPasswordReg = null;

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n
};
const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
};
const isBlank = str => (typeof str == 'number' && isNaN(str)) || (!str && str !== 0 && str !== false);
const isNotBlank = str => !isBlank(str);
// setTimeout(async () => {
//   if (isBlank(checkPhoneReg)) {
//     if (isBlank(webApi)) webApi = require('../common/webApi/web.api').default;
//     try {
//       let { items: [{ cfgValue }] } = await webApi.getcfg({ cfgName: ['CHK_PHONE'] }, false);
//       checkPhoneReg = cfgValue;
//     } catch (error) {
//       console.log(error);
//       wx.showModal({ title: '警告', content: '查询手机校验规则失败', showCancel: false });
//     }
//   }
// }, 10);
const checkPhoneNum = str => {
  if (isBlank(str)) return false;
  if (isBlank(checkPhoneReg)) {
    return true;
  } else {
    let myreg = new RegExp(checkPhoneReg);
    return myreg.test(str);
  }
};
const base64Password = str => {
  let first = Math.round(Math.random() * 80) + 10;
  let last = Math.round(Math.random() * 80) + 10;
  return Base64.encode(`${first}${str}${last}{zx}`);
};
const specialChar = `&'"`;
const isIncludeSpecialChar = str => {
  if (isBlank(str)) return false;
  for (let char of specialChar) {
    if (str.includes(char)) return true;
  }
  return false;
};
//除法
let accDiv = function (num1, num2) {
  if (num1 == null) {
    num1 = 0;
  }
  if (num2 == null) {
    num2 = 0;
  }
  var m = 0, s1 = num1.toString(), s2 = num2.toString();
  try {
    m += s1.split(".")[1].length
  } catch (e) {
  }
  ;
  try {
    m += s2.split(".")[1].length
  } catch (e) {
  };
  return Number(s1.replace(".", "")) / Number(s2.replace(".", "")) / Math.pow(10, m);
};
//乘法
let accMul = function (arg1, arg2) {
  if (arg1 == null) {
    arg1 = 0;
  }
  if (arg2 == null) {
    arg2 = 0;
  }
  var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
  try {
    m += s1.split(".")[1].length
  } catch (e) {
  }
  try {
    m += s2.split(".")[1].length
  } catch (e) {
  }
  return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
};
//加法
let accAdd = function (arg1, arg2) {

  if (arg1 == null) {
    arg1 = 0;
  }
  if (arg2 == null) {
    arg2 = 0;
  }
  var r1, r2, m;
  try {
    r1 = arg1.toString().split(".")[1].length
  } catch (e) {
    r1 = 0
  }
  try {
    r2 = arg2.toString().split(".")[1].length
  } catch (e) {
    r2 = 0
  }
  m = Math.pow(10, Math.max(r1, r2))
  let key = ((arg1 * m + arg2 * m) / m).toFixed(4);      //取小数点后四位
  return key;
};

//加法  取小数点后两位
let accAddFixed2 = function (arg1, ...arg2) {
  if (arg1 == null) {
    arg1 = 0;
  }
  if (arg2 == null) {
    arg2 = 0;
  }
  var r1 = [], r2 = [], m, key;
  try {
    r1.push(arg1.toString().split(".")[1].length)
  } catch (e) {
    r1.push(0)
  }
  try {
    for (let a of arg2) {
      r2.push(a.toString().split(".")[1].length)
    }
  } catch (e) {
    r2.push(0)
  }
  let r = r1.concat(r2);
  m = Math.pow(10, Math.max(r1, ...r2))
  key = Number(arg1) * m;
  for (let a of arg2) {
    key += Number(a) * m;
  }
  key = (key / m)
  if (isNaN(key)) {
    key = "";
  } else {
    key = key.toFixed(2);      //取小数点后2位
  }
  return key;
};

//减法
let accSub = function (arg1, arg2) {

  if (arg1 == null) {
    arg1 = 0;
  }
  if (arg2 == null) {
    arg2 = 0;
  }
  var r1, r2, m, n;
  try {
    r1 = arg1.toString().split(".")[1].length
  } catch (e) {
    r1 = 0
  }
  try {
    r2 = arg2.toString().split(".")[1].length
  } catch (e) {
    r2 = 0
  }
  m = Math.pow(10, Math.max(r1, r2));
  n = (r1 >= r2) ? r1 : r2;
  return ((arg1 * m - arg2 * m) / m).toFixed(n);
};
//计算订单详情内调车时运费中的到付款
let toPlayFuc = function (arg1, arg2) {
  accSub(arg1, arg2)

};

// 保留两位小数
let doubleValueTwo = function (obj) {

  obj = obj + "";
  obj = obj.replace(/[^\d.]/g, "");  //清除“数字”和“.”以外的字符
  obj = obj.replace(/\.{2,}/g, "."); //只保留第一个. 清除多余的
  obj = obj.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
  obj = obj.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');//只能输入两个小数
  if (obj.indexOf(".") < 0 && obj != "") {//以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额
    obj = parseFloat(obj);
  }
  return obj;
};
const formatTimeTwo = date => {
  if (date instanceof Date) {
  } else {
    date = new Date(date)
  }
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':');
};
const checkEntityId = async str => {
  if (isBlank(str)) return false;
  let { data: entityIds = [] } = await wxApi.getStorage({ key: APP_CONST.STORAGE.ENTITY_IDS });
  if (Array.isArray(str)) {
    return str.some(item => entityIds.includes(parseInt(item)) || entityIds.includes(item));
  } else {
    return entityIds.includes(parseInt(str)) || entityIds.includes(str);
  }
};
const isEmptyObject = obj => {
  if (isBlank(obj)) return true;
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) return false;
  }
  return true;
};
// const copyobj = (target, source, attrs) => {   //浅拷贝
//   if (isBlank(attrs)) Object.assign(target, source);
//   else if (typeof attrs == 'string') target[attrs] = source[attrs];
//   else if (Array.isArray(attrs)) for (let attr of attrs) target[attr] = source[attr];
// };
const copyobj = (obj) => JSON.parse(JSON.stringify(obj));
//包含 . 文件后缀名
var getSuffix = function (path) {
  if (isBlank(path)) return '';
  var tIndex = path.lastIndexOf('.');
  if (tIndex === -1) return '';
  return path.substr(tIndex);
};
//获取大图url
const getBigUrl = function (src) {

  if (isBlank(src)) return '';
  if (src.includes('_big')) return src;
  let urlImg = '';
  var srcArray = src.split("?");
  if (!isBlank(srcArray)) {
    var srcArrayTow = srcArray[0].split("/");
    if (!isBlank(srcArrayTow)) {
      if (srcArrayTow.length > 1) {
        for (var i = 0; i < srcArrayTow.length; i++) {
          if (i == (srcArrayTow.length - 1)) {
            var str = srcArrayTow[i];
            str = str.replace(".", "_big.");
            urlImg += str;
          } else {
            if (i == (srcArrayTow.length - 1)) {
              urlImg += srcArrayTow[i] + "//";
            } else {
              urlImg += srcArrayTow[i] + "/";
            }
          }
        }
      }
    }
  }
  return urlImg;
};
const checkLoginPassword = async password => {
  if (isBlank(password)) return false;
  if (isBlank(checkLoginPasswordReg)) {
    try {
      let { items: [{ cfgValue }] } = await webApi.getcfg({ cfgName: ['LOGIN_PASSWORD'] });
      checkLoginPasswordReg = cfgValue;
    } catch (error) {
      console.log(error);
    }
  }
  let reg = new RegExp(checkLoginPasswordReg);
  return !(reg.test(password));
};
const checkPayPassword = async password => {
  if (isBlank(password)) return false;
  if (isBlank(checkPayPasswordReg)) {
    try {
      let { items: [{ cfgValue }] } = await webApi.getcfg({ cfgName: ['PAY_PASSWORD'] });
      checkPayPasswordReg = cfgValue;
    } catch (error) {
      console.log(error);
    }
  }
  let reg = new RegExp(checkPayPasswordReg);
  return !(reg.test(password));
};
const amountHandler = num => {
  if (isBlank(num)) return;
  try {
    num = (num * 100) + '';
    if (num.includes('.')) num = num.substring(0, num.indexOf('.'));
    if (isNaN(num)) return '';
    return parseInt(num);
  } catch (error) {
    return '';
  }
};
const ellipsisHandler = (str, start = 4, end = 3) => {
  if (isBlank(str) || str == "undefined") return '';
  return `${str.substr(0, start)} **** **** ${str.substr(str.length - end)}`;
};
const getDate = function (days = 0) {
  days = parseInt(days);
  let currentDate = new Date();
  return new Date(currentDate.getTime() + (days * 24 * 60 * 60 * 1000));
};

//四舍五入到两位小数
function toDecimal(x) {
  var f = parseFloat(x);
  if (isNaN(f)) {
    return;
  }
  f = Math.round(x * 100) / 100;
  return f;
}

// 时间格式转成时间搓
const datetime_to_unix = function (datetime) {

  var tmp_datetime = datetime.replace(/:/g, '-');
  tmp_datetime = tmp_datetime.replace(/ /g, '-');
  var arr = tmp_datetime.split("-");
  var now = new Date(arr);
  var now = new Date(Date.UTC(arr[0], arr[1] - 1, arr[2], arr[3] - 8, arr[4], arr[5]));

  return parseInt(accDiv(now.getTime(), 1000));
}

//计算出靠台-离台时间，保留两位小数
const computeTimeFix2 = function (time1, time2) {

  const p = accSub(datetime_to_unix(time1), datetime_to_unix(time2))
  //3600一小时

  if (p < 0) {
    wx.showToast({
      title: "靠台时间必须大于离台时间",
      icon: 'success',
      duration: 2000
    })
    return;
  }

  let time = accDiv(p, 3600)
  let s = toDecimal(time);
  return s || "";
}


// 验证是否为数字及小数点
const checkNumber = function (value) {
  var re = /^\d+(?=\.{0,1}\d+$|$)/
  if (value != "") {
    if (!re.test(value)) {
      return false;
    }
    return true;
  }
}
//判断 是否纯数字     返回true 为纯数字
const checkIsNumber = function (value) {
  return /^\d+$/.test(value)
}

/**判断是否是手机号**/
function isPhoneNumber(tel) {
  var reg = /^0?1[3|4|5|6|7|8|9][0-9]\d{8}$/;
  return reg.test(tel);
}

/**判断是否是邮箱**/
function isEmail(email) {
  var reg = /^([a-zA-Z0-9])+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/;
  return reg.test(email);
}

function isCardNo(card) {

  var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (reg.test(card) === false) {

    return false;
  }
  return true

}
// 判断是否是日期格式
function strDateTime2(str) {

  var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  var r = str.match(reg);
  if (r == null) {
    wx.showToast({
      title: "日期格式不正确 如2019-01-01 09:00:00",
      icon: 'success',
      duration: 2000
    })
    return false;
  }



  var d = new Date(r[1], r[3] - 1, r[4], r[5], r[6], r[7]);
  return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4] && d.getHours() == r[5] && d.getMinutes() == r[6] && d.getSeconds() == r[7]);
}

// 腾讯地图经纬度转百度地图经纬度
const qqMapTransBMap = function (lng, lat) {

  let x = Number(lng);
  let y = Number(lat);
  if (!isNaN(x) && !isNaN(y)) {
    let x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
    let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
    let longitude = z * Math.cos(theta) + 0.0065;
    let latitude = z * Math.sin(theta) + 0.006;

    return {
      longitude,
      latitude
    }
  }
}
// 百度地图经纬度转腾讯地图经纬度
const bMapTransQQMap = function (lng, lat) {
  let x = Number(lng);
  let y = Number(lat);
  if (!isNaN(x) && !isNaN(y)) {
    let x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    x = x - 0.0065;
    y = y - 0.006;
    let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
    let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
    let longitude = z * Math.cos(theta);
    let latitude = z * Math.sin(theta);

    return {
      longitude,
      latitude
    }
  }
}

//检查是否为代收
const checkIsCollection = async function () {
  let { data: userType } = await wxApi.getStorage({ key: APP_CONST.STORAGE.USER_TYPE });
  if (userType == 7) {
    return true;
  } else {
    return false;
  }
}

//获取userid
const getUserId = async function () {
  let { data: isAdminUser } = await wxApi.getStorage({ key: APP_CONST.STORAGE.IS_ADMIN_USER });
  if (!isAdminUser) var key = APP_CONST.STORAGE.USER_ID;
  else var key = APP_CONST.STORAGE.ADMIN_USER_ID;
  let { data: userId } = await wxApi.getStorage({ key });
  return userId;
}

//获取上一个页面
const getPrePage = function(){
  let pages = getCurrentPages();
  let prevPage = pages[pages.length - 2];  //上一个页面
  return prevPage;
}

//ASCII码排序
const sort_ASCII = function(obj) {
  var arr = new Array();
  var num = 0;
  for (var i in obj) {
    arr[num] = i;
    num++;
  }
  var sortArr = arr.sort();
  var sortObj = {};
  for (var i in sortArr) {
    sortObj[sortArr[i]] = obj[sortArr[i]];
  }
  return sortObj;
}

export default {
  formatTime,
  isBlank,
  isNotBlank,
  checkPhoneNum,
  base64Password,
  isIncludeSpecialChar,
  accDiv,
  accMul,
  accAdd,
  accSub,
  doubleValueTwo,
  formatTimeTwo,
  checkEntityId,
  isEmptyObject,
  copyobj,
  getSuffix,
  getBigUrl,
  checkLoginPassword,
  checkPayPassword,
  amountHandler,
  ellipsisHandler,
  getDate,
  checkNumber,
  isCardNo,
  isPhoneNumber,
  isEmail,
  checkIsNumber,
  computeTimeFix2,
  strDateTime2,
  toDecimal,
  accAddFixed2,
  qqMapTransBMap,
  bMapTransQQMap,
  getUserId,
  checkIsCollection,
  getPrePage,
  sort_ASCII
};