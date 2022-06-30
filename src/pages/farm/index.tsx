// import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
// import Button from 'app/components/Button'
// import ExternalLink from 'app/components/ExternalLink'
import Search from 'app/components/Search'
// import Typography from 'app/components/Typography'
import { Chef } from 'app/features/onsen/enum'
import FarmList from 'app/features/onsen/FarmList'
import OnsenFilter from 'app/features/onsen/FarmMenu'
import useFarmRewards from 'app/hooks/useFarmRewards'
import useFuse from 'app/hooks/useFuse'
import { TridentBody } from 'app/layouts/Trident'
import { useActiveWeb3React } from 'app/services/web3'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import React from 'react'

export default function Farm(): JSX.Element {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()

  const router = useRouter()
  const type = !router.query.filter ? 'all' : (router.query.filter as string)
  const retiredFarms = 'retired'

  const FILTER = {
    // @ts-ignore TYPE NEEDS FIXING
    all: (farm) => farm.allocPoint !== '0' && farm.chef !== Chef.OLD_FARMS,
    // @ts-ignore TYPE NEEDS FIXING
    portfolio: (farm) => farm?.amount && !farm.amount.isZero(),
    // @ts-ignore TYPE NEEDS FIXING
    retired: (farm) => farm.allocPoint === '0' && farm.slpBalance !== '0' && farm.chef !== Chef.OLD_FARMS,
  }

  const rewards = useFarmRewards({ chainId })

  const data = rewards.filter((farm) => {
    // @ts-ignore TYPE NEEDS FIXING
    return type in FILTER ? FILTER[type](farm) : true
  })

  const retired = rewards.filter((farm) => {
    // @ts-ignore TYPE NEEDS FIXING
    return type in FILTER ? FILTER[retiredFarms](farm) : true
  })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol'],
    threshold: 0,
  }

  const { result, term, search } = useFuse({
    data,
    options,
  })

  return (
    <>
      <NextSeo title="Farm" description="Farm SYMMETRIC" />
      <TridentBody>
        <div className="flex flex-col w-full gap-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Search search={search} term={term} />
            <OnsenFilter />
          </div>
          <FarmList farms={result} term={term} />
        </div>
        <div>Retired Farms ({retired.length})</div>
        <div>
          <FarmList farms={retired} term={term} />
        </div>
      </TridentBody>
    </>
  )
}
