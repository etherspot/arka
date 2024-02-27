import { ponder } from "@/generated";
import { BigNumber } from "ethers";

ponder.on("EtherspotPaymaster:SponsorSuccessful", async ({ event, context }) => {
  const { db, network } = context;
  const { args, block, transaction, log } = event;
  const time = Number(BigNumber.from(block.timestamp).toString());
  const timestamp = new Date(time * 1000);
  try {
    await db.PaymasterEvent.create({
      id: transaction.hash + log.logIndex,
      data: {
        chainId: network.chainId,
        sender: args.sender,
        paymaster: args.paymaster,
        transactionHash: transaction.hash,
        timestamp: block.timestamp,
        month: timestamp.getMonth(),
        year: timestamp.getFullYear()
      }
    })
  } catch (err) {
    // caught err
  }
});
