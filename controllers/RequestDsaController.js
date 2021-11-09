const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database/db");
const { sendMail } = require("../_helpers/mailer");
const { getMessageResult, objectToString, stringToObject } = require("../_helpers/func");
const logger = require("../logger/index");
const sendAccountHtml = require("../files/email/sendAccount");
const _ = require("lodash");
const generator = require("generate-password");
const ExcelJS = require("exceljs");
const axios = require("axios");
const moment = require("moment");
moment.locale("vn");
const XMLparse = require('fast-xml-parser');

const {
    API_CODE,
    URL_API,
    STATUS_DSA,
    NHOM_NO_PASS,
    NHOM_NO_REJECT,
    NHOM_NO_CHU_Y,
    TOKEN_EKYC,
    MESSAGE_ID,
    statusDsaNVKD,
    ACCOUNT_CIC,
    STATUS_CODE_ACTIVE,
    STATUS_CONTRACT
} = require("../_helpers/constants");
const { listReviewing, listApproved, listCancel, listReject } = require('../config/enum');

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
    getErrorMsgIncorrect,
} = require("../_helpers/func");

class RequestDsaController {
    static async getListRequestFor3P(req, res) {
        try {
            const { page, size } = req.body;
            const userID = req.user.users_id;
            const { limit, offset } = getPagination(page, size);

            let queryList = `
                SELECT * FROM dsa_request
                    WHERE users_id = ${userID}
                    ORDER BY create_at DESC LIMIT ${limit} OFFSET ${offset}
            `;

            const queryCount = `
                SELECT COUNT(dsa_request_id) AS count FROM dsa_request
                    WHERE users_id = ${userID}
            `;
            const listRequest = await db.manyOrNone(queryList);
            logger("getListRequestFor3P", listRequest, "Lấy danh sách request");

            const countListRequest = await db.one(queryCount);
            logger("getListRequestFor3P", countListRequest, "Lấy tổng số");

            const result = getPagingData(
                listRequest,
                getParseInt(countListRequest.count),
                page,
                limit
            );
            logger("getListRequestFor3P", result, "Trả về danh sách");

            res
                .status(200)
                .json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result, req));
        } catch (error) {
            logger(
                "getListRequestFor3P",
                error + "",
                "Lấy danh sách request thất bại!"
            );
            res
                .status(400)
                .json(
                    commonResponse(400, "Lấy danh sách request thất bại!", error + "", req)
                );
        }
    }

    static async getDetailRequestFor3P(req, res) {
        try {
            logger("getDetailRequestFor3P", req.body, "Gọi api");
            const { dsaRequestID } = req.body;
            const userID = req.user.users_id

            const queryDetailRequest = `
                SELECT * FROM dsa_request
                    WHERE dsa_request_id = ${dsaRequestID}
            `;

            const queryListUserDSA = `
                SELECT * FROM users_temporary
                    WHERE dsa_request_id = ${dsaRequestID}
            `;

            const request = await db.one(queryDetailRequest);
            logger("getDetailRequestFor3P", request, "Lấy chi tiết request");

            if (request.users_id !== userID) {
                throw { error: "Yêu cầu bị từ chối!", code: 403 };
            }

            const countListUserDSA = await db.manyOrNone(queryListUserDSA);
            logger(
                "getDetailRequestFor3P",
                countListUserDSA,
                "Lấy danh sách tài khoản DSA"
            );

            const result = { requestDSA: request, listUserDSA: countListUserDSA };

            res
                .status(200)
                .json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result, req));
        } catch (error) {
            logger(
                "getDetailRequestFor3P",
                error.error || error + "",
                "Lấy danh sách user DSA thất bại!"
            );

            if (error.error) {
                res
                    .status(400)
                    .json(
                        commonResponse(
                            400,
                            "Lấy danh sách user DSA thất bại!",
                            error.error,
                            req
                        )
                    );
            }
            res
                .status(400)
                .json(
                    commonResponse(400, "Lấy danh sách user DSA thất bại!", error + "", req)
                );
        }
    }

    static async getAllPartnerCode(req, res) {
        try {
            logger(
                "getAllPartnerCode",
                { body: req.body, user: req.user },
                "gọi api"
            );

            const partnerCode = await db.manyOrNone(
                "SELECT * FROM code_3p LIMIT 1000"
            );

            logger("getAllPartnerCode", partnerCode, "lấy danh sách code 3P");

            const listPartnerCode = partnerCode.map((item) => item.code3p);
            return res
                .status(200)
                .json(commonResponse(200, "Thành công!", listPartnerCode, req));
        } catch (error) {
            logger("getAllPartnerCode", error + "", "Lỗi", "error");
            return res.status(400).json(commonResponse(400, error + "", error, req));
        }
    }

    static getStatusDsaForExcel(status) {
        try {
            let newStatus = ""

            switch (true) {
                case status === STATUS_DSA.NEW:
                    newStatus = "Mới"
                    break
                case listApproved.includes(status):
                    newStatus = "Đã kiểm duyệt"
                    break
                case status === STATUS_DSA.ACCOUNTGRANTING:
                    newStatus = "Đã tạo tài khoản"
                    break
                case status === STATUS_DSA.COMPLETED:
                    newStatus = "Hoàn tất"
                    break
                case listCancel.includes(status):
                    newStatus = "Huỷ"
                    break
                case listReject.includes(status):
                    newStatus = "Từ chối"
                    break
                case listReviewing.includes(status):
                    newStatus = "Đang kiểm duyệt tự động"
                    break
                case status === STATUS_DSA.TIMEOUT:
                    newStatus = "Đang kiểm duyệt AFM"
                    break
                default:
                    newStatus = ""
                    break
            }

            logger("getStatusDsaForExcel", {status, newStatus}, "Trả về status");
            return newStatus
        } catch (error) {
            logger("getStatusDsaForExcel", error + "", "Lỗi", "error");
            return ""
        }
    }

    static getStatusDsaForExcelDetail(status) {
        try {
            let newStatus = ""

            switch (true) {
                case status === STATUS_DSA.NEW:
                    newStatus = "Mới"
                    break
                case listApproved.includes(status):
                    newStatus = "Đã kiểm duyệt"
                    break
                case status === STATUS_DSA.ACCOUNTGRANTING:
                    newStatus = "Đã tạo tài khoản"
                    break
                case status === STATUS_DSA.COMPLETED:
                    newStatus = "Hoàn tất"
                    break
                case status === STATUS_DSA.REJECT_SS:
                    newStatus = "SS huỷ"
                    break
                case status === STATUS_DSA.CANCEL:
                    newStatus = "AF huỷ"
                    break
                case status === STATUS_DSA.REJECT_AF:
                    newStatus = "AF từ chối"
                    break
                case status === STATUS_DSA.REJECT_AIS:
                    newStatus = "Từ chối tại kiểm duyệt AIS"
                    break
                case status === STATUS_DSA.REJECT_IMX:
                    newStatus = "Từ chối tại kiểm duyệt IMX"
                    break
                case status === STATUS_DSA.REJECT_CONTRACT:
                    newStatus = "Từ chối tại kiểm duyệt Active Contract"
                    break
                case status === STATUS_DSA.REJECT_REFERENCES:
                    newStatus = "Từ chối tại kiểm duyệt References"
                    break
                case status === STATUS_DSA.REJECT_CIC:
                    newStatus = "Từ chối tại kiểm duyệt CIC"
                    break
                case status === STATUS_DSA.REJECT_EKYC:
                    newStatus = "Từ chối tại kiểm duyệt E-kyc"
                    break
                case listReviewing.includes(status):
                    newStatus = "Đang kiểm duyệt tự động"
                    break
                case status === STATUS_DSA.TIMEOUT:
                    newStatus = "Đang kiểm duyệt AFM"
                    break
                default:
                    newStatus = ""
                    break
            }

            logger("getStatusDsaForExcel", {status, newStatus}, "Trả về status");
            return newStatus
        } catch (error) {
            logger("getStatusDsaForExcel", error + "", "Lỗi", "error");
            return ""
        }
    }

    //Xuất dữ liệu cho SS màn xem chi tiết
    static async exportRequestDSA(req, res) {
        try {
            const { dsaRequestID } = req.body;

            const workbook = new ExcelJS.Workbook();

            //Sheet chứa toàn bộ danh sách
            const worksheet2 = workbook.addWorksheet("DSA request");
            worksheet2.columns = [
                { header: "NO", key: "no", width: 5 },
                { header: "Mã đề nghị", key: "dsa_request_code", width: 20},
                { header: "Mã đối tác", key: "code3p", width: 10 },
                { header: "TIMESTAMP", key: "updated_at", width: 15 },
                { header: "DSA name", key: "name_user", width: 30 },
                { header: "DOB", key: "birth", width: 15 },
                { header: "ID card", key: "id_card", width: 15, style: { numFmt: '@' } },
                { header: "Phone number", key: "phone_number", width: 15, style: { numFmt: '@' } },
                { header: "Position", key: "position_user", width: 10 },
                { header: "Work place", key: "work_place", width: 15 },
                { header: "Email", key: "email", width: 40 },
                { header: "DIRECT REPORT LINE", key: "direct_report_line", width: 30 },
                { header: "TITTLE OF DIRECT REPORT LINE", key: "title_of_direct_report_line", width: 20 },
                { header: "Phone of DRL", key: "phone_of_direct_report_line", width: 15, style: { numFmt: '@' } },
                { header: "Email of direct report line", key: "email_of_direct_report_line", width: 40 },
                { header: "SENT RISK DATE", key: "send_risk_at", width: 15 },
                { header: "CHECK RESULT", key: "status", width: 25 },
                { header: "Reason", key: "reason", width: 20 },
                { header: "Note", key: "note", width: 20 },
                { header: "Sale code", key: "dsa", width: 20 },
                { header: "Password", key: "pass", width: 20 },
                { header: "DATE SEND CONFIRMED LETTER", key: "created_at", width: 20 },
            ];

            let count2 = 1;

            const queryListUserDSA = `
                SELECT ad.dsa, ad.pass, ut.*, code_3p.code3p, dr.dsa_request_code, rss.reason, raf.reason_3p
                    FROM users_temporary AS ut LEFT JOIN account_dsa AS ad ON (ut.id_card = ad.id_card AND ut.dsa_request_id = ad.dsa_request_id)
                        LEFT JOIN users AS u ON ut.users_id = u.users_id
                            LEFT JOIN code_3p ON u.code_3p_id = code_3p.code_3p_id
                                LEFT JOIN dsa_request AS dr ON ut.dsa_request_id = dr.dsa_request_id
                                    LEFT JOIN reject_reason_ss AS rss ON ut.reject_reason_id = rss.reject_reason_id
                                        LEFT JOIN reject_reason_af AS raf ON ut.reject_reason_id_af = raf.reject_reason_id
                    WHERE ut.dsa_request_id = ${dsaRequestID}
            `;

            const listUserDSA = await db.manyOrNone(queryListUserDSA);
            logger("exportRequestDSA", listUserDSA, "Lấy danh sách toàn bộ hồ sơ DSA trong request " + dsaRequestID);

            listUserDSA.forEach((user) => {
                user.no = count2;
                user.status = RequestDsaController.getStatusDsaForExcelDetail(user.status)
                user.reason = user.reason || user.reason_3p
                worksheet2.addRow(user);
                count2++;
            });

            //CSS header
            worksheet2.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: {argb: "FFFFFFFF"} };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: "FF1F4E78"
                    },
                    // bgColor:{argb:'FF1F4E78'}
                }
                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true
                }
            });

            //Thêm border cho mỗi cell
            worksheet2.eachRow(row => {
                for(let i = 1; i <= worksheet2.columns.length; i++) {
                    row.getCell(i).border = {
                        top: {style: "thin"},
                        bottom: {style: "thin"},
                        right: {style: "thin"},
                        left: {style: "thin"}
                    }
                }
            })

            //Sheet chứa tài khoản đã được tạo
            const worksheet = workbook.addWorksheet("DSA account");
            worksheet.columns = [
                { header: "NO", key: "no", width: 5 },
                { header: "TIMESTAMP", key: "time_stamp", width: 15 },
                { header: "DSA name", key: "dsa_name", width: 25 },
                { header: "DOB", key: "date_of_birth", width: 15 },
                { header: "ID card", key: "id_card", width: 15 },
                { header: "Phone number", key: "phone_number", width: 15 },
                { header: "Position", key: "position", width: 15 },
                { header: "Work place", key: "work_place", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "SENT IT", key: "sendit", width: 15 },
                { header: "DSA", key: "dsa", width: 20 },
                { header: "PASS", key: "pass", width: 15 },
                { header: "NOT FOR RISK", key: "not_for_risk", width: 20 },
                { header: "DATE SEND CONFIRMED LETTER", key: "created_at", width: 15 },
            ];

            let count = 1;

            const listAccountDSA = await db.manyOrNone(`
                SELECT ad.*, ut.status
                    FROM users_temporary AS ut LEFT JOIN account_dsa AS ad ON (ut.id_card = ad.id_card AND ut.dsa_request_id = ad.dsa_request_id)
                        WHERE ut.dsa_request_id = $1 AND ut.status = $2
            `, [dsaRequestID, STATUS_DSA.ACCOUNTGRANTING]);
            logger("exportRequestDSA", listAccountDSA, "Lấy danh sách tài khoản DSA");

            listAccountDSA.forEach((user) => {
                user.no = count;
                worksheet.addRow(user);
                count++;
            });

            //CSS header
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { 
                    bold: true,
                    color: {argb: 'FFFFFFFF'},
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: "FF1F4E78"
                    },
                    // bgColor:{argb:'FF1F4E78'}
                }
                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true
                }
            });

            //Thêm border cho mỗi cell
            worksheet.eachRow(row => {
                for(let i = 1; i <= worksheet.columns.length; i++) {
                    row.getCell(i).border = {
                        top: {style: "thin"},
                        bottom: {style: "thin"},
                        right: {style: "thin"},
                        left: {style: "thin"}
                    }
                }
            })

            const data = await workbook.xlsx.writeBuffer();

            res.attachment("users.xlsx");
            res.send(data);
        } catch (error) {
            console.log("Lỗi rồi má ơi: ", error);
            return res.status(400).json(commonResponse(400, error + "", {}, req));
        }
    }

    //Xuất dữ liệu cho SS theo thời gian
    static async exportRequestDSAByDate(req, res) {
        try {
            console.log("xxx");
            const { startDate, endDate } = req.body;

            if(new Date(startDate).getTime() > new Date(endDate)) {
                throw "Ngày bắt đầu không được lớn hơn ngày kết thúc!"
            }

            const workbook = new ExcelJS.Workbook();
            

            //Sheet chứa toàn bộ danh sách
            const worksheet2 = workbook.addWorksheet("DSA request");
            worksheet2.columns = [
                { header: "NO", key: "no", width: 5 },
                { header: "Mã đề nghị", key: "dsa_request_code", width: 20},
                { header: "Mã đối tác", key: "code3p", width: 10 },
                { header: "TIMESTAMP", key: "updated_at", width: 15 },
                { header: "DSA name", key: "name_user", width: 32 },
                { header: "DOB", key: "birth", width: 15 },
                { header: "ID card", key: "id_card", width: 15, style: { numFmt: '@' } },
                { header: "Phone number", key: "phone_number", width: 15, style: { numFmt: '@' } },
                { header: "Position", key: "position_user", width: 10 },
                { header: "Work place", key: "work_place", width: 15 },
                { header: "Email", key: "email", width: 40 },
                { header: "SENT RISK DATE", key: "send_risk_at", width: 15 },
                { header: "CHECK RESULT", key: "status", width: 25 },
                { header: "Reason", key: "reason", width: 20 },
                { header: "Note", key: "note", width: 20 },
                { header: "Sale code", key: "dsa", width: 15 },
                { header: "DATE SEND CONFIRMED LETTER", key: "created_at", width: 20 },
            ];

            let count2 = 1;

            const queryListUserDSA = `
                SELECT ad.dsa, ut.*, code_3p.code3p, dr.dsa_request_code, rss.reason, raf.reason_3p
                    FROM users_temporary AS ut LEFT JOIN account_dsa AS ad ON (ut.id_card = ad.id_card AND ut.dsa_request_id = ad.dsa_request_id)
                        LEFT JOIN users AS u ON ut.users_id = u.users_id
                            LEFT JOIN code_3p ON u.code_3p_id = code_3p.code_3p_id
                                LEFT JOIN dsa_request AS dr ON ut.dsa_request_id = dr.dsa_request_id
                                    LEFT JOIN reject_reason_ss AS rss ON ut.reject_reason_id = rss.reject_reason_id
                                        LEFT JOIN reject_reason_af AS raf ON ut.reject_reason_id_af = raf.reject_reason_id
                    WHERE ut.created_at >= '${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' AND ut.created_at <= '${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}'
            `;

            const listUserDSA = await db.manyOrNone(queryListUserDSA);
            logger("exportRequestDSA", listUserDSA, `Lấy danh sách toàn bộ hồ sơ DSA từ ngày ${startDate.toISOString()} đến ngày ${endDate.toISOString()}`);

            listUserDSA.forEach((user) => {
                user.no = count2;
                user.status = RequestDsaController.getStatusDsaForExcel(user.status)
                user.reason = user.reason || user.reason_3p
                worksheet2.addRow(user);
                count2++;
            });

            //CSS header
            worksheet2.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: {argb: "FFFFFFFF"} };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: "FF1F4E78"
                    },
                    // bgColor:{argb:'FF1F4E78'}
                }
                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true
                }
            });

            //Thêm border cho mỗi cell
            worksheet2.eachRow(row => {
                for(let i = 1; i <= worksheet2.columns.length; i++) {
                    row.getCell(i).border = {
                        top: {style: "thin"},
                        bottom: {style: "thin"},
                        right: {style: "thin"},
                        left: {style: "thin"}
                    }
                }
            })

            const data = await workbook.xlsx.writeBuffer();

            res.attachment("users.xlsx");
            res.send(data);
        } catch (error) {
            console.log(error.message);
            return res.status(400).json(commonResponse(400, error.message, {}, req));
        }
    }

    //Xuất dữ liệu cho AF theo thời gian
    static async exportRequestDSAByDateForAF(req, res) {
        try {
            const { startDate, endDate } = req.body;

            if(new Date(startDate).getTime() > new Date(endDate)) {
                throw "Ngày bắt đầu không được lớn hơn ngày kết thúc!"
            }

            const workbook = new ExcelJS.Workbook();
            

            //Sheet chứa toàn bộ danh sách
            const worksheet2 = workbook.addWorksheet("DSA request");
            worksheet2.columns = [
                { header: "NO", key: "no", width: 5 },
                { header: "DSA name", key: "name_user", width: 32 },
                { header: "DOB", key: "birth", width: 15 },
                { header: "ID card", key: "id_card", width: 15, style: { numFmt: '@' } },
                { header: "Phone number", key: "phone_number", width: 15, style: { numFmt: '@' } },
                { header: "Position", key: "position_user", width: 15 },
                { header: "Work place", key: "work_place", width: 20 },
                { header: "Email", key: "email", width: 40 },
                { header: "IMX blacklist status", key: "imx_blacklist_status", width: 15 },
                { header: "AIS blacklist status", key: "ais_blacklist_status", width: 15 },
                { header: "Loan contract status", key: "loan_contract_status", width: 15 },
                { header: "Dedup status", key: "dedup_status", width: 15 },
                { header: "Active code status", key: "active_code_status", width: 15 },
                { header: "CIC status", key: "cic_status", width: 15 },
                { header: "E-kyc status", key: "ekyc_status", width: 15 },
                { header: "Final decision", key: "final_decision", width: 15 },
                { header: "Final decision status", key: "status", width: 20 },
                { header: "Final decision date", key: "updated_at", width: 15 }
            ];

            let count2 = 1;

            const queryListUserDSA = `
                SELECT ad.dsa, ut.*, code_3p.code3p, dr.dsa_request_code
                    FROM users_temporary AS ut LEFT JOIN account_dsa AS ad ON (ut.id_card = ad.id_card AND ut.dsa_request_id = ad.dsa_request_id)
                        LEFT JOIN users AS u ON ut.users_id = u.users_id
                            LEFT JOIN code_3p ON u.code_3p_id = code_3p.code_3p_id
                                LEFT JOIN dsa_request AS dr ON ut.dsa_request_id = dr.dsa_request_id
                    WHERE ut.created_at >= '${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' AND ut.created_at <= '${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}'
            `;

            const listUserDSA = await db.manyOrNone(queryListUserDSA);
            logger("exportRequestDSA", listUserDSA, `Lấy danh sách toàn bộ hồ sơ DSA từ ngày ${startDate.toISOString()} đến ngày ${endDate.toISOString()}`);

            listUserDSA.forEach((user) => {
                user.no = count2;
                user.status = RequestDsaController.getStatusDsaForExcel(user.status)
                user.imx_blacklist_status = getMessageResult(user.message_imx)
                user.ais_blacklist_status = getMessageResult(user.message_ais)
                user.loan_contract_status = getMessageResult(user.message_contract)
                user.dedup_status = getMessageResult(user.message_references)
                user.active_code_status = getMessageResult(user.message_dsa)
                user.cic_status = getMessageResult(user.message_cic)
                user.ekyc_status = getMessageResult(user.message_ekyc)
                worksheet2.addRow(user);
                count2++;
            });

            //CSS header
            worksheet2.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: {argb: "FFFFFFFF"} };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: "FF1F4E78"
                    },
                    // bgColor:{argb:'FF1F4E78'}
                }
                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true
                }
            });

            //Thêm border cho mỗi cell
            worksheet2.eachRow(row => {
                for(let i = 1; i <= worksheet2.columns.length; i++) {
                    row.getCell(i).border = {
                        top: {style: "thin"},
                        bottom: {style: "thin"},
                        right: {style: "thin"},
                        left: {style: "thin"}
                    }
                }
            })

            const data = await workbook.xlsx.writeBuffer();

            res.attachment("users.xlsx");
            res.send(data);
        } catch (error) {
            console.log(error.message);
            return res.status(400).json(commonResponse(400, error.message, {}, req));
        }
    }

    //Xuất dữ liệu cho 3P màn xem chi tiết
    static async exportRequestDSAFor3P(req, res) {
        try {
            const { dsaRequestID } = req.body;

            const requestDSA = await db.oneOrNone(`
                SELECT * FROM dsa_request WHERE dsa_request_id = $1
            `, [dsaRequestID])

            if(!requestDSA || requestDSA.users_id !== req.user.users_id ) {
                throw "Mã yêu cầu không hợp lệ!"
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("DSA request");
            worksheet.columns = [
                { header: "NO", key: "no", width: 10 },
                { header: "TIMESTAMP", key: "updated_at", width: 20 },
                { header: "DSA name", key: "name_user", width: 35 },
                { header: "DOB", key: "birth", width: 20 },
                { header: "ID card", key: "id_card", width: 20 },
                { header: "Phone number", key: "phone_number", width: 20 },
                { header: "Position", key: "position_user", width: 20 },
                { header: "Work place", key: "work_place", width: 20 },
                { header: "Email", key: "email", width: 40 },
                { header: "SENT RISK DATE", key: "send_risk_at", width: 20 },
                { header: "CHECK RESULT", key: "status", width: 20 },
                { header: "Reason", key: "reason", width: 20 },
                { header: "Note", key: "note", width: 20 },
                { header: "DSA CODE", key: "dsa", width: 20 },
                { header: "DATE SEND CONFIRMED LETTER", key: "created_at", width: 40 },
            ];

            let count = 1;

            // const queryDetailRequest = `
            //     SELECT * FROM dsa_request
            //         WHERE dsa_request_id = ${dsaRequestID}
            // `;

            const queryListUserDSA = `
                SELECT ut.*, ad.dsa, rss.reason, raf.reason_3p
                    FROM users_temporary AS ut LEFT JOIN account_dsa AS ad ON (ut.id_card = ad.id_card AND ut.dsa_request_id = ad.dsa_request_id)
                        LEFT JOIN reject_reason_ss AS rss ON ut.reject_reason_id = rss.reject_reason_id
                            LEFT JOIN reject_reason_af AS raf ON ut.reject_reason_id_af = raf.reject_reason_id
                    WHERE ut.dsa_request_id = ${dsaRequestID}
            `;

            const listUserDSA = await db.manyOrNone(queryListUserDSA);
            console.log(listUserDSA);
            logger("exportRequestDSA", listUserDSA, "Lấy danh sách tài khoản DSA");

            listUserDSA.forEach((user) => {
                user.no = count;
                user.status = RequestDsaController.getStatusDsaForExcel(user.status)
                user.reason = user.reason || user.reason_3p
                worksheet.addRow(user);
                count++;
            });

            //CSS header
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: {argb: "FFFFFFFF"} };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: "FF1F4E78"
                    },
                    // bgColor:{argb:'FF1F4E78'}
                }
                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true
                }
            });

            //Thêm border cho mỗi cell
            worksheet.eachRow(row => {
                for(let i = 1; i <= worksheet.columns.length; i++) {
                    row.getCell(i).border = {
                        top: {style: "thin"},
                        bottom: {style: "thin"},
                        right: {style: "thin"},
                        left: {style: "thin"}
                    }
                }
            })

            const data = await workbook.xlsx.writeBuffer();

            res.attachment("users.xlsx");
            res.send(data);
        } catch (error) {
            console.log(error);
            return res.status(400).json(commonResponse(400, error + "", {}, req));
        }
    }

    static async sendAccountDSA(req, res) {
        try {

            const { requestID } = req.body;

            let listUser = await db.manyOrNone(
            `
                SELECT u.users_temporary_id, u.email, a.dsa, a.pass FROM users_temporary AS u, account_dsa AS a
                WHERE u.dsa_request_id = $1
                    AND a.dsa_request_id = $1
                    AND u.id_card = a.id_card
                    AND status = '${STATUS_DSA.ACCOUNTGRANTING}'
            `,
                [requestID]
            );

            if(_.isEmpty(listUser)) {
                throw "Không có hồ sơ nào đã tạo tài khoản!"
            }

            const listUserID = listUser.map(user => user.users_temporary_id)

            console.log(listUserID);
            const result = await db.tx(async t => {
                const listDSA = await t.none(`
                    UPDATE users_temporary SET status = '${STATUS_DSA.COMPLETED}' WHERE users_temporary_id IN ($1:csv)
                    `, [listUserID]
                )
                return t.batch([listDSA])
            })

            await RequestDsaController.updateStatusRequest(requestID)

            listUser.forEach(user => {
                const html = sendAccountHtml(
                    user.dsa,
                    user.pass
                );

                sendMail(
                    user.email,
                    "Tạo tài khoản DSA thành công!",
                    html
                )
                .then(result => {
                    logger("sendAccountDSA", result, `Gửi email cho ${user.email} thành công!`)
                })
                .catch(error => {
                    logger("sendAccountDSA", error + "", `Gửi email cho ${user.email} thất bại!`)
                })
            })
            const updateReq = ` UPDATE dsa_request
            SET
                update_by_user = ${req.user.users_id}
                WHERE dsa_request_id = ${requestID} `
        
            await db.query(updateReq)
            return res.status(200).json(
                commonResponse(200, "Thành công!", listUserID, req)
            );
        } catch (error) {
            return res.status(400).json(
                commonResponse(400, error + "", {}, req)
            );
        }
    }

    static async testCIC(req, res) {
        try {
            const id = req.body.id;
            const result = await RequestDsaController.checkCIC(id);

            return res.status(200).json(
                commonResponse(200, "Thành công!", result, req)
            );
        } catch (error) {
            logger("testEkyc", error + "", "Lỗi", "error");
            return res.status(400).json(commonResponse(400, error + "", error, req));
        }
    }

    static async autoCheckDSA(dsaID) {
        try {
            console.log("AutoCheck")
            logger("Hàm autoCheckDSA", dsaID, "Gọi hàm");

            const listTimeout = [];
            const resultAIS = await RequestDsaController.checkAISBlacklist(dsaID);
            if (resultAIS === STATUS_DSA.TIMEOUT_AIS) {
                listTimeout.push(resultAIS);
            } else if (resultAIS === STATUS_DSA.REJECT_AIS) {
                return;
            }

            const resultIMX = await RequestDsaController.checkIMXBlacklist(dsaID);
            if (resultIMX === STATUS_DSA.TIMEOUT_IMX) {
                listTimeout.push(resultIMX);
            } else if (resultIMX === STATUS_DSA.REJECT_IMX) {
                return;
            }

            const resultContract = await RequestDsaController.checkContract(dsaID);
            if (resultContract === STATUS_DSA.TIMEOUT_CONTRACT) {
                listTimeout.push(resultContract);
            } else if (resultContract === STATUS_DSA.REJECT_CONTRACT) {
                return;
            }

            const resultReferences = await RequestDsaController.checkReferencesForALoan(dsaID);
            if (resultReferences === STATUS_DSA.TIMEOUT_REFERENCES) {
                listTimeout.push(resultReferences);
            } else if (resultReferences === STATUS_DSA.REJECT_REFERENCES) {
                return;
            }

            const resultDSA = await RequestDsaController.checkDSA(dsaID);
            if (resultDSA === STATUS_DSA.TIMEOUT_DSA) {
                listTimeout.push(resultDSA);
            } else if (resultDSA === STATUS_DSA.REJECT_DSA) {
                return;
            }

            let resultCIC = null
            for(let i=0; i < 2; i++) {
                resultCIC = await RequestDsaController.checkCIC(dsaID);
                if(resultCIC === STATUS_DSA.PASS_CIC) {
                    break;
                }
                else if (resultCIC === STATUS_DSA.REJECT_CIC) {
                    return;
                }
            }
            if (resultCIC === STATUS_DSA.TIMEOUT_CIC) {
                listTimeout.push(resultCIC);
            } 

            let resultEkyc = null
            for(let i=0; i < 2; i++) {
                resultEkyc = await RequestDsaController.checkEkyc(dsaID);
                if(resultEkyc === STATUS_DSA.PASS_EKYC) {
                    break;
                }
                else if (resultEkyc === STATUS_DSA.REJECT_EKYC) {
                    return;
                }
            }
            if (resultEkyc === STATUS_DSA.TIMEOUT_EKYC) {
                listTimeout.push(resultEkyc);
            } 

            let updateStatus = null
            if (_.isEmpty(listTimeout)) {
                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1 WHERE users_temporary_id = $2 RETURNING *
                `,
                    [STATUS_DSA.PASS, dsaID]
                );
                logger(
                    "Hàm autoCheckDSA",
                    updateStatus,
                    `Chuyển hồ sơ DSA ${dsaID} cho SS tạo tài khoản`
                );

                const updateRequest = await RequestDsaController.updateStatusRequest(updateStatus.dsa_request_id)
                logger(
                    "Hàm autoCheckDSA",
                    updateRequest,
                    `Update trạng thái cho Request ${updateStatus.dsa_request_id}`
                );
            } else {
                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, send_risk_at = $2 WHERE users_temporary_id = $3 RETURNING *
                `,
                    [STATUS_DSA.TIMEOUT, moment(), dsaID]
                );
                logger(
                    "Hàm autoCheckDSA",
                    updateStatus,
                    `Chuyển hồ sơ DSA ${dsaID} cho AF duyệt`
                );
                const updateRequest = await RequestDsaController.updateStatusRequest(updateStatus.dsa_request_id)
                logger(
                    "Hàm autoCheckDSA",
                    updateRequest,
                    `Update trạng thái cho Request ${updateStatus.dsa_request_id}`
                );
            }
        } catch (e) {
            try {
                let updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1 WHERE users_temporary_id = $2 RETURNING *
                `,
                    [STATUS_DSA.TIMEOUT, dsaID]
                );
                logger(
                    "Hàm autoCheckDSA",
                    { error: e + "", result: updateStatus },
                    "Lỗi hệ thống: chuyển hồ sơ " + dsaID + "cho AF duyệt",
                    "error"
                );
                const updateRequest = await RequestDsaController.updateStatusRequest(updateStatus.dsa_request_id)
                logger(
                    "Hàm autoCheckDSA",
                    updateRequest,
                    `Update trạng thái cho Request ${updateStatus.dsa_request_id}`
                );
            } catch (error) {
                logger(
                    "Hàm autoCheckDSA",
                    { error1: e + "", error2: error + "" },
                    "Không chuyển được AF duyệt cho DSA " + dsaID,
                    "error"
                );
            }
        }
    }

    static async checkAISBlacklist(dsaID) {
        try {
            logger("Hàm checkAISBlacklist", dsaID, "Gọi hàm");
            let messageAIS = {
                result: "Đạt",
                message: " ",
                data: []
            }

            const dsa = await db.one(
                `
                SELECT * FROM users_temporary WHERE users_temporary_id = $1
            `,
                [dsaID]
            );

            logger("Hàm checkAISBlacklist", dsa, "Lấy thông tin DSA");
            const findUser = await db.manyOrNone(
                `
                SELECT * FROM ais_blacklist
                    WHERE id_card = $1 AND name_user ILIKE $2 AND birth = $3
                        OR id_card = $1 AND phone_number = $4
                        OR id_card = $1 AND name_user = $2
                        OR id_card = $1 AND birth = $3
                        OR id_card = $1 AND issue_date = $5
                        OR name_user = $2 AND phone_number = $4
                        OR name_user = $2 AND email = $6
            `,
                [
                    dsa.id_card,
                    dsa.name_user,
                    dsa.birth,
                    dsa.phone_number,
                    dsa.issue_date,
                    dsa.email
                ]
            );

            logger(
                "Hàm checkAISBlacklist",
                findUser,
                "Check DSA có trong blacklist không"
            );
            let updateStatus = null;
            if (_.isEmpty(findUser)) {
                messageAIS = objectToString(messageAIS)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_ais = $2  WHERE users_temporary_id = $3
                        RETURNING status, message_ais, users_temporary_id
                `,
                    [STATUS_DSA.PASS_AIS, messageAIS, dsaID]
                );
                logger("Hàm checkAISBlacklist", updateStatus, "Trả về pass");
                return STATUS_DSA.PASS_AIS;
            } else {
                messageAIS = {
                    result: "Không đạt",
                    message: null,
                    data: findUser
                }
                messageAIS = objectToString(messageAIS)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_ais = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3
                        RETURNING status, message_ais, reject_reason_id_af
                `,
                    [STATUS_DSA.REJECT_AIS, messageAIS, dsaID, MESSAGE_ID.blacklist]
                );

                await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                logger("Hàm checkAISBlacklist", updateStatus, "Trả về reject");
                return STATUS_DSA.REJECT_AIS;
            }
        } catch (e) {
            try {
                let messageAIS = {
                    result: "Lỗi",
                    message: "Kiểm tra AIS blacklist không thành công!",
                    data: []
                }
                messageAIS = objectToString(messageAIS)

                const updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_ais = $2 WHERE users_temporary_id = $3 RETURNING status, message_ais
                `,
                    [
                        STATUS_DSA.TIMEOUT_AIS,
                        messageAIS,
                        dsaID,
                    ]
                );
                logger(
                    "Hàm checkAISBlacklist",
                    { error: e + "", result: updateStatus },
                    "Trả về timeout",
                    "error"
                );
                return STATUS_DSA.TIMEOUT_AIS;
            } catch (error) {
                logger(
                    "Hàm checkAISBlacklist",
                    {
                        error1: e + "",
                        error2: error + "",
                        result: STATUS_DSA.TIMEOUT_AIS,
                    },
                    "Không cập nhật được trạng thái cho DSA trả về timeout",
                    "error"
                );
                return STATUS_DSA.TIMEOUT_AIS;
            }
        }
    }

    static async checkIMXBlacklist(dsaID) {
        try {
            console.log("gọi hàm");
            logger("Hàm checkIMXBlacklist", dsaID, "Gọi hàm");
            let messageIMX = {
                result: "Đạt",
                message: " ",
                data: []
            }
            const dsa = await db.one(
                `
                SELECT * FROM users_temporary WHERE users_temporary_id = $1
            `,
                [dsaID]
            );
            logger("Hàm checkIMXBlacklist", dsa, "Lấy thông tin DSA");

            const findUser = await db.manyOrNone(
                `
                SELECT * FROM imx_blacklist
                    WHERE detail_value = $1 OR phone_number = $2
            `,
                [dsa.id_card, dsa.phone_number]
            );
            logger(
                "Hàm checkIMXBlacklist",
                findUser,
                "Check DSA có trong blacklist không"
            );

            console.log("kiểm tra");
            let updateStatus = null;
            if (_.isEmpty(findUser)) {
                messageIMX = objectToString(messageIMX)
                console.log("message: ", messageIMX);

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_imx = $2 WHERE users_temporary_id = $3
                        RETURNING status, message_imx, users_temporary_id
                `,
                    [STATUS_DSA.PASS_IMX, messageIMX, dsaID]
                );
                console.log("cập nhật thành công: ", updateStatus);
                logger("Hàm checkIMXBlacklist", updateStatus, "Trả về pass");
                return STATUS_DSA.PASS_IMX;
            } else {
                messageIMX = {
                    result: "Không đạt",
                    message: null,
                    data: findUser
                }

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_imx = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3
                        RETURNING status, message_imx, reject_reason_id_af, users_temporary_id
                `,
                    [STATUS_DSA.REJECT_IMX, messageIMX, dsaID, MESSAGE_ID.blacklist]
                );

                await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                logger("Hàm checkIMXBlacklist", updateStatus, "Trả về reject");
                return STATUS_DSA.REJECT_IMX;
            }
        } catch (e) {
            try {
                console.log("Lỗi: ", e);
                let messageIMX = {
                    result: "Lỗi",
                    message: "Kiểm tra IMX blacklist không thành công!",
                    data: []
                }

                const updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_imx = $2 WHERE users_temporary_id = $3
                        RETURNING status, message_imx, users_temporary_id
                `,
                    [
                        STATUS_DSA.TIMEOUT_IMX,
                        messageIMX,
                        dsaID,
                    ]
                );
                logger(
                    "Hàm checkIMXBlacklist",
                    { error: e + "", result: updateStatus },
                    "Trả về timeout",
                    "error"
                );
                return STATUS_DSA.TIMEOUT_IMX;
            } catch (error) {
                console.log("Lỗi 2: ", error);
                logger(
                    "Hàm checkIMXBlacklist",
                    {
                        error1: e + "",
                        error2: error + "",
                        result: STATUS_DSA.TIMEOUT_IMX,
                    },
                    "Không cập nhật được trạng thái cho DSA trả về timeout",
                    "error"
                );
                return STATUS_DSA.TIMEOUT_IMX;
            }
        }
    }

    static async checkContract(dsaID) {
        try {
            logger("Hàm checkContract", dsaID, `Gọi hàm check hồ sơ ${dsaID}`);
            let messageContract = {
                result: "Đạt",
                message: " ",
                data: []
            }

            const dsa = await db.one(
                `
                SELECT id_card, dsa_request_id FROM users_temporary WHERE users_temporary_id = $1
            `,
                [dsaID]
            );
            logger("Hàm checkContract", dsa, `Lấy thông tin DSA ${dsaID}`);

            const listContract = await db.manyOrNone(
                `
                SELECT active_contracts_id, dpd_max, status FROM active_contract
                    WHERE id_card = $1 AND customer_name ILIKE $2 AND date_of_birth = $3
                        OR id_card = $1 AND phone_number = $4
                        OR id_card = $1 AND customer_name = $2
                        OR id_card = $1 AND date_of_birth = $3
                        OR id_card = $1 AND issue_date = $5
                        OR customer_name = $2 AND phone_number = $4
                        OR customer_name = $2 AND email = $6
            `,
                [
                    dsa.id_card,
                    dsa.name_user,
                    dsa.birth,
                    dsa.phone_number,
                    dsa.issue_date,
                    dsa.email
                ]
            );

            logger(
                "Hàm checkContract",
                listContract,
                `Lấy thông tin hợp đồng vay của DSA ${dsaID}`
            );

            const findUser = listContract.find(contract => {
                return contract.status.toUpperCase() === STATUS_CONTRACT.ACTIVE || contract.dpd_max >= 10
            })

            let updateStatus = null;
            if (!findUser) {
                if(!_.isEmpty(listContract)) {
                    messageContract = {
                        result: "Đạt",
                        message: null,
                        data: listContract
                    }
                }
                messageContract = objectToString(messageContract)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_contract = $2 WHERE users_temporary_id = $3 
                        RETURNING status, message_contract, users_temporary_id
                `,
                    [STATUS_DSA.PASS_CONTRACT, messageContract, dsaID]
                );
                logger("Hàm checkContract", updateStatus, `Trả về pass, hồ sơ ${dsaID}`);
                return STATUS_DSA.PASS_IMX;
            } else {
                messageContract = {
                    result: "Không đạt",
                    message: null,
                    data: listContract
                }

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_contract = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3
                        RETURNING status, message_contract, reject_reason_id_af, users_temporary_id
                `,
                    [STATUS_DSA.REJECT_CONTRACT, messageContract, dsaID, MESSAGE_ID.activeContract]
                );

                await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                logger("Hàm checkContract", updateStatus, `Trả về reject, hồ sơ ${dsaID}`);
                return STATUS_DSA.REJECT_CONTRACT;
            }
        } catch (e) {
            try {
                let messageContract = {
                    result: "Lỗi",
                    message: "Kiểm tra Active Contract không thành công!",
                    data: []
                }
                messageContract = objectToString(messageContract)

                const updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_contract = $2 WHERE users_temporary_id = $3 RETURNING status, message_contract
                `,
                    [
                        STATUS_DSA.TIMEOUT_CONTRACT,
                        messageContract,
                        dsaID,
                    ]
                );
                logger(
                    "Hàm checkContract",
                    { error: e + "", result: updateStatus },
                    `Trả về timeout, hồ sơ ${dsaID}`,
                    "error"
                );
                return STATUS_DSA.TIMEOUT_CONTRACT;
            } catch (error) {
                logger(
                    "Hàm checkContract",
                    {
                        error1: e + "",
                        error2: error + "",
                        result: STATUS_DSA.TIMEOUT_CONTRACT,
                    },
                    `Không cập nhật được trạng thái cho DSA ${dsaID} trả về timeout`,
                    "error"
                );
                return STATUS_DSA.TIMEOUT_CONTRACT;
            }
        }
    }


    static async checkReferencesForALoan(dsaID) {
        try {
            logger("Hàm checkReferencesForALoan", dsaID, `Gọi hàm check hồ sơ ${dsaID}`);
            let messageReferences = {
                result: "Đạt",
                message: " ",
                data: []
            }

            const dsa = await db.one(
                `
                SELECT * FROM users_temporary WHERE users_temporary_id = $1
            `,
                [dsaID]
            );
            logger("Hàm checkReferencesForALoan", dsa, `Lấy thông tin DSA ${dsaID}`);

            const listContract = await db.manyOrNone(
                `
                SELECT active_contracts_id, phone_number, customer_name, reference_name1, reference_phone1, reference_name2, reference_phone2
                    FROM active_contract
                    WHERE reference_phone1 = $1 OR reference_phone2 = $1
            `,
                [dsa.phone_number]
            );
            logger(
                "Hàm checkReferencesForALoan",
                listContract,
                `Check số điện thoại của DSA ${dsaID} có thuộc tham chiếu hợp đồng vay không`
            );

            const findUser = listContract.find(contract => {
                return contract.reference_phone1 === dsa.phone_number && contract.reference_name1.toUpperCase() !== dsa.name_user.toUpperCase()
                    || contract.reference_phone2 === dsa.phone_number && contract.reference_name2.toUpperCase() !== dsa.name_user.toUpperCase()
            })

            let updateStatus = null;
            if (!findUser) {
                if(!_.isEmpty(listContract)) {
                    messageReferences = {
                        result: "Đạt",
                        message: null,
                        data: listContract
                    }
                }
                messageReferences = objectToString(messageReferences)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_references = $2 WHERE users_temporary_id = $3
                        RETURNING status, users_temporary_id, message_references
                `,
                    [STATUS_DSA.PASS_REFERENCES, messageReferences, dsaID]
                );
                logger("Hàm checkReferencesForALoan", updateStatus, `Trả về pass, hồ sơ ${dsaID}`);
                return STATUS_DSA.PASS_REFERENCES;
            } else {
                messageReferences = {
                    result: "Không đạt",
                    message: null,
                    data: listContract
                }
                messageReferences = objectToString(messageReferences)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_references = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3
                        RETURNING status, message_references, reject_reason_id_af, users_temporary_id
                `,
                    [
                        STATUS_DSA.REJECT_REFERENCES,
                        messageReferences,
                        dsaID,
                        MESSAGE_ID.conflic
                    ]
                );

                await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                logger("Hàm checkReferencesForALoan", updateStatus, `Trả về reject, hồ sơ ${dsaID}`);
                return STATUS_DSA.REJECT_REFERENCES;
            }
        } catch (e) {
            try {
                const messageReferences = {
                    result: "Lỗi",
                    message: "Kiểm tra References không thành công!",
                    data: []
                }

                const updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_references = $2 WHERE users_temporary_id = $3
                        RETURNING status, message_references, users_temporary_id
                `,
                    [
                        STATUS_DSA.TIMEOUT_REFERENCES,
                        messageReferences,
                        dsaID,
                    ]
                );
                logger(
                    "Hàm checkReferencesForALoan",
                    { error: e + "", result: updateStatus },
                    `Trả về timeout, hồ sơ ${dsaID}`,
                    "error"
                );
                return STATUS_DSA.TIMEOUT_REFERENCES;
            } catch (error) {
                logger(
                    "Hàm checkReferencesForALoan",
                    {
                        error1: e + "",
                        error2: error + "",
                        result: STATUS_DSA.TIMEOUT_REFERENCES,
                    },
                    `Không cập nhật được trạng thái cho DSA ${dsaID} trả về timeout`,
                    "error"
                );
                return STATUS_DSA.TIMEOUT_REFERENCES;
            }
        }
    }

    static async checkDSA(dsaID) {
        try {
            logger("Hàm checkDSA", dsaID, "Gọi hàm");
            let messageDsa = {
                result: "Đạt",
                message: " ",
                data: []
            }

            const dsa = await db.one(
                `
                SELECT * FROM users_temporary WHERE users_temporary_id = $1
            `,
                [dsaID]
            );

            const listDSA = await db.manyOrNone(
            `
                SELECT active_deactive_dt, phone_num, id_card, status, dsa_code, dsa_partner, partner_name, dsa_name, email
                    FROM code_active
                    WHERE email ILIKE $1 OR phone_num = $2 OR id_card = $3
            `,
                [dsa.email, dsa.phone_number, dsa.id_card]
            );
            logger(
                "Hàm checkDSA",
                listDSA,
                `Check DSA ${dsaID} có tài khoản chưa`
            );

            const findUser = listDSA.find(dsaActive => {
                return dsaActive.status.toUpperCase() === STATUS_CODE_ACTIVE.ACTIVE
                    || dsaActive.active_deactive_dt.getTime() > moment().subtract(30, "days").valueOf()
            })

            logger("Hàm checkDSA", findUser, `Check DSA ${dsaID} có đang hoạt động không`);

            let updateStatus = null;
            if (!findUser) {
                if(!_.isEmpty(listDSA)) {
                    messageDsa = {
                        result: "Đạt",
                        message: null,
                        data: listDSA
                    }
                }

                messageDsa = objectToString(messageDsa)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_dsa = $2 WHERE users_temporary_id = $3
                        RETURNING status, users_temporary_id, message_dsa
                `,
                    [STATUS_DSA.PASS_DSA, messageDsa, dsaID]
                );
                logger("Hàm checkDsa", updateStatus, `Trả về pass, hồ sơ ${dsaID}`);
                return STATUS_DSA.PASS_DSA;
            } else {
                messageDsa = {
                    result: "Không đạt",
                    message: null,
                    data: listDSA
                }
                messageDsa = objectToString(messageDsa)

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_Dsa = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3
                        RETURNING status, message_Dsa, reject_reason_id_af, users_temporary_id
                `,
                    [
                        STATUS_DSA.REJECT_DSA,
                        messageDsa,
                        dsaID,
                        MESSAGE_ID.codeActive
                    ]
                );

                await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                logger("Hàm checkDsa", updateStatus, `Trả về reject, hồ sơ ${dsaID}`);
                return STATUS_DSA.REJECT_DSA;
            }
        } catch (e) {
            try {
                const messageDsa = {
                    result: "Lỗi",
                    message: "Kiểm tra Dsa không thành công!",
                    data: []
                }

                const updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_dsa = $2 WHERE users_temporary_id = $3
                        RETURNING status, message_dsa, users_temporary_id
                `,
                    [
                        STATUS_DSA.TIMEOUT_DSA,
                        messageDsa,
                        dsaID,
                    ]
                );
                logger(
                    "Hàm checkDsa",
                    { error: e + "", result: updateStatus },
                    `Trả về timeout, hồ sơ ${dsaID}`,
                    "error"
                );
                return STATUS_DSA.TIMEOUT_DSA;
            } catch (error) {
                logger(
                    "Hàm checkDsaForALoan",
                    {
                        error1: e + "",
                        error2: error + "",
                        result: STATUS_DSA.TIMEOUT_DSA,
                    },
                    `Không cập nhật được trạng thái cho DSA ${dsaID} trả về timeout`,
                    "error"
                );
                return STATUS_DSA.TIMEOUT_DSA;
            }
        }
    }

    static async checkCIC(dsaID) {
        try {
            let messageCIC = {
                result: "Đạt",
                message: "Không có hồ sơ thỏa mãn điều kiện tìm kiếm"
            }

            logger("Hàm checkCIC", dsaID, "Gọi hàm checkCIC")
            const dsa = await db.one(`
                SELECT * FROM users_temporary WHERE users_temporary_id = $1
            `, [dsaID]
            )
            logger("Hàm checkCIC", dsa, "Lấy thông tin DSA")
            const xmlRequest = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:h2h="http://h2h.bank/">
                <soapenv:Header/>
                <soapenv:Body>
                <h2h:S37>
                    <!--Optional:-->
                    <strUserName>${ACCOUNT_CIC.USERNAME}</strUserName>
                    <!--Optional:-->
                    <strPassword>${ACCOUNT_CIC.PASSWORD}</strPassword>
                    <!--Optional:-->
                    <SoCMT>${dsa.id_card}</SoCMT>
                    <!--Optional:-->
                    <TenKH></TenKH>
                </h2h:S37>
                </soapenv:Body>
            </soapenv:Envelope>
        `
            logger("Hàm checkCIC", xmlRequest, "Tạo body request")
            const response = await axios({
                url: URL_API.CHECK_CIC,
                method: "POST",
                headers: {
                    "Content-Type": "text/xml;charset=utf-8",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive"
                },
                timeout: 60000,
                data: xmlRequest
            });
            const body = response.data
            logger("Hàm checkCIC", response.data, "Dữ liệu trả về dạng XML")

            const obj = XMLparse.parse(body);
            logger("Hàm checkCIC", obj, "Dữ liệu dạng JSON")
            // let newData = obj
            let updateStatus = null
            let message = ""
            //Nếu check CIC trả về không có hồ sơ hoặc không có nhóm nợ cao nhất thì pass
            if (obj["S:Envelope"]["S:Body"]["ns2:S37Response"]["return"]["Data"]) {
                let newData = obj["S:Envelope"]["S:Body"]["ns2:S37Response"]["return"]["Data"]
                newData = _.unescape(newData)
                newData = XMLparse.parse(newData);
                //Nếu có NewDataSet thì xét xem có NewDataTable không, nếu có thì xét trạng thái bằng 1 không, nếu đúng thì pass
                if (newData && newData["NewDataSet"]["NewDataTable"] && newData["NewDataSet"]["NewDataTable"]["TRANGTHAI"] === 1) {
                    messageCIC.message = newData["NewDataSet"]["NewDataTable"]["MOTA"]
                    
                    updateStatus = await db.one(`
                    UPDATE users_temporary SET status = $1, message_cic = $2 WHERE users_temporary_id = $3 RETURNING status, users_temporary_id, message_cic
                `, [STATUS_DSA.PASS_CIC, messageCIC, dsaID]
                    )
                    logger("Hàm checkCIC", updateStatus, "Trả về pass")
                    return STATUS_DSA.PASS_CIC
                }
                //Nếu không có NewDataTable thì xét xem có Row không, nếu có nhóm nợ cao nhất thuộc nhóm 1 hoặc không có nhóm nợ thì pass
                else if (newData && newData["NewDataSet"]["ROW"] &&
                    (!newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"] || NHOM_NO_PASS.includes(newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"]) )
                ) {
                    messageCIC.message = `${newData["NewDataSet"]["ROW"]["NOIDUNG"]}. `
                        + ( newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"] ? `Nhóm nợ cao nhất ${newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"]}` : "" )

                    console.log(messageCIC);

                    updateStatus = await db.one(`
                        UPDATE users_temporary SET status = $1, message_cic = $2 WHERE users_temporary_id = $3 RETURNING status, message_cic, users_temporary_id
                        `, [STATUS_DSA.PASS_CIC, messageCIC, dsaID]
                    )
                    logger("Hàm checkCIC", updateStatus, "Trả về pass")
                    return STATUS_DSA.PASS_CIC
                }
                //Nếu có nhóm nợ cao nhất thuộc nhóm 2 hoặc có MUCCB thì reject
                else if (newData && newData["NewDataSet"]["ROW"] &&
                    NHOM_NO_CHU_Y.includes(newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"])
                ) {
                    messageCIC.result = "Không đạt"
                    messageCIC.message = `${newData["NewDataSet"]["ROW"]["NOIDUNG"]}. Nhóm nợ cao nhất ${newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"]}`

                    updateStatus = await db.one(`
                        UPDATE users_temporary SET status = $1, message_cic = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3 RETURNING status, message_cic, reject_reason_id_af
                        `, [STATUS_DSA.REJECT_CIC, messageCIC, dsaID, MESSAGE_ID.warningDebt]
                    )

                    await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                    logger("Hàm checkCIC", updateStatus, "Trả về reject")
                    return STATUS_DSA.REJECT_CIC
                }
                //Nếu có nhóm nợ cao nhất thuộc nhóm 3, 4, 5 thì reject
                else if (newData && newData["NewDataSet"]["ROW"] &&
                    ( NHOM_NO_REJECT.includes(newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"]) || newData["NewDataSet"]["ROW"]["MUCCB"] )
                ) {
                    messageCIC.result = "Không đạt"
                    messageCIC.message = `${newData["NewDataSet"]["ROW"]["NOIDUNG"]}. Nhóm nợ cao nhất ${newData["NewDataSet"]["ROW"]["NHOMNOCAONHAT"]}`

                    updateStatus = await db.one(`
                        UPDATE users_temporary SET status = $1, message_cic = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3 RETURNING status, message_cic, reject_reason_id_af
                        `, [STATUS_DSA.REJECT_CIC, messageCIC, dsaID, MESSAGE_ID.badDebt]
                    )

                    await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                    logger("Hàm checkCIC", updateStatus, "Trả về reject")
                    return STATUS_DSA.REJECT_CIC
                }
            }
                
            throw "Check CIC trả về kết quả không đúng định dạng"
        } catch (error) {
            try {
                let messageCIC = {
                    result: "Lỗi",
                    message: "Có lỗi xảy ra trong quá trình Check CIC!"
                }

                const updateStatus = await db.one(`
                UPDATE users_temporary SET status = $1, message_cic = $2 WHERE users_temporary_id = $3 RETURNING status, message_cic, users_temporary_id
            `, [STATUS_DSA.TIMEOUT_CIC, messageCIC, dsaID]
                )
                logger("Hàm checkCIC", { error: error + "", result: updateStatus }, "Trả về timeout", "error")
                return STATUS_DSA.TIMEOUT_CIC
            } catch (e) {
                logger("Hàm checkCIC", { error1: e + "", error2: error + "", result: STATUS_DSA.TIMEOUT_CIC }, "Không cập nhật được trạng thái cho DSA, trả về timeout", "error")
                return STATUS_DSA.TIMEOUT_CIC
            }
        }
    }

    static async checkEkyc(dsaID) {
        try {
            logger("Hàm checkEkyc", dsaID, "Gọi hàm checkEkyc");
            throw "Đang đợi api mới"
            const dsa = await db.one(
                `
                SELECT * FROM users_temporary WHERE users_temporary_id = $1
            `,
                [dsaID]
            );
            logger("Hàm checkEkyc", dsa, "Lấy thông tin DSA");
            const request_id = new Date().getTime();
            const data = {
                case_id: `DMB${request_id}`,
                partner_code: "DMB",
                metadata: {
                    full_name: dsa.name_user,
                    date_of_birth: moment(dsa.birth).format("DD-MM-YYYY"),
                    id_card_number: dsa.id_card,
                    id_card_date: moment(dsa.issue_date).format("DD-MM-YYYY"),
                    phone_number: dsa.phone_number,
                    email: dsa.email,
                },
                file: [
                    {
                        type: "portrait",
                        name: dsa.path_pic,
                    },
                    {
                        type: "vn.national_id",
                        name: dsa.path_pid,
                    },
                ],
            };
            logger("Hàm checkEkyc", data, "Tạo body request");

            let response = null
            try {
                response = await axios({
                    url: URL_API.CHECK_EKYC,
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + TOKEN_EKYC,
                        "Content-Type": "application/json",
                        Accept: "*/*",
                        "Accept-Encoding": "gzip, deflate, br",
                        Connection: "keep-alive",
                    },
                    timeout: 60000,
                    data: data,
                });
            } catch (errEkyc) {
                if(errEkyc.response) {
                    logger("Hàm checkEkyc", errEkyc.response.data, "Lỗi gọi api", "error")
                    response = errEkyc.response
                    if(errEkyc.response.status == 401) {
                        logger("Hàm checkEkyc", errEkyc.response.data, "Lỗi token", "error")
                    }
                } else {
                    logger("Hàm checkEkyc", errEkyc, "Lỗi gọi api không có response", "error")
                    logger("Hàm checkEkyc", errEkyc + "", "Lỗi gọi api không có response", "error")
                    throw {m : "E-kyc không trả về dữ liệu!"}
                }
            }
            

            const body = response.data;
            logger("Hàm checkEkyc", response.data, "Dữ liệu trả về từ api check E-kyc");

            let updateStatus = null;
            let message = "";

            //Nếu check E-Kyc thành công trả về code: passEkyc
            if (body.code === "eligible") {
                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1 WHERE users_temporary_id = $2 RETURNING status
                `,
                    [STATUS_DSA.PASS_EKYC, dsaID]
                );
                logger("Hàm checkEkyc", updateStatus, "Trả về pass");
                return STATUS_DSA.PASS_EKYC;
            }
            //Nếu check E-Kyc gặp lỗi not_qualified thì reject
            else if (body.code === "not_qualified") {
                if (body.message) {
                    message = body.message;
                } else {
                    message = "Ảnh selfie hoặc chứng minh thư không đạt yêu cầu";
                }
                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_ekyc = $2, reject_reason_id_af = $4 WHERE users_temporary_id = $3 RETURNING status, message_ekyc,reject_reason_id_af
                `,
                    [STATUS_DSA.REJECT_EKYC, message, dsaID, MESSAGE_ID.idCard]
                );

                await RequestDsaController.updateStatusRequest(dsa.dsa_request_id)
                logger("Hàm checkEkyc", updateStatus, "Trả về reject");
                return STATUS_DSA.REJECT_EKYC;
            }
            //Nếu check E-kyc lỗi hoặc các trường hợp khác thì trả về timeout để AF duyệt
            else {
                if (body.error && body.error.message) {
                    message = body.error.message;
                } else if (body.error) {
                    message = body.error;
                } else if (body.data && body.data.not_eligible_reason) {
                    message = body.data.not_eligible_reason;
                } else {
                    message = "Check E-kyc không thành công!";
                }

                updateStatus = await db.one(
                    `
                    UPDATE users_temporary SET status = $1, message_ekyc = $2 WHERE users_temporary_id = $3 RETURNING status, message_ekyc
                `,
                    [STATUS_DSA.TIMEOUT_EKYC, message, dsaID]
                );
                logger("Hàm checkEkyc", updateStatus, "Trả về timeout");
                return STATUS_DSA.TIMEOUT_EKYC;
            }
        } catch (error) {
            try {
                const updateStatus = await db.one(
                `
                    UPDATE users_temporary SET status = $1, message_ekyc = $2 WHERE users_temporary_id = $3 RETURNING status, message_ekyc
                `,
                    [
                        STATUS_DSA.TIMEOUT_EKYC,
                        error.m || "Có lỗi xảy ra trong quá trình Check E-kyc!",
                        dsaID,
                    ]
                );
                console.log(error);
                logger(
                    "Hàm checkEkyc",
                    { error: error.m || error + "", result: updateStatus },
                    "Trả về timeout",
                    "error"
                );
                return STATUS_DSA.TIMEOUT_EKYC;
            } catch (e) {
                logger(
                    "Hàm checkEkyc",
                    {
                        error1: e + "",
                        error2: error + "",
                        result: STATUS_DSA.TIMEOUT_EKYC,
                    },
                    "Không cập nhật được trạng thái cho DSA, trả về timeout",
                    "error"
                );
                return STATUS_DSA.TIMEOUT_EKYC;
            }
        }
    }

    // static async getStatus(requestID) {
    //     try {
    //         const listDSA = await db.manyOrNone(`
    //             SELECT id_card AS "idCard", status FROM users_temporary WHERE dsa_request_id = $1
    //         `, [requestID])

    //         if(_.isEmpty(listDSA)) {
    //             throw { m: "Không tìm thấy hồ sơ nào!" }
    //         }

    //         let requestDSA = {
    //             new: 0,                 //Mới
    //             reviewing: 0,           //Đang xét duyệt
    //             approved: 0,            //Đã kiểm duyệt
    //             accountGranting: 0,     //Đã tạo tài khoản
    //             completed: 0,           //Hoàn tất
    //             cancel: 0,              //Huỷ
    //             rejected: 0,            //Từ chối
    //             status: "",
    //             count: listDSA.length
    //         }

    //         listDSA.forEach(dsa => {
    //             switch (true) {
    //                 case dsa.status === STATUS_DSA.NEW:
    //                     requestDSA.new++
    //                     break
    //                 case listApproved.includes(dsa.status):
    //                     requestDSA.approved++
    //                     break
    //                 case dsa.status === STATUS_DSA.ACCOUNTGRANTING:
    //                     requestDSA.accountGranting++
    //                     break
    //                 case dsa.status === STATUS_DSA.COMPLETED:
    //                     requestDSA.completed++
    //                     break
    //                 case listCancel.includes(dsa.status):
    //                     requestDSA.cancel++
    //                     break
    //                 case listReject.includes(dsa.status):
    //                     requestDSA.rejected++
    //                     break
    //                 default:
    //                     requestDSA.reviewing++
    //                     break
    //             }
    //         })

    //         switch (true) {
    //             case requestDSA.new === requestDSA.count:
    //                 requestDSA.status = statusDsaNVKD.NEW
    //                 break
    //             case requestDSA.reviewing > 0:
    //                 requestDSA.status = statusDsaNVKD.REVIEWING
    //                 break
    //             case requestDSA.approved > 0:
    //                 requestDSA.status = statusDsaNVKD.APPROVED
    //                 break
    //             case requestDSA.accountGranting > 0:
    //                 requestDSA.status = statusDsaNVKD.ACCOUNTGRANTING
    //                 break
    //             case requestDSA.completed > 0:
    //                 requestDSA.status = statusDsaNVKD.COMPLETED
    //                 break
    //             case requestDSA.cancel > 0:
    //                 requestDSA.status = statusDsaNVKD.CANCEL
    //                 break
    //             default:
    //                 requestDSA.status = statusDsaNVKD.REJECTED
    //                 break 
    //         }

    //         logger("Hàm getStatus", requestDSA, "Trả về thông tin request")
    //         return requestDSA.status
    //     } catch (error) {
    //         logger("Hàm getStatus", error.m || error + "", "Lỗi hệ thống: Không thể lấy trạng thái của yêu cầu!")
    //         throw error.m || "Lỗi hệ thống: Không thể lấy trạng thái của yêu cầu!"
    //     }
    // }

    // static async getStatusForDetail(listDSA) {
    //     try {
    //         if(_.isEmpty(listDSA)) {
    //             throw { m: "Không tìm thấy hồ sơ nào!" }
    //         }

    //         let requestDSA = {
    //             new: 0,                 //Mới
    //             reviewing: 0,           //Đang xét duyệt
    //             approved: 0,            //Đã kiểm duyệt
    //             accountGranting: 0,     //Đã tạo tài khoản
    //             completed: 0,           //Hoàn tất
    //             cancel: 0,              //Huỷ
    //             rejected: 0,            //Từ chối
    //             status: "",
    //             count: listDSA.length
    //         }

    //         listDSA.forEach(dsa => {
    //             switch (true) {
    //                 case dsa.status === STATUS_DSA.NEW:
    //                     requestDSA.new++
    //                     break
    //                 case listApproved.includes(dsa.status):
    //                     requestDSA.approved++
    //                     break
    //                 case dsa.status === STATUS_DSA.ACCOUNTGRANTING:
    //                     requestDSA.accountGranting++
    //                     break
    //                 case dsa.status === STATUS_DSA.COMPLETED:
    //                     requestDSA.completed++
    //                     break
    //                 case listCancel.includes(dsa.status):
    //                     requestDSA.cancel++
    //                     break
    //                 case listReject.includes(dsa.status):
    //                     requestDSA.rejected++
    //                     break
    //                 default:
    //                     requestDSA.reviewing++
    //                     break
    //             }
    //         })

    //         switch (true) {
    //             case requestDSA.new === requestDSA.count:
    //                 requestDSA.status = statusDsaNVKD.NEW
    //                 break
    //             case requestDSA.reviewing > 0:
    //                 requestDSA.status = statusDsaNVKD.REVIEWING
    //                 break
    //             case requestDSA.approved > 0:
    //                 requestDSA.status = statusDsaNVKD.APPROVED
    //                 break
    //             case requestDSA.accountGranting > 0:
    //                 requestDSA.status = statusDsaNVKD.ACCOUNTGRANTING
    //                 break
    //             case requestDSA.completed > 0:
    //                 requestDSA.status = statusDsaNVKD.COMPLETED
    //                 break
    //             case requestDSA.cancel > 0:
    //                 requestDSA.status = statusDsaNVKD.CANCEL
    //                 break
    //             default:
    //                 requestDSA.status = statusDsaNVKD.REJECTED
    //                 break
    //         }

    //         logger("Hàm getStatus", requestDSA, "Trả về thông tin request")
    //         return requestDSA
    //     } catch (error) {
    //         logger("Hàm getStatus", error.m || error + "", "Lỗi hệ thống: Không thể lấy trạng thái của yêu cầu!")
    //         throw error.m || "Lỗi hệ thống: Không thể lấy trạng thái của yêu cầu!"
    //     }
    // }

    static async updateStatusRequest(requestID) {
        try {
            logger("Hàm updateStatusRequest", requestID, "Gọi api cập nhật trạng thái cho yêu cầu " + requestID)
            const listDSA = await db.manyOrNone(`
                SELECT status FROM users_temporary WHERE dsa_request_id = $1
            `, [requestID])

            console.log("gọi hàm update status xxx");
            if(_.isEmpty(listDSA)) {
                throw { m: "Không tìm thấy hồ sơ nào!" }
            }

            let requestDSA = {
                new: 0,                 //Mới
                reviewing: 0,           //Đang xét duyệt
                approved: 0,            //Đã kiểm duyệt
                accountGranting: 0,     //Đã tạo tài khoản
                completed: 0,           //Hoàn tất
                cancel: 0,              //Huỷ
                rejected: 0,            //Từ chối
                status: "",
                count: listDSA.length
            }

            listDSA.forEach(dsa => {
                switch (true) {
                    case dsa.status === STATUS_DSA.NEW:
                        requestDSA.new++
                        break
                    case listApproved.includes(dsa.status):
                        requestDSA.approved++
                        break
                    case dsa.status === STATUS_DSA.ACCOUNTGRANTING:
                        requestDSA.accountGranting++
                        break
                    case dsa.status === STATUS_DSA.COMPLETED:
                        requestDSA.completed++
                        break
                    case listCancel.includes(dsa.status):
                        requestDSA.cancel++
                        break
                    case listReject.includes(dsa.status):
                        requestDSA.rejected++
                        break
                    default:
                        requestDSA.reviewing++
                        break
                }
            })

            switch (true) {
                case requestDSA.new === requestDSA.count:
                    requestDSA.status = statusDsaNVKD.NEW
                    break
                case requestDSA.reviewing > 0:
                    requestDSA.status = statusDsaNVKD.REVIEWING
                    break
                case requestDSA.approved > 0:
                    requestDSA.status = statusDsaNVKD.APPROVED
                    break
                case requestDSA.accountGranting > 0:
                    requestDSA.status = statusDsaNVKD.ACCOUNTGRANTING
                    break
                case requestDSA.completed > 0:
                    requestDSA.status = statusDsaNVKD.COMPLETED
                    break
                case requestDSA.cancel > 0:
                    requestDSA.status = statusDsaNVKD.CANCEL
                    break
                default:
                    requestDSA.status = statusDsaNVKD.REJECTED
                    break 
            }

            const result = await db.one(`
                UPDATE dsa_request SET update_at = $1, status = $2 WHERE dsa_request_id = $3 RETURNING  dsa_request_id, update_at, status
            `,
                [moment(), requestDSA.status, requestID]
            )

            logger("Hàm updateStatusRequest", {requestDSA, result}, "Trả về thông tin request" + requestID)
         
            return requestDSA.status
        } catch (error) {
            console.log("Hàm updateStatusRequest dòng 1982 :", error);
            logger("Hàm updateStatusRequest", error.m || error + "", `Lỗi hệ thống: Không thể cập nhật trạng thái của yêu cầu ${requestID}!`)
            return error.m || "Lỗi hệ thống: Không thể lấy trạng thái của yêu cầu!"
        }
    }

    static async updateNoteAF(req, res) {
        try {
            const {noteAF, dsaID} = req.body

            const dsa = await db.oneOrNone(`
                SELECT users_temporary_id FROM users_temporary WHERE users_temporary_id = $1
            `, [dsaID]
            )

            logger("Hàm updateNoteAF", dsa, "Kiểm tra dsaID có hợp lệ không")
            if(!dsa) {
                throw { message: "Người dùng không tồn tại!"}
            }

            const updateNoteAF = await db.one(`
                UPDATE users_temporary SET note_af = $1 WHERE users_temporary_id = $2 RETURNING note_af, users_temporary_id
            `,[noteAF, dsaID]
            )

            logger("Hàm updateNoteAF", updateNoteAF, "Cập nhật noteAF thành công!")
            res.status(200).json(
                commonResponse(200, API_CODE.TEXT_SUCCESS, {}, req)
            )
        } catch (error) {
            res.status(400).json(
                commonResponse(400, error.message, {}, req)
            )
        }
    }
}

module.exports = RequestDsaController;