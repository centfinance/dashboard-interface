// import Search from 'app/components/Search'
import { Feature } from 'app/enums'
import AnalyticsContainer from 'app/features/analytics/AnalyticsContainer'
import Background from 'app/features/analytics/Background'
// import ChartCard from 'app/features/analytics/ChartCard'
import DashboardTabs from 'app/features/analytics/dashboard/DashboardTabs'
import PoolList from 'app/features/analytics/farms/FarmList'
import PairList from 'app/features/analytics/pairs/PairList'
import TokenList from 'app/features/analytics/tokens/TokenList'
import { featureEnabled } from 'app/functions'
import useFarmRewards from 'app/hooks/useFarmRewards'
import useFuse from 'app/hooks/useFuse'
import {
  useDayData,
  useFactory,
  useNativePrice,
  useOneDayBlock,
  useOneWeekBlock,
  useSymmPairs,
  useTokens,
  useTwoDayBlock,
} from 'app/services/graph'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

const chartTimespans = [
  {
    text: '1W',
    length: 604800,
  },
  {
    text: '1M',
    length: 2629746,
  },
  {
    text: '1Y',
    length: 31556952,
  },
  {
    text: 'ALL',
    length: Infinity,
  },
]

export default function Dashboard(): JSX.Element {
  const router = useRouter()

  const chainId = Number(router.query.chainId)

  const [type, setType] = useState<'pools' | 'pairs' | 'tokens'>(
    featureEnabled(Feature.LIQUIDITY_MINING, chainId) ? 'pools' : 'pairs'
  )

  const block1d = useOneDayBlock({ chainId, shouldFetch: !!chainId })
  const block2d = useTwoDayBlock({ chainId, shouldFetch: !!chainId })
  const block1w = useOneWeekBlock({ chainId, shouldFetch: !!chainId })

  // For the charts
  const exchange = useFactory({ chainId })
  console.log('EXCHANGE')
  console.log(exchange)
  const exchange1d = useFactory({ chainId, variables: { block: block1d } })
  console.log(exchange1d)
  const exchange2d = useFactory({ chainId, variables: { block: block2d } })
  console.log(exchange2d)

  const dayData = useDayData({ chainId })
  console.log('DAY DATA ________')
  console.log(dayData)
  const chartData = useMemo(
    () => ({
      liquidity: exchange?.totalLiquidity,
      liquidityChange: (exchange1d?.totalLiquidity / exchange2d?.totalLiquidity) * 100 - 100,
      liquidityChart: dayData,
      // @ts-ignore TYPE NEEDS FIXING
      //  ?.sort((a, b) => a.date - b.date)
      // @ts-ignore TYPE NEEDS FIXING
      // .map((day) => ({ x: new Date(day.date * 1000), y: Number(day.totalLiquidity) })),

      volume1d: exchange?.totalSwapVolume - exchange1d?.totalSwapVolume,
      volume1dChange:
        ((exchange?.totalSwapVolume - exchange1d?.totalSwapVolume) /
          (exchange1d?.totalSwapVolume - exchange2d?.totalSwapVolume)) *
          100 -
        100,
      volumeChart: dayData,
      // @ts-ignore TYPE NEEDS FIXING
      // ?.sort((a, b) => a.date - b.date)
      // @ts-ignore TYPE NEEDS FIXING
      //.map((day) => ({ x: new Date(day.date * 1000), y: Number(day.totalSwapVolume) })),
    }),
    [exchange, exchange1d, exchange2d, dayData]
  )

  // For Top Pairs
  const pairs = useSymmPairs({ chainId })
  const pairs1d = useSymmPairs({ chainId, variables: { block: block1d }, shouldFetch: !!block1d })
  const pairs1w = useSymmPairs({ chainId, variables: { block: block1w }, shouldFetch: !!block1w })

  const pairsFormatted = useMemo(
    () =>
      // @ts-ignore TYPE NEEDS FIXING
      pairs?.map((pair) => {
        // @ts-ignore TYPE NEEDS FIXING
        const pair1d = pairs1d?.find((p) => pair.id === p.id) ?? pair
        // @ts-ignore TYPE NEEDS FIXING
        const pair1w = pairs1w?.find((p) => pair.id === p.id) ?? pair1d

        return {
          pair: {
            token0: pair.tokens[0],
            token1: pair.tokens[1],
            id: pair.id,
          },
          liquidity: pair.totalLiquidity,
          volume1d: pair.totalSwapVolume - pair1d?.totalSwapVolume,
          volume1w: pair.totalSwapVolume - pair1w?.totalSwapVolume,
        }
      }),
    [pairs, pairs1d, pairs1w]
  )

  // For Top Farms
  const farms = useFarmRewards({ chainId })
  const nativePrice = useNativePrice({ chainId })
  const farmsFormatted = useMemo(
    () =>
      farms
        ?.map((farm) => ({
          pair: {
            token0: farm.pair.tokens[0],
            token1: farm.pair.tokens[1],
            id: farm.pair.id,
            name: farm.pair.symbol ?? `${farm.pair.token0.symbol}<->${farm.pair.token1.symbol}`,
            type: farm.pair.symbol ? 'Symmetric Farms' : '-- Farm',
          },
          rewards: farm.rewards,
          liquidity: farm.tvl,
          apr: {
            daily: farm.roiPerDay * 100,
            monthly: farm.roiPerMonth * 100,
            annual: farm.roiPerYear * 100,
          },
        }))
        .filter((farm) => (farm ? true : false)),
    [farms]
  )

  // For Top Tokens
  const nativePrice1d = useNativePrice({ chainId, variables: { block: block1d } })
  const nativePrice1w = useNativePrice({ chainId, variables: { block: block1w } })

  const tokens = useTokens({ chainId })
  const tokens1d = useTokens({ chainId, variables: { block: block1d }, shouldFetch: !!block1d })
  const tokens1w = useTokens({ chainId, variables: { block: block1w }, shouldFetch: !!block1w })

  const tokensFormatted = useMemo(
    () =>
      tokens && tokens1d && tokens1w && nativePrice && nativePrice1d && nativePrice1w
        ? // @ts-ignore TYPE NEEDS FIXING
          tokens.map((token) => {
            // @ts-ignore TYPE NEEDS FIXING
            const token1d = tokens1d.find((p) => token.id === p.id) ?? token
            // @ts-ignore TYPE NEEDS FIXING
            const token1w = tokens1w.find((p) => token.id === p.id) ?? token

            return {
              token: {
                id: token.id,
                symbol: token.symbol,
                name: token.name,
                address: token.address,
              },
              liquidity: token.liquidity * token.derivedETH * nativePrice,
              volume1d: token.volumeUSD - token1d.volumeUSD,
              volume1w: token.volumeUSD - token1w.volumeUSD,
              price: token.derivedETH * nativePrice,
              change1d: ((token.derivedETH * nativePrice) / (token1d.derivedETH * nativePrice1d)) * 100 - 100,
              change1w: ((token.derivedETH * nativePrice) / (token1w.derivedETH * nativePrice1w)) * 100 - 100,
              // graph: token.dayData
              //   .slice(0)
              //   .reverse()
              //   // @ts-ignore TYPE NEEDS FIXING
              //   .map((day, i) => ({ x: i, y: Number(day.priceUSD) })),
            }
          })
        : [],
    [nativePrice, nativePrice1d, nativePrice1w, tokens, tokens1d, tokens1w]
  )

  const { options, data } = useMemo(() => {
    switch (type) {
      case 'pools':
        return {
          options: {
            keys: [
              'data.pair.token0',
              'data.pair.token0.symbol',
              'data.pair.token0.name',
              'data.pair.token1',
              'data.pair.token1.symbol',
              'data.pair.token1.name',
            ],
            threshold: 0.4,
          },
          data: farmsFormatted,
        }

      case 'pairs':
        return {
          options: {
            keys: [
              'data.pair.token0',
              'data.pair.token0.symbol',
              'data.pair.token0.name',
              'data.pair.token1',
              'data.pair.token1.symbol',
              'data.pair.token1.name',
            ],
            threshold: 0.4,
          },
          data: pairsFormatted,
        }

      case 'tokens':
        return {
          options: {
            keys: ['token.id', 'token.address', 'token.symbol', 'token.name'],
            threshold: 0.4,
          },
          data: tokensFormatted,
        }
    }
  }, [type, farmsFormatted, pairsFormatted, tokensFormatted])

  const {
    result: searched,
    term,
    search,
  } = useFuse({
    data,
    options,
  })

  return (
    <AnalyticsContainer>
      <Background background="dashboard">
        <div className="grid items-center justify-between grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
          <div>
            <div className="text-3xl font-bold text-high-emphesis">Symmetric Analytics</div>
            <div className="">
              Dive deeper in the analytics of SYMM-Verse,
              <br /> pools, pairs and tokens.
            </div>
          </div>
          {/* <Search term={term} search={search} /> */}
        </div>
      </Background>
      <div className="px-4 py-6 space-y-4 lg:px-14">
        <div className="text-2xl font-bold text-high-emphesis">Overview</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* <ChartCard
            header="TVL"
            subheader="SYMM AMM"
            figure={chartData.liquidity}
            change={chartData.liquidityChange}
            chart={chartData.liquidityChart}
            defaultTimespan="1M"
            timespans={chartTimespans}
          /> */}
          {/* <ChartCard
            header="Volume"
            subheader="SYMM AMM"
            figure={chartData.volume1d}
            change={chartData.volume1dChange}
            chart={chartData.volumeChart}
            defaultTimespan="1M"
            timespans={chartTimespans}
          /> */}
        </div>
      </div>
      <DashboardTabs currentType={type} setType={setType} />
      <div className="px-4 pt-4 lg:px-14">
        {featureEnabled(Feature.LIQUIDITY_MINING, chainId) && type === 'pools' && <PoolList pools={searched} />}
        {type === 'pairs' && <PairList pairs={searched} type={'all'} />}
        {type === 'tokens' && <TokenList tokens={searched} />}
      </div>
    </AnalyticsContainer>
  )
}
