async function main() {

	// Successful returned value

	// Value returned:  {
  	//	message: 'Successfully deposited with transaction Hash 0x79137319a6c9c67827b67dbbc16c0729465305516da4788bce578d5fdf59a52e'
	// }

	const amount = 0.00001;
	const api_key = '';
	const chainId = 80001;
	const returnedValue = await fetch('https://arka.etherspot.io/deposit', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ "params": [amount, chainId, api_key] })
	})
		.then((res) => {
			return res.json()
		}).catch((err) => {
			console.log(err);
			// throw new Error(JSON.stringify(err.response))
		});
	console.log('Value returned: ', returnedValue);


main()