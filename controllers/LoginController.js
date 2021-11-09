const config = require("../config/config");
const CallAxios = require("../models/CallAxios");
// const Request = require("../models/Request");
const Response = require("../models/Response");
const auth = require("./AuthController");
const { API_CODE } = require("../_helpers/constants");
const { db } = require("../database/db");
const { getDateTimeNow, getErrorMsgNotExist } = require("../_helpers/func");

class LoginController {
    static async login(req, res, next) {
        try {
            const params = req.body;

            const token_auth =
                "Basic " +
                Buffer.from(params.username + ":" + params.password).toString(
                    "base64"
                );

            let result = await CallAxios(
                config.LOGIN_URL,
                token_auth,
                params,
                "POST"
            );

            if (result) {
                // lưu tài khoản khi đăng nhập trên app
                const user = await db.oneOrNone(
                    "SELECT username FROM user_dsa WHERE username=$1",
                    [params.username]
                );

                if (!user) {
                    const { body } = result;

                    const now = getDateTimeNow();

                    await db.one(
                        "INSERT INTO user_dsa(username, status, uiid, name, code, created_at, updated_at)" +
                            "VALUES($1, $2, $3, $4, $5, $6, $7)",
                        [
                            params.username,
                            body.status,
                            body.uiid,
                            body.role && body.role.name,
                            body.role && body.role.code,
                            now,
                            now,
                        ]
                    );
                }
            }
            res.json(
                Response.login(result.status_code, result.body, params.username)
            );
        } catch (error) {
            res.json({
                status: false,
                body: error,
            });
        }
    }

    static async getToken(req, res, next) {
        try {
            const tokenObj = await auth.getToken();
            const access_token = tokenObj.body.access_token;
            const token_type = tokenObj.body.token_type;
            const token = token_type + " " + access_token;

            res.json({ token });
        } catch (error) {
            res.json({
                status: false,
                body: error,
            });
        }
    }

    static async updateTokenFirebase(req, res, next) {
        try {
            const { username, tokenFirebase, deviceId } = req.body;

            const user = await db.oneOrNone(
                "SELECT username FROM user_dsa WHERE username=$1",
                [username]
            );

            if (!user) {
                throw getErrorMsgNotExist(`${username}`);
            }

            await db.none(
                "UPDATE user_dsa set token_firebase=$1, device_id=$2 WHERE username=$3",
                [tokenFirebase, deviceId, username]
            );

            res.json(
                Response.commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS)
            );
        } catch (e) {
            res.json(Response.commonResponse(API_CODE.ERROR, e + ""));
        }
    }
}

module.exports = LoginController;
