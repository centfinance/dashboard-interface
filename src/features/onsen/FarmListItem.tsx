import { getAddress } from '@ethersproject/address'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Token } from '@symmetric-v2/farming-core-sdk'
import { CurrencyLogo, CurrencyLogoArray } from 'app/components/CurrencyLogo'
import QuestionHelper from 'app/components/QuestionHelper'
import Typography from 'app/components/Typography'
import { TABLE_TBODY_TD_CLASSNAME, TABLE_TBODY_TR_CLASSNAME } from 'app/features/trident/constants'
import { classNames, formatNumber, formatPercent } from 'app/functions'
import { useCurrency } from 'app/hooks/Tokens'
import { useActiveWeb3React } from 'app/services/web3'
import React, { FC, ReactNode } from 'react'

import { PairType } from './enum'
import { useUserInfo } from './hooks'
interface FarmListItem {
  farm: any
  onClick(x: ReactNode): void
}

// @ts-ignore TYPE NEEDS FIXING
const FarmListItem: FC<FarmListItem> = ({ farm, onClick }) => {
  const { i18n } = useLingui()
  const token0 = useCurrency(farm.pair.tokens[0].address) ?? undefined
  const token1 = useCurrency(farm.pair.tokens[1].address) ?? undefined
  const { chainId } = useActiveWeb3React()

  const liquidityToken = new Token(
    // @ts-ignore TYPE NEEDS FIXING
    chainId || 1,
    getAddress(farm.pair.address),
    farm.pair.type === PairType.KASHI ? Number(farm.pair.asset.decimals) : 18,
    farm.pair.type === PairType.KASHI ? 'KMP' : farm.pair.symbol
  )

  const stakedAmount = useUserInfo(farm, liquidityToken)

  return (
    <div className={classNames(TABLE_TBODY_TR_CLASSNAME, 'grid grid-cols-5')} onClick={onClick}>
      <div className={classNames('flex gap-2', TABLE_TBODY_TD_CLASSNAME(0, 5))}>
        {token0 && token1 && <CurrencyLogoArray currencies={[token0, token1]} dense size={32} />}
        <div className="flex flex-col items-start">
          <Typography weight={700} className="flex gap-1 text-high-emphesis">
            {farm?.pair?.tokens[0]?.symbol}
            <span className="text-low-emphesis">/</span>
            {farm?.pair?.tokens[1]?.symbol}
          </Typography>
          {farm?.pair?.type === PairType.SWAP && (
            <Typography variant="xs" className="text-low-emphesis">
              {i18n._(t`Symmetric Farm`)}
            </Typography>
          )}
          {farm?.pair?.type === PairType.KASHI && (
            <Typography variant="xs" className="text-low-emphesis">
              {i18n._(t`Kashi Farm`)}
            </Typography>
          )}
        </div>
      </div>
      <div className={TABLE_TBODY_TD_CLASSNAME(1, 5)}>
        <Typography weight={700} className="text-high-emphesis">
          {formatNumber(farm.tvl, true)}
        </Typography>
      </div>
      <div className={classNames('flex flex-col !items-end !justify-center', TABLE_TBODY_TD_CLASSNAME(2, 5))}>
        {/* @ts-ignore TYPE NEEDS FIXING */}
        {farm?.rewards?.map((reward, i) => (
          <Typography
            variant="sm"
            weight={700}
            key={i}
            className="flex gap-1.5 text-high-emphesis justify-center items-center"
            component="span"
          >
            {formatNumber(reward.rewardPerDay)}
            <CurrencyLogo currency={reward.currency} size={16} />
          </Typography>
        ))}
      </div>
      <div className={classNames('flex', TABLE_TBODY_TD_CLASSNAME(3, 5))}>
        <Typography weight={700} className="flex gap-0.5 items-center text-high-emphesis">
          {farm?.tvl !== 0 ? (farm?.roiPerYear > 10000 ? '>10,000%' : formatPercent(farm?.roiPerYear * 100)) : '-'}
          {!!farm?.feeApyPerYear && (
            <QuestionHelper
              text={
                <div className="flex flex-col">
                  <div>
                    Reward APR:{' '}
                    {farm?.tvl !== 0
                      ? farm?.rewardAprPerYear > 10000
                        ? '>10,000%'
                        : formatPercent(farm?.rewardAprPerYear * 100)
                      : '-'}
                  </div>
                  <div>
                    Fee APR: {farm?.feeApyPerYear < 10000 ? formatPercent(farm?.feeApyPerYear * 100) : '>10,000%'}
                  </div>
                </div>
              }
            />
          )}
        </Typography>
        {/* <Typography weight={700} className="flex gap-0.5 items-center text-high-emphesis">
          {i18n._(t`annualized`)} 
          {formatPercent(farm?.tokenRoiPerYear * 100)}
        </Typography>*/}
      </div>
      <div className={classNames('flex', TABLE_TBODY_TD_CLASSNAME(4, 5))}>
        <Typography weight={700} className="flex gap-0.5 items-center text-high-emphesis">
          {stakedAmount?.toExact() !== '0'
            ? formatNumber(Number(stakedAmount?.toExact()) * farm?.sharePrice, true)
            : '-'}
        </Typography>
        {/* <Typography weight={700} className="flex gap-0.5 items-center text-high-emphesis">
          {i18n._(t`annualized`)} 
          {formatPercent(farm?.tokenRoiPerYear * 100)}
        </Typography>*/}
      </div>
    </div>
  )
}

export default FarmListItem
