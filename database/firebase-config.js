const firebaseAdmin = require("firebase-admin");

const serviceAccount = require("./dsa-mobile-app-firebase-adminsdk-vn2sa-edabf05ce5.json");

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://dsa-mobile-app-default-rtdb.firebaseio.com/",
});

module.exports = firebaseAdmin;