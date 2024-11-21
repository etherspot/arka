import crypto, { BinaryToTextEncoding } from 'crypto';
import { KmsKeyringNode, buildClient, CommitmentPolicy } from '@aws-crypto/client-node';
import { server } from '../server.js';

function createDigest(encodedData: string, format: BinaryToTextEncoding, hmacSecret: string) {
  return crypto
    .createHmac('sha256', hmacSecret)
    .update(encodedData)
    .digest(format);
}

export function encode(sourceData: string, hmacSecret: string) {
  const json = JSON.stringify(sourceData);
  const encodedData = Buffer.from(json).toString('base64');
  return `${encodedData}!${createDigest(encodedData, 'base64', hmacSecret)}`;
}

export async function encodeSafe(sourceData: string, hmacSecret: string) {
  if(process.env.USE_KMS === 'false') {
    const json = JSON.stringify(sourceData);
    const encodedData = Buffer.from(json).toString('base64');
    return `${encodedData}!${createDigest(encodedData, 'base64', hmacSecret)}`;
  } else {
    const client = new KmsKeyringNode({generatorKeyId: process.env.KMS_KEY_ID});
    const buildEncrypt = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT).encrypt;
    const { result } = await buildEncrypt(client, sourceData);
    return result.toString('base64');
  }
}

export function decode(value: string, hmacSecret: string) {
  const [encodedData, sourceDigest] = value.split('!');
  if (!encodedData || !sourceDigest) throw new Error('invalid value(s)');
  const json = Buffer.from(encodedData, 'base64').toString('utf8');
  const decodedData = JSON.parse(json);
  const checkDigest = crypto.createHmac('sha256', hmacSecret).update(encodedData).digest();
  const digestsEqual = crypto.timingSafeEqual(
    Buffer.from(sourceDigest, 'base64'),
    checkDigest
  );
  if (!digestsEqual) throw new Error('invalid value(s)');
  return decodedData;
}

export async function decodeSafe(value: string, hmacSecret: string) {
  if(!process.env.USE_KMS) {
    const [encodedData, sourceDigest] = value.split('!');
    if (!encodedData || !sourceDigest) throw new Error('invalid value(s)');
    const json = Buffer.from(encodedData, 'base64').toString('utf8');
    const decodedData = JSON.parse(json);
    const checkDigest = crypto.createHmac('sha256', hmacSecret).update(encodedData).digest();
    const digestsEqual = crypto.timingSafeEqual(
      Buffer.from(sourceDigest, 'base64'),
      checkDigest
    );
    if (!digestsEqual) throw new Error('invalid value(s)');
    return decodedData;
  } else {
    const client = new KmsKeyringNode({generatorKeyId: process.env.KMS_KEY_ID});
    const buildDecrypt = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT).decrypt;
    const { plaintext } = await buildDecrypt(client, Buffer.from(value, 'base64'));
    return plaintext.toString('utf8');
  }
}

export function verifySignature(signature: string, data: string, timestamp: string, hmacSecret: string) {
  // unauthorize signature if signed before 10s or signed in future.
  const now = Date.now();
  server.log.info(`-----------now---------- ${now}`);
  server.log.info(`-----------hmacSecret---------- ${hmacSecret}`);
  if(
    now < parseInt(timestamp) ||
    now - parseInt(timestamp) > 10000
  ) {
    return false;
  }
  const computedSignature = createDigest(data + timestamp, 'hex', hmacSecret);
  server.log.info(`-----------computedSignature----------${computedSignature}`);
  server.log.info(`-----------signature----------${signature} ${computedSignature === signature}`);
  return signature === computedSignature;
}
