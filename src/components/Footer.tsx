import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const [analyzedInvoices, setAnalyzedInvoices] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('calculations')
        .select('total_amount.sum()', { count: 'exact', head: true });

      if (error) throw error;
      setAnalyzedInvoices(parseInt(count));
      setTotalDebt(parseFloat(data.totalDebt));
    } catch (error) {
      console.error('Erro ao buscar informações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <Card className="text-center">
            <div className="p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{analyzedInvoices}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Faturas Analisadas
              </p>
            </div>
          </Card>
          
          <Card className="text-center">
            <div className="p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-xs font-medium text-destructive mb-1">
                ATÉ AGORA O GOVERNO ESTÁ DEVENDO
              </p>
              <p className="text-lg font-bold text-destructive">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalDebt)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </header>
  );
}
