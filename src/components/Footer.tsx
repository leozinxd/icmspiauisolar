import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileText, AlertTriangle } from "lucide-react";

export function Footer() {
  const [analyzedInvoices, setAnalyzedInvoices] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);

  useEffect(() => {
    const loadStats = () => {
      const invoices = localStorage.getItem('analyzedInvoices');
      const debt = localStorage.getItem('totalGovernmentDebt');
      
      setAnalyzedInvoices(invoices ? parseInt(invoices) : 0);
      setTotalDebt(debt ? parseFloat(debt) : 0);
    };

    loadStats();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadStats();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('statsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('statsUpdated', handleStorageChange);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Faturas Analisadas
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {analyzedInvoices.toLocaleString('pt-BR')}
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">
                ATÉ AGORA O GOVERNO ESTÁ DEVENDO
              </span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalDebt)}
            </p>
          </Card>
        </div>
      </div>
    </footer>
  );
}