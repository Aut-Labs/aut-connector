import { FallbackProvider, JsonRpcProvider } from "ethers";
import { useRef } from "react";
import { getEthersProvider } from "./ethers";

export type Web3Provider = JsonRpcProvider | FallbackProvider;

type S = Web3Provider;

type P = {
  chainId?: number;
};

const useProvider = ({ chainId }: P = {}) =>
  useRef<S>(getEthersProvider({ chainId })).current;

export default useProvider;
