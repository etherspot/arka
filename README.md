<div align="center">
  <h1 align="center">ARKA</h1>
</div>

<div align="center">
  <img src="https://public.etherspot.io/assets/etherspot.gif" width="200" height="200">
  <p>
    <b>
      ARKA (Albanian for Cashier's case) is open source "Paymaster" as a service software.
    </b>
   </p>
</div>

--------------

>[!IMPORTANT]
>This repo/software is under active development.

## 💸 Arka

Arka paymaster is an open source piece of infrastructure which is a vital piece of
the [ERC-4337 stack](https://www.erc4337.io/). 

Paymasters are what is needed to sponsor users 
transactions.

The flow is as follows:
- Use Etherspot's hosted version of Arka (https://arka.etherspot.io/) or deploy your own.
- [Whitelist](https://etherspot.fyi/arka/api-calls/whitelisting) an address you want to sponsor.
- [Deposit](https://etherspot.fyi/arka/api-calls/deposit) to the paymaster.
- Include the paymaster data in the [UserOp](https://etherspot.fyi/account-abstraction/userops) to have the transaction sponsored.

## 🐳 How to run (a Docker image)

## Prerequisites
* Docker Installed (https://www.docker.com/get-started/)
* Edit docker-compose.yml for backend cron job and put a value in CRON_PRIVATE_KEY with the wallet private key you want to use to periodically update the paymaster contract price

#### `docker compose up`

This would spin up three services at once which will be available on these urls:
- http://localhost:3002 (Arka Admin Frontend)
- http://localhost:3000 (Arka Frontend for EndUser)
- http://localhost:5050 (Arka backend for Api service)

## Local Configuration Changes

There is an option to run the code locally without using AWS and only using local SQLite. These are the following steps to follow for using local SQLite database for apiKey and frontend to sync up

* Edit the docker-compose.yml to change the UNSAFE_MODE variable under backend to be true
* Run `docker compose up`
* Once its running, go to `http://localhost:3002/apiKey` and add the necessary apiKey and its private Key to store it to the local sqlite. Please Note that the privateKey will be stored in encrypted format with the mac address as the secret string for encryption and decryption process
* NOTE: The SUPPORTED_NETWORKS and ERC20_PAYMASTERS parameters require to input in base64 format and the original structure is described as follows
- SUPPORTED_NETWORKS - the networks you wish to support. The structure should follow this file config.json which again needs to be converted into `base64` value
- ERC20_PAYMASTERS - the custom deployed pimlico erc20 paymaster contract addresses. The structure should be as follows
{
    "10": {
        "USDC": "0x99fB8d618F52a42049776899D5c07241D344a8A4",
        "DAI": "0x3bE5380ec8cfe159f0525d16d11E9Baba516C40c",
        "USDT": "0x9102889001d0901b3d9123651d492e52ce772C6b"
    },
    "420": {
        "LINK": "0x53F48579309f8dBfFE4edE921C50200861C2482a"
    },
    "421613": {
        "LINK": "0x0a6Aa1Bd30D6954cA525315287AdeeEcbb6eFB59"
    }
} which also needs to be converted into `base64` value
- FEE_MARKUP - this is used to add fee if it gets from the provider. This needs to be inputted as a number in terms of gwei
- ETHERSCAN_GAS_ORACLES - the list of urls for all chains. Note that the response got is in terms of etherscan API Documentation https://docs.polygonscan.com/api-endpoints/gas-tracker#get-gas-oracle
The structure should be as follows
{
  "137": "https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken", // Note that you need to replace YourApiKeyToken to actual API key from etherscan
  "1": "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken"
} which then needs to be converted into `base64` value
- DEFAULT_API_KEY - this is used for checking token paymaster deposits. Please use an apiKey which has the list of token paymasters that needs to be monitored. Please note that it only tracks the token paymasters in `ERC20_PAYMASTERS` and `MULTI_TOKEN_PAYMASTERS` variable specified inside the apiKey.
- WEBHOOK_URL - this is used to notify if the token paymaster deposit comes below 'thresholdValue' specified in backend/config.json and please note that each chain has configured threshold as approx. 50 USD worth of native tokens

## API KEY VALIDATION
- In ARKA Admin Frontend, create an API_KEY with the following format - 
* Min length - 8 Max length - 20
* contains atleast one Special characters out of these - `@$!%*-_&`
* contains atleast one lowercase alphabet
* contains atleast one uppercase alphabet
* contains atleast one digit 0-9


## 🔙 Arka Backend

This contains the full source code and implementation of Arka. 

To run your own instance of this, please [follow these steps.](https://github.com/etherspot/arka/tree/master/backend#how-to-run)

You can see a [list of available endpoints here](https://github.com/etherspot/arka/tree/master/backend#available-endpoints--).


### Local - Setup 

#### environment for backend

1. Start Docker postgres database

```sh
cd local-setup
```

```sh
docker-compose up -d
```

- Verify if the postgres docker instance is up and running

```sh
docker ps -a
```

```sh
docker logs --follow local-setup-db-1
```

- It must show up logs similar to this

```
PostgreSQL init process complete; ready for start up.
2024-06-24 19:31:56.739 UTC [1] LOG:  starting PostgreSQL 16.1 (Debian 16.1-1.pgdg120+1) on aarch64-unknown-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
2024-06-24 19:31:56.740 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
2024-06-24 19:31:56.740 UTC [1] LOG:  listening on IPv6 address "::", port 5432
2024-06-24 19:31:56.741 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
2024-06-24 19:31:56.744 UTC [66] LOG:  database system was shut down at 2024-06-24 19:31:56 UTC
2024-06-24 19:31:56.748 UTC [1] LOG:  database system is ready to accept connections
```

2. create .env

```sh
cp .env.example .env
```

3. populate these environment variables

```sh
LOG_LEVEL=
API_HOST=
API_PORT=
UNSAFE_MODE=true
SUPPORTED_NETWORKS=
CRON_PRIVATE_KEY=
DEFAULT_INDEXER_ENDPOINT=
FEE_MARKUP=0
MULTI_TOKEN_MARKUP=
ADMIN_WALLET_ADDRESS=
ETHERSCAN_GAS_ORACLES=""
DEFAULT_API_KEY=""
WEBHOOK_URL=
HMAC_SECRET=
DATABASE_URL=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_SCHEMA_NAME=arka
DATABASE_SSL_ENABLED=false
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

4. start docker instance for backend, admin_frontend, frontend

```sh
docker-compose up --build -d
```

5. Here we need to create a network and tag backend & postgres on same network

```sh
docker network create arka-network    
```

6. add postgres instance to docker network

```sh
docker network connect arka-network local-setup-db-1
```

7. add arka backend docker instance to docker-network

```sh
docker network connect arka-network arka-backend-1
```

8. restart backend docker instance

```sh
docker-compose up -d
```

9. verify backend logs

```sh
docker logs arka-backend-1
```

## 🖥 Arka Admin Frontend

This contains ability to change system configuration, apiKeys and apiKey-config that are available in database.

## 🖥 Arka Frontend

This is a basic frontend which let's a user interact with the Arka smart contract on various chains.


## 🔗 Important links

- **[Arka developer documentation](https://etherspot.fyi/arka/intro)**
- **[Sponsor a Transaction](https://etherspot.fyi/arka/sponsor-a-transaction)**
- **[Chains which Arka is live on](https://etherspot.fyi/skandha/chains)**


## 💬 Contact

If you have any questions or feedback about Arka, please feel free to reach out to us.

- [Follow on Twitter](https://twitter.com/etherspot)
- [Join our discord](https://discord.etherspot.io/)

## 📄 License

Licensed under the [MIT License](https://github.com/etherspot/arka/blob/master/LICENSE).
