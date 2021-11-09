const auth = require("./AuthController")
const Request = require("../models/Request")
const Response = require("../models/Response")
const CallAxios = require("../models/CallAxios")
const config = require('../config/config')
const { db, pgp } = require('./../database/db')
const { loanResponse } = require('./../models/Response')
const { Places, EmploymentType, MarriedStatus } = require('../utils/checking/Checking')
const { Province } = require('../utils/checking/Province')
const HandleDoc = require('./HandleDoc')
const fs = require("fs")
const imgToPDF = require('image-to-pdf');
const DSAcontroller = require("./DSAController");
const aws = require("aws-sdk");
const s3 = new aws.S3({
    accessKeyId: "AKIAWP6L7Q756J75TNZS",
    secretAccessKey: "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",
});
const base64ToImage = require('base64-to-image');
aws.config.update({
    region: "ap-southeast-1",
    bucketName: "ms-los-ap-southeast-1-446567516155-document",
    url: "https://ms-los-ap-southeast-1-446567516155-document.s3.ap-southeast-1.amazonaws.com",
    //template_key: 'resource/20210423/TEMPLATE-HDHM.docx'
});
const sizeOf = require('image-size');
// loan database entities
const Customer = require('./../models/database/Customer')
const Loan = require('./../models/database/Loan')

// set up transaction
const { TransactionMode, isolationLevel } = pgp.txMode;
const mode = new TransactionMode({
    tiLevel: isolationLevel.serializable,
    readOnly: false,
})

class LoanController {
    static async getCustomerLoan(req, res, next) {
        let id = req.params.id
        try {
            const data = await db.manyOrNone("select * from loan left join customers on loan.customerid = customers.customerid where customers.customerid=$1", [id])
            res.json(loanResponse(200, "SUCCESS", data)); return
        } catch (e) {
            res.json(loanResponse(200, "FAILED", e + ''))
        }
    }

    static async getLoanInfo(req, res, next) {
        try {
            res.json(loanResponse(200, "SUCCESS", await db.any("select * from loan left join customers on loan.customerid = customers.customerid"))); return
        } catch (e) {
            res.json(loanResponse(200, "FAILED", e))
        }
    }

    static async getLoan(req, res, next) {
        let id = req.params.id
        try {
            /*let uiid = 0;
            if(req.headers.uiid) {
                uiid = req.headers.uiid;
            } */
            const data = await db.oneOrNone("select * from loan left join customers on loan.customerid = customers.customerid where loanid=$1", [id]);
            if (data) {
                data.employment_type = data.product_name
                switch(data.reject_reason) {
                    case 'REJ_AGE':
                        data.reject_reason = config.REJ_AGE
                        break
                    case 'REJ_INCOME':
                        data.reject_reason = config.REJ_INCOME
                        break
                    case 'REJ_FINCAP':
                        data.reject_reason = config.REJ_FINCAP
                        break
                    case 'REJ_POLICY':
                        data.reject_reason = config.REJ_POLICY
                        break
                    case 'NOT_ELIGIBLE':
                        data.reject_reason = config.NOT_ELIGIBLE
                        break
                    case 'FAIL_EKYC':
                        data.reject_reason = config.FAIL_EKYC
                        break
                    case 'KYC_RJPOLICY':
                        data.reject_reason = config.KYC_RJPOLICY
                        break
                    case 'KYC_RJPOLICY':
                        data.reject_reason = config.KYC_RJPOLICY
                        break
                    case 'CKYC-WRI01':
                        data.reject_reason = config.CKYC_WRI01
                        break
                    case 'CKYC-WRI02':
                        data.reject_reason = config.CKYC_WRI02
                        break
                    case 'CKYC-WRI03':
                        data.reject_reason = config.CKYC_WRI03
                        break
                    case 'CKYC-WRI04':
                        data.reject_reason = config.CKYC_WRI04
                        break
                    case 'CKYC-WRI05':
                        data.reject_reason = config.CKYC_WRI05
                        break
                    case 'CKYC-MIS01':
                        data.reject_reason = config.CKYC_MIS01
                        break
                    case 'CKYC-EXP01':
                        data.reject_reason = config.CKYC_EXP01
                        break
                    case 'CKYC-WRI06':
                        data.reject_reason = config.CKYC_WRI06
                        break
                    case 'CKYC-MID01':
                        data.reject_reason = config.CKYC_MID01
                        break
                    case 'CKYC-MID02':
                        data.reject_reason = config.CKYC_MID02
                        break
                    case 'CKYC-QUD01':
                        data.reject_reason = config.CKYC_QUD01
                        break
                    case 'CKYC-QUD02':
                        data.reject_reason = config.CKYC_QUD02
                        break
                    case 'CKYC-WRD01':
                        data.reject_reason = config.CKYC_WRD01
                        break
                    case 'CKYC-WRD03':
                        data.reject_reason = config.CKYC_WRD03
                        break
                    case 'CKYC-MM001':
                        data.reject_reason = config.CKYC_MM001
                        break
                    case 'ADD-CURR01':
                        data.reject_reason = config.ADD_CURR01
                        break
                    case 'CNTT-PRIM1':
                        data.reject_reason = config.CNTT_PRIM1
                        break
                    case 'CNTT-RFTCF':
                        data.reject_reason = config.CNTT_RFTCF
                        break
                    case 'CKYC-DOI01':
                        data.reject_reason = config.CKYC_DOI01
                        break
                    case 'CKYC-IVLID':
                        data.reject_reason = config.CKYC_IVLID
                        break
                    case 'CKYC-OTDEV':
                        data.reject_reason = config.CKYC_OTDEV
                        break
                    case 'CKYC-PHONE':
                        data.reject_reason = config.CKYC_PHONE
                        break
                    case 'REJ_POLICY':
                        data.reject_reason = config.REJ_POLICY
                        break
                    case 'NOT_SUITABLE_OFFER':
                        data.reject_reason = config.NOT_SUITABLE_OFFER
                        break
                    case 'DUPLICATED':
                        data.reject_reason = config.DUPLICATED
                        break
                    default:
                        data.reject_reason = ''
                  }
                res.json(loanResponse(200, "SUCCESS", data)); return
            } else {
                throw new Error("Not found")
            }
        } catch (e) {
            res.json(loanResponse(200, "FAILED", e + ''))
        }
    }

    static async getLoanDocs(req, res, next) {
        try {
            const id = req.params.id
            const data = await db.any("select * from doc_collecting_list where \"loanId\"=$1", [id])
            if (data.length) {
                res.json(loanResponse(200, "SUCCESS", data)); return
            } else {
                throw new Error("Not found")
            }
        } catch (e) {
            res.json(loanResponse(200, "FAILED", e + ''))
        }
    }

    static async search(req, res, next) {
        try {
            const { customer_name, start, end, status } = req.body
            let query = "select * from loan left join customers on loan.customerid = customers.customerid where loan.timestamp >= " + start + " and loan.timestamp <= " + end
            if (customer_name.length) {
                query += " and LOWER(customer_name) like '%" + customer_name.toLowerCase() + "%'"
            }
            if (status.length) {
                query += " and status=\'" + status + "\'"
            }
            const data = await db.manyOrNone(query)
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

    static async updateLoanDocs(req, res, next) {
        try {
            let { id } = req.params
            let { docs } = req.body
            const loan = await db.oneOrNone('select * from loan where loanid=$1', id)
            if (!loan) {
                res.json(loanResponse(200, "FAILED", "Invalid loan id"))
                return
            }

            db.tx({ mode }, t => {
                docs = HandleDoc(loan.product_type, docs)
                let new_docs = []
                let status = loan['status']
                let missingInfo = false
                for (let doc of docs) {
                    new_docs.push({
                        file_type: doc['file_type'],
                        file_name: doc['file_name'],
                        loanId: loan['loanid'],
                    })
                    if (!doc['file_name']) {
                        missingInfo = true
                    }
                }
                if (missingInfo) {
                    status = "MISSING_INFO"
                } else {
                    status = "VALIDATED"
                }
                return t.none(pgp.helpers.insert(new_docs, Object.keys(new_docs[0]), 'doc_collecting_list'))
                    // remove old docs
                    .then(() => db.none("delete from doc_collecting_list where \"loanId\"=$1", [id]))
                    .then(() => db.none("update loan set status=$1 where loanid=$2", [status, id]))
                    .then(() => res.json(loanResponse(200, "SUCCESS", "Application is received")))

            }).catch(e => {
                res.json(loanResponse(200, "FAILED", e + '')); return
            })

        } catch (e) {
            res.json(loanResponse(200, "FAILED", "Error")); return
        }

    }

    static async receiveLoanInfo(req, res, next) {
        let params = req.body
        params.request_id = params.partner_code + new Date().getTime()
        params.channel = config.CHANNEL
        params.dsa_agent_code = params.dsa_agent_code ? params.dsa_agent_code : config.DSA_AGENT_CODE
        params.disbursement_method = params.disbursement_method.toLowerCase();
        if (params.disbursement_method == 'trans')
            params.disbursement_method = 'bank';
        if (params.bank_code == "1204027")
            params.bank_code = "204";
        params.job_type = params.profession;
        params.timestamp = new Date().getTime();
        await LoanController.writeLog(params);
        let mandatoryParameters = [
            'request_id', 'partner_code', 'customer_name', 'gender', 'date_of_birth',
            'identity_card_id', 'issue_date', 'issue_place', 'phone_number', 'employment_type',
            'product_type', 'loan_amount', 'loan_tenor', 'dsa_agent_code',
            'tem_province', 'tem_district', 'tem_ward', 'tem_address',
            'permanent_province', 'permanent_district', 'permanent_ward', 'permanent_address',
            'workplace_province', 'workplace_district', 'workplace_ward', 'workplace_address',
            'workplace_name', 'married_status', 'disbursement_method',
            'monthly_income', 'monthly_expense',
            'job_type',
            'loan_purpose',
            'relation_1', 'relation_1_name', 'relation_1_phone_number',
            'relation_2', 'relation_2_name', 'relation_2_phone_number',
            'list_doc_collecting',
            'img_id_card', 'img_selfie',
        ]
        let list_doc_collecting_mandatory_properties = ['file_type', 'file_name']
        let vnPatt = new RegExp(/[^a-zA-Z ’àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳỵỷỹýÀÁÃẠẢĂẮẰẲẴẶÂẤẦẨẪẬÈÉẸẺẼÊỀẾỂỄỆĐÌÍĨỈỊÒÓÕỌỎÔỐỒỔỖỘƠỚỜỞỠỢÙÚŨỤỦƯỨỪỬỮỰỲỴỶỸÝ]/u)

        // check mandatory parameters
        for (let prop of mandatoryParameters) {
            if (!params.hasOwnProperty(prop)) {
                res.json(loanResponse(200, prop, "Missing"))
                return
            }
        }
        // request_id
        let data = await db.any('select * from customers where request_id = $1', [params['request_id']])
        if (data.length) {
            res.json(loanResponse(200, "request_id", "Duplicated")); return
        }
        // partner_code
        //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        // if (!(params['request_id'].indexOf(params['partner_code']) == 0)) {
        //if (!(params['request_id'].indexOf(params['partner_code']) == -1)) {
        //   res.json(loanResponse(200, "partner_code", "Invalid")); return
        //}
        // customer_name
        if (vnPatt.test(params['customer_name'].normalize('NFC'))) {
            res.json(loanResponse(200, "customer_name", "Tên không phù hợp")); return
        }
        if ((new RegExp("( {2,})|\'")).test(params['customer_name'])) {
            res.json(loanResponse(200, "customer_name", "Tên không được chứa nhiều dấu cách liên tiếp hoặc ký tự (’)")); return
        }
        if ([0, params['customer_name'].length - 1].includes(params['customer_name'].indexOf('’'))) {
            res.json(loanResponse(200, "customer_name", "Tên không được chứa ký tự (’) ở cuối hoặc đầu")); return
        }
        // phone_number
        let patt = new RegExp(/^0\d{9,10}$/)
        if (!patt.test(params['phone_number'])) {
            res.json(loanResponse(200, "phone_number", "Số điện thoại không đùng định dạng'")); return
        }
        // date_of_birth
        if (!LoanController.isValidDate(params['date_of_birth'])) {
            res.json(loanResponse(200, "date_of_birth", "Ngày sinh phải đúng định dạng 'dd-MM-yyyy'")); return
        }
        let parts = params['date_of_birth'].split('-');
        // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
        // January - 0, February - 1, etc.
        let date = (new Date(parts[2], parts[1] - 1, parts[0])).getTime();
        let now = new Date().getTime();
        let sub = now - date;
        let years20 = 631_138_519_000
        let years54 = 1_704_074_000_000
        /*if (!(sub >= years20 && sub <= years54)) {
            res.json(loanResponse(200, "date_of_birth", "Tuổi phải nằm trong khoảng 20 đến 54 tuổi so với hiện tại")); return
        }*/
        // identity_card_id
        if (!/^(\d{9}|\d{12})$/.test(params['identity_card_id'])) {
            res.json(loanResponse(200, "identity_card_id", "Thông tin CMND/CCCD phải thừ 9 đến 12 số")); return
        }
        // issue_date
        if (!LoanController.isValidDate(params['issue_date'])) {
            res.json(loanResponse(200, "issue_date", "Ngày cấp không đúng định dạng 'dd-MM-yyyy'")); return
        }
        parts = params['issue_date'].split('-');
        // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
        // January - 0, February - 1, etc.
        date = new Date(parts[2], parts[1] - 1, parts[0])
        let year = date.getFullYear()
        now = new Date()
        let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        if (year < 1900 || date > yesterday) {
            res.json(loanResponse(200, "issue_date", "Năm cấp phải trong khoảng từ năm 1900 và hôm qua")); return
        }
        let years15 = 473_353_890_000
        sub = now.getTime() - date.getTime()
        if (sub > years15) {
            res.json(loanResponse(200, "issue_date", "Ngày cấp phải tối đa 15 năm so với hiện tại")); return
        }
        let date_of_birth_parts = params['date_of_birth'].split('-');
        let date_of_birth = new Date(date_of_birth_parts[2], date_of_birth_parts[1] - 1, date_of_birth_parts[0])
        if (date_of_birth > date) {
            res.json(loanResponse(200, "issue_date", "Ngày cấp phải sau ngày sinh")); return
        }
        // issue_place
        if (!Places.getPlace(params['issue_place'], Places.list)) {
            res.json(loanResponse(200, "issue_place", "Ngày cấp không hợp lệ")); return
        }
        // email
        if (params.hasOwnProperty('email') && params['email'])
            if (!LoanController.validateEmail(params['email'])) {
                res.json(loanResponse(200, "email", "Email không hợp lệ")); return
            }
        // employment_type
        if (!EmploymentType.hasOwnProperty(params['employment_type'])) {
            res.json(loanResponse(200, "employment_type", "Nghề nghiệp không hợp lệ")); return
        }
        // note: handle for employment_type error: invalid for product_type
        // note: handle for product_type
        // note: handle for loan_amount
        // note: handle for loan_tenor
        // img_selfie
        patt = new RegExp(/^PIC_(\d{9}|\d{12})_0\d{9,10}_\w+\.jpg$/)
        //if (!patt.test(params['img_selfie'])) {
        // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        if (patt.test(params['img_selfie'])) {
            res.json(loanResponse(200, "img_selfie", "Must be in pattern '^PIC_(\d{9}|\d{12})_0\d{9,10}_\w+\.jpg$', as 'PIC_[identity_card_id]_[phone_number]_[partner_code][timestamp(epoch milli)].jpg'")); return
        }

        patt = new RegExp(/^PID_(\d{9}|\d{12})_0\d{9,10}_\w+\.jpg$/)

        if (!Province.getProvince(params['tem_province'], Province.list)) {
            res.json(loanResponse(200, "tem_province", "Thông tin huyện không hợp lệ")); return
        }
        // tem_district
        if (!Province.getDistrict(params['tem_district'], Province.list)) {
            res.json(loanResponse(200, "tem_district", "Thông tin quận không hợp lệ")); return
        }
        // tem_ward
        if (!Province.getWard(params['tem_ward'], Province.list)) {
            res.json(loanResponse(200, "tem_ward", "Thông tin phường xã không hợp lệ")); return
        }
        // permanent_province
        if (!Province.getProvince(params['permanent_province'], Province.list)) {
            res.json(loanResponse(200, "permanent_province", "Thông tin huyện không hợp lệ")); return
        }
        // permanent_district
        if (!Province.getDistrict(params['permanent_district'], Province.list)) {
            res.json(loanResponse(200, "permanent_district", "Thông tin quận không hợp lệ")); return
        }
        // permanent_ward
        if (!Province.getWard(params['permanent_ward'], Province.list)) {
            res.json(loanResponse(200, "permanent_ward", "Thông tin phường xã không hợp lệ")); return
        }
        // // permanent_address
        // if(!Province.getAddress(params['permanent_address'], Province.list)) {
        //     res.json(loanResponse(200, "permanent_address", "Does not exist")); return
        // }
        // note: handle for profession
        // married_status
        if (!MarriedStatus.getMarriedStatus(params['married_status'], MarriedStatus.list)) {
            res.json(loanResponse(200, "married_status", "Tình trạng hôn nhân không hợp lệ")); return
        }
        // loan_purpose
        if (!MarriedStatus.getMarriedStatus(params['loan_purpose'], MarriedStatus.list)) {
            res.json(loanResponse(200, "loan_purpose", "Mục đích vay không hợp lệ")); return
        }
        // note: handle for other_contact
        // relation_1
        if (!MarriedStatus.getMarriedStatus(params['relation_1'], MarriedStatus.list)) {
            res.json(loanResponse(200, "relation_1", "Thông tin mối quan hệ 1 không hợp lệ")); return
        }
        // relation_1_name
        if (vnPatt.test(params['relation_1_name'].normalize('NFC'))) {
            res.json(loanResponse(200, "relation_1_name", "Tên của người thân 1 không hợp lệ")); return
        }
        if ((new RegExp("( {2,})|\'")).test(params['relation_1_name'])) {
            res.json(loanResponse(200, "relation_1_name", "Tên của người thân 1 không hợp lệ")); return
        }
        if ([0, params['relation_1_name'].length - 1].includes(params['relation_1_name'].indexOf('’'))) {
            res.json(loanResponse(200, "relation_1_name", "Tên của người thân 1 không hợp lệ")); return
        }
        // relation_1_phone_number
        if (!/^0\d{9,10}$/.test(params['relation_1_phone_number'])) {
            res.json(loanResponse(200, "relation_1_phone_number", "Số điện thoại của người thân 1 không hợp lệ")); return
        }
        // relation_2
        if (!MarriedStatus.getMarriedStatus(params['relation_2'], MarriedStatus.list)) {
            res.json(loanResponse(200, "relation_2", "Thông tin mối quan hệ 2 không hợp lệ")); return
        }
        // relation_2_name
        if (vnPatt.test(params['relation_2_name'].normalize('NFC'))) {
            res.json(loanResponse(200, "relation_2_name", "Tên của người thân 2 không hợp lệ")); return
        }
        if ((new RegExp("( {2,})|\'")).test(params['relation_2_name'])) {
            res.json(loanResponse(200, "relation_2_name", "Tên của người thân 2 không hợp lệ")); return
        }
        if ([0, params['relation_2_name'].length - 1].includes(params['relation_2_name'].indexOf('’'))) {
            res.json(loanResponse(200, "relation_2_name", "Tên của người thân 2 không hợp lệ")); return
        }
        // relation_2_phone_number
        if (!/^0\d{9,10}$/.test(params['relation_2_phone_number'])) {
            res.json(loanResponse(200, "relation_2_phone_number", "Số điện thoại của người thân 2 không hợp lệ")); return
        }


        const img_id_card_num = params.img_id_card.file_name.length;
        const img_selfie_num = params.img_selfie.file_name.length;
        for (const item of params.list_doc_collecting) {
            if(img_id_card_num < 1) {
                if(item.file_type.toString().toUpperCase() == 'SPID' && item.file_name.length > 0)
                    params.img_id_card.file_name = item.file_name;
                else if(item.file_type.toString().toUpperCase() == 'SNID' && item.file_name.length > 0)
                    params.img_id_card.file_name = item.file_name;
            }
            if(img_selfie_num < 1) {
                if(item.file_type.toString().toUpperCase() == 'SPIC' && item.file_name.length > 0)
                    params.img_selfie.file_name = item.file_name;
            }
        }

        let file_types = [];
        for (const item of params.productSelected.document_collecting) {
            for (const it of item.doc_list) {
                file_types.push(it.doc_type.toString().toUpperCase());
            }
        }
        let product_name = '';
        if (params.productSelected.product_description)
            product_name = params.productSelected.product_description;
        let docs = []
        for (const item of params.list_doc_collecting) {
            if (item.file_name.length > 0 && file_types.includes(item.file_type.toString().toUpperCase())) {
                await LoanController.uploadLoanDoc(item, params)
                let doc = {
                    file_name: item.file_type + "_" + params.identity_card_id + "_" + params.phone_number + "_" + params.partner_code + params.timestamp + ".pdf",
                    file_type: item.file_type
                }
                docs.push(doc)
            }
        }


        await LoanController.uploadLoanDoc(params.img_id_card, params)
        await LoanController.uploadLoanDoc(params.img_selfie, params)
        params.list_doc_collecting = [...docs]
        params.img_id_card = params.img_id_card.file_type + "_" + params.identity_card_id + "_" + params.phone_number + "_" + params.partner_code + params.timestamp + ".pdf"
        params.img_selfie = params.img_selfie.file_type + "_" + params.identity_card_id + "_" + params.phone_number + "_" + params.partner_code + params.timestamp + ".pdf"

        //console.log(params);

        // init params for api before list_doc_collecting change
        let paramsApi = { ...params };
        // STATE
        // list_doc_collecting
        params['status'] = "PROGRESS"
        let list_doc_collecting = HandleDoc(params['product_type'], params['list_doc_collecting'])
        if (list_doc_collecting instanceof Error) {
            res.json(loanResponse(200, "list_doc_collecting", "Invalid parameters")); return
        }


        const tokenObj = await auth.getToken();
        const access_token = tokenObj.body.access_token
        const token_type = tokenObj.body.token_type
        const token = token_type + " " + access_token

        paramsApi.doc_collecting_list = [...paramsApi.list_doc_collecting]
        delete paramsApi.list_doc_collecting
        delete paramsApi.status
        let uiid = 0;
        await LoanController.sleep(5000);
        let result = await CallAxios(config.SEND_LOAN, token, paramsApi, "POST", { uiid: uiid, token: token.replace(new RegExp('Bearer ', "ig"), '') })

        console.log(result);

        if (result && result.status_code == 200) {

            db.tx({ mode }, async t => {
                // customer
                let customer = new Customer()
                let customerObj = {}
                for (let prop in params) {
                    if (customer.hasOwnProperty(prop)) {
                        customer[prop] = params[prop]
                        customerObj[prop] = params[prop]
                    }
                }
                if (req.headers.uiid) {
                    customerObj['uiid'] = req.headers.uiid;
                }

                // excute query
                const resultCustomers = await t.one(pgp.helpers.insert(customerObj, null, 'customers') + 'RETURNING customerid')


                let batch_queries = []
                // temp_address
                let temp_address = {
                    province: params['tem_province'],
                    district: params['tem_district'],
                    ward: params['tem_ward'],
                    address: params['tem_address'],
                    customerId: resultCustomers['customerid'],
                    field_type: 'tem',
                }
                batch_queries.push(t.one(pgp.helpers.insert(temp_address, null, 'address') + 'RETURNING "customerId"'))
                // permanent_address
                let permanent_address = {
                    province: params['permanent_province'],
                    district: params['permanent_district'],
                    ward: params['permanent_ward'],
                    address: params['permanent_address'],
                    customerId: resultCustomers['customerid'],
                    field_type: 'permanent',
                }
                batch_queries.push(t.one(pgp.helpers.insert(permanent_address, null, 'address') + 'RETURNING addressid'))
                // workplace_address
                let workplace_address = {
                    province: params['workplace_province'],
                    district: params['workplace_district'],
                    ward: params['workplace_ward'],
                    address: params['workplace_address'],
                    customerId: resultCustomers['customerid'],
                    field_type: 'workplace',
                    name: params['workplace_name'],
                }
                batch_queries.push(t.one(pgp.helpers.insert(workplace_address, null, 'address') + 'RETURNING addressid'))
                // excute query
                let resultAddress = await t.batch(batch_queries)

                // loan
                let loan = new Loan()
                let loanObj = {}
                for (let prop in params) {
                    if (loan.hasOwnProperty(prop)) {
                        loan[prop] = params[prop]
                        loanObj[prop] = params[prop]
                    }
                }
                loanObj['customerid'] = resultAddress[0]['customerId']
                loanObj['address_workplace_id'] = resultAddress[2]['addressid']
                loanObj['address_permanent_id'] = resultAddress[1]['addressid']
                loanObj['monthly_income'] = Number(loanObj['monthly_income']);
                loanObj['other_income'] = Number(loanObj['other_income']);
                loanObj['monthly_expense'] = Number(loanObj['monthly_expense']);
                loanObj['product_name'] = product_name;

                console.log(loanObj);
                let resultLoan = await t.one(pgp.helpers.insert(loanObj, null, 'loan') + ' RETURNING loanid')


                let docs = []
                // list_doc_collecting
                for (let doc of params['list_doc_collecting']) {
                    //console.log(doc);
                    docs.push({
                        file_type: doc['file_type'],
                        file_name: doc['file_name'],
                        loanId: resultLoan['loanid'],
                    })
                }
                const resultDoc = await t.none(pgp.helpers.insert(docs, Object.keys(docs[0]), 'doc_collecting_list'))

                res.json(loanResponse(200, "RECEIVE", "Đăng ký khoản vay thành công"))
                return

            }).catch(error => {
                console.log(error)
                res.json(loanResponse(200, "Error", "Có lỗi xảy ra trong quá trình đăng ký khoản vay"))
            });
        }
        else {
            res.json(loanResponse(200, "Error", "Có lỗi xảy ra trong quá trình đăng ký khoản vay với EC"))
        }
    }

    static isValidDate(dateString) {
        // First check for the pattern
        if (!/^\d{2}-\d{2}-\d{4}$/.test(dateString))
            return false

        // Parse the date parts to integers
        var parts = dateString.split("-")
        var day = parseInt(parts[0], 10)
        var month = parseInt(parts[1], 10)
        var year = parseInt(parts[2], 10)

        // Check the ranges of month and year
        if (year < 1000 || year > 3000 || month == 0 || month > 12)
            return false

        var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

        // Adjust for leap years
        if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
            monthLength[1] = 29

        // Check the range of the day
        return day > 0 && day <= monthLength[month - 1]
    }

    static validateEmail(mail) {
        if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail))
            return true
        return false
    }

    static async writeLog(loan) {
        const name =  "TXT_" + loan.identity_card_id + "_" + loan.phone_number + "_" + loan.partner_code + loan.timestamp + '_' + loan.request_id
        const local_path = config.LOCAL_PATH
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
            connection.end();
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


    static async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

      static async uploadLoanDoc(data, loan) {
        const name = data.file_type + "_" + loan.identity_card_id + "_" + loan.phone_number + "_" + loan.partner_code + loan.timestamp
        const local_path = config.LOCAL_PATH
        const srcPath = `${local_path}/${name}.pdf`

        let subRemotePath = (data.file_type === "PIC" || data.file_type === "PID") ? data.file_type : ""
        const remote_path = config.SFTP_PATH 
        const remotePath = `${remote_path}/${subRemotePath}/${name}.pdf`
        let count = 0
        const PDFDocument = require('pdfkit');
        var doc = new PDFDocument({autoFirstPage: false});
        doc.pipe(fs.createWriteStream(srcPath));
        for (const ite of data.file_name) {
            var buffer = new Buffer.from(ite.slice('data:image/png;base64,'.length) || '', 'base64');
            var dimensions = sizeOf(buffer);
            doc.addPage({size: [dimensions.width, dimensions.height], margin : 5});
            doc.image(buffer, 0, 0, { align: "center", valign: "center"});
            count++
        }
        doc.end()

        //Upload file to sftp server
        const ssh2 = require("ssh2");
        var connection = new ssh2.Client();
        connection.on('ready', async () => {
            console.log("Connection with SFTP server is established");
            connection.sftp(async (err, sftp) => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                var readStream = fs.createReadStream(srcPath);
                readStream.on('error', function(err) {
                    console.log(err)
                    return;
                });
                var writeStream = sftp.createWriteStream(remotePath);
                writeStream.on('open', function() {
                    console.log("File " + writeStream.path + " uploading started");
                });

                writeStream.on('close', function () {
                        console.log("File " + writeStream.path + " uploaded successfully");
                        writeStream.end();
                        sftp.end();
                        connection.end();
                        fs.unlink(srcPath, async () => {
                            return (data.file_type === "PIC" || data.file_type === "PID")
                                ? `${name}.pdf`
                                : {
                                    "file_type": data.file_type,
                                    "file_name": `${name}.pdf`
                                }
                        })
                    }
                );
                writeStream.on('error', function(err) {
                    console.log("Error at " + writeStream.path + ", " + err);
                    return;
                });
                readStream.pipe(writeStream);

                /*await sftp.fastPut(srcPath, remotePath, {}, async err => {
                    console.log("Upload to sftp successful");
                    console.log(remotePath);
                    connection.end();
                    await fs.unlink(srcPath, async () => {
                        return (data.file_type === "PIC" || data.file_type === "PID")
                            ? `${name}.pdf`
                            : {
                                "file_type": data.file_type,
                                "file_name": `${name}.pdf`
                            }
                    })

                });*/
            });

        }).on('error', function (err) {
            connection.end();
            console.error(err);
        }).on('keyboard-interactive', function (name, descr, lang, prompts, finish) {
            var password = config.SFTP_PASSWORD;
            return finish([password]);
        }).connect({
            host: config.SFTP_SERVER,
            port: config.SFTP_PORT,
            username: config.SFTP_USER,
            tryKeyboard: true,
            compress: true
        });

    }


    static async uploadImage(data, u) {
        const name = data.file_type + "_" + u.id_card + "_" + u.phone_number + "_" + u.code3p + u.timestamp
        const local_path = './uploads'
        const srcPath = `${local_path}/${name}.pdf`
        let subRemotePath = (data.file_type === "PIC" || data.file_type === "PID") ? data.file_type : ""
        const remotePath = `/uploads/mobile/${subRemotePath}/${name}.pdf`
        let count = 0
        const fs = require("fs");
        const PDFDocument = require('pdfkit');
        var doc = new PDFDocument({ size: 'A4' });
        doc.pipe(fs.createWriteStream(srcPath));


        async function readFileFromAWS(fileName) {
            return new Promise(function (resolve, reject) {
                let params = {
                    Bucket: "ms-los-ap-southeast-1-446567516155-document",
                    Key: "dsa-mobile-app" + fileName,
                };

                s3.getObject(params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log("Read file successful ");
                        const body = Buffer.from(data.Body).toString("base64");
                        resolve(body);
                    }
                });
            });
        }
        console.log(data.file_name)
        for (const ite of data.file_name) {
            let result = await readFileFromAWS(ite)
            if (!fs.existsSync('./uploads')) {
                fs.mkdirSync('./uploads');
            }
            const folder = `./uploads/${u.code3p}_` + u.timestamp
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
            require("fs").writeFileSync(`./uploads/${u.code3p}_` + u.timestamp + '/' +ite.split('/').pop(), result, 'base64', function (err) {
                console.log(err);
            });
            if (count > 0 && count < data.file_name.length) {
                doc.addPage({
                    fit: [500, 400],
                    align: 'center',
                    valign: 'center',
                    size: 'A4'
                });
            }
            
            doc.image(`.${ite}`, {
                fit: [500, 400],
                align: 'center',
                valign: 'center'

            });

            count++

        }
        doc.end()
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
                        return (data.file_type === "PIC" || data.file_type === "PID")
                            ? `${name}.pdf`
                            : {
                                "file_type": data.file_type,
                                "file_name": `${name}.pdf`
                            }
                    })
                    

                });
                console.log("Finish upload to sftp");
            });

        }).on('error', function (err) {
            connection.end();
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
        return remotePath
    }


    static async uploadMultiImage(data, req, user) {

        const name = data.file_type + "_" + data.user.id_card + "_" + data.user.phone_number + "_" + data.req.user.code3p + data.req.timestamp
        const local_path = './uploads'
        const srcPath = `${local_path}/${name}.pdf`
        let subRemotePath = (data.file_type === "PIC" || data.file_type === "PID") ? data.file_type : ""
        const remotePath = `/uploads/mobile/${subRemotePath}/${name}.pdf`

        let count = 0
        const fs = require("fs");
        const PDFDocument = require('pdfkit');
        var doc = new PDFDocument({ size: 'A4' });
        doc.pipe(fs.createWriteStream(srcPath));
        for (const ite of data.file_name) {

            if (count > 0 && count < data.file_name.length) {
                doc.addPage({
                    fit: [500, 400],
                    align: 'center',
                    valign: 'center',
                    size: 'A4'
                });

            }
            // var buffer = new Buffer.from(ite.slice('data:image/png;base64,'.length) || '', 'base64');
            // doc.image(buffer, 0, 0, { align: "center", valign: "center"});

            doc.image(`.${ite}`, {
                fit: [500, 400],
                align: 'center',
                valign: 'center'
            });

            count++

        }
        doc.end()
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

                    // await fs.unlink(srcPath, async () => {
                    //     return (data.file_type === "PIC" || data.file_type === "PID")
                    //         ? `${name}.pdf`
                    //         : {
                    //             "file_type": data.file_type,
                    //             "file_name": `${name}.pdf`
                    //         }
                    // })



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
            tryKeyboard: true,
            readyTimeout: 500000
        });


        return remotePath
    }


    static async getPages(name, data) {
        let pages = []
        // for (const ite of data) {
        //     const base64Data = ite.replace(/^data:image\/png;base64,/, "");
        //     await fs.writeFile("./uploads/" + name + new Date().getTime() + ".png", base64Data, 'base64', function (err) { })
        //     pages.push("./uploads/" + name + new Date().getTime() + ".png")
        // }
        // return pages



        let aaa = await Promise.all(data.map(async (ite) => {
            const base64Data = ite.replace(/^data:image\/png;base64,/, "");
            await fs.writeFile("./uploads/" + name + new Date().getTime() + ".png", base64Data, 'base64', function (err) { })
            pages.push("./uploads/" + name + new Date().getTime() + ".png")
        }));

        console.log(aaa)


    }
}

module.exports = LoanController