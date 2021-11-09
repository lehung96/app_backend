var CronJob = require('cron').CronJob;
const {db}= require("../database/db")
const moment = require("moment")

const deleteDatabase = () => {
    try {
        let date = moment().utc().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss")
        db.none(`
            DELETE FROM log_transaction WHERE create_at < $1
        `, date)
        .then(data => {
            console.log("Xoá log của 7 ngày trước !");
        })
    } catch (error) {
        console.log("Hàm deleteDatabase dòng 17 \n", error + "");
    }
}

var job = new CronJob('00 00 04 * * 0-6', 
  /*
   *Chạy job lúc 4h sáng mỗi ngày theo giờ Việt Nam 
   */
    deleteDatabase,
    null,
    true, /* Start the job right now */
    "Asia/Ho_Chi_Minh" /* Time zone of this job. */
);