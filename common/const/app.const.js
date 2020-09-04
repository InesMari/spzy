//setStorage用
const STORAGE = {                               
  TOKEN_ID: 'tokenId',
  TENANT_ID:'tenantId',
  TENANT_NAME:'tenantName',
  USER_ID:'userId',
  USER_NAME:'userName',
  USER_TYPE:'userType',
  LOGIN_ACCT: "loginAcct",
  NICK_NAME: "nickName",
  AVATARURL:"avatarUrl",
  ENCRYPTED_DATA:"encryptedData",
  IV:"iv",
  USER_ROLE_TYPE: "userRoleType",
  ORD_NUM_TYPE: "ordNumType",
};
// 省市区字段
const REGION_TYPE = { PROVINCE: 'PROVINCE', DISTRICT: 'DISTRICT', CITY: 'CITY' };
//静态枚举字段
const CODE_TYPE = {
  RECEIPT_TYPE:"RECEIPT_TYPE",                      //回单类型
  DELIVERY_TYPE:"DELIVERY_TYPE",                    //时间范围
  ORDER_PAYMENT_TYPE:"ORDER_PAYMENT_TYPE",          //b端结算方式
  PRODUCT_TYPE:"PRODUCT_TYPE",                      //首页产品介绍
  CONSUMER_TYPE:"CONSUMER_TYPE",                    //消费方式
  ORDER_TRANSPORT_TYPE_WX:"ORDER_TRANSPORT_TYPE_WX",      //运输方式/供应商类型
  PURCHASE_NUM_RULE:"PURCHASE_NUM_RULE",            //采购单号正则
  INVOICE_TYPE:"INVOICE_TYPE",                      //抬头类型
  SUGGEST_TYPE:"SUGGEST_TYPE",                      //反馈类型
}

export default{
  STORAGE,
  REGION_TYPE,
  CODE_TYPE
}