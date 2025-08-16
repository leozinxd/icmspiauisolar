import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft, DollarSign } from "lucide-react";
import { calculateMonetaryCorrection } from "@/lib/ipca";

interface TaxCalculatorProps {
  onBackToEligibility: () => void;
  installationDate: string;
}

export function TaxCalculator({ onBackToEligibility, installationDate }: TaxCalculatorProps) {
  const [supplyType, setSupplyType] = useState<"monofasico" | "trifasico" | "">("");
  const [injected, setInjected] = useState("");
  const [consumption, setConsumption] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculateMonthsDifference = (installationDate: string): number => {
    const installation = new Date(installationDate);
    const currentDate = new Date();
    const june2024 = new Date("2024-06-01");
    
    // Calcular meses desde a instalação
    const monthsSinceInstallation = 
      (currentDate.getFullYear() - installation.getFullYear()) * 12 + 
      (currentDate.getMonth() - installation.getMonth());
    
    // Calcular meses de junho de 2024 até hoje
    const monthsSinceJune2024 = 
      (currentDate.getFullYear() - june2024.getFullYear()) * 12 + 
      (currentDate.getMonth() - june2024.getMonth());
    
    // Usar o menor valor
    return Math.min(monthsSinceInstallation, monthsSinceJune2024);
  };

  const updateStats = (reimbursementValue: number) => {
    const currentInvoices = localStorage.getItem('analyzedInvoices');
    const currentDebt = localStorage.getItem('totalGovernmentDebt');
    
    const newInvoiceCount = (currentInvoices ? parseInt(currentInvoices) : 0) + 1;
    const newTotalDebt = (currentDebt ? parseFloat(currentDebt) : 0) + reimbursementValue;
    
    localStorage.setItem('analyzedInvoices', newInvoiceCount.toString());
    localStorage.setItem('totalGovernmentDebt', newTotalDebt.toString());
    
    // Dispatch custom event to update footer
    window.dispatchEvent(new CustomEvent('statsUpdated'));
  };

  const calculateReimbursement = () => {
    if (!supplyType || !injected || !consumption) return;
    
    const injectedNum = parseInt(injected);
    const consumptionNum = parseInt(consumption); // Valor médio mensal informado
    
    const installationDateObj = new Date(installationDate);
    const currentDate = new Date();
    const monthsDifference = calculateMonthsDifference(installationDate);
    
    let totalCorrectedValue = 0;
    
    // Calcular para cada mês desde a instalação
    for (let i = 0; i < monthsDifference; i++) {
      const monthDate = new Date(installationDateObj);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      // CC = Consumo Compensado (usar a média informada)
      const CC = Math.min(consumptionNum, injectedNum);
      
      // BTB = Benefício Tarifário Bruto
      const BTB = CC * 0.73;
      
      // IBTB = ICMS BTB
      const IBTB = BTB * 0.2215;
      
      // FB = Fio B
      const FB = CC * 0.27;
      
      // IFB = ICMS Fio B
      const IFB = FB * 0.2215;
      
      // Valor base para este mês
      const monthlyValue = IFB + IBTB;
      
      // Aplicar correção monetária desde este mês até hoje
      const correctedMonthlyValue = calculateMonetaryCorrection(monthlyValue, monthDate, currentDate);
      
      totalCorrectedValue += correctedMonthlyValue;
    }
    
    // Como se trata de indenização, o valor é dobrado
    const finalValue = totalCorrectedValue * 2;
    
    setResult(finalValue);
    updateStats(finalValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/20 flex items-center justify-center p-4 pt-32">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToEligibility}
            className="self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Calculadora de Ressarcimento
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Calcule o valor disponível para ressarcimento de ICMS
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="supply-type" className="text-sm font-medium">
              Tipo de Fornecimento
            </Label>
            <Select value={supplyType} onValueChange={(value) => setSupplyType(value as "monofasico" | "trifasico")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monofasico">Monofásico</SelectItem>
                <SelectItem value="trifasico">Trifásico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="injected" className="text-sm font-medium">
                Energia Injetada (kWh)
              </Label>
              <Input
                id="injected"
                type="number"
                value={injected}
                onChange={(e) => setInjected(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consumption" className="text-sm font-medium">
                Consumo Médio Mensal (kWh)
              </Label>
              <Input
                id="consumption"
                type="number"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Informe o consumo médio mensal
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">
                Data de instalação: {new Date(installationDate).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">
                Faturas incorretas: {calculateMonthsDifference(installationDate)}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={calculateReimbursement}
            disabled={!supplyType || !injected || !consumption}
            className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            VERIFICAR VALOR DISPONÍVEL
          </Button>
          
          {result !== null && (
            <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-success">
                  Indenização Disponível
                </p>
                <p className="text-3xl font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(result)}
                </p>
                <p className="text-xs text-muted-foreground">
                  *Valor com correção monetária (IPCA) e dobrado por ser indenização
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}