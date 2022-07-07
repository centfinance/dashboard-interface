import { ChainId, ChainTokenMap, Currency, Token } from '@sushiswap/core-sdk'
import { CELO_TOKENS, XDAI_TOKENS } from 'app/config/tokens'
import { Chef, PairType } from 'app/features/onsen/enum'
import { usePositions } from 'app/features/onsen/hooks'
import {
  useARIPrice,
  useAverageBlockTime,
  useCeloPrice,
  useEthPrice,
  useFarms,
  useGnoPrice,
  useMooPrice,
  useOneDayBlock,
  useSymmPairs,
  useSymmPriceCelo,
  useSymmPriceXdai,
} from 'app/services/graph'
import toLower from 'lodash/toLower'
import { useMemo } from 'react'

export default function useFarmRewards({ chainId = ChainId.CELO }) {
  // @ts-ignore TYPE NEEDS FIXING
  const positions = usePositions(chainId)

  const block1d = useOneDayBlock({ chainId, shouldFetch: !!chainId })

  // @ts-ignore TYPE NEEDS FIXING
  const farms = useFarms({ chainId })
  const farmAddresses = useMemo(() => farms.map((farm) => farm.pair), [farms])
  const symmPairs = useSymmPairs({
    chainId,
    variables: {
      where: {
        id_in: farmAddresses.map(toLower),
      },
    },
    shouldFetch: true,
  })

  const averageBlockTime = useAverageBlockTime({ chainId })
  const symmAddressCELO = '0x8427bD503dd3169cCC9aFF7326c15258Bc305478'
  const symmAddressGNO = '0xC45b3C1c24d5F54E7a2cF288ac668c74Dd507a84'

  const SYMM: ChainTokenMap = {
    [ChainId.XDAI]: new Token(ChainId.XDAI, symmAddressGNO, 18, 'SYMM', 'SymmToken'),
    [ChainId.CELO]: new Token(ChainId.CELO, symmAddressCELO, 18, 'SYMM', 'SymmToken'),
  }

  const [ethPrice, gnoPrice, celoPrice, symmPriceCelo, symmPriceXdai, mooPrice, ariPrice] = [
    useEthPrice(),
    useGnoPrice(),
    useCeloPrice(),
    useSymmPriceCelo(),
    useSymmPriceXdai(),
    useMooPrice(),
    useARIPrice(),
  ]

  const blocksPerDay = 86400 / Number(averageBlockTime)

  // @ts-ignore TYPE NEEDS FIXING
  const map = (pool) => {
    // TODO: Deal with inconsistencies between properties on subgraph
    pool.owner = pool?.symmChef || pool?.owner || pool?.masterChef || pool?.miniChef
    pool.balance = pool?.balance || pool?.slpBalance
    // @ts-ignore TYPE NEEDS FIXING
    const swapSymmPair = symmPairs?.find((pair) => pair.address === pool.pair)

    const pair = swapSymmPair

    const type = swapSymmPair ? PairType.SWAP : PairType.KASHI

    const blocksPerHour = 3600 / averageBlockTime

    function getRewards() {
      const symmPerBlock = (pool?.owner?.symmPerSecond / 1e18) * averageBlockTime

      // @ts-ignore TYPE NEEDS FIXING
      const rewardPerBlock = (pool.allocPoint / pool.owner.totalAllocPoint) * symmPerBlock

      // This is the SYMM reward from symmCHEF if any
      const defaultReward = {
        currency: SYMM[chainId],
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: chainId === ChainId.CELO ? symmPriceCelo : symmPriceXdai,
      }

      let rewards: { currency: Currency; rewardPerBlock: number; rewardPerDay: number; rewardPrice: number }[] = [
        // @ts-ignore TYPE NEEDS FIXING
        defaultReward,
      ]

      if (pool.chef === Chef.MINICHEF) {
        const symmPerSecond = ((pool.allocPoint / pool.symmChef.totalAllocPoint) * pool.symmChef.symmPerSecond) / 1e18
        const symmPerBlock = symmPerSecond * averageBlockTime
        const symmPerDay = symmPerBlock * blocksPerDay

        // SYMM REWARDS
        // @ts-ignore TYPE NEEDS FIXING
        rewards[0] = {
          ...defaultReward,
          rewardPerBlock: symmPerBlock,
          rewardPerDay: symmPerDay,
        }

        if (pool.rewarder != null) {
          const rPerSecond =
            ((pool.rewarderAllocPoint / pool.rewarder.totalAllocPoint) * pool.rewarder.rewardPerSecond) / 1e18
          const rPerBlock = rPerSecond * averageBlockTime
          const rPerDay = rPerBlock * blocksPerDay
          if (chainId === ChainId.CELO) {
            const reward = {
              currency:
                pool.rewarder.rewardToken.toLocaleLowerCase() ===
                '0x17700282592D6917F6A73D0bF8AcCf4D578c131e'.toLocaleLowerCase()
                  ? CELO_TOKENS.MOO
                  : CELO_TOKENS.ARI,
              rewardPerBlock: rPerBlock,
              rewardPerDay: rPerDay,
              rewardPrice:
                (pool.rewarder.rewardToken.toLocaleLowerCase() ===
                '0x17700282592D6917F6A73D0bF8AcCf4D578c131e'.toLocaleLowerCase()
                  ? mooPrice
                  : ariPrice) || 0.00001,
            }
            rewards[1] = reward
          } else {
            const reward = {
              currency:
                pool.rewarder.rewardToken.toLocaleLowerCase() ===
                '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb'.toLocaleLowerCase()
                  ? XDAI_TOKENS.GNO
                  : CELO_TOKENS.ARI,
              rewardPerBlock: rPerBlock,
              rewardPerDay: rPerDay,
              rewardPrice: gnoPrice || 0.00001,
            }
            rewards[1] = reward
          }
        }
      }
      return rewards
    }

    const rewards = getRewards()

    // const balance = swapPair ? Number(pool.balance / 1e18) : pool.balance / 10 ** kashiPair.token0.decimals
    const balance = swapSymmPair ? Number(pool.balance / 1e18) : pool.balance / 10

    // const tvl = swapSymmPair.totalLiquidity
    const tvl = (swapSymmPair.totalLiquidity / swapSymmPair.totalShares) * pool.slpBalance * 0.000000000000000001

    // const feeApyPerYear =
    //   swapPair && swapPair1d
    //     ? aprToApy((((pair?.volumeUSD - swapPair1d?.volumeUSD) * 0.0025 * 365) / pair?.reserveUSD) * 100, 3650) / 100
    //     : 0
    // const feeApyPerYear = swapSymmPair.totalSwapVolume

    const poolTotalSwapVolume = swapSymmPair.totalSwapVolume ? parseFloat(swapSymmPair.totalSwapVolume) : 0
    const lastSwapVolume = parseFloat(swapSymmPair.totalSwapVolume) - poolTotalSwapVolume
    const feesCollected = lastSwapVolume * swapSymmPair.swapFee

    const feeApyPerYear = (100 / swapSymmPair.totalLiquidity) * ((feesCollected * 365) / 100)

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
    const rewardAprPerYear =
      ((chainId === ChainId.CELO ? symmPriceCelo : symmPriceXdai) * rewards[0].rewardPerDay * 365) / tvl
    const tokenRewardAprPerYear = (rewards[1]?.rewardPrice * rewards[1]?.rewardPerDay * 365) / tvl || 0

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
        symmPairs && symmPairs.find((pair) => pair.address === farm.pair)
      )
    })
    .map(map)
}
