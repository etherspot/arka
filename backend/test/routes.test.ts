import { build } from './helper'

describe('root tests', () => {
  const app = build();

test('default root route without params', async () => {
  const res = await app.inject({
    url: '/',
    method: "POST"
  })
  expect(JSON.parse(res.payload)).toEqual({ error: 'Empty Body received'})
})

test('default etherspot paymaster with params', async () => {
  const userOp = {
    sender: "0x603Ef162f05dDa6e3B4717f4A951d6eF614a897f",
    nonce: "0x1d",
    initCode: "0x",
    callData: "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0x8342",
    verificationGasLimit: "0x16070",
    maxFeePerGas: "0x7d912eba",
    maxPriorityFeePerGas: "0x7d912eaa",
    paymasterAndData: "0x",
    preVerificationGas: "0xa96c",
    signature: "0x"
  };
  const res = await app.inject({
    url: '/',
    method: "POST",
    payload: {params: [userOp, "0x603Ef162f05dDa6e3B4717f4A951d6eF614a897f"]},
  });
  expect(res.statusCode).toEqual(200);
  expect(JSON.parse(res.payload)).toHaveProperty('paymasterAndData');
})

})