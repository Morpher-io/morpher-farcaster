import * as React from "react";
import { tokenValueFormatter } from "morpher-trading-sdk";
import { LineChart, Line, XAxis, YAxis, ReferenceDot } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

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

    const effectiveSpread = spread * leverage;
    const entryPrice =
      tradeType === "long"
        ? marketPrice * (1 + effectiveSpread)
        : marketPrice * (1 - effectiveSpread);

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

  const { entryPrice, liquidationPrice, profitTargetPrice } = calculations;

  const domain = React.useMemo(() => {
    const prices = [
      liquidationPrice,
      profitTargetPrice,
      entryPrice,
      marketPrice,
    ];
    if (prices.some((p) => p === undefined || isNaN(p))) {
      return [0, 0];
    }
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === Infinity || maxPrice === -Infinity) return [0, 0];
    const padding = (maxPrice - minPrice) * 0.2; // 20% padding
    return [minPrice - padding, maxPrice + padding];
  }, [liquidationPrice, profitTargetPrice, entryPrice, marketPrice]);

  const plotPoints = [
    {
      price: marketPrice,
      name: "Market",
      fill: "hsl(var(--muted-foreground))",
    },
    { price: entryPrice, name: "Entry", fill: "hsl(var(--foreground))" },
    {
      price: liquidationPrice,
      name: "Liquidation",
      fill: "hsl(var(--secondary))",
    },
    {
      price: profitTargetPrice,
      name: "100% Profit",
      fill: "hsl(var(--primary))",
    },
  ];

  const CustomDotLabel = (props: any) => {
    const { cx, cy, point } = props;
    if (!point) return null;
    return (
      <g transform={`translate(${cx},${cy})`}>
        <text
          x={0}
          y={-10}
          dy={0}
          textAnchor="middle"
          fill={point.fill}
          fontSize={10}
          fontWeight="bold"
        >
          {point.name}
        </text>
        <text
          x={0}
          y={15}
          dy={0}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
        >
          ${tokenValueFormatter(point.price)}
        </text>
      </g>
    );
  };

  if (domain[0] === domain[1]) {
    return null;
  }

  return (
    <div className="bg-muted p-3 rounded-md mt-4">
      <h4 className="font-semibold text-sm mb-2 text-center">
        Leverage Impact
      </h4>
      <div className="h-28 w-full">
        <ChartContainer config={{}} className="w-full h-full">
          <LineChart
            data={[{ price: domain[0], y: 5 }, { price: domain[1], y: 5 }]}
            margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
          >
            <XAxis
              type="number"
              dataKey="price"
              domain={domain}
              axisLine={false}
              tickLine={false}
              tick={false}
              height={1}
            />
            <YAxis hide domain={[0, 10]} />
            <Line
              dataKey="y"
              stroke="hsl(var(--border))"
              dot={false}
              strokeWidth={2}
            />

            {plotPoints.map((p) => (
              <ReferenceDot
                key={p.name}
                x={p.price}
                y={5}
                r={5}
                fill={p.fill}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                ifOverflow="visible"
                label={<CustomDotLabel point={p} />}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
      <p className="text-center text-muted-foreground pt-2 text-xs">
        A daily interest fee of ~{((leverage - 1) * 0.03).toFixed(4)}% applies
        to the total position value when using leverage.
      </p>
    </div>
  );
}
