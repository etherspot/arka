# Arka Paymaster API

This is a simple API that signs userOps so that their fees are covered by EtherspotPaymaster contract.

## What is this

The API gives `paymasterAndData` and `verificationGasLimit` as a response.

`paymasterAndData` is a bytes array with the following content
- address of the EtherspotPaymaster contract
- `validUntil` and `validAfter` - the expiration date of `paymasterAndData` 
- Signature of the Paymaster - a Paymaster signs the `hash of a userOp || validUntil || validAfter`. This signature is later used to identify the Paymaster address in EtherspotPaymaster contract.

## How to run

Please have an AWS setup with secrets manager ready and create api access key. Then make sure that the key has enough permissions to access AWS secrets manager
Also create a secret manager folder with prefix as `arka_` and concatenate any string of your choice which can act as an api_key for calling the endpoints. For eg. `arka_devTest` (api_key would be `devTest`)
Inside each folder in the secrets manager in our case `arka_devTest` the necessary key values are as follows
- PRIVATE_KEY - the wallet from which you wish to sponsor from
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

`npm install`\
`npm run dev`

## How to use with UserOp.js or erc-4337-examples

You need to create a custom middleware for this paymaster:

```ts
import { UserOperationMiddlewareFn } from "userop";
import { OpToJSON } from "userop/dist/utils";

interface EtherspotPaymasterResult {
  paymasterAndData: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  callGasLimit: string;
}

export const etherspotPaymaster =
  (paymasterRpc: string, context: any): UserOperationMiddlewareFn =>
  async (ctx) => {
    const apiUrl = new URL('/', paymasterRpc).href;
    const pm: EtherspotPaymasterResult = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        userOp: OpToJSON(ctx.op),
        entryPoint: ctx.entryPoint,
        context: ctx.context,
        chainId: 80001
      })
    }).then(res => res.json());

    if (!pm.paymasterAndData) {
      throw new Error("No paymaster and data");
    }

    ctx.op.paymasterAndData = pm.paymasterAndData;
    ctx.op.verificationGasLimit = pm.verificationGasLimit;
    ctx.op.preVerificationGas = pm.preVerificationGas;
    ctx.op.callGasLimit = pm.callGasLimit;
  };
```

Config file should look like this:
```json
{
  "rpcUrl": "http://127.0.0.1:14337/80001",
  "signingKey": "0x...",
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "EtherspotWalletFactory": "0x27f11918740060bd9Be146086F6836e18eedBB8C",
  "paymaster": {
    "rpcUrl": "http://127.0.0.1:5050?apiKey=apiKey&chainId=80001",
    "context": {
      "mode": "sponsor",
    }
  }
}

```

Usage of this middleware with a simple transfer example from erc-4337-examples repo:
```ts
import { ethers } from "ethers";
import { Client } from "userop";
import { CLIOpts } from "../../src";
import { etherspotPaymaster } from '../middlewares/paymaster';
// @ts-ignore
import config from "../../config.json";
import { EtherspotAccount } from "../builder/etherspotAccount";

export default async function main(t: string, amt: string, opts: CLIOpts) {
  const paymaster = opts.withPM
    ? etherspotPaymaster(
        config.paymaster.rpcUrl,
        config.paymaster.context
      )
    : undefined;
  const simpleAccount = await EtherspotAccount.init(
    new ethers.Wallet(config.signingKey),
    config.rpcUrl,
    config.entryPoint,
    config.EtherspotWalletFactory,
    paymaster
  );
  const client = await Client.init(config.rpcUrl, config.entryPoint);

  const target = ethers.utils.getAddress(t);
  const value = ethers.utils.parseEther(amt);
  const res = await client.sendUserOperation(
    simpleAccount.execute(target, value, "0x"),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await res.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
```

If you want to contribute,
1. Create a branch from master
2. Do the changes you wish to include
  2.1 For adding a new paymaster, add the desired route in the src/routes/index.ts file and add validators. Add the logic of getting a paymasterAndData in src/paymaster/index.ts
  2.2 For adding a new env var, add the desired variable name in the plugins/config.ts under ConfigSchema such as 
      ```ts
      const ConfigSchema = Type.Strict(
        Type.Object({
          ...,
          newEnvVar: Type.String() // change the variable name and type of the desired env var
        })
      );
      ```
      And use it in routes/index.ts as server.config.newEnvVar inside routes variable
3. Test on your local machine
4. Submit the PR for merging the changes to master and notify us.
5. Also write the description of the changes made and do tell us why do you think this change is necessary and specify the env vars if needed to add


## Available endpoints -
## Note: All the below urls has two parameters as queryString i.e apiKey and chainId as default 
- `/` - This url accepts three parameters in body as array and returns the paymasterData, verificationGasLimit, callGasLimit and preVerificationGas
Parameters:
  1. userOp object itself in JSON format
  2. entryPointAddress
  3. context object which has one required parameter mode and three optional parameter
    - mode which accepts "erc20" | "sponsor"
    - token (if mode is "erc20") which accepts symbol i.e "USDC"
    - validAfter - timestamp in milliseconds only applicable with mode as "sponsor" used for defining the start of the paymaster validity
    - validUntil - timestamp in milliseconds only applicable with mode as "sponsor" used for defining the end of the paymaster validity

- `/pimlicoAddress` - This url accepts two parameters in body and returns the address of the deployed erc20 paymaster if exists
Parameters:
  1. entryPointAddress
  2. context object with token symbol i.e { token: "USDC" }

- `/whitelist` - This url accepts one parameter and returns the submitted transaction hash if successful. This url is used to whitelist an array of addresses thats needed to be whitelisted for sponsorship. Please note that all addresses needs to be addresses that wasn't been whitelisted before.
  1. address - an array of addresses (max. 10 per request)

- `/checkWhitelist` - This url accepts two parameters in body and returns if the address has been whitelisted or not
  1. sponsorAddress - The address of the sponsorer
  2. accountAddress - The address which needs to be checked

- `/deposit` - This url accepts one parameter and returns the submitted transaction hash if successful. This url is used to deposit some funds to the entryPointAddress from the sponsor wallet
  1. amount - The amount to be deposited in ETH
  
## Local Docker Networks

1. Ensure the postgres docker instance is up and running

2. Here we need to create a network and tag backend & postgres on same network

```sh
docker network create arka-network    
```

```sh
docker run --network arka-network --name local-setup-db-1 -d postgres
```

```sh
docker run --network arka-network --name arka-backend -d arka-backend
```



