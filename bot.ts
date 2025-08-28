import { createClients } from "./lib/hyperliquid";
import { runSwingStrategy } from "./lib/strategies/swing";
import { runScalpStrategy } from "./lib/strategies/scalp";
import { runMomentumStrategy } from "./lib/strategies/momentum";
import { ClearinghouseState } from "./types/index";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set in .env");

async function main() {
  const address = "0xYourAddress"; // Derive from private key if needed
  const { info, sub, exch } = createClients(address, PRIVATE_KEY);

  const modes = [
    { mode: "swing", assets: ["BTC", "ETH"] },
    { mode: "scalp", assets: ["SOL", "HYPE"] },
    { mode: "momentum", assets: ["XRP", "FARTCOIN"] },
  ];

  const prices: { [asset: string]: number[] } = {};
  modes.forEach(({ assets }) =>
    assets.forEach((asset) => (prices[asset] = []))
  );

  // Subscribe to prices (using trades channel as proxy)
  modes.forEach(({ assets }) =>
    assets.forEach((asset) =>
      sub.trades({ coin: asset }, (data) => {
        const latestPrice = Array.isArray(data) ? data[0]?.px || 0 : data?.px || 0;
        prices[asset] = [...(prices[asset] || []).slice(-100), latestPrice];
      })
    )
  );

  // Run strategies periodically
  setInterval(async () => {
    for (const { mode, assets } of modes) {
      const strategyFn =
        mode === "swing"
          ? runSwingStrategy
          : mode === "scalp"
          ? runScalpStrategy
          : runMomentumStrategy;
      for (const asset of assets) {
        if (prices[asset].length >= 50) {
          await strategyFn(exch, info, asset, prices[asset], 100 / assets.length, 0.1);
        }
      }
    }
  }, 60000); // Every minute
}

main().catch(console.error);
