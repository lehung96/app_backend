module.exports = function (forgotPasswordUrl, user) {
    return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta charset="UTF-8" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport" />
            <title>Mail template</title>
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700;1,800&display=swap" rel="stylesheet" />
            <style type="text/css">
                img {
                    max-width: 100%;
                }
                a {
                    text-decoration: none;
                }
                #main1 a {
                    color: #000;
                }
                @media screen and (max-width: 991px) {
                    #download-app-title {
                        font-size: 20px !important;
                    }
                    #download-app img {
                        width: 120px !important;
                    }
                }
                @media screen and (max-width: 767px) {
                    body {
                        width: 100vw !important;
                    }
                    #main1 {
                        width: 100% !important;
                        padding: 20px 20px 0px 20px !important;
                    }
                    #main2 {
                        width: 100% !important;
                        padding: 20px 20px 0px 20px !important;
                    }
                    #main-text {
                        font-size: 15px !important;
                    }
                    #footer-dk {
                        width: 100% !important;
                        font-size: 15px !important;
                    }
                    #footer-title {
                        font-size: 16px !important;
                    }
                    #footer-end {
                        font-size: 15px !important
                    }
                }

                @media screen and (max-width: 500px) {
                    #footer {
                        bottom: unset !important;
                    }
                }
            </style>
        </head>
        <body style="font-family: 'Open Sans', sans-serif; margin: 0 auto; color: #333333; font-size: 16px; max-width: 100%; min-height: 100vh; position: relative;">
        
        <table id="main2" width="560px" bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" style="padding: 25px 0px 300px; width: 560px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 10px 0 30px 0;">
                    <table id="order-total" width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr width="100%">
                            <td style="text-align: center;font-weight: bold;font-size: 20px;color: #ec1f26;">B???n v???a y??u c???u qu??n m???t kh???u!</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding-bottom: 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td id="body-text" style="text-align: left;font-size: 19px; font-weight: 400; color: #2E2E2E;">
                                Xin ch??o b???n, <br />
                                T??i kho???n <span style="color: #ec1f26;">${user.username}</span> c???a b???n v???a y??u c???u qu??n m???t kh???u. <br />
                                N???u y??u c???u n??y l?? c???a b???n h??y nh???n <i><a href=${forgotPasswordUrl} style="text-decoration: none; color: rgb(13, 146, 194);">t???i ????y</a></i> ????? qu??n m???t kh???u. <br />
                                N???u b???n kh??ng y??u c???u qu??n m???t kh???u h??y b??? qua email n??y!
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
           
            <tr>
                <td style="font-size: 14px; padding: 10px 0px; font-weight:600;">
                    <i>M???i th???c m???c v?? g??p ??, kh??ch h??ng vui l??ng li??n h??? t???i trung t??m ch??m s??c kh??ch h??ng theo s??? <span style="color: #ec1f26">099999999</span> - <span style="color: #ec1f26">0879999756</span> ho???c truy c???p v??o website <a href="#" style="text-decoration: none; color: #ec1f26">Easy Credit</a></i>
                </td>
            </tr>
        </table>
        </body>
        </html>
    `
}