import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { tokenValueFormatter } from "morpher-trading-sdk"

interface PortfolioChartProps {
  data: [number, number][] | undefined;
  timeRange: 'd' | 'w' | 'm' | 'y';
}

export const PortfolioChart = React.memo(function PortfolioChart({ data, timeRange }: PortfolioChartProps) {
  const chartData = React.useMemo(() => {
    if (timeRange === 'd') {
      return data?.map((d) => {
        return {
          timestamp: new Date(Number(d[0])).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: d[1],
        }
      });
    } else {
      return data?.map((d) => ({
        timestamp: new Date(Number(d[0])).toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
        value: d[1],
      }));
    }
  }, [data, timeRange]);

  const chartConfig = React.useMemo(() => {
    const isIncreasing = chartData && chartData.length > 1 ? chartData[chartData.length - 1].value >= chartData[0].value : true;
    return {
      value: {
        label: "Value",
        color: isIncreasing ? "var(--primary)" : "var(--secondary)",
      },
    } satisfies ChartConfig;
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return <div className="h-[200px] w-full mt-4 flex items-center justify-center"><p>No data available for this period.</p></div>;
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
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `$${tokenValueFormatter(value)}`}
            />
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
      </ChartContainer>
    </div>
  )
})
