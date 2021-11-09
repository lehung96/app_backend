const {STATUS_DSA} = require("../_helpers/constants")
module.exports = {
    // listPass :[
    //     STATUS_DSA.PASS,
    //     STATUS_DSA.PASS_AF
    // ],

    //Mới
    // STATUS_DSA.NEW

    //Đang kiểm duyệt tự động
    listReviewing : [
        STATUS_DSA.PASS_SS,
        STATUS_DSA.PASS_AIS,
        STATUS_DSA.PASS_IMX,
        STATUS_DSA.PASS_CONTRACT,
        STATUS_DSA.PASS_REFERENCES,
        STATUS_DSA.PASS_DSA,
        STATUS_DSA.PASS_CIC,
        STATUS_DSA.PASS_EKYC,
        STATUS_DSA.TIMEOUT_AIS,
        STATUS_DSA.TIMEOUT_IMX,
        STATUS_DSA.TIMEOUT_CONTRACT,
        STATUS_DSA.TIMEOUT_REFERENCES,
        STATUS_DSA.TIMEOUT_DSA,
        STATUS_DSA.TIMEOUT_CIC,
        STATUS_DSA.TIMEOUT_EKYC
    ],

    //Đang kiểm duyệt AFM
    // STATUS_DSA.TIMEOUT

    // Đã kiểm duyệt
    listApproved: [
        STATUS_DSA.PASS,
        STATUS_DSA.PASS_AF
    ],

    //Đang tạo tài khoản
    // STATUS_DSA.ACCOUNTGRANTING

    //Hoàn tất
    // DSA.COMPLETED

    //Huỷ
    listCancel: [
        STATUS_DSA.CANCEL,
        STATUS_DSA.REJECT_SS
    ],
    
    //Từ chối
    listReject: [
        STATUS_DSA.REJECT_AIS,
        STATUS_DSA.REJECT_IMX,
        STATUS_DSA.REJECT_CONTRACT,
        STATUS_DSA.REJECT_REFERENCES,
        STATUS_DSA.REJECT_DSA,
        STATUS_DSA.REJECT_CIC,
        STATUS_DSA.REJECT_EKYC,
        STATUS_DSA.REJECT_AF
    ]
}