const axios = require('axios');
const rootCas = require('ssl-root-cas').create();
const path = require('path');
const https = require('https');

//const Product = require('../controllers/ProductController');


// rootCas.addFile(path.resolve(__dirname, '../intermediate.pem'));



const CallAxios = async ( url, token, data = {}, method = "POST" , headerExtra) => {

    try {
        let result = null;
        let status = null;
        let headers = {
            Accept: "application/json",
            "Accept-Language": "en_US",
            "content-type": "application/json",
            Authorization: token
        };
        if(headerExtra){
            headers = {...headers, ...headerExtra}
        }
        const httpsAgent = new https.Agent({rejectUnauthorized: false, ca: rootCas});
        await axios({
            url: url,
            method: method,
            headers: headers,
            data: data,
            httpsAgent: httpsAgent

        }).then((response) => {
            result = response.data
            status = response.status
        });
        return {
            status_code: status,
            body: result
        };
    } catch (error) {
        console.log(error); 
        if(url == 'https://10.0.9.4:8095/api/loanRequestServices/v1/dsa/send-loan-application') {
            const Product = require('../controllers/ProductController');
            await Product.writeLogResponse(data, error.response.data.body.message);
            //console.log(error.response.data.body.message);
            //console.log(error); 
        }
        return {
            status_code: 400,
            body: error.response.data
        };
    }
}

module.exports = CallAxios;