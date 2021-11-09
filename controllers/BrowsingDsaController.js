const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database/db");
const mailer = require("../_helpers/mailer");
const {decodeToken} = require("../_helpers/func")
const logger = require("../logger/index")
const forgotPasswordHtml = require("../files/email/forgotPassword")

const {
    EXPIRED_TOKEN,
    API_CODE,
    STATUS_COMMON,
    SECRET_TOKEN,
    SECRET_TOKEN_PASS,
    URL_SERVER
} = require("../_helpers/constants");

const { commonResponse } = require("./../models/Response");
const {
    getPagingData,
    getPagination,
    getParseInt,
} = require("../_helpers/func");
const {
    getErrorMsgExist,
    getErrorMsgNotExist,
    getErrorMsgNotActive,
    getDateTimeNow,
    generateUserToken, 
    getErrorMsgIncorrect
} = require("../_helpers/func");

class BrowsingDsaController {
    static async getListRejectReason(req, res) {
        try {
            let listRejectReason = await db.manyOrNone("SELECT * FROM reject_code")

            logger("getListRejectReason", req.body, "trả về listRejectReason")
            return res.status(200).json(
                commonResponse(200, "Success", listRejectReason, req)
            )
        } catch (error) {
            logger("getListRejectReason", error + "", "Lỗi hệ thống!")
            return res.status(400).json(
                commonResponse(400, "System error: Lấy danh sách thất bại!", error + "", req)
            )
        }
    }
}

module.exports = BrowsingDsaController;