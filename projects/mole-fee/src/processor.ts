import { Counter, Gauge } from '@sentio/sdk'
import { SuiNetwork, SuiObjectProcessorTemplate, SuiObjectProcessor, SuiWrappedObjectProcessor} from "@sentio/sdk/sui"
import { vault } from './types/sui/0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f.js'

import { getPriceByType, token } from "@sentio/sdk/utils"
import { buildCoinInfo, getCoinAmountFromLiquidity, i32BitsToNumber, sleep, tickIndexToSqrtPriceX64} from './utils/mole_utils.js'
import * as constant from './utils/constant.js'
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else if (configAddr == vaultUsdcConfigId) {
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
          } else {
            console.error("CoinType not suppport!")
          }
        } else if (ctx.checkpoint >= 35481090 ) {
          if (configAddr == vaultWethConfigId) {
            accumulateFee = 0.00315804 + 0 + 0.09845773 + 0 + 0.00000013 + 0.00002272 + 0.00000006 + 0 + 0.00187223 
          } else if (configAddr == vaultHaSuiConfigId) {
            accumulateFee = 0 + 0 + 0 + 0 + 0.058995068 + 0 + 0 + 0 + 0.100466176 
          } else if (configAddr == vaultUsdtConfigId) {
            accumulateFee = 52.443544 + 158.347969 + 0 + 0.482047 + 0.247548 + 0.073082 + 0 + 0.143209 + 0.010165 
          } else if (configAddr == vaultUsdcConfigId) {
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
        ctx.meter.Gauge("savings_fee").record(savingsFee, { coin_symbol, project: "mole" })

        //@ts-ignore
        ctx.meter.Gauge("savings_fee_usd").record(savingsFeeUsd, { coin_symbol, project: "mole" })

      }
    }
    catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(dynamicFieldObjects)}`)
    }
  }, 60, 240, undefined, { owned: true })


