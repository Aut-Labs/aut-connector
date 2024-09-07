import { getPublicClient, getWalletClient } from "@wagmi/core";
import { BrowserProvider, FallbackProvider, JsonRpcProvider } from "ethers";
import { type Transport } from "viem";
import { wagmiConfig } from "./setup.config";

export function clientToProvider(client: any) {
  const { chain, transport } = client as any;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  if (transport.type === "fallback") {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network)
    );
    if (providers.length === 1) return providers[0];
    return new FallbackProvider(providers);
  }
  return new JsonRpcProvider(transport.url, network);
}

export function getEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = getPublicClient(wagmiConfig, {
    chainId: chainId as any
  });
  return clientToProvider(client);
}

export async function walletClientToSigner(walletClient) {
  const { chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  const provider = new BrowserProvider(transport, network);
  const signer = await provider.getSigner();
  return signer;
}

/** Action to convert a viem Wallet Client to an ethers.js Signer. */
export async function getEthersSigner({ chainId }: { chainId?: number } = {}) {
  const client = await getWalletClient(wagmiConfig, {
    chainId
  });
  if (!client) return undefined;
  return walletClientToSigner(client);
}
