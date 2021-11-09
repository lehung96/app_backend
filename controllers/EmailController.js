const { commonResponse } = require("../models/Response");
const mailer = require("../_helpers/mailer");
const { API_CODE } = require("../_helpers/constants");

class EmailController {
    
    static async sendMail(req, res) {
        try {
            // Lấy data truyền lên từ form phía client
            const { to, subject, body } = req.body;

            // Thực hiện gửi email
            await mailer.sendMail(to, subject, body);

            // Quá trình gửi email thành công thì gửi về thông báo success cho người dùng
            res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS));
        } catch (err) {
            // Nếu có lỗi thì log ra để kiểm tra và cũng gửi về client
            console.log(err);
            res.json(commonResponse(API_CODE.ERROR, err + ""));
            
        }
    }
}

module.exports = EmailController;
