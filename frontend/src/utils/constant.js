import EthLogo from '../assets/sidechains-48-eth.png';
import PolygonLogo from '../assets/sidechains-48-polygon.png'
import FuseLogo from '../assets/sidechains-48-fuse.png'
import OpLogo from '../assets/sidechains-48-optimism.png';
import ArbitrumLogo from '../assets/sidechains-48-arbitrum.png';

export const networks = {
  '80001': {
    paymasterAddress: '0xcaDBADcFeD5530A49762DFc9d1d712CcD6b09b25',
    rpcUrl: 'https://mumbai-bundler.etherspot.io',
    networkImg: PolygonLogo,
    label: 'Mumbai',
    blockExplorerLink: 'https://mumbai.polygonscan.com/tx/'
  },
  '5': {
    paymasterAddress: '0x50af618E286713Fd2bda2113b7e56352BD357222',
    rpcUrl: 'https://goerli-bundler.etherspot.io',
    networkImg: EthLogo,
    label: 'Goerli',
    blockExplorerLink: 'https://goerli.etherscan.io/tx/',
  },
  '122': {
    paymasterAddress: '0x8039EeBC990ab85730489c6054F83Ff850aD87Dc',
    rpcUrl: 'https://fuse-bundler.etherspot.io',
    networkImg: FuseLogo,
    label: 'Fuse',
    blockExplorerLink: 'https://explorer.fuse.io/tx/',
  },
  '421613': {
    paymasterAddress: '0xF3E89e89A539505FFF1cAbac2bF9a55401ECa3d5',
    rpcUrl: 'https://arbitrumgoerli-bundler.etherspot.io',
    networkImg: ArbitrumLogo,
    label: 'Arbitrum Goerli',
    blockExplorerLink: 'https://goerli.arbiscan.io/tx/',
  },
  '1': {
    paymasterAddress: '0x804EBB2FCe9531998CF2e747EE9595f0146E9a7d',
    rpcUrl: 'https://ethereum-bundler.etherspot.io/',
    networkImg: EthLogo,
    label: 'Ethereum',
    blockExplorerLink: 'https://etherscan.io/tx/',
  },
  '42161': {
    paymasterAddress: '0x8039EeBC990ab85730489c6054F83Ff850aD87Dc',
    rpcUrl: 'https://arbitrum-bundler.etherspot.io',
    networkImg: ArbitrumLogo,
    label: 'Arbitrum',
    blockExplorerLink: 'https://arbiscan.io/tx/',
  },
  '137': {
    paymasterAddress: '0x450D2374dd63F62929Ff8C64B443c17A139B669A',
    rpcUrl: 'https://polygon-bundler.etherspot.io',
    networkImg: PolygonLogo,
    label: 'Polygon',
    blockExplorerLink: 'https://polygonscan.com/tx',
  },
  '10': {
    paymasterAddress: '0x5952653F151e844346825050d7157A9a6b46A23A',
    rpcUrl: 'https://optimism-bundler.etherspot.io',
    networkImg: OpLogo,
    label: 'Optimism',
    blockExplorerLink: 'https://optimistic.etherscan.io/tx/',
  }
}
