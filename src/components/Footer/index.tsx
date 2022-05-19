// import { t } from '@lingui/macro'
// import { useLingui } from '@lingui/react'
import { DiscordIcon, MediumIcon, TwitterIcon } from 'app/components/Icon'
import LanguageSwitch from 'app/components/LanguageSwitch'
// import Typography from 'app/components/Typography'
// import { useActiveWeb3React } from 'app/services/web3'
// import Image from 'next/image'
import React from 'react'

import Container from '../Container'

const Footer = () => {
  // const { chainId } = useActiveWeb3React()
  // const { i18n } = useLingui()

  return (
    <div className="z-10 w-full pt-20 pb-10 mt-20">
      <Container maxWidth="7xl" className="px-6 mx-auto">
        <div className="grid grid-cols-2 gap-10 pt-8 border-t md:grid-cols-3 lg:grid-cols-6 xs:px-6 border-dark-900">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-start gap-2">
              <div className="">
                <LanguageSwitch />
                {/* <Image
                  src="https://celo-pools.symmetric.exchange/img/symmetricIcon.ad634ddf.svg"
                  alt="Symmetric logo"
                  width="88px"
                  height="88px"
                /> */}
              </div>
              {/* <Typography variant="h2" weight={700} className="tracking-[0.02em] scale-y-90 hover:text-high-emphesis">
                SYMMETRIC
              </Typography> */}
            </div>
            {/* <Typography variant="xs" className="text-low-emphesis">
              {i18n._(t`Our community is building a comprehensive decentralized trading platform for the future of finance. Join
              us!`)}
            </Typography> */}
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/0xSymmetric" target="_blank" rel="noreferrer">
                <TwitterIcon width={16} className="text-low-emphesis" />
              </a>
              <a href="https://medium.com/@Symmetric.Finance" target="_blank" rel="noreferrer">
                <MediumIcon width={16} className="text-low-emphesis" />
              </a>
              <a href="https://discord.gg/rJd7azWx4V" target="_blank" rel="noreferrer">
                <DiscordIcon width={16} className="text-low-emphesis" />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Footer
