const { db } = require("../database/db");
const _ = require("lodash")
const moment = require("moment")
moment.locale("vn")
const logger = require("../logger/index")
const jwt = require("jsonwebtoken")
const { commonResponse } = require("./../models/Response");
const {
    getStandardResponse,
    getErrorMsgExist,
    getErrorMsgNotExist,
    getErrorMsgNotActive,
} = require("../_helpers/func")



class RoleController {
    static async getListApiByUserID(users_id) {
        try {
            logger("Hàm getListApiByUserID", users_id, "Gọi hàm")
            if(!users_id) {
                throw "Không có users_id"
            }
            const listAPI = await db.manyOrNone(
                "SELECT DISTINCT(api.api_name)" +
                    "FROM users AS u, role AS r, role_function AS rf, function AS f, function_api AS fa, api " +
                    "WHERE u.role_id = r.role_id " +
                        "AND r.role_id = rf.role_id " +
                        "AND rf.function_id = f.function_id " +
                        "AND f.function_id = fa.function_id " +
                        "AND fa.api_id = api.api_id " +
                        "AND u.users_id = $1",
                [users_id]
            );

            logger("Hàm getListApiByUserID", listAPI, "Trả về danh sách API")
            return listAPI
        } catch (e) {
            logger("Hàm getListApiByUserID", e + "", "Lỗi hệ thống", "error")
            throw e
        }
    }

    static async getListApi(req, res) {
        try {
            let data = await RoleController.getListApiByUserID(req.user.users_id)
            if(!data) {
                throw "Không có dữ liệu trả về"
            }

            data = data.map(item => item.api_name)
            
            return res.status(200).json(
                commonResponse(200, "Thành công!", data, req)
            )
        } catch (e) {
            logger("getListApi", e + "", "Lỗi", "error")
            return res.status(200).json(
                commonResponse(400, "System error: " + e, e, req)
            )
        }
        
    }

    static async getListFunctionByRoleID(role_id) {
        try {
            logger("Hàm getListFunctionByRoleID", role_id, "Gọi hàm")
            if(!role_id) {
                throw "Không có role_id"
            }

            const listFunction = await db.manyOrNone(
                    "SELECT f.function_id, f.function_name, f.code " +
                    "FROM role AS r, role_function AS rf, function AS f " +
                    "WHERE r.role_id = rf.role_id " +
                        "AND rf.function_id = f.function_id " +
                        "AND r.role_id = $1",
                [role_id]
            );

            logger("Hàm getListFunctionByRoleID", role_id, "Trả về danh sách function của user")
            return listFunction
        } catch (e) {
            logger("Hàm getListFunctionByRoleID", e + "", "Lỗi", "error")
            throw e
        }
    }

    static async getListFunction(req, res) {
        try {
            logger("getListFunction", {body: req.body, user: req.user}, "gọi API")

            const data = await RoleController.getListFunctionByRoleID(req.body.role_id)
            if(!data) {
                throw "Không có dữ liệu trả về!"
            }
            const newData = data.map(fc => fc.function_id)

            logger("getListFunction", newData, "Trả về danh sách function của user")
            return res.status(200).json(
                commonResponse(200, "Thành công!", newData, req)
            )
        } catch (error) {
            logger("getListFunction", error + "", "Lỗi", "error")
            return res.json(
                commonResponse(400, "System error: " + error, error + "", req)
            )
        }
        
    }

    static async getListFunctionForCheckPermissions(req, res) {
        try {
            logger("getListFunction", {body: req.body, user: req.user}, "gọi API")

            const data = await RoleController.getListFunctionByRoleID(req.user.role_id)
            if(!data) {
                throw "Không có dữ liệu trả về!"
            }

            logger("getListFunction", data, "Trả về danh sách function của user")
            return res.status(200).json(
                commonResponse(200, "Thành công!", data, req)
            )
        } catch (error) {
            logger("getListFunction", error + "", "Lỗi", "error")
            return res.status(200).json(
                commonResponse(400, "Thất bại", error + "", req)
            )
        }
        
    }

    // Tạm thời không dùng đến, có thể xoá bỏ sau này
    // static async getListAllFunctionByNone() {
    //     try {
    //         logger("Hàm getListAllFunctionByNone", req.body, "gọi API")
    //         const listFunction = await db.manyOrNone(
    //                 "SELECT * " +
    //                 "FROM function " +
    //                 "LIMIT 1000",
    //             []
    //         );

    //         logger("Hàm getListAllFunctionByNone", listFunction, "Trả về danh sách tất cả các function")
    //         return listFunction
    //     } catch (e) {
    //         logger("Hàm getListAllFunctionByNone", e + "", "Lỗi", "error")
    //         throw e.toString()
    //     }
    // }

    // static async getListAllFunction(req, res) {
    //     try {
    //         logger("getListAllFunction", req.body, "gọi API")

    //         const data = await RoleController.getListAllFunctionByNone()
    //         if(!data) {
    //             throw "Không có dữ liệu trả về!"
    //         }

    //         logger("getListAllFunction", data, "Trả về danh sách tất cả các function")
    //         return res.status(200).json(data)
    //     } catch (error) {
    //         logger("getListAllFunction", error + "", "Lỗi", "error")
    //         return res.status(500).json({error: e.toString()})
    //     }
        
    // }

    static async updateRoleFunction(req, res) {
        try {
            logger("updateRoleFunction", req.body, "gọi API")

            const {role_id, listFunctionID} = req.body

            const newListFunctionID = Array.from(new Set(listFunctionID)) // loại bỏ các function ID trùng nhau

            let query = ""
            for(let function_id of newListFunctionID) {
                query += `INSERT INTO role_function (role_id, function_id) VALUES (${role_id}, ${function_id});`
            }

            const newData = await db.tx(async t => {
                let result1 = await t.none("DELETE FROM role_function WHERE role_id = $1", [role_id])
                let result2 = null
                if(query) {
                    result2 =  await t.none(query, [])
                }
                return t.batch([result1, result2])
            })
                   
            logger("updateRoleFunction", newData, "trả về kết quả thành công!")
            return res.status(200).json(
                commonResponse(200, "Thành công!", newData, req)
            )

        } catch (e) {
            logger("updateRoleFunction", e + "", "Lỗi!", "error")
            return res.status(200).json(
                commonResponse(400, "System error: " + e, e + "", req)
            )
        }
    }

    static async createGroupRole(req, res) {
        try {
            logger("createGroupRole", req.body, "gọi API")

            const {name, level, groupRoleID} = req.body
            if(!name || level !== 0 && !groupRoleID || level > 2) {
                throw {error: "Invalid body", code: 0}
            }

            if(level === 0) {
                const group_role = await db.oneOrNone("SELECT group_name FROM group_role WHERE group_name = $1", [name])
                if(group_role) {
                    throw {error: "Tên nhóm đã tồn tại!", code: 1}
                }

                const result = await db.tx(async t => {
                    const newGroup = await t.one("INSERT INTO group_role (group_name, status, created_at, update_at) VALUES ($1, 1, $2, $2) RETURNING * ", [name, moment().format("YYYY-MM-DD hh:mm:ss")])
                    const newRoleAdmin = await t.one("INSERT INTO role (role_name, status, created_at, update_at, level, group_role_id) VALUES ($1, 1, $2, $2, 0, $3) RETURNING * ", ["Admin", moment().format("YYYY-MM-DD hh:mm:ss"), newGroup.group_role_id])
                    return t.batch([newGroup, newRoleAdmin])
                })
                
                logger("createGroupRole", result, "Tạo Group Role thành công!")
                return res.status(200).json(
                    commonResponse(200, "Tạo Group Role thành công!", result, req)
                )
            }

            if(level === 1) {
                const role0 = await db.one("SELECT role_id FROM role WHERE group_role_id = $1 AND level = 0", [groupRoleID])
                const role = await db.oneOrNone("SELECT role_name FROM role WHERE group_role_id = $1 AND level = 1", [groupRoleID])
                if(!role) {
                    const newRole= await db.one("INSERT INTO role (role_name, status, created_at, update_at, level, parent_id, group_role_id) VALUES ($1, 1, $2, $2, 1, $3, $4) RETURNING * ", [name, moment().format("YYYY-MM-DD hh:mm:ss"), role0.role_id, groupRoleID])
                    
                    logger("createGroupRole", newRole, "Tạo Role thành công!")
                    return res.status(200).json(
                        commonResponse(200, "Tạo Role thành công!", newRole, req)
                    )
                }
                throw {error: "Level 1 đã tồn tại!", code: 2}
            }
            
            if(level === 2) {
                const role1 = await db.oneOrNone("SELECT role_id FROM role WHERE group_role_id = $1 AND level = 1", [groupRoleID])
                if(!role1) {
                    throw {error: "Không thể tạo level 2 khi chưa có level 1!", code: 5}
                }

                const role = await db.oneOrNone("SELECT role_name FROM role WHERE group_role_id = $1 AND level = 2", [groupRoleID])
                if(!role) {
                    const newRole= await db.one("INSERT INTO role (role_name, status, created_at, update_at, level, parent_id, group_role_id) VALUES ($1, 1, $2, $2, 2, $3, $4) RETURNING * ", [name, moment().format("YYYY-MM-DD hh:mm:ss"), role1.role_id, groupRoleID])
                    
                    logger("createGroupRole", newRole, "Tạo Role thành công!")
                    return res.status(200).json(
                        commonResponse(200, "Tạo Role thành công!", newRole, req)
                    )
                }
                throw {error: "Level 2 đã tồn tại!", code: 3}
            }

            throw {error: "Tạo vai trò thất bại!", code: 4}
        } catch (e) {
            return res.status(200).json(
                commonResponse(400, e.error || "System error: " + e, {error: e.error || e + "", code: e.errorCode, data: e.data}, req )
            )
        }
    }

    //Tạm không dùng đến, có thể xoá bỏ sau này
    // static async createRole(req, res) {
    //     try {
    //         logger("createRole", req.body, "gọi API")

    //         const {name, groupRoleID, parentID} = req.body

    //         const group_role = await db.oneOrNone("SELECT * FROM role WHERE role_name = $1 AND parent_id = $2 LIMIT 1", [name, parentID])
    //         if(group_role) {
    //             throw name + " đã tồn tại!"
    //         }

    //         const parent = await db.oneOrNone("SELECT * FROM role WHERE role_id = $1 LIMIT 1", [parentID])

    //         if(parent && parent.group_role_id !== groupRoleID) {
    //             throw "GroupRoleID không hợp lệ!"
    //         }

    //         const newRole = await db.one("INSERT INTO role (role_name, status, group_role_id, parent_id, created_at, update_at) VALUES ($1, 1, $2, $3, $4, $4) RETURNING * ", [name, groupRoleID, parentID, moment().format("YYYY-MM-DD hh:mm:ss")])
                    
    //         return res.status(200).json(newRole)

    //     } catch (e) {
    //         return res.status(500).json({error: e.toString()})
    //     }
    // }

    static async getListGroupRole(req, res) {
        try {
            logger("getListGroupRole", req.body, "gọi API")

            const groups = await db.manyOrNone(`SELECT group_role_id, group_name
            FROM group_role`)
        
            logger("getListGroupRole", groups, "Lấy danh sách group_role")
            const group_role = await db.manyOrNone(`
                SELECT gr.group_role_id, gr.group_name, role.role_id, role.role_name, role.parent_id, role.status, role.level
                FROM group_role AS gr, role
                WHERE gr.group_role_id = role.group_role_id AND role.role_id <> 1
            `)

            //Set children cho group
            let newGroups = groups.map(group => {
                group.children = group_role.filter(role => group.group_role_id === role.group_role_id && (role.parent_id === null || role.parent_id === "null"))
                //Set children cho lv0
                group.children = group.children.map(lv0 => {
                    lv0.children = group_role.filter(role => (role.parent_id === lv0.role_id))
                    //Set children cho lv1
                    lv0.children = lv0.children.map(lv1 => {
                        lv1.children = group_role.filter(role => (role.parent_id === lv1.role_id))
                        return lv1
                    })
                    return lv0
                })
                
                return group
            })

            logger("getListGroupRole", newGroups, "api trả về")
            return res.status(200).json(
                commonResponse(200, "Success", newGroups, req)
            )
        } catch (error) {
            logger("getListGroupRole", error + "", "Lỗi", "error")
            return res.status(200).json(
                commonResponse(400, "System error" + error, error + "", req)
            )
        }
    }

    static async getListGroupFunction(req, res) {
        try {
            logger("getListGroupFunction", req.body, "gọi API")
            
            const listGroupFunction = await db.manyOrNone(`
                SELECT gr.group_function_id, gr.group_name, gr.id_view, gr.id_edit, tab.tab_function_id, tab.tab_name
                FROM group_function AS gr, tab_function AS tab
                WHERE gr.tab_function_id = tab.tab_function_id
            `)

            const data = _(listGroupFunction)
           .groupBy(x => x.tab_name)
           .map((value, key) => ({groupName: key, listFunction: value}))
           .value();

           logger("getListGroupFunction", data, "trả kết quả về")

            return res.status(200).json(
                commonResponse(200, "Thành công!", data, req)
            )
        } catch (error) {
            logger("getListGroupFunction", error + "", "Lỗi")
            return res.status(200).json(
                commonResponse(400, "System error: " + error, error + "", req)
            )
        }
    }

    static async getListLevel(req, res) {
        try {
            logger("getListLevel", req.body, "gọi API")
            
            const listLevel = await db.manyOrNone(`
                SELECT *
                FROM tbl_level
                ORDER BY code ASC
            `)

            logger("getListLevel", listLevel, "trả kết quả về")

            return res.status(200).json(
                commonResponse(200, "Thành công!", listLevel, req)
            )
        } catch (error) {
            logger("getListLevel", error + "", "Lỗi")
            return res.status(200).json(
                commonResponse(400, "Thất bại", error + "", req)
            )
        }
    }

    static async testTime(req, res) {
        try {
            console.log(moment())
            console.log(moment().format())

            const time1 = await db.one(`
                INSERT INTO testtime(created_at) VALUES($1) RETURNING *
            `, [moment().format()])
            const time2 = await db.one(`
                INSERT INTO testtime(created_at) VALUES($1) RETURNING *
            `, [moment()])
            const time3 = await db.one(`
                INSERT INTO testtime(created_at) VALUES($1) RETURNING *
            `, [moment.utc().format()])

            console.log(time1.created_at)
            console.log(time2.created_at)
            console.log(time3.created_at)
            console.log(moment.utc().format());
            console.log(moment.utc().format("YYYY/MM/DD HH:mm:ss"));

            // console.log(moment(time1.created_at))
            // console.log(moment("2021-08-01T18:00:16.000Z").format("YYYY/MM/DD HH:mm:ss"))

            // console.log(moment(time2.created_at))
            // console.log(moment("2021-08-01T11:00:16.636Z").format("YYYY/MM/DD HH:mm:ss"))


            // console.log(moment(time3.created_at))
            // console.log(moment("2021-08-01T11:00:16.679Z").format("YYYY/MM/DD HH:mm:ss"))

            return res.status(200).json({
                time1,
                time2,
                time3,
                time4: moment.utc()
            })
        } catch (error) {
            return res.status(200).json("err" + error)
        }
    }

    static async getTime(req, res) {
        try {
            const result = await db.manyOrNone(`
                SELECT * FROM testtime
            `)

            return res.status(200).json({
                result
            })
        } catch (error) {
            return res.status(200).json("err" + error)
        }
    }

    static async exportAccount3P(req, res) {
        try {
            const workbook = new ExcelJS.Workbook();
            

            //Sheet chứa toàn bộ danh sách
            const worksheet2 = workbook.addWorksheet("Account 3P");
            worksheet2.columns = [
                { header: "NO", key: "no", width: 5 },
                { header: "Tên đăng nhập", key: "dsa_request_code", width: 20},
                { header: "Mã đối tác", key: "code3p", width: 10 },
                { header: "Tài khoản", key: "updated_at", width: 20 },
                { header: "Vai trò", key: "name_user", width: 32 },
                { header: "Trạng thái", key: "birth", width: 15 }
            ];

            let count2 = 1;

            const queryListUserDSA = `
                SE
            `;

            const listUserDSA = await db.manyOrNone(queryListUserDSA);
            logger("exportRequestDSA", listUserDSA, `Lấy danh sách toàn bộ tài khoản 3P`);

            listUserDSA.forEach((user) => {
                user.no = count2;
                user.status = RequestDsaController.getStatusDsaForExcel(user.status)
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
                row.border = {
                    top: {style: "thin"},
                    bottom: {style: "thin"},
                    right: {style: "thin"},
                    left: {style: "thin"}
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
}



module.exports = RoleController;