import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CalculationDetail {
  id: string;
  month_year: string;
  base_value: number;
  corrected_value: number;
  ipca_rate: number;
}

interface CalculationDetailsProps {
  calculationId: string | null;
}

export function CalculationDetails({ calculationId }: CalculationDetailsProps) {
  const [details, setDetails] = useState<CalculationDetail[]>([]);
  const [loading, setLoading] = useState(false);

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
                        <TableHead className="text-right">Valor Base</TableHead>
                        <TableHead className="text-right">Taxa IPCA</TableHead>
                        <TableHead className="text-right">Valor Corrigido</TableHead>
                        <TableHead className="text-right">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail) => {
                        const difference = detail.corrected_value - detail.base_value;
                        return (
                          <TableRow key={detail.id}>
                            <TableCell className="font-medium">
                              {formatDate(detail.month_year)}
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