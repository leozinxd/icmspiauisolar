import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft, DollarSign } from "lucide-react";

interface TaxCalculatorProps {
  onBackToEligibility: () => void;
}

export function TaxCalculator({ onBackToEligibility }: TaxCalculatorProps) {
  const [supplyType, setSupplyType] = useState<"monofasico" | "trifasico" | "">("");
  const [injected, setInjected] = useState("");
  const [consumption, setConsumption] = useState("");
  const [installationDate, setInstallationDate] = useState("");
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

  const calculateReimbursement = () => {
    if (!supplyType || !injected || !consumption || !installationDate) return;
    
    const injectedNum = parseInt(injected);
    const consumptionNum = parseInt(consumption);
    
    // CC = Consumo Compensado
    const CC = Math.min(consumptionNum, injectedNum);
    
    // BTB = Benefício Tarifário Bruto
    const BTB = CC * 0.73;
    
    // IBTB = ICMS BTB
    const IBTB = BTB * 0.2215;
    
    // FB = Fio B
    const FB = CC * 0.27;
    
    // IFB = ICMS Fio B
    const IFB = FB * 0.2215;
    
    // TL = Tempo Limite
    const TL = calculateMonthsDifference(installationDate);
    
    // RD = Ressarcimento Disponível
    const RD = (IFB + IBTB) * TL;
    
    setResult(RD);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/20 flex items-center justify-center p-4">
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
                Consumo (kWh)
              </Label>
              <Input
                id="consumption"
                type="number"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="installation-date-calc" className="text-sm font-medium">
              Data de Instalação do Sistema
            </Label>
            <Input
              id="installation-date-calc"
              type="date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
            />
            {installationDate && (
              <p className="text-xs text-muted-foreground">
                Meses com energia solar: {calculateMonthsDifference(installationDate)}
              </p>
            )}
          </div>
          
          <Button 
            onClick={calculateReimbursement}
            disabled={!supplyType || !injected || !consumption || !installationDate}
            className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            VERIFICAR VALOR DISPONÍVEL
          </Button>
          
          {result !== null && (
            <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-success">
                  Ressarcimento Disponível
                </p>
                <p className="text-3xl font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(result)}
                </p>
                <p className="text-xs text-muted-foreground">
                  *Valor estimado baseado nos dados informados
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}