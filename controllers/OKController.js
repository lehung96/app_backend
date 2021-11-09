const { db, pgp } = require('./../database/db')
const { loanResponse } = require('./../models/Response')

class OKController {
    static async byeData(req, res, next) {
        try {
            await db.none("TRUNCATE customers, loan, address, doc_collecting_list CASCADE")
            res.json(loanResponse(200, "SUCCEED", "OK"))
        } catch (error) {
            res.json(loanResponse(200, "FAILED", error+''))
        }
    }
}

module.exports = OKController
