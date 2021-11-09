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

let list = require("../utils/checking/Province").Province.list

class AddressController {
    // static async setDatabase2(req, res) {
    //     try {
    //         console.log(1)
    //         // console.log(list);
    //         // list = JSON.stringify(list)
    //         // console.log(list)
    //         // list = JSON.parse(list)
    //         // console.log(2)

    //         const province = _(list)
    //         .groupBy(x => x.DISTRICT_CODE)
    //         .map((value, key) => ({district_code: key, district_name: value[0].district_name, province_code: value[0].PROVINCE_CODE}))
    //         .value();

    //         console.log(province.length)
    //         let query = ""

    //         for(let item of province) {
    //             let district_name = item.district_name.replace(/'/g, "''")
    //             query += `INSERT INTO district(district_code, district_name, province_code) VALUES('${item.district_code}', '${district_name}', '${item.province_code}');`
    //         }

    //         // console.log(query)
    //         const newData = await db.tx( async t => {
    //             const result2 = await db.none(query)

    //             return t.batch([result2])
    //         })
            
    //         return res.status(200).json(newData)
    //     } catch (e) {
    //         console.log(e)
    //         return res.status(500).json({error: e + "", code: "lỗi rồi!"})
    //     }
    // }
    // static async setDatabase(req, res) {
    //     try {
    //         // const province = _(list)
    //         // .groupBy(x => x.DISTRICT_CODE)
    //         // .map((value, key) => ({district_code: key, district_name: value[0].district_name, province_code: value[0].PROVINCE_CODE}))
    //         // .value();

    //         console.log(list.length)
    //         let query = ""

    //         for(let item of list) {
    //             let ward_name = item.WARD_NAME.replace(/'/g, "''")
    //             query += `INSERT INTO ward(ward_code, ward_name, district_code) VALUES('${item.WARD_CODE}', '${ward_name}', '${item.DISTRICT_CODE}'); `
    //         }

    //         // console.log(query)
    //         const newData = await db.tx( async t => {
    //             const result2 = await db.none(query)

    //             return t.batch([result2])
    //         })
            
    //         return res.status(200).json(newData)
    //     } catch (e) {
    //         console.log(e)
    //         return res.status(500).json({error: e + "", code: "lỗi rồi má ơi!"})
    //     }
    // }

    static async getProvince(req, res) {
        try {
            logger("getProvince", req.body, "Gọi API")

            const newData = await db.manyOrNone(`SELECT * FROM province`)
            
            logger("getProvince", newData, "Trả về danh sách tỉnh thành phố")
            return res.status(200).json(
                commonResponse(200, "Thành công!", newData, req)
            )
        } catch (e) {
            logger("getProvince", e + "", "Lỗi hệ thống", "error")
            return res.status(400).json(
                commonResponse(400, "Thất bại!", e + "", req)
            )
        }
    }

    static async getDistrict(req, res) {
        try {
            logger("getDistrict", req.body, "Gọi API")
            const {province_code} = req.body

            const newData = await db.manyOrNone(`SELECT * FROM district WHERE province_code = $1`, [province_code])
            
            logger("getDistrict", newData, "Trả về danh sách quận huyện của tỉnh, thành phố")
            return res.status(200).json(
                commonResponse(200, "Thành công!", newData, req)
            )
        } catch (e) {
            logger("getDistrict", e + "", "Lỗi hệ thống", "error")
            return res.status(400).json(
                commonResponse(400, "Thất bại!", e + "", req)
            )
        }
    }

    static async getWard(req, res) {
        try {
            const {district_code} = req.body

            const newData = await db.manyOrNone(`SELECT * FROM ward WHERE district_code = $1`, [district_code])
            
            return res.status(200).json(
                commonResponse(200, "Thành công!", newData, req)
            )
        } catch (e) {
            logger("getWard", e + "", "Lỗi hệ thống", "error")
            return res.status(400).json(
                commonResponse(400, "Thất bại!", e + "", req)
            )
        }
    }
}

module.exports = AddressController;