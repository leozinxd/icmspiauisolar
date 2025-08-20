import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";
import { EligibilityCheck } from "@/components/Calculator/EligibilityCheck";
import { TaxCalculator } from "@/components/Calculator/TaxCalculator";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

type Screen = "eligibility" | "calculator";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("eligibility");
  const [installationDate, setInstallationDate] = useState<string>("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProceedToCalculator = (date: string) => {
    setInstallationDate(date);
    setCurrentScreen("calculator");
  };

  const handleBackToEligibility = () => {
    setCurrentScreen("eligibility");
  };

  return (
    <>
      {/* Header com botões de autenticação */}
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary">Calculadora ICMS</h1>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Meu Painel
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar / Cadastrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <Footer />
      {currentScreen === "eligibility" && (
        <EligibilityCheck onProceedToCalculator={handleProceedToCalculator} />
      )}
      {currentScreen === "calculator" && (
        <TaxCalculator />
      )}
    </>
  );
};

export default Index;