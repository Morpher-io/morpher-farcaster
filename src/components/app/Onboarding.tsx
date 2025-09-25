import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface OnboardingProps {
  onClose: () => void;
}

export function Onboarding({ onClose }: OnboardingProps) {
  const { t } = useTranslation();
  const openDocs = () => {
    window.open('https://api-docs.morpher.com/farcaster-user-guide', "_blank")
  }
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <img
          src={`/assets/logos/morpher-green.svg`}
          alt={`Morpher Logo`}
          className=""
        />
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-md mx-auto text-left">
          <div className="space-y-2   mb-10">
            <h1 className="text-2xl font-bold">{t('onboarding.WELCOME_TITLE')}</h1>
            <p className="text-foreground">{t('onboarding.WELCOME_SUBTITLE')}</p>
          </div>
          
          <div className="relative rounded-lg bg-[#DFFBE9] p-6 pb-16">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{t('onboarding.STEP1_TITLE')}</h2>
              <p className="text-foreground">{t('onboarding.STEP1_DESCRIPTION')}</p>
            </div>
            <img
              src="/assets/onboarding/what-to-trade.svg"
              alt={t('onboarding.STEP1_TITLE')}
              className="absolute bottom-0 right-0 w-38"
            />
          </div>

           <div className="relative rounded-lg bg-[#FFF9E3] p-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{t('onboarding.STEP2_TITLE')}</h2>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start gap-3 pb-2">
                  <img src="/assets/icons/tick.svg" alt="tick" className="h-5 w-5 mt-0.5" />
                  <span>{t('onboarding.STEP2_ITEM1')}</span>
                </li>
                <li className="flex items-start gap-3 pb-2">
                  <img src="/assets/icons/tick.svg" alt="tick" className="h-5 w-5 mt-0.5" />
                  <span>{t('onboarding.STEP2_ITEM2')}</span>
                </li>
                <li className="flex items-start gap-3 pb-2">
                  <img src="/assets/icons/tick.svg" alt="tick" className="h-5 w-5 mt-0.5" />
                  <span>{t('onboarding.STEP2_ITEM3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <img src="/assets/icons/tick.svg" alt="tick" className="h-5 w-5 mt-0.5" />
                  <span>{t('onboarding.STEP2_ITEM4')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative rounded-lg bg-[#F6EBFF] p-6 pb-18">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{t('onboarding.STEP3_TITLE')}</h2>
              <p className="text-foreground" dangerouslySetInnerHTML={{ __html: t('onboarding.STEP3_DESCRIPTION') }} />
            </div>
            <img
              src="/assets/onboarding/stay-in-control.svg"
              alt={t('onboarding.STEP3_TITLE')}
              className="absolute bottom-0 right-0 w-38"
            />
          </div>


{/* 
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Stay In control</h2>
            <p className="text-foreground">Close a position anytime, or open a new one.</p>
          </div> */}
        </div>
      </div>
      <footer className="p-4 border-t bg-background">
        <Button className="w-full" size="lg" onClick={onClose}>
          {t('onboarding.START_TRADING_BUTTON')}
        </Button>
        <Button className="w-full" size="lg" variant={'ghost'} onClick={openDocs}>
          {t('onboarding.LEARN_MORE_BUTTON')} <span className="font-semibold underline text-[var(--blue)]">{t('onboarding.MORPHER_GUIDE')}</span>
        </Button>
      </footer>
    </div>
  );
}
