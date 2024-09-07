import { coinbaseWallet, walletConnect, metaMask } from "wagmi/connectors";
import { createConfig, createStorage, http } from "wagmi";
import { polygon } from "wagmi/chains";
import { defineChain } from "viem";
import Web3AuthConnectorInstance from "./Web3AuthConnectorInstance";

export const polygonAmoy = /*#__PURE__*/ defineChain({
  id: 80_002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'OK LINK',
      url: 'https://www.oklink.com/amoy',
    },
  },
  testnet: true,
})

// export const polygonAmoy = defineChain({
//   id: 80_002,
//   name: "Polygon Amoy",
//   nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
//   rpcUrls: {
//     default: {
//       http: ["https://polygon-amoy.g.alchemy.com/v2/Skyi471bo5qu1UFfGLHf-DDo0kgKHeXW"]
//     }
//   },
//   blockExplorers: {
//     default: {
//       name: "PolygonScan",
//       url: "https://www.oklink.com/amoy",
//       apiUrl: "https://www.oklink.com/amoy/api"
//     }
//   },
//   // contracts: {
//   //   multicall3: {
//   //     address: "0xca11bde05977b3631167028862be2a173976ca11",
//   //     blockCreated: 25770160
//   //   }
//   // },
//   testnet: true
// });

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon],
  connectors: [
    metaMask(),
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
