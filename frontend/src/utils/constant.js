import EthLogo from '../assets/sidechains-48-eth.png';
import PolygonLogo from '../assets/sidechains-48-polygon.png'
import FuseLogo from '../assets/sidechains-48-fuse.png'
import OpLogo from '../assets/sidechains-48-optimism.png';
import ArbitrumLogo from '../assets/sidechains-48-arbitrum.png';
import BNBLogo from '../assets/bnb-logo.png';
import GnosisLogo from '../assets/gnosis-logo.png';
import MantleLogo from '../assets/mantle-logo.png';
import BaseLogo from '../assets/base-logo.png';
import LineaLogo from '../assets/linea-logo.png';
import ScrollLogo from '../assets/scroll-logo.png';
import AvalancheLogo from '../assets/avalanche-logo.png';
import FlareLogo from '../assets/flare-logo.png';
import KlaytnLogo from '../assets/klaytn-logo.png';

export const networks = {
  '80001': {
    networkImg: PolygonLogo,
    label: 'Mumbai',
    blockExplorerLink: 'https://mumbai.polygonscan.com/tx/'
  },
  '5': {
    networkImg: EthLogo,
    label: 'Goerli',
    blockExplorerLink: 'https://goerli.etherscan.io/tx/',
  },
  '122': {
    networkImg: FuseLogo,
    label: 'Fuse',
    blockExplorerLink: 'https://explorer.fuse.io/tx/',
  },
  '421613': {
    networkImg: ArbitrumLogo,
    label: 'Arbitrum Goerli',
    blockExplorerLink: 'https://goerli.arbiscan.io/tx/',
  },
  '1': {
    networkImg: EthLogo,
    label: 'Ethereum',
    blockExplorerLink: 'https://etherscan.io/tx/',
  },
  '42161': {
    networkImg: ArbitrumLogo,
    label: 'Arbitrum',
    blockExplorerLink: 'https://arbiscan.io/tx/',
  },
  '137': {
    networkImg: PolygonLogo,
    label: 'Polygon',
    blockExplorerLink: 'https://polygonscan.com/tx',
  },
  '10': {
    networkImg: OpLogo,
    label: 'Optimism',
    blockExplorerLink: 'https://optimistic.etherscan.io/tx/',
  },
  '14': {
    networkImg: FlareLogo,
    label: 'Flare',
    blockExplorerLink: 'https://flare-explorer.flare.network/tx/'
  },
  '56': {
    networkImg: BNBLogo,
    label: 'BNB',
    blockExplorerLink: 'https://bscscan.com/tx/'
  },
  '97': {
    networkImg: BNBLogo,
    label: 'BNB Testnet',
    blockExplorerLink: 'https://testnet.bscscan.com/tx/'
  },
  '100': {
    networkImg: GnosisLogo,
    label: 'Gnosis',
    blockExplorerLink: 'https://gnosisscan.io/tx/'
  },
  '114': {
    networkImg: FlareLogo,
    label: 'Flare Testnet',
    blockExplorerLink: 'https://coston2-explorer.flare.network/tx/'
  },
  '420': {
    networkImg: OpLogo,
    label: 'Op Goerli',
    blockExplorerLink: 'https://goerli-optimism.etherscan.io/tx/'
  },
  '1001': {
    networkImg: KlaytnLogo,
    label: 'Klaytn Testnet',
    blockExplorerLink: 'https://baobab.klaytnscope.com/tx/'
  },
  '8217': {
    networkImg: KlaytnLogo,
    label: 'Klaytn',
    blockExplorerLink: 'https://klaytnscope.com/tx/'
  },
  '5000': {
    networkImg: MantleLogo,
    label: 'Mantle',
    blockExplorerLink: 'https://explorer.mantle.xyz/tx/'
  },
  '8453': {
    networkImg: BaseLogo,
    label: 'Base',
    blockExplorerLink: 'https://basescan.org/tx/'
  },
  '59144': {
    networkImg: LineaLogo,
    label: 'Linea',
    blockExplorerLink: 'https://lineascan.build/tx/'
  },
  '84531': {
    networkImg: BaseLogo,
    label: 'Base Goerli',
    blockExplorerLink: 'https://goerli.basescan.org/tx/'
  },
  '534351': {
    networkImg: ScrollLogo,
    label: 'Scroll Sepolia',
    blockExplorerLink: 'https://sepolia-blockscout.scroll.io/tx/'
  },
  '11155111': {
    networkImg: EthLogo,
    label: 'Sepolia',
    blockExplorerLink: 'https://sepolia.etherscan.io/tx/'
  },
  '5001': {
    networkImg: MantleLogo,
    label: 'Mantle Testnet',
    blockExplorerLink: 'https://explorer.testnet.mantle.xyz/tx/'
  },
  '43114': {
    networkImg: AvalancheLogo,
    label: 'Avalanche',
    blockExplorerLink: 'https://snowtrace.io/tx/'
  }
}
