export const TOKEN_ADDRESS: Record<number, Record<string, string>> = {
    1: {
        DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
        USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7"
    },
    5: {
        DAI: "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
        USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"
    },
    56: {
        USDC: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        USDT: "0x55d398326f99059ff775485246999027b3197955"
    },
    137: {
        DAI: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
        USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
    },
    42161: {
        DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
        USDC: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
        USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
    },
    43114: {
        DAI: "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
        USDC: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
        USDT: "0xc7198437980c041c805a1edcba50c1ce5db95118"
    },
    80001: {
        USDC: "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
        USDT: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"
    },
    84531: {
        USDC: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf"
    }
}

export const NATIVE_ASSET: Record<number, string> = {
    1: "ETH",
    5: "ETH",
    56: "BNB",
    137: "MATIC",
    42161: "ETH",
    43114: "AVAX",
    80001: "MATIC",
    84531: "ETH"
}

export const ORACLE_ADDRESS: Record<number, Record<string, string>> = {
    1: {
        ETH: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
        DAI: "0xaed0c38402a5d19df6e4c03f4e2dced6e29c1ee9",
        USDC: "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6",
        USDT: "0x3e7d1eab13ad0104d2750b8863b489d65364e32d"
    },
    5: {
        ETH: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
        DAI: "0x0d79df66BE487753B02D015Fb622DED7f0E9798d",
        USDC: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7"
    },
    56: {
        BNB: "0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee",
        USDC: "0x51597f405303c4377e36123cbc172b13269ea163",
        USDT: "0xb97ad0e74fa7d920791e90258a6e2085088b4320"
    },
    137: {
        MATIC: "0xab594600376ec9fd91f8e885dadf0ce036862de0",
        DAI: "0x4746dec9e833a82ec7c2c1356372ccf2cfcd2f3d",
        USDC: "0xfe4a8cc5b5b2366c1b58bea3858e81843581b2f7",
        USDT: "0x0a6513e40db6eb1b165753ad52e80663aea50545"
    },
    42161: {
        ETH: "0x639fe6ab55c921f74e7fac1ee960c0b6293ba612",
        DAI: "0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb",
        USDC: "0x50834f3163758fcc1df9973b6e91f0f0f0434ad3",
        USDT: "0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7"
    },
    43114: {
        AVAX: "0x0a77230d17318075983913bc2145db16c7366156",
        DAI: "0x51d7180eda2260cc4f6e4eebb82fef5c3c2b8300",
        USDC: "0xf096872672f44d6eba71458d74fe67f9a77a23b9",
        USDT: "0xebe676ee90fe1112671f19b6b7459bc678b67e8a"
    },
    80001: {
        DAI: "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
        USDC: "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
        USDT: "0x92C09849638959196E976289418e5973CC96d645",
        MATIC: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada"
    },
    84531: {
        ETH: "0xcD2A119bD1F7DF95d706DE6F2057fDD45A0503E2",
        USDC: "0xb85765935B4d9Ab6f841c9a00690Da5F34368bc0"
    }
}

export const bytecode = "0x610120604081815234620004105760a08262002084803803809162000025828562000415565b833981010312620004105781516001600160a01b0380821693918490036200041057602090818301519080821682036200041057620000668585016200044f565b93608062000077606083016200044f565b9101519682881693848903620004105762000092336200047f565b6080528060a0528560e0526101009782895265030d4000864760c51b60018060c01b036001541617600155600094338587541603620003ce57156200037b57620000dc906200047f565b86519586868163313ce56760e01b9485825260049a8b915afa90811562000371579060ff9187916200034f575b5016604d81116200033c5784918791600a0a60c052888a5180948193878352165afa908115620003325760089160ff91879162000310575b501603620002ba5790858592885194859384928352165afa918215620002af5760089260ff92906200027b575b5016036200022157505051611bbd9182620004c7833960805182818161074c015281816108900152818161096501528181610a2201528181610ad3015281816112c00152818161138a01526114d7015260a05182818161017a0152818161030201528181610beb0152611839015260c051828181610e9f015281816112040152611749015260e051828181610ddb01528181610e3301526116d30152518181816106e501528181610e5c01526116fc0152f35b608492519162461bcd60e51b8352820152603160248201527f50502d4552433230203a206e6174697665206173736574206f7261636c6520646044820152700cac6d2dac2d8e640daeae6e840c4ca407607b1b6064820152fd5b620002a09150843d8611620002a7575b62000297818362000415565b81019062000464565b386200016e565b503d6200028b565b8551903d90823e3d90fd5b865162461bcd60e51b8152808701869052602a60248201527f50502d4552433230203a20746f6b656e206f7261636c6520646563696d616c73604482015269040daeae6e840c4ca40760b31b6064820152608490fd5b6200032b9150883d8a11620002a75762000297818362000415565b3862000141565b88513d87823e3d90fd5b634e487b7160e01b865260118852602486fd5b6200036a9150883d8a11620002a75762000297818362000415565b3862000109565b89513d88823e3d90fd5b875162461bcd60e51b815260048101879052602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b6064820152608490fd5b6064878a519062461bcd60e51b825280600483015260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152fd5b600080fd5b601f909101601f19168101906001600160401b038211908210176200043957604052565b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b03821682036200041057565b9081602091031262000410575160ff81168103620004105790565b600080546001600160a01b039283166001600160a01b03198216811783559216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a356fe6040608081526004908136101561001557600080fd5b600091823560e01c9081630396cb601461133557838263205c287814611267575081633a34c83f146112275781633b97e856146111ce5781633c2154bc14610f7c5781633e04619d14610f36578163673a7e2814610dff5781636c5ec25c14610d90578163715018a614610cf35781638da5cb5b14610ca2578163914e245a14610c4b5781639dbdb97714610c105781639e281a9814610b8e578163a9a2340914610af7578163b0d691fe14610a8857838263bb9fe6bf146109d2578263c23a5cea1461090b57508163c399ec8814610817578163cdcf4b9b146107db57838263d0e30db01461070957508163efb1ad5d1461069a578163f2fde38b14610560578163f465c77e146101a2575063fc0c546a1461013157600080fd5b3461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e576020905173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b5080fd5b9050823461055d576060917ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc91838336011261055d5781359167ffffffffffffffff9586841161055957610160848301958536030112610559576102046114c0565b6001549177ffffffffffffffffffffffffffffffffffffffffffffffff831680156104fc576101248601907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec61025a838a611634565b905001967effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffdf881661049f579069d3c21bcecceda10000009160e463ffffffff60c098891c16910135619c40026044350102020490602080971461041f575b506102c18761168f565b96835197828a52308552891b602c526f23b872dd000000000000000000000000600c5286866064601c8273ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165af13d15600188511417161561041457906103637fffffffffffffffffffffffffffffffffffffffff00000000000000000000000092878b5289865261168f565b9087890152881b16828701526034865286860197868910908911176103e6575086815286528351928360a0860152825b8481106103d4575050838301018190526080830152601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168101030190f35b85810180830151908401528101610393565b6041907f4e487b71000000000000000000000000000000000000000000000000000000006000525260246000fd5b8686637939f4248152fd5b6104299088611634565b60341161049b5760140135811161044057896102b7565b50848060649351927f08c379a000000000000000000000000000000000000000000000000000000000845283015260248201527f50502d4552433230203a20746f6b656e20616d6f756e7420746f6f20686967686044820152fd5b8580fd5b60648460208751917f08c379a0000000000000000000000000000000000000000000000000000000008352820152601e60248201527f50502d4552433230203a20696e76616c69642064617461206c656e67746800006044820152fd5b50602060649251917f08c379a0000000000000000000000000000000000000000000000000000000008352820152601860248201527f50502d4552433230203a207072696365206e6f742073657400000000000000006044820152fd5b8280fd5b80fd5b9050346105595760207ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261055957610599611419565b906105a261155d565b73ffffffffffffffffffffffffffffffffffffffff809216928315610617575050600054827fffffffffffffffffffffffff0000000000000000000000000000000000000000821617600055167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0600080a380f35b90602060849251917f08c379a0000000000000000000000000000000000000000000000000000000008352820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f64647265737300000000000000000000000000000000000000000000000000006064820152fd5b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e576020905173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b809184827ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126107d75773ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001691823b156107d257839060248351809581937fb760faf9000000000000000000000000000000000000000000000000000000008352309083015234905af19081156107c957506107b95750f35b6107c29061143c565b61055d5780f35b513d84823e3d90fd5b505050fd5b5050fd5b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e5760209051620f42408152f35b9190503461055957827ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc360112610559578051917f70a08231000000000000000000000000000000000000000000000000000000008352309083015260208260248173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165afa9182156109015783926108ca575b6020838351908152f35b9091506020813d82116108f9575b816108e56020938361147f565b8101031261055957602092505190386108c0565b3d91506108d8565b81513d85823e3d90fd5b809184346107d75760207ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126107d757610945611419565b61094d61155d565b73ffffffffffffffffffffffffffffffffffffffff807f000000000000000000000000000000000000000000000000000000000000000016803b1561049b57859283602492865197889586947fc23a5cea00000000000000000000000000000000000000000000000000000000865216908401525af19081156107c957506107b95750f35b809184346107d757827ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126107d757610a0b61155d565b73ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001691823b156107d257839283918351809581937fbb9fe6bf0000000000000000000000000000000000000000000000000000000083525af19081156107c957506107b95750f35b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e576020905173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b83903461019e5760607ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e578035906003821015610559576024359067ffffffffffffffff90818311610b8a5736602384011215610b8a57820135908111610b86573660248284010111610b8657610b8392610b766114c0565b60246044359301906116b0565b80f35b8380fd5b8480fd5b50503461019e577ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261055d57610b83610bc8611419565b610bd061155d565b6024359073ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016611b68565b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e5760209051619c408152f35b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e5760209077ffffffffffffffffffffffffffffffffffffffffffffffff600154169051908152f35b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e5773ffffffffffffffffffffffffffffffffffffffff60209254169051908152f35b833461055d57807ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261055d57610d2a61155d565b600073ffffffffffffffffffffffffffffffffffffffff81547fffffffffffffffffffffffff000000000000000000000000000000000000000081168355167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a380f35b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e576020905173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b833461055d57807ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261055d57610e577f00000000000000000000000000000000000000000000000000000000000000006118f7565b610e807f00000000000000000000000000000000000000000000000000000000000000006118f7565b9077ffffffffffffffffffffffffffffffffffffffffffffffff9182807f00000000000000000000000000000000000000000000000000000000000000001691168382820216918183041490151715610f0a5790610edd916115dc565b167fffffffffffffffff000000000000000000000000000000000000000000000000600154161760015580f35b6024846011877f4e487b7100000000000000000000000000000000000000000000000000000000835252fd5b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e5760209063ffffffff60015460c01c169051908152f35b83833461019e57807ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e57610fb4611406565b926024359363ffffffff90818616918287036111c957610fd261155d565b81169262124f80841161116c57620f424080851061110f57831161108d57507ffed7660357162e9e060534e05beba94ac6e3bfb17b1f793bd7350aaed0e9e8c4949577ffffffffffffffffffffffffffffffffffffffffffffffff7bffffffff0000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000006001549360e01b169360c01b169116171760015582519182526020820152a180f35b60849060208651917f08c379a00000000000000000000000000000000000000000000000000000000083528201526024808201527f50502d4552433230203a20757064617465207468726573686f6c6420746f6f2060448201527f68696768000000000000000000000000000000000000000000000000000000006064820152fd5b60648260208851917f08c379a0000000000000000000000000000000000000000000000000000000008352820152602060248201527f50502d4552433230203a207072696365206d61726b65757020746f6f206c6f776044820152fd5b60649060208651917f08c379a0000000000000000000000000000000000000000000000000000000008352820152602060248201527f50502d4552433230203a207072696365206d61726b757020746f6f20686967686044820152fd5b600080fd5b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e57602090517f00000000000000000000000000000000000000000000000000000000000000008152f35b50503461019e57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261019e5760209060015460e01c9051908152f35b809184346107d757807ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126107d7576112a0611419565b6112a861155d565b73ffffffffffffffffffffffffffffffffffffffff807f000000000000000000000000000000000000000000000000000000000000000016803b1561049b57859283604492865197889586947f205c2878000000000000000000000000000000000000000000000000000000008652169084015260243560248401525af19081156107c957506107b95750f35b91905060207ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc360112610559578261136b611406565b61137361155d565b73ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016803b156105595763ffffffff91602491855196879485937f0396cb60000000000000000000000000000000000000000000000000000000008552169083015234905af19081156107c957506113fd575080f35b610b839061143c565b6004359063ffffffff821682036111c957565b6004359073ffffffffffffffffffffffffffffffffffffffff821682036111c957565b67ffffffffffffffff811161145057604052565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b90601f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0910116810190811067ffffffffffffffff82111761145057604052565b73ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001633036114ff57565b60646040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f53656e646572206e6f7420456e747279506f696e7400000000000000000000006044820152fd5b73ffffffffffffffffffffffffffffffffffffffff60005416330361157e57565b60646040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602060248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152fd5b9077ffffffffffffffffffffffffffffffffffffffffffffffff80911691821561160557160490565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b9035907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1813603018212156111c9570180359067ffffffffffffffff82116111c9576020019181360383136111c957565b8115611605570490565b3573ffffffffffffffffffffffffffffffffffffffff811681036111c95790565b92919260038110156118b1576002146118ac5769d3c21bcecceda10000006116f77f00000000000000000000000000000000000000000000000000000000000000006118f7565b6117207f00000000000000000000000000000000000000000000000000000000000000006118f7565b9060015461177077ffffffffffffffffffffffffffffffffffffffffffffffff928380841695817f00000000000000000000000000000000000000000000000000000000000000001602166115dc565b918160e01c921691620f4240808402918561178b8185611685565b82840110938415611894575b50505050611864575b505063ffffffff60015460c01c163a619c4002850102020492806020116111c957813584811161180c575b506034116111c95760206040917f472a42a044527b87df02c0ce8e6c00c0057fac40d6c424c93c24b02322eb14b593835195865282860152013560601c92a2565b816034116111c9578461185e9103602084013560601c73ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016611b68565b386117cb565b8192507fffffffffffffffff000000000000000000000000000000000000000000000000161760015538806117a0565b6118a092939450611685565b91031138808581611797565b505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b519069ffffffffffffffffffff821682036111c957565b60a073ffffffffffffffffffffffffffffffffffffffff916004604051809481937ffeaf968c000000000000000000000000000000000000000000000000000000008352165afa8015611b5c576000809281908293611b06575b506000841315611aa8577ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd5d00420190428211611a795710611a1b5769ffffffffffffffffffff8091169116106119bd5777ffffffffffffffffffffffffffffffffffffffffffffffff1690565b60646040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f50502d4552433230203a205374616c65207072696365000000000000000000006044820152fd5b60646040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f50502d4552433230203a20496e636f6d706c65746520726f756e6400000000006044820152fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60646040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601f60248201527f50502d4552433230203a20436861696e6c696e6b207072696365203c3d2030006044820152fd5b935050905060a0823d8211611b54575b81611b2360a0938361147f565b8101031261055d5750611b35816118e0565b6020820151611b4b6080606085015194016118e0565b91909238611951565b3d9150611b16565b6040513d6000823e3d90fd5b60109260209260145260345260446000938480936fa9059cbb00000000000000000000000082525af13d156001835114171615611ba457603452565b806390b8ec1860209252fdfea164736f6c6343000812000a";