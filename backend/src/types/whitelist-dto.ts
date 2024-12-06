import { EPVersions } from "./sponsorship-policy-dto";

export interface WhitelistDto {
  apiKey: string;
  addresses: string[];
  policyId?: number;
  epVersion: EPVersions;
}