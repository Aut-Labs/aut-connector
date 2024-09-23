import { coinbaseWallet, walletConnect, metaMask } from "wagmi/connectors";
import { createConfig, createStorage, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import Web3AuthConnectorInstance from "./Web3AuthConnectorInstance";

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "AutLabs"
      }
    }),
    Web3AuthConnectorInstance([polygonAmoy, polygon]),
    walletConnect({ projectId: "938429658f5e53a8eaf88dc70e4a8367" }),
    coinbaseWallet({
      appName: "AutLabs"
    })
  ],
  multiInjectedProviderDiscovery: false,
  syncConnectedChain: true,
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http()
  }
});
