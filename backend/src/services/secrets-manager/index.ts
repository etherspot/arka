import { AwsSecretManager } from "./aws.js";
import { OpenBaoSecretManager } from "./openbao.js";
import type { SecretManager } from "./interface.js";

export function getSecretManager(): SecretManager {
  if (process.env.OPENBAO_ADDR && process.env.OPENBAO_TOKEN) {
    return new OpenBaoSecretManager();
  }
  return new AwsSecretManager();
}
