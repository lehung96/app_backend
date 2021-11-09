exports.product_field = (partner_code, client_id, channel, product_line) => {
    return {
        request_id: partner_code + new Date().getTime(),
        client_id: client_id,
        channel: channel,
        partner_code: partner_code,
        product_line: product_line
    }
}

exports.product_list = (partner_code, client_id, channel, product_line) => {
    return {
         request_id: partner_code + new Date().getTime(),
         client_id: client_id,
         channel: channel,
         partner_code: partner_code,
         product_line: product_line
    }
}


exports.select_offer = (request_id, partner_code, selected_offer_id, selected_offer_amount, selected_offer_insurance_type) => {
    return {
         request_id: request_id,
         partner_code: partner_code,
         selected_offer_id: selected_offer_id,
         selected_offer_amount: selected_offer_amount,
         selected_offer_insurance_type: selected_offer_insurance_type
    }
}

exports.check_eligible = (data) => {
    return {
        ...{
            request_id: partner_code + new Date().getTime(),
            channel: "",
            partner_code: "",
            dsa_agent_code: "",
            identity_card_id: "",
            date_of_birth: "",
            customer_name: "",
            issue_date: "",
            phone_number: "",
            issue_place: "",
            email: ""
        }, ...data
    }
}

// exports.get_offer = (request_id, proposal_id) => {
//     return{
//         request_id: request_id,
//         proposal_id: proposal_id
//     }
// }

exports.eligible = (partner_code, channel, dsa_agent_code, data) => {
    return {
        request_id: partner_code + new Date().getTime(),
        partner_code: partner_code,
        channel: channel,
        dsa_agent_code: dsa_agent_code,
        identity_card_id: data.identity_card_id,
        date_of_birth: data.date_of_birth,
        customer_name: data.customer_name,
        issue_date: data.issue_date,
        phone_number: data.phone_number,
        issue_place: data.issue_place,
        email: data.email,
        tem_province: data.tem_province || null,
        job_type: data.job_type || null
    }
}