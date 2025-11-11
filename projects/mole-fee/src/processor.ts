import { SuiNetwork, SuiObjectProcessor, SuiWrappedObjectProcessor} from "@sentio/sdk/sui"
import { vault } from './types/sui/0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f.js'
import { pool as clmmPool } from './types/sui/0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb.js'
import { pool as bluefinPool } from './types/sui/0x3492c874c1e3b3e2984e8c41b589e642d4d0a5d6459e5a9cfc2d52fd7c89c267.js'
import { getPriceByType } from "@sentio/sdk/utils"
import { buildCoinInfo, coinAddrAUSD, coinAddrBUCK, coinAddrCETUS, coinAddrFDUSD, coinAddrHASUI, coinAddrNAVX, coinAddrSCA, coinAddrSTSUI, coinAddrSUI, coinAddrsuiUSDT, coinAddrUSDC, coinAddrUSDT, coinAddrUSDY, coinAddrWBTC, coinAddrWETH, coinAddrwUSDC, getCoinAmountFromLiquidity, getCoinTypeByVaultConfigId, getPoolByToken, getResponseContentByWorkerInfo, i32BitsToNumber, isReverseWorkerInfo, sleep, tickIndexToSqrtPriceX64, vaultAusdConfigId, vaultBuckConfigId, vaultCetusConfigId, vaultFdusdConfigId, vaultHaSuiConfigId, vaultNavxConfigId, vaultScaConfigId, vaultStSuiConfigId, vaultSuiConfigId, vaultsuiUsdtConfigId, vaultUsdcConfigId, vaultUsdtConfigId, vaultUsdyConfigId, vaultWbtcConfigId, vaultWethConfigId, vaultwUsdcConfigId} from './utils/mole_utils.js'
import * as constant from './utils/constant.js'
import { ANY_TYPE } from '@sentio/sdk/move'
import { string$ } from "@sentio/sdk/sui/builtin/0x1";
import BN from 'bn.js'
import axiosInst from './utils/moleAxios.js'

SuiWrappedObjectProcessor.bind({
  //object owner address of vault_usdt_vault_info/vault_sui_vault_info etc.
  objectId: "0x0dcd6ff3155967823494c7d4dd3bc952e551102879562ff7c75019b290281583",
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 210597929n
})
  .onTimeInterval(async (dynamicFieldObjects, ctx) => {
    try {

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

        if (coin_symbol == 'SUI' || coin_symbol == 'haSUI' || coin_symbol == 'stSUI') {
          if (use_rate < 0.6) {
            a = 0.055
            b = 0
          } else if (use_rate >= 0.6 && use_rate < 1) {
            a = 0 
            b = 0.033
          }
        } else {
          if (use_rate < 0.6) {
            a = 0.1666666 
            b = 0
          } else if (use_rate >= 0.6 && use_rate < 1) {
            a = 0 
            b = 0.10
          }
        }
        
        const savings_borrowing_interest =  a * use_rate + b
        ctx.meter.Gauge("savings_borrowing_interest").record(savings_borrowing_interest, { coin_symbol, coinType, project: "mole-fee" })

        // Lending interest = Borrowing Interest * Utilization * (1 - Borrow Protocol Fee)
        const savings_lending_interest_apr = savings_borrowing_interest * use_rate * (1 - 0.19)
        // apr to apy
        const savings_lending_interest_apy =  Math.pow(1 + savings_lending_interest_apr / 365, 365) - 1

        ctx.meter.Gauge("savings_lending_interest").record(savings_lending_interest_apr, { coin_symbol, coinType, project: "mole-fee" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 480, 1440, undefined, { owned: true })

  
SuiObjectProcessor.bind({
  objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 210597929n
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

      ctx.meter.Gauge("lyf_apr").record(farmApr, { farmName, project: "mole-fee" })
    }
  }
catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 480, 1440, undefined, { owned: false })



  SuiObjectProcessor.bind({
    objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 210597929n
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
  
        ctx.meter.Gauge("vaults_staking_apy").record(apy, { coin_symbol, project: "mole-fee" })
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
//@ts-ignore
let gCurrentSqrtPriceUsdcUsdy
//@ts-ignore
let gCurrentSqrtPriceUsdcsuiUsdt2
//@ts-ignore
let gCurrentSqrtPriceUsdcAusd
//@ts-ignore
let gCurrentSqrtPricesuiUsdtUsdcBluefin
//@ts-ignore
let gCurrentSqrtPriceStSuiSuiBluefin
//@ts-ignore
let gCurrentSqrtPriceBuckUsdcBluefin

constant.POOLS_MOLE_LIST.forEach((valueDexType, keyPoolId) => {
  SuiObjectProcessor.bind({
    objectId: keyPoolId,
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 210597929n
  })
  .onTimeInterval(async (self, _, ctx) => {
    try {
      let res 
      if (valueDexType == 0) { // Cetus
        res = await ctx.coder.decodeType(self, clmmPool.Pool.type())
      } else if (valueDexType == 1) { // Bluefin
        res = await ctx.coder.decodeType(self, bluefinPool.Pool.type())
      } else {
        console.error("Wrong dex type:", valueDexType)
      }

      let retry = 0
      while (!res && retry < 300) {
        await sleep(300);
        if (valueDexType == 0) { // Cetus
          res = await ctx.coder.decodeType(self, clmmPool.Pool.type())
        } else if (valueDexType == 1) { // Bluefin
          res = await ctx.coder.decodeType(self, bluefinPool.Pool.type())
        } else {
          console.error("Wrong dex type:", valueDexType)
        }
        retry++

        if (retry == 299) {
          throw new Error("decodeType")
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
      } else if ('0xdcd762ad374686fa890fc4f3b9bbfe2a244e713d7bffbfbd1b9221cb290da2ed' == ctx.objectId) {
        gCurrentSqrtPriceUsdcUsdy = currentSqrtPrice
      } else if ('0xb8a67c149fd1bc7f9aca1541c61e51ba13bdded64c273c278e50850ae3bff073' == ctx.objectId) {  
        gCurrentSqrtPriceUsdcsuiUsdt2 = currentSqrtPrice
      } else if ('0x0fea99ed9c65068638963a81587c3b8cafb71dc38c545319f008f7e9feb2b5f8' == ctx.objectId) {
        gCurrentSqrtPriceUsdcAusd = currentSqrtPrice
      } else if ('0x62af128423465822e5a0979ccad2b0b5ee50a58c6a2c8ea3dd7fda1cda3cfbe7' == ctx.objectId) {
        gCurrentSqrtPricesuiUsdtUsdcBluefin = currentSqrtPrice
      } else if ('0x4746414e445cebdc19666b6e4de9b79a46ca7bcaa894bf10ec230e649376356e' == ctx.objectId) {
        gCurrentSqrtPriceStSuiSuiBluefin = currentSqrtPrice
      } else if ('0x9f70edecd4af60ca9ce5544530cc5596a7d3a93d6a8c5207241f206e73384797' == ctx.objectId) {
        gCurrentSqrtPriceBuckUsdcBluefin = currentSqrtPrice
      } else {
        console.error("Has not object : ", ctx.objectId)
      }
     
      console.log("currentSqrtPrice :", currentSqrtPrice)
    }
  catch (e) {
        console.log(`${e.message} error at ${JSON.stringify(self)}`)
      }
    }, 480, 1440, undefined, { owned: false }) 
}); 



// Worker info    
constant.MOLE_WORKER_INFO_LIST.forEach((valueWorkerType, keyWorkerInfoId) => {
  const workerInfoAddr = keyWorkerInfoId

  SuiObjectProcessor.bind({
    objectId: workerInfoAddr,
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 210597929n
  })
  .onTimeInterval(async (self, _, ctx) => {
    // console.log("ctx.objectId:" , ctx.objectId, ", slef:",JSON.stringify(self))
    
    try {
      let res = await getResponseContentByWorkerInfo(workerInfoAddr, ctx, self)
            
      // console.log("ctx.objectId:" , ctx.objectId, ",res : ", JSON.stringify(res))
      
      let liquidity, tickLowerIndex, tickUpperIndex, poolId, coinTypeA, coinTypeB
      if (valueWorkerType == 1) { // cetus stable farming
        //@ts-ignore
        liquidity = Number(res!.stable_farming_position_nft.clmm_postion.liquidity)
        //@ts-ignore
        tickLowerIndex = i32BitsToNumber((res!.stable_farming_position_nft.clmm_postion.tick_lower_index.bits).toString())
        //@ts-ignore
        tickUpperIndex = i32BitsToNumber((res!.stable_farming_position_nft.clmm_postion.tick_upper_index.bits).toString())
        //@ts-ignore
        poolId = res!.stable_farming_position_nft.clmm_postion.pool
        //@ts-ignore
        coinTypeA = '0x' + res!.stable_farming_position_nft.clmm_postion.coin_type_a.name
        //@ts-ignore
        coinTypeB = '0x' + res!.stable_farming_position_nft.clmm_postion.coin_type_b.name

      } else if (valueWorkerType == 0) { // cetus clmm
        //@ts-ignore
        liquidity = Number(res!.position_nft.liquidity)
        //@ts-ignore
        tickLowerIndex = i32BitsToNumber((res!.position_nft.tick_lower_index.bits).toString())
        //@ts-ignore
        tickUpperIndex = i32BitsToNumber((res!.position_nft.tick_upper_index.bits).toString())
        //@ts-ignore
        poolId = res!.position_nft.pool
        //@ts-ignore
        coinTypeA = '0x' + res!.position_nft.coin_type_a.name
        //@ts-ignore
        coinTypeB = '0x' + res!.position_nft.coin_type_b.name
      } else if (valueWorkerType == 2) { // bluefin
        //@ts-ignore
        liquidity = Number(res!.position_nft.liquidity)
        //@ts-ignore
        tickLowerIndex = i32BitsToNumber((res!.position_nft.lower_tick.bits).toString())
        //@ts-ignore
        tickUpperIndex = i32BitsToNumber((res!.position_nft.upper_tick.bits).toString())
        //@ts-ignore
        poolId = res!.position_nft.pool_id
        //@ts-ignore
        coinTypeA = '0x' + res!.position_nft.coin_type_a
        //@ts-ignore
        coinTypeB = '0x' + res!.position_nft.coin_type_b
      } else {
        console.error("wrong workerinfo type")
      }

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
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrBUCK
        && workerInfoAddr == "0x3001c0d95f0498b8e92fe95878b25e1c2e85ff213f3ff5b1ef088390ed185fc1"
      ) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcBuck
      } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrUSDC
        && workerInfoAddr == "0x0ffcc188b67223e6e883bc8e997e051af38657699d7ba745e43e8489b6104cdc"
      ) {
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
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrsuiUSDT
        && (workerInfoAddr == "0x85ad5f6b8dd39b2a9dbb05161a563db52f91d724390273a739199dbfa640405b" 
         || workerInfoAddr == "0x888821cfa0e8d3e4de4602d91b17ea2e156e534a233424611b8f27e5d4bac439"
      )) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcsuiUsdt
      } else if (coinTypeA == coinAddrFDUSD && coinTypeB == coinAddrUSDC) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceFdusdUsdc
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrUSDY) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcUsdy
      } else if (coinTypeA == coinAddrUSDC && coinTypeB == coinAddrAUSD) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcAusd
      } else if (coinTypeA == coinAddrsuiUSDT && coinTypeB == coinAddrUSDC
        && (workerInfoAddr == "0x12552c511257169cba63a0b2159e812d5fe578781ec051435063b346b5c05f03" 
         || workerInfoAddr == "0x235e04373fb6799990ae1c148257fcd8ce68e99fd67a70d5250e398615a7051c"
      )) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPricesuiUsdtUsdcBluefin
      } else if (coinTypeA == coinAddrSTSUI && coinTypeB == coinAddrSUI) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceStSuiSuiBluefin
      } else if (coinTypeA == coinAddrBUCK && coinTypeB == coinAddrUSDC
        && workerInfoAddr == "0x218c06ec2ae747e889ca5720e603272f49fb3724a5777b0c3a8e7ea6dd2e5f9e" 
      ) {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceBuckUsdcBluefin
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

      let farmPairName = coin_symbol_a + '-' + coin_symbol_b
      if (valueWorkerType == 2) {
        farmPairName += '-Bluefin'
      }

      ctx.meter.Gauge("lyf_usd_farm_usd").record(lyf_usd_farm_usd, {farmPairName , project: "mole-fee" })

      console.log("lyf_usd_farm_usd:", lyf_usd_farm_usd, ", farmPairName: ", farmPairName)
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 480, 1440, undefined, { owned: false })
}); 


// caculate savings fee
SuiWrappedObjectProcessor.bind({
  //object owner address of vault_usdt_vault_info/vault_sui_vault_info etc.
  objectId: "0x0dcd6ff3155967823494c7d4dd3bc952e551102879562ff7c75019b290281583",
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 210597929n
})
  .onTimeInterval(async (dynamicFieldObjects, ctx) => {
    try {

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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 122460676 && ctx.checkpoint < 152567410) {
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
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else if (configAddr == vaultStSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 152567410 && ctx.checkpoint < 203655861) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0.09845773 + 0 + 0.00000013 + 0.00002272 + 0.00000006 + 0 + 0.00187223 + 0.12178293 + 0.00019822 + 0.00004683
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0 + 0.100466176 + 0.418409173 + 0.116969597 + 0.0998792
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209 + 0.010165 + 0.148551 + 0.25037 + 0.723458
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039 + 34.108969 + 172.970752 + 3805.021933 + 490.584026 + 45.91258
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0 + 0 + 81.334258105 + 311.820012603 + 0.459281852 + 0.052346867
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695 + 175.976913576 + 2157.302282819 + 1605.159619797 + 0.816215773 + 63.04868679
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0 + 0 + 0.375408055 + 0.436247858 + 0.001678484
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 25.646615746 + 28.350234249 + 0.071171165 + 0.216101738
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.00000187 + 0.00014818 + 0.00000241
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.032972178 + 4005.622594355 + 2757.828511355 + 1374.44140741
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 777.934996 + 9028.24653 + 16291.616984
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 39.383106 + 276.46863
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 2.179531 + 60.666514
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.131627
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.000086
          } else if (configAddr == vaultStSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 203655861) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0.09845773 + 0 + 0.00000013 + 0.00002272 + 0.00000006 + 0 + 0.00187223 + 0.12178293 + 0.00019822 + 0.00004683
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0 + 0.100466176 + 0.418409173 + 0.116969597 + 0.0998792 + 0.000045449
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209 + 0.010165 + 0.148551 + 0.25037 + 0.723458
          } else if (configAddr == vaultwUsdcConfigId) {
            accumulateFee = 49.80559 + 211.449818 + 157.650286 + 31.421483 + 81.100837 + 43.951883 + 34.270039 + 34.108969 + 172.970752 + 3805.021933 + 490.584026 + 45.91258
          } else if (configAddr == vaultCetusConfigId) {
            accumulateFee = 0 + 0 + 0 + 1.122338056 + 0.264680249 + 0 + 0 + 0 + 81.334258105 + 311.820012603 + 0.459281852 + 0.052346867
          } else if (configAddr == vaultSuiConfigId) {
            accumulateFee = 7.915105448 + 63.85454832 + 246.552150586 + 33.885724004 + 116.901576637 + 65.050304323 + 62.596474695 + 175.976913576 + 2157.302282819 + 1605.159619797 + 0.816215773 + 63.04868679 + 758.878348188
          } else if (configAddr == vaultNavxConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.000429911 + 0 + 0 + 0 + 0.375408055 + 0.436247858 + 0.001678484
          } else if (configAddr == vaultScaConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 25.646615746 + 28.350234249 + 0.071171165 + 0.216101738
          } else if (configAddr == vaultWbtcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.00000187 + 0.00014818 + 0.00000241
          } else if (configAddr == vaultBuckConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.032972178 + 4005.622594355 + 2757.828511355 + 1374.44140741 + 2491.672551595
          } else if (configAddr == vaultUsdcConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 777.934996 + 9028.24653 + 16291.616984 + 24941.808645
          } else if (configAddr == vaultsuiUsdtConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 39.383106 + 276.46863 + 0.000067
          } else if (configAddr == vaultFdusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 2.179531 + 60.666514
          } else if (configAddr == vaultUsdyConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.131627
          } else if (configAddr == vaultAusdConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0.000086
          } else if (configAddr == vaultStSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0
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
        ctx.meter.Gauge("savings_fee").record(savingsFee, { coin_symbol, coinType, project: "mole-fee" })

        //@ts-ignore
        ctx.meter.Gauge("savings_fee_usd").record(savingsFeeUsd, { coin_symbol, coinType, project: "mole-fee" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 480, 1440, undefined, { owned: true })



// Calculate Farming Fee    
constant.MOLE_WORKER_INFO_LIST.forEach((valueWorkerType, keyWorkerInfoId) => {
  const workerInfoAddr = keyWorkerInfoId

  if (
    // cetus_worker_navx_sui_worker_info: 
    workerInfoAddr == "0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1"
    // cetus_worker_sui_navx_worker_info: 
    || workerInfoAddr == "0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e"
    // cetus_worker_navx_cetus_worker_info: 
    || workerInfoAddr == "0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d"
    // cetus_worker_cetus_navx_worker_info:
    || workerInfoAddr == "0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6"
    // cetus_worker_wusdc_wbtc_worker_info: 
    || workerInfoAddr == "0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a"
    // cetus_worker_wbtc_wusdc_worker_info: 
    || workerInfoAddr == "0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac"
    // cetus_worker_buck_wusdc_worker_info: 
    || workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce"
    // cetus_worker_wusdc_buck_worker_info: 
    || workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659"
    // cetus_worker_buck_wusdc_worker_info:
    || workerInfoAddr == "0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2"
    // cetus_worker_wusdc_buck_worker_info: 
    || workerInfoAddr ==  "0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1"
    // cetus_worker_sui_cetus_worker_info:
    || workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d"
    // cetus_worker_cetus_sui_worker_info:
    || workerInfoAddr == "0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb"
  ) {
    return;
  }

  SuiObjectProcessor.bind({
    objectId: workerInfoAddr,
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 210597929n
  })
  .onTimeInterval(async (self, _, ctx) => {
    // console.log("ctx.objectId:" , ctx.objectId, ", slef:",JSON.stringify(self))
    
    try {
      let res = await getResponseContentByWorkerInfo(workerInfoAddr, ctx, self)
            
      console.log("ctx.objectId:" , ctx.objectId, ",res : ", JSON.stringify(res))
      
      let baseBounty, farmingBounty, coinTypeA, coinTypeB, coinBaseDecimal, coinFarmingDecimal

      //@ts-ignore
      baseBounty = Number(res!.tiny_coin_base_bounty)
      //@ts-ignore
      farmingBounty = Number(res!.tiny_coin_farming_bounty)
      //@ts-ignore
      coinBaseDecimal = Number(res!.coin_base_decimals)
      //@ts-ignore
      coinFarmingDecimal = Number(res!.coin_farming_decimals)

      if (valueWorkerType == 1) { // cetus stable farming
        //@ts-ignore
        coinTypeA = '0x' + res!.stable_farming_position_nft.clmm_postion.coin_type_a.name
        //@ts-ignore
        coinTypeB = '0x' + res!.stable_farming_position_nft.clmm_postion.coin_type_b.name
      } else if (valueWorkerType == 0) { // cetus clmm  
        //@ts-ignore
        coinTypeA = '0x' + res!.position_nft.coin_type_a.name
        //@ts-ignore
        coinTypeB = '0x' + res!.position_nft.coin_type_b.name
      } else if (valueWorkerType == 2) { // bluefin
        //@ts-ignore
        coinTypeA = '0x' + res!.position_nft.coin_type_a
        //@ts-ignore
        coinTypeB = '0x' + res!.position_nft.coin_type_b
      } else {
        console.error("wrong worker_info type")
      }

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

      const priceA = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeA, ctx.timestamp)
      const priceB = await getPriceByType(SuiNetwork.MAIN_NET, coinTypeB, ctx.timestamp)

      let lyf_bounty_amount_base = Number(baseBounty) / Math.pow(10, coinBaseDecimal)
      let lyf_bounty_amount_farming = Number(farmingBounty) / Math.pow(10, coinFarmingDecimal)

      let lyf_bounty_usd
      if (ctx.checkpoint >= 4063111 && ctx.checkpoint < 12234863) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 
          lyf_bounty_amount_farming += 9.903149248
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501
        } 
      } else if (ctx.checkpoint >= 12234863 && ctx.checkpoint < 27846412) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 
          lyf_bounty_amount_farming += 9.903149248
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636  
          lyf_bounty_amount_farming += 15.752826815 
        } 
      } else if (ctx.checkpoint >= 27846412 && ctx.checkpoint < 27955915) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 
          lyf_bounty_amount_farming += 9.903149248
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636  
          lyf_bounty_amount_farming += 15.752826815 
        } 
      } else if (ctx.checkpoint >= 27955915 && ctx.checkpoint < 28277822) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        }
      } else if (ctx.checkpoint >= 28277822 && ctx.checkpoint < 28466966) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        }
      } else if (ctx.checkpoint >= 28466966 && ctx.checkpoint < 28828283) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186  
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        }
      } else if (ctx.checkpoint >= 28828283 && ctx.checkpoint < 29622823) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 + 497.246800172 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186  
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        }
      } else if (ctx.checkpoint >= 29622823 && ctx.checkpoint < 89328791) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 + 497.246800172 + 1621.432414741 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 + 35.35516 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186 + 290.965774938 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") { // cetus_worker_sui_sca_worker_info
          lyf_bounty_amount_base += 30.242805993 
          lyf_bounty_amount_farming += 11.198748955
        }
      } else if (ctx.checkpoint >= 89328791 && ctx.checkpoint < 122460676) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 + 497.246800172 + 1621.432414741
                                    + 1629.644628357 
          lyf_bounty_amount_farming += 4.816902 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492 + 1209.94069 
          lyf_bounty_amount_farming += 0.03312 
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351 + 51.541006 
          lyf_bounty_amount_farming += 0.00051611 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 + 35.35516 + 128.304062 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186 + 290.965774938 + 449.207588479 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
          lyf_bounty_amount_farming += 0.145496 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 + 0.00008385 
          lyf_bounty_amount_farming += 238.066171 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 + 788.737622021 
          lyf_bounty_amount_farming += 0.012975   
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 + 392.667336261 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") { // cetus_worker_sui_sca_worker_info
          lyf_bounty_amount_base += 30.242805993 + 8.853680676 
          lyf_bounty_amount_farming += 11.198748955 + 530.849823783 
        } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") { // cetus_worker_sui_usdc_worker_info
          lyf_bounty_amount_base += 55.337232931 
          lyf_bounty_amount_farming += 9.918433 
        } else if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") { // cetus_worker_sui_buck_worker_info
          lyf_bounty_amount_base += 4.591460438  
          lyf_bounty_amount_farming += 0.21568191
        } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_farming += 493.935603  
        } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 4.849358 
          lyf_bounty_amount_farming += 4.935888  
        } else if (workerInfoAddr ==  "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") { // cetus_worker_cetus_usdc_worker_info
          lyf_bounty_amount_base += 21.132569472 
        } else if (workerInfoAddr ==  "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") { // cetus_worker_sca_sui_worker_info
          lyf_bounty_amount_base += 204.28811979 
          lyf_bounty_amount_farming += 3.288753614 
        } else if (workerInfoAddr ==  "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") { // cetus_worker_buck_usdc_worker_info
          lyf_bounty_amount_base += 8.314615007  
          lyf_bounty_amount_farming += 879.057951  
        } else if (workerInfoAddr ==  "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") { // cetus_worker_buck_sui_worker_info
          lyf_bounty_amount_base += 0.003051127  
          lyf_bounty_amount_farming += 3.752369645 
        } else if (workerInfoAddr ==  "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") { // cetus_worker_usdc_sui_worker_info
          lyf_bounty_amount_base += 65.95147   
          lyf_bounty_amount_farming += 31.452353557  
        } else if (workerInfoAddr ==  "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") { // cetus_worker_usdc_usdt_worker_info
          lyf_bounty_amount_base += 65.302081    
          lyf_bounty_amount_farming += 0.224893   
        } else if (workerInfoAddr ==  "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") { // cetus_worker_usdc_cetus_worker_info
          lyf_bounty_amount_farming += 383.742297962   
        } else if (workerInfoAddr ==  "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") { // cetus_worker_usdc_wusdc_worker_info
          lyf_bounty_amount_base += 2.785156    
        } else if (workerInfoAddr ==  "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") { // cetus_worker_usdc_buck_worker_info
          lyf_bounty_amount_base += 145.44525 
          lyf_bounty_amount_farming += 0.074098078 
        }
      } else if (ctx.checkpoint >= 122460676 && ctx.checkpoint < 152567410) {
        if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 + 497.246800172 + 1621.432414741
                                    + 1629.644628357 + 58.540725677 
          lyf_bounty_amount_farming += 4.816902 + 250.064697 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492 + 1209.94069 + 275.241564
          lyf_bounty_amount_farming += 0.03312 + 9.425678 
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351 + 51.541006 + 25.520089 
          lyf_bounty_amount_farming += 0.00051611 + 0.00772854 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 + 35.35516 + 128.304062 + 46.785203 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186 + 290.965774938 + 449.207588479 + 12.300582296 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
          lyf_bounty_amount_farming += 0.145496 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 + 0.00008385 + 0.00886397 
          lyf_bounty_amount_farming += 238.066171 + 26.145011 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 + 788.737622021 
          lyf_bounty_amount_farming += 0.012975   
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 + 392.667336261 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") { // cetus_worker_sui_sca_worker_info
          lyf_bounty_amount_base += 30.242805993 + 8.853680676 + 15.056800318 
          lyf_bounty_amount_farming += 11.198748955 + 530.849823783 + 448.927939036 
        } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") { // cetus_worker_sui_usdc_worker_info
          lyf_bounty_amount_base += 55.337232931 + 164.887684294 
          lyf_bounty_amount_farming += 9.918433 + 507.633365 
        } else if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") { // cetus_worker_sui_buck_worker_info
          lyf_bounty_amount_base += 4.591460438 + 66.295544844   
          lyf_bounty_amount_farming += 0.21568191 + 102.714316274 
        } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 0.798463 
          lyf_bounty_amount_farming += 493.935603 + 0.813168 
        } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 4.849358 + 33.928655 
          lyf_bounty_amount_farming += 4.935888 + 35.359184 
        } else if (workerInfoAddr ==  "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") { // cetus_worker_cetus_usdc_worker_info
          lyf_bounty_amount_base += 21.132569472 + 135.436878918 
          lyf_bounty_amount_farming += 10.160491 
        } else if (workerInfoAddr ==  "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") { // cetus_worker_sca_sui_worker_info
          lyf_bounty_amount_base += 204.28811979 + 112.833567681 
          lyf_bounty_amount_farming += 3.288753614 + 3.963059557 
        } else if (workerInfoAddr ==  "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") { // cetus_worker_buck_usdc_worker_info
          lyf_bounty_amount_base += 8.314615007 + 547.731429996 
          lyf_bounty_amount_farming += 879.057951 + 1197.775522 
        } else if (workerInfoAddr ==  "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") { // cetus_worker_buck_sui_worker_info
          lyf_bounty_amount_base += 0.003051127 + 32.856299737  
          lyf_bounty_amount_farming += 3.752369645 + 22.607759477 
        } else if (workerInfoAddr ==  "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") { // cetus_worker_usdc_sui_worker_info
          lyf_bounty_amount_base += 65.95147 + 1160.389302
          lyf_bounty_amount_farming += 31.452353557 + 354.106920307 
        } else if (workerInfoAddr ==  "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") { // cetus_worker_usdc_usdt_worker_info
          lyf_bounty_amount_base += 65.302081 + 398.120921
          lyf_bounty_amount_farming += 0.224893 + 61.360648
        } else if (workerInfoAddr ==  "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") { // cetus_worker_usdc_cetus_worker_info
          lyf_bounty_amount_base += 1.176368
          lyf_bounty_amount_farming += 383.742297962 + 16.250537094
        } else if (workerInfoAddr ==  "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") { // cetus_worker_usdc_wusdc_worker_info
          lyf_bounty_amount_base += 2.785156 + 0.798614 
          lyf_bounty_amount_farming += 0.777693 
        } else if (workerInfoAddr ==  "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") { // cetus_worker_usdc_buck_worker_info
          lyf_bounty_amount_base += 145.44525 + 16.49404 
          lyf_bounty_amount_farming += 0.074098078 + 6.280984326 
        } else if (workerInfoAddr ==  "0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd") { // cetus_worker_usdc_suiusdt_worker_info
          lyf_bounty_amount_base += 5925.959861  
          lyf_bounty_amount_farming += 329.875721 
        } else if (workerInfoAddr ==  "0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0") { // cetus_worker_usdc_fdusd_1_worker_info
          lyf_bounty_amount_base += 182.968745   
          lyf_bounty_amount_farming += 226.776853 
        } else if (workerInfoAddr ==  "0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca") { // cetus_worker_usdc_fdusd_2_worker_info
          lyf_bounty_amount_base += 4.419655    
          lyf_bounty_amount_farming += 4.705771  
        } else if (workerInfoAddr ==  "0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843") { // cetus_worker_usdc_fdusd_3_worker_info
          lyf_bounty_amount_base += 3.148213     
          lyf_bounty_amount_farming += 2.882779 
        } else if (workerInfoAddr ==  "0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c") { // cetus_worker_usdc_fdusd_4_worker_info
          lyf_bounty_amount_base += 3.286029      
          lyf_bounty_amount_farming += 3.067245  
        } else if (workerInfoAddr ==  "0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90") { // cetus_worker_usdc_fdusd_5_worker_info
          lyf_bounty_amount_base += 0.00108       
          lyf_bounty_amount_farming += 0.000814   
        } else if (workerInfoAddr ==  "0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98") { // cetus_worker_usdc_fdusd_6_worker_info
          lyf_bounty_amount_base += 0.001185        
          lyf_bounty_amount_farming += 0.000892    
        } else if (workerInfoAddr ==  "0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3") { // cetus_worker_suiusdt_usdc_worker_info
          lyf_bounty_amount_base += 1.536293         
          lyf_bounty_amount_farming += 28.533126 
        } else if (workerInfoAddr ==  "0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395") { // cetus_worker_fdusd_usdc_worker_info
          lyf_bounty_amount_base += 5.354928          
          lyf_bounty_amount_farming += 4.120407 
        }
      } else if (ctx.checkpoint >= 152567410 && ctx.checkpoint < 203655861) {
        if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") { // cetus_worker_sui_buck_worker_info
          lyf_bounty_amount_base += 4.591460438 + 66.295544844 + 66.547030645 
          lyf_bounty_amount_farming += 0.21568191 + 102.714316274 + 73.835083571 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 + 35.35516 + 128.304062 + 46.785203 + 1.281275 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186 + 290.965774938 + 449.207588479 + 12.300582296 + 0.511030025 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492 + 1209.94069 + 275.241564 + 0.474415 
          lyf_bounty_amount_farming += 0.03312 + 9.425678 + 0.519984 
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351 + 51.541006 + 25.520089 + 0.846622 
          lyf_bounty_amount_farming += 0.00051611 + 0.00772854 + 0.00046739 
        } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 4.849358 + 33.928655 + 20.423696 
          lyf_bounty_amount_farming += 4.935888 + 35.359184 + 20.684548 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 + 0.00008385 + 0.00886397 + 0.0020114 
          lyf_bounty_amount_farming += 238.066171 + 26.145011 + 3.935606 
        } else if (workerInfoAddr ==  "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") { // cetus_worker_sca_sui_worker_info
          lyf_bounty_amount_base += 204.28811979 + 112.833567681 + 111.681920933 
          lyf_bounty_amount_farming += 3.288753614 + 3.963059557 + 3.934077388 
        } else if (workerInfoAddr ==  "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") { // cetus_worker_buck_usdc_worker_info
          lyf_bounty_amount_base += 8.314615007 + 547.731429996 + 168.069139047 
          lyf_bounty_amount_farming += 879.057951 + 1197.775522 + 829.174422 
        } else if (workerInfoAddr ==  "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") { // cetus_worker_buck_sui_worker_info
          lyf_bounty_amount_base += 0.003051127 + 32.856299737 + 61.439820424 
          lyf_bounty_amount_farming += 3.752369645 + 22.607759477 + 51.744064889 
        } else if (workerInfoAddr ==  "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") { // cetus_worker_usdc_sui_worker_info
          lyf_bounty_amount_base += 65.95147 + 1160.389302 + 357.518229 
          lyf_bounty_amount_farming += 31.452353557 + 354.106920307 + 132.338939157 
        } else if (workerInfoAddr ==  "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") { // cetus_worker_usdc_usdt_worker_info
          lyf_bounty_amount_base += 65.302081 + 398.120921 + 188.286669 
          lyf_bounty_amount_farming += 0.224893 + 61.360648 + 15.45465 
        } else if (workerInfoAddr ==  "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") { // cetus_worker_usdc_buck_worker_info
          lyf_bounty_amount_base += 145.44525 + 16.49404 + 45.563417 
          lyf_bounty_amount_farming += 0.074098078 + 6.280984326 + 10.253157034 
        } else if (workerInfoAddr ==  "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a") { // cetus_worker_usdc_wusdc_worker_info
          lyf_bounty_amount_base += 21.377129 
          lyf_bounty_amount_farming += 21.538665  
        } else if (workerInfoAddr ==  "0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd") { // cetus_worker_usdc_suiusdt_worker_info
          lyf_bounty_amount_base += 5925.959861 + 6235.885862 
          lyf_bounty_amount_farming += 329.875721 + 242.369327 
        } else if (workerInfoAddr ==  "0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0") { // cetus_worker_usdc_fdusd_1_worker_info
          lyf_bounty_amount_base += 182.968745 + 516.626712 
          lyf_bounty_amount_farming += 226.776853 + 448.770736 
        } else if (workerInfoAddr ==  "0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca") { // cetus_worker_usdc_fdusd_2_worker_info
          lyf_bounty_amount_base += 4.419655 + 474.881054 
          lyf_bounty_amount_farming += 4.705771 + 403.67926 
        } else if (workerInfoAddr ==  "0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843") { // cetus_worker_usdc_fdusd_3_worker_info
          lyf_bounty_amount_base += 3.148213 + 363.101248  
          lyf_bounty_amount_farming += 2.882779 + 332.483768 
        } else if (workerInfoAddr ==  "0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c") { // cetus_worker_usdc_fdusd_4_worker_info
          lyf_bounty_amount_base += 3.286029 + 472.543065 
          lyf_bounty_amount_farming += 3.067245 + 402.149059
        } else if (workerInfoAddr ==  "0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90") { // cetus_worker_usdc_fdusd_5_worker_info
          lyf_bounty_amount_base += 0.00108 + 519.66731
          lyf_bounty_amount_farming += 0.000814 + 450.078236
        } else if (workerInfoAddr ==  "0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98") { // cetus_worker_usdc_fdusd_6_worker_info
          lyf_bounty_amount_base += 0.001185 + 509.137456 
          lyf_bounty_amount_farming += 0.000892 + 436.814468 
        } else if (workerInfoAddr ==  "0xf823b1460defefa6f3923e4f4eb93795f421756de29afed344ddd6d6dd91be29") { // cetus_worker_usdc_usdy_worker_info
          lyf_bounty_amount_base += 275.92847 
          lyf_bounty_amount_farming += 4.218704 
        } else if (workerInfoAddr ==  "0xc602fd3f71b40e8ba3c7e01f8e42987cfb660e282fc645952d03ae59a075aea2") { // cetus_worker_usdc_suiusdt_2_worker_info
          lyf_bounty_amount_base += 887.464786 
          lyf_bounty_amount_farming += 36.451941  
        } else if (workerInfoAddr ==  "0xceba2697cb06fd3f1b5647bc192f30a96749ee43262ff4bd7ea9d5a2d00cee40") { // cetus_worker_usdc_ausd_worker_info
          lyf_bounty_amount_base += 2.28054 
          lyf_bounty_amount_farming += 0.152465   
        } else if (workerInfoAddr ==  "0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3") { // cetus_worker_suiusdt_usdc_worker_info
          lyf_bounty_amount_base += 1.536293 + 7.546642 
          lyf_bounty_amount_farming += 28.533126 + 162.986799 
        } else if (workerInfoAddr ==  "0x01faaad863c448800d2b7223609436c2cdf001c4c397d66eb59bb89a82828b6d") { // cetus_worker_suiusdt_usdc_2_worker_info
          lyf_bounty_amount_base += 0.001967  
          lyf_bounty_amount_farming += 0.024329  
        } else if (workerInfoAddr ==  "0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395") { // cetus_worker_fdusd_usdc_worker_info
          lyf_bounty_amount_base += 5.354928 + 42.209619 
          lyf_bounty_amount_farming += 4.120407 + 51.91123 
        } else if (workerInfoAddr ==  "0x3ef9304468faecfaf7d2317960b9e69fb85ea2610cc089244f3c0d54abf167e7") { // cetus_worker_usdy_usdc_worker_info
          lyf_bounty_amount_base += 0.009606 
          lyf_bounty_amount_farming += 1.654867 
        } else if (workerInfoAddr ==  "0x989baaba20b51b6aec07bd0c235ee9a2ee3e709071d34c547abf84841b4a5d5b") { // cetus_worker_ausd_usdc_worker_info
          lyf_bounty_amount_base += 0.000804  
          lyf_bounty_amount_farming += 0.025658 
        } else if (workerInfoAddr ==  "0x9af96eeb7ca6c1d17cad76607cd04b4ee712908345b64d66e9d3df9f053c5b82") { // cetus_worker_stablefarm_sui_hasui_worker_info
          lyf_bounty_amount_base += 49.231234961   
          lyf_bounty_amount_farming += 7.458195331  
        } else if (workerInfoAddr ==  "0x4e0f84b2d00700102553482e46ec08bd65b29e0d4fc9af8b39b0b25e299fcf1f") { // cetus_worker_stablefarm_hasui_sui_worker_info
          lyf_bounty_amount_base += 0.023678472 
          lyf_bounty_amount_farming += 0.183556956   
        } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 + 497.246800172 + 1621.432414741
                                    + 1629.644628357 + 58.540725677 + 5.010045266 
          lyf_bounty_amount_farming += 4.816902 + 250.064697 + 13.550188 
        } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") { // cetus_worker_sui_sca_worker_info
          lyf_bounty_amount_base += 30.242805993 + 8.853680676 + 15.056800318 + 8.558741774 
          lyf_bounty_amount_farming += 11.198748955 + 530.849823783 + 448.927939036 + 246.359276464 
        } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") { // cetus_worker_sui_usdc_worker_info
          lyf_bounty_amount_base += 55.337232931 + 164.887684294 + 139.266276924 
          lyf_bounty_amount_farming += 9.918433 + 507.633365 + 384.609784 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
          lyf_bounty_amount_farming += 0.145496 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 + 788.737622021 
          lyf_bounty_amount_farming += 0.012975   
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 + 392.667336261 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 0.798463 
          lyf_bounty_amount_farming += 493.935603 + 0.813168 
        } else if (workerInfoAddr ==  "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") { // cetus_worker_cetus_usdc_worker_info
          lyf_bounty_amount_base += 21.132569472 + 135.436878918 
          lyf_bounty_amount_farming += 10.160491 
        } else if (workerInfoAddr ==  "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") { // cetus_worker_usdc_cetus_worker_info
          lyf_bounty_amount_base += 1.176368
          lyf_bounty_amount_farming += 383.742297962 + 16.250537094
        } else if (workerInfoAddr ==  "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") { // cetus_worker_usdc_wusdc_worker_info
          lyf_bounty_amount_base += 2.785156 + 0.798614 
          lyf_bounty_amount_farming += 0.777693 
        }
      } else if (ctx.checkpoint >= 203655861) {
        // Before Cetus incident - start 
        if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") { // cetus_worker_sui_buck_worker_info
          lyf_bounty_amount_base += 4.591460438 + 66.295544844 + 66.547030645 
          lyf_bounty_amount_farming += 0.21568191 + 102.714316274 + 73.835083571 
        } else if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") { // cetus_worker_wusdc_sui_worker_info
          lyf_bounty_amount_base += 14.913658 + 104.807058 + 28.427997 + 33.093834 + 35.35516 + 128.304062 + 46.785203 + 1.281275 
          lyf_bounty_amount_farming += 9.903149248 + 399.640630603 + 124.410474194 + 211.686159186 + 290.965774938 + 449.207588479 + 12.300582296 + 0.511030025 
        } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") { // cetus_worker_wusdc_usdt_worker_info
          lyf_bounty_amount_base += 24.559492 + 1209.94069 + 275.241564 + 0.474415 
          lyf_bounty_amount_farming += 0.03312 + 9.425678 + 0.519984 
        } else if (workerInfoAddr ==  "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") { // cetus_worker_wusdc_weth_worker_info
          lyf_bounty_amount_base += 0.018202 + 0.093351 + 51.541006 + 25.520089 + 0.846622 
          lyf_bounty_amount_farming += 0.00051611 + 0.00772854 + 0.00046739 
        } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 4.849358 + 33.928655 + 20.423696 
          lyf_bounty_amount_farming += 4.935888 + 35.359184 + 20.684548 
        } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") { // cetus_worker_weth_wusdc_worker_info
          lyf_bounty_amount_base += 0.02010501 + 0.06229361 + 0.00008385 + 0.00886397 + 0.0020114 
          lyf_bounty_amount_farming += 238.066171 + 26.145011 + 3.935606 
        } else if (workerInfoAddr ==  "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") { // cetus_worker_sca_sui_worker_info
          lyf_bounty_amount_base += 204.28811979 + 112.833567681 + 111.681920933 
          lyf_bounty_amount_farming += 3.288753614 + 3.963059557 + 3.934077388 
        } else if (workerInfoAddr ==  "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") { // cetus_worker_buck_usdc_worker_info
          lyf_bounty_amount_base += 8.314615007 + 547.731429996 + 168.069139047 
          lyf_bounty_amount_farming += 879.057951 + 1197.775522 + 829.174422 
        } else if (workerInfoAddr ==  "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") { // cetus_worker_buck_sui_worker_info
          lyf_bounty_amount_base += 0.003051127 + 32.856299737 + 61.439820424 
          lyf_bounty_amount_farming += 3.752369645 + 22.607759477 + 51.744064889 
        } else if (workerInfoAddr ==  "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") { // cetus_worker_usdc_sui_worker_info
          lyf_bounty_amount_base += 65.95147 + 1160.389302 + 357.518229 
          lyf_bounty_amount_farming += 31.452353557 + 354.106920307 + 132.338939157 
        } else if (workerInfoAddr ==  "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") { // cetus_worker_usdc_usdt_worker_info
          lyf_bounty_amount_base += 65.302081 + 398.120921 + 188.286669 
          lyf_bounty_amount_farming += 0.224893 + 61.360648 + 15.45465 
        } else if (workerInfoAddr ==  "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") { // cetus_worker_usdc_buck_worker_info
          lyf_bounty_amount_base += 145.44525 + 16.49404 + 45.563417 
          lyf_bounty_amount_farming += 0.074098078 + 6.280984326 + 10.253157034 
        } else if (workerInfoAddr ==  "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a") { // cetus_worker_usdc_wusdc_worker_info
          lyf_bounty_amount_base += 21.377129 
          lyf_bounty_amount_farming += 21.538665  
        } else if (workerInfoAddr ==  "0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd") { // cetus_worker_usdc_suiusdt_worker_info
          lyf_bounty_amount_base += 5925.959861 + 6235.885862 
          lyf_bounty_amount_farming += 329.875721 + 242.369327 
        } else if (workerInfoAddr ==  "0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0") { // cetus_worker_usdc_fdusd_1_worker_info
          lyf_bounty_amount_base += 182.968745 + 516.626712 
          lyf_bounty_amount_farming += 226.776853 + 448.770736 
        } else if (workerInfoAddr ==  "0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca") { // cetus_worker_usdc_fdusd_2_worker_info
          lyf_bounty_amount_base += 4.419655 + 474.881054 
          lyf_bounty_amount_farming += 4.705771 + 403.67926 
        } else if (workerInfoAddr ==  "0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843") { // cetus_worker_usdc_fdusd_3_worker_info
          lyf_bounty_amount_base += 3.148213 + 363.101248  
          lyf_bounty_amount_farming += 2.882779 + 332.483768 
        } else if (workerInfoAddr ==  "0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c") { // cetus_worker_usdc_fdusd_4_worker_info
          lyf_bounty_amount_base += 3.286029 + 472.543065 
          lyf_bounty_amount_farming += 3.067245 + 402.149059
        } else if (workerInfoAddr ==  "0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90") { // cetus_worker_usdc_fdusd_5_worker_info
          lyf_bounty_amount_base += 0.00108 + 519.66731
          lyf_bounty_amount_farming += 0.000814 + 450.078236
        } else if (workerInfoAddr ==  "0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98") { // cetus_worker_usdc_fdusd_6_worker_info
          lyf_bounty_amount_base += 0.001185 + 509.137456 
          lyf_bounty_amount_farming += 0.000892 + 436.814468 
        } else if (workerInfoAddr ==  "0xf823b1460defefa6f3923e4f4eb93795f421756de29afed344ddd6d6dd91be29") { // cetus_worker_usdc_usdy_worker_info
          lyf_bounty_amount_base += 275.92847 
          lyf_bounty_amount_farming += 4.218704 
        } else if (workerInfoAddr ==  "0xc602fd3f71b40e8ba3c7e01f8e42987cfb660e282fc645952d03ae59a075aea2") { // cetus_worker_usdc_suiusdt_2_worker_info
          lyf_bounty_amount_base += 887.464786 
          lyf_bounty_amount_farming += 36.451941  
        } else if (workerInfoAddr ==  "0xceba2697cb06fd3f1b5647bc192f30a96749ee43262ff4bd7ea9d5a2d00cee40") { // cetus_worker_usdc_ausd_worker_info
          lyf_bounty_amount_base += 2.28054 
          lyf_bounty_amount_farming += 0.152465   
        } else if (workerInfoAddr ==  "0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3") { // cetus_worker_suiusdt_usdc_worker_info
          lyf_bounty_amount_base += 1.536293 + 7.546642 
          lyf_bounty_amount_farming += 28.533126 + 162.986799 
        } else if (workerInfoAddr ==  "0x01faaad863c448800d2b7223609436c2cdf001c4c397d66eb59bb89a82828b6d") { // cetus_worker_suiusdt_usdc_2_worker_info
          lyf_bounty_amount_base += 0.001967  
          lyf_bounty_amount_farming += 0.024329  
        } else if (workerInfoAddr ==  "0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395") { // cetus_worker_fdusd_usdc_worker_info
          lyf_bounty_amount_base += 5.354928 + 42.209619 
          lyf_bounty_amount_farming += 4.120407 + 51.91123 
        } else if (workerInfoAddr ==  "0x3ef9304468faecfaf7d2317960b9e69fb85ea2610cc089244f3c0d54abf167e7") { // cetus_worker_usdy_usdc_worker_info
          lyf_bounty_amount_base += 0.009606 
          lyf_bounty_amount_farming += 1.654867 
        } else if (workerInfoAddr ==  "0x989baaba20b51b6aec07bd0c235ee9a2ee3e709071d34c547abf84841b4a5d5b") { // cetus_worker_ausd_usdc_worker_info
          lyf_bounty_amount_base += 0.000804  
          lyf_bounty_amount_farming += 0.025658 
        } else if (workerInfoAddr ==  "0x9af96eeb7ca6c1d17cad76607cd04b4ee712908345b64d66e9d3df9f053c5b82") { // cetus_worker_stablefarm_sui_hasui_worker_info
          lyf_bounty_amount_base += 49.231234961   
          lyf_bounty_amount_farming += 7.458195331  
        } else if (workerInfoAddr ==  "0x4e0f84b2d00700102553482e46ec08bd65b29e0d4fc9af8b39b0b25e299fcf1f") { // cetus_worker_stablefarm_hasui_sui_worker_info
          lyf_bounty_amount_base += 0.023678472 
          lyf_bounty_amount_farming += 0.183556956   
        } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") { // cetus_worker_sui_wusdc_worker_info
          lyf_bounty_amount_base += 234.05498811 + 617.654678904 + 373.471966116 + 149.788466622 + 337.608564779 + 190.727072161 + 497.246800172 + 1621.432414741
                                    + 1629.644628357 + 58.540725677 + 5.010045266 
          lyf_bounty_amount_farming += 4.816902 + 250.064697 + 13.550188 
        } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") { // cetus_worker_sui_sca_worker_info
          lyf_bounty_amount_base += 30.242805993 + 8.853680676 + 15.056800318 + 8.558741774 
          lyf_bounty_amount_farming += 11.198748955 + 530.849823783 + 448.927939036 + 246.359276464 
        } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") { // cetus_worker_sui_usdc_worker_info
          lyf_bounty_amount_base += 55.337232931 + 164.887684294 + 139.266276924 
          lyf_bounty_amount_farming += 9.918433 + 507.633365 + 384.609784 
        } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") { // cetus_worker_usdt_wusdc_worker_info
          lyf_bounty_amount_base += 20.772669 + 0.233152 
          lyf_bounty_amount_farming += 0.145496 
        } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") { // cetus_worker_sui_cetus_worker_info
          lyf_bounty_amount_base += 0.865561636 + 1.078166473 
          lyf_bounty_amount_farming += 15.752826815 + 8.546183514 
        } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") { // cetus_worker_sui_hasui_worker_info
          lyf_bounty_amount_base += 0.012178072 
        } else if (workerInfoAddr ==  "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") { // cetus_worker_cetus_wusdc_worker_info
          lyf_bounty_amount_base += 0.286531 + 788.737622021 
          lyf_bounty_amount_farming += 0.012975   
        } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") { // cetus_worker_wusdc_cetus_worker_info
          lyf_bounty_amount_farming += 2.588900667 + 392.667336261 
        } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") { // cetus_worker_hasui_sui_worker_info
          lyf_bounty_amount_farming += 0.0028575 
        } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") { // cetus_worker_wusdc_usdc_worker_info
          lyf_bounty_amount_base += 0.798463 
          lyf_bounty_amount_farming += 493.935603 + 0.813168 
        } else if (workerInfoAddr ==  "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") { // cetus_worker_cetus_usdc_worker_info
          lyf_bounty_amount_base += 21.132569472 + 135.436878918 
          lyf_bounty_amount_farming += 10.160491 
        } else if (workerInfoAddr ==  "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") { // cetus_worker_usdc_cetus_worker_info
          lyf_bounty_amount_base += 1.176368
          lyf_bounty_amount_farming += 383.742297962 + 16.250537094
        } else if (workerInfoAddr ==  "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") { // cetus_worker_usdc_wusdc_worker_info
          lyf_bounty_amount_base += 2.785156 + 0.798614 
          lyf_bounty_amount_farming += 0.777693 
        }
        // Before Cetus incident - end

        // New works after cetus incident - start 
        if (workerInfoAddr ==  "0x47b2a1ad2a87de3351f8e7d7ce39b529a15af53e7b4ba89c8c69781ba2f6829f") { // cetus_worker_stablefarm_sui_hasui_worker_info
          lyf_bounty_amount_base += 108.731683758
          lyf_bounty_amount_farming += 681.472252301  
        } else if (workerInfoAddr ==  "0x19d8089f3168a7f07d0aca36ea428585025d64ce4aeeb8cdf50ee72213ef07da") { // cetus_worker_stablefarm_hasui_sui_worker_info
          lyf_bounty_amount_base += 0.759923316 
          lyf_bounty_amount_farming += 0.047577221 
        } else if (workerInfoAddr == "0xaee16401df87f6c7dbe6397c960f6b7993f9d005e9d11cbda8f4d079e94cde8a") { // cetus_worker_buck_usdc_worker_info
          lyf_bounty_amount_base += 87.363369955 
          lyf_bounty_amount_farming += 2099.068751
        } else if (workerInfoAddr == "0x85ad5f6b8dd39b2a9dbb05161a563db52f91d724390273a739199dbfa640405b") { // cetus_worker_usdc_suiusdt_2_worker_info
          lyf_bounty_amount_base += 18248.7436  
          lyf_bounty_amount_farming += 109.643167
        } else if (workerInfoAddr == "0x888821cfa0e8d3e4de4602d91b17ea2e156e534a233424611b8f27e5d4bac439") { // cetus_worker_suiusdt_usdc_2_worker_info
          lyf_bounty_amount_base += 0.026586 
          lyf_bounty_amount_farming += 5.469643
        }
        // New works after cetus incident - end
      }

      let farmPairName = coin_symbol_a + '-' + coin_symbol_b
      if (valueWorkerType == 2) {
        farmPairName += '-Bluefin'
      }

      if (isReverseWorkerInfo(workerInfoAddr)) { // if reverse, coin A is farming , coin B is base
        lyf_bounty_usd = lyf_bounty_amount_base * priceB! + lyf_bounty_amount_farming * priceA!
        ctx.meter.Gauge("lyf_bounty_amount").record(lyf_bounty_amount_base, {farmPairName , coin_symbol_b, project: "mole-fee" })
        ctx.meter.Gauge("lyf_bounty_amount").record(lyf_bounty_amount_farming, {farmPairName , coin_symbol_a, project: "mole-fee" })

      } else { // // if no reverse, coin A is baes , coin B is farming
        lyf_bounty_usd = lyf_bounty_amount_base * priceA! + lyf_bounty_amount_farming * priceB!
        ctx.meter.Gauge("lyf_bounty_amount").record(lyf_bounty_amount_base, {farmPairName , coin_symbol_a, project: "mole-fee" })
        ctx.meter.Gauge("lyf_bounty_amount").record(lyf_bounty_amount_farming, {farmPairName , coin_symbol_b, project: "mole-fee" })
      }
      ctx.meter.Gauge("lyf_bounty_usd").record(lyf_bounty_usd, {farmPairName , project: "mole-fee" })

    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 480, 1440, undefined, { owned: false })
}); 



