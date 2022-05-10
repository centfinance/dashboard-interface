import { NATIVE } from '@sushiswap/core-sdk'
import Container from 'app/components/Container'
import { NAV_CLASS } from 'app/components/Header/styles'
import useMenu from 'app/components/Header/useMenu'
import Web3Network from 'app/components/Web3Network'
import Web3Status from 'app/components/Web3Status'
import useIsCoinbaseWallet from 'app/hooks/useIsCoinbaseWallet'
import { useActiveWeb3React } from 'app/services/web3'
import { useNativeCurrencyBalances } from 'app/state/wallet/hooks'
import Image from 'next/image'
import React, { FC } from 'react'

import Dots from '../Dots'
import Typography from '../Typography'
import { NavigationItem } from './NavigationItem'

const HEADER_HEIGHT = 64

const Desktop: FC = () => {
  const menu = useMenu()
  const { account, chainId, library } = useActiveWeb3React()
  const userEthBalance = useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']
  const isCoinbaseWallet = useIsCoinbaseWallet()

  return (
    <>
      <header className="fixed z-20 hidden w-full lg:block" style={{ height: HEADER_HEIGHT }}>
        <nav className={NAV_CLASS}>
          <Container maxWidth="full" className="mx-auto">
            <div className="flex items-center justify-between gap-4 px-6">
              <div className="flex gap-4">
                <div className="flex items-center w-6 mr-4">
                  <Image
                    src="https://celo-pools.symmetric.exchange/img/symmetricIcon.ad634ddf.svg"
                    alt="Symmetric logo"
                    width="54px"
                    height="54px"
                  />
                </div>
                {menu.map((node) => {
                  return <NavigationItem node={node} key={node.key} />
                })}
              </div>

              <div className="flex items-center justify-end w-auto shadow select-none whitespace-nowrap">
                {account && chainId && (
                  <Typography weight={700} variant="sm" className="px-2 py-5 font-bold">
                    {userEthBalance ? (
                      `${userEthBalance?.toSignificant(4)} ${NATIVE[chainId].symbol}`
                    ) : (
                      <Dots>FETCHING</Dots>
                    )}
                  </Typography>
                )}

                {library && (library.provider.isMetaMask || isCoinbaseWallet) && (
                  <div className="hidden sm:inline-block">
                    <Web3Network />
                  </div>
                )}

                <Web3Status />
              </div>
            </div>
          </Container>
        </nav>
      </header>
      <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT }} />
    </>
  )
}

export default Desktop
