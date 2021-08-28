# alfabank-wrapper
Module provide simple access to REST API of the Alfabank for create and maintain credit/debit card transactions.
Module contains both callback and promise functions called execute and executePromise.
You can use it depends on your programming style.

Actual information about [Alfabank REST API](https://pay.alfabank.ru/ecommerce/instructions/merchantManual/pages/index/rest.html)

Install:
```
npm install alfabank-wrapper
```

Usage:
```
const alfabank = require('alfabank-wrapper').;

let pay_object = new alfabank.Alfabank('Your private token', 'en');

pay_object.execute('register', {orderNumber : '000-000000'}, (err, data) => {
	if (err) {
		console.log('!Error:', err);
	} else {
		console.log(data);
	}
});

pay_object.executePromise('register', {orderNumber : '000-000000'})
	.then((data) => {
		console.log(data);
	})
	.catch((error) => {
		console.log('!Error:', error);
	});

```

Available commands for execution:
```
registerPreAuth 
register
getOrderStatusExtended
getLastOrdersForMerchants
getBindingsByCardOrId
getBindings
getOrderStatus
verifyEnrollment
paymentOrderBinding
reverse
paymentotherway
deposit
addParams
unBindCard
refund
bindCard
```
Command parameters:
Each command required it's own parameters set. For example command 'register' required folowed parameters:
```
{
	returnUrl : 'Full URL to successful payment includes protocol',
	orderNumber : 'Your store unique order number',
	amount : 'Pay amount in cents (points not allowed)',
	description : 'Payment description'
}
```
Authorization token appends to parameters automatically.