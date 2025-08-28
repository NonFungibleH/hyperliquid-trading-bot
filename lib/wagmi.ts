import { http } from "viem";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

export const hyperliquidChain = {
  id: 1337,
  name: "Hyperliquid Signer",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
  },
};

export const config = createConfig({
  chains: [hyperliquidChain],
  connectors: [injected()],
  transports: {
    [hyperliquidChain.id]: http(),
  },
});
