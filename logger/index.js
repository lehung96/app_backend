// const {format, createLogger, transports} = require("winston")
// const path = require("path")
const moment = require('moment')
const { db } = require("../database/db")
moment.locale("vi")
// const DailyRotateFile = require('winston-daily-rotate-file');
const _ = require("lodash")

// const myFormat = format.printf(({ level, message, label, timestamp }) => {
//     const timenow = moment(timestamp).format("LLL")
//     return `[${timenow}] ${level}: \n ${label} \n ${message}`;
// });

// const logger = createLogger({
//     format: format.combine(
//         format.timestamp(),
//         myFormat
//     ),
//     transports: [
//         new DailyRotateFile({
//             filename: path.join(__dirname, 'FileLog', `%DATE%.log`),
//             datePattern: 'YYYY-MM-DD',
//             prepend: true,
//             json: false
//         })
//     ]
// })

const logTransaction = async (apiName, data, des, level, req) => {
    try {
        let server_host = null
        let time_run = null
        let create_at = moment()
        let ip_request = null
        let response_code = null
        let response = null
        let users_id = null
        let body = null
        try {
            body = JSON.stringify(data)
        } catch (err) {
            body = "Không thể chuyển đối tượng thành JSON"
            console.log(err);
        }
        let message = null

        if(!_.isEmpty(req)) {
            if(des === "Response") {
                time_run = new Date().getTime() - req.timestamp
                response_code = req.code
                message = req.message
                response = body
                try {
                    body = JSON.stringify(req.body)
                } catch (err1) {
                    body = "Không thể chuyển đối tượng thành JSON"
                    console.log(err1);
                }
            }

            server_host = req.headers.host
            ip_request = req.headers['x-forwarded-for']
            if(req.user) {
                users_id = req.user.users_id
            }

            db.none(`
                INSERT INTO log_transaction(users_id, api_name, ip_request, body, des, create_at, time_run, server_host, response_code, response, message)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [users_id, apiName, ip_request, body, des, create_at, time_run, server_host, response_code, response, message]
            )
        } else {
            db.none(`
                INSERT INTO log_transaction(users_id, api_name, ip_request, body, des, create_at, time_run, server_host, response_code, response, message)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [users_id, apiName, ip_request, body, des, create_at, time_run, server_host, response_code,response, message]
            )
        }
    } catch (error) {
        console.log("Hàm logTransaction dòng 80: \n", error + "")
    }
}

module.exports = async function(apiName, data, des, level = "info", req = {}) {
    try {
        await logTransaction(apiName, data, des, level, req)
    } catch (error) {
        try {
            await logTransaction(apiName, error, des, level, req)
        } catch (e) {
            console.log(e + "")
            return
        }
    }
}