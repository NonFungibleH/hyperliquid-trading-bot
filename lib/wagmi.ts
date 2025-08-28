import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { PhantomConnector } from "wagmi/connectors/phantom";

const { chains, publicClient } = configureChains([arbitrum], [publicProvider()]);

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors: [
    new PhantomConnector({
      chains,
      options: {
        appName: "Hyperliquid Trading Bot",
        network: "arbitrum", // Ensure Arbitrum
      },
    }),
  ],
});

export { config as wagmiConfig, chains };
