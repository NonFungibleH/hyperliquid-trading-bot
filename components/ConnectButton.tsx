"use client";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export default function ConnectButton() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    // Phantom connect handled by wagmiConfig
    // No manual connect needed with autoConnect: true
  };

  return (
    <Button onClick={isConnected ? disconnect : handleConnect}>
      {isConnected ? "Disconnect" : "Connect Phantom"}
    </Button>
  );
}
