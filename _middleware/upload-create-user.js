const path = require('path');
const multer = require('multer');
const fs = require("fs")
const util = require("util");
var latinize = require('latinize');
const logger = require("../logger/index");

const storage = multer.diskStorage({
 
    destination: (req, file, cb) => {
        try {
            if (!fs.existsSync('./uploads')) {
                fs.mkdirSync('./uploads');
            }
            const folder = `./uploads/${req.user.code3p}_` + req.timestamp
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }

            if (file.fieldname === "excel") {
                cb(null, folder)
            } else
                if (file.fieldname === "mandatoryConfirmation") {

                    cb(null, folder);
                } else
                    if (file.fieldname === "optionalOthers") {

                        cb(null, folder)
                    } else
                        if (file.fieldname === "mandatoryIDImage") {

                            cb(null, folder)
                        } else
                            if (file.fieldname === "mandatorySelfie") {

                                cb(null, folder)
                            }
        } catch (error) {
            throw error
        }


    },
    filename: (req, file, cb) => {
        try {
            if (file.fieldname === "excel") {
          
                cb(null, file.originalname);
            } else
                if (file.fieldname === "mandatoryConfirmation") {
                    cb(null, file.originalname);
                } else
                    if (file.fieldname === "optionalOthers") {
                        cb(null, file.originalname);
                    } else
                        if (file.fieldname === "mandatoryIDImage") {

                            cb(null, file.originalname);
                        } else
                            if (file.fieldname === "mandatorySelfie") {
                                cb(null, file.originalname);
                            }
        } catch (error) {
            throw error
        }


    }
});



const storageSave = multer.diskStorage({

    destination: (req, file, cb) => {
        try {

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

            if (file.fieldname === "excel") {
                cb(null, folder)
            } else
                if (file.fieldname === "mandatoryConfirmation") {

                    cb(null, folder);
                } else
                    if (file.fieldname === "optionalOthers") {

                        cb(null, folder)
                    } else
                        if (file.fieldname === "mandatoryIDImage") {

                            cb(null, folder)
                        } else
                            if (file.fieldname === "mandatorySelfie") {

                                cb(null, folder)
                            }
        } catch (error) {
            throw error
        }


    },
    filename: (req, file, cb) => {
        try {
            if (file.fieldname === "excel") {
          
                cb(null, file.originalname);
            } else
                if (file.fieldname === "mandatoryConfirmation") {
                    cb(null, file.originalname);
                } else
                    if (file.fieldname === "optionalOthers") {
                        cb(null, file.originalname);
                    } else
                        if (file.fieldname === "mandatoryIDImage") {

                            cb(null, file.originalname);
                        } else
                            if (file.fieldname === "mandatorySelfie") {
                                cb(null, file.originalname);
                            }
        } catch (error) {
            throw error
        }


    }
});

const storageSaveMulti = multer.diskStorage({

    destination: (req, file, cb) => {
        try {
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

            if (file.fieldname === "excel") {
                cb(null, folder)
            } else
                if (file.fieldname === "mandatoryConfirmation") {

                    cb(null, folder);
                } else
                    if (file.fieldname === "optionalOthers") {

                        cb(null, folder)
                    } else
                        if (file.fieldname === "mandatoryIDImage") {

                            cb(null, folder)
                        } else
                            if (file.fieldname === "mandatorySelfie") {

                                cb(null, folder)
                            }
        } catch (error) {
            throw error
        }


    },
    filename: (req, file, cb) => {
        try {
            if (file.fieldname === "excel") {
         
                cb(null, file.originalname);
            } else
                if (file.fieldname === "mandatoryConfirmation") {
                    cb(null, file.originalname);
                } else
                    if (file.fieldname === "optionalOthers") {
                        cb(null, file.originalname);
                    } else
                        if (file.fieldname === "mandatoryIDImage") {

                            cb(null, file.originalname);
                        } else
                            if (file.fieldname === "mandatorySelfie") {
                                cb(null, file.originalname);
                            }
        } catch (error) {
            throw error
        }


    }
});


const uploadMultiSave = multer({

    storage: storageSaveMulti
}).fields(
    [
        {
            name: 'excel',
            maxCount: 1
        },
        {
            name: 'mandatoryConfirmation', maxCount: 1
        },
        {
            name: 'optionalOthers', maxCount: 1
        },
        {
            name: 'mandatoryIDImage', maxCount: 60
        },
        {
            name: 'mandatorySelfie', maxCount: 30
        }
    ]
);

const uploadSave = multer({

    storage: storageSave

}).fields(
    [
        {
            name: 'mandatoryConfirmation', maxCount: 1
        },
        {
            name: 'optionalOthers', maxCount: 1
        },
        {
            name: 'mandatoryIDImage', maxCount: 2
        },
        {
            name: 'mandatorySelfie', maxCount: 1
        }
    ]
);





const uploadMulti = multer({

    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    },
    storage: storage
}).fields(
    [
        {
            name: 'excel',
            maxCount: 1
        },
        {
            name: 'mandatoryConfirmation', maxCount: 1
        },
        {
            name: 'optionalOthers', maxCount: 1
        },
        {
            name: 'mandatoryIDImage', maxCount: 60
        },
        {
            name: 'mandatorySelfie', maxCount: 30
        }
    ]
);



const upload = multer({
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    },
    storage: storage

}).fields(
    [
        {
            name: 'mandatoryConfirmation', maxCount: 1
        },
        {
            name: 'optionalOthers', maxCount: 1 
        },
        {
            name: 'mandatoryIDImage', maxCount: 2
        },
        {
            name: 'mandatorySelfie', maxCount: 1
        }
    ]
);
function checkFileType(file, cb) {

    if (file.fieldname === "excel") {
        if (
            file.mimetype.includes("excel") ||
            file.mimetype.includes("spreadsheetml")
        ) {
            cb(null, true);
        } else {
            cb("Please upload only excel file.", false);
        }
    }
    if (file.fieldname === "mandatorySelfie" || file.fieldname === "mandatoryIDImage" || file.fieldname === "optionalOthers") {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'application/pdf'
        ) { // check file type to be png, jpeg, or jpg
            cb(null, true);
        } else {
            cb('check file type to be png, jpeg, or jpg', false); // else fails
        }
    }
    if (file.fieldname === "mandatoryConfirmation") {
        if (
            file.mimetype === 'application/pdf'
        ) { // check file type to be png, jpeg, or jpg
            cb(null, true);
        } else {
            cb("Please upload only pdf file.", false); // else fails
        }
    }
}

module.exports = { upload, uploadMulti, uploadMultiSave, uploadSave }