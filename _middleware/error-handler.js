const { commonResponse } = require("../models/Response");

module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === "string":
            // custom application error
            const is404 = err.toLowerCase().endsWith("not found");
            const statusCode = is404 ? 404 : 400;
            return res
                .status(statusCode)
                .json(commonResponse(statusCode, err, {}, req));
        case err.name === "UnauthorizedError":
            // jwt authentication error
            return res
                .status(401)
                .json(commonResponse(401, "Unauthorized"));
        default:
            return res.status(400).json(
                commonResponse(400, err.message, {}, req)
            );
    }
}
