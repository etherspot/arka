/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface ProxyFactoryInterface extends utils.Interface {
  functions: {
    "accountCreationCode()": FunctionFragment;
    "accountImplementation()": FunctionFragment;
    "createAccount(address,address,uint256)": FunctionFragment;
    "getAddress(address,address,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "accountCreationCode"
      | "accountImplementation"
      | "createAccount"
      | "getAddress"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "accountCreationCode",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "accountImplementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createAccount",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getAddress",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "accountCreationCode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "accountImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createAccount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getAddress", data: BytesLike): Result;

  events: {
    "AccountCreation(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AccountCreation"): EventFragment;
}

export interface AccountCreationEventObject {
  wallet: string;
  owner: string;
  index: BigNumber;
}
export type AccountCreationEvent = TypedEvent<
  [string, string, BigNumber],
  AccountCreationEventObject
>;

export type AccountCreationEventFilter = TypedEventFilter<AccountCreationEvent>;

export interface ProxyFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ProxyFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    accountCreationCode(overrides?: CallOverrides): Promise<[string]>;

    accountImplementation(overrides?: CallOverrides): Promise<[string]>;

    createAccount(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getAddress(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string] & { proxy: string }>;
  };

  accountCreationCode(overrides?: CallOverrides): Promise<string>;

  accountImplementation(overrides?: CallOverrides): Promise<string>;

  createAccount(
    entryPoint: PromiseOrValue<string>,
    owner: PromiseOrValue<string>,
    index: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getAddress(
    entryPoint: PromiseOrValue<string>,
    owner: PromiseOrValue<string>,
    index: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    accountCreationCode(overrides?: CallOverrides): Promise<string>;

    accountImplementation(overrides?: CallOverrides): Promise<string>;

    createAccount(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getAddress(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    "AccountCreation(address,address,uint256)"(
      wallet?: PromiseOrValue<string> | null,
      owner?: PromiseOrValue<string> | null,
      index?: null
    ): AccountCreationEventFilter;
    AccountCreation(
      wallet?: PromiseOrValue<string> | null,
      owner?: PromiseOrValue<string> | null,
      index?: null
    ): AccountCreationEventFilter;
  };

  estimateGas: {
    accountCreationCode(overrides?: CallOverrides): Promise<BigNumber>;

    accountImplementation(overrides?: CallOverrides): Promise<BigNumber>;

    createAccount(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getAddress(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    accountCreationCode(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    accountImplementation(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createAccount(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getAddress(
      entryPoint: PromiseOrValue<string>,
      owner: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
