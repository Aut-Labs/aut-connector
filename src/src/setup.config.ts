import { coinbaseWallet, walletConnect, metaMask } from "wagmi/connectors";
import { createConfig, createStorage, http } from "wagmi";
import { polygon } from "wagmi/chains";
import { defineChain } from "viem";
import Web3AuthConnectorInstance from "./Web3AuthConnectorInstance";

export const polygonAmoy = /*#__PURE__*/ defineChain({
  id: 80_002,
  name: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc-amoy.polygon.technology"]
    }
  },
  blockExplorers: {
    default: {
      name: "OK LINK",
      url: "https://www.oklink.com/amoy"
    }
  },
  testnet: true
});

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon],
  connectors: [
    metaMask({
      forceInjectProvider: true
    }),
    Web3AuthConnectorInstance([polygonAmoy, polygon]),
    walletConnect({ projectId: "938429658f5e53a8eaf88dc70e4a8367" }),
    coinbaseWallet({
      appName: "AutLabs"
    })
  ],
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http()
  }
});
