import fetch from "node-fetch";
import { SecretManager, JsonObject } from "./interface.js";
import { server } from "server.js";

type OpenBaoKvV2Response<T> = {
  request_id: string;
  lease_id: string;
  lease_duration: number;
  renewable: boolean;
  data: {
    data: T;
    metadata: {
      created_time: string;
      custom_metadata: Record<string, unknown> | null;
      deletion_time: string;
      destroyed: boolean;
      version: number;
    };
  };
  warnings: string[] | null;
};

export type OpenBaoDestroyResponse = Record<string, unknown>;

export type OpenBaoWriteResponse = {
  request_id: string;
  lease_id: string;
  lease_duration: number;
  renewable: boolean;
  data?: {
    created_time: string;
    custom_metadata: Record<string, unknown> | null;
    deletion_time: string;
    destroyed: boolean;
    version: number;
  };
  warnings: string[] | null;
};

export class OpenBaoSecretManager implements SecretManager {
  private readonly openbaoAddr: string;
  private readonly openbaoToken: string;

  constructor() {
    this.openbaoAddr = server.config.OPENBAO_ADDR;
    this.openbaoToken = server.config.OPENBAO_TOKEN;
  }
  async getSecret<T>(secretName: string, mount = "arka"): Promise<T> {
    const url = `${this.openbaoAddr.replace(/\/$/, "")}/v1/${mount}/data/${this.encodeSecretPath(
      secretName,
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Vault-Token": this.openbaoToken,
      },
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`OpenBao error ${response.status}: ${body}`);
    }

    const json = JSON.parse(body) as OpenBaoKvV2Response<T>;

    return json.data.data;
  }

  async createSecret(
    secretName: string,
    secretData: JsonObject,
    mount = "arka"
  ): Promise<boolean> {

    const url = `${this.openbaoAddr.replace(/\/+$/, "")}/v1/${this.encodeSecretPath(
      mount,
    )}/data/${this.encodeSecretPath(secretName)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Vault-Token": this.openbaoToken,
      },
      body: JSON.stringify({
        data: secretData,
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`OpenBao error ${response.status}: ${body}`);
    }

    return true;
  }

  async destroySecret(
    secretName: string,
    _recoveryWindowInDays?: number,
    mount = "arka"
  ): Promise<boolean> {
    console.log(`Destroying secret ${secretName} in mount ${mount}`);
    const url = `${this.openbaoAddr.replace(/\/+$/, "")}/v1/${this.encodeSecretPath(
      mount,
    )}/data/${this.encodeSecretPath(secretName)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-Vault-Token": this.openbaoToken,
      },
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`OpenBao error ${response.status}: ${body}`);
    }

    return true;
  }

  private encodeSecretPath(path: string): string {
    return path
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
  }
}
