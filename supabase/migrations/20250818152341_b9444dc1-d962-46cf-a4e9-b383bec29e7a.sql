-- Adicionar coluna monthly_consumption à tabela calculation_details
ALTER TABLE public.calculation_details 
ADD COLUMN monthly_consumption integer;