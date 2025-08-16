import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyDetail {
  monthYear: Date;
  baseValue: number;
  correctedValue: number;
  ipcaRate: number;
}

interface CalculationDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  installationDate: string;
  monthlyDetails: MonthlyDetail[];
  totalAmount: number;
}

export function CalculationDetails({ 
  isOpen, 
  onClose, 
  installationDate, 
  monthlyDetails, 
  totalAmount 
}: CalculationDetailsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-primary">
            Detalhamento Mensal da Indenização
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5">
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Data de Instalação</p>
                <p className="font-semibold">
                  {format(new Date(installationDate), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-success/5">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Total de Meses</p>
                <p className="font-semibold">{monthlyDetails.length}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-destructive/5">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Total da Indenização</p>
                <p className="font-semibold text-destructive">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalAmount)}
                </p>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="p-4">
              <div className="grid gap-3">
                {monthlyDetails.map((detail, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Período
                          </p>
                          <p className="font-semibold">
                            {format(detail.monthYear, "MMMM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            Valor Base
                          </p>
                          <p className="font-semibold text-primary">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(detail.baseValue)}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            IPCA
                          </p>
                          <p className="font-semibold text-orange-600">
                            {(detail.ipcaRate * 100).toFixed(4)}%
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            Valor Corrigido
                          </p>
                          <p className="font-semibold text-success">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(detail.correctedValue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              * Valores corrigidos pelo IPCA (Índice Nacional de Preços ao Consumidor Amplo)
              <br />
              * O valor final da indenização é dobrado conforme legislação aplicável
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}