import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { ChainId } from '@sushiswap/core-sdk'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import Button from 'app/components/Button'
import Container from 'app/components/Container'
// import { useWalletModalToggle } from 'app/state/application/hooks'
import { useNetworkModalToggle } from 'app/state/application/hooks'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Activity } from 'react-feather'

export default function ConnectWallet() {
  const router = useRouter()
  // const toggleWalletModal = useWalletModalToggle()
  const { i18n } = useLingui()
  const { error, chainId } = useWeb3React()
  const toggleNetworkModal = useNetworkModalToggle()

  const gotoHome = () => {
    router.push('/farm')
  }

  return (
    <Container id="dashboard-page" className="py-4 md:py-8 lg:py-12" maxWidth="2xl">
      <Head>
        <title>Connect Wallet | Symmetric</title>
        <meta name="description" content="Sushi" />
        <meta key="twitter:description" name="twitter:description" content="Sushi" />
        <meta key="og:description" property="og:description" content="Sushi" />
      </Head>
      {error || chainId !== ChainId.CELO ? (
        <div
          className="flex items-center justify-center px-4 py-2 font-semibold text-white border rounded bg-opacity-80 border-red bg-red hover:bg-opacity-100 cursor-pointer"
          onClick={() => toggleNetworkModal()}
        >
          <div className="mr-1">
            <Activity className="w-4 h-4" />
          </div>
          {error instanceof UnsupportedChainIdError || chainId !== ChainId.CELO
            ? i18n._(t`You are on the wrong network`)
            : i18n._(t`Error`)}
        </div>
      ) : (
        <div className="flex justify-center">
          <Button id="connect-wallet" onClick={gotoHome} variant="filled" color="symmetric" className={'!border-none'}>
            {i18n._(t`Go to homepage`)}
          </Button>
        </div>
      )}
    </Container>
  )
}
