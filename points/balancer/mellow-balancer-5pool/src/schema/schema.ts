
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type { String, Int, BigInt, Float, ID, Bytes, Timestamp, Boolean } from '@sentio/sdk/store'
import { Entity, Required, One, Many, Column, ListColumn } from '@sentio/sdk/store'
import { BigDecimal } from '@sentio/bigdecimal'
import { DatabaseSchema } from '@sentio/sdk'






@Entity("AccountSnapshot")
export class AccountSnapshot  {

	@Required
	@Column("ID")
	id: ID

	@Required
	@Column("BigInt")
	epochMilli: BigInt

	@Required
	@Column("BigInt")
	amphrEthBalance: BigInt

	@Required
	@Column("BigInt")
	rstEthBalance: BigInt

	@Required
	@Column("BigInt")
	wstEthBalance: BigInt

	@Required
	@Column("BigInt")
	re7LrtBalance: BigInt

	@Required
	@Column("BigInt")
	steakLrtBalance: BigInt

  constructor(data: Partial<AccountSnapshot>) {}

}


const source = `type AccountSnapshot @entity {
    id: ID!
    epochMilli: BigInt!
    amphrEthBalance: BigInt!
    rstEthBalance: BigInt!
    wstEthBalance: BigInt!
    re7LrtBalance: BigInt!
    steakLrtBalance: BigInt!
}`
DatabaseSchema.register({
  source,
  entities: {
    "AccountSnapshot": AccountSnapshot
  }
})