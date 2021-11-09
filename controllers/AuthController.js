const config = require('../config/config');
const CallAxios = require('../models/CallAxios');

class AuthController {

    static async getToken() {
        try {
            return await CallAxios( config.TOKEN_URL, config.TOKEN_AUTH );
        } catch (error) {
            console.log(error);
            return null
        }
    }
}

module.exports = AuthController
