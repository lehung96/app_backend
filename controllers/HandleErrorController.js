class HandleErrorController {

    static async checkRequire(paramCheck) {

        try {

            let message = null;

            for (const [key, value] of Object.entries(paramCheck)) {

                if (value == null || value == undefined || value.length == 0) {

                    message = { "message": `${key} is required fields` };
                    return {
                        status: false,
                        body: message
                    }

                }

            }

            return {
                status: true,
                body: paramCheck
            }

        } catch (e) {
            return {
                status: false,
                body: e
            }
        }
    }

    static async checkLength(paramCheck, min, max) {
        try {

            let message = null;

            if (paramCheck == null || paramCheck == undefined) {

                message = { "data": null, "resultCode": 0, "message": `${paramCheck} is required fields` };
                return {
                    status: false,
                    body: message
                }
            } else {
                if (paramCheck.length < min || paramCheck.length > max) {

                    message = { "data": null, "resultCode": 0, "message": `${paramCheck} aa has a length between ${min} and ${max}` };
                    return {
                        status: false,
                        body: message
                    }

                }
            }

            return {
                status: true,
                body: message
            }

        } catch (e) {
            return {
                status: false,
                body: e
            }
        }
    }

    static async removeNull(req) {

        try {

            let reqModify = {}

            for (const [key, value] of Object.entries(req)) {

                if (value !== null) {

                    reqModify[key] = value

                }

            }
            return reqModify

        } catch (e) {
            return {}
        }
    }

}

module.exports = HandleErrorController