import { AccountEventTracker, aptos, Counter, Gauge } from "@sentio/sdk";
import { aptos_coin, coin, managed_coin, resource_account, aptos_account } from "@sentio/sdk/lib/builtin/aptos/0x1";

import { DEFAULT_MAINNET_LIST, RawCoinInfo } from "@manahippo/coin-list/dist/list";
import { liquidity_pool, scripts } from "./types/aptos/liquidswap";
import { amm } from "./types/aptos/auxexchange";
import { TransactionPayload_EntryFunctionPayload } from "aptos-sdk/src/generated";
import { router, swap } from "./types/aptos/pancake-swap";
import { token, token_transfers } from "@sentio/sdk/lib/builtin/aptos/0x3";
import { getChainQueryClient } from "@sentio/sdk/lib/aptos/utils";
import * as soffle3 from "./types/aptos/soffle3";
import * as topaz from "./types/aptos/topaz";
import * as bluemoves from "./types/aptos/bluemoves";

const txnCounter = new Counter("txn_counter")

const coinInfoMap = new Map<string, RawCoinInfo>()

for (const x of DEFAULT_MAINNET_LIST) {
  coinInfoMap.set(x.token_type.type, x)
}

// resource_account.bind()
//   .onEntryCreateResourceAccount((call, ctx) => {
//     txnCounter.add(ctx, 1, { kind: "account_creation_2"})
//   })
//   .onEntryCreateResourceAccountAndFund((call, ctx) => {
//     txnCounter.add(ctx, 1, { kind: "account_creation"})
//   })
//   .onEntryCreateResourceAccountAndPublishPackage((call, ctx) => {
//     txnCounter.add(ctx, 1, { kind: "account_creation"})
//   })

const queryClient = getChainQueryClient()
// await queryClient.aptosSQLQuery("asdfsf")

managed_coin.bind()
  .onEntryRegister((call, ctx) => {
    txnCounter.add(ctx, 1, { kind: "register"})
  })

coin.bind()
  .onEntryTransfer((call, ctx) => {
    const info = coinInfoMap.get(call.type_arguments[0])
    let symbol = info ? info.symbol : "others"
    txnCounter.add(ctx, 1, { kind: "transfer", symbol})
  })

aptos_account.bind()
    .onEntryCreateAccount((call, ctx) => {
      txnCounter.add(ctx, 1, { kind: "account_creation"})
    })
    .onEntryTransfer((call, ctx) => {
      txnCounter.add(ctx, 1, { kind: "transfer", symbol: "native" })
    })
//
// token_transfers.bind()
//     .onTransaction((txn, ctx) => {
//       txnCounter.add(ctx, 1, { kind: "transfer", symbol: 'nft' })
//     })

// token.bind()
//   .onTransaction((txn, ctx) => {
//     txnCounter.add(ctx, 1, { kind: "nft"})
//   })

// swaps
scripts.bind()
  .onTransaction((tx, ctx) => {
    txnCounter.add(ctx, 1, { kind: "swap", protocol: "liquidswap"})
  })

amm.bind()
  .onTransaction((tx, ctx) => {
    txnCounter.add(ctx, 1, { kind: "swap", protocol: "aux"})
  })

router.bind()
  .onTransaction((tx, ctx) => {
    txnCounter.add(ctx, 1, { kind: "swap", protocol: "pancake"})
  })

// nft
for (const m of [soffle3.Aggregator, soffle3.token_coin_swap, soffle3.FixedPriceMarket, soffle3.FixedPriceMarketScript]) {
  m.bind()
    .onTransaction((tx, ctx) => {
      txnCounter.add(ctx, 1, { kind: "nft", protocol: "souffl3"})
    })
}

for (const m of [topaz.fees, topaz.inbox, topaz.events, topaz.bid_any, topaz.marketplace, topaz.marketplace_v2,
    topaz.collection_marketplace, topaz.token_coin_swap]) {
  m.bind()
    .onTransaction((tx, ctx) => {
      txnCounter.add(ctx, 1, { kind: "nft", protocol: "topaz"})
    })
}

for (const m of [bluemoves.marketplaceV2, bluemoves.offer_lib]) {
  m.bind()
    .onTransaction((tx, ctx) => {
      txnCounter.add(ctx, 1, { kind: "nft", protocol: "bluemoves"})
    })
}