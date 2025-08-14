import { useState } from "react";
import { EligibilityCheck } from "@/components/Calculator/EligibilityCheck";
import { TaxCalculator } from "@/components/Calculator/TaxCalculator";

type Screen = "eligibility" | "calculator";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("eligibility");
  const [installationDate, setInstallationDate] = useState<string>("");

  const handleProceedToCalculator = (date: string) => {
    setInstallationDate(date);
    setCurrentScreen("calculator");
  };

  const handleBackToEligibility = () => {
    setCurrentScreen("eligibility");
  };

  return (
    <>
      {currentScreen === "eligibility" && (
        <EligibilityCheck onProceedToCalculator={handleProceedToCalculator} />
      )}
      {currentScreen === "calculator" && (
        <TaxCalculator onBackToEligibility={handleBackToEligibility} installationDate={installationDate} />
      )}
    </>
  );
};

export default Index;