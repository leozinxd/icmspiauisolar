import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface EligibilityCheckProps {
  onProceedToCalculator: () => void;
}

export function EligibilityCheck({ onProceedToCalculator }: EligibilityCheckProps) {
  const [installationDate, setInstallationDate] = useState("");
  const [result, setResult] = useState<"eligible" | "not-eligible" | null>(null);

  const checkEligibility = () => {
    if (!installationDate) return;
    
    const cutoffDate = new Date("2023-01-06");
    const enteredDate = new Date(installationDate);
    
    if (enteredDate < cutoffDate) {
      setResult("not-eligible");
    } else {
      setResult("eligible");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Verificação de Elegibilidade
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Verifique se você tem direito ao ressarcimento de ICMS
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="installation-date" className="text-sm font-medium">
              Data de instalação do sistema solar
            </Label>
            <Input
              id="installation-date"
              type="date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={checkEligibility}
            disabled={!installationDate}
            className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground"
          >
            Verificar Elegibilidade
          </Button>
          
          {result && (
            <div className={`mt-6 p-4 rounded-lg border-l-4 ${
              result === "eligible" 
                ? "bg-success/10 border-l-success text-success-foreground" 
                : "bg-yellow-50 border-l-yellow-400 text-yellow-800"
            }`}>
              <div className="flex items-center space-x-2">
                {result === "eligible" ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <p className="font-medium">
                  {result === "eligible" 
                    ? "Você pode ter valores a receber!" 
                    : "Você é GD1 e não deve se preocupar AINDA!"
                  }
                </p>
              </div>
              {result === "eligible" && (
                <Button 
                  onClick={onProceedToCalculator}
                  className="mt-4 w-full bg-success hover:bg-success/90 text-success-foreground"
                >
                  Ir para Calculadora
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}