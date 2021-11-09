const moment = require("moment");
const jwt = require('jsonwebtoken');
const fs = require('fs') ;
const pathToKeys ='config/jwtRS256.prod.key';
const { decode } = require("querystring");
const yup = require('yup')
const { commonResponse } = require("./../models/Response");
module.exports = {
    getStandardResponse,
    getErrorMsgExist,
    getErrorMsgNotExist,
    getErrorMsgNotActive,
    getErrorMsgIncorrect,
    getDateTimeNow,
    getPagination,
    getPagingData,
    getParseInt,
    decodeToken,
    generateRefreshToken,
    generateUserToken,
    getError,
    validateDSAInput,
    objectToString,
    stringToObject,
    getMessageResult
};

function getStandardResponse(errorCode, errorMessage, result) {
    return {
        errorCode,
        errorMessage,
        result: result || {},
    };
}

function getErrorMsgExist(data) {
    return `${data} đã tồn tại`;
}

function getErrorMsgNotExist(data) {
    return `${data} không tồn tại`;
}

function getErrorMsgNotActive(data) {
    return `${data} đã bị khóa`;
}

function getErrorMsgIncorrect(data) {
    return `${data} không chính xác`;
}

function getError() {
  return `hết phiên đăng nhập`;
}

function getDateTimeNow() {
    return moment().format("YYYY-MM-DD HH:mm:ss");
}

function objectToString(obj) {
    try {
        return JSON.stringify(obj)
    } catch (error) {
        return "Lỗi hệ thống: Không thể chuyển object thành string!"
    }
}

function stringToObject(json) {
    try {
        return JSON.parse(json)
    } catch (error) {
        console.log("Lỗi parse rồi: ", error);
        return null
    }
}

function getMessageResult(json) {
    try {
        return stringToObject(json).result
    } catch (error) {
        return null
    }
}

function getPagination(page, size) {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
}

function getParseInt(value) {
    if (!isNaN(value)) {
        return parseInt(value);
    }

    return null;
}

function getPagingData(dataList, totalItems, page, limit) {
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, dataList, totalPages, currentPage };
}


function validateDSAInput(data) {
  const schema = yup.object().shape({
    excel_index: yup.number(),
    phone_number: yup
      .string()
      .max(10)
      .matches(/^$|^[0][0-9]+$/, 'Số điện thoại không đúng định dạng').test('len', 'Số điện thoại phải là 10 chữ số', val => val.toString().length === 10).required(),
    name_user: yup.string().required().typeError('tên NVKD là bắt buộc'),
    birth: yup.string().required().typeError('Ngày sinh không đúng định dạng '),
    id_card: yup.string().matches(/^[0-9]+$/, "Must be only digits").test('len', 'số CMND/CCCD phải có 9 hoặc 12 chữ số ', val => val.toString().length === 12 || val.toString().length === 9 ).required(),
    issue_date: yup.string().required().typeError('Ngày cấp không đúng định dạng '),
    issue_place: yup.string().required().typeError('Nơi cấp không đúng định dạng '),
    permanent_address: yup.string().required().typeError('Địa chỉ thường trú không đúng định dạng '),
    address: yup.string().required().typeError('Địa chỉ hiện tại không đúng định dạng '),
    position_user: yup.string().required().typeError('Vị trí làm việc không đúng định dạng '),
    work_place: yup.string().required().typeError('Nơi làm  việc không đúng định dạng '),
    email: yup.string().email().required().typeError('Email không đúng định dạng '),
    direct_report_line: yup.string().required().typeError('Quản lý trực tiếp không đúng định dạng '),
    title_of_direct_report_line: yup.string().required().typeError('Chức vụ quản lý trực tiếp không đúng định dạng '),
    phone_of_direct_report_line: yup
      .string()
      .max(10)
      .matches(/^$|^[0][0-9]+$/, 'Số điện thoại không đúng định dạng'),
    email_of_direct_report_line: yup.string().email().required().typeError('Email quản lý trực tiếp không đúng định dạng '),
    contract_duration: yup.string().required().typeError('Thời hạn hợp đồng không đúng định dạng '),
  });

  schema.validateSync(data);
};
function generateUserToken (payload) {
  const privateKey = fs.readFileSync(pathToKeys, 'utf8');
      return jwt.sign(payload, privateKey, {
        expiresIn: process.env.JWT_ID_TOKEN_EXPIRES,
        algorithm: 'RS256',
      });
};
  
  function generateRefreshToken (payload) {
    return jwt.sign(payload, privateKey, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES,
      algorithm: 'RS256',
    });
  };
  
  async function decodeToken (token) {
    const publicKey = fs.readFileSync(pathToKeys + '.pub', 'utf8')
    try {
      return jwt.verify(
        token,
        publicKey,
        { algorithm: 'RS256'},
        (error, decoded) => {
          if (error) {
            throw error;
          }
          return decoded;
        },
      );
    } catch(e){
     throw "Unauthorized"
    }
    
  };