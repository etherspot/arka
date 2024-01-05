async function main() {

	// Successful returned value

	// Value returned:  {
	//  message: 'Successfully whitelisted with transaction Hash 0x8490a91e14836b37396bfa82ed182d4cd8d09d0ff296e49c53ac536cf5409b59'
	// }

	const addresses = ['0xA6Ed81c27942DA2AE0aB8024d3e16305eAEa1bC2'];
	const api_key = 'arka_public_key';
	const chainId = 80001;
	const returnedValue = await fetch('https://arka.etherspot.io/whitelist', {
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

}

main()