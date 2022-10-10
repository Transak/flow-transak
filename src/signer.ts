
/*
  SHA2_256
  ECDSA_secp256k1

  SHA3_256
  ECDSA_P256

  https://dev.to/onflow/build-on-flow-learn-fcl-14-how-to-mutate-chain-state-by-signing-transactions-with-a-private-key-5c4p
  >> address attack brand donate spawn wing royal embrace spell wife motor hybrid
*/

import { sansPrefix, withPrefix } from "@onflow/fcl";
import { sha256 } from "js-sha256";
import { ec } from "elliptic";

const curve = new ec("secp256k1");
const hashMessageHex = (msgHex) => {
  return sha256(Buffer.from(msgHex, "hex"));
};

const signWithKey = (privateKey, msgHex) => {
  const key = curve.keyFromPrivate(Buffer.from(privateKey, "hex"));
  const sig = key.sign(hashMessageHex(msgHex));

  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);

return Buffer.concat([r, s]).toString("hex");
};

export const getSigner = ( pkey, accountAddress ) => {
  return async ( account ) => {
    const keyId = 0;
    // authorization function need to return an account
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${accountAddress}-${keyId}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: sansPrefix(accountAddress), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(keyId), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string

      // This is where magic happens! ✨
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        const signature = await signWithKey(pkey, signable.message);
        return {
          addr: withPrefix(accountAddress), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(keyId), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      }
    };
  }
}