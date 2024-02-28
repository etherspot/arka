import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  PaymasterEvent: p.createTable({
    id: p.string(),
    sender: p.string(),
    paymaster: p.string(),
    transactionHash: p.string(),
    timestamp: p.bigint(),
    month: p.int(),
    year: p.int(),
    chainId: p.int(),
  }),
}));
