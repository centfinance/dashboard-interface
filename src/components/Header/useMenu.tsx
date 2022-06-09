// import { SwitchVerticalIcon } from '@heroicons/react/outline'
// import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Feature } from 'app/enums'
import { featureEnabled } from 'app/functions'
import { useActiveWeb3React } from 'app/services/web3'
import { ReactNode, useMemo } from 'react'

export interface MenuItemLeaf {
  key: string
  title: string
  link: string
  icon?: ReactNode
}

export interface MenuItemNode {
  key: string
  title: string
  items: MenuItemLeaf[]
  icon?: ReactNode
}

export type MenuItem = MenuItemLeaf | MenuItemNode
export type Menu = MenuItem[]

type UseMenu = () => Menu
const useMenu: UseMenu = () => {
  const { i18n } = useLingui()
  const { chainId, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!chainId) return []

    const menu: Menu = []

    if (featureEnabled(Feature.LIQUIDITY_MINING, chainId)) {
      // const farmItems = {
      //   key: 'farm',
      //   title: i18n._(t`Farm`),
      //   icon: <SwitchVerticalIcon width={20} className="rotate-90 filter" />,
      //   items: [
      //     {
      //       key: 'farm',
      //       title: i18n._(t`Farming Pools`),
      //       link: '/farm',
      //     },
      //     // {
      //     //   key: 'farm',
      //     //   title: i18n._(t`V2 Farming Pools`),
      //     //   link: '/farm/v2',
      //     // },
      //     // {
      //     //   key: 'my-farms',
      //     //   title: i18n._(t`My Farms`),
      //     //   link: '/farm?filter=portfolio',
      //     // },
      //   ],
      // }
      // menu.push(farmItems)
    }

    return menu.filter((el) => Object.keys(el).length > 0)
  }, [chainId, i18n])
}

export default useMenu
