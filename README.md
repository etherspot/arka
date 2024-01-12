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


## 🔙 Arka Backend

This contains the full source code and implementation of Arka. 

To run your own instance of this, please [follow these steps.](https://github.com/etherspot/arka/tree/master/backend#how-to-run)

You can see a [list of available endpoints here](https://github.com/etherspot/arka/tree/master/backend#available-endpoints--).

## 🖥 Arka Admin Frontend

This contains ability to change configuration that are available in sql.

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
