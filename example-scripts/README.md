# Arka API Call Node Scripts

[Arka](https://etherspot.fyi/arka/intro) is an open source paymaster 
solution which is part of the 4337 infrastructure. 

The purpose of these scripts is to easily be able to run the [API calls](https://etherspot.fyi/arka/api-calls/whitelisting) 
associated with Arka. 

## How to run

In the arka-api-call directory first run:

``` bash
npm i 
```

Then you can update any of the scripts within the api-calls directory, with your specific values
for things like api key, addresses to sponsor, deposit amount, etc.


And finally run them one by one like so:

``` bash
npm run check-whitelist
npm run whitelist-address
npm run deposit
npm run token-paymaster
```

In each script you will see a comment with an example of a successful request.

For more context on what each call does, or for more information about Arka, 
[please check out the documentation here](https://etherspot.fyi/arka/intro). 

