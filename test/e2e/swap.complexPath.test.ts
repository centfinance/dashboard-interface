import { Dappeteer } from '@chainsafe/dappeteer'
import { Browser, Page } from 'puppeteer'

import { ADDRESSES } from './constants/Addresses'
import { FUNDING_SOURCE } from './constants/FundingSource'
import { TestHelper } from './helpers/TestHelper'
import { CreatePoolPage } from './pages/pools/CreatePoolPage'
import { LiquidityPoolsPage } from './pages/pools/LiquidityPoolsPage'
import { SwapPage } from './pages/swap/SwapPage'

let browser: Browser
let page: Page
let metamask: Dappeteer

let swapPage: SwapPage
let liquidityPoolsPage: LiquidityPoolsPage
let createPoolPage: CreatePoolPage

require('dotenv').config()

let baseUrl: string = process.env.TEST_BASE_URL || 'http://localhost:3000'

const cases = [['ETH', FUNDING_SOURCE.WALLET, 'USDT', FUNDING_SOURCE.WALLET]]

jest.retryTimes(1)

describe('Trident Swap:', () => {
  beforeAll(async () => {
    ;[metamask, browser, page] = await TestHelper.initDappeteer()

    swapPage = new SwapPage(page, metamask, baseUrl)
    liquidityPoolsPage = new LiquidityPoolsPage(page, metamask, baseUrl)
    createPoolPage = new CreatePoolPage(page, metamask, baseUrl)

    await page.goto(baseUrl)
    await page.bringToFront()

    await swapPage.connectMetamaskWallet()
    await swapPage.addTokenToMetamask(ADDRESSES.USDT)
  })

  beforeEach(async () => {
    await swapPage.blockingWait(2, true)
  })

  afterAll(async () => {
    browser.close()
  })

  test.only.each(cases)(`Should swap from %p %p to %p %p`, async (inToken, payFrom, outToken, receiveTo) => {
    const targetPoolName = 'ETH-USDT'

    await liquidityPoolsPage.navigateTo()
    await liquidityPoolsPage.clickCreateNewPoolButton()

    await createPoolPage.setAssetA(inToken)
    await createPoolPage.setAssetB(outToken)

    // Create pool
    // 1. Click create new pool button - ✔
    // 2. Click classic pool type button - ✔
    // 3. Click continue button - ✔
    // 5. Set Token0 - Eth, pay from wallet - ✔
    // 6. Set Token1 - Usdt, pay from wallet - ✔
    // 7. Set Token0 amount -> balance * 0.01 - ✔
    // 8. Set Token1 amount -> balance * 0.01 - ✔
    // 9. Set pool fee - 0.01 - ✔
    // 10. Check for approve button and approve if exists
    //
    // Create ETH-USDT pool #1
    // Create ETH-USDT pool #2
    // Swap token
  })
})
