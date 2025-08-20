import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, DollarSign, Calculator, FileText, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ipcaData } from "@/lib/ipca";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface TaxCalculatorProps {
  onBackToEligibility: () => void;
  installationDate: string;
}
export function TaxCalculator() {
  const { user } = useAuth();
  const [supplyType, setSupplyType] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [injectedEnergy, setInjectedEnergy] = useState<string>("");
  const [consumption, setConsumption] = useState<string>("");
  const [installationDate, setInstallationDate] = useState<Date | undefined>(undefined);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculationId, setCalculationId] = useState<string | null>(null);
  
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

    setLoading(true);

     // Como se trata de indenização, o valor é dobrado
    const finalValue = totalCorrectedValue * 2;

      // Salvar no banco de dados
      const { data, error } = await supabase.from("calculations").insert({
        supply_type: supplyType,
        client_name: clientName || null,
        injected_energy: parseInt(injectedEnergy),
        consumption: parseInt(consumption),
        installation_date: installationDate?.toISOString().split('T')[0],
        total_amount: totalAmount,
        months_count: allCalculations.length,
        user_id: user?.id || null
      });

      if (error) {
        console.error("Erro ao salvar:", error);
        toast.error("Erro ao salvar o cálculo");
      } else {
        toast.success("Cálculo realizado com sucesso!");
      }
const { data: calculationData, error: calculationError } = await supabase
        .from('calculations')
        .insert({
          supply_type: supplyType,
          injected_energy: injectedNum,
          consumption: consumptionNum,
          installation_date: installationDate,
          total_amount: finalValue,
          months_count: monthsDifference,
          user_id: user?.id || null
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
      setResult(totalAmount);
    } catch (error) {
      console.error("Erro no cálculo:", error);
      toast.error("Erro ao realizar o cálculo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Calculadora de Ressarcimento ICMS
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Digite o nome do cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="supply">Tipo de Fornecimento</Label>
              <Select value={supplyType} onValueChange={setSupplyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de fornecimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monofásico">Monofásico</SelectItem>
                  <SelectItem value="Bifásico">Bifásico</SelectItem>
                  <SelectItem value="Trifásico">Trifásico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="injectedEnergy">Energia Injetada (kWh)</Label>
                <Input
                  id="injectedEnergy"
                  type="number"
                  placeholder="Digite a energia injetada"
                  value={injectedEnergy}
                  onChange={(e) => setInjectedEnergy(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="consumption">Consumo (kWh)</Label>
                <Input
                  id="consumption"
                  type="number"
                  placeholder="Digite o consumo"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                />
              </div>
            </div>

           <p className="text-sm font-medium text-muted-foreground">
                Data de instalação: {formatDate(installationDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Faturas corrigidas: {calculateMonthsDifference(installationDate)}
              </p>

          <Button 
            onClick={calculateReimbursement}
            disabled={!supplyType || !injected || !consumption || loading}
            <DollarSign className="w-4 h-4 mr-2" />
            {loading ? "CALCULANDO..." : "VERIFICAR VALOR DISPONÍVEL"}
            <DollarSign className="w-4 h-4 mr-2" />
          </Button>
          
          {result !== null && (
            <>
               {!user && (
                 <div className="mt-6 p-4 rounded-lg border-l-4 bg-yellow-50 border-l-yellow-400 text-yellow-800">
                   <div className="flex items-center space-x-2">
                     <AlertCircle className="w-5 h-5 text-yellow-600" />
                     <Link to="/auth" className="font-medium hover:underline cursor-pointer">
                       FAÇA O LOGIN E ACESSE AS OPÇÕES AVANÇADAS
                     </Link>
                   </div>
                 </div>
               )}
              <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-success">
                    VALOR DISPONÍVEL
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
