import { util, wxApi, webApi, appConfig, APP_CONST, regeneratorRuntime } from '../common/commonImport';

let reTryCount = 0;
const resetReTryCount = () => {
    reTryCount = 0;
};
const authorize = async () => {
    wx.hideLoading();
    // try {
    //     let settings = await wxApi.getSetting();
    //     if (!settings.authSetting['scope.userLocation']) await wxApi.authorize({ scope: 'scope.userLocation' });
    // } catch (error) {
    //     await wxApi.showModal({ title: '警告', content: '小程序权限不足', showCancel: false, confirmText: '前往授权' });
    //     let authSetting = await wxApi.openSetting();
    //     if (!authSetting['scope.userLocation']) {
    //         await authorize();
    //     }
    // }
};
const multiTenantSuccessAfter = async loginResult => {
  debugger
    try {
        await Promise.all([
            wxApi.setStorage({ key: APP_CONST.STORAGE.ENTITY_IDS, data: loginResult.entityIds }),
            wxApi.setStorage({ key: APP_CONST.STORAGE.TENANT_ID, data: loginResult.tenantId }),
            wxApi.setStorage({ key: APP_CONST.STORAGE.TENANT_NAME, data: loginResult.tenantName || '' }),
            wxApi.setStorage({ key: APP_CONST.STORAGE.IS_ADMIN_USER, data: loginResult.isAdminUser }),
            wxApi.setStorage({ key: APP_CONST.STORAGE.ADMIN_USER_ID, data: loginResult.adminUserId }),
            wxApi.setStorage({ key: APP_CONST.STORAGE.ADMIN_USER_MOBILE, data: loginResult.adminUserMobile })
        ]);
        if(await util.checkIsCollection()){    //代收版
            await wxApi.setStorage({ key: APP_CONST.STORAGE.TENANT_ID, data: null }),
            wx.reLaunch({ url: '/pages/collectIndex/collectIndex' });
        }else{
            wx.reLaunch({ url: '/pages/index/index' });
        }
    } catch (error) {
        console.log(error);
        wxApi.showModal({ title: '提示信息', content: '小程序设置缓存失败', showCancel: false });
    }
};
const successAfter = async (loginResult, userInfo) => {
  debugger
    resetReTryCount();
 
    await Promise.all([
        wxApi.setStorage({ key: APP_CONST.STORAGE.USER_INFO, data: userInfo }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.TOKEN_KEY, data: loginResult.tokenId }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.SERVICE_TYPE, data: loginResult.serviceType }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.SERVICE_NAME, data: loginResult.serviceName }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.SERVICE_TYPE_NAME, data: loginResult.serviceTypeName }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.USER_ID, data: loginResult.userId }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.USER_NAME, data: loginResult.userName }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.USER_TYPE, data: loginResult.userType }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.USER_TYPE_RESERVE, data: loginResult.userType }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.AVATAR_URL, data: loginResult.avatarUrl }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.MOBILE_PHONE, data: loginResult.mobilePhone }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.TENANT_NAME, data: loginResult.tenantName || '' }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.IS_MULTI_TENANT_USER, data: loginResult.isMultiTenantUser }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.SAVE_TIME, data: new Date().getTime() }),
        wxApi.setStorage({ key: APP_CONST.STORAGE.IS_LOGIN_JUST, data: true })
    ]);
    if (loginResult.isMultiTenantUser) {
        let tenantList = loginResult.tenantList;
        wx.navigateTo({ url: '/pages/chooseTenant/chooseTenant?tenantList=' + JSON.stringify(tenantList) });
    } else {
        multiTenantSuccessAfter(loginResult);
    }
};

const login = async () => {
  debugger
    // 登录
    try {
        wx.showLoading({ title: '检查登录...', mask: true });
        let loginWXResult = await wxApi.login();              //loginWXResult.code
        let userInfo = await wxApi.getUserInfo();             // 获取用户信息
        await authorize();
        let loginParams = { appCode: appConfig.appCode, code: loginWXResult.code, fullUserInfo: userInfo };
        let loginResult = await webApi.login(loginParams);    //登录后台
        if (loginResult.info == 1) {                          //1登录成功 2 未绑定OpenId
            successAfter(loginResult, userInfo);
        } else if (loginResult.info == 2) {
            //跳转到登录页面
            let pageArr = getCurrentPages();
            let page = pageArr[pageArr.length - 1];
            if (page) {
                if (page.route != 'pages/login/login') wx.reLaunch({ url: '/pages/login/login' });
            } else {
                wx.reLaunch({ url: '/pages/login/login' });
            }
        }
    } catch (error) {
        if (error && error.errMsg && error.errMsg.indexOf('getUserInfo:fail') >= 0) {
            //跳转到授权页面            
            wx.reLaunch({ url: '/pages/authorize/authorize' });
        } else if (error && error.message && error.message == '登录失败') {
            reTryCount++;
            if (reTryCount < 5) {       //重试5次
                login();
            } else {
                //跳转到登录页面
                let pageArr = getCurrentPages();
                let page = pageArr[pageArr.length - 1];
                if (page) {
                    if (page.route != '/pages/login/login') wx.reLaunch({ url: '/pages/login/login' });
                } else {
                    wx.reLaunch({ url: '/pages/login/login' });
                }
            }
        }
        console.error('app::::error', error);
    } finally {
        wx.hideLoading();
    }
};

export default { resetReTryCount, authorize, successAfter, multiTenantSuccessAfter, login };