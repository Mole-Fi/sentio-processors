import { Counter, Gauge } from '@sentio/sdk'
import { SuiNetwork, SuiObjectProcessorTemplate, SuiObjectProcessor, SuiWrappedObjectProcessor} from "@sentio/sdk/sui"
import axiosInst from './utils/moleAxios.js'

SuiObjectProcessor.bind({
  objectId: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", // random fake id because no used in here
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 26720650n
})
.onTimeInterval(async (self, _, ctx) => {
  try {

    // get json data from mole
    const data_url = `https://app.mole.fi/api/SuiMainnet/data.json`
    const res = await axiosInst.get(data_url).catch(err => {
        console.error('get data error:', err)
    })
    if (!res) {
      console.error('data_get got no response')
    }

    const moleSuiIncentivePoolsData = res!.data.moleSuiIncentivePools  
    // console.log("moleSuiIncentivePoolsData", JSON.stringify(moleSuiIncentivePoolsData))

    for (let i = 0 ; i < moleSuiIncentivePoolsData.length; i++) {
      let coin_symbol = moleSuiIncentivePoolsData[i].symbol.toString().substr(1)
      const apy = moleSuiIncentivePoolsData[i].apy

      if (coin_symbol == "HASUI") {
        coin_symbol = "haSUI"
      }

      ctx.meter.Gauge("vaults_staking_apy").record(apy, { coin_symbol, project: "mole-apr-vaults" })
    }
  }
catch (e) {
      console.log(`${e.message} error at ${JSON.stringify(self)}`)
    }
  }, 30, 60, undefined, { owned: false })

