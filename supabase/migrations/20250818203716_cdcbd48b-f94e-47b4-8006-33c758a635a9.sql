-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem seu próprio perfil
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para usuários criarem seu próprio perfil
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Adicionar coluna user_id na tabela calculations
ALTER TABLE public.calculations 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_calculations_user_id ON public.calculations(user_id);

-- Atualizar políticas da tabela calculations para considerar usuários
DROP POLICY IF EXISTS "Permitir acesso público aos cálculos" ON public.calculations;

-- Política para usuários autenticados verem todos os cálculos (admins)
CREATE POLICY "Authenticated users can view all calculations" 
ON public.calculations 
FOR SELECT 
TO authenticated
USING (true);

-- Política para usuários criarem seus próprios cálculos
CREATE POLICY "Users can create their own calculations" 
ON public.calculations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para usuários atualizarem seus próprios cálculos
CREATE POLICY "Users can update their own calculations" 
ON public.calculations 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Atualizar políticas da tabela calculation_details
DROP POLICY IF EXISTS "Permitir acesso público aos detalhes" ON public.calculation_details;

-- Política para usuários autenticados verem todos os detalhes
CREATE POLICY "Authenticated users can view all calculation details" 
ON public.calculation_details 
FOR SELECT 
TO authenticated
USING (true);

-- Política para inserir detalhes de cálculo
CREATE POLICY "Users can create calculation details" 
ON public.calculation_details 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para atualizar detalhes de cálculo
CREATE POLICY "Users can update calculation details" 
ON public.calculation_details 
FOR UPDATE 
TO authenticated
USING (true);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at na tabela profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();