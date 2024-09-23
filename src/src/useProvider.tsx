import { FallbackProvider, JsonRpcProvider } from "ethers";
import { useRef } from "react";
import { getEthersProvider } from "./ethers";
import { Chain } from "viem";

export type Web3Provider = JsonRpcProvider | FallbackProvider;

type S = Web3Provider;

type P = {
  chainId?: number;
};

const useProvider = ({ chainId }: P = {}, defaultChain: Chain) =>
  useRef<S>(getEthersProvider({ chainId }, defaultChain)).current;

export default useProvider;
