const jwt = require("express-jwt");
const { db } = require("../database/db");
const { getStandardResponse } = require("../_helpers/func");
const { commonResponse } = require("../models/Response");
const moment = require('moment');
const { SECRET_TOKEN } = require("../_helpers/constants");
const logger = require("../logger/index");
const {
    decodeToken,
    getErrorMsgNotExist,
    getError
} = require("../_helpers/func");
module.exports = {
    authorize,
    authenticate,
    validateFileUpload,
    authenticateForWeb
}
const RoleController = require('../controllers/RoleController');
const { forbidden } = require("joi");
function authorize() {
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret: SECRET_TOKEN, algorithms: ["HS256"] }),

        // attach full user record to request object
        async (req, res, next) => {
            // get user with id from token 'sub' (subject) property

            // const user = await db.users.findOne({
            //     where: { phone: req.user.sub },
            // });
            try {
                const user = await db.one(
                    "select id, username from user where username=$1",
                    [req.user.sub]
                );

                // check user still exists
                if (!user)
                    return res
                        .status(401)
                        .json(commonResponse(401, "Unauthorized"));

                // authorization successful
                req.user = user.get();
                next();
            } catch (error) {
                return res.status(400).json(commonResponse(400, error));
            }
        },
    ];
}
async function validateFileUpload(req, res, next) {
 req.timestamp = new Date().getTime()
 logger("creatMultiNVKD", req.timestamp, "Lấy thời gian hiện tại");
 next()
}
async function authenticate(req, res, next) {
    const url = req.url;
    const apiname = url.split("/").pop()
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res
        .status(401)
        .json(commonResponse(401, "Unauthorized"));
    }
    
    const token = authHeader.split(' ').pop();
   
    try {
        const decode = await validateToken(authHeader);
        const user = await db.oneOrNone(
            `
            SELECT   
            users_id, 
            username,
            email,
            role_id, 
            users.status,
            token,
            code_3p.code3p,
            code_3p.code_3p_id
            FROM users 
            LEFT JOIN "code_3p" ON "code_3p".code_3p_id = users.code_3p_id WHERE users_id=$1
            `,
            [decode.userId]
        );
    
        if(token !== user.token){
            throw getError();
        }
        if (!user) {
            throw getErrorMsgNotExist(`${user.username}`);
        }
        if (user && user.status !== 1) {
        
            throw getErrorMsgNotActive(`${user.username}`);
            
        }
        req.user = user;
        
        next()
    } catch (error) {
        res.status(401).json(commonResponse(401, error + "", {}, req));
    }
}


async function authenticateForWeb(req, res, next) {
    const url = req.url;
    const apiname = url.split("/").pop()
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res
            .status(401)
            .json(commonResponse(401, "Unauthorized", {}, req));
    }
    const token = authHeader.split(' ')[1];
   
    try {
        const decode = await validateToken(authHeader);
        const user = await db.oneOrNone(
            `
            SELECT   
            users_id, 
            username,
            email,
            role_id, 
            users.status,
            token,
            code_3p.code3p,
            code_3p.code_3p_id
            FROM users 
            LEFT JOIN "code_3p" ON "code_3p".code_3p_id = users.code_3p_id WHERE users_id=$1
            `,
            [decode.userId]
        );
   
        if(token !== user.token){
            throw getError();
        }
        if (!user) {
            throw getErrorMsgNotExist(`${user.username}`);
        }
        if (user && user.status !== 1) {
        
            throw getErrorMsgNotActive(`${user.username}`);
            
        }
    
        if (user.users_id === 1 && user.role_id === 1) {
            req.user = user;
            next()
            return
        }
        const listAPI = await RoleController.getListApiByUserID(decode.userId)
        
        const found = listAPI.some(el => el.api_name === apiname);
        // console.log("xxx")
        if (!found) {
            throw { e: "ERROR 403: Forbidden" }
        } else{
            req.user = user;
            next() 
            return
        }
   
    } catch (error) {
        if(error){
            // console.log(error.e || error + "")
            res.status(error.e ? 403 : 401).json(commonResponse(error.e ? 403 : 401, error.e || error + ""));
        }
        
    }

};

async function validateToken(auth) {
    const token = auth.split(' ')[1];
    const decoded = await decodeToken(token);
    return decoded;
}