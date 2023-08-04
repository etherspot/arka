# Mock Paymaster API

This is a simple API that signs userOps so that their fees are covered by EtherspotPaymaster contract.

## What is this

The API gives `paymasterAndData` and `verificationGasLimit` as a response.

`paymasterAndData` is a bytes array with the following content
- address of the EtherspotPaymaster contract
- `validUntil` and `validAfter` - the expiration date of `paymasterAndData` 
- Signature of the Paymaster - a Paymaster signs the `hash of a userOp || validUntil || validAfter`. This signature is later used to identify the Paymaster address in EtherspotPaymaster contract.

## How to run

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
      })
    }).then(res => res.json());

    if (!pm.paymasterAndData) {
      throw new Error("No paymaster and data");
    }

    ctx.op.paymasterAndData = pm.paymasterAndData;
    ctx.op.verificationGasLimit = pm.verificationGasLimit;
  };
```

Config file should look like this:
```json
{
  "rpcUrl": "http://127.0.0.1:14337/1",
  "signingKey": "0x...",
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "EtherspotWalletFactory": "0x27f11918740060bd9Be146086F6836e18eedBB8C",
  "paymaster": {
    "rpcUrl": "http://127.0.0.1:5050",
    "context": {}
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
4. Sumbit the PR for merging the changes to master and notify us.
5. Also write the description of the changes made and do tell us why do you think this change is necessary and specify the env vars if needed to add
