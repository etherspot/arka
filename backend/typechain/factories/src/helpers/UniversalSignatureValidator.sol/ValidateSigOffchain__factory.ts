/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BytesLike,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  ValidateSigOffchain,
  ValidateSigOffchainInterface,
} from "../../../../src/helpers/UniversalSignatureValidator.sol/ValidateSigOffchain";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_signer",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_hash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161162938038061162983398181016040528101906100329190610303565b6000604051610040906100ed565b604051809103906000f08015801561005c573d6000803e3d6000fd5b50905060008173ffffffffffffffffffffffffffffffffffffffff16638f0684308686866040518463ffffffff1660e01b815260040161009e939291906103e5565b6020604051808303816000875af11580156100bd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100e1919061045b565b9050806000526001601ff35b6111a08061048983390190565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101398261010e565b9050919050565b6101498161012e565b811461015457600080fd5b50565b60008151905061016681610140565b92915050565b6000819050919050565b61017f8161016c565b811461018a57600080fd5b50565b60008151905061019c81610176565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101f5826101ac565b810181811067ffffffffffffffff82111715610214576102136101bd565b5b80604052505050565b60006102276100fa565b905061023382826101ec565b919050565b600067ffffffffffffffff821115610253576102526101bd565b5b61025c826101ac565b9050602081019050919050565b60005b8381101561028757808201518184015260208101905061026c565b60008484015250505050565b60006102a66102a184610238565b61021d565b9050828152602081018484840111156102c2576102c16101a7565b5b6102cd848285610269565b509392505050565b600082601f8301126102ea576102e96101a2565b5b81516102fa848260208601610293565b91505092915050565b60008060006060848603121561031c5761031b610104565b5b600061032a86828701610157565b935050602061033b8682870161018d565b925050604084015167ffffffffffffffff81111561035c5761035b610109565b5b610368868287016102d5565b9150509250925092565b61037b8161012e565b82525050565b61038a8161016c565b82525050565b600081519050919050565b600082825260208201905092915050565b60006103b782610390565b6103c1818561039b565b93506103d1818560208601610269565b6103da816101ac565b840191505092915050565b60006060820190506103fa6000830186610372565b6104076020830185610381565b818103604083015261041981846103ac565b9050949350505050565b60008115159050919050565b61043881610423565b811461044357600080fd5b50565b6000815190506104558161042f565b92915050565b60006020828403121561047157610470610104565b5b600061047f84828501610446565b9150509291505056fe608060405234801561001057600080fd5b50611180806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806316d43401146100465780638f0684301461007657806398ef1ed8146100a6575b600080fd5b610060600480360381019061005b91906108a8565b6100d6565b60405161006d919061093f565b60405180910390f35b610090600480360381019061008b919061095a565b6105ad565b60405161009d919061093f565b60405180910390f35b6100c060048036038101906100bb919061095a565b61063e565b6040516100cd919061093f565b60405180910390f35b6000808673ffffffffffffffffffffffffffffffffffffffff163b9050606060007f649264926492649264926492649264926492649264926492649264926492649260001b878760208a8a905061012d9190610a07565b908a8a90509261013f93929190610a45565b9061014a9190610a98565b14905080156102555760006060888860009060208c8c905061016c9190610a07565b9261017993929190610a45565b8101906101869190610c76565b8096508193508294505050506000850361024e576000808373ffffffffffffffffffffffffffffffffffffffff16836040516101c29190610d72565b6000604051808303816000865af19150503d80600081146101ff576040519150601f19603f3d011682016040523d82523d6000602084013e610204565b606091505b50915091508161024b57806040517f9d0d6e2d0000000000000000000000000000000000000000000000000000000081526004016102429190610dd3565b60405180910390fd5b50505b505061029d565b86868080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505091505b80806102a95750600083115b15610415578873ffffffffffffffffffffffffffffffffffffffff16631626ba7e89846040518363ffffffff1660e01b81526004016102e9929190610e04565b602060405180830381865afa92505050801561032357506040513d601f19601f820116820180604052508101906103209190610e8c565b60015b610396573d8060008114610353576040519150601f19603f3d011682016040523d82523d6000602084013e610358565b606091505b50806040517f6f2a959900000000000000000000000000000000000000000000000000000000815260040161038d9190610dd3565b60405180910390fd5b6000631626ba7e60e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161490506000851480156103ef5750825b80156103f9575086155b1561040857806000526001601ffd5b80955050505050506105a4565b6041878790501461045b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161045290610f3c565b60405180910390fd5b6000878760009060209261047193929190610a45565b9061047c9190610a98565b90506000888860209060409261049493929190610a45565b9061049f9190610a98565b90506000898960408181106104b7576104b6610f5c565b5b9050013560f81c60f81b60f81c9050601b8160ff16141580156104de5750601c8160ff1614155b1561051e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161051590610ffd565b60405180910390fd5b8b73ffffffffffffffffffffffffffffffffffffffff1660018c838686604051600081526020016040526040516105589493929190611039565b6020604051602081039080840390855afa15801561057a573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff161496505050505050505b95945050505050565b60003073ffffffffffffffffffffffffffffffffffffffff166316d434018686868660016040518663ffffffff1660e01b81526004016105f19594939291906110ba565b6020604051808303816000875af1158015610610573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610634919061111d565b9050949350505050565b60003073ffffffffffffffffffffffffffffffffffffffff166316d434018686868660006040518663ffffffff1660e01b81526004016106829594939291906110ba565b6020604051808303816000875af19250505080156106be57506040513d601f19601f820116820180604052508101906106bb919061111d565b60015b610756573d80600081146106ee576040519150601f19603f3d011682016040523d82523d6000602084013e6106f3565b606091505b506000815190506001810361075257600160f81b8260008151811061071b5761071a610f5c565b5b602001015160f81c60f81b7effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149250505061075b565b8082fd5b809150505b949350505050565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006107a282610777565b9050919050565b6107b281610797565b81146107bd57600080fd5b50565b6000813590506107cf816107a9565b92915050565b6000819050919050565b6107e8816107d5565b81146107f357600080fd5b50565b600081359050610805816107df565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126108305761082f61080b565b5b8235905067ffffffffffffffff81111561084d5761084c610810565b5b60208301915083600182028301111561086957610868610815565b5b9250929050565b60008115159050919050565b61088581610870565b811461089057600080fd5b50565b6000813590506108a28161087c565b92915050565b6000806000806000608086880312156108c4576108c361076d565b5b60006108d2888289016107c0565b95505060206108e3888289016107f6565b945050604086013567ffffffffffffffff81111561090457610903610772565b5b6109108882890161081a565b9350935050606061092388828901610893565b9150509295509295909350565b61093981610870565b82525050565b60006020820190506109546000830184610930565b92915050565b600080600080606085870312156109745761097361076d565b5b6000610982878288016107c0565b9450506020610993878288016107f6565b935050604085013567ffffffffffffffff8111156109b4576109b3610772565b5b6109c08782880161081a565b925092505092959194509250565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610a12826109ce565b9150610a1d836109ce565b9250828203905081811115610a3557610a346109d8565b5b92915050565b600080fd5b600080fd5b60008085851115610a5957610a58610a3b565b5b83861115610a6a57610a69610a40565b5b6001850283019150848603905094509492505050565b600082905092915050565b600082821b905092915050565b6000610aa48383610a80565b82610aaf81356107d5565b92506020821015610aef57610aea7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83602003600802610a8b565b831692505b505092915050565b6000610b0282610777565b9050919050565b610b1281610af7565b8114610b1d57600080fd5b50565b600081359050610b2f81610b09565b92915050565b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610b8382610b3a565b810181811067ffffffffffffffff82111715610ba257610ba1610b4b565b5b80604052505050565b6000610bb5610763565b9050610bc18282610b7a565b919050565b600067ffffffffffffffff821115610be157610be0610b4b565b5b610bea82610b3a565b9050602081019050919050565b82818337600083830152505050565b6000610c19610c1484610bc6565b610bab565b905082815260208101848484011115610c3557610c34610b35565b5b610c40848285610bf7565b509392505050565b600082601f830112610c5d57610c5c61080b565b5b8135610c6d848260208601610c06565b91505092915050565b600080600060608486031215610c8f57610c8e61076d565b5b6000610c9d86828701610b20565b935050602084013567ffffffffffffffff811115610cbe57610cbd610772565b5b610cca86828701610c48565b925050604084013567ffffffffffffffff811115610ceb57610cea610772565b5b610cf786828701610c48565b9150509250925092565b600081519050919050565b600081905092915050565b60005b83811015610d35578082015181840152602081019050610d1a565b60008484015250505050565b6000610d4c82610d01565b610d568185610d0c565b9350610d66818560208601610d17565b80840191505092915050565b6000610d7e8284610d41565b915081905092915050565b600082825260208201905092915050565b6000610da582610d01565b610daf8185610d89565b9350610dbf818560208601610d17565b610dc881610b3a565b840191505092915050565b60006020820190508181036000830152610ded8184610d9a565b905092915050565b610dfe816107d5565b82525050565b6000604082019050610e196000830185610df5565b8181036020830152610e2b8184610d9a565b90509392505050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b610e6981610e34565b8114610e7457600080fd5b50565b600081519050610e8681610e60565b92915050565b600060208284031215610ea257610ea161076d565b5b6000610eb084828501610e77565b91505092915050565b600082825260208201905092915050565b7f5369676e617475726556616c696461746f72237265636f7665725369676e657260008201527f3a20696e76616c6964207369676e6174757265206c656e677468000000000000602082015250565b6000610f26603a83610eb9565b9150610f3182610eca565b604082019050919050565b60006020820190508181036000830152610f5581610f19565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f5369676e617475726556616c696461746f723a20696e76616c6964207369676e60008201527f617475726520762076616c756500000000000000000000000000000000000000602082015250565b6000610fe7602d83610eb9565b9150610ff282610f8b565b604082019050919050565b6000602082019050818103600083015261101681610fda565b9050919050565b600060ff82169050919050565b6110338161101d565b82525050565b600060808201905061104e6000830187610df5565b61105b602083018661102a565b6110686040830185610df5565b6110756060830184610df5565b95945050505050565b61108781610797565b82525050565b60006110998385610d89565b93506110a6838584610bf7565b6110af83610b3a565b840190509392505050565b60006080820190506110cf600083018861107e565b6110dc6020830187610df5565b81810360408301526110ef81858761108d565b90506110fe6060830184610930565b9695505050505050565b6000815190506111178161087c565b92915050565b6000602082840312156111335761113261076d565b5b600061114184828501611108565b9150509291505056fea264697066735822122066785701e10146ff617da2733d9602dcca3832f0624cbc1293d020cde158c93164736f6c63430008110033";

type ValidateSigOffchainConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ValidateSigOffchainConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ValidateSigOffchain__factory extends ContractFactory {
  constructor(...args: ValidateSigOffchainConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _signer: PromiseOrValue<string>,
    _hash: PromiseOrValue<BytesLike>,
    _signature: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ValidateSigOffchain> {
    return super.deploy(
      _signer,
      _hash,
      _signature,
      overrides || {}
    ) as Promise<ValidateSigOffchain>;
  }
  override getDeployTransaction(
    _signer: PromiseOrValue<string>,
    _hash: PromiseOrValue<BytesLike>,
    _signature: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _signer,
      _hash,
      _signature,
      overrides || {}
    );
  }
  override attach(address: string): ValidateSigOffchain {
    return super.attach(address) as ValidateSigOffchain;
  }
  override connect(signer: Signer): ValidateSigOffchain__factory {
    return super.connect(signer) as ValidateSigOffchain__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ValidateSigOffchainInterface {
    return new utils.Interface(_abi) as ValidateSigOffchainInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ValidateSigOffchain {
    return new Contract(address, _abi, signerOrProvider) as ValidateSigOffchain;
  }
}
