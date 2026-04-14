/**
 * Calcula as horas de trabalho decorridas e totais do mês,
 * considerando o calendário real da barbearia:
 *   Seg–Sex: 09:00–21:00 (12h)
 *   Sábado:  09:00–18:00 (9h)
 *   Domingo: fechado (0h)
 */
export function getWorkingHours(monthYear: string): {
  elapsed: number;
  total: number;
} {
  const [year, month] = monthYear.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let elapsed = 0;
  let total = 0;

  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay(); // 0=Dom, 1=Seg... 6=Sáb

    let hours = 0;
    if (dow >= 1 && dow <= 5) hours = 12; // Seg–Sex
    else if (dow === 6) hours = 9;          // Sábado
    // Domingo = 0

    total += hours;
    if (date <= today) elapsed += hours;
  }

  return { elapsed, total };
}

/**
 * Formata um valor numérico como moeda brasileira.
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Retorna a string do mês/ano atual no formato "YYYY-MM".
 */
export function currentMonthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
