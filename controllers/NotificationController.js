const firebaseAdmin = require("../database/firebase-config");
const { commonResponse } = require("../models/Response");
const {
    getPagingData,
    getPagination,
    getParseInt,
} = require("../_helpers/func");
const { API_CODE } = require("../_helpers/constants");
const { db } = require("../database/db");

class NotificationController {
    //Gửi thông báo đến 1 người dùng
    static async sendOneNotification(tokenDevice, data) {
        if (!tokenDevice) {
            throw "Không có Token Device";
        }
        if (!data) {
            throw "Không có data";
        }

        //Tạo transaction

        //Ghi Notification và trạng thái vào db
        try {
            // let result = {
            //     title: data.title,
            //     content: data.content,
            //     createUser: data.email,
            // };

            // const currentNotification = await db.notifications.create(result);

            // let resultNotificationUser = {
            //     userId: currentUser.id,
            //     notificationId: currentNotification.id,
            // };

            // await db.notification_users.create(resultNotificationUser);

            let message = {
                notification: {
                    title: data.title,
                    body: data.content,
                },
                token: tokenDevice,
            };

            let result = await firebaseAdmin.messaging().send(message);
            console.log(result);
            // await transaction.commit();
        } catch (error) {
            // await transaction.rollback();
            throw `${error}`;
        }
    }

    //Gửi thông báo đến nhiều người dùng
    static async sendMultiNotification(listTokenDevice, data) {
        if (!listTokenDevice) {
            throw "Không có danh sách Token Device";
        }
        if (Array.isArray(listTokenDevice)) {
            throw "listTokenDevice không phải mảng";
        }
        if (listTokenDevice.length == 0) {
            throw "listTokenDevice rỗng";
        }
        if (!data) {
            throw "Không có data";
        }

        //Tạo transaction

        //Ghi Notification và trạng thái vào db
        try {
            // let result = {
            //     title: data.title,
            //     content: data.content,
            //     createUser: data.email,
            // };

            // const currentNotification = await db.notifications.create(result);

            // let resultNotificationUser = {
            //     userId: currentUser.id,
            //     notificationId: currentNotification.id,
            // };

            // await db.notification_users.create(resultNotificationUser);

            let message = {
                notification: {
                    title: data.title,
                    body: data.content,
                },
                token: listTokenDevice,
            };

            let result = await firebaseAdmin.messaging().send(message);
            console.log(result);
            // await transaction.commit();
        } catch (error) {
            // await transaction.rollback();
            throw `${error}`;
        }
    }

    static async sendNotification(req, res) {
        const { tokenDevice, data } = req.body;
        NotificationController.sendOneNotification(tokenDevice, data);
    }

    static async getListNotification(req, res) {
        try {
            const { page, size, users_id } = req.body;

            const { limit, offset } = getPagination(page, size);

            const queryList = `
            SELECT 
                    notification.notification_id, 
                    notification.title, 
                    notification.description, 
                    notification.short_description, 
                    notification.type,
                    notification.created_at,
                    notification.updated_at
                FROM (SELECT 
                    notification.notification_id,
                    notification.title, 
                    notification.description, 
                    notification.short_description, 
                    notification.type,
                    notification.created_at,
                    notification.updated_at
                FROM notification AS notification 
                ORDER BY notification.created_at DESC LIMIT ${limit} OFFSET ${offset}) AS notification 
                LEFT OUTER JOIN ( user_notification INNER JOIN users 
                ON users.users_id = user_notification.users_id ) 
                ON notification.notification_id = user_notification.notification_id
                WHERE user_notification.users_id = ${users_id} 
                ORDER BY notification.created_at DESC
            `;

            console.log("queryList", queryList);

            const listNotifications = await db.any(queryList);

            const queryCount = `
                SELECT count(notification.notification_id) AS count 
                FROM notification AS notification 
                LEFT OUTER JOIN ( user_notification AS user_notification 
                INNER JOIN users AS users ON users.users_id = user_notification.users_id) 
                ON notification.notification_id = user_notification.notification_id
                WHERE users.users_id = ${users_id} 
            `;

            const countNotificaton = await db.one(queryCount);

            const result = getPagingData(
                listNotifications,
                getParseInt(countNotificaton.count),
                page,
                limit
            );

            res.json(
                commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result)
            );
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + ""));
        }
    }

    static async getDetailNotification(req, res) {
        try {
            const { notification_id } = req.body;

            const result = await db.oneOrNone(
                `
                SELECT 
                    notification_id, 
                    title, 
                    description, 
                    short_description, 
                    type,
                    created_at,
                    updated_at
                FROM notification WHERE notification_id=$1
                `,
                [notification_id]
            );

            res.json(
                commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result)
            );
        } catch (e) {
            res.json(commonResponse(API_CODE.ERROR, e + ""));
        }
    }
}

module.exports = NotificationController;
