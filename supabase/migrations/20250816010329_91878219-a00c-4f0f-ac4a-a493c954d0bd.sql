-- Criar tabela para armazenar os cálculos de ressarcimento
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supply_type TEXT NOT NULL CHECK (supply_type IN ('monofasico', 'trifasico')),
  injected_energy INTEGER NOT NULL CHECK (injected_energy >= 0),
  consumption INTEGER NOT NULL CHECK (consumption >= 0),
  installation_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  months_count INTEGER NOT NULL CHECK (months_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para armazenar o detalhamento mensal dos cálculos
CREATE TABLE public.calculation_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculation_id UUID NOT NULL REFERENCES public.calculations(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- Data do mês (ex: 2024-01-01 para janeiro de 2024)
  base_value DECIMAL(12,2) NOT NULL CHECK (base_value >= 0), -- Valor base antes da correção
  corrected_value DECIMAL(12,2) NOT NULL CHECK (corrected_value >= 0), -- Valor após correção monetária
  ipca_rate DECIMAL(8,6) NOT NULL, -- Taxa IPCA aplicada
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_details ENABLE ROW LEVEL SECURITY;

-- Como não há autenticação implementada, vamos permitir acesso público por enquanto
-- IMPORTANTE: Implementar autenticação antes de usar em produção
CREATE POLICY "Permitir acesso público aos cálculos" 
ON public.calculations 
FOR ALL 
USING (true);

CREATE POLICY "Permitir acesso público aos detalhes" 
ON public.calculation_details 
FOR ALL 
USING (true);

-- Criar função para atualizar o timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar automaticamente o campo updated_at
CREATE TRIGGER update_calculations_updated_at
  BEFORE UPDATE ON public.calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_calculations_created_at ON public.calculations(created_at DESC);
CREATE INDEX idx_calculation_details_calculation_id ON public.calculation_details(calculation_id);
CREATE INDEX idx_calculation_details_month_year ON public.calculation_details(month_year);