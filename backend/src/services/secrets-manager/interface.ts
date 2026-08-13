export type JsonObject = Record<string, unknown>;

export interface SecretManager {
  getSecret<T>(secretName: string): Promise<T>;
  createSecret(
    secretName: string,
    secretData: JsonObject,
  ): Promise<boolean>;
  destroySecret(
    secretName: string,
    recoveryWindowInDays?: number,
  ): Promise<boolean>;
}
