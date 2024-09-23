import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
  useState
} from "react";
import { S } from "./types";
import { styled } from "@mui/material";
import { initialState, reducer } from "./state";

type WalletConnectOpenFn = () => Promise<S>;
type WalletConnectCloseFn = (state?: S) => void;

type WalletConnectState = {
  defaultChainId: number;
  requestSig?: boolean;
  state: S;
  dispatch: React.Dispatch<any>;
  open: WalletConnectOpenFn;
  close: WalletConnectCloseFn;
  isOpen: boolean;
};

const WalletConnectorContext = createContext<WalletConnectState>({
  defaultChainId: null,
  requestSig: false,
  state: initialState as S,
  dispatch: () => {},
  open: async () => {
    throw new Error("open function not implemented");
  },
  close: async (state?: S) => {
    console.warn("close function not implemented");
  },
  isOpen: false
});

export const useWalletConnector = () => useContext(WalletConnectorContext);

interface WalletConnectorProviderProps {
  children: ReactNode;
  defaultChainId: number;
  requestSig: boolean;
}

const StyledWalletConnectorProvider = styled(WalletConnectorContext.Provider)({
  ".wcm-modal": {
    zIndex: 99999
  }
});

export const WalletConnectorProvider: React.FC<
  WalletConnectorProviderProps
> = ({ children, defaultChainId, requestSig }) => {
  const [state, dispatch] = useReducer(reducer, initialState as S);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [promiseResolver, setPromiseResolver] = useState<WalletConnectCloseFn>(
    () => {}
  );

  const open: WalletConnectOpenFn = useCallback(() => {
    setIsOpen(true);
    return new Promise<S>((resolve) => {
      setPromiseResolver(() => resolve);
    });
  }, []);

  const close: WalletConnectCloseFn = useCallback(
    (result?: S) => {
      setIsOpen(false);
      if (promiseResolver) {
        promiseResolver(result);
      }
    },
    [promiseResolver]
  );

  return (
    <StyledWalletConnectorProvider
      value={{
        open,
        close,
        dispatch,
        state,
        isOpen,
        defaultChainId,
        requestSig
      }}
    >
      {children}
    </StyledWalletConnectorProvider>
  );
};
