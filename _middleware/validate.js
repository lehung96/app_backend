const validateRequest = require("./validate-request")
const Joi = require("joi").extend(require("@joi/date"));
const { statusDsaNVKD, STATUS_DSA } = require('../_helpers/constants');

module.exports = {
    //Validate api user
    registerUserApiSchema: (req, res, next) => {
        const schema = Joi.object({
            emails: Joi.array().items(Joi.string().trim().required()).error(new Error("Email không đúng định dạng!")),
            roleID: Joi.number().integer().required().error(new Error("RoleID phải là một số nguyên!")),
        });
        validateRequest(req, res, next, schema);
    },

    loginUserApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required(),
            password: Joi.string().trim().min(8).required(),
        });
        validateRequest(req, res, next, schema);
    },

    getDatailNVKDApiSchema(req, res, next) {
        const schema = Joi.object({
            size: Joi.number().required(),
            page: Joi.number().required(),
            dsa_request_id: Joi.number().required(),
            statusNVKD : Joi.string().valid(...Object.values(statusDsaNVKD)),
            textSearch: Joi.string()
        });
        validateRequest(req, res, next, schema);
    },
    getDatailForAFNVKDApiSchema(req, res, next) {
        const schema = Joi.object({
            size: Joi.number().required(),
            page: Joi.number().required(),
            dsa_request_id: Joi.number().required(),
            users_temporary_id: Joi.number().required(),
        });
        validateRequest(req, res, next, schema);
    },

    exportAccount3PApiSchema(req, res, next) {
        const schema = Joi.object({
        });
        validateRequest(req, res, next, schema);
    },


    getListUserApiSchema: (req, res, next) => {
        const schema = Joi.object({
            page: Joi.number().required(),
            size: Joi.number().required(),
            group_role: Joi.number(),
            user_name: Joi.string(),
            status: Joi.number(),
            sort: Joi.string().valid('DESC', 'ASC'),
            partner_code_id:Joi.number()
        });
        validateRequest(req, res, next, schema);
    },
    getListRequestApiSchema: (req, res, next) => {
        const schema = Joi.object({
            page: Joi.number().required(),
            size: Joi.number().required(),
            startDate: Joi.date(),
            endDate: Joi.date(),
            dsa_request_code: Joi.string(),
            partner_code: Joi.string(),
            user_name: Joi.string(),
            status: Joi.string().valid(...Object.values(statusDsaNVKD)),
            sort_partner_code: Joi.string().valid('DESC', 'ASC'),
            sort_request_date: Joi.string().valid('DESC', 'ASC'),
            sort_update_date: Joi.string().valid('DESC', 'ASC'),
            textSearch: Joi.string(),
            
        });
        validateRequest(req, res, next, schema);
    },


    AFupdateNVKDApiSchema: (req, res, next) => {
        const schema = Joi.object({
            status: Joi.string().valid(STATUS_DSA.PASS_AF, STATUS_DSA.REJECT_AF, STATUS_DSA.CANCEL).required(),
            users_temporary_id: Joi.number().required(),
            reject_reason_id: Joi.any().when('status', { is: Joi.not(STATUS_DSA.PASS_AF), then: Joi.required(), otherwise: Joi.optional() }),
            note: Joi.string()
        });
        validateRequest(req, res, next, schema);
    },
    SSCreateAccountApiSchema: (req, res, next) => {
        const schema = Joi.object({
            dsa_request_id: Joi.number().required(),
        });
        validateRequest(req, res, next, schema);
    },
    SSupdateNVKDApiSchema: (req, res, next) => {
        const schema = Joi.object({
            note: Joi.string(),
            status: Joi.string().valid(STATUS_DSA.PASS_SS, STATUS_DSA.REJECT_SS).required(),
            users_temporary_id: Joi.number().required(),
            reject_reason_id: Joi.any().when('status', { is: STATUS_DSA.REJECT_SS, then: Joi.required(), otherwise: Joi.optional() }),

        });
        validateRequest(req, res, next, schema);
    },
    updateTokenFirebaseApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required(),
            deviceId: Joi.string().trim().required(),
            tokenFirebase: Joi.string().trim().required(),
        });
        validateRequest(req, res, next, schema);
    },

    logoutUserApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required(),
        });
        validateRequest(req, next, schema);
    },

    readPassWordUserApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required(),
        });
        validateRequest(req, res, next, schema);
    },

    getListNotificationApiSchema: (req, res, next) => {
        const schema = Joi.object({
            size: Joi.number().required(),
            page: Joi.number().required(),
            users_id: Joi.number().required(),
        });
        validateRequest(req, res, next, schema);
    },
    getDeleteFileApiSchema: (req , res, next) => {
        const schema = Joi.object({
           id: Joi.number().required(),
  
        });
        validateRequest(req, res, next, schema);
    },

    //Validate api Notification
    getDetailNotificationApiSchema: (req, res, next) => {
        const schema = Joi.object({
            notification_id: Joi.number().required(),
        });
        validateRequest(req, res, next, schema);
    },

    registerUser3PApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required(),
            password: Joi.string().trim().min(8).required(),
            partnerID: Joi.number().integer().required(),
            name3p: Joi.string().trim().required(),
            roleID: Joi.number().integer().required(),
        });
        validateRequest(req, res, next, schema);
    },

    getListCode3PApiSchema: (req, res, next) => {
        const schema = Joi.object({

        });
        validateRequest(req, res, next, schema);
    },

    changePasswordApiSchema: (req, res, next) => {
        const schema = Joi.object({
            oldPassword: Joi.string().trim().min(8).required(),
            newPassword: Joi.string().trim().min(8).required(),
        });
        validateRequest(req, res, next, schema);
    },

    adminChangePasswordApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required(),
            oldPassword: Joi.string().trim().min(8).required(),
            newPassword: Joi.string().trim().min(8).required(),
        });
        validateRequest(req, res, next, schema);
    },

    forgotPasswordApiSchema: (req, res, next) => {
        const schema = Joi.object({
            username: Joi.string().trim().required().error(new Error("Username không được để trống!")),
        });
        validateRequest(req, res, next, schema);
    },

    forgotAndChangePasswordApiSchema: (req, res, next) => {
        const schema = Joi.object({
            token: Joi.string().required().error(new Error("Token không được để trống!")),
            newPassword: Joi.string().trim().min(8).required().error(new Error("Password không đúng định dạng!")),
        });
        validateRequest(req, res, next, schema);
    },

    getUserInfoApiSchema: (req, res, next) => {
        const schema = Joi.object({

        });
        validateRequest(req, res, next, schema);
    },

    changeStatusApiSchema: (req, res, next) => {
        const schema = Joi.object({
            userID: Joi.number().integer().required(),
            status: Joi.number().required().valid(0, 1),
        });
        validateRequest(req, res, next, schema);
    },

    // registerUserApiSchema: (req, res, next) => {
    //     const schema = Joi.object({
    //         username: Joi.string().trim().required(),
    //         password: Joi.string().trim().min(6).required(),
    //         email: Joi.string().trim().email().required(),
    //         role_id: Joi.number().required(),
    //     });
    //     validateRequest(req, next, schema);
    // },

    /*==============================Phân quyền================================ */

    updateRoleFunctionSchema: (req, res, next) => {
        const schema = Joi.object({
            listFunctionID: Joi.array().items(Joi.number().integer()).error(new Error("List functionID phải là một mảng các số nguyên!")),
            role_id: Joi.number().integer().required().error(new Error("role_id phải là một số nguyên!"))
        });
        validateRequest(req,res, next, schema);
    },

    getListFunctionSchema: (req, res, next) => {
        const schema = Joi.object({
            role_id: Joi.number().integer().required().error(new Error("role_id phải là một số nguyên!"))
        });
        validateRequest(req,res, next, schema);
    },

    
    createGroupRoleSchema: (req, res, next) => {
        const schema = Joi.object({
            name: Joi.string().trim().required().error(new Error("Name không được để trống!")),
            level: Joi.number().integer().required().valid(0, 1, 2).error(new Error("Level phải là 0, 1 hoặc 2!")),
            groupRoleID: Joi.number().integer().error(new Error("groupRoleID phải là một số nguyên!")),
        });
        validateRequest(req,res, next, schema);
    },

    getListApiSchema: (req, res, next) => {
        const schema = Joi.object({
        })
        validateRequest(req,res, next, schema)
    },

    exportRequestDSAByDateSchema: (req, res, next) => {
        const schema = Joi.object({
            startDate: Joi.date().required().error(new Error("Bạn phải chọn ngày bắt đầu!")),
            endDate: Joi.date().required().error(new Error("Bạn phải chọn ngày kết thúc!"))
        });
        validateRequest(req, res, next, schema);
    },

    //updateNoteAFSchema
    updateNoteAFSchema: (req, res, next) => {
        const schema = Joi.object({
            noteAF: Joi.string().trim().required(),
            dsaID: Joi.number().integer().required()
        });
        validateRequest(req, res, next, schema);
    },
}