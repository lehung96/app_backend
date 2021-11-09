const multer = require("multer");
const path = require('path');
const fs = require('fs')
const excelFilter = (req, file, cb) => {
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
};

var storage = multer.diskStorage({
    
  destination: (req, file, cb) => {
     if (file.fieldname === "excel") {
            const exists = fs.existsSync('./uploads/excel/');
            if (!exists) {
              fs.mkdirSync('./uploads/excel/', { recursive: true });
            }
            cb(null, './uploads/excel/')
        }

  },
  filename: (req, file, cb) => {

    cb(null, `${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage, fileFilter: excelFilter });
module.exports = uploadFile;