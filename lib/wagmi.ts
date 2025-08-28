// lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { walletConnect } from "wagmi/connectors";
import { coinbaseWallet } from "wagmi/connectors";

// Phantom's EVM wallet is picked up by the injected() connector (window.ethereum).
// If you want ONLY injected, you can remove the other connectors below.

export const config = createConfig({
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http(), // swap to your own RPC if you hit rate limits
  },
  connectors: [
    injected({ shimDisconnect: true }),
    // Optional connectors (comment out if not needed)
    walletConnect({ projectId: "YOUR_WALLETCONNECT_PROJECT_ID" }),
    coinbaseWallet({ appName: "Hyperliquid Trading Bot" })
  ]
});

// (Export chains if you reference them elsewhere)
export const chains = [arbitrum];
