/*
	Chạy câu lệnh nào thì bôi đen rồi nhấn run ở đây nhé =======^^^.^^^========
*/

/*Đếm số lần gọi api*/
SELECT COUNT(des) FROM log_transaction AS log WHERE des = 'Response'

/*Đếm số lần gọi api thành công*/
SELECT COUNT(des) FROM log_transaction AS log WHERE des = 'Response'
	AND response_code = '200'
	
/*Đếm số lần gọi api thất bại*/
SELECT COUNT(des) FROM log_transaction AS log WHERE des = 'Response'
	AND response_code <> '200'
	
/*Đếm số api đã gọi*/
SELECT COUNT(DISTINCT api_name) FROM log_transaction AS log WHERE des = 'Response'

/*Đếm số api đã gọi và trả về kết quả thành công*/
SELECT COUNT(DISTINCT api_name) FROM log_transaction AS log WHERE des = 'Response'
	AND response_code = '200'
	
/*Đếm số api đã gọi và trả về kết quả thất bại*/
SELECT COUNT(DISTINCT api_name) FROM log_transaction AS log WHERE des = 'Response'
	AND response_code <> '200'
	
/*Xem danh sách api trả về lỗi*/
SELECT DISTINCT(api_name) FROM log_transaction AS log WHERE des = 'Response'
	AND response_code <> '200'
	
/*Xem chi tiết các lần gọi api trả về lỗi*/
SELECT * FROM log_transaction AS log WHERE des = 'Response'
	AND response_code <> '200'

/*Xem danh sách user đã gọi api*/
SELECT DISTINCT username FROM log_transaction AS log, users AS u WHERE des = 'Response'
	AND log.users_id = u.users_id
	
/*Xem danh sách user đã gọi api*/
SELECT DISTINCT username FROM log_transaction AS log, users AS u WHERE des = 'Response'
	AND log.users_id = u.users_id