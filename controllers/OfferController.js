const auth = require("./AuthController");
const config = require('../config/config');
const CallAxios = require('../models/CallAxios');
const Response = require('../models/Response');
const Request = require("../models/Request");
const { db, pgp } = require('./../database/db')
const Loan = require('./../models/database/Loan')

const HandleErrorController = require('../controllers/HandleErrorController');

class OfferController {

    static async getOffer(req, res, next) {
        try {
            const tokenObj = await auth.getToken();
            const access_token = tokenObj.body.access_token
            const token_type = tokenObj.body.token_type
            const token = token_type + " " + access_token
            // const token = req.headers.authorization
            // const request_id = "SPO1610519893062"
            // const partner_code = "SPO"
            //const partner_code = "SPO";//req.headers.partner_code
            //const request_id = "SPO1610519893062";//req.headers.partner_code + new Date().getTime()

            let params = req.body
            const partner_code = params.partner_code ? params.partner_code : "";
            const request_id = params.request_id ? params.request_id : "";


            const result = await CallAxios(config.GET_OFFER + `?request_id=${request_id}&partner_code=${partner_code}`, token, {}, "GET")
            console.log(result);
            res.json(Response.get_offer(200, result.body))
        } catch (error) {
            res.json(Response.error(400, error + ''))
        }
    }


    static async selectOffer(req, res, next) {
        try {
            const tokenObj = await auth.getToken();
            const access_token = tokenObj.body.access_token
            const token_type = tokenObj.body.token_type
            const token = token_type + " " + access_token
            let uiid = 0

            if(req.headers.uiid) {
                uiid = req.headers.uiid;
            } 


            //valid param
            let params = req.body
            let mandatoryParameters = ["request_id", "partner_code", "selected_offer_id", "selected_offer_amount", "insurance_type"]
            for (let prop of mandatoryParameters) {
                if (!params.hasOwnProperty(prop)) {
                    res.json(Response.get_offer(200, { code: "2", message: "Wrong/invalid params" }))
                    return
                }
            }
            let customer = await db.oneOrNone("select * from customers where request_id=\'" + params.request_id + "\'")
            if (!customer) {
                res.json(Response.updateStatus(200, { code: "3", message: "Request id does not Exist" }))
                return
            }

            const insurance_type = params.insurance_type ? params.insurance_type : "NONE";
            const modelReq = Request.select_offer(params.request_id, params.partner_code, params.selected_offer_id, params.selected_offer_amount, insurance_type);
            const result = await CallAxios(config.SELECT_OFFER, token, modelReq, "POST", { uiid: uiid, token: token.replace(new RegExp('Bearer ', "ig"), '') })

            console.log(result);
            if(result && result.status_code == 200) {
                let loan = await db.oneOrNone("select * from loan where customerid=$1", [customer.customerid]);
                if (loan) {
                    let loanUpdate = new Loan()
                    let loanObj = {}
                    for (let prop in params) {
                        if (loanUpdate.hasOwnProperty(prop)) {
                            loanObj[prop] = params[prop]
                        }
                    }
                    //loanUpdate['proposal_id'] = result.body.data.proposal_id
                    loanObj['status'] = 'PROGRESS'
                    return await db.none(pgp.helpers.update(loanObj, null, 'loan') + ' WHERE loanid =' + loan.loanid).then(() => {
                        res.json(Response.get_offer(200, {
                            code: "SUCCESS",
                            message: ""
                        }))
                    })
                }
            } else {
                res.json(Response.get_offer(200, {
                    code: "FAIL",
                    message: result.body.message
                }));
            }
        } catch (error) {
            console.log(error);
            res.json(Response.get_offer(200, {
                code: "FAIL",
                message: error.message
            }))
        }
    }
}

module.exports = OfferController
