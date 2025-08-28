import { Fill } from "@/types";

interface Props {
  fills: Fill[];
}

export default function TradeHistory({ fills }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg w-full max-w-2xl">
      <h2 className="text-xl mb-2">Past Trades</h2>
      <ul>
        {fills.map((fill, i) => (
          <li key={i} className="border-b py-1">
            {fill.coin} - {fill.side} {fill.sz} @ {fill.px} ({new Date(fill.time).toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  );
}
