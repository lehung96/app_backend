const auth = require("./AuthController");
const Request = require("../models/Request");
const Response = require("../models/Response");
const CallAxios = require("../models/CallAxios");
const config = require('../config/config');
const HandleErrorController = require('../controllers/HandleErrorController');

class ProductController {

    static async getProductList(req, res, next) {

        try {
            //const params = req.body
            const partner_code = req.headers.partner_code
            // token
            const tokenObj = await auth.getToken();
            const access_token = tokenObj.body.access_token
            const token_type = tokenObj.body.token_type
            const token = token_type + " " + access_token
            const uiid = 1
            const modelReq = Request.product_list(partner_code, config.CLIENT_ID_PRODUCT, config.CHANNEL, config.PRODUCT_LINE);
            const result = await CallAxios(config.PRODUCT_LIST, token, modelReq, "POST", { uiid: uiid, token: token.replace(new RegExp('Bearer ', "ig"), '') })
            res.json(Response.product_list(result.status_code, result.body))
        } catch (error) {
            res.json({
                status: false,
                body: error
            })
        }
    }

    static async getProductField(req, res, next) {
        try {
            const params = req.body
            const partner_code = req.headers.partner_code

            const tokenObj = await auth.getToken();
            const access_token = tokenObj.body.access_token
            const token_type = tokenObj.body.token_type
            const token = token_type + " " + access_token

            // const uiid = req.body.uiid,
            const uiid = 1

            const product_id = req.body.product_id
            const modelReq = Request.product_field(partner_code, config.CLIENT_ID, config.CHANNEL, config.PRODUCT_LINE);
            const result = await CallAxios(config.PRODUCT_FIELD + `?product_code=${product_id}`, token, modelReq, "GET", { uiid: uiid, token: token.replace(new RegExp('Bearer ', "ig"), '') })

            res.json(Response.product_list(result.status_code, result.body))

        } catch (error) {

            res.json({
                status: false,
                body: error
            })

        }

    }

    static async writeLog(loan) {
        const name =  "ELIGIBLE_" + loan.identity_card_id + "_" + loan.phone_number + "_" + loan.partner_code + new Date().getTime();
        const local_path = config.LOCAL_PATH;
        const srcPath = `${local_path}/${name}.txt`
        const remote_path = config.SFTP_PATH
        const remotePath = `${remote_path}/${name}.txt`
        const fs = require('fs');
        var jsonContent = JSON.stringify(loan);
        console.log(jsonContent);
        
        fs.writeFile(srcPath, jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
        
            console.log("JSON file has been saved.");
        });

        const ssh2 = require("ssh2");

        var connection = new ssh2.Client();
        await connection.on('ready', async () => {
            console.log("Connected to sftp server!");
            await connection.sftp(async (err, sftp) => {
                if (err) {
                    console.log(err)
                    return;
                }
                await sftp.fastPut(srcPath, remotePath, {}, async err => {
                    console.log("Upload to sftp successful");
                    console.log(remotePath);
                    await fs.unlink(srcPath, async () => {
                    })

                });
                console.log("Finish upload to sftp");
            });
        }).on('error', function (err) {
            console.error(err);
        }).on('keyboard-interactive', function (name, descr, lang, prompts, finish) {
            var password = config.SFTP_PASSWORD;
            return finish([password]);
        }).connect({
            host: config.SFTP_SERVER,
            port: config.SFTP_PORT,
            username: config.SFTP_USER,
            tryKeyboard: true
        });
    }


    static async writeLogResponse(loan, response) {
        const name =  "RESPONSE_" + loan.identity_card_id + "_" + loan.phone_number + "_" + loan.partner_code + new Date().getTime();
        const srcPath = `/var/dsa-mobile-docs/${name}.txt`
        const remotePath = `/uploads/mobile/${name}.txt`
        const fs = require('fs');
        //var jsonContent = JSON.stringify(response);
        //console.log(response);
        fs.writeFile(srcPath, response, 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
        });

        const ssh2 = require("ssh2");

        var connection = new ssh2.Client();
        await connection.on('ready', async () => {
            console.log("Connected to sftp server!");
            await connection.sftp(async (err, sftp) => {
                if (err) {
                    console.log(err)
                    return;
                }
                await sftp.fastPut(srcPath, remotePath, {}, async err => {
                    console.log("Upload to sftp successful");
                    console.log(remotePath);
                    await fs.unlink(srcPath, async () => {
                    })

                });
                console.log("Finish upload to sftp");
            });
        }).on('error', function (err) {
            console.error(err);
        }).on('keyboard-interactive', function (name, descr, lang, prompts, finish) {
            var password = config.SFTP_PASSWORD;
            return finish([password]);
        }).connect({
            host: config.SFTP_SERVER,
            port: config.SFTP_PORT,
            username: config.SFTP_USER,
            tryKeyboard: true
        });
    }

    static async checkEligible(req, res, next) {

        try {
            const tokenObj = await auth.getToken();
            const access_token = tokenObj.body.access_token
            const token_type = tokenObj.body.token_type
            const token = token_type + " " + access_token

            const uiid = 1
            const params = req.body
            const modelReq = {
                "request_id": params.partner_code + new Date().getTime(),           
                "channel": config.CHANNEL,
                "partner_code": params.partner_code,
                "dsa_agent_code": params.dsa_agent_code ? params.dsa_agent_code : config.DSA_AGENT_CODE,
                "identity_card_id": params.identity_card_id,
                // "date_of_birth": "23-05-1996",
                "date_of_birth": params.date_of_birth,
                "customer_name": params.customer_name,
                "issue_date": params.issue_date,
                "phone_number": params.phone_number,
                "issue_place": params.issue_place,
                "email": params.email
            }
            //await ProductController.writeLog(modelReq);
            const resp = await HandleErrorController.removeNull(modelReq);

            const checkeligible = await CallAxios(config.CHECK_ELIGIBLE, token, resp, "POST", { uiid: uiid, token: token.replace(new RegExp('Bearer ', "ig"), '') })
            console.log(checkeligible)
            if (checkeligible.status_code !== 200) {
                res.json({
                    status_code: 401,
                    body: {
                        code: "NOT_ELIGIBLE",
                        message: "Application is NOT eligible.",
                        data: { request_id: resp.request_id, channel: resp.channel }
                    }
                })
            } else {
                res.json(checkeligible)
            }



        } catch (error) {

            console.log(error)

        }

    }

    static async checkProduct(product_type, listDoc) {

        try {

            console.log(product_type)
            console.log(listDoc)

        } catch (error) {

            res.json({
                status: false,
                body: error
            })

        }

    }
}

module.exports = ProductController
