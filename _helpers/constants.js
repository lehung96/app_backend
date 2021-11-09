// const {statusDsa} =  require('../config/enum')
module.exports = {
    API_CODE: {
        SUCCESS: 200,
        TEXT_SUCCESS: "Success",
        ERROR: 400,
        TEXT_ERROR: "Error",
    },
    EXPIRED_TOKEN: "7d",
    STATUS_COMMON: {
        ACTIVE: 1,
        INACTIVE: 0,
    },
    FINAL_DECISION: {
        AUTO: "Auto",
        MANUAL: "Manual"
    },
    STATUS_CODE_ACTIVE: {
        ACTIVE: "ACTIVE",
        INACTIVE: "INACTIVE",
    },
    STATUS_CONTRACT: {
        ACTIVE: "ACTIVATED",
        INACTIVE: "INACTIVATED",
    },
    ACCOUNT_CIC: {
        USERNAME: "TESTS372",
        PASSWORD: "admin123"
    },
    SECRET_TOKEN: "dsa2021",
    SECRET_TOKEN_PASS: "passdsa2021",
    TOKEN_EKYC: "6453bbfc83eaa93be97c667583b22ab8a9d24476",
    URL_SERVER: "http://internal-dev-alb-cls-internal-785270710.ap-southeast-1.elb.amazonaws.com/dsa-web-v1/",
    URL_API: {
        CHECK_CIC: "http://10.31.150.4:8080/h2hServiceQuestions/h2hQuestions?wsdl",
        CHECK_EKYC: "https://uatapis.easycredit.vn/cdl-los/v1/ekycbase64"
    },
    FUNCTION_CODE: {
        viewAllUser: "viewAllUser",
        editAllUser: "editAllUser",
        view3PUser: "view3PUser",
        edit3PUser: "edit3PUser",
        createAllUser: "createAllUser",
        create3PUser: "create3PUser"
    },
    STATUS_DSA: {
        NEW: "new", //mới
        PASS_SS: "passSS", //đang xét duyệt
        REJECT_SS: "rejectSS",  //Huỷ
        PASS_AIS: "passAIS",    //đang xét duyệt
        REJECT_AIS: "rejectAIS",    //Từ chối
        TIMEOUT_AIS: "timeoutAIS",  //đang xét duyệt
        PASS_IMX: "passIMX",        //đang xét duyệt
        REJECT_IMX: "rejectIMX",    //Từ chối
        TIMEOUT_IMX: "timeoutIMX",  //đang xét duyệt
        PASS_CONTRACT: "passContract",  //đang xét duyệt
        REJECT_CONTRACT: "rejectContract",  //Từ chối
        TIMEOUT_CONTRACT: "timeoutContract",    //đang xét duyệt
        PASS_REFERENCES: "passReferences",      //đang xét duyệt
        REJECT_REFERENCES: "rejectReferences",  //từ chối
        TIMEOUT_REFERENCES: "timeoutReferences",    //đang xét duyệt
        PASS_DSA: "passDSA",        //đang xét duyệt
        REJECT_DSA: "rejectDSA",    //Từ chối
        TIMEOUT_DSA: "timeoutDSA",  //đang xét duyệt
        PASS_CIC: "passCIC",        //đang xét duyệt   
        REJECT_CIC: "rejectCIC",    //Từ chối
        TIMEOUT_CIC: "timeoutCIC",  //đang xét duyệt
        PASS_EKYC: "passEkyc",      //đang xét duyệt
        REJECT_EKYC: "rejectEkyc",  //Từ chối
        TIMEOUT_EKYC: "timeoutEkyc",//đang xét duyệt
        PASS: "pass",               //Đã kiểm duyệt
        TIMEOUT: "timeout",         //AF: Chờ duyệt, SS: đang xét duyệt
        PASS_AF: "passAF",          //Đã kiểm duyệt
        REJECT_AF: "rejectAF",      //Từ chối
        CANCEL: "cancel",            //Huỷ
        ACCOUNTGRANTING: 'accountgranting', //Đã tạo tài khoản
		COMPLETED: 'completed',             //Hoàn tất
    },
    statusDsaNVKD: {
		NEW: 'new',                             //Mới
		REVIEWING: 'reviewing',                 //Đang xét duyệt tự động
        TIMEOUT: 'timeout',                     //Đang xét duyệt AFM
	    APPROVED: 'approved',                   //Đã kiểm duyệt
		ACCOUNTGRANTING: 'accountgranting',     //Đã tạo tài khoản
		COMPLETED: 'completed',                 //Hoàn tất
        CANCEL: 'cancel',                       //Huỷ
		REJECTED: 'rejected',                   //Từ chối
	},

    statusDsaRequest: {
		NEW: 'new',
		REVIEWING: 'reviewing',
		// CENSORED: 'censored',
        APPROVED: 'approved',
		ACCOUNTGRANTING: 'accountgranting',
		COMPLETED: 'completed',
        CANCEL: 'cancel',                       //Huỷ
		REJECTED: 'rejected',                   //Từ chối
	},

    NHOM_NO_PASS : [
        1
    ],
    NHOM_NO_REJECT : [
        3, 4, 5
    ],
    NHOM_NO_CHU_Y : [
        2
    ],
    UPDATE_STATUS_REQUEST: {
        DONE: "done",
        FAIL: "fail"
    },
    CHECK_RESULT: {
        PASS: "pass",
        REJECT: "reject",
        TIMEOUT: "timeout"
    },
    MESSAGE_ID: {
        conflic: 1,             //[DSA.6] Ứng viên cung cấp thông tin mâu thuẫn
        activeContract: 14,     //[DSA.18] Hồ sơ không hợp lệ chưa phân lý do
        blacklist: 4,           //[DSA.9] Ứng viên có thông tin blacklist
        codeActive: 3,          //[DSA.8] Đang có code sale active
        badDebt: 5,             //[DSA.10] Bad debt (>=G3)
        warningDebt: 6,         //[DSA.11] Nợ chú ý (G2)
        idCard: 7,              //[DSA.12] CMND/ CCCD không hợp lệ
        undefined: 14           //[DSA.18] Hồ sơ không hợp lệ chưa phân lý do
    },
    //Reason AF type
    RESSON_TYPE: {
        CANCEL: "cancel",
        REJECT: "reject"
    }
};
