import React, { useMemo, useState } from "react";
import {
  styled,
  Typography,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  Box,
  Link,
  Theme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Connector, useConnect } from "wagmi";
import AutLogo from "./assets/AutLogo";
import { AutWalletConnectorProps } from "./types";
import { useWalletConnector } from "./WalletConnectorProvider";
import { buttonConfigs, getFilteredConnectors } from "./buttons";

const DialogInnerContent = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gridGap: "12px",
  marginTop: "24px",
  marginBottom: "16px"
});

export const AutWalletConnector = ({
  loadingContent,
  connect
}: AutWalletConnectorProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isXXL = useMediaQuery(theme.breakpoints.up("xxl" as any));

  const { connectors } = useConnect();
  const { close, isOpen } = useWalletConnector();
  const [connector, setConnector] = useState<Connector>();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const btnConfig = useMemo(() => buttonConfigs(window), [window]);

  const filteredConnectors = useMemo(
    () => getFilteredConnectors(connectors, window),
    [connectors]
  );

  const handleConnect = async (c: Connector) => {
    try {
      setError(null);
      setIsConnecting(true);
      setConnector(c);
      const newState = await connect(c);
      if (newState?.error) {
        setError(newState?.error);
      } else {
        close(newState);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConnector(null);
      setIsConnecting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        fullScreen={isMobile}
        PaperProps={{
          className: "wallet-connector-modal"
        }}
        sx={{
          "&.MuiModal-root .wallet-connector-modal": {
            borderColor: "divider",
            backgroundColor: "#1E2430",
            borderRadius: {
              sm: "12px"
            },
            boxShadow:
              "0px 16px 80px 0px #2E90FA, 0px 0px 16px 0px rgba(20, 200, 236, 0.64), 0px 0px 16px 0px rgba(20, 200, 236, 0.32)"
          }
        }}
      >
        <DialogContent
          sx={{
            ...(!isMobile &&
              !isXXL && {
                maxWidth: {
                  xs: "100%",
                  sm: "420px"
                },
                minWidth: {
                  xs: "100%",
                  sm: "420px"
                },
                minHeight: {
                  xs: "100%",
                  sm: "450px"
                }
              }),
            ...(isXXL && {
              maxWidth: {
                xs: "100%",
                sm: "600px"
              },
              minWidth: {
                xs: "100%",
                sm: "600px"
              },
              minHeight: {
                xs: "100%",
                sm: "650px"
              }
            }),
            padding: {
              xs: "20px",
              sm: "28px",
              md: "32px",
              lg: "40px"
            },
            display: "flex",
            alignItems: "center",
            flexDirection: "column"
          }}
        >
          <IconButton
            aria-label="close"
            onClick={() => close(null)}
            type="button"
            sx={{
              color: "white",
              position: "absolute",
              right: "15px",
              top: "15px"
            }}
          >
            <CloseIcon />
          </IconButton>

          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                mb: 2
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "22px",
                  left: "22px",
                  marginLeft: "-35px"
                }}
              >
                <AutLogo />
              </Box>
            </Box>
            {isConnecting && (
              <div style={{ position: "relative", flex: 1 }}>
                {loadingContent}
              </div>
            )}
            {!isConnecting && (
              <>
                <Typography color="white" variant="subtitle2">
                  Connect your wallet
                </Typography>
                <DialogInnerContent>
                  {filteredConnectors.map((c) => (
                    // @ts-ignore
                    <Button
                      disabled={
                        isConnecting ||
                        c.id === connector?.id ||
                        (isMobile && !btnConfig[c.id]?.forMobile)
                      }
                      key={c.id}
                      onClick={() => handleConnect(c)}
                      endIcon={btnConfig[c.id]?.icon}
                      variant="outlined"
                      size="normal"
                      color="offWhite"
                      sx={{
                        "&.MuiButtonBase-root": {
                          borderRadius: "8px",
                          borderWidth: "1px",
                          justifyContent: "space-between",
                          px: "24px",
                          textTransform: "none"
                        },

                        ".MuiButton-endIcon svg": {
                          width: "30px",
                          height: "30px"
                        },
                        minWidth: {
                          xs: "260px",
                          md: "280px",
                          lg: "300px",
                          xxl: "440px"
                        }
                      }}
                    >
                      {c.name}
                    </Button>
                  ))}
                </DialogInnerContent>

                {error && (
                  <Alert
                    sx={{
                      width: "90%",
                      borderRadius: "8px"
                    }}
                    severity="error"
                  >
                    {error}
                  </Alert>
                )}
              </>
            )}

            <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                color: "offWhite.main"
              }}
              variant="body1"
            >
              Want to learn more?{" "}
              <Link
                variant="body1"
                target="_blank"
                href="https://docs.aut.id/v2"
                sx={{
                  color: "offWhite.main",
                  textDecoration: "underline"
                }}
              >
                Check our docs
              </Link>
            </Typography>

            <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                color: (theme: Theme) => theme.palette["offWhite"].dark
              }}
              variant="caption"
            >
              Wallets are provided by External Providers and by selecting you
              agree to Terms of those Providers. Your access to the wallet might
              be reliant on the External Provider being operational.
            </Typography>
          </>
        </DialogContent>
      </Dialog>
    </>
  );
};
