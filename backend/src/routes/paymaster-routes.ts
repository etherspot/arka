/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { BigNumber, Wallet, ethers, providers } from "ethers";
import { gql, request as GLRequest } from "graphql-request";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { PAYMASTER_ADDRESS } from "../constants/Pimlico.js";
import ErrorMessage, { generateErrorMessage } from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { decode } from "../utils/crypto.js";
import { printRequest, getNetworkConfig } from "../utils/common.js";
import { SponsorshipPolicy } from "../models/sponsorship-policy.js";
import { DEFAULT_EP_VERSION, EPVersions, getEPVersion } from "../types/sponsorship-policy-dto.js";
import { NativeOracles } from "../constants/ChainlinkOracles.js";
import { PaymasterRoutesOpts } from "../types/arka-config-dto.js";

const paymasterRoutes: FastifyPluginAsync<PaymasterRoutesOpts> = async (server, options: PaymasterRoutesOpts) => {

  const {paymaster} = options;

  const SUPPORTED_ENTRYPOINTS = {
    EPV_06: server.config.EPV_06,
    EPV_07: server.config.EPV_07
  }

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
    client = new SecretsManagerClient();
  }

  server.post("/",
    async function (request, reply) {
      try {
        printRequest("/", request, server.log);
        const query: any = request.query;
        const body: any = request.body;
        if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
        const userOp = body.params[0];
        const entryPoint = body.params[1];
        let context = body.params[2];
        let gasToken = context?.token ? context.token : null;
        let mode = context?.mode ? String(context.mode) : "sponsor";
        let chainId = query['chainId'] ?? body.params[3];
        const api_key = query['apiKey'] ?? body.params[4];
        let epVersion: EPVersions = DEFAULT_EP_VERSION;
        let tokens_list: string[] = [];
        let sponsorDetails = false, estimate = true, tokenQuotes = false;

        if (body.method) {
          switch (body.method) {
            case 'pm_getPaymasterData': {
              estimate = false;
              sponsorDetails = true;
            }
            // eslint-disable-next-line no-fallthrough
            case 'pm_getPaymasterStubData': {
              chainId = BigNumber.from(body.params[2]).toNumber();
              context = body.params[3];
              gasToken = context?.token ? context.token : null;
              mode = context?.mode ? String(context.mode) : "sponsor";
              break;
            }
            case 'pm_sponsorUserOperation': {
              break;
            }
            case 'pm_getERC20TokenQuotes': {
              if (!Array.isArray(context)) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.CONTEXT_NOT_ARRAY });
              const validAddresses = context.every((ele: any) => ethers.utils.isAddress(ele.token));
              if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_ADDRESS_PASSSED })
              tokens_list = context.map((ele: any) => ethers.utils.getAddress(ele.token));
              tokenQuotes = true;
              break;
            }
            default: {
              return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_METHOD });
            }
          }
        }
        if (!api_key || typeof (api_key) !== "string")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (!SUPPORTED_ENTRYPOINTS.EPV_06?.includes(entryPoint) && !SUPPORTED_ENTRYPOINTS.EPV_07?.includes(entryPoint))
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_ENTRYPOINT })

        if (SUPPORTED_ENTRYPOINTS.EPV_06?.includes(entryPoint)) epVersion = EPVersions.EPV_06;
        else epVersion = EPVersions.EPV_07;

        let customPaymasters = [];
        let customPaymastersV2 = [];
        let multiTokenPaymasters = [];
        let multiTokenOracles = [];
        let privateKey = '';
        let sponsorName = '', sponsorImage = '';
        let contractWhitelistMode = false;
        let bundlerApiKey = api_key;

        const apiKeyEntity = await server.apiKeyRepository.findOneByApiKey(api_key);

        if (!apiKeyEntity) {
          server.log.error("APIKey not configured in database")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        }

        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) {
            server.log.info("Invalid Api Key provided")
            return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          }
          privateKey = secrets['PRIVATE_KEY'];
        } else {
          // privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          privateKey = apiKeyEntity.privateKey;
        }

        if (apiKeyEntity.erc20Paymasters) {
          const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
          customPaymasters = JSON.parse(buffer.toString());
        }

        if (apiKeyEntity.erc20PaymastersV2) {
          const buffer = Buffer.from(apiKeyEntity.erc20PaymastersV2, 'base64');
          customPaymastersV2 = JSON.parse(buffer.toString());
        }

        if (apiKeyEntity.multiTokenPaymasters) {
          const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
          multiTokenPaymasters = JSON.parse(buffer.toString());
        }

        if (apiKeyEntity.multiTokenOracles) {
          const buffer = Buffer.from(apiKeyEntity.multiTokenOracles, 'base64');
          multiTokenOracles = JSON.parse(buffer.toString());
        }

        if (apiKeyEntity.bundlerApiKey) {
          bundlerApiKey = apiKeyEntity.bundlerApiKey;
        }

        sponsorName = apiKeyEntity.sponsorName ? apiKeyEntity.sponsorName : '';
        sponsorImage = apiKeyEntity.logoUrl ? apiKeyEntity.logoUrl : '';
        const supportedNetworks = apiKeyEntity.supportedNetworks;
        const noOfTxns = apiKeyEntity.noOfTransactionsInAMonth ?? 0;
        const txnMode = apiKeyEntity.transactionLimit;
        const indexerEndpoint = apiKeyEntity.indexerEndpoint ?? process.env.DEFAULT_INDEXER_ENDPOINT;
        contractWhitelistMode = apiKeyEntity.contractWhitelistMode ?? false;

        if (
          !userOp ||
          !entryPoint ||
          !chainId ||
          !mode ||
          isNaN(chainId)
        ) {
          server.log.error("Incomplete body data provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }

        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }

        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', [entryPoint]);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let bundlerUrl = networkConfig.bundler;
        if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
        server.log.warn(networkConfig, `Network Config fetched for ${api_key}: `);
        let result: any;

        if (tokenQuotes) {
          if (epVersion !== EPVersions.EPV_06)
            throw new Error('Currently only EPV06 entryPoint address is supported')
          if (!networkConfig.MultiTokenPaymasterOracleUsed ||
            !(networkConfig.MultiTokenPaymasterOracleUsed == "orochi" || networkConfig.MultiTokenPaymasterOracleUsed == "chainlink" || networkConfig.MultiTokenPaymasterOracleUsed == "etherspotChainlink"))
            throw new Error("Oracle is not Defined/Invalid");
          if (!multiTokenPaymasters[chainId]) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK })
          if (networkConfig.MultiTokenPaymasterOracleUsed == "chainlink" && !NativeOracles[chainId])
            throw new Error("Native Oracle address not set for this chainId")
          result = await paymaster.getQuotesMultiToken(userOp, entryPoint, chainId, multiTokenPaymasters, tokens_list, multiTokenOracles, bundlerUrl, networkConfig.MultiTokenPaymasterOracleUsed, NativeOracles[chainId], server.log);
        }
        else {
          if (gasToken && ethers.utils.isAddress(gasToken)) gasToken = ethers.utils.getAddress(gasToken)

          if (mode.toLowerCase() == 'multitoken' &&
            !(multiTokenPaymasters[chainId] && multiTokenPaymasters[chainId][gasToken]) &&
            !(multiTokenOracles[chainId] && multiTokenOracles[chainId][gasToken]) &&
            !paymaster.coingeckoPrice.get(`${chainId}-${gasToken}`)
          ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })

          switch (mode.toLowerCase()) {
            case 'eps': {
              const date = new Date();
              const provider = new providers.JsonRpcProvider(bundlerUrl);
              const signer = new Wallet(privateKey, provider)

              // get chainid from provider
              const chainId = await provider.getNetwork();

              // get sponsorshipPolicy for the user from walletAddress and entrypoint version
              const sponsorshipPolicy: SponsorshipPolicy | null = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndSupportedEPVersion(apiKeyEntity.walletAddress, getEPVersion(epVersion));
              if (!sponsorshipPolicy) {
                const errorMessage: string = generateErrorMessage(ErrorMessage.ACTIVE_SPONSORSHIP_POLICY_NOT_FOUND, { walletAddress: apiKeyEntity.walletAddress, epVersion: epVersion, chainId: chainId.chainId });
                return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
              }

              if (!Object.assign(new SponsorshipPolicy(), sponsorshipPolicy).isApplicable) {
                const errorMessage: string = generateErrorMessage(ErrorMessage.NO_ACTIVE_SPONSORSHIP_POLICY_FOR_CURRENT_TIME, { walletAddress: apiKeyEntity.walletAddress, epVersion: epVersion, chainId: chainId.chainId });
                return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
              }

              // get supported networks from sponsorshipPolicy
              const supportedNetworks: number[] | undefined | null = sponsorshipPolicy.enabledChains;
              if (!supportedNetworks || !supportedNetworks.includes(chainId.chainId)) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });

              if (txnMode) {
                const signerAddress = await signer.getAddress();
                const IndexerData = await getIndexerData(signerAddress, userOp.sender, date.getMonth(), date.getFullYear(), noOfTxns, indexerEndpoint ?? '');
                if (IndexerData.length >= noOfTxns) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.QUOTA_EXCEEDED })
              }
              const validUntil = context?.validUntil ? new Date(context.validUntil) : date;
              const validAfter = context?.validAfter ? new Date(context.validAfter) : date;
              const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
              const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0)) - 60).toString(16);
              let str = '0x'
              let str1 = '0x'
              for (let i = 0; i < 14 - hex.length; i++) {
                str += '0';
              }
              for (let i = 0; i < 14 - hex1.length; i++) {
                str1 += '0';
              }
              str += hex;
              str1 += hex1;
              if (contractWhitelistMode) {
                const contractWhitelistResult = await checkContractWhitelist(userOp.callData, chainId.chainId, signer.address);
                if (!contractWhitelistResult) throw new Error('Contract Method not whitelisted');
              }
              if (epVersion === EPVersions.EPV_06)
                result = await paymaster.signV06(userOp, str, str1, entryPoint, networkConfig.contracts.etherspotPaymasterAddress, bundlerUrl, signer, estimate, server.log);
              else {
                const globalWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key);
                if (!globalWhitelistRecord?.addresses.includes(userOp.sender)) {
                  const existingWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key, sponsorshipPolicy.id);
                  if (!existingWhitelistRecord?.addresses.includes(userOp.sender)) throw new Error('This sender address has not been whitelisted yet');
                }
                result = await paymaster.signV07(userOp, str, str1, entryPoint, networkConfig.contracts.etherspotPaymasterAddress, bundlerUrl, signer, estimate, server.log);
              }
              break;
            }
            case 'erc20': {
              if (epVersion === EPVersions.EPV_06) {
                if (
                  !(PAYMASTER_ADDRESS[chainId] && PAYMASTER_ADDRESS[chainId][gasToken]) &&
                  !(customPaymasters[chainId] && customPaymasters[chainId][gasToken])
                ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })
                let paymasterAddress: string;
                if (customPaymasters[chainId] && customPaymasters[chainId][gasToken]) paymasterAddress = customPaymasters[chainId][gasToken];
                else paymasterAddress = PAYMASTER_ADDRESS[chainId][gasToken]
                result = await paymaster.pimlico(userOp, bundlerUrl, entryPoint, paymasterAddress, server.log);
              } else if (epVersion === EPVersions.EPV_07) {
                if (
                  !(customPaymastersV2[chainId] && customPaymastersV2[chainId][gasToken])
                ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })
                const paymasterAddress = customPaymastersV2[chainId][gasToken];
                result = await paymaster.ERC20PaymasterV07(userOp, bundlerUrl, entryPoint, paymasterAddress, estimate, server.log);
              } else {
                throw new Error(`Currently only ${SUPPORTED_ENTRYPOINTS.EPV_06} & ${SUPPORTED_ENTRYPOINTS.EPV_07} entryPoint addresses are supported`)
              }
              break;
            }
            case 'multitoken': {
              if (epVersion !== EPVersions.EPV_06)
                throw new Error('Currently only EPV06 entryPoint address is supported')
              const date = new Date();
              const provider = new providers.JsonRpcProvider(bundlerUrl);
              const signer = new Wallet(privateKey, provider)
              const validUntil = context.validUntil ? new Date(context.validUntil) : date;
              const validAfter = context.validAfter ? new Date(context.validAfter) : date;
              const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
              const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0)) - 60).toString(16);
              let str = '0x'
              let str1 = '0x'
              for (let i = 0; i < 14 - hex.length; i++) {
                str += '0';
              }
              for (let i = 0; i < 14 - hex1.length; i++) {
                str1 += '0';
              }
              str += hex;
              str1 += hex1;
              if (!networkConfig.MultiTokenPaymasterOracleUsed ||
                !(networkConfig.MultiTokenPaymasterOracleUsed == "orochi" || networkConfig.MultiTokenPaymasterOracleUsed == "chainlink" || networkConfig.MultiTokenPaymasterOracleUsed == "etherspotChainlink"))
                throw new Error("Oracle is not Defined/Invalid");
              if (networkConfig.MultiTokenPaymasterOracleUsed == "chainlink" && !NativeOracles[chainId])
                throw new Error("Native Oracle address not set for this chainId")
              result = await paymaster.signMultiTokenPaymaster(userOp, str, str1, entryPoint, multiTokenPaymasters[chainId][gasToken], gasToken, multiTokenOracles[chainId][gasToken], bundlerUrl, signer, networkConfig.MultiTokenPaymasterOracleUsed, NativeOracles[chainId], chainId, server.log);
              break;
            }
            case 'sponsor': {
              const date = new Date();
              const provider = new providers.JsonRpcProvider(bundlerUrl);
              const signer = new Wallet(privateKey, provider);

              // get chainid from provider
              const chainId = await provider.getNetwork();

              // get wallet_address from api_key
              const apiKeyData = await server.apiKeyRepository.findOneByApiKey(api_key);
              if (!apiKeyData) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_NOT_CONFIGURED_IN_DATABASE });

              const sponsorshipPolicy: SponsorshipPolicy | null = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndSupportedEPVersion(apiKeyData?.walletAddress, getEPVersion(epVersion));
              if (!sponsorshipPolicy) {
                const errorMessage: string = generateErrorMessage(ErrorMessage.ACTIVE_SPONSORSHIP_POLICY_NOT_FOUND, { walletAddress: apiKeyData?.walletAddress, epVersion: epVersion, chainId: chainId.chainId });
                return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
              }

              if (!Object.assign(new SponsorshipPolicy(), sponsorshipPolicy).isApplicable) {
                const errorMessage: string = generateErrorMessage(ErrorMessage.NO_ACTIVE_SPONSORSHIP_POLICY_FOR_CURRENT_TIME, { walletAddress: apiKeyData?.walletAddress, epVersion: epVersion, chainId: chainId.chainId });
                return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
              }
              
              // get supported networks from sponsorshipPolicy
              const supportedNetworks: number[] | undefined | null = sponsorshipPolicy.enabledChains;
              if (!supportedNetworks || !supportedNetworks.includes(chainId.chainId)) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });

              if (txnMode) {
                const signerAddress = await signer.getAddress();
                const IndexerData = await getIndexerData(signerAddress, userOp.sender, date.getMonth(), date.getFullYear(), noOfTxns, indexerEndpoint);
                if (IndexerData.length >= noOfTxns) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.QUOTA_EXCEEDED })
              }
              const validUntil = context?.validUntil ? new Date(context.validUntil) : date;
              const validAfter = context?.validAfter ? new Date(context.validAfter) : date;
              const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
              const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0)) - 60).toString(16);
              let str = '0x'
              let str1 = '0x'
              for (let i = 0; i < 14 - hex.length; i++) {
                str += '0';
              }
              for (let i = 0; i < 14 - hex1.length; i++) {
                str1 += '0';
              }
              str += hex;
              str1 += hex1;
              if (contractWhitelistMode) {
                const contractWhitelistResult = await checkContractWhitelist(userOp.callData, chainId.chainId, signer.address);
                if (!contractWhitelistResult) throw new Error('Contract Method not whitelisted');
              }

              const globalWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key);
              if (!globalWhitelistRecord?.addresses.includes(userOp.sender)) {
                const existingWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key, sponsorshipPolicy.id);
                if (!existingWhitelistRecord?.addresses.includes(userOp.sender)) throw new Error('This sender address has not been whitelisted yet');
              }

              if (epVersion === EPVersions.EPV_06) {
                if(!apiKeyEntity.verifyingPaymasters) {
                  return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.VP_NOT_DEPLOYED});
                }
                const paymasterAddr = JSON.parse(apiKeyEntity.verifyingPaymasters)[chainId.chainId];
                if(!paymasterAddr) {
                  return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.VP_NOT_DEPLOYED});
                }
                result = await paymaster.signV06(userOp, str, str1, entryPoint, paymasterAddr, bundlerUrl, signer, estimate, server.log);
              }
              else {
                if(!apiKeyEntity.verifyingPaymastersV2) {
                  return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.VP_NOT_DEPLOYED});
                }
                const paymasterAddr = JSON.parse(apiKeyEntity.verifyingPaymastersV2)[chainId.chainId];
                if(!paymasterAddr) {
                  return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.VP_NOT_DEPLOYED});
                }
                result = await paymaster.signV07(userOp, str, str1, entryPoint, paymasterAddr, bundlerUrl, signer, estimate, server.log);
              }
              break;
            }
            default: {
              return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_MODE });
            }
          }
        }
        server.log.info(result, 'Response sent: ');
        if (sponsorDetails) result.sponsor = { name: sponsorName, icon: sponsorImage };
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        if (err.name.includes("invalid address"))
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_ADDRESS_PASSSED })
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        request.log.error(err);
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
      }
    }
  );

  async function getIndexerData(sponsor: string, sender: string, month: number, year: number, noOfTxns: number, endpoint: string): Promise<any[]> {
    try {
      const query = gql`
        query {
          paymasterEvents(
            limit: ${noOfTxns}
            where: {month: ${month}, year: ${year}, paymaster: "${sponsor}", sender: "${sender}"}) 
          {
            items {
              sender
              paymaster
              transactionHash
              year
              month
            }
          }
        }`;
      const apiResponse: any = await GLRequest(endpoint, query);
      return apiResponse.paymasterEvents.items;
    } catch (err) {
      server.log.error(err);
      return [];
    }
  }

  // This works only when used with etherspot-modular-sdk & etherspot-prime-sdk
  async function checkContractWhitelist(callData: string, chainId: number, walletAddress: string): Promise<boolean> {
    let returnValue = true;
    const bytes4 = callData.substring(0, 10);
    if (bytes4 === '0xe9ae5c53') { // fn executeBatch encoding on epv7 
      const iface = new ethers.utils.Interface(['function execute(bytes32, bytes)']);
      const decodedData = iface.decodeFunctionData('execute', callData);
      const txnDatas = ethers.utils.defaultAbiCoder.decode(
        ["tuple(address target,uint256 value,bytes callData)[]"],
        decodedData[1],
        true
      );
      for (let i = 0; i < txnDatas[0].length; i++) {
        const transactionData = txnDatas[0][i]["callData"];
        if (transactionData !== "0x") {
          returnValue = false; // To see if anyone of the transactions is calling any data else returns true since all are native transfers
          try {
            const contractRecord = await server.contractWhitelistRepository.findOneByChainIdContractAddressAndWalletAddress(chainId, walletAddress, txnDatas[0][i]["target"]);
            if (contractRecord) {
              const iface1 = new ethers.utils.Interface(contractRecord.abi);
              const functionName = iface1.getFunction(transactionData.substring(0, 10))
              if (contractRecord.functionSelectors.includes(functionName.name)) {
                return true;
              }
            }
          } catch (err) {
            server.log.error(err);
            // something went wrong on decoding or functionName not present so continue with the loop to see all the transactions in the batch
            continue;
          }
        }
      }
    } else if (bytes4 === '0x47e1da2a') { // fn executeBatch encoding on epv6
      const iface = new ethers.utils.Interface(['function executeBatch(address[], uint256[], bytes[])']);
      const decodedData = iface.decodeFunctionData('executeBatch', callData);

      for (let i = 0; i < decodedData[2].length; i++) { // decodedData[2] will always be data array
        const transactionData = decodedData[2][i]
        if (transactionData !== "0x") {
          returnValue = false; // To see if anyone of the transactions is calling any data else returns true since all are native transfers
          try {
            const contractRecord = await server.contractWhitelistRepository.findOneByChainIdContractAddressAndWalletAddress(chainId, walletAddress, decodedData[0][i]);
            if (contractRecord) {
              const iface1 = new ethers.utils.Interface(contractRecord.abi);
              const functionName = iface1.getFunction(transactionData.substring(0, 10))
              if (contractRecord.functionSelectors.includes(functionName.name)) {
                return true;
              }
            }
          } catch (err) {
            server.log.error(err);
            // something went wrong on decoding or functionName not present so continue with the loop to see all the transactions in the batch
            continue;
          }
        }
      }
    }
    return returnValue;
  }
};

export default paymasterRoutes;
