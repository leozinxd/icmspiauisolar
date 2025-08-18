import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Calculator, 
  FileText, 
  Download, 
  Eye, 
  LogOut, 
  TrendingUp,
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CalculationDetails } from '@/components/Calculator/CalculationDetails';

interface Calculation {
  id: string;
  supply_type: string;
  injected_energy: number;
  consumption: number;
  installation_date: string;
  total_amount: number;
  months_count: number;
  created_at: string;
  user_id: string | null;
  profiles?: {
    display_name: string;
    email: string;
  } | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [userCalculations, setUserCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');
  const [selectedCalculation, setSelectedCalculation] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCalculations();
  }, [user, navigate]);

  const fetchCalculations = async () => {
    setLoading(true);
    try {
      // Buscar todos os cálculos com informações do usuário
      const { data: allData, error: allError } = await supabase
        .from('calculations')
        .select(`
          *,
          profiles (
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Buscar apenas cálculos do usuário atual
      const { data: userData, error: userError } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      setCalculations((allData as any) || []);
      setUserCalculations(userData || []);
    } catch (error) {
      console.error('Erro ao buscar cálculos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const downloadPDF = async (calculation: Calculation) => {
    try {
      // Importar jsPDF dinamicamente para evitar problemas de SSR
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      // Buscar detalhes do cálculo
      const { data: details, error } = await supabase
        .from('calculation_details')
        .select('*')
        .eq('calculation_id', calculation.id)
        .order('month_year', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório de Ressarcimento ICMS', 20, 20);
      
      // Informações gerais
      doc.setFontSize(12);
      doc.text(`Tipo de Fornecimento: ${calculation.supply_type}`, 20, 40);
      doc.text(`Energia Injetada: ${calculation.injected_energy} kWh`, 20, 50);
      doc.text(`Consumo: ${calculation.consumption} kWh`, 20, 60);
      doc.text(`Data de Instalação: ${formatDate(calculation.installation_date)}`, 20, 70);
      doc.text(`Total de Meses: ${calculation.months_count}`, 20, 80);
      doc.text(`Valor Total: ${formatCurrency(calculation.total_amount)}`, 20, 90);
      doc.text(`Indenização Final: ${formatCurrency(calculation.total_amount * 2)}`, 20, 100);

      // Tabela de detalhes
      const tableData = details?.map(detail => [
        new Date(detail.month_year).toLocaleDateString("pt-BR", { year: 'numeric', month: 'long' }),
        `${detail.monthly_consumption || 0} kWh`,
        formatCurrency(detail.base_value),
        `${(detail.ipca_rate * 100).toFixed(4)}%`,
        formatCurrency(detail.corrected_value),
        formatCurrency(detail.corrected_value - detail.base_value)
      ]) || [];

      // @ts-ignore - jsPDF autoTable plugin
      doc.autoTable({
        startY: 120,
        head: [['Mês/Ano', 'Consumo (kWh)', 'Valor Base', 'Taxa IPCA', 'Valor Corrigido', 'Diferença']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      doc.save(`relatorio-icms-${calculation.id.slice(-8)}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const currentData = filter === 'all' ? calculations : userCalculations;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Calculadora ICMS</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>
                <Calculator className="w-4 h-4 mr-2" />
                Nova Análise
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minhas Análises</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{userCalculations.length}</div>
              <p className="text-xs text-muted-foreground">
                Total de faturas analisadas por você
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(userCalculations.reduce((sum, calc) => sum + calc.total_amount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor corrigido das suas análises
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Indenização Final</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(userCalculations.reduce((sum, calc) => sum + calc.total_amount * 2, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total da indenização
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Cálculos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Histórico de Análises
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie todas as análises de faturas
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filter} onValueChange={(value: 'all' | 'mine') => setFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">Minhas Análises</SelectItem>
                    <SelectItem value="all">Todas as Análises</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Energia Injetada</TableHead>
                    <TableHead>Consumo</TableHead>
                    <TableHead>Meses</TableHead>
                    <TableHead>Valor Corrigido</TableHead>
                    <TableHead>Indenização</TableHead>
                    {filter === 'all' && <TableHead>Usuário</TableHead>}
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((calculation) => (
                    <TableRow key={calculation.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(calculation.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{calculation.supply_type}</Badge>
                      </TableCell>
                      <TableCell>{calculation.injected_energy} kWh</TableCell>
                      <TableCell>{calculation.consumption} kWh</TableCell>
                      <TableCell>{calculation.months_count}</TableCell>
                      <TableCell className="font-medium text-success">
                        {formatCurrency(calculation.total_amount)}
                      </TableCell>
                      <TableCell className="font-medium text-destructive">
                        {formatCurrency(calculation.total_amount * 2)}
                      </TableCell>
                      {filter === 'all' && (
                        <TableCell>
                          <div className="text-sm">
                            <div>{calculation.profiles?.display_name || 'Usuário'}</div>
                            <div className="text-muted-foreground text-xs">
                              {calculation.profiles?.email || calculation.user_id ? 'Registrado' : 'Anônimo'}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalculationDetails calculationId={calculation.id} />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPDF(calculation)}
                            className="h-8"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {currentData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={filter === 'all' ? 9 : 8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma análise encontrada</p>
                          {filter === 'mine' && (
                            <Button
                              variant="link"
                              onClick={() => navigate('/')}
                              className="mt-2"
                            >
                              Fazer primeira análise
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}