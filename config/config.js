const config = {
    TOKEN_URL: "https://10.0.9.4:8095/api/uaa/oauth/token?grant_type=client_credentials",
    TOKEN_AUTH: "Basic ZHNhX21vYmlsZV9jbGllbnQ6dGU0dk9xeEowWUFqY3Fmd3ZsQWhONThsR1ZsYnBvd0s=",    
    LOGIN_URL: "http://internal-dev-alb-cls-internal-785270710.ap-southeast-1.elb.amazonaws.com/aaa/v02/authen/signin",
    PRODUCT_LIST: "https://10.0.9.4:8095/api/loanServices/v1/product-list",
    PRODUCT_FIELD: "https://10.0.9.4:8095/api/loanServices/v1/full-field-info-by-product-code",
    CHECK_ELIGIBLE: "https://10.0.9.4:8095/api/eligibleService/v1/eligible/check",
    // GET_OFFER: "https://apipreprod.easycredit.vn/api/loanRequestServices/v1/mobi/offers?request_id=",
    GET_OFFER: "https://10.0.9.4:8095/api/loanRequestServices/v1/dsa/offers",
    SELECT_OFFER: "https://10.0.9.4:8095/api/loanRequestServices/v1/dsa/select-offer",
    SEND_LOAN: "https://10.0.9.4:8095/api/loanRequestServices/v1/dsa/send-loan-application",
    // LOGIN_URL: "http://internal-prod-alb-cls-internal-1968342245.ap-southeast-1.elb.amazonaws.com/aaa/v02/authen/signin",
    // PRODUCT_LIST: "https://10.0.9.2:8095/api/loanServices/v1/product-list",
    // PRODUCT_FIELD: "https://10.0.9.2:8095/api/loanServices/v1/full-field-info-by-product-code",
    // CHECK_ELIGIBLE: "https://10.0.9.2:8095/api/eligibleService/v1/eligible/check",
    // GET_OFFER: "https://10.0.9.2:8095/api/loanRequestServices/v1/dsa/offers",
    // SELECT_OFFER: "https://10.0.9.2:8095/api/loanRequestServices/v1/dsa/select-offer",
    // SEND_LOAN: "https://10.0.9.2:8095/api/loanRequestServices/v1/dsa/send-loan-application",    
    CHANNEL: "DSA",
    CLIENT_ID: "ECVN",
    CLIENT_ID_PRODUCT: "10",
    CLIENT_SECRET: "zq8WqUX49w92r3A3JKstEQv6LAHHPhP",
    PARTNER_CODE: "DMB",
    PRODUCT_LINE: "BUSINESS",
    DSA_AGENT_CODE: "D24P01041",
    LOCAL_PATH: "/var/dsa-mobile-docs/",
    
    
    REJECTED: "REJECTED|FAIL_MANUAL_KYC|NOT_ELIGIBLE|FAIL_EKYC", //Đơn vay không được duyệt
    VALIDATED: "VALIDATED", //Chọn gói vay
    APPROVED: "APPROVED",//Khoản vay đã được duyệt
    SIGNED: "SIGNED",//Đã ký hợp đồng
    ACTIVATED: "ACTIVATED",//Đơn vay đã giải ngân
    TERMINATED: "TERMINATED",//Đơn vay đã đóng
    RESUBMIT: "RESUBMIT|KYC_RESUBMIT",//Cung cấp lại chứng từ
    CANCELED: "CANCELED|SYSTEM_ERROR|DUPLICATED",//Đơn vay bị hủy
    NOT_SUITABLE_OFFER: "NOT_SUITABLE_OFFER",//Số tiền đề nghị vay không hợp lệ
    PROGRESS: "RECEIVED",//Đơn vay đang xử lý

    CLIENT_ID_LEAD: "dmb_dsa_client",
    CLIENT_SECRET_LEAD: "dmbvOqxJ0YAjcqfwvlAhN58lGVlbpowK",

    SFTP_SERVER: "10.0.7.5",
    SFTP_PORT: "2222",
    SFTP_USER: "dsamobilesftpnpu",
    SFTP_PASSWORD: 'Abc13579',    //'R7-psUT"+WADUS6v',
    SFTP_PATH: "/uploads/mobile",

    // SFTP_SERVER: "10.0.12.5",
    // SFTP_PORT: "22",
    // SFTP_USER: "dmbsftpprd",
    // SFTP_PASSWORD: "95Z7/7/tWjF>T?b+",
    // SFTP_PATH: "/uploads/dmb",


    REJ_AGE: "Độ tuổi không hợp lệ (độ tuổi hợp lệ 20 - 60)",
    REJ_INCOME: "Thu nhập không hợp lệ (< 4.5 tr VND)",
    REJ_FINCAP: "Vượt quá khả năng tài chính",
    REJ_POLICY: "Không thỏa chính sách cho vay tại EC",
    NOT_ELIGIBLE: "Hồ sơ không đạt",
    FAIL_EKYC: "Không đạt định danh điện tử (eKYC)",
    KYC_RJPOLICY: "Không thỏa chính sách cho vay tại EC",
    CKYC_WRI01: "Sai tên",
    CKYC_WRI02: "Sai ngày tháng năm sinh",
    CKYC_WRI03: "Sai số CMND",
    CKYC_WRI04: "Sai số CMND",
    CKYC_WRI05: "Sai số CMND",
    CKYC_MIS01: "Vượt quá số ký tự cho phép",
    CKYC_EXP01: "CMND quá hạn",
    CKYC_WRI06: "CMND sai định dạng, không phải CMND theo quy định (CM quân đội, hộ chiếu, thẻ quân nhân,…)",
    CKYC_MID01: "Thiếu hình mặt trước/sau CMND, selfie",
    CKYC_MID02: "Thiếu toàn bộ hình",
    CKYC_QUD01: "CMND bị mờ",
    CKYC_QUD02: "Hình selfie bị mờ, không rõ ràng, chói lóa, có vật cản,..",
    CKYC_WRD01: "Hình chụp KH không hợp lệ (nghiêng mặt, cúi mặt, sử dụng phần mềm chỉnh sửa, khoảng cách chụp quá xa hoặc không phải ảnh chân dung…)",
    CKYC_WRD03: "Sai thứ tự hình ảnh",
    CKYC_MM001: "Yêu cầu kiểm lại toàn bộ thông tin KH",
    ADD_CURR01: "Sai địa chỉ KH",
    CNTT_PRIM1: "Không liên hệ được KH để xác nhận thông tin",
    CNTT_RFTCF: "KH không đồng ý xác nhận lại thông tin",
    CKYC_DOI01: "Sai ngày cấp CMND/CCCD",
    CKYC_IVLID: "Hình CMND/CCCD vô hiệu (vd mất góc, cắt góc, đục lỗ, CMND photo, in màu…)",
    CKYC_OTDEV: "Hình CMND/CCCD chụp qua thiết bị khác, không chụp trực tiếp, …",
    CKYC_PHONE: "Trùng số điện thoại (sdt KH, người thân trùng nhau)",
    REJ_POLICY: "Không thỏa chính sách cho vay tại EC",
    NOT_SUITABLE_OFFER: "Số tiền đề nghị vay không hợp lệ",
    DUPLICATED: "Đã có hồ sơ vay đang xử lý",
    
}

module.exports = config;