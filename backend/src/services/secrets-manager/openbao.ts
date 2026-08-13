import fetch from "node-fetch";
import { SecretManager, JsonObject } from "./interface.js";

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

const OPENBAO_ADDR = process.env.OPENBAO_ADDR ?? "";
const OPENBAO_TOKEN = process.env.OPENBAO_TOKEN ?? "";

export class OpenBaoSecretManager implements SecretManager {
  async getSecret<T>(secretName: string, mount = "arka"): Promise<T> {
    const url = `${OPENBAO_ADDR.replace(/\/$/, "")}/v1/${mount}/data/${this.encodeSecretPath(
      secretName,
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Vault-Token": OPENBAO_TOKEN,
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

    const url = `${OPENBAO_ADDR.replace(/\/+$/, "")}/v1/${this.encodeSecretPath(
      mount,
    )}/data/${this.encodeSecretPath(secretName)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Vault-Token": OPENBAO_TOKEN,
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
    const url = `${OPENBAO_ADDR.replace(/\/+$/, "")}/v1/${this.encodeSecretPath(
      mount,
    )}/data/${this.encodeSecretPath(secretName)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-Vault-Token": OPENBAO_TOKEN,
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
