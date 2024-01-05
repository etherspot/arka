async function main() {

	// Successful returned value

	// Value returned:  { message: '0x32aCDFeA07a614E52403d2c1feB747aa8079A353' }

	const entryPointAddress = ('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789');
	const context = {token: 'USDC'};
	const api_key = '';
	const chainId = 80001;
	const returnedValue = await fetch('https://arka.etherspot.io/pimlicoAddress', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ "params": [addresses, chainId, api_key] })
	})
		.then((res) => {
			return res.json()
		}).catch((err) => {
			console.log(err);
			// throw new Error(JSON.stringify(err.response))
		});
	console.log('Value returned: ', returnedValue);


main()