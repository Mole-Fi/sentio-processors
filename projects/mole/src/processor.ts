import { SuiNetwork, SuiObjectProcessor, SuiWrappedObjectProcessor} from "@sentio/sdk/sui"
import { vault } from './types/sui/0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f.js'
import { pool } from './types/sui/0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb.js'
import { getPriceByType } from "@sentio/sdk/utils"
import { buildCoinInfo, coinAddrBUCK, coinAddrCETUS, coinAddrFDUSD, coinAddrHASUI, coinAddrNAVX, coinAddrSCA, coinAddrSUI, coinAddrsuiUSDT, coinAddrUSDC, coinAddrUSDT, coinAddrWBTC, coinAddrWETH, coinAddrwUSDC, getCoinAmountFromLiquidity, getCoinTypeByVaultConfigId, getPoolByToken, getResponseContentByWorkerInfo, i32BitsToNumber, sleep, tickIndexToSqrtPriceX64, vaultBuckConfigId, vaultCetusConfigId, vaultFdusdConfigId, vaultHaSuiConfigId, vaultNavxConfigId, vaultScaConfigId, vaultSuiConfigId, vaultsuiUsdtConfigId, vaultUsdcConfigId, vaultUsdtConfigId, vaultWbtcConfigId, vaultWethConfigId, vaultwUsdcConfigId} from './utils/mole_utils.js'
import * as constant from './utils/constant.js'
import { ANY_TYPE } from '@sentio/sdk/move'
import { string_ } from "@sentio/sdk/sui/builtin/0x1";
import BN from 'bn.js'
import axiosInst from './utils/moleAxios.js'

// sui_incentive.bind({ 
//     address: '0xc4dc6948a7d0a58f32fadd44e45efb201f44383bfab1cb6c48b9c186a92cc762',
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint: 32697300n
//   })
//     .onEventHarvestEvent(
//       async (event, ctx) => {
//         const user = event.data_decoded.user
//         const pid = String(event.data_decoded.pid)
//         const amount = Number(event.data_decoded.amount) / Math.pow(10, 9)
//         const action_type = String(event.data_decoded.action_type)
//         const poolInfo = getPoolInfoByPoolId(pid)

//         ctx.meter.Gauge("harvest_pid").record(amount, { action_type, pid, pool_address: poolInfo![0], underlying_token_address: poolInfo![1], project: "mole" })

  
//         ctx.eventLogger.emit("HarvestEvent", {
//           distinctId: user,
//           pid: pid,
//           pool_address: poolInfo![0],
//           underlying_token_address: poolInfo![1],
//           amount: amount,
//           action_type: action_type,
//           project: "mole"
//         })
//       },
//     )


SuiWrappedObjectProcessor.bind({
  //object owner address of vault_usdt_vault_info/vault_sui_vault_info etc.
  objectId: "0x0dcd6ff3155967823494c7d4dd3bc952e551102879562ff7c75019b290281583",
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 23543749n
})
  .onTimeInterval(async (dynamicFieldObjects, ctx) => {
    try {

      const objectType = vault.VaultInfo.type(ANY_TYPE)

      let fields = await ctx.coder.getDynamicFields(dynamicFieldObjects, string_.String.type(),  objectType)
      let retry = 0
      while (!fields && retry < 300) {
        await sleep(300);
        fields = await ctx.coder.getDynamicFields(dynamicFieldObjects, string_.String.type(),  objectType)
        retry++     
        
        if (retry == 299) {
          throw new Error("getDynamicFields error")
        }
      }

      for (const field of fields) {
        //@ts-ignore
        const configAddr = field.value.config_addr

        let coinType = getCoinTypeByVaultConfigId(configAddr)
        
        let coinInfo = await buildCoinInfo(ctx, coinType!)
        retry = 0
        while ((!coinInfo || coinInfo.symbol == "unk") && retry < 300) {
          await sleep(300);
          coinInfo = await buildCoinInfo(ctx, coinType!)
          retry++    

          if (retry == 299) {
            throw new Error("buildCoinInfo error")
          }   
        }

        let coin_symbol = coinInfo.symbol

        if (coinType.toLowerCase() == coinAddrwUSDC.toLowerCase()) {
          coin_symbol = 'wUSDC'
        } else if (coinType.toLowerCase() == coinAddrsuiUSDT.toLowerCase()) {
          coin_symbol = 'suiUSDT'
        }
        
        //@ts-ignore
        const savings_debt = Number(field.value.vault_debt_val) / Math.pow(10, coinInfo.decimal)

        let price = await getPriceByType(SuiNetwork.MAIN_NET, coinType!, ctx.timestamp)
        retry = 0
        while (!price && retry < 300) {
          await sleep(300);
          price = await getPriceByType(SuiNetwork.MAIN_NET, coinType!, ctx.timestamp)
          retry++    
          
          if (retry == 299) {
            throw new Error("getPriceByType error")
          }   
        }
        const pool = getPoolByToken(coinType)!

        const savings_debt_usd = savings_debt * price! 

        //@ts-ignore
        ctx.meter.Gauge("savings_debt_amount").record(savings_debt, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole" })

        //@ts-ignore
        ctx.meter.Gauge("savings_debt_usd").record(savings_debt_usd, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole" })

        // savings_free_coin = deposit - debt
        //@ts-ignore
        const savings_free_coin = Number(field.value.coin) / Math.pow(10, coinInfo.decimal)
        const savings_free_coin_usd = savings_free_coin * price! 

        ctx.meter.Gauge("savings_free_coin_amount").record(savings_free_coin, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole" })
        ctx.meter.Gauge("savings_free_coin_usd").record(savings_free_coin_usd, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole" })

        console.log("savings_debt:", savings_debt, ", savings_free_coin:", savings_free_coin, ",coin_symbol:", coin_symbol)
        console.log("savings_debt_usd:", savings_debt_usd, ", savings_free_coin_usd:", savings_free_coin_usd, ",coin_symbol:", coin_symbol)

        const use_rate = savings_debt / (savings_debt + savings_free_coin)

        // Borrowing interest = a * utilization + b
        let a, b
        if (use_rate < 0.6) {
          a = 0.183333333 
          b = 0
        } else if (use_rate >= 0.6 && use_rate < 0.95) {
          a = 0 
          b = 0.11
        } else { // use_rate >= 0.9
          a = 3
          b = -2.74
        }
        const savings_borrowing_interest =  a * use_rate + b
        ctx.meter.Gauge("savings_borrowing_interest").record(savings_borrowing_interest, { coin_symbol, coinType, project: "mole" })

        // Lending interest = Borrowing Interest * Utilization * (1 - Borrow Protocol Fee)
        const savings_lending_interest_apr = savings_borrowing_interest * use_rate * (1 - 0.19)
        // apr to apy
        const savings_lending_interest_apy =  Math.pow(1 + savings_lending_interest_apr / 365, 365) - 1

        ctx.meter.Gauge("savings_lending_interest").record(savings_lending_interest_apy, { coin_symbol, coinType, project: "mole" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 480, 1440, undefined, { owned: true })

  
SuiObjectProcessor.bind({
  objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 25721833n
})
.onTimeInterval(async (self, _, ctx) => {
  try {
    
    // get json data from mole
    const data_url = `https://app.mole.fi/api/SuiMainnet/data.json`
    let res = await axiosInst.get(data_url).catch(err => {
        console.error('get data error:', err)
    })
    if (!res) {
      console.error('data_get got no response')
    }

    let retry = 0
    while (!res && retry < 300) {
      await sleep(300);
      res = await axiosInst.get(data_url).catch(err => {
          console.error('get data error:', err)
      })
      retry++
      
      if (retry == 299) {
        throw new Error("axiosInst")
      }
    }

    const farmsData = res!.data.farms    

    for (let i = 0 ; i < farmsData.length; i ++) {
      const farmName = farmsData[i].symbol1 + '-' + farmsData[i].symbol2
      const farmApr = farmsData[i].totalApr         

      ctx.meter.Gauge("lyf_apr").record(farmApr, { farmName, project: "mole" })
    }
  }
catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 480, 1440, undefined, { owned: false })



  SuiObjectProcessor.bind({
    objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 26720650n
  })
  .onTimeInterval(async (self, _, ctx) => {
    try {
  
      const data_url = `https://app.mole.fi/api/SuiMainnet/data.json`
      let res = await axiosInst.get(data_url).catch(err => {
          console.error('get data error:', err)
      })
      if (!res) {
        console.error('data_get got no response')
      }

      let retry = 0
      while (!res && retry < 300) {
        await sleep(300);
        res = await axiosInst.get(data_url).catch(err => {
          console.error('get data error:', err)
        })
        retry++      
        
        if (retry == 299) {
          throw new Error("axiosInst get")
        }
      }
  
      const moleSuiIncentivePoolsData = res!.data.moleSuiIncentivePools  
  
      for (let i = 0 ; i < moleSuiIncentivePoolsData.length; i++) {
        let coin_symbol = moleSuiIncentivePoolsData[i].symbol.toString().substr(1)
        const apy = moleSuiIncentivePoolsData[i].apy
  
        if (coin_symbol == "HASUI") {
          coin_symbol = "haSUI"
        }
  
        ctx.meter.Gauge("vaults_staking_apy").record(apy, { coin_symbol, project: "mole" })
      }
    }
  catch (e) {
        console.log(`${e.message} error at ${JSON.stringify(self)}`)
      }
    }, 480, 1440, undefined, { owned: false })
  
  

//@ts-ignore
let gCurrentSqrtPricewUsdcSui
//@ts-ignore
let gCurrentSqrtPriceUsdtwUsdc
//@ts-ignore
let gCurrentSqrtPriceWethwUsdc
//@ts-ignore
let gCurrentSqrtPriceUsdtSui
//@ts-ignore
let gCurrentSqrtPriceHasuiSui
//@ts-ignore
let gCurrentSqrtPricewUsdcCetus
//@ts-ignore
let gCurrentSqrtPriceCetusSui
//@ts-ignore
let gCurrentSqrtPriceNavxSui
//@ts-ignore
let gCurrentSqrtPriceNavxCetus
//@ts-ignore
let gCurrentSqrtPriceScaSui
//@ts-ignore
let gCurrentSqrtPriceWethCetus
//@ts-ignore
let gCurrentSqrtPriceUsdtCetus
//@ts-ignore
let gCurrentSqrtPricewUsdcWbtc
//@ts-ignore
let gCurrentSqrtPriceBuckwUsdc
//@ts-ignore
let gCurrentSqrtPriceUsdcSui
//@ts-ignore
let gCurrentSqrtPriceUsdcUsdt
//@ts-ignore
let gCurrentSqrtPriceUsdcCetus
//@ts-ignore
let gCurrentSqrtPriceUsdcwUsdc
//@ts-ignore
let gCurrentSqrtPriceUsdcBuck
//@ts-ignore
let gCurrentSqrtPriceBuckUsdc
//@ts-ignore
let gCurrentSqrtPriceBuckSui
//@ts-ignore
let gCurrentSqrtPriceSuiBuck
//@ts-ignore
let gCurrentSqrtPriceUsdcwUsdcNew
//@ts-ignore
let gCurrentSqrtPriceBuckwUsdcNew
//@ts-ignore
let gCurrentSqrtPriceUsdcsuiUsdt
//@ts-ignore
let gCurrentSqrtPriceFdusdUsdc


for (let i = 0; i < constant.POOLS_MOLE_LIST.length; i++) {
  SuiObjectProcessor.bind({
    objectId: constant.POOLS_MOLE_LIST[i],
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 23543749n
  })
  .onTimeInterval(async (self, _, ctx) => {
    try {
      let res = await ctx.coder.decodedType(self, pool.Pool.type())
      let retry = 0
      while (!res && retry < 300) {
        await sleep(300);
        res = await ctx.coder.decodedType(self, pool.Pool.type())
        retry++

        if (retry == 299) {
          throw new Error("decodedType")
        }
      }
      
      //@ts-ignore
      const currentSqrtPrice = Number(res!.current_sqrt_price)

      if ('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630' == ctx.objectId) {
        gCurrentSqrtPricewUsdcSui = currentSqrtPrice
      } else if ('0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20' == ctx.objectId) {
        gCurrentSqrtPriceUsdtwUsdc = currentSqrtPrice
      } else if ('0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df' == ctx.objectId) {
        gCurrentSqrtPriceWethwUsdc = currentSqrtPrice
      } else if ('0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3' == ctx.objectId) {
        gCurrentSqrtPriceUsdtSui = currentSqrtPrice
      } else if ('0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc' == ctx.objectId) {
        gCurrentSqrtPriceHasuiSui = currentSqrtPrice
      } else if ('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8' == ctx.objectId) {
        gCurrentSqrtPricewUsdcCetus = currentSqrtPrice
      } else if ('0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded' == ctx.objectId) {
        gCurrentSqrtPriceCetusSui = currentSqrtPrice
      } else if ('0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703' == ctx.objectId) {
        gCurrentSqrtPriceNavxSui = currentSqrtPrice
      } else if ('0x3ec8401520022aac67935188eb1f82c13cbbc949ab04692e5b62445d89b61c9f' == ctx.objectId) {
        gCurrentSqrtPriceNavxCetus = currentSqrtPrice
      } else if ('0xaa72bd551b25715b8f9d72f226fa02526bdf2e085a86faec7184230c5209bb6e' == ctx.objectId) {
        gCurrentSqrtPriceScaSui = currentSqrtPrice
      } else if ('0x81f6bdb7f443b2a55de8554d2d694b7666069a481526a1ff0c91775265ac0fc1' == ctx.objectId) {
        gCurrentSqrtPriceWethCetus = currentSqrtPrice
      } else if ('0x91ba432e39602d12c2f3d95c7c7f890e1f1c7c8e7d0b9c6d6035a33d1f93e1cb' == ctx.objectId) {
        gCurrentSqrtPriceUsdtCetus = currentSqrtPrice
      } else if ('0xaa57c66ba6ee8f2219376659f727f2b13d49ead66435aa99f57bb008a64a8042' == ctx.objectId) {
        gCurrentSqrtPricewUsdcWbtc = currentSqrtPrice
      } else if ('0x81fe26939ed676dd766358a60445341a06cea407ca6f3671ef30f162c84126d5' == ctx.objectId) {
        gCurrentSqrtPriceBuckwUsdc = currentSqrtPrice
      } else if ('0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105' == ctx.objectId) {
        gCurrentSqrtPriceUsdcSui = currentSqrtPrice
      } else if ('0x6bd72983b0b5a77774af8c77567bb593b418ae3cd750a5926814fcd236409aaa' == ctx.objectId) {
        gCurrentSqrtPriceUsdcUsdt = currentSqrtPrice
      } else if ('0x3b13ac70030d587624e407bbe791160b459c48f1049e04269eb8ee731f5442b4' == ctx.objectId) {
        gCurrentSqrtPriceUsdcCetus = currentSqrtPrice
      } else if ('0xc29be5c19c35be7af76c89e85e6deb076789d70019b9f8d22a80e77e720bdec0' == ctx.objectId) {
        gCurrentSqrtPriceUsdcwUsdc = currentSqrtPrice
      } else if ('0x4c50ba9d1e60d229800293a4222851c9c3f797aa5ba8a8d32cc67ec7e79fec60' == ctx.objectId) {
        gCurrentSqrtPriceUsdcBuck = currentSqrtPrice
      } else if ('0x59cf0d333464ad29443d92bfd2ddfd1f794c5830141a5ee4a815d1ef3395bf6c' == ctx.objectId) {
        gCurrentSqrtPriceBuckSui = currentSqrtPrice
      } else if ('0x1efc96c99c9d91ac0f54f0ca78d2d9a6ba11377d29354c0a192c86f0495ddec7' == ctx.objectId) {
        gCurrentSqrtPriceUsdcwUsdcNew = currentSqrtPrice
      } else if ('0xd4573bdd25c629127d54c5671d72a0754ef47767e6c01758d6dc651f57951e7d' == ctx.objectId) {
        gCurrentSqrtPriceBuckwUsdcNew = currentSqrtPrice
      } else if ('0x7df346f8ef98ad20869ff6d2fc7c43c00403a524987509091b39ce61dde00957' == ctx.objectId) {
        gCurrentSqrtPriceUsdcsuiUsdt = currentSqrtPrice
      } else if ('0x43d4c9adc1d669ef85d557cf1d430f311dc4eb043a8e7b78e972c1f96ec2cd60' == ctx.objectId) {
        gCurrentSqrtPriceFdusdUsdc = currentSqrtPrice
      } else {
        console.error("Has not object : ", ctx.objectId)
      }
     
      console.log("currentSqrtPrice :", currentSqrtPrice)
    }
  catch (e) {
        console.log(`${e.message} error at ${JSON.stringify(self)}`)
      }
    }, 480, 1440, undefined, { owned: false })
}



// Worker info    
for (let i = 0; i < constant.MOLE_WORKER_INFO_LIST.length; i++) {
  const workerInfoAddr = constant.MOLE_WORKER_INFO_LIST[i]

  SuiObjectProcessor.bind({
    objectId: workerInfoAddr,
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 23543749n
  })
  .onTimeInterval(async (self, _, ctx) => {
    // console.log("ctx.objectId:" , ctx.objectId, ", slef:",JSON.stringify(self))
    
    try {
      let res = await getResponseContentByWorkerInfo(workerInfoAddr, ctx, self)
            
      // console.log("ctx.objectId:" , ctx.objectId, ",res : ", JSON.stringify(res))

      //@ts-ignore
      const liquidity = Number(res!.position_nft.liquidity)
      //@ts-ignore
      const tickLowerIndex = i32BitsToNumber((res!.position_nft.tick_lower_index.bits).toString())
      //@ts-ignore
      const tickUpperIndex = i32BitsToNumber((res!.position_nft.tick_upper_index.bits).toString())
      //@ts-ignore
      const poolId = res!.position_nft.pool
      //@ts-ignore
      const coinTypeA = '0x' + res!.position_nft.coin_type_a.name
      //@ts-ignore
      const coinTypeB = '0x' + res!.position_nft.coin_type_b.name

      let coinInfoA = await buildCoinInfo(ctx, coinTypeA)
      let retry = 0
      while ((!coinInfoA || coinInfoA.symbol == "unk") && retry < 300) {
        await sleep(300);
        coinInfoA = await buildCoinInfo(ctx, coinTypeA)
        retry++

        if (retry == 299) {
          throw new Error("buildCoinInfo coinInfoA")
        }
      }

      let coin_symbol_a = coinInfoA.symbol

      if (coinTypeA.toLowerCase() == coinAddrwUSDC.toLowerCase()) {
        coin_symbol_a = 'wUSDC'
      } else if (coinTypeA.toLowerCase() == coinAddrsuiUSDT.toLowerCase()) {
        coin_symbol_a = 'suiUSDT'
      }

      let coinInfoB = await buildCoinInfo(ctx, coinTypeB)
      retry = 0
      while ((!coinInfoB || coinInfoB.symbol == "unk") && retry < 300) {
        await sleep(300);
        coinInfoB = await buildCoinInfo(ctx, coinTypeB)
        retry++

        if (retry == 299) {
          throw new Error("buildCoinInfo coinInfoB")
        }
      }
      let coin_symbol_b = coinInfoB.symbol

      if (coinTypeB.toLowerCase() == coinAddrwUSDC.toLowerCase()) {
        coin_symbol_b = 'wUSDC'
      } else if (coinTypeB.toLowerCase() == coinAddrsuiUSDT.toLowerCase()) {
        coin_symbol_b = 'suiUSDT'
      }

      let currentSqrtPrice
      if (coinTypeA == coinAddrwUSDC && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPricewUsdcSui
      } else if (coinTypeA == coinAddrUSDT && coinTypeB == coinAddrwUSDC) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdtwUsdc
      } else if (coinTypeA == coinAddrWETH && coinTypeB == coinAddrwUSDC) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceWethwUsdc
      } else if (coinTypeA == coinAddrUSDT && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdtSui
      } else if (coinTypeA == coinAddrHASUI && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceHasuiSui
      } else if (coinTypeA == coinAddrwUSDC && coinTypeB == coinAddrCETUS) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPricewUsdcCetus
      } else if (coinTypeA == coinAddrCETUS && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceCetusSui
      } else if (coinTypeA == coinAddrNAVX && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceNavxSui
      } else if (coinTypeA == coinAddrNAVX && coinTypeB == coinAddrCETUS) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceNavxCetus
      } else if (coinTypeA == coinAddrSCA && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceScaSui
      } else if (coinTypeA == coinAddrWETH && coinTypeB == coinAddrCETUS) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceWethCetus
      } else if (coinTypeA == coinAddrUSDT && coinTypeB == coinAddrCETUS) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdtCetus
      } else if (coinTypeA == coinAddrwUSDC && coinTypeB == coinAddrWBTC) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPricewUsdcWbtc
      } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrwUSDC 
        && ( workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce" 
          || workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659"
      )) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceBuckwUsdc
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcSui
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrUSDT) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcUsdt
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrCETUS) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcCetus
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrwUSDC 
        && ( workerInfoAddr == "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e" 
            || workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242"
      )) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcwUsdc
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrBUCK) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcBuck
      } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrUSDC) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceBuckUsdc
      } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceBuckSui
      } else if (coinTypeA == coinAddrSUI && coinTypeB == coinAddrBUCK) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceSuiBuck
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrwUSDC 
        && ( workerInfoAddr == "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a" 
            || workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76"
      )) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcwUsdcNew
        coin_symbol_b = coin_symbol_b + '-new'
      } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrwUSDC 
        && ( workerInfoAddr == "0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2" 
          || workerInfoAddr == "0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1"
      )) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceBuckwUsdcNew
        coin_symbol_b = coin_symbol_b + '-new'
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrsuiUSDT) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcsuiUsdt
      } else if (coinTypeA == coinAddrFDUSD && coinTypeB == coinAddrUSDC) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceFdusdUsdc
      } else {
        console.error("Has not price : coin_symbol_a:", coin_symbol_a, ",coin_symbol_b:",coin_symbol_b )
      }

      if (!currentSqrtPrice) {
        console.error("currentSqrtPrice is undefined, coinTypeA:", coinTypeA, ", coinTypeB:", coinTypeB)
        return
      }
       
      // console.log("liquidity:", liquidity, ",tickLowerIndex:", tickLowerIndex, ",tickUpperIndex:", tickUpperIndex, ",poolId:", poolId, ",coinTypeA:", coinTypeA,
      //  ",coinTypeB:", coinTypeB, ",currentSqrtPrice:", currentSqrtPrice)

      const lowerSqrtPriceX64 = tickIndexToSqrtPriceX64(tickLowerIndex)

      // console.log("lowerSqrtPriceX64:", lowerSqrtPriceX64.toString())

      const upperSqrtPriceX64 = tickIndexToSqrtPriceX64(tickUpperIndex)
      // console.log("upperSqrtPriceX64:", upperSqrtPriceX64.toString())


      const coinAmounts = getCoinAmountFromLiquidity(new BN(liquidity.toString()), new BN(currentSqrtPrice.toString()), lowerSqrtPriceX64, upperSqrtPriceX64, false)

      const coinAamount = coinAmounts.coinA
      const coinBamount = coinAmounts.coinB
      // console.log("coinAamount:", coinAamount.toString(), ", coinBamount:", coinBamount.toString())

      const priceA = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeA, ctx.timestamp)
      const priceB = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeB, ctx.timestamp)

      const lyf_usd_farm_usd = Number(coinAamount) * priceA! / Math.pow(10, coinInfoA.decimal) + Number(coinBamount) * priceB! / Math.pow(10, coinInfoB.decimal)

      const farmPairName = coin_symbol_a + '-' + coin_symbol_b

      ctx.meter.Gauge("lyf_usd_farm_usd").record(lyf_usd_farm_usd, {farmPairName , project: "mole" })

      console.log("lyf_usd_farm_usd:", lyf_usd_farm_usd, ", farmPairName: ", farmPairName)
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 480, 1440, undefined, { owned: false })
}



SuiWrappedObjectProcessor.bind({
  //object owner address of vault_usdt_vault_info/vault_sui_vault_info etc.
  objectId: "0x0dcd6ff3155967823494c7d4dd3bc952e551102879562ff7c75019b290281583",
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 23543749n
})
  .onTimeInterval(async (dynamicFieldObjects, ctx) => {
    try {

      const objectType = vault.VaultInfo.type(ANY_TYPE)

      let fields = await ctx.coder.getDynamicFields(dynamicFieldObjects, string_.String.type(),  objectType)
      let retry = 0
      while (!fields && retry < 300) {
        await sleep(300);
        fields = await ctx.coder.getDynamicFields(dynamicFieldObjects, string_.String.type(),  objectType)
        retry++     
        
        if (retry == 299) {
          throw new Error("getDynamicFields error")
        }
      }
      

      for (const field of fields) {
        //@ts-ignore
        const configAddr = field.value.config_addr

        let coinType = getCoinTypeByVaultConfigId(configAddr)

        let coinInfo = await buildCoinInfo(ctx, coinType!)
        retry = 0
        while ((!coinInfo || coinInfo.symbol == "unk") && retry < 300) {
          await sleep(300);
          coinInfo = await buildCoinInfo(ctx, coinType!)
          retry++    

          if (retry == 299) {
            throw new Error("buildCoinInfo error")
          }   
        }

        let coin_symbol = coinInfo.symbol

        if (coinType.toLowerCase() == coinAddrwUSDC.toLowerCase()) {
          coin_symbol = 'wUSDC'
        } else if (coinType.toLowerCase() == coinAddrsuiUSDT.toLowerCase()) {
          coin_symbol = 'suiUSDT'
        }
        
        //@ts-ignore
        const savingsCurrentFee = Number(field.value.reserve_pool) / Math.pow(10, coinInfo.decimal)

        let accumulateFee = 0
        // https://suivision.xyz/account/0x2c39e589b15864b856ceab8b87f8333ca01fd658e35419888dd2ae884d107a4c?tab=Activity  withdraw_reserve
        if (ctx.checkpoint >= 4063111 && ctx.checkpoint < 12234863) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 12234863 && ctx.checkpoint < 27846412) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 27846412 && ctx.checkpoint < 27955915) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 27955915 && ctx.checkpoint < 28277822) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0 + 0.09845773
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 +  0 + 1.122338056
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 28277822 && ctx.checkpoint < 28466966) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0 + 0.09845773 + 0.00000013
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 28466966 && ctx.checkpoint < 28828283) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0 + 0.09845773 + 0.00000013 + 0.00002272
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 28828283 && ctx.checkpoint < 29622823) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0 + 0.09845773 + 0.00000013 + 0.00002272 + 0.00000006 
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 29622823 && ctx.checkpoint < 35481090) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0 + 0.09845773 + 0.00000013 + 0.00002272 + 0.00000006 + 0
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039 + 34.108969
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0 + 0
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695 + 175.976913576
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0 + 0
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 35481090 && ctx.checkpoint < 89328791) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0.09845773 + 0 + 0.00000013 + 0.00002272 + 0.00000006 + 0 + 0.00187223 
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0 + 0.100466176 
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209 + 0.010165 
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039 + 34.108969 + 172.970752 
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0 + 0 + 81.334258105 
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695 + 175.976913576 + 2157.302282819
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0 + 0 + 0.375408055
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 25.646615746 
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.00000187 
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.032972178
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 89328791 && ctx.checkpoint < 122460676) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0.09845773 + 0 + 0.00000013 + 0.00002272 + 0.00000006 + 0 + 0.00187223 + 0.12178293
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0 + 0.100466176 + 0.418409173
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209 + 0.010165 + 0.148551
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039 + 34.108969 + 172.970752 + 3805.021933
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0 + 0 + 81.334258105 + 311.820012603
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695 + 175.976913576 + 2157.302282819 + 1605.159619797
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0 + 0 + 0.375408055 + 0.436247858
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 25.646615746 + 28.350234249
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.00000187 + 0.00014818
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.032972178 + 4005.622594355
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 777.934996
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 122460676) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0.09845773 + 0 + 0.00000013 + 0.00002272 + 0.00000006 + 0 + 0.00187223 + 0.12178293 + 0.00019822
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0 + 0.100466176 + 0.418409173 + 0.116969597
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209 + 0.010165 + 0.148551 + 0.25037
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039 + 34.108969 + 172.970752 + 3805.021933 + 490.584026
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0 + 0 + 81.334258105 + 311.820012603 + 0.459281852
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695 + 175.976913576 + 2157.302282819 + 1605.159619797 + 0.816215773
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0 + 0 + 0.375408055 + 0.436247858 + 0.001678484
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 25.646615746 + 28.350234249 + 0.071171165
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.00000187 + 0.00014818 + 0.00000241
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.032972178 + 4005.622594355 + 2757.828511355
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 777.934996 + 9028.24653
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 39.383106
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 2.179531
          } else {
            console.error("CoinType not suppport!")
          }
        }

        let price = await getPriceByType(SuiNetwork.MAIN_NET, coinType!, ctx.timestamp)
        retry = 0
        while (!price && retry < 300) {
          await sleep(300);
          price = await getPriceByType(SuiNetwork.MAIN_NET, coinType!, ctx.timestamp)
          retry++    
          
          if (retry == 299) {
            throw new Error("getPriceByType error")
          }   
        }

        const savingsCurrentFeeUsd = savingsCurrentFee * price! 
        const accumulateFeeUsd = accumulateFee * price!
        const savingsFee = savingsCurrentFee + accumulateFee
        const savingsFeeUsd = savingsCurrentFeeUsd + accumulateFeeUsd

        console.log("savingsCurrentFee: ", savingsCurrentFee, ", accumulateFee:", accumulateFee, ", savingsFee:", savingsFee)
        console.log("savingsCurrentFeeUsd: ", savingsCurrentFeeUsd, ", accumulateFeeUsd:", accumulateFeeUsd, ", savingsFeeUsd:", savingsFeeUsd)

        //@ts-ignore
        ctx.meter.Gauge("savings_fee").record(savingsFee, { coin_symbol, coinType, project: "mole" })

        //@ts-ignore
        ctx.meter.Gauge("savings_fee_usd").record(savingsFeeUsd, { coin_symbol, coinType, project: "mole" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 480, 1440, undefined, { owned: true })



// vault.bind({ 
//   // old vault address
//   address: '0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f',
//   network: SuiNetwork.MAIN_NET,
//   startCheckpoint: 23543749n
// })
//   .onEventDepositEvent(
//     async (event, ctx) => {
//       // if newer than this , should use upgraded address
//       if (ctx.checkpoint > 34608243) {
//         return
//       }

//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const amount = Number(event.data_decoded.amount) / Math.pow(10, coinInfo.decimal)
//       const share = Number(event.data_decoded.share) / Math.pow(10, coinInfo.decimal)
      
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const amount_usd = amount * price!

//       const pool = getPoolByToken(coinType)!
//       const mTokenInfo = getMTokenByToken(coinType)!

//       ctx.meter.Counter("supplied_amount").add(amount_usd, { pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.meter.Counter("supplied_usd").add(amount, {pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.eventLogger.emit("Lending_List_of_Suppliers_Deposit", {
//         pool_address: pool,
//         underlying_token_address: coinType,
//         underlying_token_symbol: coin_symbol,
//         supplier_address: event.sender,
//         supplied_amount: amount,
//         supplied_usd: amount_usd,
//         collateral_amount: "NA",
//         collateral_amount_usd: "NA",
//         project: "mole"
//       })

//       ctx.eventLogger.emit("Lending_List_of_Pool", {
//         underlying_token_address: coinType,
//         underlying_token_symbol: coin_symbol,
//         receipt_token_address: mTokenInfo[0],
//         receipt_token_symbol: mTokenInfo[1],
//         pool_address: pool,
//         pool_type: "MoleSavingsPool",
//         project: "mole"
//       })


//     },
//   )

//   .onEventWithdrawEvent(
//     async (event, ctx) => {
//       // if newer than this , should use upgraded address
//       if (ctx.checkpoint > 34608243n) {
//         return
//       }

//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const amount = Number(event.data_decoded.amount) / Math.pow(10, coinInfo.decimal)
//       const share = Number(event.data_decoded.share) / Math.pow(10, coinInfo.decimal)
      
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const amount_usd = amount * price!

//       const pool = getPoolByToken(coinType)!

//       ctx.meter.Counter("supplied_amount").sub(amount_usd, {pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.meter.Counter("supplied_usd").sub(amount, {pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.eventLogger.emit("Lending_List_of_Suppliers_Withdraw", {
//         pool_address: pool,
//         underlying_token_address: coinType,
//         underlying_token_symbol: coin_symbol,
//         supplier_address: event.sender,
//         supplied_amount: amount,
//         supplied_usd: amount_usd,
//         collateral_amount: "NA",
//         collateral_amount_usd: "NA",
//         project: "mole"
//       })
//     },
//   )

  


//   vault.bind({ 
//     // upgraded vault address
//     address: '0x78bf4657eba8b390474715d51dcee7513593cb9db349071653d1f0a6d2c3b294',
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint: 34608243n
//   })
//   .onEventDepositEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const amount = Number(event.data_decoded.amount) / Math.pow(10, coinInfo.decimal)
//       const share = Number(event.data_decoded.share) / Math.pow(10, coinInfo.decimal)
      
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const amount_usd = amount * price!

//       const pool = getPoolByToken(coinType)!

//       ctx.meter.Counter("supplied_amount").add(amount_usd, { pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.meter.Counter("supplied_usd").add(amount, {pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.eventLogger.emit("Lending_List_of_Suppliers_Deposit", {
//         pool_address: pool,
//         underlying_token_address: coinType,
//         underlying_token_symbol: coin_symbol,
//         supplier_address: event.sender,
//         supplied_amount: amount,
//         supplied_usd: amount_usd,
//         collateral_amount: "NA",
//         collateral_amount_usd: "NA",
//         project: "mole"
//       })
//     },
//   )

//   .onEventWithdrawEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const amount = Number(event.data_decoded.amount) / Math.pow(10, coinInfo.decimal)
//       const share = Number(event.data_decoded.share) / Math.pow(10, coinInfo.decimal)
      
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const amount_usd = amount * price!

//       const pool = getPoolByToken(coinType)!

//       ctx.meter.Counter("supplied_amount").sub(amount_usd, {pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.meter.Counter("supplied_usd").sub(amount, {pool_address: pool, underlying_token_address: coinType, underlying_token_symbol: coin_symbol, 
//         supplier_address: event.sender, collateral_amount: "NA", collateral_amount_usd: "NA", project: "mole" })

//       ctx.eventLogger.emit("Lending_List_of_Suppliers_Withdraw", {
//         pool_address: pool,
//         underlying_token_address: coinType,
//         underlying_token_symbol: coin_symbol,
//         supplier_address: event.sender,
//         supplied_amount: amount,
//         supplied_usd: amount_usd,
//         collateral_amount: "NA",
//         collateral_amount_usd: "NA",
//         project: "mole"
//       })
//     },
//   )





// // key: workerInfoAddr,  value: sharesMap
// let workerInfoSharesMap = new Map<string, Map<string, string>>()

   
// for (let i = 0; i < constant.MOLE_WORKER_INFO_LIST.length; i++) {
//   let sharesMap = new Map()
//   const workerInfoAddr = constant.MOLE_WORKER_INFO_LIST[i]
//   let sharesObjectId = getShareObjectByWorkerInfo(workerInfoAddr)

//   SuiWrappedObjectProcessor.bind({
//     objectId: String(sharesObjectId),
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint: 34608243n
//   })
//     .onTimeInterval(async (dynamicFieldObjects, ctx) => {
//       try {
//         for (let i = 0; i < dynamicFieldObjects.length; i++){
//           const fields = dynamicFieldObjects[i].fields

//           //@ts-ignore
//           sharesMap.set(fields.name, fields.value)
         
//           //@ts-ignore
//           console.log(`Set sharesMap key: ${fields.name}, value: ${JSON.stringify(fields.value)}`)
//         }
        
//         for (let [key, value] of sharesMap) {
//           console.log(`sharesMap key: ${key}, value: ${value}`)
//         }

//         workerInfoSharesMap.set(workerInfoAddr, sharesMap)
              
//         console.log(`Set workerInfoSharesMap key: ${workerInfoAddr}, value: ${JSON.stringify(sharesMap)}`)

//       }
//       catch (e) {
//         console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
//       }
//     }, 480, 1440, undefined, { owned: true })
//   }

  


  
// // Worker info    
// for (let i = 0; i < constant.MOLE_WORKER_INFO_LIST.length; i++) {
//   const workerInfoAddr = constant.MOLE_WORKER_INFO_LIST[i]

//   SuiObjectProcessor.bind({
//     objectId: workerInfoAddr,
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint:    34608243n
//   })
//   .onTimeInterval(async (self, _, ctx) => {
//     // console.log("ctx.objectId:" , ctx.objectId, ", slef:",JSON.stringify(self))

    
//     try {
//       let res, workerAddr
//       if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_sui.WorkerInfo.type())
//         workerAddr = "0x334bed7f6426c1a3710ef7f4d66b1225df74146372b40a64e9d0cbfc76d76e67"
//       } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_wusdc.WorkerInfo.type())
//         workerAddr = "0x1454bd0be3db3c4be862104bde964913182de6d380aea24b88320505baba5e46"
//       } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdt_wusdc.WorkerInfo.type())
//         workerAddr = "0x9cb48aa1b41a1183ecdabde578e640e05a08170f8ca165b743ffded0b1256391"
//       } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_usdt.WorkerInfo.type())
//         workerAddr = "0x960ab11d560f05f0ec260c7ac87074b569334713594aa02580642e029fd9dd86"
//       } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_weth_wusdc.WorkerInfo.type())
//         workerAddr = "0xb7a0d251a9f307b80b1595c87622118e401dc613591b3435786bb7c147599dae"
//       } else if (workerInfoAddr == "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_weth.WorkerInfo.type())
//         workerAddr = "0xd49d0a3331bd41005dd1a5e295e07bf4cec1359e201ba71fc5a1e541787328d9"
//       } else if (workerInfoAddr == "0x9a510e18c37df3d9ddfe0b2d6673582f702bf281116a4ee334f7ef3edfa2b9ab") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdt_sui.WorkerInfo.type())
//         workerAddr = "0xab01c0cb01a3e50171b898eb2509f53ba2ba83ed844628f3d843b20e99783b58"
//       } else if (workerInfoAddr == "0xcd00ff33e9a71ea807f41641d515449263a905a850a4fd9c4ce03203c0f954b5") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_usdt.WorkerInfo.type())
//         workerAddr = "0x8cc36eb225997a7e35661382b5ddfda35f91a7d732e04e22d203151a9e321d66"
//       } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_cetus.WorkerInfo.type())
//         workerAddr = "0x7f24e8b7935db7588bfd7035b4aa503c1f29ed71ce2b1dbd425b8ad1096b7463"
//       } else if (workerInfoAddr == "0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_sui.WorkerInfo.type())
//         workerAddr = "0x57563b5040ac32ff1897a3c40fe9a0e987f40791289fce31ff7388805255076d"
//       } else if (workerInfoAddr == "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_wusdc.WorkerInfo.type())
//         workerAddr = "0xf538241fc4783dbf0eca4cf516fbc7ad5b910517e25d8e4ec7fb754eb9b0280c"
//       } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_cetus.WorkerInfo.type())
//         workerAddr = "0xd8528e2825b7354f5e4fd3bf89e3998e59f4cf92160d65bf491885677229def0"
//       } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_hasui_sui.WorkerInfo.type())
//         workerAddr = "0x50be9b81baf7204130eea06bb1845d4a0beccbee98c03b5ec0b17a48302351bf"
//       } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_hasui.WorkerInfo.type())
//         workerAddr = "0xd5f6540d3d3fc7fd8ed64e862a21785932e84ee669fb2e7bbe5bd23fd6552827"
//       } else if (workerInfoAddr == "0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_navx_sui.WorkerInfo.type())
//         workerAddr = "0x53e47bac30d4f17fcb0d800de9fc7f0cc96f520531bb8fd7670e9c08f060ec61"
//       } else if (workerInfoAddr == "0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_navx.WorkerInfo.type())
//         workerAddr = "0xd5b04240f6536c7b5276e96b057460a58ac8b1b66b2db03038f3d44bf1ea7cde"
//       } else if (workerInfoAddr == "0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_navx_cetus.WorkerInfo.type())
//         workerAddr = "0x6665ad06bb0c47a00e3ce6da9c796f8061b9f8178095e421ce36e3f73345f24a"
//       } else if (workerInfoAddr == "0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_navx.WorkerInfo.type())
//         workerAddr = "0xf8670497cc6403831fad47f8471cce467661c3e01833953d62fe86527bbe4474"
//       } else if (workerInfoAddr == "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sca_sui.WorkerInfo.type())
//         workerAddr = "0x0efca73a17c179aee1a5243c66c3f90101f61e9dd974e71b356ecdf0316ca626"
//       } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_sca.WorkerInfo.type())
//         workerAddr = "0x9a0355aa800e975678ce812d4ee044f3faa8b48c70d877f90d3ba8d35566e6aa"
//       } else if (workerInfoAddr == "0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_wbtc.WorkerInfo.type())
//         workerAddr = "0xff377a83375d63b9c8429362b5c2791bc69f0da861d3d963970ffeac2654d9d5"
//       } else if (workerInfoAddr == "0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wbtc_wusdc.WorkerInfo.type())
//         workerAddr = "0x15fbfe8c27c920baaa1e4bd8bfe05c4408311612baf6493ed3285c6bd95a6939"
//       } else if (workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_buck_wusdc.WorkerInfo.type())
//         workerAddr = "0xcac7d10d73c3c32f6d40031c8639dfde168e6e1c0e4a86f8d23f21db60f97c94"
//       } else if (workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_buck.WorkerInfo.type())
//         workerAddr = "0xe6ba97715edd0cfe6a8e40654b37c6f46a8a8af5b7fe2eefa3fd713243857993"
//       } else if (workerInfoAddr == "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_sui.WorkerInfo.type())
//         workerAddr = "0x1d25aa479630953f1313749759a476aa620ce65a3f2eab7a2e52a3a5e1e6e797"
//       } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_usdc.WorkerInfo.type())
//         workerAddr = "0x6e30dd0792fc4232e40cbbff861ece3c0a029d431cc3a62c5c46031524c2c91a"
//       } else if (workerInfoAddr == "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_usdt.WorkerInfo.type())
//         workerAddr = "0xf74d70ad742dcbb0f75dc75312b3e7f2a5dd0b9f01634565289cbb6a6eb812c0"
//       } else if (workerInfoAddr == "0x354808fb8a29a59e35e2d9bf06892eb913d750796b71b5f72efa6cd9d5dbbc27") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdt_usdc.WorkerInfo.type())
//         workerAddr = "0x76e6fd74c625e04879d0aefdd8bbae10a836504ef0d41e6124b0e965dcec8683"
//       } else if (workerInfoAddr == "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_usdc.WorkerInfo.type())
//         workerAddr = "0xe77bf63a6b95ce64a04c156a27c69e3ae4f823773fa9dc441c854d106ae21fda"
//       } else if (workerInfoAddr == "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_cetus.WorkerInfo.type())
//         workerAddr = "0xbeae77b098564b7e62be51527b71300759014085c8ce849f2726397a5fcc411d"
//       } else if (workerInfoAddr == "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_wusdc.WorkerInfo.type())
//         workerAddr = "0xe6cc53c3778e022568b546411bdd7011d3112660dae8a6f118ff2c460522866d"
//       } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") {
//         res = await ctx.coder.decodedType(self, cetus_clmm_worker_wusdc_usdc.WorkerInfo.type())
//         workerAddr = "0xdcb271ff2e80185557d651707aeaaa21f899cb8de9be9c2fb4efef9c9500f6d9"
//       } else {
//         console.error("Not support workerInfoAddr:", workerInfoAddr)
//       } 
      
//       // console.log("ctx.objectId:" , ctx.objectId, ",res : ", JSON.stringify(res))

//       //@ts-ignore
//       const totalLiquidity = Number(res!.position_nft.liquidity)
//       //@ts-ignore
//       const tickLowerIndex = i32BitsToNumber((res!.position_nft.tick_lower_index.bits).toString())
//       //@ts-ignore
//       const tickUpperIndex = i32BitsToNumber((res!.position_nft.tick_upper_index.bits).toString())
//       //@ts-ignore
//       const poolId = res!.position_nft.pool
//       //@ts-ignore
//       const coinTypeA = '0x' + res!.position_nft.coin_type_a.name
//       //@ts-ignore
//       const coinTypeB = '0x' + res!.position_nft.coin_type_b.name
     
//       let coinInfoA = await buildCoinInfo(ctx, coinTypeA)
//       let retry = 0
//       while ((!coinInfoA || coinInfoA.symbol == "unk") && retry < 300) {
//         await sleep(300);
//         coinInfoA = await buildCoinInfo(ctx, coinTypeA)
//         retry++

//         if (retry == 299) {
//           throw new Error("buildCoinInfo coinInfoA")
//         }
//       }

//       const coin_symbol_a = coinInfoA.symbol

//       let coinInfoB = await buildCoinInfo(ctx, coinTypeB)
//       retry = 0
//       while ((!coinInfoB || coinInfoB.symbol == "unk") && retry < 300) {
//         await sleep(300);
//         coinInfoB = await buildCoinInfo(ctx, coinTypeB)
//         retry++

//         if (retry == 299) {
//           throw new Error("buildCoinInfo coinInfoB")
//         }
//       }
//       const coin_symbol_b = coinInfoB.symbol

//       let currentSqrtPrice
//       if (coinTypeA == coinAddrwUSDC && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPricewUsdcSui
//       } else if (coinTypeA == coinAddrUSDT && coinTypeB == coinAddrwUSDC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdtwUsdc
//       } else if (coinTypeA == coinAddrWETH && coinTypeB == coinAddrwUSDC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceWethwUsdc
//       } else if (coinTypeA == coinAddrUSDT && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdtSui
//       } else if (coinTypeA == coinAddrHASUI && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceHasuiSui
//       } else if (coinTypeA == coinAddrwUSDC && coinTypeB == coinAddrCETUS) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPricewUsdcCetus
//       } else if (coinTypeA == coinAddrCETUS && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceCetusSui
//       } else if (coinTypeA == coinAddrNAVX && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceNavxSui
//       } else if (coinTypeA == coinAddrNAVX && coinTypeB == coinAddrCETUS) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceNavxCetus
//       } else if (coinTypeA == coinAddrSCA && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceScaSui
//       } else if (coinTypeA == coinAddrWETH && coinTypeB == coinAddrCETUS) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceWethCetus
//       } else if (coinTypeA == coinAddrUSDT && coinTypeB == coinAddrCETUS) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdtCetus
//       } else if (coinTypeA == coinAddrwUSDC && coinTypeB == coinAddrWBTC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPricewUsdcWbtc
//       } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrwUSDC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceBuckwUsdc
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcSui
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrUSDT) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcUsdt
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrCETUS) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcCetus
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrwUSDC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcwUsdc
//       } else {
//         console.error("Has not price : coin_symbol_a:", coin_symbol_a, ",coin_symbol_b:",coin_symbol_b )
//       }

//       if (!currentSqrtPrice) {
//         console.error("gCurrentSqrtPrice is undefined")
//         return
//       }
      
//       // console.log("liquidity:", liquidity, ",tickLowerIndex:", tickLowerIndex, ",tickUpperIndex:", tickUpperIndex, ",poolId:", poolId, ",coinTypeA:", coinTypeA,
//       //  ",coinTypeB:", coinTypeB, ",currentSqrtPrice:", currentSqrtPrice)

//       const lowerSqrtPriceX64 = tickIndexToSqrtPriceX64(tickLowerIndex)

//       // console.log("lowerSqrtPriceX64:", lowerSqrtPriceX64.toString())

//       const upperSqrtPriceX64 = tickIndexToSqrtPriceX64(tickUpperIndex)
//       // console.log("upperSqrtPriceX64:", upperSqrtPriceX64.toString())


//       const coinAmounts = getCoinAmountFromLiquidity(new BN(totalLiquidity.toString()), new BN(currentSqrtPrice.toString()), lowerSqrtPriceX64, upperSqrtPriceX64, false)

//       const coinAamount = coinAmounts.coinA
//       const coinBamount = coinAmounts.coinB
//       // console.log("coinAamount:", coinAamount.toString(), ", coinBamount:", coinBamount.toString())

//       const priceA = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeA, ctx.timestamp)
//       const priceB = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeB, ctx.timestamp)

//       const lyf_usd_farm_usd = Number(coinAamount) * priceA! / Math.pow(10, coinInfoA.decimal) + Number(coinBamount) * priceB! / Math.pow(10, coinInfoB.decimal)

//       // console.log("lyf_usd_farm_usd:", lyf_usd_farm_usd)

//       const farmPairName = coin_symbol_a + '-' + coin_symbol_b

//       ctx.meter.Gauge("lyf_usd_farm_usd").record(lyf_usd_farm_usd, {farmPairName , project: "mole" })
    
//       const total_share = Number(res!.total_share)
//       console.log("total_share:", total_share)

//       const sharesMap = workerInfoSharesMap.get(workerInfoAddr)!
     
//       for (let [key, value] of sharesMap) {
//         const positionId = key
//         const share = Number(value)

//         const shareRatio = share / total_share
//         console.log("shareRatio:", shareRatio)

//         const lyf_usd_farm_user_usd = lyf_usd_farm_usd * shareRatio

//         // let uid = ""
//         // const positionMap = workerAddrUserMap.get(workerAddr)
//         // if (positionMap) {
//         //   uid = positionMap.get(positionId)!
//         //   console.log("get theuid right:", uid)
//         // } else {
//         //   console.log("get nouid ", ", workerAddr:", workerAddr,  ", positionMap:", positionMap)
//         // }

//         ctx.meter.Gauge("lyf_usd_farm_user_usd").record(lyf_usd_farm_user_usd, {farmPairName, positionId, project: "mole" })
//         console.log("lyf_usd_farm_user_usd:", lyf_usd_farm_user_usd, ", farmPairName:", farmPairName, ", positionId:", positionId )
//       }
    
//     }
//     catch (e) {
//       console.log(`${e.message} error at ${JSON.stringify(self)}`)
//     }
//   }, 480, 1440, undefined, { owned: false })
// }
  



