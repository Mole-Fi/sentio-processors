import { SuiObjectProcessor, SuiContext, SuiObjectContext } from "@sentio/sdk/sui"
import { getPriceByType, token } from "@sentio/sdk/utils"
import { SuiNetwork } from "@sentio/sdk/sui"
import BN from 'bn.js'
// import * as Decimal from 'decimal.js'
const Decimal = require("decimal.js")
import { MathUtil, ONE, U64_MAX, ZERO } from './utils.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_sui } from '../types/sui/0x334bed7f6426c1a3710ef7f4d66b1225df74146372b40a64e9d0cbfc76d76e67.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_wusdc } from '../types/sui/0x1454bd0be3db3c4be862104bde964913182de6d380aea24b88320505baba5e46.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdt_wusdc } from '../types/sui/0x9cb48aa1b41a1183ecdabde578e640e05a08170f8ca165b743ffded0b1256391.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_usdt } from '../types/sui/0x960ab11d560f05f0ec260c7ac87074b569334713594aa02580642e029fd9dd86.js'
import { cetus_clmm_worker as cetus_clmm_worker_weth_wusdc } from '../types/sui/0xb7a0d251a9f307b80b1595c87622118e401dc613591b3435786bb7c147599dae.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_weth } from '../types/sui/0xd49d0a3331bd41005dd1a5e295e07bf4cec1359e201ba71fc5a1e541787328d9.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdt_sui } from '../types/sui/0xab01c0cb01a3e50171b898eb2509f53ba2ba83ed844628f3d843b20e99783b58.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_usdt } from '../types/sui/0x8cc36eb225997a7e35661382b5ddfda35f91a7d732e04e22d203151a9e321d66.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_cetus } from '../types/sui/0x7f24e8b7935db7588bfd7035b4aa503c1f29ed71ce2b1dbd425b8ad1096b7463.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_sui } from '../types/sui/0x57563b5040ac32ff1897a3c40fe9a0e987f40791289fce31ff7388805255076d.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_wusdc } from '../types/sui/0xf538241fc4783dbf0eca4cf516fbc7ad5b910517e25d8e4ec7fb754eb9b0280c.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_cetus } from '../types/sui/0xd8528e2825b7354f5e4fd3bf89e3998e59f4cf92160d65bf491885677229def0.js'
import { cetus_clmm_worker as cetus_clmm_worker_hasui_sui } from '../types/sui/0x50be9b81baf7204130eea06bb1845d4a0beccbee98c03b5ec0b17a48302351bf.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_hasui } from '../types/sui/0xd5f6540d3d3fc7fd8ed64e862a21785932e84ee669fb2e7bbe5bd23fd6552827.js'
import { cetus_clmm_worker as cetus_clmm_worker_navx_sui } from '../types/sui/0x53e47bac30d4f17fcb0d800de9fc7f0cc96f520531bb8fd7670e9c08f060ec61.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_navx } from '../types/sui/0xd5b04240f6536c7b5276e96b057460a58ac8b1b66b2db03038f3d44bf1ea7cde.js'
import { cetus_clmm_worker as cetus_clmm_worker_navx_cetus } from '../types/sui/0x6665ad06bb0c47a00e3ce6da9c796f8061b9f8178095e421ce36e3f73345f24a.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_navx } from '../types/sui/0xf8670497cc6403831fad47f8471cce467661c3e01833953d62fe86527bbe4474.js'
import { cetus_clmm_worker as cetus_clmm_worker_sca_sui } from '../types/sui/0x0efca73a17c179aee1a5243c66c3f90101f61e9dd974e71b356ecdf0316ca626.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_sca } from '../types/sui/0x9a0355aa800e975678ce812d4ee044f3faa8b48c70d877f90d3ba8d35566e6aa.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_wbtc } from '../types/sui/0xff377a83375d63b9c8429362b5c2791bc69f0da861d3d963970ffeac2654d9d5.js'
import { cetus_clmm_worker as cetus_clmm_worker_wbtc_wusdc } from '../types/sui/0x15fbfe8c27c920baaa1e4bd8bfe05c4408311612baf6493ed3285c6bd95a6939.js'
import { cetus_clmm_worker as cetus_clmm_worker_buck_wusdc } from '../types/sui/0xcac7d10d73c3c32f6d40031c8639dfde168e6e1c0e4a86f8d23f21db60f97c94.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_buck } from '../types/sui/0xe6ba97715edd0cfe6a8e40654b37c6f46a8a8af5b7fe2eefa3fd713243857993.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_sui } from '../types/sui/0x1d25aa479630953f1313749759a476aa620ce65a3f2eab7a2e52a3a5e1e6e797.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_usdc } from '../types/sui/0x6e30dd0792fc4232e40cbbff861ece3c0a029d431cc3a62c5c46031524c2c91a.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_usdt } from '../types/sui/0xf74d70ad742dcbb0f75dc75312b3e7f2a5dd0b9f01634565289cbb6a6eb812c0.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdt_usdc } from '../types/sui/0x76e6fd74c625e04879d0aefdd8bbae10a836504ef0d41e6124b0e965dcec8683.js'
import { cetus_clmm_worker as cetus_clmm_worker_cetus_usdc } from '../types/sui/0xe77bf63a6b95ce64a04c156a27c69e3ae4f823773fa9dc441c854d106ae21fda.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_cetus } from '../types/sui/0xbeae77b098564b7e62be51527b71300759014085c8ce849f2726397a5fcc411d.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_wusdc } from '../types/sui/0xe6cc53c3778e022568b546411bdd7011d3112660dae8a6f118ff2c460522866d.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_usdc } from '../types/sui/0xdcb271ff2e80185557d651707aeaaa21f899cb8de9be9c2fb4efef9c9500f6d9.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_buck } from '../types/sui/0x3001c0d95f0498b8e92fe95878b25e1c2e85ff213f3ff5b1ef088390ed185fc1.js'
import { cetus_clmm_worker as cetus_clmm_worker_buck_usdc } from '../types/sui/0x0ffcc188b67223e6e883bc8e997e051af38657699d7ba745e43e8489b6104cdc.js'
import { cetus_clmm_worker as cetus_clmm_worker_buck_sui } from '../types/sui/0x19252be299bb3a9202f308077042d01df6126d8c571a021069313860db2c1294.js'
import { cetus_clmm_worker as cetus_clmm_worker_sui_buck } from '../types/sui/0xb34ffeebd804d18b0e3537dab0f46c81f6f32a3f61b78ec4207dde8205e81aaa.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_wusdc_new } from '../types/sui/0x5d8c52a3bc49d7d33eacd754a03b255f789484df4872863aff74f004d3ba76f7.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_usdc_new } from '../types/sui/0x8a53585a00bb54ce21c618e21ec135420814fc36857625c2a004c3dd2c26405e.js'
import { cetus_clmm_worker as cetus_clmm_worker_buck_wusdc_new } from '../types/sui/0x12403855fe4d02bec07d72c24614a3ded445d84acef96a1bccd33bea252e0540.js'
import { cetus_clmm_worker as cetus_clmm_worker_wusdc_buck_new } from '../types/sui/0x1da9b36af87eba57e751075851cb57742c7eeb8e051eaa548b583d3fff2a9778.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_suiusdt } from '../types/sui/0x4633d7f3b557b5ad474e89d6c0944eb53c779032304b2cf70c5c18a85f62a6bb.js'
import { cetus_clmm_worker as cetus_clmm_worker_suiusdt_usdc } from '../types/sui/0x94d42a393f936278b43aca8b84ab6d7fafb975e1b7447cf007434bc75695bc02.js'
import { cetus_clmm_worker as cetus_clmm_worker_fdusd_usdc_1 } from '../types/sui/0xb798abb6b58cc8249f990efab7c4cb4ea7aac5381483bd6227a22b7c63c7049f.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_fdusd_1 } from '../types/sui/0x24c09811579babe09ab20b57abd05a9b4e0b1f8305a4703e9904d1febf2c6f17.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_fdusd_2 } from '../types/sui/0x51ebf6d04276789280e1e989c5b0a6fd294b14057cac6e97dea312711839accc.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_fdusd_3 } from '../types/sui/0xff4ee0420e38a1297897fbe81641ed68d0b3269d18a1a8464e8e524708cd19f6.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_fdusd_4 } from '../types/sui/0xa74bf537fa017b0c6e3fe17caa2f9ed0ab56abd0ed07c8b468b90ebf66e0b109.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_fdusd_5 } from '../types/sui/0x4bf061b312428370109d4f423a85b94383a4c6d933212fd0ad1ea5fdcf396a3a.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_fdusd_6 } from '../types/sui/0xa94582b61c32e1e8ff5b60abb14d1d298521ea11087ab7be63f0063a59277724.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_usdy } from '../types/sui/0x8a98a9695f8b837b07a179bda9b799f26da64d5ba341ae46d140b63efcde0a0c.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdy_usdc } from '../types/sui/0x94774dcedb00c8c5e216c097d28de663250fbeb38ec57068d898556f5d37b21f.js'
import { stable_farming_worker as stable_farm_worker_hasui_sui } from '../types/sui/0xea6eb8e27a67480e644ead355839448b016a40c0c10865e1e26af5d981257875.js'
import { stable_farming_worker as stable_farm_worker_sui_hasui } from '../types/sui/0x8f5ad71b20e3a435ef92828c782e459a0428ed125e932ddbb8b6842eaea354ee.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_suiusdt_2 } from '../types/sui/0x36fd94fb0f54d5407d6fed7706bbc53250bb3b1046f2de7ac610253cc9154b27.js'
import { cetus_clmm_worker as cetus_clmm_worker_suiusdt_usdc_2 } from '../types/sui/0x4c63cd45650ddd17468b1e7ab9d29f8ef86b777ed04809224ca4e7f05f947de3.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_ausd } from '../types/sui/0x3a930f2f5c38bbc06a7d4fcd2b2f99d7ccfdd991e71da7657c958a1609ef2e7d.js'
import { cetus_clmm_worker as cetus_clmm_worker_ausd_usdc } from '../types/sui/0x4fbc6de90da76533a7b9a6dcd681ef9deab239e74fc07c4189d3b7665592bed0.js'
import { cetus_clmm_worker as cetus_clmm_worker_usdc_suiusdt_2_after_cetus } from '../types/sui/0x96e3e2a52e3b761ada5d302dbfbb06663658174574f42832b301ac25ed7eb5b0.js'
import { cetus_clmm_worker as cetus_clmm_worker_suiusdt_usdc_2_after_cetus } from '../types/sui/0x58280a47c88b3b6d8c8c23546a8602a9569e31d4c139b6370847a6a807883614.js'
import{ cetus_clmm_worker as cetus_clmm_worker_buck_usdc_after_cetus } from '../types/sui/0x4a4ec5f644b819c263189a61052a7af575ddabf2a9ce1e9f1407a84e190dd694.js'
import{ cetus_clmm_worker as cetus_clmm_worker_usdc_buck_after_cetus } from '../types/sui/0xde149300b8cb351f1adb042918b27b77bc7de73827fe7b14f65ae060022d9b66.js'
import { stable_farming_worker as stable_farm_worker_hasui_sui_after_cetus } from '../types/sui/0x71f8de86a9fa5f1e6bdba87dd1982e989f63d8d54e5a3b28601ac8de8b17724d.js'
import { stable_farming_worker as stable_farm_worker_sui_hasui_after_cetus } from '../types/sui/0x1cfcbaeb7d8e53ca9db19b9e1fc928f16d5e35817c86b03307a4ed50e29c7517.js'
import { bluefin_clmm_worker as bluefin_worker_suiusdt_usdc } from '../types/sui/0x48cf4e3ace7c371fd49700d8383300111a0352b8ecf6622eefcd72bacc4ec30d.js'
import { bluefin_clmm_worker as bluefin_worker_usdc_suiusdt } from '../types/sui/0x57c7150eee9676d63fda730eba275c243be45219dc24c83cfab0897ce6ab6184.js'
import { bluefin_clmm_worker as bluefin_worker_stsui_sui } from '../types/sui/0x49edcb8c45b9a1f5de8d3a7bce497828a52ed05f643acae2488e02a7696dd3f6.js'
import { bluefin_clmm_worker as bluefin_worker_sui_stsui } from '../types/sui/0x3feb7079f05c8a5a533690839168b20bd3d782009635308ab364d812f7f3b428.js'
import { bluefin_clmm_worker as bluefin_worker_buck_usdc } from '../types/sui/0x184c2043d71874b3038e12bafa614ab262e3937aa3a753fa8edde4befa5790fc.js'
import { bluefin_clmm_worker as bluefin_worker_lbtc_suiwbtc } from '../types/sui/0x93c062d2672a7090758406070a7df48e17a9a6c633014049d8f578bbcff943f0.js'
import { bluefin_clmm_worker as bluefin_worker_usdc_suiusdt_2 } from '../types/sui/0xa536ee4488c7b4ce968d94925928b88df3d3fa0e01a134a285c1e00c830fd985.js'

export const vaultWethConfigId = "0x7fa4aa18fc4488947dc7528b5177c4475ec478c28014e77a31dc2318fa4f125e"
export const vaultHaSuiConfigId = "0xa069ec74c6bb6d6df53e22d9bf00625a3d65da67c4d9e2868c8e348201251dd0"
export const vaultUsdtConfigId = "0x355915a87a910908ef1ccc1cbad290b07fa01bd0d5f3046f472a1ef81842c04b"
export const vaultwUsdcConfigId = "0xe684f8509e90bfc1fe9701266a40d641e80691f0d05dc09cfd9c56041099cc39"
export const vaultCetusConfigId = "0x4389f5425b748b9ddec06730d8a4376bafff215f326b18eccb3dd3b2c4ef7e4f"
export const vaultSuiConfigId = "0x6ae14611cecaab94070017f4633090ce7ea83922fc8f78b3f8409a7dbffeb9a4"
export const vaultNavxConfigId = "0x8038c996731d6ea078c39be7cb7ac8ed6eec9cfe0299aefcf480c9e286c87af6"
export const vaultScaConfigId = "0xd7ca39d682822b26e032079b723807e1bb2e90150c40eada7a104832e9e6c47f"
export const vaultWbtcConfigId = "0xf19fcfcd8da9837580cd0737ef626ac077a5ce33f703d25c990a3c49d888b4f6"
export const vaultBuckConfigId = "0x73903c5c973f62ab68acdfbd53b17dad2b9be586605664e192cebcb1f3a3f1a2"
export const vaultUsdcConfigId = "0xbcdd5cd88604d4a14f937a88e0560d906592dbbf153de9ee3417609daff864c6"
export const vaultsuiUsdtConfigId = "0x8684d2479db1042d9a265295dc63d4bafe830485d80fcde8a2d65ec62a44bf9c"
export const vaultFdusdConfigId = "0x34d62447780baa85107d348d488c330be533d06bc088e428ac6a4cf1aba4ec4a"
export const vaultUsdyConfigId = "0xcbb5371c5b08d32a33736b4f87e53bc5b816d60a833cab3513c4ecde5d56e93c"
export const vaultAusdConfigId = "0x7175652178d7a652c8d459f19605e2b2a1ed76d1f9c867770eb10dbcf61b6865"
export const vaultStSuiConfigId = "0x87855e5b38a89610c0a0175e14b69a5fc9b22e07272cea18d1d087ea1af4ae58"
export const vaultLbtcConfigId = "0xbe1ad3774e39a6b862d004078b5ea8ab7911fb77a55d216817fb6eeae234124e"
export const vaultsuiWBTCConfigId = "0xcbc0e2ce6c964d41a116bc536b313b22135930dc145b48bfb38a3a79681800ed"

export const coinAddrSUI = "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
export const coinAddrUSDT = "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN"
export const coinAddrwUSDC = "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN"
export const coinAddrWETH = "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN"
export const coinAddrCETUS = "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS"
export const coinAddrHASUI = "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI"
export const coinAddrNAVX = "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX"
export const coinAddrSCA = "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA"
export const coinAddrWBTC = "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN"
export const coinAddrBUCK = "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK"
export const coinAddrUSDC = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
export const coinAddrsuiUSDT = "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT"
export const coinAddrFDUSD = "0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD"
export const coinAddrUSDY = "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY"
export const coinAddrAUSD = "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD"
export const coinAddrSTSUI = "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI"
export const coinAddrBLUE = "0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE"
export const coinAddrxSUI = "0x2b6602099970374cf58a2a1b9d96f005fccceb81e92eb059873baf420eb6c717::x_sui::X_SUI"
export const coinAddrLBTC = "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC"
export const coinAddrsuiWBTC = "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC"
export const coinAddrDEEP = "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"


export async function buildCoinInfo(ctx: SuiContext | SuiObjectContext, coinAddress: string): Promise<token.TokenInfo> {
  let [symbol, name, decimal] = ["unk", "unk", 0]
  try {
    const metadata = await ctx.client.getCoinMetadata({ coinType: coinAddress })
    //@ts-ignore
    symbol = metadata.symbol
    //@ts-ignore
    decimal = metadata.decimals
    //@ts-ignore
    name = metadata.name
    console.log(`build coin metadata ${symbol} ${decimal} ${name}`)
  }
  catch (e) {
    console.log(`${e.message} get coin metadata error ${coinAddress}`)
  }

  return {
    symbol,
    name,
    decimal
  }
}

export function asIntN(int: bigint, bits?: number): number {
  return Number(BigInt.asIntN(bits!, BigInt(int)));
}

export function i32BitsToNumber(v: number | bigint | string): number {
  return asIntN(BigInt(v), 32);
}

export type CoinAmounts = {
  coinA: BN
  coinB: BN
}

/**
 * Get token amount fron liquidity.
 * @param liquidity - liquidity
 * @param curSqrtPrice - Pool current sqrt price
 * @param lowerPrice - lower price
 * @param upperPrice - upper price
 * @param roundUp - is round up
 * @returns
 */
export function getCoinAmountFromLiquidity(liquidity: BN, curSqrtPrice: BN, lowerPrice: BN, upperPrice: BN, roundUp: boolean): CoinAmounts {
  console.log("enter getCoinAmountFromLiquidity")

  const liq = new Decimal(liquidity.toString())

  const curSqrtPriceStr = new Decimal(curSqrtPrice.toString())
  const lowerPriceStr = new Decimal(lowerPrice.toString())
  const upperPriceStr = new Decimal(upperPrice.toString())

  // console.log("liq:", liq, ",curSqrtPriceStr:", curSqrtPriceStr, ",lowerPriceStr:", lowerPriceStr, ",upperPriceStr:", upperPriceStr)

  let coinA
  let coinB
  if (curSqrtPrice.lt(lowerPrice)) {
    coinA = MathUtil.toX64_Decimal(liq).mul(upperPriceStr.sub(lowerPriceStr)).div(lowerPriceStr.mul(upperPriceStr))
    coinB = new Decimal(0)
  } else if (curSqrtPrice.lt(upperPrice)) {
    coinA = MathUtil.toX64_Decimal(liq).mul(upperPriceStr.sub(curSqrtPriceStr)).div(curSqrtPriceStr.mul(upperPriceStr))
    coinB = MathUtil.fromX64_Decimal(liq.mul(curSqrtPriceStr.sub(lowerPriceStr)))
  } else {
    coinA = new Decimal(0)
    coinB = MathUtil.fromX64_Decimal(liq.mul(upperPriceStr.sub(lowerPriceStr)))
  }
  // console.log("coinA:", coinA, ", coinB:", coinB)

  if (roundUp) {
    return {
      coinA: new BN(coinA.ceil().toString()),
      coinB: new BN(coinB.ceil().toString()),
    }
  }
  return {
    coinA: new BN(coinA.floor().toString()),
    coinB: new BN(coinB.floor().toString()),
  }
}



export function tickIndexToSqrtPriceX64(tickIndex: number): BN {
  if (tickIndex > 0) {
    return new BN(tickIndexToSqrtPricePositive(tickIndex))
  }
  return new BN(tickIndexToSqrtPriceNegative(tickIndex))
}


function signedShiftRight(n0: BN, shiftBy: number, bitWidth: number) {
  const twoN0 = n0.toTwos(bitWidth).shrn(shiftBy)
  twoN0.imaskn(bitWidth - shiftBy + 1)
  return twoN0.fromTwos(bitWidth - shiftBy)
}

function tickIndexToSqrtPricePositive(tick: number) {
  let ratio: BN

  if ((tick & 1) !== 0) {
    ratio = new BN('79232123823359799118286999567')
  } else {
    ratio = new BN('79228162514264337593543950336')
  }

  if ((tick & 2) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79236085330515764027303304731')), 96, 256)
  }
  if ((tick & 4) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79244008939048815603706035061')), 96, 256)
  }
  if ((tick & 8) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79259858533276714757314932305')), 96, 256)
  }
  if ((tick & 16) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79291567232598584799939703904')), 96, 256)
  }
  if ((tick & 32) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79355022692464371645785046466')), 96, 256)
  }
  if ((tick & 64) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79482085999252804386437311141')), 96, 256)
  }
  if ((tick & 128) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('79736823300114093921829183326')), 96, 256)
  }
  if ((tick & 256) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('80248749790819932309965073892')), 96, 256)
  }
  if ((tick & 512) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('81282483887344747381513967011')), 96, 256)
  }
  if ((tick & 1024) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('83390072131320151908154831281')), 96, 256)
  }
  if ((tick & 2048) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('87770609709833776024991924138')), 96, 256)
  }
  if ((tick & 4096) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('97234110755111693312479820773')), 96, 256)
  }
  if ((tick & 8192) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('119332217159966728226237229890')), 96, 256)
  }
  if ((tick & 16384) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('179736315981702064433883588727')), 96, 256)
  }
  if ((tick & 32768) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('407748233172238350107850275304')), 96, 256)
  }
  if ((tick & 65536) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('2098478828474011932436660412517')), 96, 256)
  }
  if ((tick & 131072) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('55581415166113811149459800483533')), 96, 256)
  }
  if ((tick & 262144) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('38992368544603139932233054999993551')), 96, 256)
  }

  return signedShiftRight(ratio, 32, 256)
}


function tickIndexToSqrtPriceNegative(tickIndex: number) {
  const tick = Math.abs(tickIndex)
  let ratio: BN

  if ((tick & 1) !== 0) {
    ratio = new BN('18445821805675392311')
  } else {
    ratio = new BN('18446744073709551616')
  }

  if ((tick & 2) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18444899583751176498')), 64, 256)
  }
  if ((tick & 4) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18443055278223354162')), 64, 256)
  }
  if ((tick & 8) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18439367220385604838')), 64, 256)
  }
  if ((tick & 16) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18431993317065449817')), 64, 256)
  }
  if ((tick & 32) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18417254355718160513')), 64, 256)
  }
  if ((tick & 64) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18387811781193591352')), 64, 256)
  }
  if ((tick & 128) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18329067761203520168')), 64, 256)
  }
  if ((tick & 256) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('18212142134806087854')), 64, 256)
  }
  if ((tick & 512) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('17980523815641551639')), 64, 256)
  }
  if ((tick & 1024) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('17526086738831147013')), 64, 256)
  }
  if ((tick & 2048) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('16651378430235024244')), 64, 256)
  }
  if ((tick & 4096) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('15030750278693429944')), 64, 256)
  }
  if ((tick & 8192) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('12247334978882834399')), 64, 256)
  }
  if ((tick & 16384) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('8131365268884726200')), 64, 256)
  }
  if ((tick & 32768) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('3584323654723342297')), 64, 256)
  }
  if ((tick & 65536) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('696457651847595233')), 64, 256)
  }
  if ((tick & 131072) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('26294789957452057')), 64, 256)
  }
  if ((tick & 262144) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN('37481735321082')), 64, 256)
  }

  return ratio
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMTokenByToken(tokenAddr: string) {
  if (tokenAddr == "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN>", "mWETH"]
  } else if (tokenAddr == "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI>", "mhaSUI"]
  } else if (tokenAddr == "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN") {
    return ["0x73d1303f840a45b97f72f8c9950383576f033423c12b1ff4882bc86acb971b74::vault::MagicCoin<0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN>", "mUSDT"]
  } else if (tokenAddr == "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>", "mwUSDC"]
  } else if (tokenAddr == "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS>", "mCETUS"]
  } else if (tokenAddr == "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    || tokenAddr == "0x2::sui::SUI"
  ) {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x2::sui::SUI>", "mSUI"]
  } else if (tokenAddr == "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX>", "mNAVX"]
  } else if (tokenAddr == "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA>", "mSCA"]
  } else if (tokenAddr == "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN>", "mWBTC"]
  } else if (tokenAddr == "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK>", "mBUCK"]
  } else if (tokenAddr == "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC>", "mUSDC"]
  } else if (tokenAddr == "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT>", "msuiUSDT"]
  } else if (tokenAddr == "0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD>", "mFDUSD"]
  } else if (tokenAddr == "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY>", "mUSDY"]
  } else if (tokenAddr == "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD>", "mAUSD"]
  } else if (tokenAddr == "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI>", "mstSUI"]
  } else if (tokenAddr == "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC>", "mLBTC"]
  } else if (tokenAddr == "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC") {
    return ["0x5ffa69ee4ee14d899dcc750df92de12bad4bacf81efa1ae12ee76406804dda7f::vault::MagicCoin<0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC>", "msuiWBTC"] 
  } else {
    console.error("No tokens here for token:", tokenAddr)
    return ["", ""]
  }
}


export function getPoolByToken(tokenAddr: string) {
  if (tokenAddr == "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN") {
    return "0xb7add6a35eb25816cde2a6b92e14311ac61a89eaff067296045f0fadca9f2fb4"
  } else if (tokenAddr == "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI") {
    return "0x73152942b8553574900497947532e55ad8cc4ec614b0d084497d5a78a8a3534d"
  } else if (tokenAddr == "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN") {
    return "0xab8160b2f3a06dca53c772d636aebed3036a1531f8e284f3b21a5f5c46d36af7"
  } else if (tokenAddr == "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN") {
    return "0x1196b890f964726e46e875a2eae749f0d66dc22995378b7936e5de2aed115652"
  } else if (tokenAddr == "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS") {
    return "0xd7617ae3d8613841ed7bb46daf19948c4c0d11a4f5afaa42db36acc329961ef8"
  } else if (tokenAddr == "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    || tokenAddr == "0x2::sui::SUI"
  ) {
    return "0x2f260a4a594868f1ce3ab0b9edd77757ac3fcbea8b6aa2b5f99b65599461bf6a"
  } else if (tokenAddr == "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX") {
    return "0x3d3423308d31ee3146682eb19cfd16330b9e83ba33c61c5bd358cb776bcd4ca7"
  } else if (tokenAddr == "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA") {
    return "0x0e1030efcee97609e2ff908da4ea91ad686ad4e399e25e23c8d81058c264354f"
  } else if (tokenAddr == "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN") {
    return "0xe6915c79ad51dc0982c02a91ef27f7a162186028f0f9bc317108af5aa5f3efd7"
  } else if (tokenAddr == "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK") {
    return "0x9aa2a2dd1511243c00c25702b38b04049a5a701d8decc71be04cc150e43cb283"
  } else if (tokenAddr == "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC") {
    return "0x0d28f718921470e88da9339b8c24fdba93757da3f036e8736f7fbe1ca6fe53eb"
  } else if (tokenAddr == "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT") {
    return "0xc2b6eff113d09a84bfda3fd094fd9ae09bec47a04f5759bc68cfc84d83cfbc19"
  } else if (tokenAddr == "0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD") {
    return "0x62bd16f6223faa02654707191b77bfdfc1f8a7fa227ec1942eb01399e6d995ce"
  } else if (tokenAddr == "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY") {
    return "0x7f66bc04d50f5131bb5f62495addf7aaef58da7127007dfbe7526e818c5df639"
  } else if (tokenAddr == "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD") {
    return "0x7396194c82d912112feb548a092c92e385aa955a0af55ddf85f9e0df5a1553ab"
  } else if (tokenAddr == "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI") {
    return "0xf425e479d5c78e05785e8a015d62ad98f4f63f9cf030d4b2e7623a616ca9701e"
  } else if (tokenAddr == "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC") {
    return "0x6220cca96912eb9e3781d35c5ea6440455aefc5babad49abba33d5cf514de941"
  } else if (tokenAddr == "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC") {
    return "0x8c853ef76ed37f09b948ec32ccc50c839d884ffb55ec2113b9a46d4da7764711"
  } else {
    console.error("No tokens here, token: ", tokenAddr)
    return
  }
}


export function getPoolInfoByPoolId(poolId: string) {
  if (poolId == "0") {
    return ["0x2f260a4a594868f1ce3ab0b9edd77757ac3fcbea8b6aa2b5f99b65599461bf6a", "SUI"]
  } else if (poolId == "1") {
    return ["0x1196b890f964726e46e875a2eae749f0d66dc22995378b7936e5de2aed115652", "wUSDC"]
  } else if (poolId == "2") {
    return ["0xab8160b2f3a06dca53c772d636aebed3036a1531f8e284f3b21a5f5c46d36af7", "USDT"]
  } else if (poolId == "3") {
    return ["0xb7add6a35eb25816cde2a6b92e14311ac61a89eaff067296045f0fadca9f2fb4", "WETH"]
  } else if (poolId == "4") {
    return ["0xd7617ae3d8613841ed7bb46daf19948c4c0d11a4f5afaa42db36acc329961ef8", "CETUS"]
  } else if (poolId == "5") {
    return ["0x73152942b8553574900497947532e55ad8cc4ec614b0d084497d5a78a8a3534d", "haSUI"]
  } else if (poolId == "6") {
    return ["0x3d3423308d31ee3146682eb19cfd16330b9e83ba33c61c5bd358cb776bcd4ca7", "NAVX"]
  } else if (poolId == "7") {
    return ["0x0e1030efcee97609e2ff908da4ea91ad686ad4e399e25e23c8d81058c264354f", "SCA"]
  } else if (poolId == "8") {
    return ["0xe6915c79ad51dc0982c02a91ef27f7a162186028f0f9bc317108af5aa5f3efd7", "WBTC"]
  } else if (poolId == "9") {
    return ["0x9aa2a2dd1511243c00c25702b38b04049a5a701d8decc71be04cc150e43cb283", "BUCK"]
  } else if (poolId == "10") {
    return ["0x0d28f718921470e88da9339b8c24fdba93757da3f036e8736f7fbe1ca6fe53eb", "USDC"]
  } else if (poolId == "11") {
    return ["0xc2b6eff113d09a84bfda3fd094fd9ae09bec47a04f5759bc68cfc84d83cfbc19", "suiUSDT"]
  } else if (poolId == "12") {
    return ["0x62bd16f6223faa02654707191b77bfdfc1f8a7fa227ec1942eb01399e6d995ce", "FDUSD"]
  } else if (poolId == "13") {
    return ["0x7f66bc04d50f5131bb5f62495addf7aaef58da7127007dfbe7526e818c5df639", "USDY"]
  } else if (poolId == "14") {
    return ["0x7396194c82d912112feb548a092c92e385aa955a0af55ddf85f9e0df5a1553ab", "AUSD"]
  } else if (poolId == "15") {
    return ["0xf425e479d5c78e05785e8a015d62ad98f4f63f9cf030d4b2e7623a616ca9701e", "stSUI"]
  } else if (poolId == "16") {
    return ["0x6220cca96912eb9e3781d35c5ea6440455aefc5babad49abba33d5cf514de941", "LBTC"]
  } else if (poolId == "17") {
    return ["0x8c853ef76ed37f09b948ec32ccc50c839d884ffb55ec2113b9a46d4da7764711", "suiWBTC"]
  } else {
    console.error("No pool in here , pid: ", poolId)
    return ["", ""]
  }
}

export function getShareObjectByWorkerInfo(workerInfoAddr: string) {
  let sharesObjectId
  if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") {
    sharesObjectId = "0x313b52007f7c1dfc2fc05f7f92b9ea40995b585084f4741fd3a3cc6621eaf22e"
  } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") {
    sharesObjectId = "0xb7c02230538f92a16b74a39d7db0f0ff488e7983ab98924e4236f805d3ca7c45"
  } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") {
    sharesObjectId = "0xfa9779cb9d7b80d39943f6372d95b9ef108cd712db1c08a076cebb7eb58e1649"
  } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") {
    sharesObjectId = "0x9fcba7c93df2b064ecbefff5ee3fafe259cb88f4ea2d69d0469816d10821e8ff"
  } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") {
    sharesObjectId = "0x418ccd9e18ce730c00790e2f5acc507fa3c849ee347ae0a1e9146f5ebe2a4383"
  } else if (workerInfoAddr == "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") {
    sharesObjectId = "0x47c269b9ed5600939b0c9c7cdfdd9c341fa023b7313dcce42bef6290185bf78e"
  } else if (workerInfoAddr == "0x9a510e18c37df3d9ddfe0b2d6673582f702bf281116a4ee334f7ef3edfa2b9ab") {
    sharesObjectId = "0x11a4f00c53db5e250d9094b853c7d50a3f8d69ba8064c83d7f64151906179694"
  } else if (workerInfoAddr == "0xcd00ff33e9a71ea807f41641d515449263a905a850a4fd9c4ce03203c0f954b5") {
    sharesObjectId = "0x10c0fa51fd317059b6fce4a9cd995958806638a8e3dee247862fde7c05e9b1fc"
  } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") {
    sharesObjectId = "0x3cd8123a3dd02a97167b060b442c8e0d56d4ec9016c4d8d3c6b72ed6ea658eaa"
  } else if (workerInfoAddr == "0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb") {
    sharesObjectId = "0x8e768ecac5f83640ba732acebe5c6b98ec366e76a52ab56451bbeda343314d04"
  } else if (workerInfoAddr == "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") {
    sharesObjectId = "0xfcaa76eb43f12bcc68c628e6ed6c9d9df8775d2bed872e00fef95bf376784957"
  } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") {
    sharesObjectId = "0x470489b02bbc1076649203decff132be108c81b1d92d6ea3055400e78e5e0a8b"
  } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") {
    sharesObjectId = "0xf70870c29c12e9eff9fc965f8eaab2ec486681e7c4491c6ee708f5c98a6f690f"
  } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") {
    sharesObjectId = "0xc59fcf91ef1c421584b8c7422dc6a56447662d449102513d6cd37f2718df7445"
  } else if (workerInfoAddr == "0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1") {
    sharesObjectId = "0xfd9925ad66d77f06571f9cb238510de8a4a727886f3cdcc5a1f67210818d1c31"
  } else if (workerInfoAddr == "0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e") {
    sharesObjectId = "0x32fbc568390dafa33f9c3ffd105dbf7e5babdc9c287a0149346956b0eefaa3d3"
  } else if (workerInfoAddr == "0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d") {
    sharesObjectId = "0x119940f6c7de23caa4fe7113e1e521edaa93abe20535c372e45f0de2d8dae936"
  } else if (workerInfoAddr == "0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6") {
    sharesObjectId = "0x41ed29ff5453492acdfd8a802dc0afe27bddd7342b1d87cb9dabe652bbdfcce8"
  } else if (workerInfoAddr == "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") {
    sharesObjectId = "0xf0b737cac91c98cae368f5d1fe834b73b0b574b4b82eed52e2498339f2c2c6b4"
  } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") {
    sharesObjectId = "0xf3568689094cdac5701f3c055217e8c256e3330a24dee64b37e0f57c21f3b4e2"
  } else if (workerInfoAddr == "0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a") {
    sharesObjectId = "0xb7da6d59aabaee60068e990cfc19105faa374d3e338fed9efa31a6d2172c4d0c"
  } else if (workerInfoAddr == "0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac") {
    sharesObjectId = "0xd696f8bb15fa226e8672b102af2b9aec3e086e42aadef73993671cb28cdc341a"
  } else if (workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce") {
    sharesObjectId = "0x05c631d9f43671c9880780b00c058ffddef1d177fa316465266b6ca82a10396b"
  } else if (workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659") {
    sharesObjectId = "0x728a8f5e8cef251e106dfaa28a51181799e078b93859933362b18d0be1daab25"
  } else if (workerInfoAddr == "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") {
    sharesObjectId = "0x875a9ef44fff04ec124e2ee67ea0afb72a58cce6e549ac9f76e2ff6c3e47df7d"
  } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") {
    sharesObjectId = "0x500fd3d0d6e4dfef2b1bc7eea2ad7178893952a6286479126a0ad2b328188ec5"
  } else if (workerInfoAddr == "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") {
    sharesObjectId = "0x8d67a5616afcd1f8c97b2f8108240a74bd8794e4d4aa9c7d154cfadc7aa857da"
  } else if (workerInfoAddr == "0x354808fb8a29a59e35e2d9bf06892eb913d750796b71b5f72efa6cd9d5dbbc27") {
    sharesObjectId = "0xebb08d51d0c1ae4206320c209d19f614262a9ba6a96e4358d229d08548f40f7b"
  } else if (workerInfoAddr == "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") {
    sharesObjectId = "0x66837d2e831fbc35fab0c6823e2aea59ae13c370dd3881483f786d9c1873d32a"
  } else if (workerInfoAddr == "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") {
    sharesObjectId = "0xf1424e961de709091037b0f8e21bf8c670d68c7d4274fddad8db5d77d1988514"
  } else if (workerInfoAddr == "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") {
    sharesObjectId = "0xd13e93b7342e95e7a7707ee361ce609e7d2fba122d5b4cc9ee264ee70f5fe7e4"
  } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") {
    sharesObjectId = "0x08480d511e669fe187fe8628aac5626cad8c925f1505eab655c30cd2f943de8f"
  } else if (workerInfoAddr == "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") {
    sharesObjectId = "0xb0fe872b16f5bd9c271822cef20c6a0d58ba22da517d19d4a4f520d9b760865d"
  } else if (workerInfoAddr == "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") {
    sharesObjectId = "0xaa9f248abba7da474e4b8401010c6eca7811c086b7e12994d0a745e41d2269fe"
  } else if (workerInfoAddr == "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") {
    sharesObjectId = "0x5d5a89a9d594cebecf3baa549755121914ad0528c715722305d079fa524c88ad"
  } else if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") {
    sharesObjectId = "0xf51c14652806637d93df5c431d6b9bbd7bcd005d67418c088ed535a43345adda"
  } else if (workerInfoAddr == "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a") {
    sharesObjectId = "0x6c458205b5c4e520471fa4bff5cd123ac824fd43d6e17ccedd54abf1f419a108"
  } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") {
    sharesObjectId = "0xe3d6166ffe5e9b3a3a0dff1051a6cf6d777cd1fc2713e3ff6cd592b069eef4ea"
  } else if (workerInfoAddr == "0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2") {
    sharesObjectId = "0xc7df886d53793eafa159d932feeb46f812ad8ffe4d1052adcf5d3ed71138db88"
  } else if (workerInfoAddr == "0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1") {
    sharesObjectId = "0xaa21e1580b5b32e885a2daff149a2f04d100ed038980c745bb8cd6f3cddd30bb"
  } else if (workerInfoAddr == "0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd") {
    sharesObjectId = "0x6b535e5d736b803663a91b19ea9c8dc644c97f101219b0e1428e45fa1d90098f"
  } else if (workerInfoAddr == "0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3") {
    sharesObjectId = "0x392d1f842f815b0b89ea1fab87e6a74364e54f1acfd5d320b6e97a84d7926526"
  } else if (workerInfoAddr == "0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395") {
    sharesObjectId = "0x85e4c4d757f9faf8b4fd0911bfcee1b47500b4a8da309fd97d5adb3cdea657c6"
  } else if (workerInfoAddr == "0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0") {
    sharesObjectId = "0xeb104c387b80813f31241f779f8523fb519ec13a32bbe17608975e6ddc3e9243"
  } else if (workerInfoAddr == "0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca") {
    sharesObjectId = "0x945bd9bd4c38d026ecf80e6597d0ca99fe9609278b2223af0c7312362533bdfa"
  } else if (workerInfoAddr == "0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843") {
    sharesObjectId = "0xecfbcc9a16c41ab88ffc5bb2ade604c03fcb975e9317b311a0789061083645ce"
  } else if (workerInfoAddr == "0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c") {
    sharesObjectId = "0x0fec6462aa3a180373b859e0616b523fd64c24b5cd9752b7cffd97df5060a222"
  } else if (workerInfoAddr == "0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90") {
    sharesObjectId = "0xaeb4ad2d5be276ce301beed0e919caa5e9e65b8269abfcbea84983e1aa91ca30"
  } else if (workerInfoAddr == "0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98") {
    sharesObjectId = "0xa6e7d41486cd667d4fc89d75b76b72a33bf6510c71bbf6c8621757a9f119e34b"
  } else if (workerInfoAddr == "0xf823b1460defefa6f3923e4f4eb93795f421756de29afed344ddd6d6dd91be29") {
    sharesObjectId = "0xf2d027b895766ae39017e64fc820fccd5f62c00a0c3c8b1c387f2457272c980e"
  } else if (workerInfoAddr == "0x3ef9304468faecfaf7d2317960b9e69fb85ea2610cc089244f3c0d54abf167e7") {
    sharesObjectId = "0x5c823dfcfa0618d15bc11829a31da2619194fad327998e1a4328c6bf1ed35af3"
  } else if (workerInfoAddr == "0x4e0f84b2d00700102553482e46ec08bd65b29e0d4fc9af8b39b0b25e299fcf1f") {
    sharesObjectId = "0xa965af510dc0d4094ba9148916cb8e43115f1570b1e65b04eb2dfa3b8774d3a7"
  } else if (workerInfoAddr == "0x9af96eeb7ca6c1d17cad76607cd04b4ee712908345b64d66e9d3df9f053c5b82") {
    sharesObjectId = "0x0981c14c9771f5025d35ced3aa90b839ad02b0b680bbb107f0af0c74ef83241f"
  } else if (workerInfoAddr == "0xc602fd3f71b40e8ba3c7e01f8e42987cfb660e282fc645952d03ae59a075aea2") {
    sharesObjectId = "0x051e39f5d42df0a592c61dcf32e2dc9fdb8412d99d88bc90dd39313b2f097622"
  } else if (workerInfoAddr == "0x01faaad863c448800d2b7223609436c2cdf001c4c397d66eb59bb89a82828b6d") {
    sharesObjectId = "0xda009f3ece5562adf294fd8fca36ec861a464d86e183e4b16e521b972de41fe2"
  } else if (workerInfoAddr == "0xceba2697cb06fd3f1b5647bc192f30a96749ee43262ff4bd7ea9d5a2d00cee40") {
    sharesObjectId = "0xd18e084659df6262ad5d5a7f939c9e5ea3c1f1138f21338d7a551c39a6fda565"
  } else if (workerInfoAddr == "0x989baaba20b51b6aec07bd0c235ee9a2ee3e709071d34c547abf84841b4a5d5b") {
    sharesObjectId = "0xa8140937fca599c2ea00d5e363ec0d9178715723e10fc4e07e79318a33ed1c05"
  } else if (workerInfoAddr == "0x85ad5f6b8dd39b2a9dbb05161a563db52f91d724390273a739199dbfa640405b") {
    sharesObjectId = "0xa477e6a6ff55ef740d4dc3b78cad6432d5b988c4f6d76d6ac6a9887835555739"
  } else if (workerInfoAddr == "0x888821cfa0e8d3e4de4602d91b17ea2e156e534a233424611b8f27e5d4bac439") {
    sharesObjectId = "0xf443afc012e3f48af03da130fd5ba772fcad108961544fdb045a17166dc22148"
  } else if (workerInfoAddr == "0x567032b6d5a37897662294c6442d893ba3e5dfcd16ed7b1a6ccf8e69ae7de288") {
    sharesObjectId = "0xc03eac76a0e9abc564656f09f1766e306236e547265d82b6e8100e7d5b93292b"
  } else if (workerInfoAddr == "0xaee16401df87f6c7dbe6397c960f6b7993f9d005e9d11cbda8f4d079e94cde8a") {
    sharesObjectId = "0x7518cf704aa3ed6fde4926a166cf3ca5f356609528f2cb8f2ffc69fc9dd29950"
  } else if (workerInfoAddr == "0x19d8089f3168a7f07d0aca36ea428585025d64ce4aeeb8cdf50ee72213ef07da") {
    sharesObjectId = "0x45e1f673f4bc3cdabb2831b4aae0a8faceca92848b037106a6990612d1d65aca"
  } else if (workerInfoAddr == "0x47b2a1ad2a87de3351f8e7d7ce39b529a15af53e7b4ba89c8c69781ba2f6829f") {
    sharesObjectId = "0x04981a8ea7ae13fa679fd00e6a7d7b1fe42c307c985ee22476f1daf1ec11a179"  
  } else if (workerInfoAddr == "0x12552c511257169cba63a0b2159e812d5fe578781ec051435063b346b5c05f03") {
    sharesObjectId = "0x17bd7a1c8aae603a30f19fa4563cefb3009ac63771d6fe3cba1e3a59cba049b2"
  } else if (workerInfoAddr == "0x235e04373fb6799990ae1c148257fcd8ce68e99fd67a70d5250e398615a7051c") {
    sharesObjectId = "0xd82cf1bb687ccb3147d5773370cba6390b7c4bf655bf90ac555c0e066c565003"
  } else if (workerInfoAddr == "0x8a1068568ccbd45262feea49a22d0ed42a28969e9fc0720ceb2306c838f9832f") {
    sharesObjectId = "0xa311a17c2956c9908cc1e8afd4a52ce170a94c0c533bd6e53a071a4908a27984"
  } else if (workerInfoAddr == "0x66f72cf2babece8f8bdfd7b370be35de5bd9fc67c7a13f45332149a213db5298") {
    sharesObjectId = "0x343cf18c24f270b0bb3591153c677225c257fa2495eefcb14a43f6c2de7584f9"
  } else if (workerInfoAddr == "0x218c06ec2ae747e889ca5720e603272f49fb3724a5777b0c3a8e7ea6dd2e5f9e") {
    sharesObjectId = "0xe6ed1cdfddf031b67e40d38f08bdbb646670d4bdb1080783b9e9a632b7d4b731"
  } else if (workerInfoAddr == "0xe4297de0dda97bd2843badee6a621cf4eba631222c58ea7d3b686ca42ddb81c6") {
    sharesObjectId = "0xd0cce2c9ec767fb97a4dfa887cd472bdec47b41558b25cd71e1dfdcfdc59b01a"
  } else if (workerInfoAddr == "0xc2512435e24509da820b17b836202830542baa94c4872ca37d832c8193f38b5f") {
    sharesObjectId = "0xec80f7b4a8e74d2418c3a142b5ed8160846ffdad6fa2be26afa11bc912643078"
  } else {
    console.error("Not support workerInfoAddr:", workerInfoAddr)
  }
  return sharesObjectId
}

export function getCoinTypeByVaultConfigId(vaultConfigId: string) {
  let coinType

  if (vaultConfigId == vaultWethConfigId) {
    coinType = coinAddrWETH
  } else if (vaultConfigId == vaultHaSuiConfigId) {
    coinType = coinAddrHASUI
  } else if (vaultConfigId == vaultUsdtConfigId) {
    coinType = coinAddrUSDT
  } else if (vaultConfigId == vaultwUsdcConfigId) {
    coinType = coinAddrwUSDC
  } else if (vaultConfigId == vaultCetusConfigId) {
    coinType = coinAddrCETUS
  } else if (vaultConfigId == vaultSuiConfigId) {
    coinType = coinAddrSUI
  } else if (vaultConfigId == vaultNavxConfigId) {
    coinType = coinAddrNAVX
  } else if (vaultConfigId == vaultScaConfigId) {
    coinType = coinAddrSCA
  } else if (vaultConfigId == vaultWbtcConfigId) {
    coinType = coinAddrWBTC
  } else if (vaultConfigId == vaultBuckConfigId) {
    coinType = coinAddrBUCK
  } else if (vaultConfigId == vaultUsdcConfigId) {
    coinType = coinAddrUSDC
  } else if (vaultConfigId == vaultsuiUsdtConfigId) {
    coinType = coinAddrsuiUSDT
  } else if (vaultConfigId == vaultFdusdConfigId) {
    coinType = coinAddrFDUSD
  } else if (vaultConfigId == vaultUsdyConfigId) {
    coinType = coinAddrUSDY
  } else if (vaultConfigId == vaultAusdConfigId) {
    coinType = coinAddrAUSD
  } else if (vaultConfigId == vaultStSuiConfigId) {
    coinType = coinAddrSTSUI
  } else if (vaultConfigId == vaultLbtcConfigId) {
    coinType = coinAddrLBTC
  } else if (vaultConfigId == vaultsuiWBTCConfigId) {
    coinType = coinAddrsuiWBTC
  } else {
    console.error("CoinType not suppport!")
  }
  return coinType
}

export async function getResponseContentByWorkerInfo(workerInfoAddr: string, ctx: SuiObjectContext, self: any) {
  let res
  if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdt_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_usdt.WorkerInfo.type())
  } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_weth_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_weth.WorkerInfo.type())
  } else if (workerInfoAddr == "0x9a510e18c37df3d9ddfe0b2d6673582f702bf281116a4ee334f7ef3edfa2b9ab") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdt_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0xcd00ff33e9a71ea807f41641d515449263a905a850a4fd9c4ce03203c0f954b5") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_usdt.WorkerInfo.type())
  } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_cetus_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_cetus_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_hasui_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_hasui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_navx_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_navx.WorkerInfo.type())
  } else if (workerInfoAddr == "0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_navx_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_cetus_navx.WorkerInfo.type())
  } else if (workerInfoAddr == "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sca_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_sca.WorkerInfo.type())
  } else if (workerInfoAddr == "0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_wbtc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wbtc_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_buck_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_buck.WorkerInfo.type())
  } else if (workerInfoAddr == "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_usdt.WorkerInfo.type())
  } else if (workerInfoAddr == "0x354808fb8a29a59e35e2d9bf06892eb913d750796b71b5f72efa6cd9d5dbbc27") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdt_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_cetus_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_wusdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_buck.WorkerInfo.type())
  } else if (workerInfoAddr == "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_buck_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_buck_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_sui_buck.WorkerInfo.type())
  } else if (workerInfoAddr == "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_wusdc_new.WorkerInfo.type())
  } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_usdc_new.WorkerInfo.type())
  } else if (workerInfoAddr == "0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_buck_wusdc_new.WorkerInfo.type())
  } else if (workerInfoAddr == "0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_wusdc_buck_new.WorkerInfo.type())
  } else if (workerInfoAddr == "0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_suiusdt.WorkerInfo.type())
  } else if (workerInfoAddr == "0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_suiusdt_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_fdusd_usdc_1.WorkerInfo.type())
  } else if (workerInfoAddr == "0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_fdusd_1.WorkerInfo.type())
  } else if (workerInfoAddr == "0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_fdusd_2.WorkerInfo.type())
  } else if (workerInfoAddr == "0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_fdusd_3.WorkerInfo.type())
  } else if (workerInfoAddr == "0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_fdusd_4.WorkerInfo.type())
  } else if (workerInfoAddr == "0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_fdusd_5.WorkerInfo.type())
  } else if (workerInfoAddr == "0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_fdusd_6.WorkerInfo.type())
  } else if (workerInfoAddr == "0xf823b1460defefa6f3923e4f4eb93795f421756de29afed344ddd6d6dd91be29") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_usdy.WorkerInfo.type())
  } else if (workerInfoAddr == "0x3ef9304468faecfaf7d2317960b9e69fb85ea2610cc089244f3c0d54abf167e7") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdy_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x4e0f84b2d00700102553482e46ec08bd65b29e0d4fc9af8b39b0b25e299fcf1f") {
    res = await ctx.coder.decodeType(self, stable_farm_worker_hasui_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x9af96eeb7ca6c1d17cad76607cd04b4ee712908345b64d66e9d3df9f053c5b82") {
    res = await ctx.coder.decodeType(self, stable_farm_worker_sui_hasui.WorkerInfo.type())
  } else if (workerInfoAddr == "0xc602fd3f71b40e8ba3c7e01f8e42987cfb660e282fc645952d03ae59a075aea2") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_suiusdt_2.WorkerInfo.type())
  } else if (workerInfoAddr == "0x01faaad863c448800d2b7223609436c2cdf001c4c397d66eb59bb89a82828b6d") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_suiusdt_usdc_2.WorkerInfo.type())
  } else if (workerInfoAddr == "0xceba2697cb06fd3f1b5647bc192f30a96749ee43262ff4bd7ea9d5a2d00cee40") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_ausd.WorkerInfo.type())   
  } else if (workerInfoAddr == "0x989baaba20b51b6aec07bd0c235ee9a2ee3e709071d34c547abf84841b4a5d5b") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_ausd_usdc.WorkerInfo.type())   
  // After Cetus Incident
  } else if (workerInfoAddr == "0x85ad5f6b8dd39b2a9dbb05161a563db52f91d724390273a739199dbfa640405b") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_suiusdt_2_after_cetus.WorkerInfo.type())   
  } else if (workerInfoAddr == "0x888821cfa0e8d3e4de4602d91b17ea2e156e534a233424611b8f27e5d4bac439") {
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_suiusdt_usdc_2_after_cetus.WorkerInfo.type())   
  } else if (workerInfoAddr == "0xaee16401df87f6c7dbe6397c960f6b7993f9d005e9d11cbda8f4d079e94cde8a") {   
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_buck_usdc_after_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0x567032b6d5a37897662294c6442d893ba3e5dfcd16ed7b1a6ccf8e69ae7de288") {   
    res = await ctx.coder.decodeType(self, cetus_clmm_worker_usdc_buck_after_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0x19d8089f3168a7f07d0aca36ea428585025d64ce4aeeb8cdf50ee72213ef07da") {   
    res = await ctx.coder.decodeType(self, stable_farm_worker_hasui_sui_after_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0x47b2a1ad2a87de3351f8e7d7ce39b529a15af53e7b4ba89c8c69781ba2f6829f") {   
    res = await ctx.coder.decodeType(self, stable_farm_worker_sui_hasui_after_cetus.WorkerInfo.type())
  } else if (workerInfoAddr == "0x12552c511257169cba63a0b2159e812d5fe578781ec051435063b346b5c05f03") {   
    res = await ctx.coder.decodeType(self, bluefin_worker_suiusdt_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0x235e04373fb6799990ae1c148257fcd8ce68e99fd67a70d5250e398615a7051c") {   
    res = await ctx.coder.decodeType(self, bluefin_worker_usdc_suiusdt.WorkerInfo.type())
  } else if (workerInfoAddr == "0x8a1068568ccbd45262feea49a22d0ed42a28969e9fc0720ceb2306c838f9832f") {   
    res = await ctx.coder.decodeType(self, bluefin_worker_stsui_sui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x66f72cf2babece8f8bdfd7b370be35de5bd9fc67c7a13f45332149a213db5298") {   
    res = await ctx.coder.decodeType(self, bluefin_worker_sui_stsui.WorkerInfo.type())
  } else if (workerInfoAddr == "0x218c06ec2ae747e889ca5720e603272f49fb3724a5777b0c3a8e7ea6dd2e5f9e") {
    res = await ctx.coder.decodeType(self, bluefin_worker_buck_usdc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xe4297de0dda97bd2843badee6a621cf4eba631222c58ea7d3b686ca42ddb81c6") {
    res = await ctx.coder.decodeType(self, bluefin_worker_lbtc_suiwbtc.WorkerInfo.type())
  } else if (workerInfoAddr == "0xc2512435e24509da820b17b836202830542baa94c4872ca37d832c8193f38b5f") {
    res = await ctx.coder.decodeType(self, bluefin_worker_usdc_suiusdt_2.WorkerInfo.type())
  } else {
    console.error("Not support workerInfoAddr:", workerInfoAddr)
  }
  return res
}

export function isReverseWorkerInfo(workerInfoAddr: string) {
  let isReverse
  if (workerInfoAddr == "0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c") {
    isReverse = false
  } else if (workerInfoAddr == "0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c") {
    isReverse = true
  } else if (workerInfoAddr == "0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1") {
    isReverse = false
  } else if (workerInfoAddr == "0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926") {
    isReverse = true
  } else if (workerInfoAddr == "0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326") {
    isReverse = false
  } else if (workerInfoAddr == "0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51") {
    isReverse = true
  } else if (workerInfoAddr == "0x9a510e18c37df3d9ddfe0b2d6673582f702bf281116a4ee334f7ef3edfa2b9ab") {
    isReverse = false
  } else if (workerInfoAddr == "0xcd00ff33e9a71ea807f41641d515449263a905a850a4fd9c4ce03203c0f954b5") {
    isReverse = true
  } else if (workerInfoAddr == "0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d") {
    isReverse = true
  } else if (workerInfoAddr == "0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb") {
    isReverse = false
  } else if (workerInfoAddr == "0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec") {
    isReverse = true
  } else if (workerInfoAddr == "0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da") {
    isReverse = false
  } else if (workerInfoAddr == "0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8") {
    isReverse = false
  } else if (workerInfoAddr == "0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45") {
    isReverse = true
  } else if (workerInfoAddr == "0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1") {
    isReverse = false
  } else if (workerInfoAddr == "0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e") {
    isReverse = true
  } else if (workerInfoAddr == "0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d") {
    isReverse = false
  } else if (workerInfoAddr == "0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6") {
    isReverse = true
  } else if (workerInfoAddr == "0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa") {
    isReverse = false
  } else if (workerInfoAddr == "0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4") {
    isReverse = true
  } else if (workerInfoAddr == "0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a") {
    isReverse = false
  } else if (workerInfoAddr == "0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac") {
    isReverse = true
  } else if (workerInfoAddr == "0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce") {
    isReverse = false
  } else if (workerInfoAddr == "0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659") {
    isReverse = true
  } else if (workerInfoAddr == "0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f") {
    isReverse = false
  } else if (workerInfoAddr == "0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c") {
    isReverse = true
  } else if (workerInfoAddr == "0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8") {
    isReverse = false
  } else if (workerInfoAddr == "0x354808fb8a29a59e35e2d9bf06892eb913d750796b71b5f72efa6cd9d5dbbc27") {
    isReverse = true
  } else if (workerInfoAddr == "0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988") {
    isReverse = true
  } else if (workerInfoAddr == "0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca") {
    isReverse = false
  } else if (workerInfoAddr == "0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e") {
    isReverse = false
  } else if (workerInfoAddr == "0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242") {
    isReverse = true
  } else if (workerInfoAddr == "0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc") {
    isReverse = false
  } else if (workerInfoAddr == "0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832") {
    isReverse = true
  } else if (workerInfoAddr == "0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8") {
    isReverse = false
  } else if (workerInfoAddr == "0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3") {
    isReverse = true
  } else if (workerInfoAddr == "0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a") {
    isReverse = false
  } else if (workerInfoAddr == "0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76") {
    isReverse = true
  } else if (workerInfoAddr == "0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2") {
    isReverse = false
  } else if (workerInfoAddr == "0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1") {
    isReverse = true
  } else if (workerInfoAddr == "0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd") {
    isReverse = false
  } else if (workerInfoAddr == "0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3") {
    isReverse = true
  } else if (workerInfoAddr == "0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395") {
    isReverse = false
  } else if (workerInfoAddr == "0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0") {
    isReverse = true
  } else if (workerInfoAddr == "0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca") {
    isReverse = true
  } else if (workerInfoAddr == "0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843") {
    isReverse = true
  } else if (workerInfoAddr == "0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c") {
    isReverse = true
  } else if (workerInfoAddr == "0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90") {
    isReverse = true
  } else if (workerInfoAddr == "0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98") {
    isReverse = true
  } else if (workerInfoAddr == "0xf823b1460defefa6f3923e4f4eb93795f421756de29afed344ddd6d6dd91be29") {
    isReverse = false
  } else if (workerInfoAddr == "0x3ef9304468faecfaf7d2317960b9e69fb85ea2610cc089244f3c0d54abf167e7") {
    isReverse = true
  } else if (workerInfoAddr == "0x4e0f84b2d00700102553482e46ec08bd65b29e0d4fc9af8b39b0b25e299fcf1f") {
    isReverse = false
  } else if (workerInfoAddr == "0x9af96eeb7ca6c1d17cad76607cd04b4ee712908345b64d66e9d3df9f053c5b82") {
    isReverse = true
  } else if (workerInfoAddr == "0xc602fd3f71b40e8ba3c7e01f8e42987cfb660e282fc645952d03ae59a075aea2") {
    isReverse = false
  } else if (workerInfoAddr == "0x01faaad863c448800d2b7223609436c2cdf001c4c397d66eb59bb89a82828b6d") {
    isReverse = true
  } else if (workerInfoAddr == "0xceba2697cb06fd3f1b5647bc192f30a96749ee43262ff4bd7ea9d5a2d00cee40") {
    isReverse = false
  } else if (workerInfoAddr == "0x989baaba20b51b6aec07bd0c235ee9a2ee3e709071d34c547abf84841b4a5d5b") {
    isReverse = true
  } else if (workerInfoAddr == "0x85ad5f6b8dd39b2a9dbb05161a563db52f91d724390273a739199dbfa640405b") {
    isReverse = false
  } else if (workerInfoAddr == "0x888821cfa0e8d3e4de4602d91b17ea2e156e534a233424611b8f27e5d4bac439") {
    isReverse = true
  } else if (workerInfoAddr == "0x567032b6d5a37897662294c6442d893ba3e5dfcd16ed7b1a6ccf8e69ae7de288") {
    isReverse = false
  } else if (workerInfoAddr == "0xaee16401df87f6c7dbe6397c960f6b7993f9d005e9d11cbda8f4d079e94cde8a") {
    isReverse = true
  } else if (workerInfoAddr == "0x19d8089f3168a7f07d0aca36ea428585025d64ce4aeeb8cdf50ee72213ef07da") {
    isReverse = false
  } else if (workerInfoAddr == "0x47b2a1ad2a87de3351f8e7d7ce39b529a15af53e7b4ba89c8c69781ba2f6829f") {
    isReverse = true
  } else if (workerInfoAddr == "0x12552c511257169cba63a0b2159e812d5fe578781ec051435063b346b5c05f03") {
    isReverse = false
  } else if (workerInfoAddr == "0x235e04373fb6799990ae1c148257fcd8ce68e99fd67a70d5250e398615a7051c") {
    isReverse = true
  } else if (workerInfoAddr == "0x8a1068568ccbd45262feea49a22d0ed42a28969e9fc0720ceb2306c838f9832f") {
    isReverse = false
  } else if (workerInfoAddr == "0x66f72cf2babece8f8bdfd7b370be35de5bd9fc67c7a13f45332149a213db5298") {
    isReverse = true
  } else if (workerInfoAddr == "0x218c06ec2ae747e889ca5720e603272f49fb3724a5777b0c3a8e7ea6dd2e5f9e") {
    isReverse = false
  } else if (workerInfoAddr == "0xe4297de0dda97bd2843badee6a621cf4eba631222c58ea7d3b686ca42ddb81c6") {
    isReverse = false
  } else if (workerInfoAddr == "0xc2512435e24509da820b17b836202830542baa94c4872ca37d832c8193f38b5f") {
    isReverse = true
  } else {
    console.error("Not support workerInfoAddr:", workerInfoAddr)
  }
  return isReverse
}


export function isStableFarmByPoolId(poolId: string) {
  if (poolId.toLocaleLowerCase() == '0x9f5fd63b2a2fd8f698ff6b7b9720dbb2aa14bedb9fc4fd6411f20e5b531a4b89') {
    return true
  } else {
    return false
  }
}