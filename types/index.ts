export interface Fill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
}

export interface AssetPosition {
  coin: string; // Confirmed from API docs
  position: {
    szi: string; // Size
    // Add more if needed, e.g., entryPx, returnOnEquity
  };
}

export interface ClearinghouseState {
  assetPositions: AssetPosition[];
  // Add more, e.g., marginSummary, crossMarginSummary
}
