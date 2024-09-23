import {
  BrowserProvider,
  getAddress,
  toUtf8Bytes,
  verifyMessage
} from "ethers";
import { SiweMessage } from "siwe";

interface AuthParams {
  provider: BrowserProvider;
  account: string;
  chainId: number;
  resources: string[];
  expiration: string;
  uri: string;
  derivedVia: string;
}

const LOCAL_STORAGE_KEY = "aut-auth-sig";

export interface AuthSig {
  sig: string;
  signedMessage: string;
  derivedVia: string;
  address: string;
}

const getStorageItem = (key: string): any => {
  const item = localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  }
  return null;
};

export const validateAndGetCacheAuthSig = async (
  chainId: number,
  provider: BrowserProvider
): Promise<AuthSig> => {
  const authSig = getStorageItem(LOCAL_STORAGE_KEY);
  if (!authSig) {
    return null;
  }
  const signerAddress = getAddress((await provider.getSigner()).address);
  const { sig, signedMessage, address } = authSig;
  const recoveredAddress = verifyMessage(signedMessage, sig).toLowerCase();
  const sameAddress =
    recoveredAddress === address.toLowerCase() &&
    recoveredAddress === signerAddress.toLowerCase();
  const message: SiweMessage = new SiweMessage(signedMessage);
  const response = await message.verify(
    {
      signature: sig,
      time: new Date().toISOString()
    },
    {
      provider
    }
  );
  if (!response.success || !sameAddress || chainId !== message.chainId) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return null;
  }
  return authSig;
};

export const signAutMessage = async ({
  provider,
  account,
  chainId,
  resources,
  expiration,
  derivedVia,
  uri
}: AuthParams): Promise<AuthSig> => {
  const signer = await provider.getSigner();
  const block = await provider.getBlock("latest");
  const nonce = block.hash;

  const preparedMessage: Partial<SiweMessage> = {
    domain: globalThis.location.host,
    address: getAddress(account),
    version: "1",
    chainId,
    expirationTime: expiration,
    nonce,
    uri
  };

  if (resources && resources.length > 0) {
    preparedMessage.resources = resources;
  }

  const message: SiweMessage = new SiweMessage(preparedMessage);
  const body: string = message.prepareMessage();
  const signature = await signer.signMessage(toUtf8Bytes(body));
  const address = verifyMessage(body, signature).toLowerCase();
  const authSig: AuthSig = {
    sig: signature,
    derivedVia,
    signedMessage: body,
    address: address
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authSig));
  return authSig;
};
