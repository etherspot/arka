import crypto, { BinaryToTextEncoding } from 'crypto';
import getMAC from 'getmac';

const secret = getMAC();

function createDigest(encodedData: string, format: BinaryToTextEncoding) {
  return crypto
    .createHmac('sha256', secret)
    .update(encodedData)
    .digest(format);
}

export function encode(sourceData: string) {
  const json = JSON.stringify(sourceData);
  const encodedData = Buffer.from(json).toString('base64');
  return `${encodedData}!${createDigest(encodedData, 'base64')}`;
}

export function decode(value: string) {
  const [encodedData, sourceDigest] = value.split('!');
  if (!encodedData || !sourceDigest) throw new Error('invalid value(s)');
  const json = Buffer.from(encodedData, 'base64').toString('utf8');
  const decodedData = JSON.parse(json);
  const checkDigest = crypto.createHmac('sha256', secret).update(encodedData).digest();
  const digestsEqual = crypto.timingSafeEqual(
    Buffer.from(sourceDigest, 'base64'),
    checkDigest
  );
  if (!digestsEqual) throw new Error('invalid value(s)');
  return decodedData;
}