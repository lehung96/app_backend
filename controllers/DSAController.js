const readXlsxFile = require("read-excel-file/node");
const _ = require('lodash');
const { db, pgp } = require('../database/db');
const moment = require('moment');
const fs = require('fs')
const { validateDSAInput } = require('../_helpers/func');
const { upload } = require('../_middleware/upload-create-user')
const multer = require('multer');
var latinize = require('latinize');
const { string } = require("yup/lib/locale");
const { length } = require("ssl-root-cas");
const path = require('path');
const { object } = require("joi");
const filePath = path.join(__dirname, './uploads');
const format = require('pg-format');
const Loan = require("../controllers/LoanController");
const duplicates = require('find-array-duplicates');
const { listReviewing, listApproved, listCancel, listReject } = require('../config/enum');
const RequestDsaController = require('./RequestDsaController');
const { STATUS_DSA, statusDsaNVKD, statusDsaRequest, RESSON_TYPE } = require('../_helpers/constants')
const yup = require('yup')
const fse = require('fs-extra');
const validator = require('validator')
const { resolve } = require("path");
const aws = require("aws-sdk");
const s3 = new aws.S3({
    accessKeyId: "AKIAWP6L7Q756J75TNZS",
    secretAccessKey: "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",
});

aws.config.update({
    region: "ap-southeast-1",
    bucketName: "ms-los-ap-southeast-1-446567516155-document",
    url: "https://ms-los-ap-southeast-1-446567516155-document.s3.ap-southeast-1.amazonaws.com",
    //template_key: 'resource/20210423/TEMPLATE-HDHM.docx'
});
const {
    getPagingData,
    getPagination,
    getParseInt,
} = require("../_helpers/func");
const {
    EXPIRED_TOKEN,
    API_CODE,
    STATUS_COMMON,
    SECRET_TOKEN,
    SECRET_TOKEN_PASS,
    URL_SERVER,
    UPDATE_STATUS_REQUEST,
    FINAL_DECISION
} = require("../_helpers/constants");
const { commonResponse } = require("./../models/Response");

const logger = require("../logger/index");
const e = require("express");

const uploadFileFromAWS = async (req, res, next) => {

    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
    }
    if (!fs.existsSync('./uploads/temporarysave')) {
        fs.mkdirSync('./uploads/temporarysave');
    }
    const folderUser = `./uploads/temporarysave/${req.user.users_id}`
    if (!fs.existsSync(folderUser)) {
        fs.mkdirSync(folderUser);
    }
    const folder = `./uploads/temporarysave/${req.user.users_id}/one`
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }


    const arrFile = []


    if (req.body.mandatorySelfieObj) {

        arrFile.push(...JSON.parse(req.body.mandatorySelfieObj))

    }
    if (req.body.optionalOthersObj) {

        arrFile.push(...JSON.parse(req.body.optionalOthersObj))
    }
    if (req.body.mandatoryIDImageObj) {

        arrFile.push(...JSON.parse(req.body.mandatoryIDImageObj))
    }
    if (req.body.mandatoryConfirmationObj) {
        arrFile.push(...JSON.parse(req.body.mandatoryConfirmationObj))
    }

    try {
        console.time('someFunction');


                Promise.all(arrFile.map(async (file) => {
                // var initializePromise = initialize(`/${file.path}`);
                // initializePromise.then(async function (result) {

                    const base64data = await readFileFromAWS(`/${file.path}`)
                    await  fs.promises.writeFile(`./${file.path}`, base64data, 'base64', function (err) {
                        console.log(err);
                    });
                    console.log(`✔ Downloaded file `);
                    // var fileStream = fs.createWriteStream(`./${file.path}`);
                    // var s3Stream = s3.getObject({ Bucket: 'ms-los-ap-southeast-1-446567516155-document', Key: "dsa-mobile-app" + `/${file.path}` }).createReadStream();

                    // // Listen for errors returned by the service
                    // s3Stream.on('error', function (err) {
                    //     // NoSuchKey: The specified key does not exist
                    //     console.error(err);
                    // });

                    // s3Stream.pipe(fileStream).on('error', function (err) {
                    //     // capture any errors that occur when writing data to the file
                    //     console.error('File Stream:', err);
                    // }).on('close', function () {
                    //     return 'done'
                    // });
                }, function (err) {
                 
                // });
            })).then(() => {
                console.log(`✨ Downloaded all `);
               return res.status(200).json(commonResponse(200, 'success', { }, req))
            })
        

  
        console.timeEnd('someFunction');

       


    } catch (error) {
        return res.status(401).json(commonResponse(401, error + "", { }, req));
    }

}


const uploadMultiFileFromAWS = async (req, res, next) => {

    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
    }
    if (!fs.existsSync('./uploads/temporarysave')) {
        fs.mkdirSync('./uploads/temporarysave');
    }
    const folderUser = `./uploads/temporarysave/${req.user.users_id}`
    if (!fs.existsSync(folderUser)) {
        fs.mkdirSync(folderUser);
    }
    const folder = `./uploads/temporarysave/${req.user.users_id}/multi`
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }


    const arrFile = []


    // if (!_.isEmpty(reqfiles)) {

    //     for (const property in req.files) {

    //         arrFile.push(...req.files[property])
    //     }
    // }
    if (req.body.excelObj) {

        arrFile.push(...JSON.parse(req.body.excelObj))

    }
    if (req.body.mandatorySelfieObj) {

        arrFile.push(...JSON.parse(req.body.mandatorySelfieObj))

    }
    if (req.body.optionalOthersObj) {

        arrFile.push(...JSON.parse(req.body.optionalOthersObj))
    }
    if (req.body.mandatoryIDImageObj) {

        arrFile.push(...JSON.parse(req.body.mandatoryIDImageObj))
    }
    if (req.body.mandatoryConfirmationObj) {
        arrFile.push(...JSON.parse(req.body.mandatoryConfirmationObj))
    }



    // if (!(!Exists(arrFile, 'mandatoryConfirmation') && !Exists(arrFile, 'optionalOthersObj') )) {
    //   if (!req.body.mandatoryConfirmationObj && !req.body.optionalOthersObj) {
    //     throw { "message": "Bảng xác nhận hoặc chứng từ khác là bắt buộc" }
    //   }

    // }

    try {
        await Promise.all(arrFile.map(async (file) => {
            const base64data = await readFileFromAWS(`/${file.path}`)
                    await  fs.promises.writeFile(`./${file.path}`, base64data, 'base64', function (err) {
                        console.log(err);
                    });
                    console.log(`✔ Downloaded file `);
            }, function (err) {

         
        })).then(() => {
            return res.status(200).json(commonResponse(200, 'success', { }, req));
        })
    } catch (error) {
        return res.status(401).json(commonResponse(401, error + "", { }, req));
    }

}


function initialize(key) {
    // Setting URL and headers for request
    const params = {
        Bucket: 'ms-los-ap-southeast-1-446567516155-document',
        Key: "dsa-mobile-app" + key,
    };
    // Return new promise 
    return new Promise(async function (resolve, reject) {
        await s3.headObject(params, function (err, resp, body) {
            if (err) {
                console.log('Not Found : ' + params.Key);
                reject(params.Key);
            } else {
                console.log('Found : ' + params.Key);
                resolve(params.Key);
            }
        })
    })
}
const creatNVKD = async (req, res) => {


    const foldercreate = `./uploads/${req.user.code3p}_` + req.timestamp
    if (!fs.existsSync(foldercreate)) {
        fs.mkdirSync(foldercreate);
    }
    try {
        const user = {
            name_user: req.body.name_user ? req.body.name_user : null,
            birth: moment(moment(req.body.birth, 'DD-MM-YYYY')).format('YYYY-MM-DD') ? moment(moment(req.body.birth, 'DD-MM-YYYY')).format('YYYY-MM-DD') : null,
            id_card: req.body.id_card ? req.body.id_card : null,
            issue_date: moment(moment(req.body.issue_date, 'DD-MM-YYYY')).format('YYYY-MM-DD') ? moment(moment(req.body.issue_date, 'DD-MM-YYYY')).format('YYYY-MM-DD') : null,
            issue_place: req.body.issue_place ? req.body.issue_place : null,
            permanent_address: req.body.permanent_address ? req.body.permanent_address : null,
            address: req.body.address ? req.body.address : null,
            phone_number: req.body.phone_number ? req.body.phone_number : null,
            position_user: req.body.position_user ? req.body.position_user : null,
            work_place: req.body.work_place ? req.body.work_place : null,
            email: req.body.email ? req.body.email : null,
            direct_report_line: req.body.direct_report_line ? req.body.direct_report_line : null,
            title_of_direct_report_line: req.body.title_of_direct_report_line ? req.body.title_of_direct_report_line : null,
            phone_of_direct_report_line: req.body.phone_of_direct_report_line ? req.body.phone_of_direct_report_line : null,
            email_of_direct_report_line: req.body.email_of_direct_report_line ? req.body.email_of_direct_report_line : null,
            contract_duration: req.body.contract_duration ? req.body.contract_duration : null,
            users_id: req.user.users_id
        };
        console.log(user);
        validateDSAInput(user)
        const nameUser = latinize(req.body.name_user).replace(/ +/g, "").toLowerCase();


        const listAcount = await db.query(`SELECT id_card FROM "users_temporary" WHERE id_card in($1) and status not in ('cancel','rejectSS','rejectDSA','rejectEkyc')`, req.body.id_card);

        if (listAcount.length) {
            throw {
                "message": `số CMND/CCCD ${listAcount.map(l => l.id_card)} đã được tạo tài khoản hoặc đang được kiểm duyệt trong hệ thống`
            }

        }


        const arrFile = []
        function Exists(array, name) {
            return array.some(function (el) {
                return el.fieldname === name;
            });
        }

        const reqfiles = JSON.parse(JSON.stringify(req.files))

        if (!_.isEmpty(reqfiles)) {

            for (const property in req.files) {

                arrFile.push(...req.files[property])
            }
        }

        if (req.body.mandatorySelfieObj) {

            arrFile.push(...JSON.parse(req.body.mandatorySelfieObj))

        }
        if (req.body.optionalOthersObj) {

            arrFile.push(...JSON.parse(req.body.optionalOthersObj))
        }
        if (req.body.mandatoryIDImageObj) {

            arrFile.push(...JSON.parse(req.body.mandatoryIDImageObj))
        }
        if (req.body.mandatoryConfirmationObj) {
            arrFile.push(...JSON.parse(req.body.mandatoryConfirmationObj))
        }
        console.log(arrFile)

        if (!Exists(arrFile, 'mandatorySelfie')) {
            if (!req.body.mandatorySelfieObj) {
                throw { "message": "ảnh chân dung là bắt buộc" }

            }

        }



        if (!Exists(arrFile, 'mandatoryIDImage')) {
            if (!req.body.mandatoryIDImageObj) {
                throw { "message": "ảnh CMMD/CCCD là bắt buộc" }

            }


        }

        // if (!(!Exists(arrFile, 'mandatoryConfirmation') && !Exists(arrFile, 'optionalOthersObj') )) {
        //   if (!req.body.mandatoryConfirmationObj && !req.body.optionalOthersObj) {
        //     throw { "message": "Bảng xác nhận hoặc chứng từ khác là bắt buộc" }
        //   }

        // }

        if (!arrFile.length) {
            throw { "message": "Không có file được tải lên" }

        }
        const arrayCheackFile = _(arrFile)

            .groupBy(x => x.fieldname)
            .map((value, key) => ({ fieldname: key, length: value.length, files: value }))
            .value();


        // async function saveFiles (arrFile) {


        //     await Promise.all(arrFile.map(async (file) => {
        //         var initializePromise = initialize(`/${file.path}`);
        //         initializePromise.then(async function (result) {


        //             const base64data = await   readFileFromAWS(`/${file.path}`)
        //             require("fs").writeFileSync(`./${file.path}`, base64data, 'base64', function (err) {
        //                 console.log(err);
        //             });

        //         }, function (err) {

        //         });
        //     }));
        //   }
        //   const save = await saveFiles(arrFile)
        // await arrFile.forEach(async e => {
        //     var initializePromise = initialize(`/${e.path}`);
        //     initializePromise.then(async function (result) {


        //         const base64data = await   readFileFromAWS(`/${e.path}`)
        //         require("fs").writeFileSync(`./${e.path}`, base64data, 'base64', function (err) {
        //             console.log(err);
        //         });

        //     }, function (err) {

        //     });

        // })

        arrayCheackFile.forEach(async e => {

            if (e.fieldname === 'mandatoryConfirmation' && e.length !== 1) {
                throw {
                    "message": "số lượng file bảng xác nhận không đúng "
                }
            }
            if (e.fieldname === 'optionalOthers' && e.length !== 1) {
                throw {
                    "message": "số lượng file chứng từ khác không đúng "
                }
            }
            if (e.fieldname === 'mandatoryIDImage' && e.length !== 2) {
                throw {
                    "message": "số lượng file ảnh chứng minh nhân dân/căn cước công dân không đúng "
                }
            }
            if (e.fieldname === 'mandatorySelfie' && e.length !== 1) {
                throw {
                    "message": "số lượng file ảnh chân dung không đúng  "
                }
            }
        })




        arrFile.forEach(async e => {

            if (!fs.existsSync(e.path)) {

                throw {
                    "message": `file ${e.originalname} không tồn tại`
                }
            }
        })

        const duplidatedFile = duplicates(arrFile, 'path').single();

        if (duplidatedFile) {
            throw { "message": `file ${duplidatedFile.originalname} bị trùng` }
        }
        // const listUserTemporary = await db.query(`SELECT users_temporary_id, id_card FROM users_temporary where status IN ('new','completed','pass','passAF') `);
        // function existsUser(array, name) {
        //   return array.some(function (el) {
        //     return el.id_card === name;
        //   });
        // }

        // if (existsUser(listUserTemporary, req.body.id_card)) {

        //   throw { "message": "user had existed" }

        // }
        function Exists(array, name) {
            return array.some(function (el) {
                return el.fieldname === name;
            });
        }
        if (!Exists(arrFile, 'mandatorySelfie')) {
            throw { "message": "ảnh CMNN/CCCD là bắt buộc" }

        }
        if (!Exists(arrFile, 'mandatoryIDImage')) {
            throw { "message": "ảnh chân dung là bắt buộc" }

        }


        // if (!Exists(arrFile, 'mandatoryConfirmation')) {
        //     throw { "message": "bảng xác nhận là bắt buộc" }

        // }
        await db.query("BEGIN");
        const dsa_request = await db.one(`INSERT INTO dsa_request ( dsa_request_code, users_id, create_at, update_at, amount_code, status,update_by_user ) VALUES( $1,$2,$3 ,$4, $5, $6,$7 ) RETURNING dsa_request_id`, ["AIS" + req.timestamp, req.user.users_id, new Date(), null, 1, statusDsaRequest.NEW, req.user.users_id]);
        user.dsa_request_id = dsa_request.dsa_request_id
        user.status = statusDsaNVKD.NEW
        user.created_at = moment(moment(new Date(req.timestamp), 'DD-MM-YYYY HH:mm:ss')).format('YYYY-MM-DD HH:mm:ss')
        user.partner_code = req.user.code3p
        user.timestamp = req.timestamp

        const query = "INSERT INTO users_temporary(${this:name}) VALUES(${this:csv}) RETURNING users_temporary_ID ";

        const users_temporary_ID = await db.one(query, user);
        const arrayObjectFiles = [];
        const arrayObjectFileDsaRequest = [];
        const arrrayFileSFTP = []
        const arrFilePID = []
        const arrFilePIC = []
        for (const file of arrFile) {
            if (file.fieldname === "mandatoryIDImage") {

                let newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${req.body.id_card}_${nameUser}_PID_BE.${file.filename.split(".").pop()}`;

                if (fs.existsSync(process.cwd() + newPath)) {
                    const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${req.body.id_card}_${nameUser}_PID_AF.${file.filename.split(".").pop()}`
                    if (!fs.existsSync(process.cwd() + newPath)) {
                        fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
                    }
                    file.path = newPath

                } else {
                    const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${req.body.id_card}_${nameUser}_PID_BE.${file.filename.split(".").pop()}`
                    if (!fs.existsSync(process.cwd() + newPath)) {
                        fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
                    }
                    file.path = newPath
                }
                const name = "PID" + "_" + req.body.id_card + "_" + req.body.phone_number + "_" + req.user.code3p + req.timestamp
                user.remote_path_pid = `/uploads/mobile/PID/${name}.pdf`
                arrayObjectFiles.push([file.path, file.fieldname, users_temporary_ID.users_temporary_id])
                arrFilePID.push(file.path)
            }
            if (file.fieldname === "mandatorySelfie") {

                const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${req.body.id_card}_${nameUser}_PIC.${file.filename.split(".").pop()}`
                if (!fs.existsSync(process.cwd() + newPath)) {
                    fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
                }
                file.path = newPath
                const name = "PIC" + "_" + req.body.id_card + "_" + req.body.phone_number + "_" + req.user.code3p + req.timestamp
                user.remote_path_pic = `/uploads/mobile/PIC/${name}.pdf`
                arrayObjectFiles.push([file.path, file.fieldname, users_temporary_ID.users_temporary_id])
                arrFilePIC.push(file.path)


            }

            if (file.fieldname === "mandatoryConfirmation" || file.fieldname === "optionalOthers") {
                arrayObjectFileDsaRequest.push([`/${file.path.replace(/\\/g, "/")}`, file.fieldname, dsa_request.dsa_request_id])

            }

        }


        // arrrayFileSFTP.push(
        //   {
        //     "file_type": "PIC",
        //     "file_name": arrFilePIC
        //   }, {

        //   "file_type": "PID",
        //   "file_name": arrFilePID

        // })
        // arrrayFileSFTP.forEach(element => Loan.uploadImage(element, req));
        await db.query(format(`INSERT into users_temporary(users_temporary_id,path_pic,path_pid) VALUES %L on CONFLICT (users_temporary_id) DO UPDATE 
        SET users_temporary_id = excluded.users_temporary_id, path_pic = excluded.path_pic,path_pid = excluded.path_pid `, [[users_temporary_ID.users_temporary_id, user.remote_path_pic.split("/").pop(), user.remote_path_pid.split("/").pop()]]), [])
        console.log(1)
        console.log(arrayObjectFileDsaRequest)
        await db.query(format('INSERT INTO file( URL, TYPE, users_temporary_ID ) VALUES %L', arrayObjectFiles), [])
            .catch(e => { throw e })
        if(arrayObjectFileDsaRequest.length !== 0 ){
            await db.query(format('INSERT INTO file_dsa_request( URL, TYPE, dsa_request_id ) VALUES %L', arrayObjectFileDsaRequest), [])
            .catch(e => { throw e })
        }

        const data = await db.query(`SELECT *,(SELECT array_to_json("array_agg"(row_to_json(file_alias))) as files FROM (SELECT * FROM file WHERE u.users_temporary_id = file.users_temporary_id ) file_alias) FROM users_temporary u where u.users_temporary_id = ${users_temporary_ID.users_temporary_id}`)
        console.log(2)
        if (data.length) {
            fs.rmdirSync(`./uploads/temporarysave/${req.user.users_id}/one`, { recursive: true });
            await emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/one`)
            await db.query(`delete from file_temporary_save where "3p_id" = ${req.user.users_id} and  is_multi is  null  `)
            await db.query(`delete from users_temporary_save where "users_id" = ${req.user.users_id}   `)
        }
        function read(file) {
            fs.readFile(`./uploads/${req.user.code3p}_${req.timestamp}/` + file, function (err, data) {
                if (err) { throw err }

                // Buffer Pattern; how to handle buffers; straw, intake/outtake analogy
                var base64data = new Buffer(data, 'binary');

                s3.putObject({
                    Bucket: 'ms-los-ap-southeast-1-446567516155-document',
                    Key: "dsa-mobile-app/" + `uploads/${req.user.code3p}_${req.timestamp}/` + file,
                    Body: base64data,
                    ACL: 'public-read'
                }, function (resp) {
                    console.log(arguments);
                    console.log('Successfully uploaded, ', file)
                })
            })
        }

        fs.readdir(`./uploads/${req.user.code3p}_${req.timestamp}`, function (err, files) {
            if (err) {
                console.log("Could not list the directory.", err)
                process.exit(1)
            }

            for (let i = 0; i < files.length; i++) {
                read(files[i])
            }

        })
        await emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/one`)
        await db.query("COMMIT");
        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        )
    } catch (e) {
        await db.query("ROLLBACK");
        // await  emptyS3Directory('ms-los-ap-southeast-1-446567516155-document',`dsa-mobile-app/uploads/${req.user.code3p}_ + ${req.timestamp}`)
        fs.rmdirSync(`./uploads/${req.user.code3p}_` + req.timestamp, { recursive: true });
        return res.json(
            commonResponse(API_CODE.ERROR, e.message, { }, req)
        );

    }

};


const saveNVKD = async (req, res) => {



    try {
        const user = {
            name_user: req.body.name_user,
            birth: req.body.birth ? moment(moment(req.body.birth, 'DD-MM-YYYY')).format('YYYY-MM-DD') : null,
            id_card: req.body.id_card ? req.body.id_card : null,
            issue_date: req.body.issue_date ? moment(moment(req.body.issue_date, 'DD-MM-YYYY')).format('YYYY-MM-DD') : null,
            issue_place: req.body.issue_place ? req.body.issue_place : null,
            phone_number: req.body.phone_number ? req.body.phone_number : null,
            position_user: req.body.position_user ? req.body.position_user : null,
            work_place: req.body.work_place ? req.body.work_place : null,
            email: req.body.email ? req.body.email : null,
            direct_report_line: req.body.direct_report_line ? req.body.direct_report_line : null,
            title_of_direct_report_line: req.body.title_of_direct_report_line ? req.body.title_of_direct_report_line : null,
            phone_of_direct_report_line: req.body.phone_of_direct_report_line ? req.body.phone_of_direct_report_line : null,
            email_of_direct_report_line: req.body.email_of_direct_report_line ? req.body.email_of_direct_report_line : null,
            contract_duration: req.body.contract_duration ? req.body.contract_duration : null,
            province_id_address: req.body.province_id_address ? req.body.province_id_address : null,
            district_id_address: req.body.district_id_address ? req.body.district_id_address : null,
            ward_id_address: req.body.ward_id_address ? req.body.ward_id_address : null,
            province_id_permanent_address: req.body.province_id_permanent_address ? req.body.province_id_permanent_address : null,
            district_id_permanent_address: req.body.district_id_permanent_address ? req.body.district_id_permanent_address : null,
            ward_id_permanent_address: req.body.ward_id_permanent_address ? req.body.ward_id_permanent_address : null,
            address: req.body.address ? req.body.address : null,
            permanent_address: req.body.permanent_address ? req.body.permanent_address : null,
        };

        const arrFile = []
        const arrObjectFileUploads = []
        const reqfiles = JSON.parse(JSON.stringify(req.files))

        if (!_.isEmpty(reqfiles)) {

            for (const property in req.files) {

                arrFile.push(...req.files[property])
            }
        }







        await db.query("BEGIN");


        if (req.body.mandatoryConfirmationObj) {
            if (req.body.mandatoryConfirmationObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.mandatoryConfirmationObj))
            }

        }
        if (req.body.optionalOthersObj) {
            if (req.body.optionalOthersObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.optionalOthersObj))
            }

        }
        if (req.body.mandatoryIDImageObj) {
            if (req.body.mandatoryIDImageObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.mandatoryIDImageObj))
            }

        }
        if (req.body.mandatorySelfieObj) {
            if (req.body.mandatorySelfieObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.mandatorySelfieObj))
            }

        }
        if (!arrFile.length && !arrObjectFileUploads.length) {
            fs.rmdirSync(`./uploads/temporarysave/${req.user.users_id}/one`, { recursive: true });
        }

        const queryFile = `select * from file_temporary_save where users_temporary_ID = ${req.user.users_id}  `;

        if (arrFile.length) {
            const duplidatedFile = duplicates(arrFile, 'path').single();
            if (duplidatedFile) {
                throw { "message": `file ${duplidatedFile.originalname} bị trùng` }

            }
        }



        const files = await db.query(queryFile);
        let results = []

        if (arrObjectFileUploads.length) {
            results = files.filter(({ fileid: id1 }) => !arrObjectFileUploads.some(({ fileid: id2 }) => id2 === id1));
        }
        if (!arrObjectFileUploads.length) {
            results = files
        }


        await db.query("BEGIN");
        const queryExist = `select * from  users_temporary_save where users_id = ${req.user.users_id}`;
        const queryExistFile = `select * from file_temporary_save where "3p_id" = ${req.user.users_id} and is_multi is null`;
        const checkUser = await db.query(queryExist);
        const checkFile = await db.query(queryExistFile);

        let result = checkFile.map(a => a.path.replace(/\\/g, "/"));

        if (results.length) {

            await db.query(`delete from file_temporary_save where path in (${results.map(results => `'${results.path}'`)})  `)
            results.forEach(r => {
                emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/one${r.originalname}`)
                fs.rmdirSync(`.${r.path}`, { recursive: true });
            })
        }

        user.partner_code = req.user.code3p
        user.users_id = req.user.users_id

        if (checkUser.length) {
            const query = `delete from users_temporary_save where users_id = ${req.user.users_id} `;
            await db.query(query);
        }

        const query = "INSERT INTO users_temporary_save(${this:name}) VALUES(${this:csv}) RETURNING * ";

        await db.one(query, user);

        const arrayObjectFiles = [];


        for (const file of arrFile) {

            if (!result.includes(`${file.path}`)) {
                arrayObjectFiles.push([file.originalname, req.user.users_id, req.user.users_id, null, file.originalname, file.fieldname, file.path.replace(/\\/g, "/")])

            }

        }



        if (arrayObjectFiles.length) {
            await db.query(format('INSERT INTO file_temporary_save( originalname, users_temporary_ID, "3p_id" ,"is_multi",filename,fieldname,path) VALUES %L ', arrayObjectFiles), [])
                .catch(e => { throw e })
        }

        const data = await db.oneOrNone(`SELECT *,(SELECT array_to_json("array_agg"(row_to_json(file_alias))) as files FROM (SELECT * FROM file_temporary_save WHERE u.users_id = file_temporary_save."3p_id" ) file_alias) FROM users_temporary_save u where u.users_id = ${req.user.users_id}`)
        const arrayCheackFile = _(data.files)
            .groupBy(x => x.type)
            .map((value, key) => ({ type: key, length: value.length, files: value }))
            .value();
        arrayCheackFile.forEach(e => {

            if (e.type === 'mandatoryConfirmation' && e.length > 1) {
                throw {
                    "message": "số lượng file bảng xác nhận không đúng "
                }
            }
            if (e.type === 'optionalOthers' && e.length > 1) {
                throw {
                    "message": "số lượng file chứng từ khác không đúng "
                }
            }
            if (e.type === 'mandatoryIDImage' && e.length > 2) {
                throw {
                    "message": "số lượng file ảnh chứng minh nhân dân/căn cước công dân không đúng "
                }
            }
            if (e.type === 'mandatorySelfie' && e.length > 1) {
                throw {
                    "message": "số lượng file ảnh chân dung không đúng  "
                }
            }
        })
        if(arrayCheackFile.length !== 0){

            function read(file) {
                fs.readFile(`./uploads/temporarysave/${req.user.users_id}/one/` + file, function (err, data) {
                    if (err) { throw err }
    
                    // Buffer Pattern; how to handle buffers; straw, intake/outtake analogy
                    var base64data = new Buffer(data, 'binary');
    
                    s3.putObject({
                        Bucket: 'ms-los-ap-southeast-1-446567516155-document',
                        Key: "dsa-mobile-app" + `/uploads/temporarysave/${req.user.users_id}/one/` + file,
                        Body: base64data,
                        ACL: 'public-read'
                    }, function (resp) {
                        console.log(arguments);
                        console.log('Successfully uploaded, ', file)
                    })
                })
            }
    
            fs.readdir(`./uploads/temporarysave/${req.user.users_id}/one/`, function (err, files) {
                if (err) {
                    console.log("Could not list the directory.", err)
                    process.exit(1)
                }
                console.log(files)
                for (let i = 0; i < files.length; i++) {
                    read(files[i])
                }
    
            })
        }
        

        await db.query("COMMIT");
        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        )
    } catch (e) {
        await db.query("ROLLBACK");
        await emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/one`)
        fs.rmdirSync(`./uploads/temporarysave/${req.user.users_id}/one`, { recursive: true });
        return res.json(
            commonResponse(API_CODE.ERROR, e.message, { }, req)
        );

    }

};

const getsaveNVKD = async (req, res) => {

    try {

        const data = await db.oneOrNone(`SELECT *,(SELECT array_to_json("array_agg"(row_to_json(file_alias))) as files FROM (SELECT * FROM file_temporary_save WHERE u.users_id = file_temporary_save."3p_id" ) file_alias) FROM users_temporary_save u where u.users_id = ${req.user.users_id}`)

        res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req))
    } catch (e) {

        return res.json(commonResponse(API_CODE.ERROR, e.message, { }, req));

    }

};


const getsaveMultiNVKD = async (req, res) => {

    try {

        const data = await db.query(`select * from file_temporary_save where "3p_id" = ${req.user.users_id} and is_multi is not null`)
        res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req))
    } catch (e) {

        return res.json(commonResponse(API_CODE.ERROR, e.message, { }, req));
    }
};


const saveMultiNVKD = async (req, res) => {

    try {

        const arrFile = []
        const arrObjectFileUploads = []


        if (!_.isEmpty(req.files)) {

            for (const property in req.files) {
                arrFile.push(...req.files[property])
            }
        }
        console.log(arrFile)
        if (req.body.excelObj) {
            if (req.body.excelObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.excelObj))
            }

        }
        if (req.body.mandatoryConfirmationObj) {
            if (req.body.mandatoryConfirmationObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.mandatoryConfirmationObj))
            }

        }
        if (req.body.optionalOthersObj) {
            if (req.body.optionalOthersObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.optionalOthersObj))
            }

        }
        if (req.body.mandatoryIDImageObj) {
            if (req.body.mandatoryIDImageObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.mandatoryIDImageObj))
            }

        }
        if (req.body.mandatorySelfieObj) {
            if (req.body.mandatorySelfieObj.length) {
                arrObjectFileUploads.push(...JSON.parse(req.body.mandatorySelfieObj))
            }

        }

        if (!arrFile.length && !arrObjectFileUploads.length) {
            fs.rmdirSync(`./uploads/temporarysave/${req.user.users_id}/one`, { recursive: true });
        }
        const queryFile = `select * from file_temporary_save where users_temporary_ID = ${req.user.users_id} and is_multi is not null  `;
        if (arrFile.length) {
            const duplidatedFile = duplicates(arrFile, 'path').single();
            if (duplidatedFile) {
                throw { "message": `file ${duplidatedFile.originalname} bị trùng` }

            }
        }

        const files = await db.query(queryFile);


        let results = []

        if (arrObjectFileUploads.length) {
            results = files.filter(({ fileid: id1 }) => !arrObjectFileUploads.some(({ fileid: id2 }) => id2 === id1));
        }
        if (!arrObjectFileUploads.length) {
            results = files
        }



        await db.query("BEGIN");

        const queryExistFile = `select * from file_temporary_save where "3p_id" = ${req.user.users_id} and is_multi is not null`;
        const checkFile = await db.query(queryExistFile);

        let result = checkFile.map(a => a.path.replace(/\\/g, "/"));

        if (results.length) {

            await db.query(`delete from file_temporary_save where path in (${results.map(results => `'${results.path}'`)})  `)
            results.forEach(r => {
                emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/multi${r.originalname}`)
                fs.rmdirSync(`.${r.path}`, { recursive: true });
            })
        }




        const arrayObjectFiles = [];

        for (const file of arrFile) {

            if (!result.includes(`${file.path}`)) {
                arrayObjectFiles.push([file.originalname, req.user.users_id, req.user.users_id, 1, file.originalname, file.fieldname, file.path.replace(/\\/g, "/")])

            }

        }



        if (arrayObjectFiles.length) {
            await db.query(format('INSERT INTO file_temporary_save( originalname, users_temporary_ID, "3p_id" ,"is_multi",filename,fieldname,path) VALUES %L ', arrayObjectFiles), [])
                .catch(e => { throw e })
        }

        const data = await db.query(`select * from file_temporary_save where "3p_id" = ${req.user.users_id} and is_multi is not null`)
        const arrayCheackFile = _(data.files)
            .groupBy(x => x.type)
            .map((value, key) => ({ type: key, length: value.length, files: value }))
            .value();
        arrayCheackFile.forEach(e => {
            if (e.type === 'excel' && e.length > 1) {
                throw {
                    "message": "số lượng file excel không đúng"
                }
            }
            if (e.type === 'mandatoryConfirmation' && e.length > 1) {
                throw {
                    "message": "số lượng file bảng xác nhận không đúng "
                }
            }
            if (e.type === 'optionalOthers' && e.length > 1) {
                throw {
                    "message": "sô lượng file chứng từ khác không đúng "
                }
            }
            if (e.type === 'mandatoryIDImage' && e.length > 60) {
                throw {
                    "message": "số lượng file ảnh CCCD/CMND không đúng "
                }
            }
            if (e.type === 'mandatorySelfie' && e.length > 30) {
                throw {
                    "message": "số lượng file ảnh chân dung không đúng "
                }
            }
        })
      
        if(arrFile.length !== 0 ){
            function read(file) {
                fs.readFile(`./uploads/temporarysave/${req.user.users_id}/multi/` + file, function (err, data) {
                    if (err) { throw err }
    
                    // Buffer Pattern; how to handle buffers; straw, intake/outtake analogy
                    var base64data = new Buffer(data, 'binary');
    
                    s3.putObject({
                        Bucket: 'ms-los-ap-southeast-1-446567516155-document',
                        Key: "dsa-mobile-app" + `/uploads/temporarysave/${req.user.users_id}/multi/` + file,
                        Body: base64data,
                        ACL: 'public-read'
                    }, function (resp) {
                        console.log(arguments);
                        console.log('Successfully uploaded, ', file)
                    })
                })
            }
    
            fs.readdir(`./uploads/temporarysave/${req.user.users_id}/multi/`, function (err, files) {
                if (err) {
                    console.log("Could not list the directory.", err)
                    process.exit(1)
                }
    
                for (let i = 0; i < files.length; i++) {
                    read(files[i])
                }
    
            })
        }
        
        await db.query("COMMIT");
        res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req))
    } catch (e) {
        await db.query("ROLLBACK");
        emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/multi`)
        fs.rmdirSync(`./uploads/temporarysave/${req.user.users_id}/multi`, { recursive: true });
        return res.json(commonResponse(API_CODE.ERROR, e.message, { }, req));
    }


};


const creatMultiNVKD = async (req, res) => {


    try {
        logger("creatMultiNVKD", req.files, "Đã gọi đến hàm create!");
        await db.query("BEGIN");
        const arrFile = []
        function Exists(array, name) {
            return array.some(function (el) {
                return el.fieldname === name;
            });
        }

        if (req.files) {
            for (const property in req.files) {
                arrFile.push(...req.files[property])
            }
        }


        if (!Exists(arrFile, 'excel')) {
            if (!req.body.excelObj) {
                throw { "message": "bắt buộc phải tải file excel" }
            }



        }

        if (req.body.excelObj) {
            if (req.body.excelObj.length) {
                arrFile.push(...JSON.parse(req.body.excelObj))
            }

        }

        if (req.body.mandatorySelfieObj) {
            if (req.body.mandatorySelfieObj.length) {
                arrFile.push(...JSON.parse(req.body.mandatorySelfieObj))
            }

        }
        if (req.body.optionalOthersObj) {
            if (req.body.optionalOthersObj.length) {
                arrFile.push(...JSON.parse(req.body.optionalOthersObj))
            }

        }
        if (req.body.mandatoryIDImageObj) {
            if (req.body.mandatoryIDImageObj.length) {
                arrFile.push(...JSON.parse(req.body.mandatoryIDImageObj))
            }
        }
        if (req.body.mandatoryConfirmationObj) {
            if (req.body.mandatoryConfirmationObj.length) {
                arrFile.push(...JSON.parse(req.body.mandatoryConfirmationObj))
            }
        }
        arrFile.forEach(e => {

            if (!fs.existsSync(e.path)) {

                throw {
                    "message": `file ${e.originalname} không tồn tại`
                }
            }
        })

        if (!Exists(arrFile, 'mandatorySelfie')) {
            if (!req.body.mandatorySelfieObj) {
                throw { "message": "ảnh chân dung là bắt buộc" }

            }

        }



        if (!Exists(arrFile, 'mandatoryIDImage')) {
            if (!req.body.mandatoryIDImageObj) {
                throw { "message": "ảnh CMMD/CCCD là bắt buộc" }

            }


        }

        // if (!(!Exists(arrFile, 'mandatoryConfirmation') && !Exists(arrFile, 'optionalOthersObj') )) {
        //   if (!req.body.mandatoryConfirmationObj && !req.body.optionalOthersObj) {
        //     throw { "message": "Bảng xác nhận hoặc chứng từ khác là bắt buộc" }
        //   }
        // }
        if (!arrFile.length) {
            throw { "message": "Không có file được tải lên" }

        }

        const duplidatedFile = duplicates(arrFile, 'path').single();
        logger("creatMultiNVKD", duplidatedFile, "Check duplicatesFile!");

        if (duplidatedFile) {
            throw { "message": `file ${duplidatedFile.originalname} bị trùng` }

        }


        function Exists(array, name) {
            return array.some(function (el) {
                return el.fieldname === name;
            });
        }
        if (!Exists(arrFile, 'mandatorySelfie')) {
            throw { "message": "ảnh CMNN/CCCD là bắt buộc" }

        }
        if (!Exists(arrFile, 'mandatoryIDImage')) {
            throw { "message": "ảnh chân dung là bắt buộc" }

        }

        // if (!Exists(arrFile, 'mandatoryConfirmation')) {
        //     throw { "message": "bảng xác nhận là bắt buộc" }

        // }

        logger("creatMultiNVKD", arrFile, "Check array file!");

        function isValidDate(dateString) {
            var regEx = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateString) {
                return false;
            }

            if (!dateString.match(regEx)) return false;  // Invalid format
            var d = new Date(dateString);
            var dNum = d.getTime();
            if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
            return d.toISOString().slice(0, 10) === dateString;
        }
        function isValidPhone(phoneString) {
            var regEx = /^\d{10}$/;

            if (!phoneString) {
                return false;
            }
            if (!phoneString.match(regEx)) return false;  // Invalid format
            return true;
        }
        function ValidateEmail(input) {

            var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            if (!input) {
                return false;
            }
            if (input.match(validRegex)) {


                return true;

            } else {

                return false;

            }

        }


        const dsa_request = await db.one(`INSERT INTO dsa_request ( dsa_request_code, users_id, create_at, update_at, amount_code, status,update_by_user ) VALUES( $1,$2,$3 ,$4, $5, $6,$7 ) RETURNING dsa_request_id`, ["AIS" + req.timestamp, req.user.users_id, new Date(), null, null, statusDsaRequest.NEW, req.user.users_id]);
        for (const file of arrFile) {
            if (file.fieldname === 'mandatoryIDImage' && file.filename.split('_').length !== 4) {
                throw { "message": `Tên của file ảnh CCCD/CMND ${file.filename} phải đặt đúng định dạng [SốCMT/CCCD]_[Hoten]_[PID]_[BEFORE/AFTER]` }

            }
            if ((file.fieldname === 'mandatorySelfie' && file.filename.split('_').length !== 3)) {
                throw { "message": `Tên của file ảnh chân dung ${file.filename}  phải đặt đúng định dạng [SốCMT/CCCD]_[Hoten]_[PIC]` }
            }
            if (file.fieldname === "excel") {
                const url = `/uploads/${req.user.code3p}_` + req.timestamp + `/${file.filename}`;
                const newPath = process.cwd() + url 
           
                if (!fs.existsSync(`.${newPath}`)) {

                    fse.copy(path.normalize(process.cwd() + `/${file.path}`), path.normalize(newPath));
                }

                await db.query(format('INSERT INTO file_dsa_request( URL, TYPE, dsa_request_id ) VALUES %L', [[`${url.replace(/\\/g, "/")}`, file.fieldname, dsa_request.dsa_request_id]]), [])

            }
            if (file.fieldname === "mandatoryConfirmation") {
                const url = `/uploads/${req.user.code3p}_` + req.timestamp + `/${file.filename}`;

                const newPath = process.cwd() + url 
          
                if (!fs.existsSync(`.${newPath}`)) {
                    fse.copy(path.normalize(process.cwd() + `/${file.path}`), path.normalize(newPath));
                }

                await db.query(format('INSERT INTO file_dsa_request( URL, TYPE, dsa_request_id ) VALUES %L', [[`${url.replace(/\\/g, "/")}`, file.fieldname, dsa_request.dsa_request_id]]), [])

            }
            if (file.fieldname === "optionalOthers") {
                const url = `/uploads/${req.user.code3p}_` + req.timestamp + `/${file.filename}`;

                const newPath = process.cwd() + url 

                if (!fs.existsSync(`.${newPath}`)) {

                    fse.copy(path.normalize(process.cwd() + `/${file.path}`), path.normalize(newPath));
                }

                await db.query(format('INSERT INTO file_dsa_request( URL, TYPE, dsa_request_id ) VALUES %L', [[`${url.replace(/\\/g, "/")}`, file.fieldname, dsa_request.dsa_request_id]]), [])

            }

        }

        const dataUser = []
        const users = []
        const array_id_card = []
        const excelFile = arrFile.find(a => a.fieldname = 'excel')
        const err = []
        const Excel = require('exceljs');

        logger("creatMultiNVKD", excelFile, "Lưu file, check điều kiện xong, bắt đầu đọc file excel!");

        console.log(excelFile)
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(excelFile.path)


        const worksheet = await workbook.getWorksheet("form gửi evn");
        if (!worksheet) {
            throw {

                "message": "Tên của sheet trong excel phải đặt tên là ''form gửi evn'"
            }

        }
        worksheet.eachRow({ includeEmpty: false }, async function (row, rowNumber) {

            let user = {
                excel_index: row.values[1] ? row.values[1] : null,
                name_user: row.values[2] ? row.values[2] : null,
                birth: row.values[3] ? moment(moment(row.values[3], 'DD-MM-YYYY')).format('YYYY-MM-DD') : null,
                id_card: row.values[4] ? row.values[4] : null,
                issue_date: row.values[5] ? moment(moment(row.values[5], 'DD-MM-YYYY')).format('YYYY-MM-DD') : null,
                issue_place: row.values[6] ? row.values[6] : null,
                permanent_address: row.values[7] ? row.values[7] : null,
                address: row.values[8] ? row.values[8] : null,
                phone_number: row.values[9] ? row.values[9].toString() : null,
                position_user: row.values[10] ? row.values[10] : null,
                work_place: row.values[11] ? row.values[11] : null,
                email: _.isObject(row.values[12]) ? row.values[12].text : row.values[12],
                direct_report_line: row.values[13] ? row.values[13] : null,
                title_of_direct_report_line: row.values[14] ? row.values[14] : null,
                phone_of_direct_report_line: row.values[15] ? row.values[15].toString() : null,
                email_of_direct_report_line: _.isObject(row.values[16]) ? row.values[16].text : row.values[16],
                contract_duration: row.values[17] ? row.values[17] : null,

            };



            if (_.isNumber(user.excel_index)) {

                user.row = rowNumber
                user.columsError = []
                array_id_card.push(row.values[4])
                users.push(user)

                dataUser.push(Object.values(user))
                if (_.isEmpty(user.name_user)) {
                    user.columsError.push(` Họ tên nhân viên`)
                }

                if (!isValidDate(user.birth)) {
                    user.columsError.push(` Ngày sinh`)
                }
                if (user.id_card) {
                    if (!(user.id_card.length === 9 || user.id_card.length === 12)) {
                        user.columsError.push(` Số CMND/TCC`)
                    }
                }
                if (!user.id_card) {

                    user.columsError.push(` Số CMND/TCC`)

                }

                if (!isValidDate(user.issue_date)) {

                    user.columsError.push(` Ngày cấp CMND/CCCD`)
                }
                if (_.isEmpty(user.issue_place)) {
                    user.columsError.push(` Nơi cấp CMND/CCCD`)
                }
                if (_.isEmpty(user.permanent_address)) {
                    user.columsError.push(` Địa chỉ thường trú`)

                }
                if (_.isEmpty(user.address)) {
                    user.columsError.push(` Địa chỉ hiện tại`)
                }
                if (!isValidPhone(user.phone_number)) {
                    user.columsError.push(` Số điện thoại`)
                }
                if (_.isEmpty(user.position_user)) {
                    user.columsError.push(` Vị trí làm việc`)
                }
                if (_.isEmpty(user.work_place)) {
                    user.columsError.push(` Khu vực làm việc`)
                }
                if (!ValidateEmail(user.email)) {
                    user.columsError.push(` Địa chỉ hộp thư`)
                }
                if (_.isEmpty(user.direct_report_line)) {
                    user.columsError.push(` Tên cấp quản lý trực tiếp`)
                }
                if (_.isEmpty(user.title_of_direct_report_line)) {
                    user.columsError.push(` Chức vụ cấp quản lý trực tiếp`)
                }
                if (!isValidPhone(user.phone_of_direct_report_line)) {
                    user.columsError.push(` Số điện thoại cấp quản lý trực tiếp`)
                }
                if (!ValidateEmail(user.email_of_direct_report_line)) {
                    user.columsError.push(` Hộp thư điện tử cấp quản lý trực tiếp`)
                }
                if (_.isEmpty(user.contract_duration)) {
                    user.columsError.push(` Thời hạn hợp đồng DSA`)
                }
            }

            // await workbook.xlsx.writeFile('new.xlsx');
        })

        logger("creatMultiNVKD", {}, "Đọc file excel thành công!");
        const listAcount = await db.query(`SELECT id_card FROM "users_temporary" WHERE id_card in($1) and status not in ('cancel','rejectSS','rejectDSA', 'rejectEkyc')`, array_id_card);
        const a = _.uniqBy(listAcount, 'id_card');

        if (a.length) {
            throw {
                "message": `số CMND/CCCD ${a.map(l => l.id_card)} đã được tạo tài khoản hoặc đang được kiểm duyệt trong hệ thống`
            }

        }

        users.forEach(u => {
            if (u.columsError.length !== 0) {
                // var masterRowForCheck = worksheet.getRow(u.row);
                err.push(` hàng ${u.row} cột ${u.columsError} không đúng định dạng`)
                // u.columsError.forEach(c => {
                //   dataCell = masterRowForCheck.getCell(c)
                //   dataCell.style = Object.create(dataCell.style); 
                //   dataCell.fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'FA8072'}}; 
                // })

            }

        });

        if (err.length) {

            throw {
                "message": `${err} `
            }
        }




        const duplidated_data = duplicates(users, 'id_card').single();
        if (duplidated_data) {
            throw {
                "message": `id_card ${duplidated_data.id_card} is duplicated`
            }

        }

        try {


            var result = _(arrFile)
                .groupBy(x => x.fieldname)
                .map((value, key) => ({ fieldname: key, length: value.length, files: value }))
                .value();
            const arrid_card_pid = []

            const arrid_card_pic = []

            result.forEach((obj) => {
                if (obj.fieldname === 'mandatoryIDImage') {
                    if (obj.length !== users.length * 2) {
                        throw {
                            "message":
                                "số lượng ảnh chứng minh nhân dân không khớp"
                        }

                    }

                    obj.files.forEach((file => {

                        arrid_card_pid.push(file.filename.split("_")[0])

                    }))


                }
                if (obj.fieldname === 'mandatorySelfie') {
                    console.log(users.length)
                    if (obj.length !== users.length) {

                        throw {
                            "message":
                                "số lượng ảnh chân dung không khớp "
                        }
                    }
                    obj.files.forEach((file => {
                        arrid_card_pic.push(file.filename.split("_")[0])

                    }))
                }

            })

            function existsUser(array, name) {
                return array.some(function (el) {
                    return el.id_card === name;
                });
            }



            const differencemandatoryIDImage = _.differenceWith(arrid_card_pid, array_id_card, _.isEqual);
            const differencemandatorySelfie = _.differenceWith(arrid_card_pic, array_id_card, _.isEqual);
            if (differencemandatorySelfie.length) {
                throw {
                    "message": `không tìm thấy hồ sơ có số CMNN/CCCD '${differencemandatorySelfie}' ở các file ảnh chân dung đã tải lên `
                }


            }

            if (differencemandatoryIDImage.length) {
                throw {
                    "message": `không tìm thấy hồ sơ có số CMND/CCCD '${differencemandatoryIDImage}' ở các file ảnh CMND/CCCD đã tải lên`
                }

            }





            const arrayObjectFiles = [];
            const arrayObjectFileDsaRequest = [];

            dataUser.map(d => {

                d.shift()
                d.splice(16, 17)

            })

            dataUser.map(d => d.push(dsa_request.dsa_request_id, statusDsaNVKD.NEW, moment(moment(new Date(req.timestamp), 'DD-MM-YYYY HH:mm')).format('YYYY-MM-DD HH:mm'), req.user.partner_code, req.user.users_id, req.timestamp))

            const users_temporary = await db.query(format('INSERT INTO users_temporary(name_user,birth,id_card,issue_date,issue_place,permanent_address,address,phone_number,position_user,work_place,email,direct_report_line,title_of_direct_report_line,phone_of_direct_report_line,email_of_direct_report_line,contract_duration,dsa_request_id,status,created_at,partner_code,users_id,timestamp) VALUES %L RETURNING *', dataUser), [])

            await db.query(`UPDATE dsa_request SET amount_code = ${users_temporary.length} where dsa_request_id = ${dsa_request.dsa_request_id} `)
            const arrrayFileSFTP = []
            for (const user of users_temporary) {

                const arrFilePID = []
                const arrFilePIC = []


                for (const file of arrFile) {


                    if (user.id_card === file.filename.split("_")[0]) {


                        if (file.fieldname === "mandatoryIDImage") {

                            if (!["BEFORE", "AFTER", "before", "after"].includes(file.filename.split("_")[3].split('.')[0])) {


                                throw {
                                    "message": `Tên của file ảnh CCCD/CMND  ${file.filename} phải có hậu tố là BEFORE hoặc AFTER`
                                }
                            }

                            if (!["PID", "pid"].includes(file.filename.split("_")[2].split('.')[0])) {

                                throw {
                                    "message": `Tên của file ảnh CCCD/CMND ${file.filename} phải đặt đúng định dạng [SốCMT/CCCD]_[Hoten]_PID_[BBFORE/AFTER]`
                                }
                            }
                            if (latinize(user.name_user).replace(/ +/g, "").toLowerCase() !== latinize(file.filename.split("_")[1]).replace(/ +/g, "").toLowerCase()) {

                                throw {
                                    "message": `Tên của user có CCCD/CMMD ${file.filename.split("_")[0]} trong file ảnh CCCD/CMMD không khớp với tên của user trong file excel`

                                }
                            }

                            let newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${user.id_card}_${latinize(user.name_user).replace(/ +/g, "").toLowerCase()}_PID_BE.${file.filename.split(".").pop()}`;

                            if (fs.existsSync(process.cwd() + newPath)) {

                                const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${user.id_card}_${latinize(user.name_user).replace(/ +/g, "").toLowerCase()}_PID_AF.${file.filename.split(".").pop()}`
                                if (!fs.existsSync(process.cwd() + newPath)) {
                                    fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
                                }
                                file.path = newPath
                            } else {
                                const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${user.id_card}_${latinize(user.name_user).replace(/ +/g, "").toLowerCase()}_PID_BE.${file.filename.split(".").pop()}`
                                if (!fs.existsSync(process.cwd() + newPath)) {
                                    fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
                                }
                                file.path = newPath
                            }
                            const name = "PID" + "_" + user.id_card + "_" + user.phone_number + "_" + req.user.code3p + req.timestamp
                            user.remote_path_pid = `/uploads/mobile/PID/${name}.pdf`
                            arrFilePID.push(file.path)

                        }
                        if (file.fieldname === "mandatorySelfie") {

                            if (latinize(user.name_user).replace(/ +/g, "").toLowerCase() !== latinize(user.name_user).replace(/ +/g, "").toLowerCase(file.filename.split("_")[1])) {

                                throw {
                                    "message": `Tên của user có CCCD/CMMD ${file.filename.split("_")[0]} trong file ảnh chân dung không khớp với tên của user trong file excel`
                                }
                            }
                            if (!["PIC", "pic"].includes(file.filename.split("_")[2].split('.')[0])) {

                                throw {
                                    "message": `Tên của file ảnh chân dung  ${file.filename} phải có hậu tố là tên file phải đặt đúng định dạng [SốCMT/CCCD]_[Hoten]_PIC`

                                }
                            }
                            const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${user.id_card}_${latinize(user.name_user).replace(/ +/g, "").toLowerCase()}_PIC.${file.filename.split(".").pop()}`
                            if (!fs.existsSync(process.cwd() + newPath)) {
                                fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
                            }
                            file.path = newPath
                            const name = "PIC" + "_" + user.id_card + "_" + user.phone_number + "_" + req.user.code3p + req.timestamp
                            user.remote_path_pic = `/uploads/mobile/PIC/${name}.pdf`
                            arrFilePIC.push(file.path)
                        }
                        arrayObjectFiles.push([file.path, file.fieldname, user.users_temporary_id])

                    }



                }

                logger("creatMultiNVKD", {}, "Check điều kiện giữa file và excel thành công!");
                arrrayFileSFTP.push(
                    {
                        "file_type": "PIC",
                        "file_name": arrFilePIC,
                        "user": user,
                        "req": req

                    }, {

                    "file_type": "PID",
                    "file_name": arrFilePID,

                    "user": user,
                    "req": req
                })



                await db.query(format(`INSERT into users_temporary(users_temporary_id,path_pic,path_pid) VALUES %L on CONFLICT (users_temporary_id) DO UPDATE 
                SET users_temporary_id = excluded.users_temporary_id, path_pic = excluded.path_pic,path_pid = excluded.path_pid `, [[user.users_temporary_id, user.remote_path_pic.split("/").pop(), user.remote_path_pid.split("/").pop()]]), [])
                logger("creatMultiNVKD", {}, "Tạo user_temporary thành công!");
            }

 
            // for (const file of arrFile) {

            //     if (file.fieldname === "mandatoryConfirmation") {
            //         const newPath = `/uploads/${req.user.code3p}_` + req.timestamp + `/${user.id_card}_${latinize(user.name_user).replace(/ +/g, "").toLowerCase()}_PID_BE.${file.filename.split(".").pop()}`
            //         if (!fs.existsSync(process.cwd() + newPath)) {
            //             fse.renameSync(process.cwd() + `/${file.path}`, process.cwd() + newPath);
            //         }
            //         arrayObjectFileDsaRequest.push([`/${file.path.replace(/\\/g, "/")}`, file.fieldname, dsa_request.dsa_request_id])

            //     }
            //     if (file.fieldname === "optionalOthers") {
            //         arrayObjectFileDsaRequest.push([`/${file.path.replace(/\\/g, "/")}`, file.fieldname, dsa_request.dsa_request_id])

            //     }

            // }
 
            await db.query(format('INSERT INTO file( URL, TYPE, users_temporary_ID ) VALUES %L', arrayObjectFiles), [])
    
            // if(arrayObjectFileDsaRequest.length !== 0){
            //     await db.query(format('INSERT INTO file_dsa_request( URL, TYPE, dsa_request_id ) VALUES %L', arrayObjectFileDsaRequest), [])
            // }
           
            const query = `SELECT dr.dsa_request_id,
              dr.dsa_request_code,
              dr.users_id,
              dr.create_at,
              dr.update_at,
              dr.amount_code,
              dr.fileid,
              dr.status,
              us.partner_code,
              us.name3p,
              us.username,
              
              (SELECT array_to_json ("array_agg" (row_to_json (alias_status))) AS countstatus
              FROM
              (SELECT COUNT(dsa_request_id),
                    status
              FROM
               (SELECT ut.status,
                       ut.users_temporary_id,
                       dr.dsa_request_id
                FROM dsa_request dr
                LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id) a
              WHERE a.dsa_request_id = ${dsa_request.dsa_request_id}
              GROUP BY a.status) alias_status),
             (SELECT array_to_json ("array_agg" (row_to_json (users_alias))) AS users
              FROM
            (SELECT *,
               (SELECT array_to_json ("array_agg" (row_to_json (file_alias))) AS files
                FROM
                  (SELECT *
                   FROM FILE
                   WHERE u.users_temporary_id = file.users_temporary_id ) file_alias)
             FROM users_temporary u
           
             WHERE dr.dsa_request_id = u.dsa_request_id ) users_alias),
             (SELECT array_to_json ("array_agg" (row_to_json (file_alias))) AS files
             FROM
             (SELECT *
             FROM file_dsa_request
             WHERE dr.dsa_request_id = file_dsa_request.dsa_request_id ) file_alias)
             FROM dsa_request dr
             LEFT JOIN users us ON us.users_id = dr.update_by_user
             WHERE dr.dsa_request_id = ${dsa_request.dsa_request_id}  `
            const data = await db.query(query)

            if (data.length) {
                fs.rmdirSync(`./uploads/temporarysave/${req.user.users_id}/multi`, { recursive: true });
                await db.query(`delete from file_temporary_save where "3p_id" = ${req.user.users_id} and  is_multi is not  null  `)
                await db.query(`delete from users_temporary_save where "users_id" = ${req.user.users_id}   `)

            }
            function read(file) {
                fs.readFile(`./uploads/${req.user.code3p}_${req.timestamp}/` + file, function (err, data) {
                    if (err) { throw err }

                    // Buffer Pattern; how to handle buffers; straw, intake/outtake analogy
                    var base64data = new Buffer(data, 'binary');

                    s3.putObject({
                        Bucket: 'ms-los-ap-southeast-1-446567516155-document',
                        Key: "dsa-mobile-app/" + `uploads/${req.user.code3p}_${req.timestamp}/` + file,
                        Body: base64data,
                        ACL: 'public-read'
                    }, function (resp) {
                      
                        console.log('Successfully uploaded, ', file)
                    })
                })
            }

            fs.readdir(`./uploads/${req.user.code3p}_${req.timestamp}`, function (err, files) {
                if (err) {
                    console.log("Could not list the directory.", err)
                    process.exit(1)
                }  

                console.log(files)

                for (let i = 0; i < files.length; i++) {
                    read(files[i])
                }

            })
            await db.query("COMMIT");
            await emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/temporarysave/${req.user.users_id}/multi`)

            logger("creatMultiNVKD", {}, "Trả về thành công!");
            return res.json(commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req))

        }
        catch (e) {
            logger("creatMultiNVKD", e.message, "Lỗi rồi bạn ơi!");
            await db.query("ROLLBACK");
            await emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `./uploads/${req.user.code3p}_` + req.timestamp)
            fs.rmdirSync(`./uploads/${req.user.code3p}_` + req.timestamp, { recursive: true });

            logger("creatMultiNVKD", e.message, "Xử lý lỗi thành công!");
            return res.json(commonResponse(API_CODE.ERROR, e.message, { }, req));
        }


    } catch (error) {
        logger("creatMultiNVKD", error.message, "Lỗi 1761 rồi bạn ơi!");

        await emptyS3Directory('ms-los-ap-southeast-1-446567516155-document', `dsa-mobile-app/uploads/${req.user.code3p}_` + req.timestamp)
        fs.rmdirSync(`./uploads/${req.user.code3p}_` + req.timestamp, { recursive: true });

        logger("creatMultiNVKD", error.message, "Xử lý lỗi thành công!");
        return res.json(commonResponse(API_CODE.ERROR, error.message, { }, req));
    }

};

async function emptyS3Directory(bucket, dir) {
    const listParams = {
        Bucket: bucket,
        Prefix: dir
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
        Bucket: bucket,
        Delete: { Objects: [] }
    };
 
    listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
    });

    await s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}


async function getRequestFor3p(req, res, next) {

    try {
        const { page, size, sort_partner_code, sort_request_date, sort_update_date, status, dsa_request_code, partner_code, startDate, endDate, textSearch } = req.body;
        const { limit, offset } = getPagination(page, size);


        let queryList = `SELECT DISTINCT(dr.dsa_request_id),
        dr.dsa_request_code,
        dr.users_id,
        dr.create_at,
        dr.update_at,
        dr.amount_code,
        dr.fileid,
        usp.username as user_update,
        cp.code3p as  partner_code,
        u.username,
        dr.status
      FROM
        dsa_request AS dr
        LEFT JOIN users u ON u.users_id = dr.users_id 
        LEFT JOIN "code_3p" cp ON cp.code_3p_id = u.code_3p_id 
        LEFT JOIN users usp ON usp.users_id = dr.update_by_user
        LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
        LEFT JOIN account_dsa ad ON ad.users_temporary_id = ut.users_temporary_id
        where u.users_id = ${req.user.users_id}
    `;


        let queryCount = `SELECT count( DISTINCT dr.dsa_request_id) 
      FROM
        dsa_request AS dr
        LEFT JOIN users u ON u.users_id = dr.users_id 
        LEFT JOIN "code_3p" cp ON cp.code_3p_id = u.code_3p_id 
        LEFT JOIN users usp ON usp.users_id = dr.update_by_user
        LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
        LEFT JOIN account_dsa ad ON ad.users_temporary_id = ut.users_temporary_id
        where u.users_id = ${req.user.users_id} `
        if (status) {
            queryList += `AND dr.status = '${status}' `
            queryCount += `AND dr.status = '${status}' `
        }

        if (dsa_request_code) {
            queryList += `AND dr.dsa_request_code = '${dsa_request_code}' `
            queryCount += `AND dr.dsa_request_code = '${dsa_request_code}' `

        }
        if (partner_code) {
            queryList += `AND dr.partner_code ILIKE '${partner_code}' `
            queryCount += `AND dr.partner_code ILIKE '${partner_code}' `

        }
        if (startDate) {

            queryList += `AND dr.create_at >='${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' `
            queryCount += `AND dr.create_at >= '${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' `

        }
        if (endDate) {
            queryList += `AND dr.create_at <= '${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}' `
            queryCount += `AND dr.create_at <='${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}' `

        }
        if (textSearch) {
            queryList += ` AND ( cp.code3p ILIKE   '%${textSearch}%' or ut.id_card ILIKE   '%${textSearch}%' or ut.name_user ILIKE   '%${textSearch}%' or dr.dsa_request_code ILIKE   '%${textSearch}%' or ad.dsa  ILIKE   '%${textSearch}%') `

            queryCount +=  ` AND ( cp.code3p ILIKE   '%${textSearch}%' or ut.id_card ILIKE   '%${textSearch}%' or ut.name_user ILIKE   '%${textSearch}%' or dr.dsa_request_code ILIKE   '%${textSearch}%' or ad.dsa  ILIKE   '%${textSearch}%') `
        }
        if (sort_partner_code || sort_request_date || sort_update_date) {
            queryList += `ORDER BY ${sort_partner_code ? `partner_code ${sort_partner_code}` : ""}${sort_request_date ? `${sort_partner_code ? "," : ""}dr.create_at ${sort_request_date}` : ""}${sort_update_date ? `${sort_partner_code || sort_request_date ? "," : ""}dr.update_at ${sort_update_date}` : ""}  `

        }


        queryList = queryList + `LIMIT ${limit} OFFSET ${offset}`
        // console.log(queryList)
        const listUser = await db.any(queryList);
        const total = await db.any(queryCount)
  
        const result = getPagingData(
            listUser,
            getParseInt(total[0].count),
            page,
            limit
        );

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}

async function getRequestForSS(req, res, next) {
    try {
        const { page, size, sort_partner_code, sort_request_date, sort_update_date, status, dsa_request_code, partner_code, startDate, endDate, textSearch } = req.body;
        const { limit, offset } = getPagination(page, size);
        let queryList = `SELECT DISTINCT(dr.dsa_request_id),
        dr.dsa_request_code,
        dr.users_id,
        dr.create_at,
        dr.update_at,
        dr.amount_code,
        dr.fileid,
        usp.username as user_update,
        cp.code3p as  partner_code,
        u.username,
        dr.status
 
      FROM
        dsa_request AS dr
        LEFT JOIN users u ON u.users_id = dr.users_id 
        LEFT JOIN "code_3p" cp ON cp.code_3p_id = u.code_3p_id 
        LEFT JOIN users usp ON usp.users_id = dr.update_by_user
        LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
        LEFT JOIN account_dsa ad ON ad.users_temporary_id = ut.users_temporary_id
        where dr.dsa_request_id is not null
    `;


        let queryCount = `SELECT count( DISTINCT dr.dsa_request_id)
      FROM
        dsa_request AS dr
        LEFT JOIN users u ON u.users_id = dr.users_id 
        LEFT JOIN "code_3p" cp ON cp.code_3p_id = u.code_3p_id 
        LEFT JOIN users usp ON usp.users_id = dr.update_by_user

        LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id 
        LEFT JOIN account_dsa ad ON ad.users_temporary_id = ut.users_temporary_id
        where dr.dsa_request_id is not null `
        if (status) {
            queryList += `AND dr.status = '${status}' `
            queryCount += `AND dr.status = '${status}' `
        }

        if (dsa_request_code) {
            queryList += `AND dr.dsa_request_code = '${dsa_request_code}' `
            queryCount += `AND dr.dsa_request_code = '${dsa_request_code}' `

        }
        if (partner_code) {
            queryList += `AND dr.partner_code ILIKE '${partner_code}' `
            queryCount += `AND dr.partner_code ILIKE '${partner_code}' `

        }
        if (startDate) {

            queryList += `AND dr.create_at >='${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' `
            queryCount += `AND dr.create_at >= '${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' `

        }
        if (endDate) {
            queryList += `AND dr.create_at <= '${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}' `
            queryCount += `AND dr.create_at <='${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}' `

        }
        if (textSearch) {
            queryList += ` AND ( cp.code3p ILIKE   '%${textSearch}%' or ut.id_card ILIKE   '%${textSearch}%' or ut.name_user ILIKE   '%${textSearch}%' or dr.dsa_request_code ILIKE   '%${textSearch}%' or ad.dsa  ILIKE   '%${textSearch}%') `

            queryCount +=  ` AND ( cp.code3p ILIKE   '%${textSearch}%' or ut.id_card ILIKE   '%${textSearch}%' or ut.name_user ILIKE   '%${textSearch}%' or dr.dsa_request_code ILIKE   '%${textSearch}%' or ad.dsa  ILIKE   '%${textSearch}%') `
        }

        if (sort_partner_code || sort_request_date || sort_update_date) {
            queryList += `ORDER BY ${sort_partner_code ? `partner_code ${sort_partner_code}` : ""}${sort_request_date ? `${sort_partner_code ? "," : ""}dr.create_at ${sort_request_date}` : ""}${sort_update_date ? `${sort_partner_code || sort_request_date ? "," : ""}dr.update_at ${sort_update_date}` : ""}  `

        }

    
        queryList = queryList + `LIMIT ${limit} OFFSET ${offset}`
        // console.log(queryList)
        const listUser = await db.any(queryList);
        const total = await db.any(queryCount)

        const result = getPagingData(
            listUser,
            getParseInt(total[0].count),
            page,
            limit
        );

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}



async function getDetailNVKDFor3P(req, res, next) {
    try {

        const { dsa_request_id, statusNVKD, textSearch } = req.body;
        let arrayStatus = []
        listReviewing.push("timeout")
        if (statusNVKD === statusDsaNVKD.REJECTED) {
            arrayStatus = listReject
        }
        else if (statusNVKD === statusDsaNVKD.APPROVED) {
            arrayStatus = listApproved
        }
        else if (statusNVKD === statusDsaNVKD.REVIEWING) {
            arrayStatus = listReviewing
        }
        else if (statusNVKD === statusDsaNVKD.NEW) {
            arrayStatus = ["new"]
        }
        else if (statusNVKD === statusDsaNVKD.COMPLETED) {
            arrayStatus = ["completed"]
        }
        else if (statusNVKD === statusDsaNVKD.ACCOUNTGRANTING) {
            arrayStatus = ["accountgranting"]
        }
        else if (statusNVKD === statusDsaNVKD.TIMEOUT) {
            arrayStatus = ["timeout"]
        }
        else if (statusNVKD === statusDsaNVKD.CANCEL) {
            arrayStatus = listCancel
        }


        const query = `	
      SELECT dr.dsa_request_id,
      dr.dsa_request_code,
      dr.users_id,
      dr.create_at,
      dr.update_at,
      dr.amount_code,
      dr.fileid,
      dr.status,
      cp.code3p as  partner_code,
      cp.name3p as name3p,
      us.username,
      usp.username as user_update,
      ( SELECT array_to_json ("array_agg" (row_to_json (alias_status))) AS countstatus
      FROM
        (SELECT COUNT (A.users_temporary_id), A.status
         FROM
           (SELECT *
            FROM
              (SELECT ut.users_temporary_id,
                                'rejected' as status 
               FROM dsa_request dr
               LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
               WHERE ut.dsa_request_id = ${dsa_request_id}
                 AND ut.status IN (${listReject.map(s => `'${s}'`)})
                 UNION ALL
                 SELECT ut.users_temporary_id,
                                ut.status
               FROM dsa_request dr
               LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
               WHERE ut.dsa_request_id = ${dsa_request_id}
                 AND ut.status IN ('${STATUS_DSA.NEW}','${STATUS_DSA.COMPLETED}','${statusDsaNVKD.ACCOUNTGRANTING}')
                 UNION ALL
                 SELECT ut.users_temporary_id,
                               'reviewing' as status
               FROM dsa_request dr
               LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
               WHERE ut.dsa_request_id = ${dsa_request_id}
                 AND ut.status  IN (${listReviewing.map(s => `'${s}'`)},'timeout') 
               UNION ALL
                 SELECT ut.users_temporary_id,
                              'approved' as status
               FROM dsa_request dr
               LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
               WHERE ut.dsa_request_id = ${dsa_request_id}
                 AND ut.status IN (${listApproved.map(s => `'${s}'`)})
                 UNION ALL
                 SELECT ut.users_temporary_id,
                              'cancel' as status
               FROM dsa_request dr
               LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
               WHERE ut.dsa_request_id = ${dsa_request_id}
                 AND ut.status IN (${listCancel.map(s => `'${s}'`)})
                  ) dsa) A
         GROUP BY A.status) alias_status  ),
      (SELECT array_to_json ("array_agg" (row_to_json (users_alias))) AS users
      FROM
      (SELECT u.*, r.reject_reason_id,
        r.reason as reason_ss,
        ra.reason_3p as reason_af,
        ra.reject_reason_id as reject_reason_id_af,
        ac.dsa,
       (SELECT array_to_json ("array_agg" (row_to_json (file_alias))) AS files
        FROM
          (SELECT *
           FROM FILE
           WHERE u.users_temporary_id = file.users_temporary_id ) file_alias)
       FROM users_temporary u
       LEFT JOIN reject_reason_ss r ON u.reject_reason_id = r.reject_reason_id
       LEFT JOIN reject_reason_af ra ON u.reject_reason_id_af = ra.reject_reason_id
       LEFT JOIN account_dsa ac on ac.users_temporary_id = u.users_temporary_id
       WHERE dr.dsa_request_id = u.dsa_request_id ${statusNVKD ? `and u.status in (${arrayStatus.map(s => `'${s}'`)}) ` : ""} ${textSearch ? `and (u.id_card ILIKE '%${textSearch}%' OR u.name_user ILIKE '%${textSearch}%' OR ac.dsa ILIKE '%${textSearch}%' )` : ""}) users_alias),
       (SELECT array_to_json ("array_agg" (row_to_json (file_alias))) AS files
        FROM
       (SELECT *
       FROM file_dsa_request
       WHERE dr.dsa_request_id = file_dsa_request.dsa_request_id ) file_alias)
       FROM dsa_request dr
       LEFT JOIN users us ON us.users_id = dr.users_id
       LEFT JOIN "code_3p" cp ON cp.code_3p_id = us.code_3p_id 
       LEFT JOIN users usp ON usp.users_id = dr.update_by_user
       WHERE dr.dsa_request_id = ${dsa_request_id}  `

        const data = await db.oneOrNone(query);
        if (data.users) {
            data.users.map(u => {
                delete u.note_af
            })
        }
        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}


async function getDetailNVKDForSS(req, res, next) {
    try {
        const { dsa_request_id, statusNVKD, textSearch } = req.body;
        let arrayStatus = []
        // listReviewing.push("timeout")
        if (statusNVKD === statusDsaNVKD.REJECTED) {
            arrayStatus = listReject
        }
        else if (statusNVKD === statusDsaNVKD.APPROVED) {
            arrayStatus = listApproved
        }
        else if (statusNVKD === statusDsaNVKD.REVIEWING) {
            arrayStatus = listReviewing
        }
        else if (statusNVKD === statusDsaNVKD.NEW) {
            arrayStatus = ["new"]
        }
        else if (statusNVKD === statusDsaNVKD.COMPLETED) {
            arrayStatus = ["completed"]
        }
        else if (statusNVKD === statusDsaNVKD.ACCOUNTGRANTING) {
            arrayStatus = ["accountgranting"]
        }
        else if (statusNVKD === statusDsaNVKD.TIMEOUT) {
            arrayStatus = ["timeout"]
        }
        else if (statusNVKD === statusDsaNVKD.CANCEL) {
            arrayStatus = listCancel
        }


        const query = `	
    SELECT dr.dsa_request_id,
    dr.dsa_request_code,
    dr.users_id,
    dr.create_at,
    dr.update_at,
    dr.amount_code,
    dr.fileid,
    dr.status,
    cp.code3p as  partner_code,
    cp.name3p as name3p,
    us.username,
    usp.username as user_update,
    ( SELECT array_to_json ("array_agg" (row_to_json (alias_status))) AS countstatus
    FROM
      (SELECT COUNT (A.users_temporary_id), A.status
       FROM
         (SELECT *
          FROM
            (SELECT ut.users_temporary_id,
                              'rejected' as status 
             FROM dsa_request dr
             LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
             WHERE ut.dsa_request_id = ${dsa_request_id}
               AND ut.status IN (${listReject.map(s => `'${s}'`)})
               UNION ALL
               SELECT ut.users_temporary_id,
                              ut.status
             FROM dsa_request dr
             LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
             WHERE ut.dsa_request_id = ${dsa_request_id}
               AND ut.status IN ('${STATUS_DSA.NEW}','${STATUS_DSA.COMPLETED}','${statusDsaNVKD.ACCOUNTGRANTING}')
               UNION ALL
               SELECT ut.users_temporary_id,
                             'reviewing' as status
             FROM dsa_request dr
             LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
             WHERE ut.dsa_request_id = ${dsa_request_id}
               AND ut.status  IN (${listReviewing.map(s => `'${s}'`)},'timeout') 
             UNION ALL
               SELECT ut.users_temporary_id,
                            'approved' as status
             FROM dsa_request dr
             LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
             WHERE ut.dsa_request_id = ${dsa_request_id}
               AND ut.status IN (${listApproved.map(s => `'${s}'`)})
               UNION ALL
               SELECT ut.users_temporary_id,
                            'cancel' as status
             FROM dsa_request dr
             LEFT JOIN users_temporary ut ON ut.dsa_request_id = dr.dsa_request_id
             WHERE ut.dsa_request_id = ${dsa_request_id}
               AND ut.status IN (${listCancel.map(s => `'${s}'`)})
                ) dsa) A
       GROUP BY A.status) alias_status  ),
    (SELECT array_to_json ("array_agg" (row_to_json (users_alias))) AS users
    FROM
    (SELECT u.*, r.reject_reason_id,
      r.reason as reason_ss,
      ra.reason_3p as reason_af,
      ra.reject_reason_id as reject_reason_id_af,
      ac.dsa,
     (SELECT array_to_json ("array_agg" (row_to_json (file_alias))) AS files
      FROM
        (SELECT *
         FROM FILE
         WHERE u.users_temporary_id = file.users_temporary_id ) file_alias)
     FROM users_temporary u
     LEFT JOIN reject_reason_ss r ON u.reject_reason_id = r.reject_reason_id
     LEFT JOIN reject_reason_af ra ON u.reject_reason_id_af = ra.reject_reason_id
     LEFT JOIN account_dsa ac on ac.users_temporary_id = u.users_temporary_id
     WHERE dr.dsa_request_id = u.dsa_request_id ${statusNVKD ? `and u.status in (${arrayStatus.map(s => `'${s}'`)}) ` : ""} ${textSearch ? `and (u.id_card ILIKE '%${textSearch}%' OR u.name_user ILIKE '%${textSearch}%' or ac.dsa ILIKE '%${textSearch}%')` : ""}) users_alias),
     (SELECT array_to_json ("array_agg" (row_to_json (file_alias))) AS files
      FROM
     (SELECT *
     FROM file_dsa_request
     WHERE dr.dsa_request_id = file_dsa_request.dsa_request_id ) file_alias)
     FROM dsa_request dr
     LEFT JOIN users us ON us.users_id = dr.users_id
     LEFT JOIN "code_3p" cp ON cp.code_3p_id = us.code_3p_id 
     LEFT JOIN users usp ON usp.users_id = dr.update_by_user
     WHERE dr.dsa_request_id = ${dsa_request_id}  `
       
        const data = await db.oneOrNone(query);
        if (data.users) {
            data.users.map(u => {
                delete u.note_af
            })
        }

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        );
    } catch (e) {

        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}


async function getListNVKDForAF(req, res, next) {
    try {
        const { page, size, sort_request_date, sort_partner_code, sort_update_date, status, user_name, startDate, endDate, partner_code, textSearch } = req.body;
        const { limit, offset } = getPagination(page, size);
        let arrayStatus = []
        if (status === statusDsaNVKD.REJECTED) {
            arrayStatus = listReject
        }
        else if (status === statusDsaNVKD.APPROVED) {
            arrayStatus = listApproved
        }
        else if (status === statusDsaNVKD.REVIEWING) {
            arrayStatus = listReviewing
        }
        else if (status === statusDsaNVKD.NEW) {
            arrayStatus = ["new"]
        }
        else if (status === statusDsaNVKD.COMPLETED) {
            arrayStatus = ["completed"]
        }
        else if (status === statusDsaNVKD.ACCOUNTGRANTING) {
            arrayStatus = ["accountgranting"]
        }
        else if (status === statusDsaNVKD.TIMEOUT) {
            arrayStatus = ["timeout"]
        }
        else if (status === statusDsaNVKD.CANCEL) {
            arrayStatus = listCancel
        }

        let queryList = `	
    select *from( SELECT d.dsa_request_code,
      d.create_at,
      u.users_temporary_id,
      u.name_user,
      u.id_card,
      u.birth,
      u.position_user,
      u.status,
      u.updated_at,
      u.permanent_address,
      u.issue_date,
      u.ss_review_id,
      u.message_ais,
      u.message_imx,
      u.message_contract,
      u.message_references,
      u.message_dsa,
      u.message_cic,
      u.message_ekyc,
      u.send_risk_at,
      u.reject_reason_id_af,
      u.reject_reason_id,
      d.dsa_request_id,
      cp.code3p as partner_code,
      d.update_by_user,
      usd.username,
      usf.username as username_af,
      uss.username as username_ss,
      r.reason,
      ra.reason_af,
      u.phone_number,
      ad.dsa,
usd.username as user_update from dsa_request d 
LEFT JOIN users us ON us.users_id = d.users_id 
LEFT JOIN "code_3p" cp ON cp.code_3p_id = us.code_3p_id 
LEFT JOIN users_temporary  u on u.dsa_request_id = d.dsa_request_id
LEFT JOIN users usd ON usd.users_id = d.update_by_user
LEFT JOIN users usf ON usf.users_id = u.af_review_id    
LEFT JOIN users uss ON uss.users_id = u.ss_review_id  
LEFT JOIN reject_reason_ss r ON u.reject_reason_id = r.reject_reason_id
LEFT JOIN reject_reason_af ra ON u.reject_reason_id_af = ra.reject_reason_id
LEFT JOIN account_dsa ad ON ad.users_temporary_id = u.users_temporary_id
     ) a WHERE a.users_temporary_id is not null 
      `
        let queryCount = `select count(a.users_temporary_id) from(SELECT d.dsa_request_code,
      d.create_at,
      u.users_temporary_id,
      u.name_user,
      u.id_card,
      u.birth,
      u.position_user,
      u.status,
      u.updated_at,
      u.ss_review_id,
      u.message_ais,
      u.message_imx,
      u.message_contract,
      u.message_references,
      u.message_dsa,
      u.message_cic,
      u.message_ekyc,
      d.dsa_request_id,
      cp.code3p as partner_code,
      d.update_by_user,
      usd.username,
      ad.dsa,
usd.username as user_update from dsa_request d 
LEFT JOIN users us ON us.users_id = d.users_id 
LEFT JOIN "code_3p" cp ON cp.code_3p_id = us.code_3p_id 
LEFT JOIN users_temporary  u on u.dsa_request_id = d.dsa_request_id
LEFT JOIN users usd ON usd.users_id = d.update_by_user
LEFT JOIN account_dsa ad ON ad.users_temporary_id = u.users_temporary_id
       ) a WHERE a.users_temporary_id is not null `

        if (status) {
            queryList += `AND a.status in (${arrayStatus.map(s => `'${s}'`)}) `
            queryCount += `AND a.status in (${arrayStatus.map(s => `'${s}'`)}) `
        }
        if (partner_code) {
            queryList += `AND a.partner_code = '${partner_code}'  `
            queryCount += `AND a.partner_code = '${partner_code}' `

        }

        if (user_name) {
            queryList += `AND a.name_user ILIKE   '%${user_name}%'  `
            queryCount += `AND a.name_user ILIKE   '%${user_name}%' `

        }
        if (textSearch) {
            queryList += `AND (a.name_user ILIKE   '%${textSearch}%' or a.id_card ILIKE   '%${textSearch}%'  or a.dsa_request_code ILIKE   '%${textSearch}%' or a.dsa  ILIKE   '%${textSearch}%') `
            queryCount += `AND (a.name_user ILIKE   '%${textSearch}%' or a.id_card ILIKE   '%${textSearch}%'  or a.dsa_request_code ILIKE   '%${textSearch}%' or a.dsa  ILIKE   '%${textSearch}%') `

        }

        if (startDate) {

            queryList += `AND a.create_at >= '${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' `
            queryCount += `AND a.create_at >= '${moment(startDate).format('YYYY-MM-DD HH:mm:ss')}' `

        }
        if (endDate) {
            queryList += `AND a.create_at <= '${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}' `
            queryCount += `AND a.create_at <= '${moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}' `

        }
        if (sort_partner_code || sort_request_date || sort_update_date) {
            queryList += `ORDER BY ${sort_partner_code ? `a.partner_code ${sort_partner_code}` : ""}${sort_request_date ? `${sort_partner_code ? "," : ""}a.create_at ${sort_request_date}` : ""}${sort_update_date ? `${sort_partner_code || sort_request_date ? "," : ""}a.updated_at ${sort_update_date}` : ""}  `

        }

        queryList = queryList + `LIMIT ${limit} OFFSET ${offset}`
        // console.log(queryList)
        const listUser = await db.any(queryList);
        const total = await db.any(queryCount)

        const result = getPagingData(
            listUser,
            getParseInt(total[0].count),
            page,
            limit
        );

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, result, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}

async function getDetailNVKDForAF(req, res, next) {
    try {
        const { dsa_request_id, users_temporary_id } = req.body;

        let query = `	

      SELECT
      dsa_request_id,dr.dsa_request_code,dr.users_id,dr.create_at,dr.update_at,dr.amount_code,dr.fileid,
      dr.status ,	    cp.code3p as  partner_code,
      cp.name3p as name3p,
      usp.username as user_update,
      (SELECT to_json(row_to_json(users_alias)) as users FROM (	SELECT u.*,raf.reason_af,r.reason as reason_ss,raf.reject_reason_id as reject_reason_id_af,ac.dsa,usf.username as username_af,
        uss.username as username_ss,
        (SELECT array_to_json("array_agg"(row_to_json(file_alias))) as files 
        FROM (SELECT * FROM file WHERE u.users_temporary_id = file.users_temporary_id ) file_alias) 
         FROM  users_temporary u 
        LEFT JOIN reject_reason_ss r ON r.reject_reason_id = u.reject_reason_id 
        LEFT JOIN reject_reason_af raf ON raf.reject_reason_id = u.reject_reason_id_af 
        LEFT JOIN account_dsa ac on ac.users_temporary_id = u.users_temporary_id
        LEFT JOIN users usf ON usf.users_id = u.af_review_id    
        LEFT JOIN users uss ON uss.users_id = u.ss_review_id  
      WHERE dr.dsa_request_id = u.dsa_request_id and u.users_temporary_id = ${users_temporary_id}  ) users_alias),
            (SELECT array_to_json("array_agg"(row_to_json(file_alias))) as files FROM (SELECT * FROM file_dsa_request WHERE dr.dsa_request_id = file_dsa_request.dsa_request_id ) file_alias)
    FROM
      dsa_request dr

        LEFT JOIN users us ON us.users_id = dr.users_id 
        LEFT JOIN "code_3p" cp ON cp.code_3p_id = us.code_3p_id 
        LEFT JOIN users usp ON usp.users_id = dr.update_by_user
      where dr.dsa_request_id =   ${dsa_request_id}
      `


        const request = await db.oneOrNone(query);


        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, request, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e.message, { }, req));
    }
}


async function AFUpdateNVKD(req, res, next) {

    try {
        // await db.query("BEGIN");
        const { status, users_temporary_id, reject_reason_id, note } = req.body;
        const users_temporary = await db.oneOrNone(`SELECT * FROM users_temporary WHERE users_temporary_id = ${users_temporary_id}`)
        if (!users_temporary) {
            throw {
                "message": "user not found"
            }
        }
        if (users_temporary.status !== STATUS_DSA.TIMEOUT) {
            throw {
                "message": "Hồ sơ không ở bước kiểm duyệt của AFM!"
            }
        }

        const updated_at = await moment.utc().format()

        const query = ` UPDATE users_temporary
            SET status = '${status}',
            ${status !== `${STATUS_DSA.PASS_AF}` ? `reject_reason_id_af = ${reject_reason_id},note = '${note ? note : ''}',` : ""}
            updated_at = '${updated_at}',
            af_review_id = ${req.user.users_id},
            final_decision = '${FINAL_DECISION.MANUAL}'
            WHERE users_temporary_id = ${users_temporary_id} RETURNING * `


        if (status !== STATUS_DSA.PASS_AF) {
            const checkBlactList = await db.oneOrNone(`select * from reject_reason_af where reject_reason_id = ${reject_reason_id}`)

            if (!checkBlactList
                || checkBlactList.type === RESSON_TYPE.CANCEL && status !== STATUS_DSA.CANCEL
                || checkBlactList.type === RESSON_TYPE.REJECT && status !== STATUS_DSA.REJECT_AF
            ) {
                throw {
                    "message": "Lý do từ chối không hợp lệ!"
                }
            }
            if (checkBlactList.is_aisblacklist === 1) {
                const aisBlacklist = {
                    id_card: users_temporary.id_card,
                    name_user: users_temporary.name_user,
                    birth: users_temporary.birth,
                    phone_number: users_temporary.phone_number,
                    issue_date: users_temporary.issue_date,
                    email: users_temporary.email
                }
                const query = "INSERT INTO ais_blacklist(${this:name}) VALUES(${this:csv}) RETURNING * ";
                await db.one(query, aisBlacklist);

            }
        }

        const data = await db.one(query)
        const updateReq = ` UPDATE dsa_request
        SET
            update_by_user = ${req.user.users_id}
            WHERE dsa_request_id = ${data.dsa_request_id} `

        await db.query(updateReq)
        await RequestDsaController.updateStatusRequest(data.dsa_request_id)

        // await db.query("COMMIT");

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        );
    } catch (e) {
        // await db.query("ROLLBACK");
        res.json(commonResponse(API_CODE.ERROR, e.message, { }, req));
    }
}



// async function UpdateStatusRequest(dsa_request_id) {

//     try {

//         const queryCountUser = `
//     SELECT COUNT(users_temporary_id) FROM (SELECT
//       u.users_temporary_id,d.dsa_request_id
//      FROM
//        dsa_request d LEFT JOIN users_temporary u ON d.dsa_request_id = u.dsa_request_id ) a WHERE a.dsa_request_id = ${dsa_request_id}

//     `

//         const queryCountUserApproved = `
//     SELECT COUNT(users_temporary_id) FROM (SELECT
//       u.users_temporary_id,d.dsa_request_id,u.status
//      FROM
//        dsa_request d LEFT JOIN users_temporary u ON d.dsa_request_id = u.dsa_request_id ) a WHERE a.dsa_request_id = ${dsa_request_id} and  a.status IN ('${statusDsa.PASS_AF}', '${statusDsa.PASS}',${listReject.listReject.map(l => `'${l}'`)})

//     `
//         const queryCountUserReject = `
//     SELECT COUNT(users_temporary_id) FROM (SELECT
//       u.users_temporary_id,d.dsa_request_id,u.status
//      FROM
//        dsa_request d LEFT JOIN users_temporary u ON d.dsa_request_id = u.dsa_request_id ) a WHERE a.dsa_request_id = ${dsa_request_id} and  a.status IN (${listReject.listReject.map(l => `'${l}'`)})
//     `
//         const updated_at = await moment(moment(new Date(), 'DD-MM-YYYY HH:mm')).format('YYYY-MM-DD HH:mm')
//         const a = await db.one(queryCountUserApproved)

//         const b = await db.one(queryCountUser)

//         const c = await db.one(queryCountUserReject)
//         if (a.count === b.count) {
//             const queryUpdateRequest = `UPDATE dsa_request
//       SET status = '${statusDsaRequest.CENSORED}'
//       WHERE dsa_request_id = ${dsa_request_id}
//       `

//             await db.any(queryUpdateRequest)

//         }

//         if (a.count === c.count) {
//             const queryUpdateRequest = `UPDATE dsa_request
//       SET status = '${statusDsaRequest.COMPLETED}', update_at = '${updated_at}' ,
//       WHERE dsa_request_id = ${dsa_request_id}
//       `
//             await db.any(queryUpdateRequest)
//         }

//         if (!a.count === b.count) {
//             const queryUpdateRequest = `UPDATE dsa_request
//       SET status = '${statusDsaRequest.REVIEWING}', update_at = '${updated_at}',
//       WHERE dsa_request_id = ${dsa_request_id}
//       `
//             await db.any(queryUpdateRequest)
//         }
//         await db.query("COMMIT");
//         return UPDATE_STATUS_REQUEST.DONE

//     } catch (e) {
//         await db.query("ROLLBACK");
//         return UPDATE_STATUS_REQUEST.FAIL
//     }
// }

async function SSUpdateNVKD(req, res, next) {
    try {
        const { status, users_temporary_id, reject_reason_id, note } = req.body;
        const users_temporary = await db.oneOrNone(`SELECT u.users_temporary_id, u.dsa_request_id, u."timestamp",u.id_card,u.phone_number, u.status , c.code3p FROM users_temporary u 
    LEFT JOIN users us ON us.users_id = u.users_id
    LEFT JOIN code_3p  c ON us.code_3p_id = c.code_3p_id
    
     WHERE users_temporary_id = ${users_temporary_id}`)
        if (!users_temporary) {
            throw {
                "message": "Hồ sơ không tồn tại!"
            }
        }

        if (users_temporary.status !== STATUS_DSA.NEW) {
            throw { message: "Hồ sơ không ở bước kiểm duyệt của SS!" }
        }

        const updated_at = moment.utc().format()
        const query = ` UPDATE users_temporary
    SET status = '${status}',
    ${status === STATUS_DSA.REJECT_SS ? `reject_reason_id = ${reject_reason_id},note = '${note ? note : ''}',` : ""}
    updated_at = '${updated_at}',
    ss_review_id = ${req.user.users_id},
    final_decision = '${FINAL_DECISION.AUTO}'
    
    WHERE users_temporary_id = ${users_temporary_id} RETURNING *  `

        const updateReq = ` UPDATE dsa_request
        SET
            update_by_user = ${req.user.users_id}
            WHERE dsa_request_id = $1`
    
        const result = await db.tx(async t => {
            const data1 = await db.one(query)
            const data2 = await db.query(updateReq, [data1.dsa_request_id])

            return t.batch([data1, data2])
        })

        if (!(status === STATUS_DSA.REJECT_SS)) {
            //   const queryUpdateRequest = `UPDATE dsa_request
            //   SET update_at = '${updated_at}' ,
            //   update_by_user = '${req.user.users_id}',
            //   status = '${statusDsaNVKD.REVIEWING}'
            //   WHERE dsa_request_id = ${data.dsa_request_id}
            //   `
            // const files = await db.query(`SELECT * FROM "file" WHERE users_temporary_id = ${users_temporary_id}`)

            // const arrFilePIC = []
            // const arrFilePID = []
            // const arrrayFileSFTP = []

            // files.forEach(file => {
            //     // if(!fs.existsSync(process.cwd() + file.url)){ 
            //     //    throw {
            //     //      "message": "Không tìm thấy ảnh "
            //     //    }
            //     // }
            //     if (file.type === 'mandatorySelfie') {
            //         arrFilePIC.push(file.url)
            //     }
            //     if (file.type === 'mandatoryIDImage') {
            //         arrFilePID.push(file.url)
            //     }
            // })

            // arrrayFileSFTP.push(
            //     {
            //         "file_type": "PIC",
            //         "file_name": arrFilePIC
            //     }, {

            //     "file_type": "PID",
            //     "file_name": arrFilePID

            // })
            // // await  arrrayFileSFTP.forEach(element => Loan.uploadImage(element, users_temporary));
            // //   await db.any(queryUpdateRequest)
            // logger("Test SFTP: ", "Gọi Loan.uploadImg", "Thành công!")
            // const promises = arrrayFileSFTP.map(file =>
            //     Loan.uploadImage(file, users_temporary));
            // logger("Test SFTP: ", "gọi uploadImg thành công =))", "Thành công!")

            // Promise.all(promises)
            //     .then(results => {
            //         console.log('all files have been uploaded');
            //         logger("Test SFTP: ", "all files have been uploaded", "Thành công!")
            //         // RequestDsaController.autoCheckDSA(users_temporary.users_temporary_id)
            //     })
            //     .catch(e => {
            //         console.error(e);
            //         logger("Test SFTP: ", e + "", "Lỗi rồi!")
            //         // handle error
            //     });
            
            await RequestDsaController.updateStatusRequest(users_temporary.dsa_request_id)
            RequestDsaController.autoCheckDSA(users_temporary.users_temporary_id)
        } else {
            await RequestDsaController.updateStatusRequest(users_temporary.dsa_request_id)
        }


        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, {}, req)
        );
    } catch (e) {
        console.log(e);
        // await db.query("ROLLBACK");
        res.json(commonResponse(API_CODE.ERROR, e.message + "", {}, req));

    }
}

async function getListReasonRejectSS(req, res, next) {

    try {
        const query = ` SELECT * from reject_reason_ss `
        const data = await db.any(query)

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}

async function getListReasonRejectAF(req, res, next) {
    try {
        const { type } = req.body
        const query = ` SELECT * from reject_reason_af WHERE type = $1`
        const data = await db.any(query, type)

        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, data, req)
        );
    } catch (e) {
        res.json(commonResponse(API_CODE.ERROR, e + "", { }, req));
    }
}



async function createAccount(req, res, next) {
    try {
        const userTemporary = await db.query(`
            SELECT ut.dsa_request_id,
                ut.users_temporary_id,
                ut.users_id,
                ut.created_at,
                ut.name_user,
                ut.birth,
                ut.id_card,
                ut.phone_number,
                ut.work_place,
                ut.email,
                cp.code3p as  code3p,
                cp.name3p as name3p,
                us.username
            FROM users_temporary ut
            LEFT JOIN users us ON us.users_id = ut.users_id
            LEFT JOIN "code_3p" cp ON cp.code_3p_id = us.code_3p_id
            WHERE
            ut.dsa_request_id = ${req.body.dsa_request_id} and ut.status IN(  ${listApproved.map(m => `'${m}'`)}) `

        )

        if (userTemporary.length === 0) {
            throw {
                "message": "Không có hồ sơ nào đã kiểm duyệt!"
            }
        }


        for (let i = 0; i < userTemporary.length; i++) {
            const lastAccountOfDSA = await db.oneOrNone(`
                SELECT account_dsa.account_id,account_dsa.dsa_name,account_dsa.dsa
        
                FROM account_dsa
                where account_dsa.partner_code = '${userTemporary[i].code3p}'
                ORDER  BY  account_dsa.created_at DESC LIMIT 1`
            )
            let newascending
            if (!lastAccountOfDSA) {
                newascending = "D" + userTemporary[i].code3p + String(1).padStart(5, '0')
            } else {

                newascending = "D" + userTemporary[i].code3p + String(Number(lastAccountOfDSA.dsa.replace(/^\D+/g, '')) + 1).padStart(5, '0')
            }



            var pswd = generatePassword(8, [
                { chars: "abcdefghijklmnopqrstuvwxyz", min: 4 },  // As least 4 lowercase letters
                { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", min: 1 },  // At least 1 uppercase letters
                { chars: "0123456789", min: 3 },                  // At least 3 digits
                { chars: "!@#$&*?|%+-_./:;=()[]{}", min: 2 }      // At least 2 special chars
            ]);

            const arr = [
                userTemporary[i].created_at.toISOString(),
                userTemporary[i].code3p,
                userTemporary[i].name_user,
                moment(moment(userTemporary[i].birth, 'DD-MM-YYYY HH:mm:ss')).format('YYYY-MM-DD HH:mm:ss'),
                userTemporary[i].id_card,
                userTemporary[i].phone_number,
                'DSA',
                userTemporary[i].work_place,
                userTemporary[i].email,
                moment.utc().format(),
                newascending,
                pswd,
                moment(moment(userTemporary[i].created_at, 'DD-MM-YYYY HH:mm:ss')).format('YYYY-MM-DD HH:mm:ss'),
                userTemporary[i].users_id,
                req.body.dsa_request_id,
                userTemporary[i].users_temporary_id
            ]

            const result = await db.tx(async t => {
                const data = await db.query(`
                    INSERT INTO account_dsa (
                        time_stamp,
                        partner_code,
                        dsa_name,
                        date_of_birth,
                        id_card,
                        phone_number,
                        position_work,
                        work_place,
                        email,
                        sendit,
                        dsa,
                        pass,
                        date_confirmed_letter,
                        user_id,
                        dsa_request_id,
                        users_temporary_id
                    ) VALUES (${arr.map(a => `'${a}'`)}) returning * `)


                const data2 = await db.query(`UPDATE users_temporary

                    SET updated_at = '${moment.utc().format()}' ,
                    status = '${STATUS_DSA.ACCOUNTGRANTING}'
                    WHERE users_temporary_id = ${userTemporary[i].users_temporary_id}
                `)

                return t.batch([data, data2])
            })
        }
        const updateReq = ` UPDATE dsa_request
        SET
            update_by_user = ${req.user.users_id}
            WHERE dsa_request_id = ${req.body.dsa_request_id} `

        await db.query(updateReq)


        await RequestDsaController.updateStatusRequest(req.body.dsa_request_id)
        res.json(
            commonResponse(API_CODE.SUCCESS, API_CODE.TEXT_SUCCESS, { }, req)
        );
    } catch (e) {
        return res.json(commonResponse(API_CODE.ERROR, e.message + "", { message: "Thành công rồi nhé!" }, req));
    }
}

async function deleteFile(req, res, next) {

    try {
        function isNumeric(value) {
            return /^-?\d+$/.test(value);
        }

        if (!isNumeric(req.query.id)) {
            throw {
                "message": "id must be a number"
            }
        }

        const file = await db.oneOrNone(` select * from file_temporary_save where "fileid" = ${req.query.id}`);

        if (!file) {
            throw {
                "message": "file not found"
            }
        }
        if (!fs.existsSync(file.url)) {
            fs.rmdirSync(file.url, { recursive: true });
            fs.rmdirSync(`./${file.url}`, { recursive: true });

            await db.query(` delete from file_temporary_save where "fileid" = ${req.query.id}`);
            return res.json(commonResponse(API_CODE.SUCCESS, API_CODE.ERROR, "SUCCESS"))
        }
        else {

            return res.json(commonResponse(API_CODE.ERROR, API_CODE.ERROR, "Không tìm thấy file"))

        }


    } catch (error) {
        return res.json(commonResponse(API_CODE.ERROR, API_CODE.ERROR, error.message))
    }

}
async function generatePassword(length, rules) {
    if (!length || length == undefined) {
        length = 8;
    }

    if (!rules || rules == undefined) {
        rules = [
            { chars: "abcdefghijklmnopqrstuvwxyz", min: 3 },  // As least 3 lowercase letters
            { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", min: 2 },  // At least 2 uppercase letters
            { chars: "0123456789", min: 2 },                  // At least 2 digits
            { chars: "!@#$&*?|%+-_./:;=()[]{}", min: 1 }      // At least 1 special char
        ];
    }

    var allChars = "", allMin = 0;
    rules.forEach(function (rule) {
        allChars += rule.chars;
        allMin += rule.min;
    });
    if (length < allMin) {
        length = allMin;
    }
    rules.push({ chars: allChars, min: length - allMin });

    var pswd = "";
    rules.forEach(function (rule) {
        if (rule.min > 0) {
            pswd += shuffleString(rule.chars, rule.min);
        }
    });

    return shuffleString(pswd);
}

async function shuffleString(str, maxlength) {
    var shuffledString = str.split('').sort(function () { return 0.5 - Math.random() }).join('');
    if (maxlength > 0) {
        shuffledString = shuffledString.substr(0, maxlength);
    }
    return shuffledString;
} function generatePassword(length, rules) {
    if (!length || length == undefined) {
        length = 8;
    }

    if (!rules || rules == undefined) {
        rules = [
            { chars: "abcdefghijklmnopqrstuvwxyz", min: 3 },  // As least 3 lowercase letters
            { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", min: 2 },  // At least 2 uppercase letters
            { chars: "0123456789", min: 2 },                  // At least 2 digits
            { chars: "!@#$&*?|%+-_./:;=()[]{}", min: 1 }      // At least 1 special char
        ];
    }

    var allChars = "", allMin = 0;
    rules.forEach(function (rule) {
        allChars += rule.chars;
        allMin += rule.min;
    });
    if (length < allMin) {
        length = allMin;
    }
    rules.push({ chars: allChars, min: length - allMin });

    var pswd = "";
    rules.forEach(function (rule) {
        if (rule.min > 0) {
            pswd += shuffleString(rule.chars, rule.min);
        }
    });

    return shuffleString(pswd);
}

function shuffleString(str, maxlength) {
    var shuffledString = str.split('').sort(function () { return 0.5 - Math.random() }).join('');
    if (maxlength > 0) {
        shuffledString = shuffledString.substr(0, maxlength);
    }
    return shuffledString;
}
// async function readFileFromAWS(req, res) {

//     console.log(req.body)
//     const { fileName } = req.body;
//     console.log(fileName)
//     if (!fileName) {
//         res.json(
//             commonResponse(API_CODE.ERROR, 'Không tìm thấy file', {}, req)
//         );
//     } else {

//             let params = {
//                 Bucket: "ms-los-ap-southeast-1-446567516155-document",
//                 Key: "dsa-mobile-app" + fileName,
//             };
//             console.log(params)
//             let result   = await  s3.getObject(params, function (err, data) {
//                 if (err) {
//                     console.log("Get file error ", err);
//                     reject(err);
//                 } else {
//                     console.log(data.body);
//                     console.log("Read file successful ");
//                     const body = Buffer.from(data.Body).toString("base64");
//                     return body;
//                 }
//             });

//         console.log(result)
//         res.json(
//             commonResponse(API_CODE.SUCCESS, 'success', result, req)
//         );
//     }

// }

async function readFileFromAWS(fileName) {
    return new Promise(function (resolve, reject) {
        let params = {
            Bucket: "ms-los-ap-southeast-1-446567516155-document",
            Key: "dsa-mobile-app" + fileName,
        };

        s3.getObject(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                // console.log("Read file successful ");
                const body = Buffer.from(data.Body).toString("base64");
                resolve(body);
            }
        });
    });
}

async function readFileBufferFromAWS(fileName) {
    return new Promise(function (resolve, reject) {
        let params = {
            Bucket: "ms-los-ap-southeast-1-446567516155-document",
            Key: "dsa-mobile-app" + fileName,
        };

        s3.getObject(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                const body = Buffer.from(data.Body)
                resolve(body);
            }
        });
    });
}

module.exports = {
    creatNVKD,
    getDetailNVKDFor3P,
    getDetailNVKDForSS,
    creatMultiNVKD,
    getDetailNVKDFor3P,
    AFUpdateNVKD,
    SSUpdateNVKD,
    getListReasonRejectSS,
    getListReasonRejectAF,
    getRequestFor3p,
    getRequestForSS,
    getListNVKDForAF,
    getDetailNVKDForAF,
    createAccount,
    saveNVKD,
    saveMultiNVKD,
    getsaveNVKD,
    getsaveMultiNVKD,
    deleteFile,
    readFileFromAWS,
    uploadFileFromAWS,
    uploadMultiFileFromAWS,
    readFileBufferFromAWS
};