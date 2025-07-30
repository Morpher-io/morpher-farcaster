import { useConnect } from "wagmi";
import { useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { useTranslation } from "react-i18next";

export function Connect() {
  const { t } = useTranslation();
  
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  return (
    <div className="bg-[var(--primary)] flex flex-col items-center p-4" style={{ minHeight: 'calc(100vh)' }}>
      <div className="flex-1 flex items-center justify-center">
        <div id="logo-text" className=" flex flex-col items-center">
          <img
            src={`/src/assets/logos/morpher.svg`}
            alt={`Morpher Logo`}
            className="h-25 w-25 animate-spin [animation-duration:20s]"
          />
          <p className="text-white mt-4 text-xl">{t('CONNECTING_WALLET')}...</p>
        </div>
      </div>
    </div>
    
  );
}
