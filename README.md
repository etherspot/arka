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

## 🔙 Arka Backend

This contains the full source code and implementation of Arka. 

To run your own instance of this, please [follow these steps.](https://github.com/etherspot/arka/tree/master/backend#how-to-run)

You can see a [list of available endpoints here](https://github.com/etherspot/arka/tree/master/backend#available-endpoints--).

## 🖥 Arka Frontend

This is a basic frontend which let's a user run some Arka [API calls.](https://etherspot.fyi/arka/api-calls/)

To run the dapp:
#### `cd frontend`
#### `npm i`
#### `npm start`

For more details on what can be done here please look at [the frontend readme.](https://github.com/etherspot/arka/blob/master/frontend/README.md)


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
