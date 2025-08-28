import { ExchangeClient, InfoClient } from "@nktkas/hyperliquid";

// Simple SMA crossover for swing (longer-term). Optimize here.
export async function runSwingStrategy(
  client: ExchangeClient,
  info: InfoClient,
  asset: string,
  prices: number[],
  allocation: number,
  maxTradeSize: number
) {
  if (prices.length < 50) return; // Need data

  const shortSMA = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const longSMA = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;

  const state = await info.clearinghouseState({ user: await client.wallet.getAddress() });
  const position = state.assetPositions.find((p) => p.coin === asset)?.position || { szi: 0 };

  const currentPos = Number(position.szi);

  if (shortSMA > longSMA && currentPos <= 0) {
    // Buy signal
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: true, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  } else if (shortSMA < longSMA && currentPos >= 0) {
    // Sell signal
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: false, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  }
}
