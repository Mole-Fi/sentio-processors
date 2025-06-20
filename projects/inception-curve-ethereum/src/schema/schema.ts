
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type { String, Int, BigInt, Float, ID, Bytes, Timestamp, Boolean, Int8 } from '@sentio/sdk/store'
import { Entity, Required, One, Many, Column, ListColumn, AbstractEntity } from '@sentio/sdk/store'
import { BigDecimal } from '@sentio/bigdecimal'
import { DatabaseSchema } from '@sentio/sdk'







interface AccountSnapshotConstructorInput {
  id: String;
  account: String;
  timestampMilli: BigInt;
  lptBalance: String;
  lptSupply: String;
  poolInceptionETHBalance: String;
  poolWETHBalance: String;
}
@Entity("AccountSnapshot")
export class AccountSnapshot extends AbstractEntity  {

	@Required
	@Column("String")
	id: String

	@Required
	@Column("String")
	account: String

	@Required
	@Column("BigInt")
	timestampMilli: BigInt

	@Required
	@Column("String")
	lptBalance: String

	@Required
	@Column("String")
	lptSupply: String

	@Required
	@Column("String")
	poolInceptionETHBalance: String

	@Required
	@Column("String")
	poolWETHBalance: String
  constructor(data: AccountSnapshotConstructorInput) {super()}
  
}


const source = `type AccountSnapshot @entity {
  id: String!
  account: String!
  timestampMilli: BigInt!
  lptBalance: String!
  lptSupply: String!
  poolInceptionETHBalance: String!
  poolWETHBalance: String!
}`
DatabaseSchema.register({
  source,
  entities: {
    "AccountSnapshot": AccountSnapshot
  }
})
