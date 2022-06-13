import { ChainId } from '@symmetric-v2/farming-core-sdk'

const Arbitrum = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/arbitrum.jpg'
const Avalanche = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/avalanche.jpg'
const Bsc = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/bsc.jpg'
const Fantom = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/fantom.jpg'
const Goerli = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/goerli.jpg'
const Harmony = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/harmonyone.jpg'
const Heco = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/heco.jpg'
const Kovan = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/kovan.jpg'
const Mainnet = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/mainnet.jpg'
const Matic = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/polygon.jpg'
const Moonbeam = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/moonbeam.jpg'
const OKEx = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/okex.jpg'
const Polygon = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/polygon.jpg'
const Rinkeby = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/rinkeby.jpg'
const Ropsten = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/ropsten.jpg'
const xDai = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/gnosis.jpg'
const Celo = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/celo.jpg'
const Palm = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/palm.jpg'
const Moonriver = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/moonriver.jpg'
const Fuse = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/fuse.jpg'
const Telos = 'https://raw.githubusercontent.com/sushiswap/icons/master/network/telos.jpg'

export const NETWORK_ICON: Record<number, string> = {
  [ChainId.CELO]: Celo,
}

export const NETWORK_LABEL: Record<number, string> = {
  [ChainId.CELO]: 'Celo',
}
