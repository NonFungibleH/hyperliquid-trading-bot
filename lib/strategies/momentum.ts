import { ExchangeClient, InfoClient } from "@nktkas/hyperliquid";

// Simple ROC for momentum. Optimize here.
export async function runMomentumStrategy(
  client: ExchangeClient,
  info: InfoClient,
  asset: string,
  prices: number[],
  allocation: number,
  maxTradeSize: number
) {
  if (prices.length < 10) return;

  const roc = (prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10] * 100;

  const state = await info.clearinghouseState({ user: await client.wallet.getAddress() });
  const position = state.assetPositions.find((p) => p.coin === asset)?.position || { szi: 0 };

  const currentPos = Number(position.szi);

  if (roc > 5 && currentPos <= 0) {
    // Positive momentum, buy
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: true, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  } else if (roc < -5 && currentPos >= 0) {
    // Negative momentum, sell
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: false, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  }
}
