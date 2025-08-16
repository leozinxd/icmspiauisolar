// Dados históricos do IPCA (Índice Nacional de Preços ao Consumidor Amplo)
// Fonte: IBGE - valores acumulados mensais

interface IPCAData {
  year: number;
  month: number;
  rate: number; // Taxa percentual mensal
}

// Dados do IPCA de 2020 até 2024
export const ipcaData: IPCAData[] = [
  // 2020
  { year: 2020, month: 1, rate: 0.21 },
  { year: 2020, month: 2, rate: 0.25 },
  { year: 2020, month: 3, rate: 0.07 },
  { year: 2020, month: 4, rate: -0.31 },
  { year: 2020, month: 5, rate: -0.38 },
  { year: 2020, month: 6, rate: 0.26 },
  { year: 2020, month: 7, rate: 0.36 },
  { year: 2020, month: 8, rate: 0.24 },
  { year: 2020, month: 9, rate: 0.64 },
  { year: 2020, month: 10, rate: 0.86 },
  { year: 2020, month: 11, rate: 0.89 },
  { year: 2020, month: 12, rate: 1.35 },
  
  // 2021
  { year: 2021, month: 1, rate: 0.25 },
  { year: 2021, month: 2, rate: 0.86 },
  { year: 2021, month: 3, rate: 0.93 },
  { year: 2021, month: 4, rate: 0.31 },
  { year: 2021, month: 5, rate: 0.83 },
  { year: 2021, month: 6, rate: 0.53 },
  { year: 2021, month: 7, rate: 0.96 },
  { year: 2021, month: 8, rate: 0.87 },
  { year: 2021, month: 9, rate: 1.16 },
  { year: 2021, month: 10, rate: 1.25 },
  { year: 2021, month: 11, rate: 0.95 },
  { year: 2021, month: 12, rate: 0.73 },
  
  // 2022
  { year: 2022, month: 1, rate: 0.54 },
  { year: 2022, month: 2, rate: 1.01 },
  { year: 2022, month: 3, rate: 1.62 },
  { year: 2022, month: 4, rate: 1.06 },
  { year: 2022, month: 5, rate: 0.47 },
  { year: 2022, month: 6, rate: 0.67 },
  { year: 2022, month: 7, rate: -0.68 },
  { year: 2022, month: 8, rate: -0.36 },
  { year: 2022, month: 9, rate: -0.29 },
  { year: 2022, month: 10, rate: 0.59 },
  { year: 2022, month: 11, rate: 0.41 },
  { year: 2022, month: 12, rate: 0.62 },
  
  // 2023
  { year: 2023, month: 1, rate: 0.53 },
  { year: 2023, month: 2, rate: 0.84 },
  { year: 2023, month: 3, rate: 0.71 },
  { year: 2023, month: 4, rate: 0.61 },
  { year: 2023, month: 5, rate: 0.23 },
  { year: 2023, month: 6, rate: 0.08 },
  { year: 2023, month: 7, rate: 0.12 },
  { year: 2023, month: 8, rate: 0.23 },
  { year: 2023, month: 9, rate: 0.26 },
  { year: 2023, month: 10, rate: 0.24 },
  { year: 2023, month: 11, rate: 0.28 },
  { year: 2023, month: 12, rate: 0.56 },
  
  // 2024
  { year: 2024, month: 1, rate: 0.42 },
  { year: 2024, month: 2, rate: 0.83 },
  { year: 2024, month: 3, rate: 0.16 },
  { year: 2024, month: 4, rate: 0.38 },
  { year: 2024, month: 5, rate: 0.46 },
  { year: 2024, month: 6, rate: 0.21 },
  { year: 2024, month: 7, rate: 0.38 },
  { year: 2024, month: 8, rate: 0.02 },
  { year: 2024, month: 9, rate: 0.44 },
  { year: 2024, month: 10, rate: 0.56 },
  { year: 2024, month: 11, rate: 0.39 },
  { year: 2024, month: 12, rate: 0.52 },
];

export function getIPCARate(year: number, month: number): number {
  const data = ipcaData.find(item => item.year === year && item.month === month);
  return data ? data.rate / 100 : 0; // Retorna em decimal (ex: 0.0021 para 0.21%)
}

export function calculateMonetaryCorrection(
  baseValue: number,
  startDate: Date,
  endDate: Date = new Date()
): number {
  let correctedValue = baseValue;
  let currentDate = new Date(startDate);
  
  // Aplica correção mês a mês
  while (currentDate < endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() retorna 0-11
    
    const ipcaRate = getIPCARate(year, month);
    correctedValue = correctedValue * (1 + ipcaRate);
    
    // Avança para o próximo mês
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return correctedValue;
}