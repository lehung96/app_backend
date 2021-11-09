const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database/db");
const { sendMail } = require("../_helpers/mailer");
const { decodeToken } = require("../_helpers/func");
const logger = require("../logger/index");
const forgotPasswordHtml = require("../files/email/forgotPassword");
const createUserHtml = require("../files/email/createUser");
const _ = require("lodash");
const generator = require("generate-password");
const ExcelJS = require("exceljs");
const RoleController = require("./RoleController");

const {
    EXPIRED_TOKEN,
    API_CODE,
    STATUS_COMMON,
    SECRET_TOKEN,
    SECRET_TOKEN_PASS,
    URL_SERVER,
    FUNCTION_CODE,
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
    getErrorMsgIncorrect,
} = require("../_helpers/func");

class UsersController {
    //
    static async registerOneUser(username, email, roleID) {
        try {
            logger("Hàm registerOneUser", { username, email, roleID }, "Gọi hàm");
            const pass = generator.generate({
                length: 10,
                numbers: true,
            });

            const password = jwt.sign(pass, SECRET_TOKEN_PASS);

            const now = getDateTimeNow();

            const result = await db.tx(async (t) => {
                let findUser = await t.oneOrNone(
                    `SELECT users_id, username, email, role_id FROM users WHERE username = $1 AND is_wait_active = 1`,
                    username
                );
                logger(
                    "Hàm tregisterOneUser",
                    { findUser },
                    "Tìm xem tài khoản đã tồn tại và chưa kích hoạt không"
                );
                let user = findUser;
                let createUser = {};

                if (!findUser) {
                    createUser = await t.one(
                        `
                        INSERT INTO 
                            users(username, password, email, status, created_at, updated_at, role_id, is_wait_active)
                        VALUES($1, $2, $3, 1, $4, $4, $5, 1) 
                        RETURNING users_id, username, email, role_id
                        `,
                        [username, password, email, now, roleID]
                    );
                    user = createUser;

                    logger( "Hàm tregisterOneUser", { createUser },"Tạo tài khoản trong db" );
                }

                //token tuổi thọ 2 ngày =))
                const token = jwt.sign({ userID: user.users_id }, SECRET_TOKEN_PASS, {
                    expiresIn: 60 * 60 * 24 * 2,
                });

                const result2 = await t.none(
                    "UPDATE users SET forgot_pass_token = $1, email = $2 WHERE username = $3",
                    [token, email, user.username]
                );
                logger(
                    "Hàm tregisterOneUser",
                    { result2 },
                    "Cập nhật token để đặt mật khẩu"
                );

                const html = createUserHtml(
                    `${URL_SERVER}forgot-password/${username}/${token}`,
                    { username: user.username, userID: user.users_id }
                );

                const resultSendMail = await sendMail(
                    email,
                    "Mail tạo tài khoản thành công",
                    html
                );
                logger(
                    "Hàm tregisterOneUser",
                    { resultSendMail },
                    "Gửi link đăng nhập về email"
                );

                return t.batch([findUser, createUser, result2]);
            });

            return { data: result };
        } catch (e) {
            logger("Hàm tregisterOneUser", e, e + "", "error");
            return { email };
        }
    }

    //Tạo tài khoản cho nhân viên, có thể nhập nhiều mail để tạo nhiều tài khoản
    static async registerUser(req, res) {
        try {
            logger("registerUser", { body: req.body, user: req.user }, "Gọi api");

            const { emails, roleID } = req.body;
            let listUsername = [];
            //Kiểm tra list email, nếu không đúng định dạng trả về lỗi luôn
            for (let email of emails) {
                if (
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                        email
                    )
                ) {
                    listUsername.push(email.split("@")[0]);
                } else {
                    throw { error: "Email không tồn tại!", errorCode: 1 };
                    // Mã lỗi 1 định dạng email không đúng
                }
            }

            // Kiểm tra xem tài khoản có bị trùng không, nếu trùng cũng thoát luôn
            let listUsernameDuplicate = await db.manyOrNone(
                "SELECT username FROM users WHERE username IN ($1:csv) AND is_wait_active <> 1",
                [listUsername]
            );

            logger(
                "registerUser",
                listUsernameDuplicate,
                "Kiểm tra tài khoản đã tồn tại chưa"
            );

            if (listUsernameDuplicate.length > 0) {
                listUsernameDuplicate = listUsernameDuplicate.map(
                    (item) => item.username
                );
                const strListUserDuplicate = listUsernameDuplicate.join("; ");
                throw {
                    error: `Tên người dùng: ${strListUserDuplicate} đã tồn tại!`,
                    errorCode: 2,
                    data: listUsernameDuplicate,
                };
                //Mã lỗi 2 tên người dùng đã tồn tại và đang hoạt động 
            }

            //List lưu danh sách tài khoản lỗi
            const listUserFail = [];

            for (let email of emails) {
                const result = await UsersController.registerOneUser(
                    email.split("@")[0],
                    email,
                    roleID
                );
                if (result.email) {
                    listUserFail.push(email);
                }
            }

            logger("registerUser", listUserFail, "Danh sách tài khoản tạo thất bại");

            if (listUserFail.length > 0) {
                const strListUserFail = listUserFail.join("; ");
                throw {
                    error: `Tạo tài khoản cho: ${strListUserFail} thất bại`,
                    errorCode: 3,
                    data: listUserFail,
                };
            }

            logger("registerUser", listUsername, "Danh sách tài khoản");
            return res
                .status(200)
                .json(commonResponse(200, "Tạo tài khoản thành công!", "Success", req));
        } catch (e) {
            logger("registerUser", e.erorr || e + "", "Danh sách tài khoản", "error");
            res
                .status(200)
                .json(
                    commonResponse(
                        API_CODE.ERROR,
                        e.error || e + "",
                        e.erorr ? e : e + "",
                        req
                    )
                );
        }
    }

    //Lấy danh sách code3P
    static async getListCode3P(req, res) {
        try {
            // lấy danh sách code
            const listCode3p = await db.manyOrNone(
                "SELECT * FROM code_3p"
            );

            res.json(
                commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, listCode3p, req)
            );
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + "", req));
        }
    }

    //Tạo tài khoản cho 3P
    static async registerUser3P(req, res) {
        try {
            logger("registerUser3P", { body: req.body, user: req.user }, "Gọi api");

            const { partnerID, name3p, username, password, roleID } = req.body;

            const passRegex = new RegExp(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$"
            );
            if (!passRegex.test(password)) {
                throw "Password không đúng định dạng!";
            }

            // validate
            const user = await db.oneOrNone(
                "SELECT username FROM users WHERE username=$1",
                [username]
            );

            if (user) {
                throw getErrorMsgExist(`Tên người dùng`);
            }

            // // hash password
            if (req.body.password) {
                req.body.password = jwt.sign(password, SECRET_TOKEN_PASS);
            }

            const now = getDateTimeNow();

            try {
                const newData = await db.tx(async t => {
                    const result1 = await t.one(
                        `
                        INSERT INTO 
                            users(username, password, code_3p_id, status, created_at, updated_at, role_id, is_wait_active)
                        VALUES($1, $2, $3, 1, $4, $4, $5, 0)
                        RETURNING users_id, username, role_id
                        `,
                        [username, req.body.password, partnerID, now, roleID]
                    );
    
                    return t.batch([result1])
                })

                logger("registerUser3P", newData, "trả kết quả");
                res.status(200).json(
                    commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, newData, req)
                );
                
            } catch (error) {
                logger("registerUser3P", "Tạo tài khoản thất bại!", "Lỗi", "error");
                res.status(200).json(commonResponse(API_CODE.ERROR, error + "", {}, req));
            }

        } catch (e) {
            logger("registerUser3P", "System error: " + e, "Lỗi", "error");
            res.status(200).json(commonResponse(API_CODE.ERROR, "System error: " + e, {}, req));
        }
    }

    //Đăng nhập
    static async loginUser(req, res, next) {
        try {
            logger("loginUser", req.body, "Gọi api");
            const { username, password } = req.body;

            // validate, Nếu tài khoản chưa active thì không cho đăng nhập
            const user = await db.oneOrNone(
                `
                SELECT 
                    users_id, 
                    username,
                    password,
                    email,
                    role.role_id, 
                    gr.group_name AS group_name,
                    users.status,
                    token,
                    is_first_login,
                    count_login
                FROM users, role, group_role AS gr WHERE username=$1 AND is_wait_active = 0 AND users.role_id = role.role_id AND role.group_role_id = gr.group_role_id
                `,
                [username]
            );

            if (!user) {
                // console.log(2);
                throw getErrorMsgIncorrect(`Tài khoản hoặc mật khẩu`);
            } else if (user.status === STATUS_COMMON.INACTIVE) {
                throw getErrorMsgNotActive(`Tài khoản`);
            } else if (password !== jwt.verify(user.password, SECRET_TOKEN_PASS)) {
                if (user.count_login > 4) {
                    await db.none(
                        `UPDATE users SET count_login = 0, status = 0 WHERE users_id = $1`,
                        [user.users_id]
                    );
                } else {
                    await db.none(
                        `UPDATE users SET count_login = $1 WHERE users_id = $2`,
                        [user.count_login + 1, user.users_id]
                    );
                }

                // console.log(jwt.verify(user.password, SECRET_TOKEN_PASS));
                throw getErrorMsgIncorrect(`Tài khoản hoặc mật khẩu`);
            }

            //Đăng nhập sai mật khẩu quá 5 lần sẽ bị khoá tài khoản!
            await db.none(`UPDATE users SET count_login = $1 WHERE users_id = $2`, [
                0,
                user.users_id,
            ]);

            const token = generateUserToken({ userId: user.users_id });

            await db.none(`UPDATE users SET token = $1 WHERE users_id = $2`, [
                token,
                user.users_id,
            ]);

            user.token = token;

            delete user.password;

            logger("loginUser", user, "Đăng nhập thành công");
            res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, user, req));
        } catch (e) {
            logger("loginUser", e + "", "Đăng nhập thất bại");
            res.json(commonResponse(API_CODE.ERROR, e + "", {}, req));
        }
    }

    //Xem mật khẩu của 3P
    static async readPassWordUser(req, res, next) {
        try {
            const { username } = req.body;

            // validate
            const user = await db.oneOrNone(
                `
                SELECT 
                    users_id, 
                    username,
                    password,
                    group_name
                FROM users, role, group_role AS gr
                WHERE username=$1
                    AND users.role_id = role.role_id
                    AND role.group_role_id = gr.group_role_id
                `,
                [username]
            );

            if (!user) {
                throw getErrorMsgNotExist(`${username}`);
            }

            if (user.group_name !== "3P" && req.user.users_id !== 1) {
                throw "Không thể xem mật khẩu của tài khoản không phải 3P!";
            }

            const password = jwt.verify(user.password, SECRET_TOKEN_PASS);

            res.json(
                commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, password, req)
            );
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + "", {}, req));
        }
    }

    // static async getListEmailByUserID(userID) {
    //     try {
    //         const listEmail = await db.manyOrNone(
    //             "SELECT * FROM user_email WHERE user_id = $1",
    //             [userID]
    //         );
    //         return listEmail;
    //     } catch (error) {
    //         return null;
    //     }
    // }

    //Đăng xuất
    static async logoutUser(req, res) {
        try {
            const { username } = req.body;

            const user = await db.oneOrNone(
                "SELECT username FROM users WHERE username=$1",
                [username]
            );

            if (!user) {
                throw getErrorMsgNotExist(`${username}`);
            }

            await db.none("UPDATE users set tokenfirebase=$1 WHERE username=$2", [
                "",
                username,
            ]);

            res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, {}, req));
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + "", {}, req));
        }
    }
    //Lấy danh sách người dùng
    static async getListUser(req, res, next) {
        try {
            const { page, size, sort, status, group_role, user_name,partner_code_id } = req.body;
            const { limit, offset } = getPagination(page, size);
         
            const listFunction = await RoleController.getListFunctionByRoleID(
                req.user.role_id
            );

            let queryList = "";
            let queryCount = "";

            //Nếu được xem toàn bộ user
            if (
                req.user.users_id === 1 ||
                listFunction.find((item) => item.code === FUNCTION_CODE.viewAllUser) ||
                listFunction.find((item) => item.code === FUNCTION_CODE.editAllUser)
            ) {
                queryList = `
                SELECT users.users_id,users.username,users.password,users.email,users.status, users.is_wait_active, users.tokenfirebase,users.created_at,users.updated_at,"role".role_name,group_role.group_name,code_3p.code3p,code_3p.code_3p_id
                FROM users 
                LEFT JOIN "role" 
                ON users.role_id = "role".role_id   
                LEFT JOIN "group_role" ON "role".group_role_id = group_role.group_role_id
                LEFT JOIN "code_3p" ON "code_3p".code_3p_id = users.code_3p_id
                WHERE NOT users.users_id = 1  `;
                queryCount = `
                SELECT COUNT(users_id) 
                FROM users 
                LEFT JOIN "role" 
                ON users.role_id = "role".role_id   
                LEFT JOIN "group_role" ON "role".group_role_id = group_role.group_role_id
                LEFT JOIN "code_3p" ON "code_3p".code_3p_id = users.code_3p_id
                WHERE NOT users.users_id = 1  `;

                if (group_role) {
                    queryList += `AND group_role.group_role_id = ${group_role} `;
                    queryCount += `AND group_role.group_role_id = ${group_role} `;
                }
            } else {
                queryList = `
                SELECT users.users_id,users.username,users.password,users.email,users.status, users.is_wait_active, users.tokenfirebase,users.created_at,users.updated_at,"role".role_name,group_role.group_name,code_3p.code3p,code_3p.code_3p_id
                FROM users 
                LEFT JOIN "role" 
                ON users.role_id = "role".role_id   
                LEFT JOIN "group_role" ON "role".group_role_id = group_role.group_role_id
                LEFT JOIN "code_3p" ON "code_3p".code_3p_id = users.code_3p_id
                WHERE NOT users.users_id = 1 AND group_role.group_name = '3P' `;
                queryCount = `
                SELECT COUNT(users_id) 
                FROM users 
                LEFT JOIN "role" 
                ON users.role_id = "role".role_id   
                LEFT JOIN "group_role" ON "role".group_role_id = group_role.group_role_id
                LEFT JOIN "code_3p" ON "code_3p".code_3p_id = users.code_3p_id
                WHERE NOT users.users_id = 1 AND group_role.group_name = '3P' `;
            }

            if (_.isNumber(status)) {
                if (status === 1) {
                    queryList += `AND users.status = ${status} AND users.is_wait_active = 0`;
                    queryCount += `AND users.status = ${status} AND  users.is_wait_active = 0`;
                }
                if (status === 0) {
                    queryList += `AND users.status = ${status}  `;
                    queryCount += `AND users.status = ${status} `;
                }
                if (status !== 0 && status !== 1) {
                    queryList += `AND users.status = 1 AND users.is_wait_active = 1 `;
                    queryCount += `AND users.status = 1 AND users.is_wait_active = 1 `;
                }
            }

            if (user_name) {
                queryList += `AND users.username ILIKE  '%${user_name}%' `;
                queryCount += `AND  users.username ILIKE '%${user_name}%' `;
            }
            if (partner_code_id) {
                queryList += `AND code_3p.code_3p_id =${partner_code_id} `;
                queryCount += `AND  code_3p.code_3p_id   = ${partner_code_id} `;
            }
            if (sort) {
                queryList += `ORDER BY users.created_at ${sort} `;
            }
         
            queryList = queryList + `LIMIT ${limit} OFFSET ${offset}`;
            const listUser = await db.any(queryList);
            const total = await db.any(queryCount);
            const result = getPagingData(
                listUser,
                getParseInt(total[0].count),
                page,
                limit
            );

            res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result, req));
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + "", {}, req));
        }
    }

    //Lấy thông tin người dùng
    static async getUserInfo(req, res) {
        try {
            const { username } = req.user;

            // validate
            const user = await db.oneOrNone(
                `
                SELECT 
                    users_id, 
                    username,
                    password,
                    email,
                    role_id, 
                    status 
                FROM users WHERE username=$1
                `,
                [username]
            );

            if (!user) {
                throw getErrorMsgNotExist(`${username}`);
            }

            res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, user, req));
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + "", {}, req));
        }
    }

    //Chức năng quên mật khẩu, gửi 1 link về email
    static async forgotPassword(req, res) {
        try {
            logger("forgotPassword", req.body, "gọi api quên mật khẩu");
            const { username } = req.body;
            const user = await db.oneOrNone(
                `
                SELECT * 
                    FROM users, role, group_role AS gr
                    WHERE username = $1 
                        AND is_wait_active = 0
                        AND users.role_id = role.role_id
                        AND role.group_role_id = gr.group_role_id
            `,
                username
            );
            if (!user) {
                throw { error: `Tài khoản ${username} không tồn tại!` };
            }
            if (user.status !== 1) {
                throw { error: `Tài khoản ${username} đang bị khoá!` };
            }
            if (user.group_name === "3P") {
                throw {
                    error: `Liên hệ với nhân viên hỗ trợ của bạn để lấy lại mật khẩu!`,
                };
            }
            const forgotPassToken = jwt.sign(
                { userID: user.users_id },
                SECRET_TOKEN_PASS,
                { expiresIn: 60 * 5 }
            );
            logger("forgotPassword", forgotPassToken, "lấy token");

            await db.none(
                "UPDATE users SET forgot_pass_token = $1 WHERE username = $2",
                [forgotPassToken, username]
            );

            const html = forgotPasswordHtml(
                `${URL_SERVER}forgot-password/${username}/${forgotPassToken}`,
                { username: user.username, userID: user.users_id }
            );

            const result = await sendMail(user.email, "Mail quên mật khẩu", html);

            logger("forgotPassword", result, "quên mật khẩu thành công");
            res
                .status(200)
                .json(
                    commonResponse(
                        200,
                        "Nhấn vào đường dẫn trong email của bạn để quên mật khẩu!",
                        result,
                        req
                    )
                );
        } catch (error) {
            logger(
                "forgotPassword",
                error.error || error + "",
                "quên mật khẩu thất bại!"
            );
            res
                .status(200)
                .json(commonResponse(400, error.error || "System error: " + error, error + "", req));
        }
    }

    //Thay đổi mật khẩu khi đã đăng nhập
    static async changePassword(req, res) {
        try {
            logger("changePassword", req.body, "gọi api đổi mật khẩu");
            const { oldPassword, newPassword } = req.body;
            const { username } = req.user;

            const passRegex = new RegExp(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$!%*?&])[A-Za-z\\d@#$!%*?&]{8,}$"
            );
            if (!passRegex.test(newPassword)) {
                throw "Password không đúng định dạng!";
            }

            const user = await db.one(
                "SELECT password FROM users WHERE username = $1",
                [username]
            );

            if (!user) {
                throw `${username} không tồn tại!`;
            }

            user.password = jwt.verify(user.password, SECRET_TOKEN_PASS);

            if (user.password !== oldPassword) {
                throw "Mật khẩu cũ không đúng!";
            }

            const password = jwt.sign(newPassword, SECRET_TOKEN_PASS);

            // const {username} = req.user
            await db.none(`UPDATE users SET password = $1 WHERE username = $2`, [
                password,
                username,
            ]);

            logger("changePassword", password, "Đổi mật khẩu thành công!");

            return res
                .status(200)
                .json(
                    commonResponse(200, "Thay đổi mật khẩu thành công!", newPassword, req)
                );
        } catch (error) {
            logger("changePassword", error + "", "Đổi mật khẩu thất bại!");
            return res
                .status(400)
                .json(commonResponse(400, error + "", "Thay đổi mật khẩu thất bại!", req));
        }
    }

    //Note
    //Thay đổi mật khẩu lần đầu đăng nhập
    static async changePasswordFirstLogin(req, res) {
        try {
            logger(
                "changePasswordFirstLogin",
                req.body,
                "gọi api đổi mật khẩu lần đầu"
            );
            const { newPassword, token } = req.body;

            const { userId } = await decodeToken(token);

            const user = await db.one(
                "SELECT password, users_id, is_first_login FROM users WHERE users_id = $1",
                [userId]
            );

            if (!user) {
                throw `${username} không tồn tại!`;
            }

            if (user.is_first_login !== 1) {
                throw "Tài khoản không phải đăng nhập lần đầu!";
            }

            const password = jwt.sign(newPassword, SECRET_TOKEN_PASS);
            const newToken = generateUserToken({ userId: user.users_id });

            // const {username} = req.user
            const newUser = await db.one(
                `UPDATE users SET password = $1, is_first_login = 0, token = $2  WHERE users_id = $3 RETURNING username, email, role_id, status, token `,
                [password, newToken, userId]
            );
            delete newUser.password;

            logger("changePasswordFirstLogin", newUser, "Đổi mật khẩu thành công!");

            return res
                .status(200)
                .json(
                    commonResponse(200, "Thay đổi mật khẩu thành công!", { newUser }, req)
                );
        } catch (error) {
            logger("changePasswordFirstLogin", error, "Đổi mật khẩu thất bại!");
            return res
                .status(400)
                .json(commonResponse(400, "Thay đổi mật khẩu thất bại!", error + "", req));
        }
    }

    //Lấy danh sách groupRole
    static async getListGroupRoleForGetListUser(req, res) {
        try {
            let query = "";
            const listFunction = await RoleController.getListFunctionByRoleID(
                req.user.role_id
            );
            if (
                req.user.users_id === 1 ||
                listFunction.find((item) => item.code === FUNCTION_CODE.viewAllUser) ||
                listFunction.find((item) => item.code === FUNCTION_CODE.editAllUser)
            ) {
                query = `SELECT group_role.group_role_id,group_role.group_name
                    FROM "group_role" `;
            } else {
                query = `SELECT group_role.group_role_id,group_role.group_name
                FROM "group_role" WHERE group_name = '3P' `;
            }

            const listGroupRole = await db.query(query);

            if (!listGroupRole) {
                throw `listGroupRole không tồn tại!`;
            }

            return res
                .status(200)
                .json(commonResponse(200, "Thành công", { listGroupRole }, req));
        } catch (error) {
            return res.status(200).json(commonResponse(400, error + "", {}, req));
        }
    }

    //Lấy danh sách groupRole cho chức năng tạo tài khoản mới
    static async getListGroupRoleForCreatUser(req, res) {
        try {
            const listFunction = await RoleController.getListFunctionByRoleID(
                req.user.role_id
            );

            let query = "";

            if (
                req.user.users_id === 1 ||
                listFunction.find((item) => item.code === FUNCTION_CODE.createAllUser)
            ) {
                query = `SELECT group_role.group_role_id,group_role.group_name,role.role_name,"role".role_id
                FROM "group_role" LEFT JOIN role ON "role".group_role_id = group_role.group_role_id  WHERE role.role_id <> 1`;
            } else {
                query = `SELECT group_role.group_role_id,group_role.group_name,role.role_name,"role".role_id
                FROM "group_role" LEFT JOIN role ON "role".group_role_id = group_role.group_role_id  WHERE role.role_id <> 1 AND group_role.group_name = '3P'`;
            }

            const listGroupRole = await db.query(query);

            if (!listGroupRole) {
                throw { error: `listGroupRole không tồn tại!` };
            }
            const data = _(listGroupRole)
                .groupBy((x) => x.group_name)
                .map((value, key) => ({
                    group_role: key,
                    group_role_id: value[0].group_role_id,
                    role: value,
                }))
                .value();

            return res.status(200).json(commonResponse(200, "success", { data }, req));
        } catch (e) {
            return res
                .status(400)
                .json(commonResponse(400, e.error || "System error: " + e, e, req));
        }
    }

    //Thay đổi mật khẩu tài khoản trong giao diện xem danh sách tài khoản
    static async adminChangePassword(req, res) {
        try {
            logger("adminChangePassword", req.body, "gọi api đổi mật khẩu");
            const { oldPassword, newPassword, username } = req.body;

            const passRegex = new RegExp(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$"
            );
            if (!passRegex.test(newPassword)) {
                throw "Password không đúng định dạng!";
            }

            const user = await db.oneOrNone(
                `
                SELECT 
                    users_id, 
                    username,
                    password,
                    group_name
                FROM users, role, group_role AS gr
                WHERE username=$1
                    AND users.role_id = role.role_id
                    AND role.group_role_id = gr.group_role_id
                `,
                [username]
            );

            if (!user) {
                throw getErrorMsgNotExist(`${username}`);
            }

            if (user.group_name !== "3P" && req.user.users_id !== 1) {
                throw "Không thể đổi mật khẩu của tài khoản không phải 3P!";
            }

            const passwordDB = jwt.verify(user.password, SECRET_TOKEN_PASS);

            if (passwordDB !== oldPassword) {
                throw "Mật khẩu cũ không hợp lệ!";
            }

            const password = jwt.sign(newPassword, SECRET_TOKEN_PASS);
            // const {username} = req.user
            await db.none(`UPDATE users SET password = $1 WHERE username = $2`, [
                password,
                username,
            ]);

            logger("adminChangePassword", password, "Đổi mật khẩu thành công!");

            return res
                .status(200)
                .json(
                    commonResponse(200, "Thay đổi mật khẩu thành công!", newPassword)
                );
        } catch (error) {
            logger(
                "adminChangePassword",
                error + "",
                "Đổi mật khẩu thất bại!",
                "error"
            );
            return res
                .status(200)
                .json(commonResponse(400, error + "", "Thay đổi mật khẩu thất bại!", req));
        }
    }

    //Đổi mật khẩu khi quên mật khẩu
    static async forgotAndChangePassword(req, res) {
        try {
            logger(
                "forgotAndChangePassword",
                req.body,
                "gọi api đổi mật khẩu sau khi nhấn vào link trong email"
            );
            const { newPassword, token } = req.body;

            const { userID } = jwt.verify(token, SECRET_TOKEN_PASS);

            const passRegex = new RegExp(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$!%*?&])[A-Za-z\\d@#$!%*?&]{8,}$"
            );
            if (!passRegex.test(newPassword)) {
                throw { e: "Mật khẩu không đúng định dạng!" };
            }

            if (!userID) {
                throw { e: "Token hết hạn hoặc không hợp lệ!" };
            }

            const user = await db.one("SELECT * FROM users WHERE users_id = $1", [
                userID
            ]);

            //Check token có bằng token lưu trong user không
            if (user.forgot_pass_token !== token) {
                throw { e: "Token hết hạn hoặc không hợp lệ!" };
            }

            const password = jwt.sign(newPassword, SECRET_TOKEN_PASS);

            await db.none(
                `UPDATE users SET password = $1, forgot_pass_token = '', is_wait_active = 0 WHERE users_id = $2`,
                [password, userID]
            );

            logger("forgotAndChangePassword", password, "Đổi mật khẩu thành công!");

            return res
                .status(200)
                .json(
                    commonResponse(
                        200,
                        "Thay đổi mật khẩu thành công!",
                        "Thay đổi mật khẩu thành công!",
                        req
                    )
                );
        } catch (error) {
            logger(
                "forgotAndChangePassword",
                error.e ? error.e : error + "",
                "Lỗi",
                "error"
            );
            return res
                .status(200)
                .json(
                    commonResponse(
                        400,
                        error.e ? error.e : "Tocken hết hạn hoặc không hợp lệ!",
                        error.e || error + "",
                        req
                    )
                );
        }
    }

    //Khoá và mở khoá tài khoản
    static async changeStatus(req, res) {
        try {
            console.log("gọi api");
            logger(
                "changeStatus",
                req.body,
                "gọi api khóa, mở khoá tài khoản người dùng"
            );
            const { userID, status } = req.body;

            const user = await db.one(
                `
                SELECT username, group_name FROM users, role, group_role AS gr
                    WHERE users_id = $1
                        AND users.role_id = role.role_id
                        AND role.group_role_id = gr.group_role_id
            `,
                [userID]
            );

            console.log("users_id: ", req.user.users_id);

            if (user.group_name !== "3P" && req.user.users_id !== 1) {
                throw "Không thể khoá tài khoản không phải 3P!";
            }

            if (userID === 1 || userID === "1") {
                throw "Không thể khóa tài khoản Super Admin!";
            }

            if (userID === req.user.users_id) {
                throw "Không thể khóa tài khoản của bạn!";
            }

            let result = "";
            if (status === 0) {
                await db.one(
                    `UPDATE users SET status = 0 WHERE users_id = $1 RETURNING users_id, username`,
                    [userID]
                );
                result = "Khóa tài khoản thành công!";
            } else if (status === 1) {
                await db.one(
                    `UPDATE users SET status = 1 WHERE users_id = $1 RETURNING users_id, username `,
                    [userID]
                );
                result = "Mở khóa tài khoản thành công!";
            }

            logger("changeStatus", result, "Trả về kết quả");
            return res.status(200).json(commonResponse(200, "Đổi mật khẩu thành công!", result, req));
        } catch (error) {
            logger("changeStatus", error + "", "Cập nhật thất bại!");
            return res.status(200).json(commonResponse(400, error + "", error, req));
        }
    }

    //Xuất danh sách tài khoản 3P
    static async exportAccount3P(req, res) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("DSA request");
            worksheet.columns = [
                { header: "NO", key: "no", width: 10 },
                { header: "Tên đăng nhập", key: "username", width: 30 },
                { header: "Mã đối tác", key: "code3p", width: 20 },
                { header: "Tên đối tác", key: "name3p", width: 25 },
                { header: "Tài khoản", key: "group_name", width: 20 },
                { header: "Vai trò", key: "role_name", width: 30 },
                { header: "Trạng thái", key: "status", width: 20 }
            ];

            let count = 1;

            const queryListAccount3P = `
                SELECT u.username, u.status, gr.group_name, r.role_name, c.code3p, c.name3p
                    FROM users AS u LEFT JOIN role AS r ON u.role_id = r.role_id
                        LEFT JOIN group_role AS gr ON r.group_role_id = gr.group_role_id
                            LEFT JOIN code_3p AS c ON u.code_3p_id = c.code_3p_id
                    WHERE gr.group_name = '3P'
            `;

            const listAccount3P = await db.manyOrNone(queryListAccount3P);
            
            logger("exportAccount3P", listAccount3P, "Lấy danh sách tài khoản 3P");

            listAccount3P.forEach((user) => {
                user.no = count;
                user.status = user.status ? "Đang hoạt động" : "Ngưng hoạt động"
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
                row.eachCell(cell => {
                    cell.border = {
                        top: {style: "thin"},
                        bottom: {style: "thin"},
                        right: {style: "thin"},
                        left: {style: "thin"}
                    }
                })
            })

            const data = await workbook.xlsx.writeBuffer();

            res.attachment("users.xlsx");
            res.send(data);
        } catch (error) {
            logger("exportAccount3P", error + "", "Lấy danh sách tài khoản 3P thất bại");
            return res.status(400).json(commonResponse(400, error + "", {}, req));
        }
    }
}

module.exports = UsersController;
