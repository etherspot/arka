import { BigNumber } from "ethers";

export const UnaccountedCost = BigNumber.from("45000").toHexString();

interface TokenInfo {
    decimals: number;
    symbol: string;
}

export const TokenDecimalsAndSymbol: Record<number, Record<string, TokenInfo>> = {
    42161: {
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": {
            decimals: 18,
            symbol: "ETH"
        }
    }
}