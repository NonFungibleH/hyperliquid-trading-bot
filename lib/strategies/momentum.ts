import { createClients } from "@/lib/hyperliquid";
import { ClearinghouseState, AssetPosition } from "@/types/index"; // Updated types

export async function runMomentumStrategy(
  client: any, // Temporary any for new API
  info: any,
  asset: string,
  prices: number[],
  allocation: number,
  maxTradeSize: number
) {
  if (prices.length < 10) return;
  const roc = ((prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]) * 100;
  const address = await client.wallet.getAddress(); // Assume wallet access
  const state = await info.clearinghouseState({ user: address }) as ClearinghouseState;
  const position = state.assetPositions.find((p: AssetPosition) => p.coin === asset)?.position || { szi: "0" };
  const currentPos = Number(position.szi);
  if (roc > 5 && currentPos <= 0) {
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: true, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  } else if (roc < -5 && currentPos >= 0) {
    const size = Math.min(maxTradeSize, allocation / prices[prices.length - 1]);
    await client.order({
      orders: [{ a: 0, b: false, p: "market", s: size.toString(), r: false, t: { limit: { tif: "Ioc" } } }],
      grouping: "na",
    });
  }
}
