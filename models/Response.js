const logger = require("../logger");
const _ = require("lodash")

exports.login = (status_code, result, username) => {
    if (status_code == 200) {
        let partner_code =
            username.charAt(0).toUpperCase() === "D"
                ? username.slice(1).substring(0, 3)
                : username.substring(0, 3);
        //let partner_code  = "DMB"
        //result.partner_code = partner_code.toUpperCase()
        result.partner_code = "DMB";
        return {
            status_code: 200,
            body: {
                code: "SUCCESS",
                message: "SUCCESS",
                data: result,
            },
            status: 0,
            uiid: result.uiid,
            token: result.access_token,
            msg: "Dang nhap thanh cong",
        };
    }

    return {
        status_code: 200,
        body: {
            code: "ERROR",
            message: "Tài khoản hoặc mật khẩu không đúng!",
            data: null,
        },
        status: 1,
        msg: "Tài khoản hoặc mật khẩu không đúng!",
    };
};

exports.product_list = (status_code, result) => {
    return {
        status_code: status_code,
        body: {
            code: result.code,
            message: result.message,
            data: result.data,
        },
    };
};

exports.eligible = (status_code, result) => {
    return {
        status_code: status_code,
        body: {
            code: result.code,
            message: result.message,
            data: result.data,
        },
    };
};

exports.loanResponse = (status_code, code, data) => {
    return {
        status_code,
        body: {
            code,
            data,
        },
    };
};

exports.error = (status_code, error) => {
    return {
        status_code,
        message: error.toString(),
    };
};

exports.get_offer = (status_code, data) => {
    return {
        status_code,
        body: {
            code: data.code,
            message: data.message,
            data: data.data,
        },
    };
};

exports.get_select_offer = (code, message, data) => {
    return {
        code,
        message,
        data: {
            proposal_id: data.proposal_id,
            request_id: data.request_id,
        },
    };
};

exports.updateStatus = (status_code, data) => {
    return {
        status_code,
        body: {
            code: data.code,
            message: data.message,
        },
    };
};

exports.commonResponse = (code, message, body, req = {}) => {
    try {
        if(!_.isEmpty(req)) {
            req.code = code
            req.message = message
        }
        logger(req.url, body, "Response", code === 200 ? "info" : "error", req)
        
        return {
            code,
            message,
            body: body || {},
        }
    } catch (error) {
        console.log(error + "")
        return {
            code,
            message,
            body: body || {},
        };
    }
};
