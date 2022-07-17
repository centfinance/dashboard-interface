import { ChainId } from '@sushiswap/core-sdk'
import { celoTokens } from 'app/config/tokens/celo'
import { gnosisTokens } from 'app/config/tokens/xdai'
import { GRAPH_HOST } from 'app/services/graph/constants'
import {
  dayDatasQuery,
  ethPriceQuery,
  factoryQuery,
  liquidityPositionsQuery,
  pairDayDatasQuery,
  pairsQuery,
  pairsSymmQuery,
  tokenDayDatasQuery,
  tokenPairsQuery,
  tokenPriceQuery,
  tokenPriceQuery3,
  tokenQuery,
  tokensQuery,
  tokenSubsetQuery,
  tokenSYMMPriceQuery,
  transactionsQuery,
} from 'app/services/graph/queries'

import { pager } from './pager'

export const EXCHANGE = {
  [ChainId.ETHEREUM]: 'sushiswap/exchange',
  [ChainId.XDAI]: 'centfinance/symmetric-v2-gnosis',
  [ChainId.MATIC]: 'sushiswap/matic-exchange',
  [ChainId.FANTOM]: 'sushiswap/fantom-exchange',
  [ChainId.BSC]: 'sushiswap/bsc-exchange',
  [ChainId.HARMONY]: 'sushiswap/harmony-exchange',
  [ChainId.AVALANCHE]: 'sushiswap/avalanche-exchange',
  [ChainId.CELO]: 'jiro-ono/sushitestsubgraph',
  [ChainId.CELO]: 'centfinance/symmetric-v2-celo',
  [ChainId.ARBITRUM]: 'sushiswap/arbitrum-exchange',
  [ChainId.MOONRIVER]: 'sushiswap/moonriver-exchange',
  [ChainId.OKEX]: 'okex-exchange/oec',
  [ChainId.HECO]: 'heco-exchange/heco',
  [ChainId.FUSE]: 'sushiswap/fuse-exchange',
  [ChainId.MOONBEAM]: 'sushiswap/moonbeam-exchange',
}

// @ts-ignore TYPE NEEDS FIXING
export const exchange = async (chainId = ChainId.ETHEREUM, query, variables = {}) =>
  // @ts-ignore TYPE NEEDS FIXING
  pager(`${GRAPH_HOST[chainId]}/subgraphs/name/${EXCHANGE[chainId]}`, query, variables)

// @ts-ignore TYPE NEEDS FIXING
export const exchangeSymm = async (chainId = ChainId.ETHEREUM, query) =>
  // @ts-ignore TYPE NEEDS FIXING
  pager(`${GRAPH_HOST[chainId]}/subgraphs/name/centfinance/symmetric-v2-celo`, query)

// @ts-ignore TYPE NEEDS FIXING
export const exchangeSymmPrice = async (chainId = ChainId.ETHEREUM, query) =>
  // @ts-ignore TYPE NEEDS FIXING
  pager(`${GRAPH_HOST[chainId]}/subgraphs/name/centfinance/symmetric-celo`, query)

// @ts-ignore TYPE NEEDS FIXING
export const exchangeTokenPrice = async (chainId = ChainId.ETHEREUM, query, variables) =>
  pager(
    // @ts-ignore TYPE NEEDS FIXING
    `${GRAPH_HOST[chainId]}/subgraphs/name/centfinance/${
      chainId === ChainId.CELO ? 'symmetric-celo' : 'symmetricv1gnosis'
    }`,
    query,
    variables
  )

// @ts-ignore TYPE NEEDS FIXING
export const exchangeTokenPriceV2 = async (chainId = ChainId.ETHEREUM, query, variables) =>
  pager(
    // @ts-ignore TYPE NEEDS FIXING
    `${GRAPH_HOST[chainId]}/subgraphs/name/centfinance/${
      chainId === ChainId.CELO ? 'symmetric-v2-celo' : 'symmetric-v2-gnosis'
    }`,
    query,
    variables
  )

export const getPairs = async (chainId = ChainId.ETHEREUM, variables = undefined, query = pairsQuery) => {
  const { pairs } = await exchange(chainId, query, variables)
  return pairs
}

// get tokens prices listed on celo.ts
const tokenPrices = async (chainId = ChainId.CELO) => {
  const tokens = chainId === ChainId.CELO ? celoTokens : gnosisTokens
  const prices = await Promise.all(
    tokens.map(async (token) => {
      let price = 0
      try {
        price = await getTokenPriceFromSymmV2(chainId, tokenPriceQuery3, { id: token.toLowerCase() })
        // price = await getTokenPrice(ChainId.CELO, tokenPriceQuery, { id: token.toLowerCase() }) // use sushi
      } catch (e) {
        // console.log(e)
      }
      return { [token.toLowerCase()]: price }
    })
  )

  let priceObj = {}
  prices.forEach((price) => {
    priceObj = { ...priceObj, ...price }
  })

  return priceObj
}

// get liquidity from a pool
const getLiquidity = (pool: any, prices: any) => {
  const poolTokens = pool.tokens
  const weights = poolTokens.map((token: any) => token.weight)
  const totalWeight = weights.reduce((total: any, weight: any) => total + Number(weight), 0)
  let sumWeight = 0
  let sumValue = 0

  for (let i = 0; i < poolTokens.length; i++) {
    const token = poolTokens[i]
    const address = token.address.toLowerCase()

    if (!prices[address]) {
      continue
    }
    const price = prices[address]
    const balance = Number(token.balance)

    const value = balance * price
    const weight = token.weight ? token.weight : 0
    sumValue = sumValue + Number(value)
    sumWeight = sumWeight + Number(weight)
  }

  if (sumWeight > 0) {
    const liquidity = (sumValue / sumWeight) * totalWeight
    return liquidity.toString()
  }

  return '0'
}

export const getSymmPairs = async (chainId = ChainId.ETHEREUM, variables = undefined, query = pairsSymmQuery) => {
  const { pools } = await exchange(chainId, pairsSymmQuery, variables)

  // calc totalLiquidity
  const prices = await tokenPrices(chainId)

  const updatedPools = pools.map((pool: any) => {
    let poolCopy = { ...pool }

    if (poolCopy.totalLiquidity === '0') {
      poolCopy.totalLiquidity = getLiquidity(pool, prices)
    }
    return poolCopy
  })

  return updatedPools
}

// @ts-ignore TYPE NEEDS FIXING
export const getPairDayData = async (chainId = ChainId.ETHEREUM, variables) => {
  console.log('getTokens')
  const { pairDayDatas } = await exchange(chainId, pairDayDatasQuery, variables)
  return pairDayDatas
}

// @ts-ignore TYPE NEEDS FIXING
export const getTokenSubset = async (chainId = ChainId.ETHEREUM, variables) => {
  // console.log('getTokenSubset')
  const { tokens } = await exchange(chainId, tokenSubsetQuery, variables)
  return tokens
}

// @ts-ignore TYPE NEEDS FIXING
export const getTokens = async (chainId = ChainId.ETHEREUM, variables) => {
  console.log('getTokens')
  const { tokens } = await exchange(chainId, tokensQuery, variables)
  return tokens
}

// @ts-ignore TYPE NEEDS FIXING
export const getToken = async (chainId = ChainId.ETHEREUM, query = tokenQuery, variables) => {
  // console.log('getTokens')
  const { token } = await exchange(chainId, query, variables)
  return token
}

// @ts-ignore TYPE NEEDS FIXING
export const getTokenDayData = async (chainId = ChainId.ETHEREUM, variables) => {
  // console.log('getTokens')
  const { tokenDayDatas } = await exchange(chainId, tokenDayDatasQuery, variables)
  return tokenDayDatas
}

// @ts-ignore TYPE NEEDS FIXING
export const getTokenPrices = async (chainId = ChainId.ETHEREUM, variables) => {
  // console.log('getTokenPrice')
  const { tokens } = await exchange(chainId, tokensQuery, variables)
  // @ts-ignore TYPE NEEDS FIXING
  return tokens.map((token) => token?.derivedETH)
}

// @ts-ignore TYPE NEEDS FIXING
export const getTokenPrice = async (chainId = ChainId.ETHEREUM, query, variables) => {
  // console.log('getTokenPrice')
  const nativePrice = await getNativePrice(chainId)

  const { token } = await exchange(chainId, query, variables)
  return token?.derivedETH * nativePrice
}

// @ts-ignore TYPE NEEDS FIXING // fetching from V1, need to change when coingecko
export const getSYMMPrice = async (chainId = ChainId.ETHEREUM, query) => {
  const { tokenPrices } = await exchangeSymmPrice(chainId, query)
  // console.log('getSYMMPrice', tokenPrices)
  return tokenPrices[0]?.price
}

// @ts-ignore TYPE NEEDS FIXING // fetching from V1, need to change when coingecko
export const getTokenPriceFromSymmV1 = async (chainId = ChainId.ETHEREUM, query, variables) => {
  const { tokenPrices } = await exchangeTokenPrice(chainId, query, variables)
  // console.log('getSYMMPrice', tokenPrices)
  return tokenPrices[0]?.price
}

// @ts-ignore TYPE NEEDS FIXING // fetching from V2, need to change when coingecko
export const getTokenPriceFromSymmV2 = async (chainId = ChainId.ETHEREUM, query, variables) => {
  const data = await exchangeTokenPriceV2(chainId, query, variables)
  // console.log('getSYMMPrice', data?.tokens[0]?.latestPrice?.price)
  return data?.tokens[0]?.latestPrice?.price
}

export const getNativePrice = async (chainId = ChainId.ETHEREUM, variables = undefined) => {
  // console.log('getEthPrice')
  const data = await getBundle(chainId, undefined, variables)
  return data?.bundles[0]?.ethPrice
}

export const getEthPrice = async (variables = undefined) => {
  return getNativePrice(ChainId.ETHEREUM, variables)
}

export const getGlimmerPrice = async (variables = {}) => {
  return getTokenPrice(ChainId.MOONBEAM, tokenPriceQuery, {
    id: '0xacc15dc74880c9944775448304b263d191c6077f',
    ...variables,
  })
}

export const getYggPrice = async (variables = {}) => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x25f8087ead173b73d6e8b84329989a8eea16cf73',
    ...variables,
  })
}

export const getRulerPrice = async (variables = {}) => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x2aeccb42482cc64e087b6d2e5da39f5a7a7001f8',
    ...variables,
  })
}

export const getTruPrice = async (variables = {}) => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x4c19596f5aaff459fa38b0f7ed92f11ae6543784',
    ...variables,
  })
}

export const getCvxPrice = async (variables = {}) => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
    ...variables,
  })
}

export const getMaticPrice = async (variables = {}) => {
  // console.log('getMaticPrice')
  return getTokenPrice(ChainId.MATIC, tokenPriceQuery, {
    id: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    ...variables,
  })
}

export const getAlcxPrice = async (variables = {}) => {
  // console.log('getAlcxPrice')
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0xdbdb4d16eda451d0503b854cf79d55697f90c8df',
    ...variables,
  })
}

export const getPicklePrice = async (variables = {}) => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x429881672b9ae42b8eba0e26cd9c73711b891ca5',
    ...variables,
  })
}

export const getMphPrice = async (variables = {}) => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x8888801af4d980682e47f1a9036e589479e835c5',
    ...variables,
  })
}

export const getSushiPrice = async (variables = {}) => {
  // console.log('getSushiPrice')
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    ...variables,
  })
}

export const getGnoPrice = async () => {
  return await getTokenPriceFromSymmV2(ChainId.XDAI, tokenPriceQuery3, {
    id: '0x9c58bacc331c9aa871afd802db6379a98e80cedb'.toLowerCase(),
  })
}

export const getSymmPriceXdai = async () => {
  return await getTokenPriceFromSymmV2(ChainId.XDAI, tokenPriceQuery3, {
    id: '0xC45b3C1c24d5F54E7a2cF288ac668c74Dd507a84'.toLowerCase(),
  })
}

export const getSymmPriceCelo = async () => {
  return getSYMMPrice(ChainId.CELO, tokenSYMMPriceQuery)
}

export const getOnePrice = async (variables = undefined) => {
  return getNativePrice(ChainId.HARMONY, variables)
}

export const getAvaxPrice = async (variables = undefined) => {
  return getNativePrice(ChainId.AVALANCHE, variables)
}

export const getCeloPrice = async () => {
  return getTokenPriceFromSymmV2(ChainId.CELO, tokenPriceQuery3, {
    id: '0x471ece3750da237f93b8e339c536989b8978a438',
  })
}

export const getMooPrice = async () => {
  return getTokenPriceFromSymmV2(ChainId.CELO, tokenPriceQuery3, {
    id: '0x17700282592D6917F6A73D0bF8AcCf4D578c131e'.toLowerCase(),
  })
}

export const getAriPrice = async () => {
  return getTokenPriceFromSymmV2(ChainId.CELO, tokenPriceQuery3, {
    id: '0x20677d4f3d0F08e735aB512393524A3CfCEb250C'.toLowerCase(),
  })
}

export const getETHIXPrice = async () => {
  return getTokenPriceFromSymmV2(ChainId.CELO, tokenPriceQuery3, {
    id: '0x9995cc8F20Db5896943Afc8eE0ba463259c931ed'.toLowerCase(),
  })
}

export const getFantomPrice = async () => {
  return getTokenPrice(ChainId.FANTOM, tokenPriceQuery, {
    id: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  })
}

// @ts-ignore TYPE NEEDS FIXING
export const getOhmPrice = async (chainId) => {
  if (chainId === ChainId.ARBITRUM) {
    return getTokenPrice(ChainId.ARBITRUM, tokenPriceQuery, {
      id: '0x8d9ba570d6cb60c7e3e0f31343efe75ab8e65fb1',
    })
  } else {
    return getTokenPrice(ChainId.MATIC, tokenPriceQuery, {
      id: '0xd8ca34fd379d9ca3c6ee3b3905678320f5b45195',
    })
  }
}

export const getMagicPrice = async () => {
  return getTokenPrice(ChainId.ARBITRUM, tokenPriceQuery, {
    id: '0x539bde0d7dbd336b79148aa742883198bbf60342',
  })
}

export const getMovrPrice = async () => {
  return getTokenPrice(ChainId.MOONRIVER, tokenPriceQuery, {
    id: '0xf50225a84382c74cbdea10b0c176f71fc3de0c4d',
  })
}

export const getSpellPrice = async () => {
  return getTokenPrice(ChainId.ETHEREUM, tokenPriceQuery, {
    id: '0x090185f2135308bad17527004364ebcc2d37e5f6',
  })
}

export const getFusePrice = async () => {
  return getTokenPrice(ChainId.FUSE, tokenPriceQuery, {
    id: '0x0be9e53fd7edac9f859882afdda116645287c629',
  })
}

export const getBundle = async (
  chainId = ChainId.ETHEREUM,
  query = ethPriceQuery,
  variables = {
    id: 1,
  }
) => {
  return exchange(chainId, query, variables)
}

// @ts-ignore TYPE NEEDS FIXING
export const getLiquidityPositions = async (chainId = ChainId.ETHEREUM, variables) => {
  const { liquidityPositions } = await exchange(chainId, liquidityPositionsQuery, variables)
  return liquidityPositions
}

export const getDayData = async (chainId = ChainId.ETHEREUM, variables = undefined) => {
  const { dayDatas } = await exchange(chainId, dayDatasQuery, variables)
  return dayDatas
}

export const getFactory = async (chainId = ChainId.ETHEREUM, variables = undefined) => {
  const { factories } = await exchange(chainId, factoryQuery, variables)
  return factories[0]
}

export const getTransactions = async (chainId = ChainId.ETHEREUM, variables = undefined) => {
  const { swaps } = await exchange(chainId, transactionsQuery, variables)
  return swaps
}

export const getTokenPairs = async (chainId = ChainId.ETHEREUM, variables = undefined) => {
  const { pairs0, pairs1 } = await exchange(chainId, tokenPairsQuery, variables)
  return pairs0 || pairs1 ? [...(pairs0 ? pairs0 : []), ...(pairs1 ? pairs1 : [])] : undefined
}
