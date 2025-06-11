import { SuiNetwork, SuiObjectProcessor, SuiWrappedObjectProcessor} from "@sentio/sdk/sui"
import { vault } from './types/sui/0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f.js'
import { pool as clmmPool } from './types/sui/0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb.js'
import { getPriceByType } from "@sentio/sdk/utils"
import { buildCoinInfo, coinAddrAUSD, coinAddrBUCK, coinAddrCETUS, coinAddrFDUSD, coinAddrHASUI, coinAddrNAVX, coinAddrSCA, coinAddrSUI, coinAddrsuiUSDT, coinAddrUSDC, coinAddrUSDT, coinAddrUSDY, coinAddrWBTC, coinAddrWETH, coinAddrwUSDC, getCoinAmountFromLiquidity, getCoinTypeByVaultConfigId, getPoolByToken, getResponseContentByWorkerInfo, i32BitsToNumber, isStableFarmByPoolId, isStableFarmByWorkerInfo, sleep, tickIndexToSqrtPriceX64, vaultAusdConfigId, vaultBuckConfigId, vaultCetusConfigId, vaultFdusdConfigId, vaultHaSuiConfigId, vaultNavxConfigId, vaultScaConfigId, vaultSuiConfigId, vaultsuiUsdtConfigId, vaultUsdcConfigId, vaultUsdtConfigId, vaultUsdyConfigId, vaultWbtcConfigId, vaultWethConfigId, vaultwUsdcConfigId} from './utils/mole_utils.js'
import * as constant from './utils/constant.js'
import { ANY_TYPE } from '@sentio/sdk/move'
import { string$ } from "@sentio/sdk/sui/builtin/0x1";
import BN from 'bn.js'
import axiosInst from './utils/moleAxios.js'

// sui_incentive.bind({ 
//     address: '0xc4dc6948a7d0a58f32fadd44e45efb201f44383bfab1cb6c48b9c186a92cc762',
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint: 147903765n
//   })
//     .onEventHarvestEvent(
//       async (event, ctx) => {
//         const user = event.data_decoded.user
//         const pid = String(event.data_decoded.pid)
//         const amount = Number(event.data_decoded.amount) / Math.pow(10, 9)
//         const action_type = String(event.data_decoded.action_type)
//         const poolInfo = getPoolInfoByPoolId(pid)

//         ctx.meter.Gauge("harvest_pid").record(amount, { action_type, pid, pool_address: poolInfo![0], underlying_token_address: poolInfo![1], project: "mole-fee" })

  
//         ctx.eventLogger.emit("HarvestEvent", {
//           distinctId: user,
//           pid: pid,
//           pool_address: poolInfo![0],
//           underlying_token_address: poolInfo![1],
//           amount: amount,
//           action_type: action_type,
//           project: "mole-fee"
//         })
//       },
//     )


SuiWrappedObjectProcessor.bind({
  //object owner address of vault_usdt_vault_info/vault_sui_vault_info etc.
  objectId: "0x0dcd6ff3155967823494c7d4dd3bc952e551102879562ff7c75019b290281583",
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 147903765n
})
  .onTimeInterval(async (dynamicFieldObjects, ctx) => {
    try {

      if (ctx.checkpoint >= 151025370 ) {
        return
      }

      const objectType = vault.VaultInfo.type(ANY_TYPE)

      let fields = await ctx.coder.getDynamicFields(dynamicFieldObjects, string$.String.type(),  objectType)
      let retry = 0
      while (!fields && retry < 300) {
        await sleep(300);
        fields = await ctx.coder.getDynamicFields(dynamicFieldObjects, string$.String.type(),  objectType)
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
        ctx.meter.Gauge("savings_debt_amount").record(savings_debt, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole-fee" })

        //@ts-ignore
        ctx.meter.Gauge("savings_debt_usd").record(savings_debt_usd, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole-fee" })

        // savings_free_coin = deposit - debt
        //@ts-ignore
        const savings_free_coin = Number(field.value.coin) / Math.pow(10, coinInfo.decimal)
        const savings_free_coin_usd = savings_free_coin * price! 

        ctx.meter.Gauge("savings_free_coin_amount").record(savings_free_coin, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole-fee" })
        ctx.meter.Gauge("savings_free_coin_usd").record(savings_free_coin_usd, { coin_symbol, pool_address: pool, underlying_token_address: coinType, project: "mole-fee" })

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
        } else {
          a = 3
          b = -2.74
        }
        const savings_borrowing_interest =  a * use_rate + b
        ctx.meter.Gauge("savings_borrowing_interest").record(savings_borrowing_interest, { coin_symbol, coinType, project: "mole-fee" })

        // Lending interest = Borrowing Interest * Utilization * (1 - Borrow Protocol Fee)
        const savings_lending_interest_apr = savings_borrowing_interest * use_rate * (1 - 0.19)
        // apr to apy
        const savings_lending_interest_apy =  Math.pow(1 + savings_lending_interest_apr / 365, 365) - 1

        ctx.meter.Gauge("savings_lending_interest").record(savings_lending_interest_apy, { coin_symbol, coinType, project: "mole-fee" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 1440, 60, undefined, { owned: true })

  
SuiObjectProcessor.bind({
  objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 147903765n
})
.onTimeInterval(async (self, _, ctx) => {
  try {

    if (ctx.checkpoint >= 151025370 ) {
      return
    }
    
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

      ctx.meter.Gauge("lyf_apr").record(farmApr, { farmName, project: "mole-fee" })
    }
  }
catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 1440, 60, undefined, { owned: false })



  SuiObjectProcessor.bind({
    objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 147903765n
  })
  .onTimeInterval(async (self, _, ctx) => {
    try {
    
      if (ctx.checkpoint >= 151025370 ) {
        return
      }
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
  
        ctx.meter.Gauge("vaults_staking_apy").record(apy, { coin_symbol, project: "mole-fee" })
      }
    }
  catch (e) {
        console.log(`${e.message} error at ${JSON.stringify(self)}`)
      }
    }, 1440, 60, undefined, { owned: false })
  
  


// //@ts-ignore
// let gCurrentSqrtPricewUsdcSui
// //@ts-ignore
// let gCurrentSqrtPriceUsdtwUsdc
// //@ts-ignore
// let gCurrentSqrtPriceWethwUsdc
// //@ts-ignore
// let gCurrentSqrtPriceUsdtSui
// //@ts-ignore
// let gCurrentSqrtPriceHasuiSui
// //@ts-ignore
// let gCurrentSqrtPricewUsdcCetus
// //@ts-ignore
// let gCurrentSqrtPriceCetusSui
// //@ts-ignore
// let gCurrentSqrtPriceNavxSui
// //@ts-ignore
// let gCurrentSqrtPriceNavxCetus
// //@ts-ignore
// let gCurrentSqrtPriceScaSui
// //@ts-ignore
// let gCurrentSqrtPriceWethCetus
// //@ts-ignore
// let gCurrentSqrtPriceUsdtCetus
// //@ts-ignore
// let gCurrentSqrtPricewUsdcWbtc
// //@ts-ignore
// let gCurrentSqrtPriceBuckwUsdc
// //@ts-ignore
// let gCurrentSqrtPriceUsdcSui
// //@ts-ignore
// let gCurrentSqrtPriceUsdcUsdt
// //@ts-ignore
// let gCurrentSqrtPriceUsdcCetus
// //@ts-ignore
// let gCurrentSqrtPriceUsdcwUsdc
// //@ts-ignore
// let gCurrentSqrtPriceUsdcBuck
// //@ts-ignore
// let gCurrentSqrtPriceBuckUsdc
// //@ts-ignore
// let gCurrentSqrtPriceBuckSui
// //@ts-ignore
// let gCurrentSqrtPriceSuiBuck
// //@ts-ignore
// let gCurrentSqrtPriceUsdcwUsdcNew
// //@ts-ignore
// let gCurrentSqrtPriceBuckwUsdcNew
// //@ts-ignore
// let gCurrentSqrtPriceUsdcsuiUsdt
// //@ts-ignore
// let gCurrentSqrtPriceFdusdUsdc
// //@ts-ignore
// let gCurrentSqrtPriceUsdcUsdy
// //@ts-ignore
// let gCurrentSqrtPriceUsdcsuiUsdt2
// //@ts-ignore
// let gCurrentSqrtPriceUsdcAusd


// for (let i = 0; i < constant.POOLS_MOLE_LIST.length; i++) {
//   SuiObjectProcessor.bind({
//     objectId: constant.POOLS_MOLE_LIST[i],
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint: 147903765n
//   })
//   .onTimeInterval(async (self, _, ctx) => {
//     try {

//     if (ctx.checkpoint >= 151025370 ) {
//       return
//     }

//       let res = await ctx.coder.decodeType(self, clmmPool.Pool.type())
//       let retry = 0
//       while (!res && retry < 300) {
//         await sleep(300);
//         res = await ctx.coder.decodeType(self, clmmPool.Pool.type())
//         retry++

//         if (retry == 299) {
//           throw new Error("decodeType")
//         }
//       }
      
//       //@ts-ignore
//       const currentSqrtPrice = Number(res!.current_sqrt_price)

//       if ('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630' == ctx.objectId) {
//         gCurrentSqrtPricewUsdcSui = currentSqrtPrice
//       } else if ('0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20' == ctx.objectId) {
//         gCurrentSqrtPriceUsdtwUsdc = currentSqrtPrice
//       } else if ('0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df' == ctx.objectId) {
//         gCurrentSqrtPriceWethwUsdc = currentSqrtPrice
//       } else if ('0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3' == ctx.objectId) {
//         gCurrentSqrtPriceUsdtSui = currentSqrtPrice
//       } else if ('0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc' == ctx.objectId) {
//         gCurrentSqrtPriceHasuiSui = currentSqrtPrice
//       } else if ('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8' == ctx.objectId) {
//         gCurrentSqrtPricewUsdcCetus = currentSqrtPrice
//       } else if ('0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded' == ctx.objectId) {
//         gCurrentSqrtPriceCetusSui = currentSqrtPrice
//       } else if ('0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703' == ctx.objectId) {
//         gCurrentSqrtPriceNavxSui = currentSqrtPrice
//       } else if ('0x3ec8401520022aac67935188eb1f82c13cbbc949ab04692e5b62445d89b61c9f' == ctx.objectId) {
//         gCurrentSqrtPriceNavxCetus = currentSqrtPrice
//       } else if ('0xaa72bd551b25715b8f9d72f226fa02526bdf2e085a86faec7184230c5209bb6e' == ctx.objectId) {
//         gCurrentSqrtPriceScaSui = currentSqrtPrice
//       } else if ('0x81f6bdb7f443b2a55de8554d2d694b7666069a481526a1ff0c91775265ac0fc1' == ctx.objectId) {
//         gCurrentSqrtPriceWethCetus = currentSqrtPrice
//       } else if ('0x91ba432e39602d12c2f3d95c7c7f890e1f1c7c8e7d0b9c6d6035a33d1f93e1cb' == ctx.objectId) {
//         gCurrentSqrtPriceUsdtCetus = currentSqrtPrice
//       } else if ('0xaa57c66ba6ee8f2219376659f727f2b13d49ead66435aa99f57bb008a64a8042' == ctx.objectId) {
//         gCurrentSqrtPricewUsdcWbtc = currentSqrtPrice
//       } else if ('0x81fe26939ed676dd766358a60445341a06cea407ca6f3671ef30f162c84126d5' == ctx.objectId) {
//         gCurrentSqrtPriceBuckwUsdc = currentSqrtPrice
//       } else if ('0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcSui = currentSqrtPrice
//       } else if ('0x6bd72983b0b5a77774af8c77567bb593b418ae3cd750a5926814fcd236409aaa' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcUsdt = currentSqrtPrice
//       } else if ('0x3b13ac70030d587624e407bbe791160b459c48f1049e04269eb8ee731f5442b4' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcCetus = currentSqrtPrice
//       } else if ('0xc29be5c19c35be7af76c89e85e6deb076789d70019b9f8d22a80e77e720bdec0' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcwUsdc = currentSqrtPrice
//       } else if ('0x4c50ba9d1e60d229800293a4222851c9c3f797aa5ba8a8d32cc67ec7e79fec60' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcBuck = currentSqrtPrice
//       } else if ('0x59cf0d333464ad29443d92bfd2ddfd1f794c5830141a5ee4a815d1ef3395bf6c' == ctx.objectId) {
//         gCurrentSqrtPriceBuckSui = currentSqrtPrice
//       } else if ('0x1efc96c99c9d91ac0f54f0ca78d2d9a6ba11377d29354c0a192c86f0495ddec7' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcwUsdcNew = currentSqrtPrice
//       } else if ('0xd4573bdd25c629127d54c5671d72a0754ef47767e6c01758d6dc651f57951e7d' == ctx.objectId) {
//         gCurrentSqrtPriceBuckwUsdcNew = currentSqrtPrice
//       } else if ('0x7df346f8ef98ad20869ff6d2fc7c43c00403a524987509091b39ce61dde00957' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcsuiUsdt = currentSqrtPrice
//       } else if ('0x43d4c9adc1d669ef85d557cf1d430f311dc4eb043a8e7b78e972c1f96ec2cd60' == ctx.objectId) {
//         gCurrentSqrtPriceFdusdUsdc = currentSqrtPrice
//       } else if ('0xdcd762ad374686fa890fc4f3b9bbfe2a244e713d7bffbfbd1b9221cb290da2ed' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcUsdy = currentSqrtPrice
//       } else if ('0xb8a67c149fd1bc7f9aca1541c61e51ba13bdded64c273c278e50850ae3bff073' == ctx.objectId) {  
//         gCurrentSqrtPriceUsdcsuiUsdt2 = currentSqrtPrice
//       } else if ('0x0fea99ed9c65068638963a81587c3b8cafb71dc38c545319f008f7e9feb2b5f8' == ctx.objectId) {
//         gCurrentSqrtPriceUsdcAusd = currentSqrtPrice
//       } else {
//         console.error("Has not object : ", ctx.objectId)
//       }
     
//       console.log("currentSqrtPrice :", currentSqrtPrice)
//     }
//   catch (e) {
//         console.log(`${e.message} error at ${JSON.stringify(self)}`)
//       }
//     }, 1440, 60, undefined, { owned: false })
// }



// // Worker info    
// for (let i = 0; i < constant.MOLE_WORKER_INFO_LIST.length; i++) {
//   const workerInfoAddr = constant.MOLE_WORKER_INFO_LIST[i]

//   SuiObjectProcessor.bind({
//     objectId: workerInfoAddr,
//     network: SuiNetwork.MAIN_NET,
//     startCheckpoint: 147903765n
//   })
//   .onTimeInterval(async (self, _, ctx) => {
//     // console.log("ctx.objectId:" , ctx.objectId, ", slef:",JSON.stringify(self))
    
//     try {

//       if (ctx.checkpoint >= 151025370 ) {
//         return
//       }

//       let res = await getResponseContentByWorkerInfo(workerInfoAddr, ctx, self)
            
//       // console.log("ctx.objectId:" , ctx.objectId, ",res : ", JSON.stringify(res))
      
//       let liquidity, tickLowerIndex, tickUpperIndex, poolId, coinTypeA, coinTypeB
//       if (isStableFarmByWorkerInfo(workerInfoAddr)) {
//         //@ts-ignore
//         liquidity = Number(res!.stable_farming_position_nft.clmm_postion.liquidity)
//         //@ts-ignore
//         tickLowerIndex = i32BitsToNumber((res!.stable_farming_position_nft.clmm_postion.tick_lower_index.bits).toString())
//         //@ts-ignore
//         tickUpperIndex = i32BitsToNumber((res!.stable_farming_position_nft.clmm_postion.tick_upper_index.bits).toString())
//         //@ts-ignore
//         poolId = res!.stable_farming_position_nft.clmm_postion.pool
//         //@ts-ignore
//         coinTypeA = '0x' + res!.stable_farming_position_nft.clmm_postion.coin_type_a.name
//         //@ts-ignore
//         coinTypeB = '0x' + res!.stable_farming_position_nft.clmm_postion.coin_type_b.name

//       } else {
//         //@ts-ignore
//         liquidity = Number(res!.position_nft.liquidity)
//         //@ts-ignore
//         tickLowerIndex = i32BitsToNumber((res!.position_nft.tick_lower_index.bits).toString())
//         //@ts-ignore
//         tickUpperIndex = i32BitsToNumber((res!.position_nft.tick_upper_index.bits).toString())
//         //@ts-ignore
//         poolId = res!.position_nft.pool
//         //@ts-ignore
//         coinTypeA = '0x' + res!.position_nft.coin_type_a.name
//         //@ts-ignore
//         coinTypeB = '0x' + res!.position_nft.coin_type_b.name
//       }

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

//       let coin_symbol_a = coinInfoA.symbol

//       if (coinTypeA.toLowerCase() == coinAddrwUSDC.toLowerCase()) {
//         coin_symbol_a = 'wUSDC'
//       } else if (coinTypeA.toLowerCase() == coinAddrsuiUSDT.toLowerCase()) {
//         coin_symbol_a = 'suiUSDT'
//       }

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
//       let coin_symbol_b = coinInfoB.symbol

//       if (coinTypeB.toLowerCase() == coinAddrwUSDC.toLowerCase()) {
//         coin_symbol_b = 'wUSDC'
//       } else if (coinTypeB.toLowerCase() == coinAddrsuiUSDT.toLowerCase()) {
//         coin_symbol_b = 'suiUSDT'
//       }

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
//       } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrwUSDC 
//         && ( workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce" 
//           || workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659"
//       )) {
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
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrwUSDC 
//         && ( workerInfoAddr == "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e" 
//             || workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242"
//       )) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcwUsdc
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrBUCK) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcBuck
//       } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrUSDC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceBuckUsdc
//       } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrSUI) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceBuckSui
//       } else if (coinTypeA == coinAddrSUI && coinTypeB == coinAddrBUCK) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceSuiBuck
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrwUSDC 
//         && ( workerInfoAddr == "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a" 
//             || workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76"
//       )) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcwUsdcNew
//         coin_symbol_b = coin_symbol_b + '-new'
//       } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrwUSDC 
//         && ( workerInfoAddr == "0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2" 
//           || workerInfoAddr == "0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1"
//       )) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceBuckwUsdcNew
//         coin_symbol_b = coin_symbol_b + '-new'
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrsuiUSDT) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcsuiUsdt
//       } else if (coinTypeA == coinAddrFDUSD && coinTypeB == coinAddrUSDC) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceFdusdUsdc
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrUSDY) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcUsdy
//       } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrAUSD) {
//         //@ts-ignore
//         currentSqrtPrice = gCurrentSqrtPriceUsdcAusd
//       } else {
//         console.error("Has not price : coin_symbol_a:", coin_symbol_a, ",coin_symbol_b:",coin_symbol_b )
//       }

//       if (!currentSqrtPrice) {
//         console.error("currentSqrtPrice is undefined, coinTypeA:", coinTypeA, ", coinTypeB:", coinTypeB)
//         return
//       }
       
//       // console.log("liquidity:", liquidity, ",tickLowerIndex:", tickLowerIndex, ",tickUpperIndex:", tickUpperIndex, ",poolId:", poolId, ",coinTypeA:", coinTypeA,
//       //  ",coinTypeB:", coinTypeB, ",currentSqrtPrice:", currentSqrtPrice)

//       const lowerSqrtPriceX64 = tickIndexToSqrtPriceX64(tickLowerIndex)

//       // console.log("lowerSqrtPriceX64:", lowerSqrtPriceX64.toString())

//       const upperSqrtPriceX64 = tickIndexToSqrtPriceX64(tickUpperIndex)
//       // console.log("upperSqrtPriceX64:", upperSqrtPriceX64.toString())


//       const coinAmounts = getCoinAmountFromLiquidity(new BN(liquidity.toString()), new BN(currentSqrtPrice.toString()), lowerSqrtPriceX64, upperSqrtPriceX64, false)

//       const coinAamount = coinAmounts.coinA
//       const coinBamount = coinAmounts.coinB
//       // console.log("coinAamount:", coinAamount.toString(), ", coinBamount:", coinBamount.toString())

//       const priceA = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeA, ctx.timestamp)
//       const priceB = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeB, ctx.timestamp)

//       const lyf_usd_farm_usd = Number(coinAamount) * priceA! / Math.pow(10, coinInfoA.decimal) + Number(coinBamount) * priceB! / Math.pow(10, coinInfoB.decimal)

//       const farmPairName = coin_symbol_a + '-' + coin_symbol_b

//       ctx.meter.Gauge("lyf_usd_farm_usd").record(lyf_usd_farm_usd, {farmPairName , project: "mole-fee" })

//       console.log("lyf_usd_farm_usd:", lyf_usd_farm_usd, ", farmPairName: ", farmPairName)
//     }
//     catch (e) {
//       console.log(`${e.message} error at ${JSON.stringify(self)}`)
//     }
//   }, 1440, 60, undefined, { owned: false })
// }




