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

export function TaxCalculator() {
  const { user } = useAuth();
  const [supplyType, setSupplyType] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [injectedEnergy, setInjectedEnergy] = useState<string>("");
  const [consumption, setConsumption] = useState<string>("");
  const [installationDate, setInstallationDate] = useState<Date | undefined>(undefined);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateTax = async () => {
    if (!supplyType || !injectedEnergy || !consumption || !installationDate) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const currentDate = new Date();
      const installDate = new Date(installationDate);
      
      // Data de referência: 02 de junho de 2024
      const referenceDate = new Date("2024-06-02");
      
      // Verificar se a instalação é elegível (antes de junho de 2024)
      if (installDate >= referenceDate) {
        toast.error("Instalações após junho de 2024 não são elegíveis");
        setLoading(false);
        return;
      }

      // Calcular meses elegíveis (de junho 2024 até hoje)
      const monthsCount = Math.max(0, 
        (currentDate.getFullYear() - referenceDate.getFullYear()) * 12 + 
        (currentDate.getMonth() - referenceDate.getMonth())
      );

      if (monthsCount <= 0) {
        toast.error("Nenhum mês elegível encontrado");
        setLoading(false);
        return;
      }

      let totalAmount = 0;
      const allCalculations: any[] = [];

      // Calcular para cada mês desde junho de 2024
      for (let i = 0; i < monthsCount; i++) {
        const monthDate = new Date(referenceDate);
        monthDate.setMonth(monthDate.getMonth() + i);
        
        // Energia compensada (menor valor entre injetada e consumida)
        const compensatedEnergy = Math.min(parseInt(injectedEnergy), parseInt(consumption));
        
        // Cálculo do valor mensal
        const monthlyValue = compensatedEnergy * 0.73 * 0.2215 + compensatedEnergy * 0.27 * 0.2215;
        
        // Aplicar correção IPCA
        const ipcaDataItem = ipcaData.find(item => 
          item.year === monthDate.getFullYear() && 
          item.month === monthDate.getMonth() + 1
        );
        
        const ipcaRate = ipcaDataItem ? ipcaDataItem.rate / 100 : 0;
        const correctedValue = monthlyValue * (1 + ipcaRate);
        
        allCalculations.push({
          month: monthDate.getMonth() + 1,
          year: monthDate.getFullYear(),
          baseValue: monthlyValue,
          correctedValue: correctedValue,
          ipcaRate: ipcaRate
        });
        
        totalAmount += correctedValue;
      }

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

            <div>
              <Label>Data de Instalação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !installationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {installationDate ? format(installationDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={installationDate}
                    onSelect={setInstallationDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={calculateTax}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground"
          >
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
            </>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              <Calculator className="w-4 h-4 mr-2" />
              NOVO CÁLCULO
            </Button>
            {user && (
              <Button
                variant="default"
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                OPÇÕES AVANÇADAS
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}