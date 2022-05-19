import { ChainId, ChainTokenMap, Currency, NATIVE, Token } from '@sushiswap/core-sdk'
import { XDAI_TOKENS } from 'app/config/tokens'
import { Feature } from 'app/enums'
import { Chef, PairType } from 'app/features/onsen/enum'
import { usePositions } from 'app/features/onsen/hooks'
import { featureEnabled } from 'app/functions'
import {
  useAverageBlockTime,
  useCeloPrice,
  useEthPrice,
  useFarms,
  useGnoPrice,
  useKashiPairs,
  useOneDayBlock,
  useSymmPairs,
  useSymmPriceCelo,
} from 'app/services/graph'
import toLower from 'lodash/toLower'
import { useMemo } from 'react'

export default function useFarmRewards({ chainId = ChainId.ETHEREUM }) {
  // @ts-ignore TYPE NEEDS FIXING
  const positions = usePositions(chainId)

  const block1d = useOneDayBlock({ chainId, shouldFetch: !!chainId })

  // @ts-ignore TYPE NEEDS FIXING
  const farms = useFarms({ chainId })
  const farmAddresses = useMemo(() => farms.map((farm) => farm.pair), [farms])
  const symmPairs = useSymmPairs({
    chainId,
    // variables: {
    //   where: {
    //     id_in: farmAddresses.map(toLower),
    //   },
    // },
    shouldFetch: true,
  })
  console.log('SYMM PAIRS:')

  const kashiPairs = useKashiPairs({
    chainId,
    variables: { where: { id_in: farmAddresses.map(toLower) } },
    shouldFetch: !!chainId && !!farmAddresses && featureEnabled(Feature.KASHI, chainId),
  })

  const averageBlockTime = useAverageBlockTime({ chainId })
  const symmAddressCELO = '0x8427bD503dd3169cCC9aFF7326c15258Bc305478'

  const SYMM: ChainTokenMap = {
    // [ChainId.XDAI]: new Token(ChainId.XDAI, SUSHI_ADDRESS[ChainId.XDAI], 18, 'SUSHI', 'SushiToken'),
    [ChainId.CELO]: new Token(ChainId.CELO, symmAddressCELO, 18, 'SYMM', 'SymmToken'),
  }

  const [ethPrice, gnoPrice, celoPrice, symmPriceCelo] = [
    useEthPrice(),
    useGnoPrice(),
    useCeloPrice(),
    useSymmPriceCelo(),
  ]

  const blocksPerDay = 86400 / Number(averageBlockTime)

  // @ts-ignore TYPE NEEDS FIXING
  const map = (pool) => {
    console.log('MAPPING POOLS HERE')

    // TODO: Deal with inconsistencies between properties on subgraph
    pool.owner = pool?.symmChef || pool?.owner || pool?.masterChef || pool?.miniChef
    pool.balance = pool?.balance || pool?.slpBalance
    // @ts-ignore TYPE NEEDS FIXING
    const swapSymmPair = symmPairs?.find((pair) => pair.id === pool.pair)

    const pair = swapSymmPair

    const type = swapSymmPair ? PairType.SWAP : PairType.KASHI

    const blocksPerHour = 3600 / averageBlockTime

    function getRewards() {
      const symmPerBlock = (pool?.owner?.symmPerSecond / 1e18) * averageBlockTime

      // @ts-ignore TYPE NEEDS FIXING
      const rewardPerBlock = (pool.allocPoint / pool.owner.totalAllocPoint) * symmPerBlock

      // This is the SYMM reward from symmCHEF if any
      const defaultReward = {
        currency: SYMM[ChainId.CELO],
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: symmPriceCelo,
      }

      let rewards: { currency: Currency; rewardPerBlock: number; rewardPerDay: number; rewardPrice: number }[] = [
        // @ts-ignore TYPE NEEDS FIXING
        defaultReward,
      ]

      if (pool.chef === Chef.MINICHEF) {
        const symmPerSecond = ((pool.allocPoint / pool.symmChef.totalAllocPoint) * pool.symmChef.symmPerSecond) / 1e18
        const symmPerBlock = symmPerSecond * averageBlockTime
        const symmPerDay = symmPerBlock * blocksPerDay
        const totalAllocPointRewarder = 100 // Need to fix subgraph to fetch this from chain. This needs to be 100 anyway

        const rewardPerSecond =
          ((pool.rewarderAllocPoint / totalAllocPointRewarder) * pool.symmChef.symmPerSecond) / 1e18 // External Rewards needs allocation properly like 80/20

        const rewardPerBlock = rewardPerSecond * averageBlockTime

        const rewardPerDay = rewardPerBlock * blocksPerDay

        const reward = {
          [ChainId.XDAI]: {
            currency: XDAI_TOKENS.GNO,
            rewardPerBlock,
            rewardPerDay: rewardPerSecond * 86400,
            rewardPrice: gnoPrice,
          },
          [ChainId.CELO]: {
            currency: NATIVE[ChainId.CELO],
            rewardPerBlock,
            rewardPerDay: rewardPerSecond * 86400,
            rewardPrice: celoPrice,
          },
        }
        // SYMM REWARDS
        // @ts-ignore TYPE NEEDS FIXING
        rewards[0] = {
          ...defaultReward,
          rewardPerBlock: symmPerBlock,
          rewardPerDay: symmPerDay,
        }

        // Rewards from
        // @ts-ignore TYPE NEEDS FIXING
        if (chainId in reward) {
          // @ts-ignore TYPE NEEDS FIXING
          rewards[1] = reward[chainId]
        }
      }
      return rewards
    }

    const rewards = getRewards()

    // const balance = swapPair ? Number(pool.balance / 1e18) : pool.balance / 10 ** kashiPair.token0.decimals
    const balance = swapSymmPair ? Number(pool.balance / 1e18) : pool.balance / 10

    const tvl = swapSymmPair.liquidity

    // const feeApyPerYear =
    //   swapPair && swapPair1d
    //     ? aprToApy((((pair?.volumeUSD - swapPair1d?.volumeUSD) * 0.0025 * 365) / pair?.reserveUSD) * 100, 3650) / 100
    //     : 0
    // const feeApyPerYear = swapSymmPair.totalSwapVolume

    const poolTotalSwapVolume =
      swapSymmPair.swaps && swapSymmPair.swaps[0] && swapSymmPair.swaps[0].poolTotalSwapVolume
        ? parseFloat(swapSymmPair.swaps[0].poolTotalSwapVolume)
        : 0
    const lastSwapVolume = parseFloat(swapSymmPair.totalSwapVolume) - poolTotalSwapVolume
    const feesCollected = lastSwapVolume * swapSymmPair.swapFee

    const feeApyPerYear = (100 / swapSymmPair.liquidity) * ((feesCollected * 365) / 100)

    const feeApyPerMonth = feeApyPerYear / 12
    const feeApyPerDay = feeApyPerMonth / 30
    const feeApyPerHour = feeApyPerDay / blocksPerHour

    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / tvl

    const rewardAprPerHour = roiPerBlock * blocksPerHour
    const rewardAprPerDay = rewardAprPerHour * 24
    const rewardAprPerMonth = rewardAprPerDay * 30
    const rewardAprPerYear = (symmPriceCelo * rewards[0].rewardPerDay * 365) / tvl
    const tokenRewardAprPerYear = (rewards[1]?.rewardPrice * rewards[1]?.rewardPerDay * 365) / tvl

    const roiPerHour = rewardAprPerHour + feeApyPerHour
    const roiPerMonth = rewardAprPerMonth + feeApyPerMonth
    const roiPerDay = rewardAprPerDay + feeApyPerDay
    const roiPerYear = rewardAprPerYear + tokenRewardAprPerYear + feeApyPerYear
    const tokenRoiPerYear = tokenRewardAprPerYear

    const position = positions.find((position) => position.id === pool.id && position.chef === pool.chef)

    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: pair.type === PairType.KASHI ? Number(pair.asset.tokenInfo.decimals) : 18,
        type,
      },
      balance,
      feeApyPerHour,
      feeApyPerDay,
      feeApyPerMonth,
      feeApyPerYear,
      rewardAprPerHour,
      rewardAprPerDay,
      rewardAprPerMonth,
      rewardAprPerYear,
      tokenRewardAprPerYear,
      roiPerBlock,
      roiPerHour,
      roiPerDay,
      roiPerMonth,
      roiPerYear,
      tokenRoiPerYear,
      rewards,
      tvl,
    }
  }

  return farms
    .filter((farm) => {
      return (
        // @ts-ignore TYPE NEEDS FIXING
        symmPairs && symmPairs.find((pair) => pair.id === farm.pair)
      )
    })
    .map(map)
}
