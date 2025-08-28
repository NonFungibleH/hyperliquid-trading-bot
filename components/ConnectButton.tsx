"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { hyperliquidChain } from "@/lib/wagmi";

export default function ConnectButton() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const handleConnect = () => {
    const metaMaskConnector = connectors.find((c) => c.id === "injected");
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
      switchChain({ chainId: hyperliquidChain.id });
    }
  };

  return (
    <button
      onClick={isConnected ? disconnect : handleConnect}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-8"
    >
      {isConnected ? "Disconnect" : "Connect MetaMask"}
    </button>
  );
}
