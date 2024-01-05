async function main() {

	// Successful returned value

	// Value returned:  { message: 'Already added' }

  const sponsorAddress = ('0xaeAF09795d8C0e6fA4bB5f89dc9c15EC02021567');
	const accountAddress = ('0xEE34863ca15bbfFD3fE8A302390e496AB95Ab534');
	const chainId = 80001;
	const api_key = 'arka_public_key';
	const returnedValue = await fetch('https://arka.etherspot.io/checkWhitelist', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ "params": [sponsorAddress, accountAddress, chainId, api_key] })
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