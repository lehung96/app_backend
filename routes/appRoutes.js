const Joi = require("joi").extend(require("@joi/date"));
const NotificationController = require("../controllers/NotificationController");
const UsersController = require("../controllers/UsersController");
const { authenticate, validateFileUpload, authenticateForWeb } = require("../_middleware/authorize");
const validate = require("../_middleware/validate");
const RoleController = require("../controllers/RoleController");
const RequestDsaController = require("../controllers/RequestDsaController");
const AddressController = require("../controllers/AddressController");
const DSAcontroller = require("../controllers/DSAController");
const fs = require("fs")
const { commonResponse } = require("../models/Response");
const logger = require("../logger/index")
require("../_helpers/job")
const {

    API_CODE

} = require("../_helpers/constants");

const { upload, uploadMulti, uploadSave, uploadMultiSave } = require('../_middleware/upload-create-user');
const { db } = require("../database/db");
const LoanController = require("../controllers/LoanController");
module.exports = function (app) {
    const Test = require("../controllers/HelloController");
    const Login = require("../controllers/LoginController");
    const Product = require("../controllers/ProductController");
    const Loan = require("../controllers/LoanController");
    const Customers = require("../controllers/CustomersController");
    const Offer = require("../controllers/OfferController");
    const Status = require("../controllers/StatusController");
    const OK = require("../controllers/OKController");
    const Notification = require("../controllers/NotificationController");
    const EmailController = require("../controllers/EmailController");
    const authenticateJWT = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            // const token = authHeader.split(' ')[1];
            // jwt.verify(token, accessTokenSecret, (err, user) => {
            //     if (err) {
            //         return res.sendStatus(403);
            //     }
            next();
            // });
        } else {
            res.sendStatus(401);
        }
    };

    app.param(["ProductId"], function (req, res, next) {
        req.ProductId = req.params.ProductId;
        next();
    });

    app.param(["RequestId"], function (req, res, next) {
        req.RequestId = req.params.RequestId;
        next();
    });

    app.route("/").get(Test.welcome);

    app.route("/dsa/v1/login").post(Login.login);
    app.post("/dsa/v1/getToken", Login.getToken);



    // app.route('/dsa/v1/product/getProductField/:ProductId', authenticateJWT).get(Product.getProductField)
    app.post(
        "/dsa/v1/product/getProductField",
        authenticateJWT,
        Product.getProductField
    );

    // app.route('/dsa/v1/product/getProductList', authenticateJWT).get(Product.getProductList)
    app.post(
        "/dsa/v1/product/getProductList",
        authenticateJWT,
        Product.getProductList
    );

    // app.route('/dsa/v1/product/checkEligible').post(Product.checkEligible)
    app.post(
        "/dsa/v1/product/checkEligible",
        authenticateJWT,
        Product.checkEligible
    );

    // app.route('/customers/:id').get(Customers.getCustomer)
    app.get("/dsa/v1/customers/:id", authenticateJWT, Customers.getCustomer);

    // app.route('/loan').get(Loan.getLoanInfo).post(Loan.receiveLoanInfo)
    app.get("/dsa/v1/loan", authenticateJWT, Loan.getLoanInfo);
    app.post("/dsa/v1/loan", authenticateJWT, Loan.receiveLoanInfo);

    // app.route('/loan/:id').get(Loan.getLoan)
    app.get("/dsa/v1/loan/:id", authenticateJWT, Loan.getLoan);

    // app.route('/loan/customer/:id').get(Loan.getCustomerLoan)
    app.get("/dsa/v1/loan/customer/:id", authenticateJWT, Loan.getCustomerLoan);

    // app.route('/loan/docs/:id').get(Loan.getLoanDocs).post(Loan.updateLoanDocs)
    app.get('/dsa/v1/loan/docs/:id', authenticateJWT, Loan.getLoanDocs)
    app.post('/dsa/v1/loan/docs/:id', authenticateJWT, Loan.updateLoanDocs)

    // app.route('/loan/search').post(Loan.search)
    app.post("/dsa/v1/loan/search", authenticateJWT, Loan.search);

    // app.route('/customers').get(Customers.getCustomers)
    app.get("/dsa/v1/customers", authenticateJWT, Customers.getCustomers);

    // app.route('/customers/search').post(Customers.search)
    app.post("/dsa/v1/customers/search", authenticateJWT, Customers.search);

    // app.route('/customers/:id').get(Customers.getCustomer)
    app.get("/dsa/v1/customers/:id", authenticateJWT, Customers.getCustomer);

    // get offer
    // app.route('/dsa/v1/getOffer/:RequestId').get(Offer.getOffer)
    app.post("/dsa/v1/getOffer", authenticateJWT, Offer.getOffer);

    app.post("/dsa/v1/selectOffer", authenticateJWT, Offer.selectOffer);

    // app.route('/dsa/v1/updateStatus').post(Status.updateStatus)
    app.post("/dsa/v1/updateStatus", Status.updateStatus);

    app.get(
        "/dsa/v1/healthcheck",
        require("express-healthcheck")({
            healthy: function () {
                return { everything: "is ok" };
            },
        })
    );

    app.use((req, res, next) => {
        try {
            req.timestamp = new Date().getTime()
            logger(req.url, req.body, "Request", "info", req)
            next()
        } catch (error) {
            console.log(error);
            next()
        }
    })

    /*================================== API User =================================== */
    /*=============================================================================== */
    //Api đăng ký user
    app.post(
        "/dsa/v2/registerUser",
        authenticateForWeb,
        validate.registerUserApiSchema,
        UsersController.registerUser
    );

    //Api tạo tài khoản cho 3P
    app.post(
        "/dsa/v2/registerUser3P",
        authenticateForWeb,
        validate.registerUser3PApiSchema,
        UsersController.registerUser3P
    )

    //Api lấy danh sách mã đối tác cho đăng ký tài khoản 3P
    app.post(
        "/dsa/v2/getListCode3P",
        authenticate,
        validate.getListCode3PApiSchema,
        UsersController.getListCode3P
    )

    //Api đăng nhập
    app.post(
        "/dsa/v2/loginUser",
        validate.loginUserApiSchema,
        UsersController.loginUser
    );

    //Api đăng xuất tài khoản
    app.post(
        "/dsa/v2/logoutUser",
        authenticate,
        validate.logoutUserApiSchema,
        UsersController.logoutUser
    );

    //Api đổi mật khẩu user
    app.post(
        "/dsa/v2/changePassword",
        authenticateForWeb,
        validate.changePasswordApiSchema,
        UsersController.changePassword
    );

    //Api đổi mật khẩu user bởi Admin
    app.post(
        "/dsa/v2/adminChangePassword",
        authenticateForWeb,
        validate.adminChangePasswordApiSchema,
        UsersController.adminChangePassword
    );

    app.post('/dsa/v2/createMultiNVKD', authenticateForWeb, validateFileUpload, uploadMulti, DSAcontroller.creatMultiNVKD);
    app.post('/dsa/v2/getDetail3PDSAFor3P', authenticateForWeb, validate.getDatailNVKDApiSchema, DSAcontroller.getDetailNVKDFor3P);
    app.post('/dsa/v2/getDetail3PDSAForSS', authenticateForWeb, validate.getDatailNVKDApiSchema, DSAcontroller.getDetailNVKDForSS);
    app.post('/dsa/v2/getListRequestforSS', authenticateForWeb, validate.getListRequestApiSchema, DSAcontroller.getRequestForSS);
    app.post('/dsa/v2/getListRequestfor3P', authenticateForWeb, validate.getListRequestApiSchema, DSAcontroller.getRequestFor3p);
    app.post('/dsa/v2/getListNVKDforAF', authenticateForWeb, validate.getListRequestApiSchema, DSAcontroller.getListNVKDForAF);
    app.post('/dsa/v2/getDetailNVKDforAF', authenticateForWeb, validate.getDatailForAFNVKDApiSchema, DSAcontroller.getDetailNVKDForAF);
    app.post('/dsa/v2/getListReasonRejectSS', authenticateForWeb, DSAcontroller.getListReasonRejectSS);
    app.post('/dsa/v2/getListReasonRejectAF', authenticateForWeb, DSAcontroller.getListReasonRejectAF);
    app.post('/dsa/v2/afupdateStatusNVKD', authenticateForWeb, validate.AFupdateNVKDApiSchema, DSAcontroller.AFUpdateNVKD);
    app.post('/dsa/v2/ssupdateStatusNVKD', authenticateForWeb, validate.SSupdateNVKDApiSchema, DSAcontroller.SSUpdateNVKD);
    app.post('/dsa/v2/createNVKD', authenticateForWeb, validateFileUpload, upload, DSAcontroller.creatNVKD);
    app.post('/dsa/v2/saveNVKD', authenticateForWeb, validateFileUpload, uploadSave,  DSAcontroller.saveNVKD);
    app.post('/dsa/v2/saveMultiNVKD', authenticateForWeb, validateFileUpload, uploadMultiSave, DSAcontroller.saveMultiNVKD);
    app.post('/dsa/v2/getSaveNVKD', authenticateForWeb, DSAcontroller.getsaveNVKD);
    app.post('/dsa/v2/getSaveMultiNVKD', authenticateForWeb, DSAcontroller.getsaveMultiNVKD);
    app.post('/dsa/v2/uploadImageTest', authenticateForWeb, Loan.uploadImage);
    app.post('/dsa/v2/uploadFileFromAWS', authenticate, upload, DSAcontroller.uploadFileFromAWS);
    app.post('/dsa/v2/uploadMultiFileFromAWS', authenticate, uploadMultiSave, DSAcontroller.uploadMultiFileFromAWS);
    app.post('/dsa/v2/requestAccount', authenticateForWeb, validate.SSCreateAccountApiSchema, DSAcontroller.createAccount);
    app.post('/dsa/v2/readFileAWS', authenticate, async function (req, res) {
        try {
            const { fileName } = req.body;

            if (!fileName) {
                res.json(
                    commonResponse(API_CODE.ERROR, 'Không tìm thấy file', {}, req)
                );
    
            } else {
                let result = await DSAcontroller.readFileFromAWS(fileName);
               
                res.json(
                    commonResponse(API_CODE.SUCCESS, 'success', result, req)
                );
            }
        }catch (e) {
            res.json(
                commonResponse(API_CODE.ERROR, e.message, {}, req)
            );
        }
       
    });
    // app.get("/download", async function (req, res) {
    //     console.log(req.query)
    //     let file = (await __dirname + '/../' + req.query.url)
    //     res.download(file);
    // });


    app.post("/dsa/v2/delete", authenticate, DSAcontroller.deleteFile);


    // app.get("/dowload", (req, res) => {
    //     res.sendFile(path.join(__dirname, "./uploads/image.png"));
    // });


    // app.post("/dsa/v2/sendMail", EmailController.sendMail);
    //Api giải mã password của 3P 
    app.post(
        "/dsa/v2/readPassWordUser",
        authenticateForWeb,
        validate.readPassWordUserApiSchema,
        UsersController.readPassWordUser
    );

    //Api quên mật khẩu user
    app.post(
        "/dsa/v2/forgotPassword",
        validate.forgotPasswordApiSchema,
        UsersController.forgotPassword
    );

    //Api đổi mật khẩu khi quên mật khẩu hoặc đăng nhập lần đầu
    app.post(
        "/dsa/v2/forgotAndChangePassword",
        validate.forgotAndChangePasswordApiSchema,
        UsersController.forgotAndChangePassword
    );

    //Api lấy danh sách User
    app.post(
        "/dsa/v2/getListUser",
        authenticateForWeb,
        validate.getListUserApiSchema,
        UsersController.getListUser
    );

    //Api lấy thông tin chi tiết của 1 user
    app.post(
        "/dsa/v2/getUserInfo",
        authenticate,
        validate.getUserInfoApiSchema,
        UsersController.getUserInfo
    );

    //Api khoá và mở khoá user
    app.post(
        "/dsa/v2/changeStatus",
        authenticateForWeb,
        validate.changeStatusApiSchema,
        UsersController.changeStatus
    );

    //Api xuất danh sách tài khoản 3P
    app.post(
        "/dsa/v2/exportAccount3P",
        authenticateForWeb,
        validate.exportAccount3PApiSchema,
        UsersController.exportAccount3P
    );

    /*================================== API Thông báo =================================== */
    /*=================================================================================== */

    //app.post("/dsa/v2/sendNotification", Notification.sendNotification);

    //Api lấy danh sách thông báo
    app.post(
        "/dsa/v2/getListNotification",
        authenticate,
        validate.getListNotificationApiSchema,
        NotificationController.getListNotification
    );

    //Api lấy chi tiết thông báo
    app.post(
        "/dsa/v2/getDetailNotification",
        authenticate,
        validate.getDetailNotificationApiSchema,
        NotificationController.getDetailNotification
    );

    //Api cập nhật token firebase để gửi thông báo
    app.post(
        "/dsa/v2/updateTokenFirebase",
        authenticateJWT,
        validate.updateTokenFirebaseApiSchema,
        Login.updateTokenFirebase
    );


    /*================================== API Phân quyền =================================== */
    /*=================================================================================== */

    //Api lấy danh sách Group Role và Role cho chức năng tạo mới user
    app.post(
        "/dsa/v2/getListGroupRoleForCreatUser",
        authenticate,
        UsersController.getListGroupRoleForCreatUser
    );

    //Api lấy danh sách Group Role và Role theo cấp cho màn phân quyền
    app.post(
        "/dsa/v2/getListGroupRole",
        authenticateForWeb,
        RoleController.getListGroupRole
    );

    //Api lấy danh sách Group Role cho ô select
    app.post(
        "/dsa/v2/getListGroupRoleForGetListUser",
        authenticate,
        UsersController.getListGroupRoleForGetListUser
    );

    //Api lấy danh sách api được gọi của 1 user
    app.post(
        "/dsa/v2/getListApi",
        authenticate,
        validate.getListApiSchema,
        RoleController.getListApi
    );

    //Api lấy danh sách function của 1 Role
    app.post(
        "/dsa/v2/getListFunction",
        authenticateForWeb,
        validate.getListFunctionSchema,
        RoleController.getListFunction
    );

    //Api lấy danh sách function của user đang đăng nhập
    app.post(
        "/dsa/v2/getListFunctionForCheckPermissions",
        authenticate,
        RoleController.getListFunctionForCheckPermissions
    );

    //Api cập nhật quyền cho 1 Role
    app.post(
        "/dsa/v2/updateRoleFunction",
        authenticateForWeb,
        validate.updateRoleFunctionSchema,
        RoleController.updateRoleFunction
    );

    //API get list tab function
    app.post(
        "/dsa/v2/getListGroupFunction",
        authenticateForWeb,
        RoleController.getListGroupFunction
    )

    //API get list level
    app.post("/dsa/v2/getListLevel",
        authenticateForWeb,
        RoleController.getListLevel
    )

    //Api tạo mới một Group Role hoặc Role
    app.post(
        "/dsa/v2/createGroupRole",
        authenticateForWeb,
        validate.createGroupRoleSchema,
        RoleController.createGroupRole
    );


    /*==================================API request DSA=================================== */
    /*==================================================================================== */

    //API get request DSA
    app.post("/dsa/v2/getListRequestFor3P",
        authenticateForWeb,
        validate.getListUserApiSchema,
        authenticate, RequestDsaController.getListRequestFor3P
    )

    //API get detail request DSA
    app.post("/dsa/v2/getDetailRequestFor3P",
        authenticateForWeb,
        RequestDsaController.getDetailRequestFor3P
    )

    //API xuất file excel cho SS
    app.post("/dsa/v2/exportRequestDSA",
        authenticateForWeb,
        RequestDsaController.exportRequestDSA
    )

    //API xuất file excel theo khoảng thời gian cho SS exportRequestDSAByDateForAF
    app.post("/dsa/v2/exportRequestDSAByDate",
        authenticateForWeb,
        validate.exportRequestDSAByDateSchema,
        RequestDsaController.exportRequestDSAByDate
    )

    //API xuất file excel theo khoảng thời gian cho AF
    app.post("/dsa/v2/exportRequestDSAByDateForAF",
        authenticateForWeb,
        validate.exportRequestDSAByDateSchema,
        RequestDsaController.exportRequestDSAByDateForAF
    )

    //API xuất file excel cho 3P
    app.post("/dsa/v2/exportRequestDSAFor3P",
        authenticateForWeb,
        RequestDsaController.exportRequestDSAFor3P
    )

    //API gửi tài khoản bởi SS
    app.post("/dsa/v2/sendAccountDSA",
        authenticateForWeb,
        RequestDsaController.sendAccountDSA
    )

    //API cập nhật noteAF
    app.post("/dsa/v2/updateNoteAF",
        authenticateForWeb,
        validate.updateNoteAFSchema,
        RequestDsaController.updateNoteAF
    )

    app.post("/dsa/v2/getAllPartnerCode",
        authenticateForWeb,
        RequestDsaController.getAllPartnerCode
    )
    //Note
    //Api upload 1 file
    // app.post(
    //     "/upload", 
    //     upload.single("file"), 
    //     controller.upload
    // );

    /*==================================API Address=================================== */
    /*================================================================================ */

    //API get Province
    app.post("/dsa/v2/getProvince",
        authenticate,
        AddressController.getProvince
    )

    //API get getDistrict
    app.post("/dsa/v2/getDistrict",
        authenticate,
        AddressController.getDistrict
    )

    //API get getWard
    app.post("/dsa/v2/getWard",
        authenticate,
        AddressController.getWard
    )
};