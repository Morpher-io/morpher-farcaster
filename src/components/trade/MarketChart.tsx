import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { StrictOHLCArray } from "morpher-trading-sdk"
import { tokenValueFormatter } from "morpher-trading-sdk"

interface MarketChartProps {
  data: StrictOHLCArray[] | undefined;
  timeRange: string
}

export const MarketChart = React.memo(function MarketChart({ data, timeRange }: MarketChartProps) {
  const chartData = React.useMemo(() => {
    if (timeRange == '1D') {
    return data?.map((d) => {
      return {
      timestamp: new Date(Number(d[0]) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      close: d[4],
    }});

    } else {
    return data?.map((d) => ({
      timestamp: new Date(Number(d[0]) * 1000).toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
      close: d[4],
    }));

    }
  }, [data, timeRange]);

  const chartConfig = React.useMemo(() => {
    const isIncreasing = chartData && chartData.length > 1 ? chartData[chartData.length - 1].close >= chartData[0].close : true;
    return {
      close: {
        label: "Price",
        color: isIncreasing ? "hsl(var(--primary))" : "hsl(var(--secondary))",
      },
    } satisfies ChartConfig;
  }, [chartData]);

  const yAxisDomain = React.useMemo(() => {
    if (!chartData || chartData.length < 2) {
      return ["auto", "auto"];
    }

    const values = chartData.map((d) => d.close);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue === maxValue) {
        const margin = Math.abs(minValue * 0.1) || 1;
        return [minValue - margin, maxValue + margin];
    }
    
    const margin = (maxValue - minValue) * 0.1;

    return [minValue - margin, maxValue + margin];
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return null;
  }

  return (
    <div className="h-[200px] w-full mt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: -50,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              type={'category'}
              // tickFormatter={(tickFormat) => {
              //   console.log('tickFormat', tickFormat)
              //   return 'aa'
              //   let date = new Date(Number(tickFormat))
              //   console.log('date', date)
              //   return Date.toString();
              // }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              domain={yAxisDomain}
              tickFormatter={(value) => `$${tokenValueFormatter(value)}`}
            />
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              dataKey="close"
              type="monotone"
              stroke="var(--color-close)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
      </ChartContainer>
    </div>
  )
})
