import { amm } from './types/aptos/auxexchange'
import { AccountEventTracker, aptos, Gauge } from "@sentio/sdk";
import { AptosClient } from "aptos-sdk";

import { TypedMoveResource } from "@sentio/sdk/lib/aptos/types";

import { AptosDex, getCoinInfo, delay } from "@sentio-processor/common/dist/aptos"
import { AptosResourceContext } from "@sentio/sdk/lib/aptos/context";

const commonOptions = { sparse:  true }
const tvlAll = new Gauge("tvl_all", commonOptions)
const tvl = new Gauge("tvl", commonOptions)
const tvlByPool = new Gauge("tvl_by_pool", commonOptions)
const volume = new Gauge("vol", commonOptions)

const accountTracker = AccountEventTracker.register("users")

amm.bind({startVersion: 299999})
  .onEntryCreatePool(async (evt, ctx) => {
    ctx.meter.Counter("num_pools").add(1)
    accountTracker.trackEvent(ctx, { distinctId: ctx.transaction.sender })
    // ctx.logger.info("PoolCreated", { user: ctx.transaction.sender })
    await syncPools(ctx)
  })
  .onEventAddLiquidityEvent(async (evt, ctx) => {
    ctx.meter.Counter("event_liquidity_add").add(1)
    accountTracker.trackEvent(ctx, { distinctId: ctx.transaction.sender })
    // ctx.logger.info("LiquidityAdded", { user: ctx.transaction.sender })
    await syncPools(ctx)
  })
  .onEventRemoveLiquidityEvent(async (evt, ctx) => {
    ctx.meter.Counter("event_liquidity_removed").add(1)
    accountTracker.trackEvent(ctx, { distinctId: ctx.transaction.sender })
    // ctx.logger.info("LiquidityRemoved", { user: ctx.transaction.sender })
    await syncPools(ctx)
  })
  .onEventSwapEvent(async (evt, ctx) => {
    const value = await auxExchange.recordTradingVolume(ctx, evt.data_typed.in_coin_type, evt.data_typed.out_coin_type, evt.data_typed.in_au, evt.data_typed.out_au)
    //
    const coinXInfo = await getCoinInfo(evt.data_typed.in_coin_type)
    const coinYInfo = await getCoinInfo(evt.data_typed.out_coin_type)
    ctx.meter.Counter("event_swap_by_bridge").add(1, { bridge: coinXInfo.bridge })
    ctx.meter.Counter("event_swap_by_bridge").add(1, { bridge: coinYInfo.bridge })

    accountTracker.trackEvent(ctx, { distinctId: ctx.transaction.sender })
    await syncPools(ctx)
  })

const recorded = new Set<bigint>()

async function syncPools(ctx: aptos.AptosContext) {
  const version = BigInt(ctx.version.toString())
  const bucket = version / 100000n;
  if (recorded.has(bucket)) {
    return
  }
  recorded.add(bucket)

  const normalClient = new AptosClient("https://aptos-mainnet.nodereal.io/v1/0c58c879d41e4eab8fd2fc0406848c2b")

  let pools: TypedMoveResource<amm.Pool<any, any>>[] = []

  let resources = undefined
  while (!resources) {
    try {
      resources = await normalClient.getAccountResources(amm.DEFAULT_OPTIONS.address, {ledgerVersion: version})
    } catch (e) {
      console.log("rpc error, retrying", e)
      await delay(1000)
    }
  }
  pools = aptos.TYPE_REGISTRY.filterAndDecodeResources<amm.Pool<any, any>>(amm.Pool.TYPE_QNAME, resources)

  // @ts-ignore
  ctx.timestampInMicros = parseInt(ctx.transaction.timestamp)
  // @ts-ignore
  await auxExchange.syncPools(ctx, pools)
}

const auxExchange = new AptosDex(volume, tvlAll, tvl, tvlByPool, {
  getXReserve(pool: amm.Pool<any, any>): bigint {
    return pool.x_reserve.value;
  },
  getXType(pool: TypedMoveResource<amm.Pool<any, any>>): string {
    return pool.type_arguments[0];
  },
  getYReserve(pool: amm.Pool<any, any>): bigint {
    return pool.y_reserve.value;
  },
  getYType(pool: TypedMoveResource<amm.Pool<any, any>>): string {
    return pool.type_arguments[1];
  },
  poolTypeName: amm.Pool.TYPE_QNAME
})