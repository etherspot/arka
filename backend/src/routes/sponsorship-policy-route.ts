/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import ErrorMessage, { generateErrorMessage } from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { SponsorshipPolicyDto, getEPVersion } from "../types/sponsorship-policy-dto.js";
import { SponsorshipPolicy } from "models/sponsorship-policy.js";
import { getChainIdsFromSupportedNetworks } from "utils/common.js";

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

  // find one by apiKey and EPVersion
  server.get<{ Params: RouteParams }>("/policy/apikey/:apiKey/epversion/:epVersion/latest", async (request, reply) => {
    try {
      const apiKey = request.params.apiKey;
      const epVersion = request.params.epVersion;

      if (!apiKey || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      // get wallet_address from api_key
      const apiKeyData = await server.apiKeyRepository.findOneByApiKey(apiKey);
      if (!apiKeyData) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });

      // get sponsorshipPolicy for the user from walletAddress and entrypoint version
      const sponsorshipPolicy: SponsorshipPolicy | null = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndHasSupportedEPVersion(apiKeyData?.walletAddress, getEPVersion(epVersion));
      if (!sponsorshipPolicy) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      if (!Object.assign(new SponsorshipPolicy(), sponsorshipPolicy).isApplicable) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.NO_ACTIVE_SPONSORSHIP_POLICY_FOR_CURRENT_TIME });

      return reply.code(ReturnCode.SUCCESS).send(sponsorshipPolicy);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find one By WalletAddress And EPVersion
  server.get<{ Params: RouteParams }>("/policy/walletaddress/:walletAddress/epversion/:epVersion/latest", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const epVersion = request.params.epVersion;

      if (!walletAddress || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      const result = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndHasSupportedEPVersion(walletAddress, getEPVersion(epVersion));
      if (!result) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // find all by apiKey And EPVersion
  server.get<{ Params: RouteParams }>("/policy/apikey/:apiKey/epversion/:epVersion", async (request, reply) => {
    try {
      const apiKey = request
        .params.apiKey;
      const epVersion = request.params.epVersion;

      if (!apiKey || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      // get wallet_address from api_key
      const apiKeyData = await server.apiKeyRepository.findOneByApiKey(apiKey);
      if (!apiKeyData) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });

      // get all sponsorshipPolicies for the user from walletAddress and entrypoint version
      const walletAddress = apiKeyData.walletAddress;

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

  // find all by walletAddress And EPVersion
  server.get<{ Params: RouteParams }>("/policy/walletaddress/:walletAddress/epversion/:epVersion", async (request, reply) => {
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

  // Get the latest policy for a given apiKey, epVersion, and chainId
  server.get<{ Params: RouteParams }>("/policy/apikey/:apiKey/epversion/:epVersion/chainid/:chainId/latest", async (request, reply) => {
    try {
      const apiKey = request.params.apiKey;
      const epVersion = request.params.epVersion;
      const chainId = Number(request.params.chainId);

      if (!apiKey || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      // get wallet_address from api_key
      const apiKeyData = await server.apiKeyRepository.findOneByApiKey(apiKey);
      if (!apiKeyData) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });

      // get sponsorshipPolicy for the user from walletAddress and entrypoint version
      const sponsorshipPolicy: SponsorshipPolicy | null = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndHasSupportedEPVersionAndChain(apiKeyData?.walletAddress, getEPVersion(epVersion), chainId);
      if (!sponsorshipPolicy) {
        const errorMessage: string = generateErrorMessage(ErrorMessage.ACTIVE_SPONSORSHIP_POLICY_NOT_FOUND, { walletAddress: apiKeyData?.walletAddress, epVersion: epVersion, chainId: chainId });
        return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
      }

      if (!Object.assign(new SponsorshipPolicy(), sponsorshipPolicy).isApplicable) {
        const errorMessage: string = generateErrorMessage(ErrorMessage.NO_ACTIVE_SPONSORSHIP_POLICY_FOR_CURRENT_TIME, { walletAddress: apiKeyData?.walletAddress, epVersion: epVersion, chainId: chainId });
        return reply.code(ReturnCode.FAILURE).send({ error: errorMessage });
      }

      return reply.code(ReturnCode.SUCCESS).send(sponsorshipPolicy);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_QUERY_SPONSORSHIP_POLICY });
    }
  })

  // Get the latest policy for a given walletAddress, epVersion, and chainId
  server.get<{ Params: RouteParams }>("/policy/walletAddress/:walletAddress/epversion/:epVersion/chainid/:chainId/latest", async (request, reply) => {
    try {
      const walletAddress = request.params.walletAddress;
      const epVersion = request.params.epVersion;
      const chainId = Number(request.params.chainId);

      if (!walletAddress || !epVersion || chainId === undefined || isNaN(chainId)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      // get sponsorshipPolicy for the user from walletAddress and entrypoint version
      const sponsorshipPolicy: SponsorshipPolicy | null = await server.sponsorshipPolicyRepository.findOneByWalletAddressAndHasSupportedEPVersionAndChain(walletAddress, getEPVersion(epVersion), chainId);
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

  // Get all policies for a given apiKey, epVersion, and chainId
  server.get<{ Params: RouteParams }>("/policy/apikey/:apiKey/epversion/:epVersion/chainid/:chainId", async (request, reply) => {
    try {
      const apiKey = request.params.apiKey;
      const epVersion = request.params.epVersion;
      const chainId = Number(request.params.chainId);

      if (!apiKey || !epVersion) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_DATA });
      }

      // get wallet_address from api_key
      const apiKeyData = await server.apiKeyRepository.findOneByApiKey(apiKey);
      if (!apiKeyData) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });

      const result = await server.sponsorshipPolicyRepository.findAllByWalletAddressAndSupportedEPVersionAndChain(apiKeyData.walletAddress, getEPVersion(epVersion), chainId);
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
  server.get<{ Params: RouteParams }>("/policy/walletAddress/:walletAddress/epversion/:epVersion/chainid/:chainId", async (request, reply) => {
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

  // Mutability of the policy
  server.post("/addPolicy", async function (request, reply) {
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

      // verify if api key exists for the given wallet address
      const apiKey = await server.apiKeyRepository.findOneByWalletAddress(sponsorshipPolicyDto.walletAddress);

      if (!apiKey) {
        return reply.code(ReturnCode.FAILURE).send({
          error: ErrorMessage.API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS
        });
      }

      // apiKey has supportedNetworks and validate if the enabledChains array in SponsorshipPolicyDto is a subset of supportedNetworks
      const supportedNetworks = apiKey.supportedNetworks;
      if (!supportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const apiKeySupportedChains: number[] = getChainIdsFromSupportedNetworks(supportedNetworks as string);
      const sponsorshipPolicySupportedChains = sponsorshipPolicyDto.enabledChains;

      if (sponsorshipPolicySupportedChains && sponsorshipPolicySupportedChains.length > 0) {

        if (!sponsorshipPolicySupportedChains.every((chainId: number) => sponsorshipPolicySupportedChains.includes(chainId))) {

          //generate a comma separate string of sponsorshipPolicySupportedChains
          const sponsorshipPolicySupportedChainsCSV: string = sponsorshipPolicySupportedChains.join(',');

          //generate a comma separated string of apiKeySupportedChains
          const apiKeySupportedChainsCSV: string = apiKeySupportedChains.join(',');
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

  server.delete<{ Params: RouteParams }>("/deletePolicy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(400).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      const result = await server.sponsorshipPolicyRepository.deleteSponsorshipPolicy(id);
      return reply.code(200).send({ message: `Successfully deleted policy with id ${id}` });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: ErrorMessage.FAILED_TO_DELETE_SPONSORSHIP_POLICY });
    }
  });

  server.put<{ Body: SponsorshipPolicyDto }>("/updatePolicy", async (request, reply) => {
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
  server.put<{ Params: RouteParams }>("/enablePolicy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      const existingSponsorshipPolicy = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!existingSponsorshipPolicy) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      const updatedPolicy = await server.sponsorshipPolicyRepository.enableSponsorshipPolicy(id);
      return reply.code(ReturnCode.SUCCESS).send(updatedPolicy);
    } catch (err) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_ENABLE_SPONSORSHIP_POLICY });
    }
  });

  // disable policy
  server.put<{ Params: RouteParams }>("/disablePolicy/:id", async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        return reply.code(ReturnCode.BAD_REQUEST).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID });
      }

      const existingSponsorshipPolicy = await server.sponsorshipPolicyRepository.findOneById(id);
      if (!existingSponsorshipPolicy) {
        return reply.code(ReturnCode.NOT_FOUND).send({ error: ErrorMessage.SPONSORSHIP_POLICY_NOT_FOUND });
      }

      const updatedPolicy = await server.sponsorshipPolicyRepository.disableSponsorshipPolicy(id);
      return reply.code(ReturnCode.SUCCESS).send(updatedPolicy);
    } catch (err) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_DISABLE_SPONSORSHIP_POLICY });
    }
  });
};

export default sponsorshipPolicyRoutes;
