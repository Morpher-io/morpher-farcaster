//import { useConnect } from "wagmi";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function Connect() {
  const t = useTranslations();

  //const { connect, connectors } = useConnect();

  // useEffect(() => {
  //   if (connectors.length > 0) {
  //     connect({ connector: connectors[0] });
  //   }
  // }, [connect, connectors]);

  return (
    <div
      className="flex flex-col items-center bg-[var(--primary)] p-4"
      style={{ minHeight: "calc(100vh)" }}
    >
      <div className="flex flex-1 items-center justify-center">
        <div id="logo-text" className="flex flex-col items-center">
          <img
            src={`/assets/logos/morpher.svg`}
            alt={`Morpher Logo`}
            className="h-25 w-25 animate-spin [animation-duration:20s]"
          />
          <p className="mt-4 text-xl text-white">{t("CONNECTING_WALLET")}...</p>
        </div>
      </div>
    </div>
  );
}
