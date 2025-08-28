"use client";
import { useState, useEffect } from "react";
import { createClients } from "@/lib/hyperliquid"; // Updated import
import { runSwingStrategy } from "@/lib/strategies/swing";
import { runScalpStrategy } from "@/lib/strategies/scalp";
import { runMomentumStrategy } from "@/lib/strategies/momentum";
import { useAccount } from "wagmi"; // For address

interface Props {
  mode: "swing" | "scalp" | "momentum";
  pnl: number;
}

export default function TradingModeCard({ mode, pnl }: Props) {
  const [active, setActive] = useState(false);
  const [allocation, setAllocation] = useState(100); // USDC
  const [maxTradeSize, setMaxTradeSize] = useState(0.1); // e.g., 0.1 BTC
  const [prices, setPrices] = useState<{ [asset: string]: number[] }>({});
  const { address } = useAccount(); // Get address from Wagmi
  const assets = mode === "swing" ? ["BTC", "ETH"] : mode === "scalp" ? ["SOL", "HYPE"] : ["XRP", "FARTCOIN"];
  const [client, setClient] = useState<any>(null); // Temporary any for new API
  const [subClient, setSubClient] = useState<any>(null);
  const [infoClient, setInfoClient] = useState<any>(null);

  useEffect(() => {
    if (active && address) {
      const { info, sub, exch } = createClients(address); // No privateKey yet
      setClient(exch);
      setSubClient(sub);
      setInfoClient(info);

      // Subscribe to real-time prices for each asset
      assets.forEach((asset) => {
        if (!prices[asset]) prices[asset] = [];
        sub.userFills({ user: address }, (data) => {
          const latestPrice = Array.isArray(data) ? data[0]?.px || 0 : data?.px || 0; // Adjust based on API response
          setPrices((prev) => ({
            ...prev,
            [asset]: [...(prev[asset] || []).slice(-100), latestPrice],
          }));
        });
      });

      const interval = setInterval(async () => {
        if (client && infoClient) {
          const strategyFn =
            mode === "swing"
              ? runSwingStrategy
              : mode === "scalp"
              ? runScalpStrategy
              : runMomentumStrategy;
          for (const asset of assets) {
            if (prices[asset]?.length >= 50) {
              await strategyFn(client, infoClient, asset, prices[asset], allocation / assets.length, maxTradeSize);
            }
          }
        }
      }, 60000); // Run every minute
      return () => clearInterval(interval);
    }
  }, [active, prices, address, mode, allocation, maxTradeSize]);

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
