module.exports = validateRequest;
const { commonResponse } = require("./../models/Response");
const {
    EXPIRED_TOKEN,
    API_CODE,
    STATUS_COMMON,
    SECRET_TOKEN,
    SECRET_TOKEN_PASS,
    URL_SERVER
  } = require("../_helpers/constants");
function validateRequest(req,res, next, schema) {
    try {
        const options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
        };
        const { error, value } = schema.validate(req.body, options);
    
        if (error) {
            return res.status(400).json(commonResponse(API_CODE.ERROR, error.message, {}, req));
        } else {
            req.body = value;
            next();
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json(
            commonResponse(400, "System Error: " + error, {}, req)
        )
    }
}
