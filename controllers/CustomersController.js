const auth = require("./AuthController")
const Request = require("../models/Request")
const Response = require("../models/Response")
const CallAxios = require("../models/CallAxios")
const config = require('../config/config')
const { db, pgp } = require('./../database/db')
const { loanResponse } = require('./../models/Response')
const Customer = require('./../models/database/Customer')
const { commonResponse } = require("../models/Response");
const { API_CODE } = require("../_helpers/constants");

class CustomersController {
    static async getCustomers(req, res, next) {
        try {
            let uiid = 0;
            if(req.headers.uiid) {
                uiid = req.headers.uiid;
            }
            res.json(loanResponse(200, "SUCCESS", await db.any("select * from customers where uiid = $1 order by timestamp desc", [uiid]))); return
        } catch (e) {
            res.json(loanResponse(200, "FAILED", e+''))
        }
    }
    static async getCustomer(req, res, next) {
        let id = req.params.id
        try {
            let data = await db.oneOrNone("select * from customers where customerid=$1", [id])
            if(data) {
                res.json(loanResponse(200, "SUCCESS", data)); return
            } else {
                throw new Error("Not found")
            }
        } catch (e) {
            res.json(loanResponse(200, "FAILED", e+''))
        }
    }


    

    static async search(req, res, next) {
        try {
           
            let uiid = 0;
            if(req.headers.uiid) {
                uiid = req.headers.uiid;
            }

            let { customer_name, identity_card_id, from_date, to_date, status } = req.body

            if(from_date) {
                from_date = from_date.split("-");
                from_date = new Date(parseInt(from_date[2], 10), parseInt(from_date[1], 10) - 1 , parseInt(from_date[0]), 10).getTime();
                console.log(from_date);
            }

            if(to_date) {
                to_date = to_date.split("-");
                to_date = new Date(parseInt(to_date[2], 10), parseInt(to_date[1], 10) - 1 , parseInt(to_date[0]), 10).getTime();
                console.log(to_date);
            }
          
                //console.log(newDate.getTime());
            let query = "select customers.*, loan.loanid, loan.loan_amount, loan.status from loan left join customers on loan.customerid = customers.customerid where 1=1 and uiid = " + uiid;
            if(customer_name) {
                query += " and LOWER(customer_name) like '%"+customer_name.toLowerCase()+"%'"
            }
            if(identity_card_id) {
                query += " and LOWER(identity_card_id) like '%"+identity_card_id.toLowerCase()+"%'"
            }

            if(from_date) {
                query += " and loan.timestamp >= " + from_date
            }

            if(to_date) {
                query += " and loan.timestamp <= " + to_date
            }

            if(status) {
                query += " and loan.status = '" + status + "'";
            }

            query += " order by loan.timestamp desc";
            console.log(query);
            let data = await db.manyOrNone(query)
            if (data) {
                res.json(loanResponse(200, "SUCCESS", data)); return
            } else {
                throw new Error("Not found")
            }
        } catch (e) {
            console.log(e)
            res.json(loanResponse(200, "FAILED", e + ''))
        }
    }
}

module.exports = CustomersController