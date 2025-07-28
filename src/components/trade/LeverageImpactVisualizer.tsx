import * as React from "react";
import { tokenValueFormatter } from "morpher-trading-sdk";
import { cn } from "@/lib/utils";

interface LeverageImpactVisualizerProps {
  leverage: number;
  tradeType: "long" | "short";
  marketPrice: number;
  spread: number;
}

export function LeverageImpactVisualizer({
  leverage,
  tradeType,
  marketPrice,
  spread,
}: LeverageImpactVisualizerProps) {
  const calculations = React.useMemo(() => {
    if (marketPrice === 0) {
      return { entryPrice: 0, liquidationPrice: 0, profitTargetPrice: 0 };
    }

    const entryPrice =
      tradeType === "long"
        ? marketPrice * (1 + spread)
        : marketPrice * (1 - spread);

    const liquidationPrice =
      tradeType === "long"
        ? entryPrice * (1 - 1 / leverage)
        : entryPrice * (1 + 1 / leverage);

    const profitTargetPrice =
      tradeType === "long"
        ? entryPrice * (1 + 1 / leverage)
        : entryPrice * (1 - 1 / leverage);

    return { entryPrice, liquidationPrice, profitTargetPrice };
  }, [leverage, tradeType, marketPrice, spread]);

  const TableRow = ({
    label,
    value,
    className,
  }: {
    label: string;
    value: string;
    className?: string;
  }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-gray-200/50 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", className)}>{value}</span>
    </div>
  );

  return (
    <div className="text-xs bg-muted p-3 rounded-md mt-4">
      <h4 className="font-semibold text-sm mb-2 text-center">Leverage Impact</h4>
      <TableRow
        label="Market Price"
        value={`$${tokenValueFormatter(marketPrice)}`}
      />
      <TableRow
        label="Entry Price (w/ Spread)"
        value={`$${tokenValueFormatter(calculations.entryPrice)}`}
      />
      <TableRow
        label="Est. 100% Profit Price"
        value={`$${tokenValueFormatter(calculations.profitTargetPrice)}`}
        className="text-primary"
      />
      <TableRow
        label="Est. Liquidation Price"
        value={`$${tokenValueFormatter(calculations.liquidationPrice)}`}
        className="text-secondary"
      />
      <p className="text-center text-muted-foreground pt-2 text-xs">
        A daily interest fee of ~{((leverage - 1) * 0.03).toFixed(4)}% applies to the total position value when using leverage.
      </p>
    </div>
  );
}
