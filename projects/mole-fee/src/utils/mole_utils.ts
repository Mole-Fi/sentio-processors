import { SuiObjectProcessor, SuiContext, SuiObjectContext } from "@sentio/sdk/sui"
import { getPriceByType, token } from "@sentio/sdk/utils"
import { SuiNetwork } from "@sentio/sdk/sui"
import BN from 'bn.js'
// import * as Decimal from 'decimal.js'
const Decimal = require("decimal.js")
import { MathUtil, ONE, U64_MAX, ZERO } from './utils.js'


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
  
  export function sleep (ms: number) {
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
    } else {
      console.error("No pool in here , pid: ", poolId)
      return ["", ""]
    }
  }

  export function getShareObjectByWorkerInfo (workerInfoAddr: string) {
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
    } else {
      console.error("Not support workerInfoAddr:", workerInfoAddr)
    } 
    return sharesObjectId
  }
