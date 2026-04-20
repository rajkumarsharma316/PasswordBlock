import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDKMBJRDVC6G3QRIRS7ZBLG7RZHDGR5XDVFTBLVXWG4TUTRHPT6HWJJF",
  }
} as const

export type DataKey = {tag: "Entry", values: readonly [string, Buffer]} | {tag: "EntryIds", values: readonly [string]} | {tag: "EntryCount", values: readonly [string]};


export interface EncryptedEntry {
  /**
 * The encrypted payload (JSON of site, username, password, notes, category — all encrypted)
 */
data: Buffer;
  /**
 * A label for the entry (encrypted)
 */
label: Buffer;
  /**
 * Timestamp of when the entry was created/updated (unix ms)
 */
timestamp: u64;
}

export interface Client {
  /**
   * Construct and simulate a get_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_entry: ({user, entry_id}: {user: string, entry_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<EncryptedEntry>>

  /**
   * Construct and simulate a extend_ttl transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Utility to keep user data alive by bumping all TTLs
   */
  extend_ttl: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a store_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Store an encrypted password entry. If entry_id already exists, it is overwritten.
   */
  store_entry: ({user, entry_id, encrypted_data, encrypted_label, timestamp}: {user: string, entry_id: Buffer, encrypted_data: Buffer, encrypted_label: Buffer, timestamp: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a delete_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  delete_entry: ({user, entry_id}: {user: string, entry_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_all_entries transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_all_entries: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<readonly [Buffer, EncryptedEntry]>>>

  /**
   * Construct and simulate a get_entry_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_entry_count: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_all_entry_ids transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_all_entry_ids: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Buffer>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAJZ2V0X2VudHJ5AAAAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAACGVudHJ5X2lkAAAD7gAAACAAAAABAAAH0AAAAA5FbmNyeXB0ZWRFbnRyeQAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAEAAABHU3RvcmVzIGVuY3J5cHRlZCBlbnRyeSBkYXRhOiAodXNlcl9hZGRyZXNzLCBlbnRyeV9pZCkgLT4gRW5jcnlwdGVkRW50cnkAAAAABUVudHJ5AAAAAAAAAgAAABMAAAPuAAAAIAAAAAEAAABEU3RvcmVzIGxpc3Qgb2YgZW50cnkgSURzIGZvciBhIHVzZXI6IHVzZXJfYWRkcmVzcyAtPiBWZWM8Qnl0ZXNOPDMyPj4AAAAIRW50cnlJZHMAAAABAAAAEwAAAAEAAAA4U3RvcmVzIHRvdGFsIGVudHJ5IGNvdW50IGZvciBhIHVzZXI6IHVzZXJfYWRkcmVzcyAtPiB1MzIAAAAKRW50cnlDb3VudAAAAAAAAQAAABM=",
        "AAAAAAAAADNVdGlsaXR5IHRvIGtlZXAgdXNlciBkYXRhIGFsaXZlIGJ5IGJ1bXBpbmcgYWxsIFRUTHMAAAAACmV4dGVuZF90dGwAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAA==",
        "AAAAAAAAAFFTdG9yZSBhbiBlbmNyeXB0ZWQgcGFzc3dvcmQgZW50cnkuIElmIGVudHJ5X2lkIGFscmVhZHkgZXhpc3RzLCBpdCBpcyBvdmVyd3JpdHRlbi4AAAAAAAALc3RvcmVfZW50cnkAAAAABQAAAAAAAAAEdXNlcgAAABMAAAAAAAAACGVudHJ5X2lkAAAD7gAAACAAAAAAAAAADmVuY3J5cHRlZF9kYXRhAAAAAAAOAAAAAAAAAA9lbmNyeXB0ZWRfbGFiZWwAAAAADgAAAAAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAA=",
        "AAAAAAAAAAAAAAAMZGVsZXRlX2VudHJ5AAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAACGVudHJ5X2lkAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAPZ2V0X2FsbF9lbnRyaWVzAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+oAAAPtAAAAAgAAA+4AAAAgAAAH0AAAAA5FbmNyeXB0ZWRFbnRyeQAA",
        "AAAAAAAAAAAAAAAPZ2V0X2VudHJ5X2NvdW50AAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADkVuY3J5cHRlZEVudHJ5AAAAAAADAAAAW1RoZSBlbmNyeXB0ZWQgcGF5bG9hZCAoSlNPTiBvZiBzaXRlLCB1c2VybmFtZSwgcGFzc3dvcmQsIG5vdGVzLCBjYXRlZ29yeSDigJQgYWxsIGVuY3J5cHRlZCkAAAAABGRhdGEAAAAOAAAAIUEgbGFiZWwgZm9yIHRoZSBlbnRyeSAoZW5jcnlwdGVkKQAAAAAAAAVsYWJlbAAAAAAAAA4AAAA5VGltZXN0YW1wIG9mIHdoZW4gdGhlIGVudHJ5IHdhcyBjcmVhdGVkL3VwZGF0ZWQgKHVuaXggbXMpAAAAAAAACXRpbWVzdGFtcAAAAAAAAAY=",
        "AAAAAAAAAAAAAAARZ2V0X2FsbF9lbnRyeV9pZHMAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPqAAAD7gAAACA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_entry: this.txFromJSON<EncryptedEntry>,
        extend_ttl: this.txFromJSON<null>,
        store_entry: this.txFromJSON<null>,
        delete_entry: this.txFromJSON<null>,
        get_all_entries: this.txFromJSON<Array<readonly [Buffer, EncryptedEntry]>>,
        get_entry_count: this.txFromJSON<u32>,
        get_all_entry_ids: this.txFromJSON<Array<Buffer>>
  }
}