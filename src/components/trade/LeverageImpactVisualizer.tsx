import * as React from "react";
import { tokenValueFormatter } from "morpher-trading-sdk";
import { LineChart, Line, XAxis, YAxis, ReferenceDot } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useTranslation } from "react-i18next";

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

    const { t } = useTranslation();
  
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
    // Calculate the domain based on a 1x leverage scenario to keep the axis stable.
    const effectiveSpread1x = spread * 1;
    const entryPrice1x =
      tradeType === "long"
        ? marketPrice * (1 + effectiveSpread1x)
        : marketPrice * (1 - effectiveSpread1x);

    const liquidationPrice1x =
      tradeType === "long" ? 0 : entryPrice1x * 2;
    const profitTargetPrice1x =
      tradeType === "long" ? entryPrice1x * 2 : 0;

    const prices = [liquidationPrice1x, profitTargetPrice1x, marketPrice];
    
    if (prices.some((p) => p === undefined || !isFinite(p))) {
      return [0, 0];
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      const price = minPrice;
      const padding = price > 0 ? price * 0.2 : 1;
      return [price - padding, price + padding];
    }

    const padding = (maxPrice - minPrice) * 0.1; // 10% padding
    const finalMin = Math.max(0, minPrice - padding);
    return [finalMin, maxPrice + padding];
  }, [tradeType, marketPrice, spread]);

  const plotPoints = [
    {
      price: marketPrice,
      name: "Market",
      fill: "var(--muted-foreground)",
    },
    { price: entryPrice, name: "Entry", fill: "var(--foreground)" },
    {
      price: liquidationPrice,
      name: "Liquidation",
      fill: "var(--secondary)",
    },
    {
      price: profitTargetPrice,
      name: "100% Profit",
      fill: "var(--primary)",
    },
  ];

  // const CustomDotLabel = (props: any) => {
  //   const { cx, cy, point } = props;
  //   if (!point || typeof cx !== "number" || typeof cy !== "number") return null;
  //   return (
  //     <>
  //       <text
  //         x={cx}
  //         y={cy - 10}
  //         textAnchor="middle"
  //         fill={point.fill}
  //         fontSize={10}
  //         fontWeight="bold"
  //       >
  //         {point.name}
  //       </text>
  //       <text
  //         x={cx}
  //         y={cy + 15}
  //         textAnchor="middle"
  //         fill="var(--muted-foreground)"
  //         fontSize={10}
  //       >
  //         ${tokenValueFormatter(point.price)}
  //       </text>
  //     </>
  //   );
  // };

  if (domain[0] === domain[1]) {
    return null;
  }

  const sortedPlotPoints = React.useMemo(() => {
    return [...plotPoints].sort((a, b) => a.price - b.price);
  }, [plotPoints]);

  return (
    <div className="bg-[var(--warning)] p-3 rounded-md mt-4">
       <h4 className="font-semibold text-sm mb-2 text-left flex items-center">
        <img
            src={`/assets/icons/lev.svg`}
            alt={`leverage icon`}
            className="w-5 h-5 mr-2"
        /> 
        {t('LEV_HEAD')}
      </h4>
       <p className="text-xs">
          {t('LEV_DESCRIPTION' )}
        </p>



      <div className="h-14 w-full mt-4">
        <ChartContainer config={{}} className="w-full h-full">
          <LineChart
            data={[{ price: domain[0], y: 5 }, { price: domain[1], y: 5 }]}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <XAxis
              type="number"
              dataKey="price"
              domain={domain}
              axisLine={false}
              tickLine={false}
              ticks={[domain[0], domain[1]]}
              tickFormatter={(value) => `$${tokenValueFormatter(value)}`}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              dy={5}
            />
            <YAxis hide domain={[0, 10]} />
            <Line
              dataKey="y"
              stroke="var(--border)"
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
                stroke="var(--background)"
                strokeWidth={2}
                ifOverflow="visible"
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>

      <div className="flex justify-around mt-2 text-xs">
        {sortedPlotPoints.map((p) => (
          <div key={p.name} className="flex flex-col items-center text-center">
            <span style={{ color: p.fill }} className="font-bold">
              {p.name}
            </span>
            <span className="text-muted-foreground">
              ${tokenValueFormatter(p.price)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-left text-foreground pt-2 text-xs mt-4">
        A daily interest fee of ~{((leverage - 1) * 0.03).toFixed(4)}% applies
        to the total position value when using leverage.
      </p>

              <p className="text-xs font-semibold mt-4">
          {t('RISK_HEAD' )}
        </p>
        <p className="text-xs">
          {t('LEV_RISK' )}
        </p>
    </div>
  );
}
