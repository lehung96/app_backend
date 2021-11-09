const auth = require("./AuthController");
const config = require('../config/config');
const CallAxios = require('../models/CallAxios');
const Response = require('../models/Response');
const { db, pgp } = require('./../database/db')

// database entities
const Insurance = require('./../models/database/Insurance')
const Offer = require('./../models/database/Offer')
const Status = require('./../models/database/Status')
const Loan = require('./../models/database/Loan')

// set up transaction
const { TransactionMode, isolationLevel } = pgp.txMode;
const mode = new TransactionMode({
    tiLevel: isolationLevel.serializable,
    readOnly: false,
})

class StatusController {


    static async writeLogUpdateStatus(request) {
        const name =  "UPDATESTATUS_" + request.data.request_id + "_" + new Date().getTime();

        const local_path = config.LOCAL_PATH
        const srcPath = `${local_path}/${name}.txt`
        const remote_path = config.SFTP_PATH
        const remotePath = `${remote_path}/${name}.txt`
        
        const fs = require('fs');
        var jsonContent = JSON.stringify(request);
        //console.log(response);
        fs.writeFile(srcPath, jsonContent, 'utf8', function (err) {
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
                    console.log(err);
                    connection.end();
                    return;
                }
                await sftp.fastPut(srcPath, remotePath, {}, async err => {
                    console.log("Upload to sftp successful");
                    console.log(remotePath);
                    connection.end();
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

    static async updateStatus(req, res, next) {
        try {
            /*const client_id = req.headers.client_id;
            const client_secret = req.headers.client_secret;
            if(client_id == null && client_id == ''  && client_id ==undefined) {
                res.json(Response.updateStatus(200, { code: "1", message: "Wrong / invalid key" }))
                    return
            }
            if(client_secret == null && client_secret == ''  && client_secret ==undefined) {
                res.json(Response.updateStatus(200, { code: "1", message: "Wrong / invalid key" }))
                    return
            }
            if(client_id != config.CLIENT_ID || client_secret != config.CLIENT_SECRET) {
                res.json(Response.updateStatus(200, { code: "1", message: "Wrong / invalid key" }))
                    return
            }*/

            
            let params = req.body
            await StatusController.writeLogUpdateStatus(params);
            let mandatoryParameters = ["code", "message", "data"]
            let mandatoryData = ['request_id', 'partner_code']
            let vnPatt = new RegExp(/[^a-zA-Z ’àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳỵỷỹýÀÁÃẠẢĂẮẰẲẴẶÂẤẦẨẪẬÈÉẸẺẼÊỀẾỂỄỆĐÌÍĨỈỊÒÓÕỌỎÔỐỒỔỖỘƠỚỜỞỠỢÙÚŨỤỦƯỨỪỬỮỰỲỴỶỸÝ]/u)
            for (let prop of mandatoryParameters) {
                if (!params.hasOwnProperty(prop)) {
                    res.json(Response.updateStatus(200, { code: "2", message: "Wrong/invalid params" }))
                    return
                }
            }
            const data = params.data
            for (let propD of mandatoryData) {
                if (!data.hasOwnProperty(propD)) {
                    res.json(Response.updateStatus(200, { code: "2", message: "Wrong/invalid params" }))
                    return
                }
            }
            // check customer
            let customer = await db.oneOrNone("select * from customers where request_id=\'" + data['request_id'] + "\' and partner_code = " + "\'" + data['partner_code'] + "\'");
            if (!customer) {
                res.json(Response.updateStatus(200, { code: "3", message: "Lead does not Exist" }))
                return
            }
            // check status
            let loan = await db.oneOrNone("select * from loan where customerid=$1", [customer.customerid]);
            if (loan) { // if not exist then create a new one
                 // loan
                let loanUpdate = new Loan()
                let loanObj = {}
                for (let prop in data) {
                    if (loanUpdate.hasOwnProperty(prop)) {
                        if(data[prop] != null && data[prop] != '')
                            loanObj[prop] = data[prop]
                    }
                }

                

                if(config.REJECTED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("REJECTED");
                    loanObj['status'] = "REJECTED";
                }
                else if(config.VALIDATED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("VALIDATED");
                    loanObj['status'] = "VALIDATED";
                }
                else if (config.APPROVED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("APPROVED");
                    loanObj['status'] = "APPROVED";
                }
                else if (config.SIGNED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("SIGNED");
                    loanObj['status'] = "SIGNED";
                }
                else if(config.ACTIVATED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("ACTIVATED");
                    loanObj['status'] = "ACTIVATED";
                }
                else if(config.TERMINATED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("TERMINATED");
                    loanObj['status'] = "TERMINATED";
                }
                else if(config.CANCELED.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("CANCELED");
                    loanObj['status'] = "CANCELED";
                }
                else if(config.NOT_SUITABLE_OFFER.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("NOT_SUITABLE_OFFER");
                    loanObj['status'] = "NOT_SUITABLE_OFFER";
                }
                else if(config.PROGRESS.toUpperCase().split("|").indexOf(params.code.toUpperCase()) != -1) {
                    console.log("RECEIVED");
                    loanObj['status'] = "RECEIVED";
                }
           
                if(data.reject_reason != null && data.reject_reason != '')
                    loanObj['reject_reason'] = data.reject_reason
                if(data.message != null && data.message != '')
                    loanObj['message'] = params.message;
                console.log(loanObj);
                //const condition = pgp.as.format(' WHERE loanid = ' + loan.loanid, loanObj);
                return await db.none(pgp.helpers.update(loanObj, null, 'loan') + ' WHERE loanid =' + loan.loanid).then(() => {
                    res.json(Response.updateStatus(200, {
                        code: "0",
                        message: "SUCCESS"
                    }))
                    /*db.tx({ mode }, async t => {
                        // offers
                        const dataOffers = data['offer_list']
                        if (!(dataOffers && dataOffers.length)) {
                            res.json(Response.updateStatus(200, {
                                code: "6",
                                message: "No affected result"
                            }))
                            return
                        }
        
                        const offer = new Offer()
                        let offerObjs = []
                        let offer_ids = [] // for checking existed offer
                        for (let ioffer of dataOffers) {
                            offer_ids.push("\'" + ioffer['offer_id'] + "\'")
                            let offerObj = {}
                            for (let prop in offer) {
                                if (ioffer.hasOwnProperty(prop)) {
                                    offerObj[prop] = ioffer[prop]
                                }
                            }
                            offerObj['statusid'] = status.statusid
                            offerObjs.push(offerObj)
                        }
        
                        // delete existed offer
                        return t.none("delete from offer where offer_id in (" + offer_ids.join(',') + ")")
                            // add new offers
                            .then(() => t.any(pgp.helpers.insert(offerObjs, Object.keys(offerObjs[0]), 'offer') + 'RETURNING offerid')
                                .then((result) => {
                                    // add offerid
                                    for (let i in result) {
                                        offerObjs[i]['offerid'] = result[i]['offerid']
                                    }
        
                                    // insurances
                                    let insurObjs = []
                                    let insur = new Insurance()
                                    for (let i in dataOffers) {
                                        let dataInsurs = dataOffers[i]['insurance_list']
                                        if (!(dataInsurs && dataInsurs.length)) continue
        
                                        for (let iinsur of dataInsurs) {
                                            let insurObj = {}
                                            for (let prop in insur) {
                                                if (iinsur.hasOwnProperty(prop)) {
                                                    insurObj[prop] = iinsur[prop]
                                                }
                                            }
                                            insurObj['offerid'] = offerObjs[i]['offerid']
                                            insurObjs.push(insurObj)
                                        }
                                    }
                                    return t.none(pgp.helpers.insert(insurObjs, Object.keys(insurObjs[0]), 'insurance'))
                                        .then(() => {
                                            res.json(Response.updateStatus(200, {
                                                code: "0",
                                                message: "SUCCESS"
                                            }))
                                        })
                                })
                            )
                    })
                        .catch(error => {
                            console.log(error)
                            res.json(Response.error(400, error))
                        })*/
                })
            }
            
        } catch (error) {
            console.log(error);
            res.json(Response.error(400, error))
            return
        }
    }
}

module.exports = StatusController