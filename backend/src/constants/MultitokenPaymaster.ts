import { BigNumber } from "ethers";

export const UnaccountedCost = BigNumber.from("45000").toHexString();

interface TokenInfo {
    decimals: number;
    symbol: string;
}

export const TokenDecimalsAndSymbol: Record<number, Record<string, TokenInfo>> = {
    137: {
        "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": {
            decimals: 6,
            symbol: "USDC.e"
        },
        "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": {
            decimals: 6,
            symbol: "USDT"
        },
        "0xD6DF932A45C0f255f85145f286eA0b292B21C90B": {
            decimals: 18,
            symbol: "AAVE"
        },
        "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": {
            decimals: 18,
            symbol: "DAI"
        },
        "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619": {
            decimals: 18,
            symbol: "WETH"
        },
        "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39": {
            decimals: 18,
            symbol: "LINK"
        },
        "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4": {
            decimals: 18,
            symbol: "MANA"
        },
        "0xB5C064F955D8e7F38fE0460C556a72987494eE17": {
            decimals: 18,
            symbol: "QUICK"
        },
        "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683": {
            decimals: 18,
            symbol: "SAND"
        },
        "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a": {
            decimals: 18,
            symbol: "SUSHI"
        },
        "0x2e1AD108fF1D8C782fcBbB89AAd783aC49586756": {
            decimals: 18,
            symbol: "TUSD"
        },
        "0xb33EaAd8d922B1083446DC23f610c2567fB5180f": {
            decimals: 18,
            symbol: "UNI"
        },
        "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6": {
            decimals: 8,
            symbol: "WBTC"
        },
        "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3": {
            decimals: 18,
            symbol: "BAL"
        },
        "0x172370d5Cd63279eFa6d502DAB29171933a610AF": {
            decimals: 18,
            symbol: "CRV"
        },
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7": {
            decimals: 18,
            symbol: "GHST"
        },
        "0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6": {
            decimals: 18,
            symbol: "MaticX"
        }
    },
    8453: {
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": {
            decimals: 6,
            symbol: "USDC"
        },
        "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": {
            decimals: 18,
            symbol: "DAI"
        },
        "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22": {
            decimals: 18,
            symbol: "cbETH"
        },
        "0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239": {
            decimals: 18,
            symbol: "YFI"
        }
    },
    42161: {
        "0xaf88d065e77c8cC2239327C5EDb3A432268e5831": {
            decimals: 6,
            symbol: "USDC"
        },
        "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8": {
            decimals: 6,
            symbol: "USDC.e"
        },
        "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": {
            decimals: 6,
            symbol: "USDT"
        },
        "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f": {
            decimals: 8,
            symbol: "WBTC"
        },
        "0x912CE59144191C1204E64559FE8253a0e49E6548": {
            decimals: 18,
            symbol: "ARB"
        },
        "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a": {
            decimals: 18,
            symbol: "GMX"
        },
        "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0": {
            decimals: 18,
            symbol: "UNI"
        },
        "0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07": {
            decimals: 18,
            symbol: "JOE"
        },
        "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8": {
            decimals: 18,
            symbol: "BAL"
        },
        "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4": {
            decimals: 18,
            symbol: "LINK"
        },
        "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A": {
            decimals: 18,
            symbol: "SUSHI"
        },
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": {
            decimals: 18,
            symbol: "WETH"
        },
        "0x3E6648C5a70A150A88bCE65F4aD4d506Fe15d2AF": {
            decimals: 18,
            symbol: "SPELL"
        },
        "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F": {
            decimals: 18,
            symbol: "FRAX"
        },
        "0x6694340fc020c5E6B96567843da2df01b2CE1eb6": {
            decimals: 18,
            symbol: "STG"
        },
        "0x13Ad51ed4F1B7e9Dc168d8a00cB3f4dDD85EfA60": {
            decimals: 18,
            symbol: "LDO"
        },
        "0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8": {
            decimals: 18,
            symbol: "rETH"
        },
        "0x3082CC23568eA640225c2467653dB90e9250AaA0": {
            decimals: 18,
            symbol: "RDNT"
        },
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": {
            decimals: 18,
            symbol: "DAI"
        },
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": {
            decimals: 18,
            symbol: "ETH"
        }
    },
    10: {
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": {
            decimals: 18,
            symbol: "DAI"
        },
        "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": {
            decimals: 6,
            symbol: "USDT"
        },
        "0x68f180fcCe6836688e9084f035309E29Bf0A2095": {
            decimals: 8,
            symbol: "WBTC"
        },
        "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85": {
            decimals: 6,
            symbol: "USDC"
        },
        "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4": {
            decimals: 18,
            symbol: "SNX"
        },
        "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6": {
            decimals: 18,
            symbol: "LINK"
        },
        "0x9e1028F5F1D5eDE59748FFceE5532509976840E0": {
            decimals: 18,
            symbol: "PERP"
        },
        "0x4200000000000000000000000000000000000042": {
            decimals: 18,
            symbol: "OP"
        },
        "0x3c8B650257cFb5f272f799F5e2b4e65093a11a05": {
            decimals: 18,
            symbol: "VELO"
        },
        "0x9Bcef72be871e61ED4fBbc7630889beE758eb81D": {
            decimals: 18,
            symbol: "rETH"
        },
        "0x7F5c764cBc14f9669B88837ca1490cCa17c31607": {
            decimals: 6,
            symbol: "USDC.e"
        }
    },
    56: {
        "0x55d398326f99059fF775485246999027B3197955": {
            decimals: 18,
            symbol: "USDT"
        },
        "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82": {
            decimals: 18,
            symbol: "CAKE"
        },
        "0x2170Ed0880ac9A755fd29B2688956BD959F933F8": {
            decimals: 18,
            symbol: "ETH"
        },
        "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": {
            decimals: 18,
            symbol: "USDC"
        },
        "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3": {
            decimals: 18,
            symbol: "DAI"
        },
        "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE": {
            decimals: 18,
            symbol: "XRP"
        },
        "0x14016E85a25aeb13065688cAFB43044C2ef86784": {
            decimals: 18,
            symbol: "TUSD"
        },
        "0xCC42724C6683B7E57334c4E856f4c9965ED682bD": {
            decimals: 18,
            symbol: "MATIC"
        },
        "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1": {
            decimals: 18,
            symbol: "UNI"
        },
        "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD": {
            decimals: 18,
            symbol: "LINK"
        },
        "0xf7DE7E8A6bd59ED41a4b5fe50278b3B7f31384dF": {
            decimals: 18,
            symbol: "RDNT"
        },
        "0x7Ddc52c4De30e94Be3A6A0A2b259b2850f421989": {
            decimals: 18,
            symbol: "GMT"
        },
        "0xAD29AbB318791D579433D831ed122aFeAf29dcfe": {
            decimals: 18,
            symbol: "FTM"
        },
        "0xaEC945e04baF28b135Fa7c640f624f8D90F1C3a6": {
            decimals: 18,
            symbol: "C98"
        },
        "0x715D400F88C167884bbCc41C5FeA407ed4D2f8A0": {
            decimals: 18,
            symbol: "AXS"
        },
        "0x90C97F71E18723b0Cf0dfa30ee176Ab653E89F40": {
            decimals: 18,
            symbol: "FRAX"
        },
        "0x965F527D9159dCe6288a2219DB51fc6Eef120dD1": {
            decimals: 18,
            symbol: "BSW"
        },
        "0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b": {
            decimals: 18,
            symbol: "KNC"
        },
        "0x4691937a7508860F876c9c0a2a617E7d9E945D4B": {
            decimals: 18,
            symbol: "WOO"
        },
        "0x16939ef78684453bfDFb47825F8a5F714f12623a": {
            decimals: 18,
            symbol: "XTZ"
        },
        "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F": {
            decimals: 18,
            symbol: "ALPACA"
        },
        "0x762539b45A1dCcE3D36d080F74d1AED37844b878": {
            decimals: 18,
            symbol: "LINA"
        },
        "0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2": {
            decimals: 18,
            symbol: "DODO"
        },
        "0xFd7B3A77848f1C2D67E05E54d78d174a0C850335": {
            decimals: 18,
            symbol: "ONT"
        },
        "0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63": {
            decimals: 18,
            symbol: "NEAR"
        },
        "0x0Eb3a705fc54725037CC9e008bDede697f62F335": {
            decimals: 18,
            symbol: "ATOM"
        },
        "0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153": {
            decimals: 18,
            symbol: "FIL"
        },
        "0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf": {
            decimals: 18,
            symbol: "BCH"
        },
        "0xb59490aB09A0f526Cc7305822aC65f2Ab12f9723": {
            decimals: 18,
            symbol: "LIT"
        },
        "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94": {
            decimals: 18,
            symbol: "LTC"
        },
        "0x56b6fB708fC5732DEC1Afc8D8556423A2EDcCbD6": {
            decimals: 18,
            symbol: "EOS"
        },
        "0xa2B726B1145A4773F68593CF171187d8EBe4d495": {
            decimals: 18,
            symbol: "INJ"
        },
        "0x52CE071Bd9b1C4B00A0b92D298c512478CaD67e8": {
            decimals: 18,
            symbol: "COMP"
        },
        "0x47BEAd2563dCBf3bF2c9407fEa4dC236fAbA485A": {
            decimals: 18,
            symbol: "SXP"
        },
        "0x88f1A5ae2A3BF98AEAF342D26B30a79438c9142e": {
            decimals: 18,
            symbol: "YFI"
        },
        "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63": {
            decimals: 18,
            symbol: "XVS"
        },
        "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47": {
            decimals: 18,
            symbol: "ADA"
        },
        "0xAD6cAEb32CD2c308980a548bD0Bc5AA4306c6c18": {
            decimals: 18,
            symbol: "BAND"
        },
        "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402": {
            decimals: 18,
            symbol: "DOT"
        },
        "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF": {
            decimals: 18,
            symbol: "SOL"
        },
        "0xbA2aE424d960c26247Dd6c32edC70B295c744C43": {
            decimals: 8,
            symbol: "DOGE"
        },
        "0x2eD9a5C8C13b93955103B9a7C167B67Ef4d568a3": {
            decimals: 18,
            symbol: "MASK"
        },
        "0x111111111117dC0aa78b770fA6A738034120C302": {
            decimals: 18,
            symbol: "1INCH"
        }
    },
    1: {
        "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
            decimals: 6,
            symbol: "USDT"
        },
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
            decimals: 6,
            symbol: "USDC"
        },
        "0x514910771AF9Ca656af840dff83E8264EcF986CA": {
            decimals: 18,
            symbol: "LINK"
        },
        "0xB8c77482e45F1F44dE1745F52C74426C631bDD52": {
            decimals: 18,
            symbol: "BNB"
        },
        "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1": {
            decimals: 18,
            symbol: "ARB"
        },
        "0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF": {
            decimals: 18,
            symbol: "IMX"
        },
        "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": {
            decimals: 18,
            symbol: "MATIC"
        }
    },
    204: {
        "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2": {
            decimals: 18,
            symbol: "BTCB"
        },
        "0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea": {
            decimals: 18,
            symbol: "ETH"
        },
        "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3": {
            decimals: 18,
            symbol: "USDT"
        },
        "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": {
            decimals: 18,
            symbol: "FDUSD"
        }
    }
}