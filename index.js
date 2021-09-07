/*
	Alfabank wrapper v.1.0.x
	Allow send command execution to Alfabank server with desired parameters
	
	For more information about operations and its parameters look at:
		https://pay.alfabank.ru/ecommerce/instructions/merchantManual/pages/index/rest.html
*/

/*Define dependencies*/
const axios = require('axios');

/*Error mesages*/
const messages = {
	ru : {
		operation_error : 'Указанная операция не определена в документации банка',
		params_invalid : 'Параметры должны быть переданы в виде объекта',
		callback_invalid : 'Требуется функция обратного вызова',
		value_invalid : 'Параметр должен быть указан',
		value_type_invalid : 'Некорректный тип данных ',
		auth_invalid : 'Некорректные данные для авторизации, необходим либо токен либо имя пользователя и пароль. Для операции возврата имя пользователя и пароль обязательны.'
	},
	en : {
		operation_error : 'The specified operation is not defined in the banks documentation',
		params_invalid : 'Parameters must be passed as an object',
		callback_invalid : 'Callback function required',
		value_invalid : 'Value must be specified',
		value_type_invalid : 'Value type is incorrect ',
		auth_invalid : 'Incorrect authorization data token or userName and password must be provided. For refund operation userName and password required.'
	}
}

const commands = [
	'registerPreAuth', 
	'register',
	'getOrderStatusExtended',
	'getLastOrdersForMerchants',
	'getBindingsByCardOrId',
	'getBindings',
	'getOrderStatus',
	'verifyEnrollment',
	'paymentOrderBinding',
	'reverse',
	'paymentotherway',
	'deposit',
	'addParams',
	'unBindCard',
	'refund',
	'bindCard'
];

/*Main class*/
class Alfabank {
	#token;
	#username;
	#password;
	#language;
	/*Default REST point of Alfabank*/
	execURLPrefix = `https://web.rbsuat.com/ab/rest/`;
	execURLSuffix = `.do`;
	/*Initialise class with "new"*/
	constructor (token, language, userName, password, execURLPrefix, execURLSuffix) {
		this.#language = language;

		if (!token && (!userName || !password)) {
			throw messages[this.#language].auth_invalid;
		}

		this.#token = token;
		this.#username = userName;
		this.#password = password;
		/*If URLs not defines use default values*/
		if (execURLPrefix) {
			this.execURLPrefix = execURLPrefix;
		};
		if (execURLSuffix) {
			this.execURLSuffix = execURLSuffix;
		};
	};
	
	/*Simple detectors of Objects and Arrays*/
	isObject = (a) => {
		return (!!a) && (a.constructor === Object);
	};
	
	isArray = (a) => {
    return (!!a) && (a.constructor === Array);
	};
	
	/*Unified execute action with callback*/
	execute(operation, params, callback) {
		if (!callback instanceof Function) {
			throw messages[this.#language].callback_invalid;
		} else if (!this.isObject(params) || this.isArray(params)) {
			callback(messages[this.#language].params_invalid, false);
		} else if (
			!commands.includes(operation)
		) {
			callback(messages[this.#language].operation_error, false);
		} else {
			/*Extend parameters by adding authorization token*/
			if (this.#token) {
				params.token = this.#token;
			}
			if (this.#username && this.#password) {
				params.userName = this.#username;
				params.password = this.#password;
			}
			/*Send data to server*/
			axios({
				method : 'POST', //as described in documentation (link above)
				url : `${this.execURLPrefix}${operation}${this.execURLSuffix}`,
				params : params //That's correct. Parameters from request string are reading only. Bank's server does not recognize any parameters in body (!!! Why they require POST?)
			}).then(
				(result) => {
					/*If operation succeeded on bank's side return data*/
					if (!result.data.errorCode) {
						callback(false, result.data);
					} else {
						/*Else return data with description as error*/
						callback(result.data, false);
					}
				}
			).catch(
				(error) => {
					callback(error, false);
				}
			)
		}
	}
	/*Promisified execution for those who used a single thread application and uses await*/
	executePromise(operation, params) {
		return new Promise((resolve, reject) => {
			this.execute(operation, params, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});
	}

	/*Basic promisified functions for most popular commands*/
	register (paymentID, paymentAmount, paymentDetails, successURL, failURL) {
		if (typeof paymentAmount != 'number') {
			throw messages[this.#language].value_type_invalid + 'paymentAmount';
		} else if (!successURL) {
			throw messages[this.#language].value_invalid + 'successURL';
		} else if (!paymentDetails) {
			throw messages[this.#language].value_invalid + 'paymentDetails';
		}

		let params = {
			returnUrl : successURL,
			failUrl : failURL || successURL,
			orderNumber : paymentID,
			amount : Math.round(paymentAmount*100),
			description : paymentDetails
		};
		return new Promise ((resolve, reject) => {
			this.execute('register', params, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});
	}

	getOrderStatus (orderID) {
		if (!orderID) {
			throw messages[this.#language].value_invalid + 'orderID';
		}

		let params = {
			token : token || '',
			userName : userName || '',
			password : password || '',
			orderId : orderID
		};
		return new Promise ((resolve, reject) => {
			this.execute('getOrderStatus', params, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});
	}

	refund (orderID, paymentAmount) {
		if (typeof paymentAmount != 'number') {
			throw messages[this.#language].value_type_invalid + 'paymentAmount';
		} else if (!orderID) {
			throw messages[this.#language].value_invalid + 'orderID';
		}

		let params = {
			orderId : orderID,
			amount : Math.round(paymentAmount*100)
		};
		return new Promise ((resolve, reject) => {
			this.execute('refund', params, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});
	}
}

/*Export class to outside*/
exports.Alfabank = Alfabank;