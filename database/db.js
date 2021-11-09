const pgp = require('pg-promise')({
    connect(client, dc, useCount) {
        const cp = client.connectionParameters;
        // console.log('Connected to database:', cp.database);
    },
    disconnect(client, dc) {
        const cp = client.connectionParameters;
        // console.log('Disconnecting from database:', cp.database);
    }
})
const db = pgp({
    // host: "198.58.97.135",
    // port: 5432,
    // user: "postgres",
    // password: "asd",
    // database: "ec",
    // host: "localhost",
    // port: 5432,
    // user: "postgres",
    // password: "asd",
    // database: "ec",
    host: "db-postgres-dev-cls-master.cdpeb1g0buju.ap-southeast-1.rds.amazonaws.com",
    port: 5432,
    user: "dsa_mobile_app",
    password: "evnfc#dsa$1357",
    database: "dsa_mobile_app",
})

exports.db = db
exports.pgp = pgp