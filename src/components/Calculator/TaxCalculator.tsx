import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft, DollarSign, FileText } from "lucide-react";
import { calculateMonetaryCorrection, getIPCARate } from "@/lib/ipca";
import { CalculationDetails } from "./CalculationDetails";
import { supabase } from "@/integrations/supabase/client";

interface TaxCalculatorProps {
  onBackToEligibility: () => void;
  installationDate: string;
}

export function TaxCalculator({ onBackToEligibility, installationDate }: TaxCalculatorProps) {
  const [supplyType, setSupplyType] = useState<"monofasico" | "trifasico" | "">("");
  const [injected, setInjected] = useState("");
  const [consumption, setConsumption] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [calculationId, setCalculationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateMonthsDifference = (installationDate: string): number => {
    const installation = new Date(installationDate);
    const currentDate = new Date();
    const june2024 = new Date("2024-06-02");
    
    // Data de início elegível: maior entre instalação e junho de 2024
    const startDate = installation > june2024 ? installation : june2024;
    
    // Calcular meses elegíveis (apenas a partir de junho de 2024)
    const monthsEligible = 
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (currentDate.getMonth() - startDate.getMonth());
    
    // Retornar apenas se for positivo (não pode ter meses antes de junho 2024)
    return Math.max(0, monthsEligible);
  };

  const updateStats = async (reimbursementValue: number) => {
    // Manter localStorage por compatibilidade
    const currentInvoices = localStorage.getItem('analyzedInvoices');
    const currentDebt = localStorage.getItem('totalGovernmentDebt');
    
    const newInvoiceCount = (currentInvoices ? parseInt(currentInvoices) : 0) + 1;
    const newTotalDebt = (currentDebt ? parseFloat(currentDebt) : 0) + reimbursementValue;
    
    localStorage.setItem('analyzedInvoices', newInvoiceCount.toString());
    localStorage.setItem('totalGovernmentDebt', newTotalDebt.toString());
    
    // Dispatch custom event to update footer
    window.dispatchEvent(new CustomEvent('statsUpdated'));
  };

  const calculateReimbursement = async () => {
    if (!supplyType || !injected || !consumption) return;
    
    const injectedNum = parseInt(injected);
    const consumptionNum = parseInt(consumption); // Valor médio mensal informado
    
    const installationDateObj = new Date(installationDate);
    const currentDate = new Date();
    const monthsDifference = calculateMonthsDifference(installationDate);
    
    let totalCorrectedValue = 0;
    const details: any[] = [];
    
    // Data de início elegível: a partir de junho de 2024
    const june2024 = new Date("2024-06-02");
    const startDate = installationDateObj > june2024 ? installationDateObj : june2024;
    
    // Calcular para cada mês elegível
    for (let i = 0; i < monthsDifference; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      // Aplicar variação de ±20% no consumo para simular realidade
      const variation = 0.8 + (Math.random() * 0.4); // Entre 0.8 e 1.2 (±20%)
      const consumptionVar = Math.round(consumptionNum * variation);
      const injectedVar = Math.round(injectedNum * variation);
      
      // CC = Consumo Compensado (usar o consumo variado)
      const CC = Math.min(consumptionVar, injectedVar);
      const monthlyConsumption = CC;
      
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
      
      // Taxa IPCA acumulada para este período
      const ipcaRate = getIPCARate(monthDate.getFullYear(), monthDate.getMonth() + 1);
      
      details.push({
        monthYear: monthDate,
        baseValue: monthlyValue,
        correctedValue: correctedMonthlyValue,
        ipcaRate: correctedMonthlyValue / monthlyValue - 1, // Taxa efetiva aplicada
        monthlyConsumption: monthlyConsumption // Armazenar o consumo compensado específico do mês
      });
      
      totalCorrectedValue += correctedMonthlyValue;
    }
    
    // Como se trata de indenização, o valor é dobrado
    const finalValue = totalCorrectedValue * 2;
    
    try {
      // Salvar no Supabase
      const { data: calculationData, error: calculationError } = await supabase
        .from('calculations')
        .insert({
          supply_type: supplyType,
          injected_energy: injectedNum,
          consumption: consumptionNum,
          installation_date: installationDate,
          total_amount: finalValue,
          months_count: monthsDifference
        })
        .select()
        .single();

      if (calculationError) {
        console.error('Erro ao salvar cálculo:', calculationError);
      } else if (calculationData) {
        setCalculationId(calculationData.id);
        
        // Salvar detalhes mensais
        const detailsToInsert = details.map(detail => ({
          calculation_id: calculationData.id,
          month_year: detail.monthYear.toISOString().split('T')[0],
          base_value: detail.baseValue,
          corrected_value: detail.correctedValue,
          ipca_rate: detail.ipcaRate,
          monthly_consumption: detail.monthlyConsumption
        }));
        
        const { error: detailsError } = await supabase
          .from('calculation_details')
          .insert(detailsToInsert);
          
        if (detailsError) {
          console.error('Erro ao salvar detalhes:', detailsError);
        }
      }
    } catch (error) {
      console.error('Erro ao conectar com o banco:', error);
    }
    
    setResult(finalValue);
    await updateStats(finalValue);
  };

  const formatDate = (date) => {
    const dateObj = new Date(date);
    return dateObj.setDate(dateObj.getDate() + 1).toLocaleDateString("pt-BR")
  }

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
                Data de instalação: {formatDate(installationDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Faturas corrigidas: {calculateMonthsDifference(installationDate)}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={calculateReimbursement}
            disabled={!supplyType || !injected || !consumption || loading}
            className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {loading ? "CALCULANDO..." : "VERIFICAR VALOR DISPONÍVEL"}
          </Button>
          
          {result !== null && (
            <>
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
              
              <CalculationDetails calculationId={calculationId} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
