import { ChainId } from '@sushiswap/core-sdk'
import { useNativePrice, useOneDayBlock, useOneWeekBlock, useTokens } from 'app/services/graph'
import { useEffect, useMemo, useState } from 'react'

export default function useTokensAnalytics({ chainId = ChainId.ETHEREUM }) {
  const [loadState, setLoadState] = useState<'loading' | 'initial' | 'loaded'>('loading')

  const block1d = useOneDayBlock({ chainId })
  console.log('TOKENS::::')
  console.log(block1d)
  const block1w = useOneWeekBlock({ chainId })

  const nativePrice = useNativePrice({ chainId })
  console.log(nativePrice)
  const nativePrice1d = useNativePrice({ chainId, variables: { block: block1d }, shouldFetch: !!block1d })
  console.log(nativePrice1d)
  const nativePrice1w = useNativePrice({ chainId, variables: { block: block1w }, shouldFetch: !!block1w })
  console.log(nativePrice1w)

  const tokensInitial = useTokens({ chainId, variables: { first: 200 } })
  console.log(tokensInitial)
  const tokens1dInitial = useTokens({
    chainId,
    variables: { first: 200, block: block1d },
    shouldFetch: !!block1d,
  })
  const tokens1wInitial = useTokens({
    chainId,
    variables: { first: 200, block: block1w },
    shouldFetch: !!block1w,
  })

  const tokens = useTokens({ chainId, shouldFetch: loadState !== 'loading' })
  const tokens1d = useTokens({
    chainId,
    variables: { block: block1d },
    shouldFetch: !!block1d && loadState !== 'loading',
  })
  const tokens1w = useTokens({
    chainId,
    variables: { block: block1w },
    shouldFetch: !!block1w && loadState !== 'loading',
  })

  useEffect(() => {
    if (loadState === 'loading' && !!tokens1dInitial && !!tokens1wInitial) setLoadState('initial')
    else if (!!tokens1d && !!tokens1w) setLoadState('loaded')
  }, [loadState, tokens1dInitial, tokens1wInitial, tokens1d, tokens1w])

  return useMemo(
    () =>
      // @ts-ignore TYPE NEEDS FIXING
      (loadState === 'loaded' ? tokens : tokensInitial)?.map((token) => {
        // @ts-ignore TYPE NEEDS FIXING
        const token1d = (loadState === 'loaded' ? tokens1d : tokens1dInitial)?.find((p) => token.id === p.id) ?? token
        // @ts-ignore TYPE NEEDS FIXING
        const token1w = (loadState === 'loaded' ? tokens1w : tokens1wInitial)?.find((p) => token.id === p.id) ?? token

        return {
          token: {
            id: token.address,
            symbol: token.symbol,
            name: token.name,
          },
          liquidity: token.balance * nativePrice, // USD price ??
          // volume1d: token.volumeUSD - token1d.volumeUSD,
          // volume1w: token.volumeUSD - token1w.volumeUSD,
          price: token.balance * nativePrice,
          change1d: ((token.balance * nativePrice) / (token1d.balance * nativePrice1d)) * 100 - 100,
          change1w: ((token.balance * nativePrice) / (token1w.balance * nativePrice1w)) * 100 - 100,
          // graph: token.dayData
          //   .slice(0)
          //   .reverse()
          //   // @ts-ignore TYPE NEEDS FIXING
          //   .map((day, i) => ({ x: i, y: Number(day.priceUSD) })),
        }
      }),
    [
      tokensInitial,
      tokens1dInitial,
      tokens1wInitial,
      tokens,
      tokens1d,
      tokens1w,
      nativePrice,
      nativePrice1d,
      nativePrice1w,
      loadState,
    ]
  )
}
