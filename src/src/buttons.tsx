import React from "react";
import MetamaskIcon from "./assets/Metamask";
import WalletConnectIcon from "./assets/WalletConnect";
import CoinbaseIcon from "./assets/Coinbase";
import Web3Auth from "./assets/Web3Auth";


export const getBtnConfig = (win: any) => ({
  metaMaskSDK: {
    order: 0,
    label: "metaMask",
    forMobile: !!win.ethereum,
    icon: <MetamaskIcon />
  },
  walletConnect: {
    order: 1,
    label: "WalletConnect",
    forMobile: true,
    icon: <WalletConnectIcon />
  },
  coinbaseWalletSDK: {
    order: 2,
    label: "Coinbase",
    forMobile: !!win.ethereum,
    icon: <CoinbaseIcon />
  },
  web3auth: {
    order: 3,
    label: "Web3Auth",
    forMobile: !!win.ethereum,
    icon: <Web3Auth />
  }
});
