import { Counter, Gauge } from '@sentio/sdk'
import { SuiNetwork, SuiObjectProcessorTemplate, SuiObjectProcessor, SuiWrappedObjectProcessor} from "@sentio/sdk/sui"
import { vault } from './types/sui/0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f.js'
import { sui_incentive } from './types/sui/0xc4dc6948a7d0a58f32fadd44e45efb201f44383bfab1cb6c48b9c186a92cc762.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_sui   } from './types/sui/0x334bed7f6426c1a3710ef7f4d66b1225df74146372b40a64e9d0cbfc76d76e67.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_usdc   } from './types/sui/0x1454bd0be3db3c4be862104bde964913182de6d380aea24b88320505baba5e46.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdt_usdc  } from './types/sui/0x9cb48aa1b41a1183ecdabde578e640e05a08170f8ca165b743ffded0b1256391.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_usdt  } from './types/sui/0x960ab11d560f05f0ec260c7ac87074b569334713594aa02580642e029fd9dd86.js'
import { cetus_clmm_worker as cetus_clmm_worker_weth_usdc  } from './types/sui/0xb7a0d251a9f307b80b1595c87622118e401dc613591b3435786bb7c147599dae.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_weth  } from './types/sui/0xd49d0a3331bd41005dd1a5e295e07bf4cec1359e201ba71fc5a1e541787328d9.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdt_sui   } from './types/sui/0xab01c0cb01a3e50171b898eb2509f53ba2ba83ed844628f3d843b20e99783b58.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_usdt   } from './types/sui/0x8cc36eb225997a7e35661382b5ddfda35f91a7d732e04e22d203151a9e321d66.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_cetus  } from './types/sui/0x7f24e8b7935db7588bfd7035b4aa503c1f29ed71ce2b1dbd425b8ad1096b7463.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_sui  } from './types/sui/0x57563b5040ac32ff1897a3c40fe9a0e987f40791289fce31ff7388805255076d.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_usdc } from './types/sui/0xf538241fc4783dbf0eca4cf516fbc7ad5b910517e25d8e4ec7fb754eb9b0280c.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_cetus } from './types/sui/0xd8528e2825b7354f5e4fd3bf89e3998e59f4cf92160d65bf491885677229def0.js'
import { cetus_clmm_worker as cetus_clmm_worker_hasui_sui  } from './types/sui/0x50be9b81baf7204130eea06bb1845d4a0beccbee98c03b5ec0b17a48302351bf.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_hasui  } from './types/sui/0xd5f6540d3d3fc7fd8ed64e862a21785932e84ee669fb2e7bbe5bd23fd6552827.js'
import { cetus_clmm_worker as cetus_clmm_worker_navx_sui   } from './types/sui/0x53e47bac30d4f17fcb0d800de9fc7f0cc96f520531bb8fd7670e9c08f060ec61.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_navx   } from './types/sui/0xd5b04240f6536c7b5276e96b057460a58ac8b1b66b2db03038f3d44bf1ea7cde.js'
import { cetus_clmm_worker as cetus_clmm_worker_navx_cetus } from './types/sui/0x6665ad06bb0c47a00e3ce6da9c796f8061b9f8178095e421ce36e3f73345f24a.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_navx } from './types/sui/0xf8670497cc6403831fad47f8471cce467661c3e01833953d62fe86527bbe4474.js'
import { cetus_clmm_worker as cetus_clmm_worker_sca_sui    } from './types/sui/0x0efca73a17c179aee1a5243c66c3f90101f61e9dd974e71b356ecdf0316ca626.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_sca    } from './types/sui/0x9a0355aa800e975678ce812d4ee044f3faa8b48c70d877f90d3ba8d35566e6aa.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_wbtc  } from './types/sui/0xff377a83375d63b9c8429362b5c2791bc69f0da861d3d963970ffeac2654d9d5.js'
import { cetus_clmm_worker as cetus_clmm_worker_wbtc_usdc  } from './types/sui/0x15fbfe8c27c920baaa1e4bd8bfe05c4408311612baf6493ed3285c6bd95a6939.js'
import { cetus_clmm_worker as cetus_clmm_worker_buck_usdc  } from './types/sui/0xcac7d10d73c3c32f6d40031c8639dfde168e6e1c0e4a86f8d23f21db60f97c94.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_buck  } from './types/sui/0xe6ba97715edd0cfe6a8e40654b37c6f46a8a8af5b7fe2eefa3fd713243857993.js'

import { pool } from './types/sui/0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb.js'
import { getPriceByType, token } from "@sentio/sdk/utils"
import { buildCoinInfo, getCoinAmountFromLiquidity, i32BitsToNumber, sleep, tickIndexToSqrtPriceX64} from './utils/mole_utils.js'
import * as constant from './utils/constant.js'
import * as helper from './utils/cetus-clmm.js'
import { ANY_TYPE, BUILTIN_TYPES } from '@sentio/sdk/move'
import { string_ } from "@sentio/sdk/sui/builtin/0x1";
import BN from 'bn.js'
import axiosInst from './utils/moleAxios.js'


const vaultWethConfigId  = "0x7fa4aa18fc4488947dc7528b5177c4475ec478c28014e77a31dc2318fa4f125e"
const vaultHaSuiConfigId = "0xa069ec74c6bb6d6df53e22d9bf00625a3d65da67c4d9e2868c8e348201251dd0"
const vaultUsdtConfigId  = "0x355915a87a910908ef1ccc1cbad290b07fa01bd0d5f3046f472a1ef81842c04b"
const vaultUsdcConfigId  = "0xe684f8509e90bfc1fe9701266a40d641e80691f0d05dc09cfd9c56041099cc39"
const vaultCetusConfigId = "0x4389f5425b748b9ddec06730d8a4376bafff215f326b18eccb3dd3b2c4ef7e4f"
const vaultSuiConfigId   = "0x6ae14611cecaab94070017f4633090ce7ea83922fc8f78b3f8409a7dbffeb9a4"
const vaultNavxConfigId  = "0x8038c996731d6ea078c39be7cb7ac8ed6eec9cfe0299aefcf480c9e286c87af6"
const vaultScaConfigId   = "0xd7ca39d682822b26e032079b723807e1bb2e90150c40eada7a104832e9e6c47f"
const vaultWbtcConfigId  = "0xf19fcfcd8da9837580cd0737ef626ac077a5ce33f703d25c990a3c49d888b4f6"
const vaultBuckConfigId  = "0x73903c5c973f62ab68acdfbd53b17dad2b9be586605664e192cebcb1f3a3f1a2"

sui_incentive.bind({ 
    address: '0xc4dc6948a7d0a58f32fadd44e45efb201f44383bfab1cb6c48b9c186a92cc762',
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 32697300n
  })
    .onEventHarvestEvent(
      async (event, ctx) => {
        const user = event.data_decoded.user
        const pid = String(event.data_decoded.pid)
        const amount = Number(event.data_decoded.amount) / Math.pow(10, 9)
        const action_type = String(event.data_decoded.action_type)
  
        ctx.meter.Gauge("harvest_pid").record(amount, { action_type, pid, project: "mole" })
  
        ctx.eventLogger.emit("HarvestEvent", {
          distinctId: user,
          pid: pid,
          amount: amount,
          action_type: action_type,
          project: "mole"
        })
      },
    )


SuiWrappedObjectProcessor.bind({
  //object owner address of vault_usdt_vault_info/vault_sui_vault_info etc.
  objectId: "0x0dcd6ff3155967823494c7d4dd3bc952e551102879562ff7c75019b290281583",
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 11763619n
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

        let coinType
        if (configAddr == vaultWethConfigId) {
          coinType = "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN"
        } else if (configAddr == vaultHaSuiConfigId) {
          coinType = "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI"
        } else if (configAddr == vaultUsdtConfigId) {
          coinType = "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN"
        } else if (configAddr == vaultUsdcConfigId) {
          coinType = "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN"
        } else if (configAddr == vaultCetusConfigId) {
          coinType = "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS"
        } else if (configAddr == vaultSuiConfigId) {
          coinType = "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
        } else if (configAddr == vaultNavxConfigId) {
          coinType = "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX"
        } else if (configAddr == vaultScaConfigId) {
          coinType = "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA"
        } else if (configAddr == vaultWbtcConfigId) {
          coinType = "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN"
        } else if (configAddr == vaultBuckConfigId) {
          coinType = "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK"
        } else {
          console.error("CoinType not suppport!")
        }

        let coinInfo = await buildCoinInfo(ctx, coinType!)
        retry = 0
        while (!coinInfo && retry < 300) {
          await sleep(300);
          coinInfo = await buildCoinInfo(ctx, coinType!)
          retry++    

          if (retry == 299) {
            throw new Error("buildCoinInfo error")
          }   
        }

        const coin_symbol = coinInfo.symbol
        
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

        const savings_debt_usd = savings_debt * price! 

        //@ts-ignore
        ctx.meter.Gauge("savings_debt_usd").record(savings_debt_usd, { coin_symbol, project: "mole" })

        // savings_free_coin = deposit - debt
        //@ts-ignore
        const savings_free_coin = Number(field.value.coin) / Math.pow(10, coinInfo.decimal)
        const savings_free_coin_usd = savings_free_coin * price! 
        ctx.meter.Gauge("savings_free_coin_usd").record(savings_free_coin_usd, { coin_symbol, project: "mole" })

        console.log("savings_debt_usd:", savings_debt_usd, ", savings_free_coin_usd:", savings_free_coin_usd, ",coin_symbol:", coin_symbol)

        const use_rate = savings_debt / (savings_debt + savings_free_coin)

        // Borrowing interest = a * utilization + b
        let a, b
        if (use_rate < 0.6) {
          a = 0.333333333 
          b = 0
        } else if (use_rate >= 0.6 && use_rate < 0.9) {
          a = 0 
          b = 0.2
        } else { // use_rate >= 0.9
          a = 13
          b = -11.5
        }
        const savings_borrowing_interest =  a * use_rate + b
        ctx.meter.Gauge("savings_borrowing_interest").record(savings_borrowing_interest, { coin_symbol, project: "mole" })

        // Lending interest = Borrowing Interest * Utilization * (1 - Borrow Protocol Fee)
        const savings_lending_interest_apr = savings_borrowing_interest * use_rate * (1 - 0.19)
        // apr to apy
        const savings_lending_interest_apy =  Math.pow(1 + savings_lending_interest_apr / 365, 365) - 1

        ctx.meter.Gauge("savings_lending_interest").record(savings_lending_interest_apy, { coin_symbol, project: "mole" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 60, 240, undefined, { owned: true })

  
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
  }, 30, 240, undefined, { owned: false })



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
    }, 30, 60, undefined, { owned: false })
  
  


//@ts-ignore
let gCurrentSqrtPriceUsdcSui
//@ts-ignore
let gCurrentSqrtPriceUsdtUsdc
//@ts-ignore
let gCurrentSqrtPriceWethUsdc
//@ts-ignore
let gCurrentSqrtPriceUsdtSui
//@ts-ignore
let gCurrentSqrtPriceHasuiSui
//@ts-ignore
let gCurrentSqrtPriceUsdcCetus
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
let gCurrentSqrtPriceUsdcWbtc
//@ts-ignore
let gCurrentSqrtPriceBuckUsdc

for (let i = 0; i < constant.POOLS_MOLE_LIST.length; i++) {
  SuiObjectProcessor.bind({
    objectId: constant.POOLS_MOLE_LIST[i],
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 11763619n
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
        gCurrentSqrtPriceUsdcSui = currentSqrtPrice
      } else if ('0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20' == ctx.objectId) {
        gCurrentSqrtPriceUsdtUsdc = currentSqrtPrice
      } else if ('0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df' == ctx.objectId) {
        gCurrentSqrtPriceWethUsdc = currentSqrtPrice
      } else if ('0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3' == ctx.objectId) {
        gCurrentSqrtPriceUsdtSui = currentSqrtPrice
      } else if ('0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc' == ctx.objectId) {
        gCurrentSqrtPriceHasuiSui = currentSqrtPrice
      } else if ('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8' == ctx.objectId) {
        gCurrentSqrtPriceUsdcCetus = currentSqrtPrice
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
        gCurrentSqrtPriceUsdcWbtc = currentSqrtPrice
      } else if ('0x81fe26939ed676dd766358a60445341a06cea407ca6f3671ef30f162c84126d5' == ctx.objectId) {
        gCurrentSqrtPriceBuckUsdc = currentSqrtPrice
      } else {
        console.error("Has not object : ", ctx.objectId)
      }
     
      console.log("currentSqrtPrice :", currentSqrtPrice)
    }
  catch (e) {
        console.log(`${e.message} error at ${JSON.stringify(self)}`)
      }
    }, 60, 240, undefined, { owned: false })
}



// Worker info    
for (let i = 0; i < constant.MOLE_WORKER_INFO_LIST.length; i++) {
  const workerInfoAddr = constant.MOLE_WORKER_INFO_LIST[i]

  SuiObjectProcessor.bind({
    objectId: workerInfoAddr,
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 11763619n
  })
  .onTimeInterval(async (self, _, ctx) => {
    // console.log("ctx.objectId:" , ctx.objectId, ", slef:",JSON.stringify(self))
    
    try {
      let res
      if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_sui.WorkerInfo.type())
      } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_usdc.WorkerInfo.type())
      } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdt_usdc.WorkerInfo.type())
      } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_usdt.WorkerInfo.type())
      } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_weth_usdc.WorkerInfo.type())
      } else if (workerInfoAddr == "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_weth.WorkerInfo.type())
      } else if (workerInfoAddr == "0x9a510e18c37df3d9ddfe0b2d6673582f702bf281116a4ee334f7ef3edfa2b9ab") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdt_sui.WorkerInfo.type())
      } else if (workerInfoAddr == "0xcd00ff33e9a71ea807f41641d515449263a905a850a4fd9c4ce03203c0f954b5") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_usdt.WorkerInfo.type())
      } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_cetus.WorkerInfo.type())
      } else if (workerInfoAddr == "0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_sui.WorkerInfo.type())
      } else if (workerInfoAddr == "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_usdc.WorkerInfo.type())
      } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_cetus.WorkerInfo.type())
      } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_hasui_sui.WorkerInfo.type())
      } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_hasui.WorkerInfo.type())
      } else if (workerInfoAddr == "0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_navx_sui.WorkerInfo.type())
      } else if (workerInfoAddr == "0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_navx.WorkerInfo.type())
      } else if (workerInfoAddr == "0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_navx_cetus.WorkerInfo.type())
      } else if (workerInfoAddr == "0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_cetus_navx.WorkerInfo.type())
      } else if (workerInfoAddr == "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sca_sui.WorkerInfo.type())
      } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_sui_sca.WorkerInfo.type())
      } else if (workerInfoAddr == "0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_wbtc.WorkerInfo.type())
      } else if (workerInfoAddr == "0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_wbtc_usdc.WorkerInfo.type())
      } else if (workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_buck_usdc.WorkerInfo.type())
      } else if (workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659") {
        res = await ctx.coder.decodedType(self, cetus_clmm_worker_usdc_buck.WorkerInfo.type())
      } else {
        console.error("Not support workerInfoAddr:", workerInfoAddr)
      } 
      
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
      while (!coinInfoA && retry < 300) {
        await sleep(300);
        coinInfoA = await buildCoinInfo(ctx, coinTypeA)
        retry++

        if (retry == 299) {
          throw new Error("buildCoinInfo coinInfoA")
        }
      }

      const coin_symbol_a = coinInfoA.symbol

      let coinInfoB = await buildCoinInfo(ctx, coinTypeB)
      retry = 0
      while (!coinInfoB && retry < 300) {
        await sleep(300);
        coinInfoB = await buildCoinInfo(ctx, coinTypeB)
        retry++

        if (retry == 299) {
          throw new Error("buildCoinInfo coinInfoB")
        }
      }
      const coin_symbol_b = coinInfoB.symbol

      let currentSqrtPrice
      if (coin_symbol_a == "USDC" && coin_symbol_b == "SUI") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcSui
      } else if (coin_symbol_a == "USDT" && coin_symbol_b == "USDC") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdtUsdc
      } else if (coin_symbol_a == "WETH" && coin_symbol_b == "USDC") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceWethUsdc
      } else if (coin_symbol_a == "USDT" && coin_symbol_b == "SUI") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdtSui
      } else if (coin_symbol_a == "haSUI" && coin_symbol_b == "SUI") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceHasuiSui
      } else if (coin_symbol_a == "USDC" && coin_symbol_b == "CETUS") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcCetus
      } else if (coin_symbol_a == "CETUS" && coin_symbol_b == "SUI") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceCetusSui
      } else if (coin_symbol_a == "NAVX" && coin_symbol_b == "SUI") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceNavxSui
      } else if (coin_symbol_a == "NAVX" && coin_symbol_b == "CETUS") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceNavxCetus
      } else if (coin_symbol_a == "SCA" && coin_symbol_b == "SUI") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceScaSui
      } else if (coin_symbol_a == "WETH" && coin_symbol_b == "CETUS") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceWethCetus
      } else if (coin_symbol_a == "USDT" && coin_symbol_b == "CETUS") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdtCetus
      } else if (coin_symbol_a == "USDC" && coin_symbol_b == "WBTC") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceUsdcWbtc
      } else if (coin_symbol_a == "BUCK" && coin_symbol_b == "USDC") {
        //@ts-ignore
        currentSqrtPrice = gCurrentSqrtPriceBuckUsdc
      } else {
        console.error("Has not price : coin_symbol_a:", coin_symbol_a, ",coin_symbol_b:",coin_symbol_b )
      }

      if (!currentSqrtPrice) {
        console.error("gCurrentSqrtPrice is undefined")
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

      // console.log("lyf_usd_farm_usd:", lyf_usd_farm_usd)

      const farmPairName = coin_symbol_a + '-' + coin_symbol_b

      ctx.meter.Gauge("lyf_usd_farm_usd").record(lyf_usd_farm_usd, {farmPairName , project: "mole" })


    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 60, 240, undefined, { owned: false })
}



// vault.bind({ 
//   address: '0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f',
//   network: SuiNetwork.MAIN_NET,
//   // startCheckpoint: 4000000n
//   startCheckpoint: 11763619n
// })
//   .onEventDepositEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const amount = Number(event.data_decoded.amount) / Math.pow(10, coinInfo.decimal)
//       const share = Number(event.data_decoded.share) / Math.pow(10, coinInfo.decimal)
      
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const amount_usd = amount * price!

//       ctx.meter.Counter("vault_deposit_amount_usd").add(amount_usd, { coin_symbol,  project: "mole" })
//       ctx.meter.Counter("vault_deposit_counter").add(1, { coin_symbol,  project: "mole" })

//       ctx.eventLogger.emit("VaultDepositEvent", {
//         distinctId: event.sender,
//         amount: amount,
//         amount_usd: amount_usd,
//         share: share,
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

//       ctx.meter.Counter("vault_withdraw_amount_usd").add(amount_usd, { coin_symbol,  project: "mole" })
//       ctx.meter.Counter("vault_withdraw_counter").add(1, { coin_symbol,  project: "mole" })

//       ctx.eventLogger.emit("VaultWithdrawEvent", {
//         distinctId: event.sender,
//         amount: amount,
//         amount_usd: amount_usd,
//         share: share,
//         project: "mole"
//       })
//     },
//   )

  // .onEventAddDebtEvent(
  //   async (event, ctx) => {
  //     const coinType = event.type_arguments[0]

  //     const coinInfo = await buildCoinInfo(ctx, coinType)
  //     const coin_symbol = coinInfo.symbol

  //     const debt_share = Number(event.data_decoded.debt_share) / Math.pow(10, coinInfo.decimal)
      
  //     const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
  //     const debt_share_usd = debt_share * price!

  //     ctx.meter.Counter("vault_add_debt_share_usd").add(debt_share_usd, { coin_symbol,  project: "mole" })

  //     ctx.eventLogger.emit("VaultAddDebtEvent", {
  //       distinctId: event.sender,
  //       debt_share: debt_share,
  //       debt_share_usd: debt_share_usd,
  //       project: "mole"
  //     })
  //   },
  // )
  
//   .onEventRemoveDebtEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const debt_share = Number(event.data_decoded.debt_share) / Math.pow(10, coinInfo.decimal)
      
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const debt_share_usd = debt_share * price!

//       ctx.meter.Counter("vault_remove_debt_share_usd").add(debt_share_usd, {coin_symbol,  project: "mole" })

//       ctx.eventLogger.emit("VaultRemoveDebtEvent", {
//         distinctId: event.sender,
//         debt_share: debt_share,
//         debt_share_usd: debt_share_usd,
//         project: "mole"
//       })

//     },
//   )
  
//   .onEventWorkEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol

//       const loan = Number(event.data_decoded.loan) / Math.pow(10, coinInfo.decimal)
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
//       const loan_usd = loan * price!

//       ctx.meter.Counter("work_loan_usd").add(loan_usd, { coin_symbol,  project: "mole" })
//       ctx.meter.Counter("work_counter").add(1, { coin_symbol,  project: "mole" })

//       ctx.eventLogger.emit("VaultWorkerEvent", {
//         distinctId: event.sender,
//         loan: loan,
//         loan_usd: loan_usd,
//         project: "mole"
//       })

//     },
//   )

//   .onEventKillEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)
      
//       const debt = Number(event.data_decoded.debt) / Math.pow(10, coinInfo.decimal)

//       const posVal = Number(event.data_decoded.posVal) / Math.pow(10, coinInfo.decimal)
//       const posVal_usd = posVal * price!

//       const prize = Number(event.data_decoded.prize) / Math.pow(10, coinInfo.decimal)
      
//       ctx.meter.Counter("kill_posVal_usd").add(posVal_usd, { coin_symbol,  project: "mole" })
//       ctx.meter.Counter("kill_counter").add(1, { coin_symbol,  project: "mole" })

//       ctx.eventLogger.emit("VaultKillEvent", {
//         distinctId: event.sender,
//         debt: debt,
//         posVal: posVal,
//         posVal_usd: posVal_usd,
//         prize: prize,
//         project: "mole"
//       })
//     },
//   )
  
//   .onEventAddCollateralEvent(
//     async (event, ctx) => {
//       const coinType = event.type_arguments[0]

//       const coinInfo = await buildCoinInfo(ctx, coinType)
//       const coin_symbol = coinInfo.symbol
//       const price = await getPriceByType(SuiNetwork.MAIN_NET, coinType, ctx.timestamp)

//       const amount = Number(event.data_decoded.amount) / Math.pow(10, coinInfo.decimal)
//       const amount_usd = amount * price!

//       ctx.meter.Counter("add_collateral_amount_usd").add(amount_usd, { coin_symbol,  project: "mole" })

//       ctx.meter.Counter("add_collateral_counter").add(1, { coin_symbol,  project: "mole" })

//       ctx.eventLogger.emit("VaultAddCollateralEvent", {
//         distinctId: event.sender,
//         amount: amount,
//         amount_usd: amount_usd,
//         project: "mole"
//       })
//     },
//   )

