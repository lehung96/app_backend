module.exports = class Customer {
    constructor() {
        this.customerid = null;
        this.request_id = null;
        this.uiid = null;
        this.channel = null;
        this.partner_code = null;
        this.dsa_agent_code = null;
        this.customer_name = null;
        this.gender = null;
        this.date_of_birth = null;
        this.identity_card_id = null;
        this.issue_date = null;
        this.issue_place = null;
        this.phone_number = null;
        this.email = null;
        this.job_type = null;
        this.timestamp = Math.round(+new Date()/1000);
        this.relation_1 = null;
        this.relation_1_name = null;
        this.relation_1_phone_number = null;
        this.relation_2 = null;
        this.relation_2_name = null;
        this.relation_2_phone_number = null;
        this.img_id_card = null;
        this.img_selfie = null;
        this.pe_code = null;
    }
};