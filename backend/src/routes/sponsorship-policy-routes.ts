/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import ErrorMessage, { generateErrorMessage } from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { SponsorshipPolicyDto, getEPVersion } from "../types/sponsorship-policy-dto.js";
import { SponsorshipPolicy } from "../models/sponsorship-policy.js";
import { getChainIdsFromDefaultSupportedNetworks, getChainIdsFromSupportedNetworks } from "../utils/common.js";

interface RouteParams {
  id?: string;
  apiKey?: string;
  walletAddress?: string;
  epVersion?: string;
  chainId?: number;
}

const sponsorshipPolicyRoutes: FastifyPluginAsync = async (server) => {

  // Get all policies
  server.get("/policy", async (request, reply) => {
    try {
      const policies: SponsorshipPolicy[] = await server.sponsorshipPolicyRepository.findAll();
      if (!policies.length) return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });

      // Sort policies by createdTime
      policies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return reply.code(ReturnCode.SUCCESS).send(policies);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  });

  // get a Policy by id
  server.get<{ Params: RouteParams }>("/policy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      const result = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!result) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find all by walletAddress
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;

      if (!walletAddress) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findAllByWalletAddress(walletAddress);
      if (!result.length) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find all by walletAddress And EPVersion
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress/ep-version/:epVersion", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const epVersion = request.params.epVersion;

      if (!walletAddress || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findAllByWalletAddressAndSupportedEPVersion(walletAddress, getEPVersion(epVersion));
      if (!result.length) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // Get all policies for a given walletAddress, epVersion, and chainId
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress/ep-version/:epVersion/chain-id/:chainId", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const epVersion = request.params.epVersion;
      const chainId = Number(request.params.chainId);

      if (!walletAddress || !epVersion || chainId === undefined || isNaN(chainId)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findAllByWalletAddressAndSupportedEPVersionAndChain(walletAddress, getEPVersion(epVersion), chainId);
      if (!result.length) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find latest by walletAddress
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress/latest", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;

      if (!walletAddress) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findOneByWalletAddress(walletAddress);
      if (!result) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find latest by walletAddress And chainId
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress/chain-id/:chainId/latest", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const chainId = request.params.chainId;

      if (!walletAddress || !chainId) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndChain(walletAddress, chainId);
      if (!result) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find latest By WalletAddress And EPVersion
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress/ep-version/:epVersion/latest", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const epVersion = request.params.epVersion;

      if (!walletAddress || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndSupportedEPVersion(walletAddress, getEPVersion(epVersion));
      if (!result) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find latest policy for a given walletAddress, epVersion, and chainId
  server.get<{ Params: RouteParams }>("/policy/wallet-address/:walletAddress/ep-version/:epVersion/chain-id/:chainId/latest", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const epVersion = request.params.epVersion;
      const chainId = Number(request.params.chainId);

      if (!walletAddress || !epVersion || chainId === undefined || isNaN(chainId)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      // get sponsorshipPolicy for the user from walletAddress and entrypoint version
      const sponsorshipPolicy: SponsorshipPolicy | null = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndSupportedEPVersion(walletAddress, getEPVersion(epVersion));
      if (!sponsorshipPolicy) {
        const errorMessage: string = generateErrorMessage(ErrorMessage.ACTIVE_SPONSORSHIP_POLICY_NOT_FOUND, { walletAddress: walletAddress, epVersion: epVersion, chainId: chainId });
        return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
      }

      if (!Object.assign(new SponsorshipPolicy(), sponsorshipPolicy).isApplicable) {
        const errorMessage: string = generateErrorMessage(ErrorMessage.NO_ACTIVE_SPONSORSHIP_POLICY_FOR_CURRENT_TIME, { walletAddress: walletAddress, epVersion: epVersion, chainId: chainId });
        return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
      }

      return reply.code(ReturnCode.SUCCESS).send(sponsorshipPolicy);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // Middleware to validate API key and wallet address
  async function validateRequestHeader(request: any, reply: any, server: FastifyInstance, walletAddress: string) {

    // extract the apiKey from the header    
    const apiKeyHeaderValue = request.headers['apikey'];

    if (!apiKeyHeaderValue) {
      return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.API_KEY_IS_REQUIRED_IN_HEADER });
    }

    // Retrieve the wallet address associated with the API key
    const apiKey = await server.apiKeyRepository.findOneByApiKey(apiKeyHeaderValue);
    if (!apiKey) {
      return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_API_KEY });
    }

    // Compare wallet addresses
    if (apiKey.walletAddress !== walletAddress) {
      return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.WALLET_ADDRESS_DOES_NOT_MATCH_FOR_THE_API_KEY });
    }
  }

  // create a new policy
  server.post("/add-policy", async function (request, reply) {
    try {
      // parse the request body as JSON
      const sponsorshipPolicyDto: SponsorshipPolicyDto = JSON.parse(JSON.stringify(request.body)) as SponsorshipPolicyDto;
      if (!sponsorshipPolicyDto) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });

      // id is to be null 
      if (sponsorshipPolicyDto.id || sponsorshipPolicyDto.id as number > 0 ||
        !sponsorshipPolicyDto.walletAddress ||
        !sponsorshipPolicyDto.name) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY });
      }

      await validateRequestHeader(request, reply, server, sponsorshipPolicyDto.walletAddress);

      // verify if api key exists for the given wallet address
      const apiKey = await server.apiKeyRepository.findOneByWalletAddress(sponsorshipPolicyDto.walletAddress);

      if (!apiKey) {
        return reply.code(ReturnCode.FAILURE).send({
          error: ErrorMessage.API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS
        });
      }

      // apiKey has supportedNetworks and validate if the enabledChains array in SponsorshipPolicyDto is a subset of supportedNetworks
      const supportedNetworks = apiKey.supportedNetworks;

      // get supportedNetworks from defaultConfig
      const supportedChains: number[] = supportedNetworks ? getChainIdsFromSupportedNetworks(supportedNetworks as string) : getChainIdsFromDefaultSupportedNetworks();
      
      if (!supportedChains || supportedChains.length === 0) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }

      const sponsorshipPolicySupportedChains = sponsorshipPolicyDto.enabledChains;

      if (!sponsorshipPolicyDto.isApplicableToAllNetworks && sponsorshipPolicySupportedChains && sponsorshipPolicySupportedChains.length > 0) {

        if (!sponsorshipPolicySupportedChains.every((chainId: number) => supportedChains.includes(chainId))) {

          //generate a comma separate string of sponsorshipPolicySupportedChains
          const sponsorshipPolicySupportedChainsCSV: string = sponsorshipPolicySupportedChains.join(',');

          //generate a comma separated string of apiKeySupportedChains
          const apiKeySupportedChainsCSV: string = supportedChains.join(',');
          const errorMessage: string = generateErrorMessage(ErrorMessage.SPONSORSHIP_POLICY_CHAINS_NOT_IN_SUBSET_OF_APIKEY_SUPPORTED_CHAINS, { sponsorshipPolicyChains: sponsorshipPolicySupportedChainsCSV, apiKeyChains: apiKeySupportedChainsCSV });

          return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
        }
      }

      // TODO this needs to be replaced where user should enable after creation
      // TODO default policy should be disabled
      sponsorshipPolicyDto.isEnabled = true;

      const result = await server.sponsorshipPolicyRepository.createSponsorshipPolicy(sponsorshipPolicyDto);
      if (!result) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_CREATE_SPONSORSHIP_POLICY });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_CREATE_SPONSORSHIP_POLICY });
    }
  })

  // delete a policy
  server.delete<{ Params: RouteParams }>("/delete-policy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(400).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      // check if policy exists and pull walletAddress of Policy
      const existingSponsorshipPolicy = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!existingSponsorshipPolicy) {
        return reply.code(404).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      // get apiKey of the WalletAddress
      const apiKey = await server.apiKeyRepository.findOneByWalletAddress(existingSponsorshipPolicy.walletAddress);
      if (!apiKey) {
        return reply.code(400).send({ error: ErrorMessage.API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS });
      }

      // validate walletAddress of apiKey with the walletAddress in existingSponsorshipPolicy
      if (apiKey.walletAddress !== existingSponsorshipPolicy.walletAddress) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.WALLET_ADDRESS_DOES_NOT_MATCH_FOR_THE_API_KEY });
      }

      validateRequestHeader(request, reply, server, apiKey.walletAddress);

      await server.whitelistRepository.deleteAllBySponsorshipPolicies(id);

      await server.sponsorshipPolicyRepository.deleteSponsorshipPolicy(id);
      return reply.code(200).send({ message: `Successfully deleted policy with id ${id}` });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: ErrorMessage.FAILED_TO_DELETE_SPONSORSHIP_POLICY });
    }
  });

  // update a policy
  server.put<{ Body: SponsorshipPolicyDto }>("/update-policy", async (request, reply) => {
    try {
      const sponsorshipPolicyDto: SponsorshipPolicyDto = JSON.parse(JSON.stringify(request.body)) as SponsorshipPolicyDto;
      const id = sponsorshipPolicyDto.id;

      if (!id || isNaN(id)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      const existingSponsorshipPolicy = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!existingSponsorshipPolicy) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      // get apiKey of the WalletAddress
      const apiKey = await server.apiKeyRepository.findOneByWalletAddress(existingSponsorshipPolicy.walletAddress);
      if (!apiKey) {
        return reply.code(400).send({ error: ErrorMessage.API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS });
      }

      // validate walletAddress of apiKey with the walletAddress in existingSponsorshipPolicy
      if (apiKey.walletAddress !== existingSponsorshipPolicy.walletAddress) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.WALLET_ADDRESS_DOES_NOT_MATCH_FOR_THE_API_KEY });
      }

      validateRequestHeader(request, reply, server, apiKey.walletAddress);

      // cannot update a disabled policy
      if (!existingSponsorshipPolicy.isEnabled) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.SPONSORSHIP_POLICY_IS_DISABLED });
      }

      const updatedPolicy = await server.sponsorshipPolicyRepository.updateSponsorshipPolicy(sponsorshipPolicyDto);
      return reply.code(ReturnCode.SUCCESS).send(updatedPolicy);
    } catch (err) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_UPDATE_SPONSORSHIP_POLICY });
    }
  });

  // enable policy
  server.put<{ Params: RouteParams }>("/enable-policy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      // check if policy exists and pull walletAddress of Policy
      const existingSponsorshipPolicy = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!existingSponsorshipPolicy) {
        return reply.code(404).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      // get apiKey of the WalletAddress
      const apiKey = await server.apiKeyRepository.findOneByWalletAddress(existingSponsorshipPolicy.walletAddress);
      if (!apiKey) {
        return reply.code(400).send({ error: ErrorMessage.API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS });
      }

      // validate walletAddress of apiKey with the walletAddress in existingSponsorshipPolicy
      if (apiKey.walletAddress !== existingSponsorshipPolicy.walletAddress) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.WALLET_ADDRESS_DOES_NOT_MATCH_FOR_THE_API_KEY });
      }

      validateRequestHeader(request, reply, server, apiKey.walletAddress);

      await server.sponsorshipPolicyRepository.enableSponsorshipPolicy(id);
      return reply.code(ReturnCode.SUCCESS).send({ message: `Successfully enabled policy with id ${id}` });

    } catch (err) {
      const errorMessage: string = generateErrorMessage(ErrorMessage.FAILED_TO_ENABLE_SPONSORSHIP_POLICY, { error: err as string});
      request.log.error(errorMessage);
      return reply.code(ReturnCode.INTERNAL_SERVER_ERROR).send({ error: errorMessage });
    }
  });

  // disable policy
  server.put<{ Params: RouteParams }>("/disable-policy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      const existingSponsorshipPolicy = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!existingSponsorshipPolicy) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      // get apiKey of the WalletAddress
      const apiKey = await server.apiKeyRepository.findOneByWalletAddress(existingSponsorshipPolicy.walletAddress);
      if (!apiKey) {
        return reply.code(400).send({ error: ErrorMessage.API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS });
      }

      // validate walletAddress of apiKey with the walletAddress in existingSponsorshipPolicy
      if (apiKey.walletAddress !== existingSponsorshipPolicy.walletAddress) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.WALLET_ADDRESS_DOES_NOT_MATCH_FOR_THE_API_KEY });
      }

      validateRequestHeader(request, reply, server, apiKey.walletAddress);

      await server.sponsorshipPolicyRepository.disableSponsorshipPolicy(id);
      return reply.code(ReturnCode.SUCCESS).send({ message: `Successfully disabled policy with id ${id}` });
    } catch (err) {
      const errorMessage: string = generateErrorMessage(ErrorMessage.FAILED_TO_DISABLE_SPONSORSHIP_POLICY, { error: err as string});
      request.log.error(errorMessage);
      return reply.code(ReturnCode.INTERNAL_SERVER_ERROR).send({ error: errorMessage });
    }
  });
};

export default sponsorshipPolicyRoutes;
