import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getIPCARate } from "@/lib/ipca";
import { Input } from "@/components/ui/input";

interface CalculationDetail {
  id: string;
  month_year: string;
  base_value: number;
  corrected_value: number;
  ipca_rate: number;
  monthly_consumption: number;
}

interface CalculationDetailsProps {
  calculationId: string | null;
}

export function CalculationDetails({ calculationId }: CalculationDetailsProps) {
  const [details, setDetails] = useState<CalculationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    if (calculationId) {
      fetchCalculationDetails();
    }
  }, [calculationId]);

  const fetchCalculationDetails = async () => {
    if (!calculationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calculation_details')
        .select('*')
        .eq('calculation_id', calculationId)
        .order('month_year', { ascending: true });

      if (error) throw error;
      setDetails(data || []);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { 
      year: 'numeric', 
      month: 'long'
    });
  };

  const updateConsumption = async (detailId: string, newConsumption: number) => {
    try {
      // Recalcular valores baseados no novo consumo
      const detail = details.find(d => d.id === detailId);
      if (!detail) return;

      // Usar energia injetada fixa (assumindo 1000 kWh como exemplo)
      const injectedEnergy = 1000; // Idealmente buscar do calculation original
      const CC = Math.min(newConsumption, injectedEnergy);
      const BTB = CC * 0.73;
      const IBTB = BTB * 0.2215;
      const FB = CC * 0.27;
      const IFB = FB * 0.2215;
      const newBaseValue = IFB + IBTB;

      // Recalcular correção monetária
      const monthDate = new Date(detail.month_year);
      const currentDate = new Date();
      let correctedValue = newBaseValue;
      let tempDate = new Date(monthDate);
      
      while (tempDate < currentDate) {
        const year = tempDate.getFullYear();
        const month = tempDate.getMonth() + 1;
        const ipcaRate = getIPCARate(year, month);
        correctedValue = correctedValue * (1 + ipcaRate);
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('calculation_details')
        .update({
          monthly_consumption: newConsumption,
          base_value: newBaseValue,
          corrected_value: correctedValue
        })
        .eq('id', detailId);

      if (error) throw error;

      // Atualizar estado local
      setDetails(prev => prev.map(d => 
        d.id === detailId 
          ? { 
              ...d, 
              monthly_consumption: newConsumption,
              base_value: newBaseValue,
              corrected_value: correctedValue
            }
          : d
      ));

      setEditingId(null);
    } catch (error) {
      console.error('Erro ao atualizar consumo:', error);
    }
  };

  const startEdit = (detail: CalculationDetail) => {
    setEditingId(detail.id);
    setEditValue(detail.monthly_consumption);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const saveEdit = () => {
    if (editingId && editValue > 0) {
      updateConsumption(editingId, editValue);
    }
  };

  const totalCorrectedValue = details.reduce((sum, detail) => sum + detail.corrected_value, 0);

  if (!calculationId) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          DETALHAMENTO MENSAL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Detalhamento da Correção Monetária
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Meses Calculados</p>
                  <p className="text-2xl font-bold text-primary">{details.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor Total Corrigido</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(totalCorrectedValue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Indenização Final</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalCorrectedValue * 2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando detalhes...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Mês/Ano</TableHead>
                         <TableHead className="text-right">Consumo (kWh)</TableHead>
                         <TableHead className="text-right">Valor Base</TableHead>
                         <TableHead className="text-right">Taxa IPCA</TableHead>
                         <TableHead className="text-right">Valor Corrigido</TableHead>
                         <TableHead className="text-right">Diferença</TableHead>
                         <TableHead className="text-center">Ações</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {details.map((detail) => {
                         const difference = detail.corrected_value - detail.base_value;
                         const isEditing = editingId === detail.id;
                         
                         return (
                           <TableRow key={detail.id}>
                             <TableCell className="font-medium">
                               {formatDate(detail.month_year)}
                             </TableCell>
                             <TableCell className="text-right">
                               {isEditing ? (
                                 <Input
                                   type="number"
                                   value={editValue}
                                   onChange={(e) => setEditValue(Number(e.target.value))}
                                   className="w-20 text-right"
                                   min="0"
                                 />
                               ) : (
                                 `${detail.monthly_consumption || 0} kWh`
                               )}
                             </TableCell>
                             <TableCell className="text-right">
                               {formatCurrency(detail.base_value)}
                             </TableCell>
                             <TableCell className="text-right">
                               {formatPercentage(detail.ipca_rate)}
                             </TableCell>
                             <TableCell className="text-right font-medium">
                               {formatCurrency(detail.corrected_value)}
                             </TableCell>
                             <TableCell className="text-right">
                               <span className={difference > 0 ? "text-success" : "text-muted-foreground"}>
                                 +{formatCurrency(difference)}
                               </span>
                             </TableCell>
                             <TableCell className="text-center">
                               {isEditing ? (
                                 <div className="flex gap-1 justify-center">
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     onClick={saveEdit}
                                     className="h-6 w-6 p-0"
                                   >
                                     <Save className="h-3 w-3" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     onClick={cancelEdit}
                                     className="h-6 w-6 p-0"
                                   >
                                     <X className="h-3 w-3" />
                                   </Button>
                                 </div>
                               ) : (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={() => startEdit(detail)}
                                   className="h-6 w-6 p-0"
                                 >
                                   <Edit2 className="h-3 w-3" />
                                 </Button>
                               )}
                             </TableCell>
                           </TableRow>
                         );
                       })}
                     </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {details.length > 0 && (
            <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded-lg">
              <p>
                * Os valores apresentados incluem correção monetária pelo IPCA de cada mês.
                <br />
                * O valor final da indenização é o dobro do valor corrigido, conforme legislação.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}