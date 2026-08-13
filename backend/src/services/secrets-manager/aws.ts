import {
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import type { SecretManager, JsonObject } from "./interface.js";

export class AwsSecretManager implements SecretManager {
  private readonly client = new SecretsManagerClient();

  async getSecret<T>(secretName: string): Promise<T> {
    const response = await this.client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      }),
    );

    const secretString =
      response.SecretString ??
      (response.SecretBinary
        ? Buffer.from(response.SecretBinary).toString("utf-8")
        : undefined);

    if (!secretString) {
      throw new Error(`AWS secret '${secretName}' did not contain a secret value.`);
    }

    return JSON.parse(secretString) as T;
  }

  async createSecret(
    secretName: string,
    secretData: JsonObject,
  ): Promise<boolean> {
    await this.client.send(
      new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretData),
      }),
    );

    return true;
  }

  async destroySecret(
    secretName: string,
    recoveryWindowInDays?: number,
  ): Promise<boolean> {
    await this.client.send(
      new DeleteSecretCommand({
        SecretId: secretName,
        ...(recoveryWindowInDays === undefined ? {} : { RecoveryWindowInDays: recoveryWindowInDays }),
      }),
    );

    return true;
  }
}
