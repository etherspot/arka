import { AwsSecretManager } from "./aws.js";
import { OpenBaoSecretManager } from "./openbao.js";
import type { SecretManager } from "./interface.js";

export function getSecretManager(openbaoAddr = "", openbaoToken = ""): SecretManager {
  if (openbaoAddr && openbaoToken) {
    return new OpenBaoSecretManager(openbaoAddr, openbaoToken);
  }
  return new AwsSecretManager();
}
