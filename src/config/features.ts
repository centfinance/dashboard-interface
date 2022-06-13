import { ChainId } from '@sushiswap/core-sdk'
import { Feature } from 'app/enums'

type FeatureMap = { readonly [chainId in ChainId]?: Feature[] }

const features: FeatureMap = {
  [ChainId.XDAI]: [Feature.LIQUIDITY_MINING, Feature.ANALYTICS],
  [ChainId.CELO]: [Feature.LIQUIDITY_MINING, Feature.ANALYTICS],
}

export default features
