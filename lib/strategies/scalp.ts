import { createClients } from "@/lib/hyperliquid";
import { ClearinghouseState, AssetPosition } from "@/types/index";

export async function runScalpStrategy(
  client: any,
  info: any,
  asset: string,
  prices: number[],
  allocation: number,
  maxTradeSize: number
) {
  if (prices.length < 14) return;
  const gains = [], losses = [];
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains.push(diff);
    else losses.push(-diff);
  }
  const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
  const rsi = 100 - 100 / (1 + avgGain / avgLoss);
  const address = await client.wallet.getAddress();
  const state = await info.clearinghouseState({ user: address }) as ClearinghouseState;
  const position = state.assetPositions.find((p: AssetPosition) => p.coin === asset)?.position || { szi: "0" };
  const currentPos = Number(position.szi);
  if (rsi < 30 && currentPos <= 0) {
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: true, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  } else if (rsi > 70 && currentPos >= 0) {
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: false, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  }
}
