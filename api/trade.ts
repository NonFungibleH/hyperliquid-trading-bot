import { NextResponse } from "next/server";
import { createClients } from "@/lib/hyperliquid";
import { runSwingStrategy } from "@/lib/strategies/swing";
import { runScalpStrategy } from "@/lib/strategies/scalp";
import { runMomentumStrategy } from "@/lib/strategies/momentum";
import { ClearinghouseState } from "@/types/index";

export async function GET() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) return NextResponse.json({ error: "PRIVATE_KEY not set" }, { status: 500 });

  const address = "0xYourAddress"; // Derive from privateKey if needed (use viem to compute)
  const { info, sub, exch } = createClients(address, privateKey);

  const modes = [
    { mode: "swing", assets: ["BTC", "ETH"] },
    { mode: "scalp", assets: ["SOL", "HYPE"] },
    { mode: "momentum", assets: ["XRP", "FARTCOIN"] },
  ];

  const prices: { [asset: string]: number[] } = {};
  modes.forEach(({ assets }) => assets.forEach((asset) => (prices[asset] = [])));

  // Simulate subscription with a single fetch (Vercel serverless limitation)
  for (const { assets } of modes) {
    for (const asset of assets) {
      const response = await fetch(`https://api.hyperliquid.xyz/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "trades", coin: asset }),
      });
      const data = await response.json();
      const latestPrice = Array.isArray(data) ? data[0]?.px || 0 : data?.px || 0;
      prices[asset] = [latestPrice]; // Single price for now
    }
  }

  // Run strategies
  for (const { mode, assets } of modes) {
    const strategyFn =
      mode === "swing"
        ? runSwingStrategy
        : mode === "scalp"
        ? runScalpStrategy
        : runMomentumStrategy;
    for (const asset of assets) {
      if (prices[asset].length > 0) {
        await strategyFn(exch, info, asset, prices[asset], 100 / assets.length, 0.1);
      }
    }
  }

  return NextResponse.json({ message: "Trade execution triggered" });
}
