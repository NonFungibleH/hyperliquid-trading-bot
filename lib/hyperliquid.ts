import { http } from "viem";
import { hexToSignature, signTypedData } from "viem/accounts";

const API_URL = 'https://api.hyperliquid.xyz';
const WS_URL = 'wss://api.hyperliquid.xyz/ws';

export async function createClients(address: string, privateKey?: string) {
  // Info: POST to /info for queries
  const info = {
    clearinghouseState: async (params: { user: string }) => {
      const response = await fetch(`${API_URL}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clearinghouseState', ...params }),
      });
      return response.json() as Promise<ClearinghouseState>;
    },
    // Add more info endpoints if needed
  };

  // Subscription: WebSocket
  const sub = {
    userFills: (params: { user: string }, callback: (data: any) => void) => {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "userFills", user: params.user } }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data.data || data);
      };
      ws.onclose = () => console.log('WS closed');
      return ws;
    },
    trades: (params: { coin: string }, callback: (data: any) => void) => {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin: params.coin } }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data.data || data);
      };
      ws.onclose = () => console.log('WS closed');
      return ws;
    },
  };

  // Exchange: POST to /exchange for orders, with signing
  const exch = {
    order: async (orderParams: any) => {
      if (!privateKey) throw new Error('Private key required for signing');
      // EIP-712 signing (adapt from docs/Python SDK)
      const domain = {
        name: 'HyperliquidSignTransaction',
        version: '1',
        chainId: 42161, // Arbitrum One, per Hyperliquid
        verifyingContract: '0x0000000000000000000000000000000000000000', // Placeholder; check docs
      };
      const types = {
        Transaction: [
          { name: 'user', type: 'address' },
          { name: 'nonce', type: 'uint64' },
          { name: 'signature', type: 'bytes' },
          { name: 'grouping', type: 'string' },
          { name: 'orders', type: 'Order[]' },
        ],
        Order: [
          { name: 'a', type: 'uint32' }, // Asset index
          { name: 'b', type: 'bool' }, // Buy
          { name: 'p', type: 'string' }, // Price
          { name: 's', type: 'string' }, // Size
          { name: 'r', type: 'bool' }, // Reduce only
          { name: 't', type: 'Limit' }, // Type
        ],
        Limit: [
          { name: 'tif', type: 'string' }, // Time in force
        ],
      };
      const message = {
        user: address,
        nonce: Date.now(), // Use a proper nonce
        grouping: orderParams.grouping,
        orders: orderParams.orders,
      };
      const signature = await signTypedData({
        privateKey: privateKey as `0x${string}`,
        domain,
        types,
        primaryType: 'Transaction',
        message,
      });
      const response = await fetch(`${API_URL}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...message,
          signature: hexToSignature(signature),
        }),
      });
      return response.json();
    },
  };

  return { info, sub, exch };
}
