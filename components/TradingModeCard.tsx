"use client";

import { useState, useEffect } from "react";
import { ExchangeClient, SubscriptionClient, InfoClient } from "@nktkas/hyperliquid";
import { runSwingStrategy } from "@/lib/strategies/swing";
import { runScalpStrategy } from "@/lib/strategies/scalp";
import { runMomentumStrategy } from "@/lib/strategies/momentum";

interface Props {
  mode: "swing" | "scalp" | "momentum";
  pnl: number;
  client: ExchangeClient | null;
  subClient: SubscriptionClient | null;
  infoClient: InfoClient | null;
}

export default function TradingModeCard({ mode, pnl, client, subClient, infoClient }: Props) {
  const [active, setActive] = useState(false);
  const [allocation, setAllocation] = useState(100); // USDC
  const [maxTradeSize, setMaxTradeSize] = useState(0.1); // e.g., 0.1 BTC
  const [prices, setPrices] = useState<{ [asset: string]: number[] }>({});

  const assets = mode === "swing" ? ["BTC", "ETH"] : mode === "scalp" ? ["SOL", "HYPE"] : ["XRP", "FARTCOIN"];

  useEffect(() => {
    if (active && subClient) {
      // Subscribe to real-time prices for each asset
      assets.forEach(asset => {
        if (!prices[asset]) prices[asset] = [];
        subClient.trades({ coin: asset }, (data) => {
          const latestPrice = data[0]?.p || 0;
          setPrices((prev) => ({
            ...prev,
            [asset]: [...(prev[asset] || []).slice(-100), latestPrice],
          }));
        });
      });

      const interval = setInterval(async () => {
        if (client && infoClient) {
          const strategyFn = mode === "swing" ? runSwingStrategy :
                            mode === "scalp" ? runScalpStrategy : runMomentumStrategy;
          for (const asset of assets) {
            if (prices[asset]?.length >= 50) { // Ensure enough data
              await strategyFn(client, infoClient, asset, prices[asset], allocation / assets.length, maxTradeSize);
            }
          }
        }
      }, 60000); // Run every minute

      return () => clearInterval(interval);
    }
  }, [active, prices, client, subClient, infoClient, mode, allocation, maxTradeSize]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl capitalize">{mode} Mode ({assets.join(", ")})</h2>
      <p>P&L: ${pnl.toFixed(2)}</p>
      <label>
        Allocation (USDC):
        <input
          type="number"
          value={allocation}
          onChange={(e) => setAllocation(Number(e.target.value))}
          className="bg-gray-700 text-white p-1 ml-2"
        />
      </label>
      <label className="ml-4">
        Max Trade Size:
        <input
          type="number"
          value={maxTradeSize}
          onChange={(e) => setMaxTradeSize(Number(e.target.value))}
          className="bg-gray-700 text-white p-1 ml-2"
        />
      </label>
      <button
        onClick={() => setActive(!active)}
        className={`mt-2 ${active ? "bg-red-500" : "bg-green-500"} hover:opacity-80 text-white font-bold py-1 px-2 rounded`}
      >
        {active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}
