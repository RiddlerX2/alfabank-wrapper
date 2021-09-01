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
		callback_invalid : 'Требуется функция обратного вызова'
	},
	en : {
		operation_error : 'The specified operation is not defined in the banks documentation',
		params_invalid : 'Parameters must be passed as an object',
		callback_invalid : 'Callback function required'
	}
}

/*Main class*/
class Alfabank {
	#token;
	#language;
	/*Default REST point of Alfabank*/
	execURLPrefix = `https://web.rbsuat.com/ab/rest/`;
	execURLSuffix = `.do`;
	/*Initialise class with "new"*/
	constructor (token, language, execURLPrefix, execURLSuffix) {
		this.#token = token;
		this.#language = language;
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
			![
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
			].includes(operation)
		) {
			callback(messages[this.#language].operation_error, false);
		} else {
			/*Extend parameters by adding authorization token*/
			params.token = this.#token;
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
}

/*Export class to outside*/
exports.Alfabank = Alfabank;