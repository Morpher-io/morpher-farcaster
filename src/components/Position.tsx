import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tokenValueFormatter, usdFormatter } from "morpher-trading-sdk";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { usePortfolioStore } from "@/store/portfolio";

interface PositionProps {
  closeButton?: boolean;
}

export function Position({ closeButton }: PositionProps) {
  if (closeButton == undefined) {
    closeButton = true;
  }
  const {
    selectedPosition,
    setTradeDirection,
    setClosePercentage,
    tradeDirection,
    currencyList,
  } = usePortfolioStore();
  const [closeExecuting] = React.useState(false);

  const executeClose = async () => {
    if (closeExecuting) {
      return;
    }
    setClosePercentage(100);
    setTradeDirection("close");
  };

  return (
    <Card className="mt-0 mb-4 bg-white">
      <CardHeader>
        <CardTitle>
          {selectedPosition?.name && tradeDirection === "close"
            ? selectedPosition?.name + " Position"
            : "Open Position"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPosition ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className={`font-semibold`}>
                  {currencyList?.MPH?.usd_exchange_rate
                    ? "$ " +
                      usdFormatter(
                        (Number(selectedPosition.value) / 10 ** 18) *
                          currencyList?.MPH?.usd_exchange_rate,
                      )
                    : ""}
                  &nbsp;(
                  {tokenValueFormatter(
                    Number(selectedPosition.value) / 10 ** 18,
                  )}
                  {" MPH)"}
                  <br></br>
                  <span
                    className={` text-[${
                      selectedPosition.direction === "long"
                        ? "var(--primary)"
                        : "var(--secondary)"
                    }]`}
                  >
                    {selectedPosition.direction == "long" ? "Long" : "Short"}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Returns</p>
                <p
                  className={`font-semibold text-[${
                    Number(selectedPosition.total_return || 0) >= 0
                      ? "var(--primary)"
                      : "var(--secondary)"
                  }]`}
                >
                  {tokenValueFormatter(
                    Number(selectedPosition.total_return) / 10 ** 18,
                  )}
                  {" MPH "}(
                  {(
                    Number(selectedPosition.total_return_percent || 0) * 100
                  ).toFixed(2)}
                  %)
                </p>
              </div>
              <div className="text-left">
                <p className="text-muted-foreground">Entry Price</p>
                <p className="font-semibold">
                  ${" "}
                  {usdFormatter(
                    Number(selectedPosition?.average_price) / 10 ** 8,
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-muted-foreground">Leverage</p>
                <p className="font-semibold">
                  {usdFormatter(
                    Number(selectedPosition?.average_leverage) / 10 ** 8,
                  )}{" "}
                  x
                </p>
              </div>
            </div>
            {closeButton && (
              <Button
                className="mt-4 w-full"
                onClick={executeClose}
                variant={"default"}
              >
                {closeExecuting && <Loader2Icon className="animate-spin" />}
                <span className="text-white">Close</span>
              </Button>
            )}
          </>
        ) : (
          <p>Loading position details...</p>
        )}
      </CardContent>
    </Card>
  );
}
