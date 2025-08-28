"use client";

import { useAccount } from "wagmi";
import ConnectButton from "@/components/ConnectButton";
import TradingModeCard from "@/components/TradingModeCard";
import TradeHistory from "@/components/TradeHistory";
import { useState, useEffect } from "react";
import { createClients } from "@/lib/hyperliquid";
import { InfoClient, SubscriptionClient, ExchangeClient } from "@nktkas/hyperliquid";
import { Fill } from "@/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [infoClient, setInfoClient] = useState<InfoClient | null>(null);
  const [subClient, setSubClient] = useState<SubscriptionClient | null>(null);
  const [exchClient, setExchClient] = useState<ExchangeClient | null>(null);
  const [fills, setFills] = useState<Fill[]>([]);
  const [pnls, setPnls] = useState<{ [key: string]: number }>({ swing: 0, scalp: 0, momentum: 0 });

  useEffect(() => {
  if (isConnected && address) {
    const { info, sub, exch } = createClients(address);
    setInfoClient(info);
    setSubClient(sub);
    setExchClient(exch);

    // Subscribe to fills
    sub.userFills({ user: address }, (data) => {
      const newFills = Array.isArray(data.fills) ? data.fills : [];
      if (newFills.length > 0) {
        setFills((prev) => [...prev, ...newFills]);
      } else {
        console.warn('Unexpected data format from userFills:', data);
      }
    });

    // Periodic P&L update
    const interval = setInterval(async () => {
      const state = await info.clearinghouseState({ user: address });
      // Log the structure to identify the correct property
      if (state.assetPositions.length > 0) {
        console.log('AssetPosition structure:', state.assetPositions[0]);
      }
      // Use type assertion to bypass strict typing temporarily
      const swingPnl = (state.assetPositions as any[])
        .filter((p: any) => ["BTC", "ETH"].includes(p.coin || p.asset?.coin || p.symbol || ''))
        .reduce((sum, p: any) => sum + (Number(p.position?.szi || 0)), 0);
      const scalpPnl = (state.assetPositions as any[])
        .filter((p: any) => ["SOL", "HYPE"].includes(p.coin || p.asset?.coin || p.symbol || ''))
        .reduce((sum, p: any) => sum + (Number(p.position?.szi || 0)), 0);
      const momentumPnl = (state.assetPositions as any[])
        .filter((p: any) => ["XRP", "FARTCOIN"].includes(p.coin || p.asset?.coin || p.symbol || ''))
        .reduce((sum, p: any) => sum + (Number(p.position?.szi || 0)), 0);
      setPnls({ swing: swingPnl, scalp: scalpPnl, momentum: momentumPnl });
    }, 60000);

    return () => clearInterval(interval);
  }
}, [isConnected, address]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <ConnectButton />
      {isConnected ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <TradingModeCard mode="swing" pnl={pnls.swing} client={exchClient} subClient={subClient} infoClient={infoClient} />
            <TradingModeCard mode="scalp" pnl={pnls.scalp} client={exchClient} subClient={subClient} infoClient={infoClient} />
            <TradingModeCard mode="momentum" pnl={pnls.momentum} client={exchClient} subClient={subClient} infoClient={infoClient} />
          </div>
          <TradeHistory fills={fills} />
        </>
      ) : (
        <p className="mt-4">Connect your wallet to start.</p>
      )}
    </main>
  );
}
