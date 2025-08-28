import * as hl from "@nktkas/hyperliquid";

export function createClients(address: string) {
  const transport = new hl.HttpTransport(); // Or WebSocketTransport for faster

  const info = new hl.InfoClient({ transport });
  const sub = new hl.SubscriptionClient({ transport: new hl.WebSocketTransport() });
  const exch = new hl.ExchangeClient({ wallet: address as `0x${string}`, transport }); // WalletClient if using viem, but string for simple sign

  return { info, sub, exch };
}
