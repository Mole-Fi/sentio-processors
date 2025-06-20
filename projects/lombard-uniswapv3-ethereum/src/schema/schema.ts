
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type { String, Int, BigInt, Float, ID, Bytes, Timestamp, Boolean, Int8 } from '@sentio/sdk/store'
import { Entity, Required, One, Many, Column, ListColumn, AbstractEntity } from '@sentio/sdk/store'
import { BigDecimal } from '@sentio/bigdecimal'
import { DatabaseSchema } from '@sentio/sdk'







interface PositionSnapshotConstructorInput {
  id: String;
  owner: String;
  tickLower: BigInt;
  tickUpper: BigInt;
  timestampMilli: BigInt;
  wbtcBalance: BigDecimal;
  lbtcBalance: BigDecimal;
}
@Entity("PositionSnapshot")
export class PositionSnapshot extends AbstractEntity  {

	@Required
	@Column("String")
	id: String

	@Required
	@Column("String")
	owner: String

	@Required
	@Column("BigInt")
	tickLower: BigInt

	@Required
	@Column("BigInt")
	tickUpper: BigInt

	@Required
	@Column("BigInt")
	timestampMilli: BigInt

	@Required
	@Column("BigDecimal")
	wbtcBalance: BigDecimal

	@Required
	@Column("BigDecimal")
	lbtcBalance: BigDecimal
  constructor(data: PositionSnapshotConstructorInput) {super()}
  
}


const source = `type PositionSnapshot @entity {
  id: String!
  owner: String!
  tickLower: BigInt!
  tickUpper: BigInt!
  timestampMilli: BigInt!
  wbtcBalance: BigDecimal!
  lbtcBalance: BigDecimal!
}`
DatabaseSchema.register({
  source,
  entities: {
    "PositionSnapshot": PositionSnapshot
  }
})
