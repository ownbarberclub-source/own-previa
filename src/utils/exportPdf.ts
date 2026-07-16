import jsPDF from 'jspdf';
import { BarberResult, Cycle } from '../types';

// ─── Paleta Light (para impressão) ────────────────────────────────────────────
const BRAND      : [number,number,number] = [200,  10,  10]; // vermelho legível em papel
const TEXT_BLACK : [number,number,number] = [ 15,  15,  15];
const TEXT_DARK  : [number,number,number] = [ 50,  50,  55];
const TEXT_GRAY  : [number,number,number] = [110, 110, 118];
const TEXT_LIGHT : [number,number,number] = [170, 170, 178];
const BG_WHITE   : [number,number,number] = [255, 255, 255];
const BG_SOFT    : [number,number,number] = [248, 248, 250];
const BG_HEADER  : [number,number,number] = [240, 240, 244];
const BORDER_CLR : [number,number,number] = [220, 220, 228];
const GOLD       : [number,number,number] = [180, 130,   0];
const SILVER     : [number,number,number] = [110, 110, 118];
const BRONZE     : [number,number,number] = [150,  90,  20];
const BLUE       : [number,number,number] = [ 37, 99, 235];
const GREEN      : [number,number,number] = [ 22, 163, 74];
const AMBER      : [number,number,number] = [180, 120,   0];
const PURPLE     : [number,number,number] = [124,  58, 237];
const CYAN       : [number,number,number] = [  6, 148, 162];

const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 14;
const COL_W   = PAGE_W - MARGIN * 2;

// ─── Utilitários ──────────────────────────────────────────────────────────────
const setRgb   = (doc: jsPDF, c: [number,number,number]) => doc.setTextColor (c[0], c[1], c[2]);
const setFill  = (doc: jsPDF, c: [number,number,number]) => doc.setFillColor (c[0], c[1], c[2]);
const setStroke= (doc: jsPDF, c: [number,number,number]) => doc.setDrawColor (c[0], c[1], c[2]);

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function checkBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - 18) {
    doc.addPage();
    return initPage(doc);
  }
  return y;
}

function initPage(doc: jsPDF): number {
  setFill(doc, BG_WHITE);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  return MARGIN;
}

// ─── Cabeçalho ────────────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, cycle: Cycle | null, mode: 'month' | 'year'): number {
  initPage(doc);

  // Faixa superior vermelha
  setFill(doc, BRAND);
  doc.rect(0, 0, PAGE_W, 22, 'F');

  // Logo "OWN PRÉVIA"
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('OWN', MARGIN + 2, 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(255, 200, 200);
  doc.text('PRÉVIA', MARGIN + 18, 14);

  // Período (canto direito)
  const label = mode === 'year'
    ? 'ACUMULADO DO ANO'
    : cycle ? cycle.month_year.split('-').reverse().join('/') : '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(label, PAGE_W - MARGIN, 14, { align: 'right' });

  let y = 30;

  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setRgb(doc, TEXT_BLACK);
  doc.text('RANKING DE ', MARGIN + 2, y);
  const tw = doc.getTextWidth('RANKING DE ');
  setRgb(doc, BRAND);
  doc.text('DISPUTA', MARGIN + 2 + tw, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setRgb(doc, TEXT_GRAY);
  doc.text('Placar operacional de desempenho da barbearia', MARGIN + 2, y);

  y += 5;
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  return y;
}

// ─── Título de seção ──────────────────────────────────────────────────────────
function drawSectionTitle(
  doc: jsPDF, y: number,
  title: string,
  color: [number,number,number]
): number {
  y = checkBreak(doc, y, 16);

  setFill(doc, BG_HEADER);
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, COL_W, 9, 1.2, 1.2, 'FD');

  // Barra colorida lateral
  setFill(doc, color);
  doc.roundedRect(MARGIN, y, 3, 9, 0.5, 0.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setRgb(doc, TEXT_BLACK);
  doc.text(title, MARGIN + 7, y + 6);

  return y + 12;
}

// ─── Pódio geral ──────────────────────────────────────────────────────────────
function drawPodium(doc: jsPDF, y: number, results: BarberResult[]): number {
  const leader   = results[0];
  const ROW_H    = 13;

  // Cabeçalho da tabela
  setFill(doc, BG_HEADER);
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, COL_W, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setRgb(doc, TEXT_GRAY);
  doc.text('POS.',        MARGIN + 6,              y + 5);
  doc.text('PROFISSIONAL',MARGIN + 18,             y + 5);
  doc.text('COMISSÃO',    PAGE_W - MARGIN - 2,     y + 5, { align: 'right' });
  doc.text('DIFERENÇA',   PAGE_W - MARGIN - 38,    y + 5, { align: 'right' });
  y += 7;

  for (let i = 0; i < results.length; i++) {
    const res      = results[i];
    const isFirst  = i === 0;
    y = checkBreak(doc, y, ROW_H + 1);

    // Linha alternada
    setFill(doc, isFirst ? [255, 245, 245] : (i % 2 === 0 ? BG_WHITE : BG_SOFT));
    setStroke(doc, isFirst ? [220, 180, 180] : BORDER_CLR);
    doc.setLineWidth(isFirst ? 0.4 : 0.2);
    doc.rect(MARGIN, y, COL_W, ROW_H, 'FD');

    // Badge de posição
    const badgeColor: [number,number,number] = i === 0 ? GOLD : i === 1 ? SILVER : i === 2 ? BRONZE : TEXT_LIGHT;
    setFill(doc, badgeColor);
    doc.circle(MARGIN + 6, y + ROW_H / 2, 3.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1), MARGIN + 6, y + ROW_H / 2 + 2.5, { align: 'center' });

    // Nome
    doc.setFont('helvetica', isFirst ? 'bold' : 'normal');
    doc.setFontSize(10);
    setRgb(doc, isFirst ? BRAND : TEXT_DARK);
    doc.text(res.barber.name, MARGIN + 14, y + ROW_H / 2 + 1);

    // Unidade
    if (res.unit_name) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setRgb(doc, TEXT_GRAY);
      doc.text(res.unit_name, MARGIN + 14, y + ROW_H / 2 + 5);
    }

    // Diferença do líder
    if (i > 0) {
      const gap = leader.totalCommission - res.totalCommission;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setRgb(doc, TEXT_GRAY);
      doc.text(`-${formatBRL(gap)}`, PAGE_W - MARGIN - 36, y + ROW_H / 2 + 1, { align: 'right' });
    }

    // Comissão total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setRgb(doc, isFirst ? BRAND : TEXT_BLACK);
    doc.text(formatBRL(res.totalCommission), PAGE_W - MARGIN - 2, y + ROW_H / 2 + 1, { align: 'right' });

    y += ROW_H;
  }

  return y + 8;
}

// ─── Sub-ranking único (coluna cheia) ─────────────────────────────────────────
function drawSubRanking(
  doc: jsPDF,
  y: number,
  title: string,
  color: [number,number,number],
  items: { name: string; value: string }[]
): number {
  y = drawSectionTitle(doc, y, title, color);
  const ROW_H = 8;

  for (let i = 0; i < Math.min(items.length, 10); i++) {
    y = checkBreak(doc, y, ROW_H + 1);
    const isFirst = i === 0;

    setFill(doc, isFirst ? BG_SOFT : BG_WHITE);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, COL_W, ROW_H, 'FD');

    // Posição
    setFill(doc, isFirst ? color : TEXT_LIGHT);
    doc.circle(MARGIN + 4.5, y + ROW_H / 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1), MARGIN + 4.5, y + ROW_H / 2 + 2, { align: 'center' });

    // Nome
    doc.setFont('helvetica', isFirst ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    setRgb(doc, isFirst ? TEXT_BLACK : TEXT_DARK);
    doc.text(items[i].name, MARGIN + 10, y + ROW_H / 2 + 2.5);

    // Valor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setRgb(doc, isFirst ? color : TEXT_DARK);
    doc.text(items[i].value, PAGE_W - MARGIN - 2, y + ROW_H / 2 + 2.5, { align: 'right' });

    y += ROW_H;
  }

  return y + 8;
}

// ─── Sub-rankings em duas colunas ─────────────────────────────────────────────
function drawDualRanking(
  doc: jsPDF,
  y: number,
  left:  { title: string; color: [number,number,number]; items: { name: string; value: string }[] },
  right: { title: string; color: [number,number,number]; items: { name: string; value: string }[] }
): number {
  const maxRows = Math.min(Math.max(left.items.length, right.items.length), 8);
  const HALF    = (COL_W - 5) / 2;
  const ROW_H   = 7.5;
  const needed  = 12 + maxRows * (ROW_H + 1) + 6;

  y = checkBreak(doc, y, needed);

  // Cabeçalhos
  const drawColHeader = (x: number, title: string, color: [number,number,number]) => {
    setFill(doc, BG_HEADER);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, HALF, 9, 1.2, 1.2, 'FD');
    setFill(doc, color);
    doc.roundedRect(x, y, 3, 9, 0.5, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setRgb(doc, TEXT_BLACK);
    doc.text(title, x + 7, y + 6);
  };
  drawColHeader(MARGIN,          left.title,  left.color);
  drawColHeader(MARGIN + HALF + 5, right.title, right.color);

  y += 11;

  for (let i = 0; i < maxRows; i++) {
    const drawRow = (
      x: number, half: number,
      item: { name: string; value: string } | undefined,
      color: [number,number,number]
    ) => {
      if (!item) return;
      const isFirst = i === 0;
      setFill(doc, isFirst ? BG_SOFT : BG_WHITE);
      setStroke(doc, BORDER_CLR);
      doc.setLineWidth(0.2);
      doc.rect(x, y, half, ROW_H, 'FD');

      setFill(doc, isFirst ? color : TEXT_LIGHT);
      doc.circle(x + 4, y + ROW_H / 2, 1.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), x + 4, y + ROW_H / 2 + 2, { align: 'center' });

      doc.setFont('helvetica', isFirst ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      setRgb(doc, isFirst ? TEXT_BLACK : TEXT_DARK);
      doc.text(item.name, x + 9, y + ROW_H / 2 + 2.3);

      doc.setFont('helvetica', 'bold');
      setRgb(doc, isFirst ? color : TEXT_DARK);
      doc.text(item.value, x + half - 2, y + ROW_H / 2 + 2.3, { align: 'right' });
    };

    drawRow(MARGIN,              HALF, left.items[i],  left.color);
    drawRow(MARGIN + HALF + 5,   HALF, right.items[i], right.color);
    y += ROW_H;
  }

  return y + 8;
}

// ─── Simulador de Meta ────────────────────────────────────────────────────────
function drawGoalSimulator(
  doc: jsPDF,
  y: number,
  result: BarberResult,
  targetGoal?: number
): number {
  // Só desenha se houver meta real digitada pelo barbeiro
  if (!targetGoal || targetGoal <= 0) return y;

  const meta = targetGoal;

  const current = result.totalCommission;
  const missing  = Math.max(0, meta - current);

  // Médias por categoria
  const avgSub     = result.subscriptionCount > 0 ? result.subscriptionCommission / result.subscriptionCount : 0;
  const avgAvulso  = result.avulsoCount        > 0 ? result.avulsoCommission        / result.avulsoCount        : 0;
  const avgExtra   = result.extraCount         > 0 ? result.extraCommission         / result.extraCount         : 0;
  const avgProduct = result.productCount       > 0 ? result.productCommission       / result.productCount       : 0;
  const avgBebida  = result.bebidaCount        > 0 ? result.bebidaCommission        / result.bebidaCount        : 0;

  const weightMap: Record<string, number> = {
    ASSINATURAS: 10, AVULSOS: 4, EXTRAS: 3, PRODUTOS: 2, BEBIDAS: 1
  };

  const cats = [
    { key: 'ASSINATURAS', avg: avgSub,     unit: 'atend.',  color: BLUE   },
    { key: 'AVULSOS',     avg: avgAvulso,  unit: 'atend.',  color: BRAND  },
    { key: 'EXTRAS',      avg: avgExtra,   unit: 'vendas',  color: PURPLE },
    { key: 'PRODUTOS',    avg: avgProduct, unit: 'vendas',  color: AMBER  },
    { key: 'BEBIDAS',     avg: avgBebida,  unit: 'unid.',   color: GREEN  },
  ].filter(c => c.avg > 0);

  const totalWeight = cats.reduce((s, c) => s + weightMap[c.key], 0);
  const plan = cats.map(c => ({
    ...c,
    qty: Math.ceil((missing * (weightMap[c.key] / totalWeight)) / c.avg),
  }));

  // Altura necessária: cabeçalho (30) + barra progresso (22) + plano (cats * 9 +  gaps) + padding
  const needed = 34 + 22 + plan.length * 10 + 20;
  y = checkBreak(doc, y, needed);

  // ── Cabeçalho da seção ──
  setFill(doc, [15, 15, 15]);
  setStroke(doc, [40, 40, 44]);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, COL_W, 10, 1.5, 1.5, 'FD');

  // Ícone (triângulo target simulado com texto)
  setFill(doc, BRAND);
  doc.roundedRect(MARGIN, y, 3, 10, 0.5, 0.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setRgb(doc, [244, 244, 245]);
  doc.text('SIMULADOR DE META', MARGIN + 7, y + 7);

  // Meta alvo (canto direito)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setRgb(doc, TEXT_GRAY);
  doc.text(
    `Meta: ${formatBRL(meta)}`,
    PAGE_W - MARGIN - 2, y + 7, { align: 'right' }
  );
  y += 13;

  // ── Barra de progresso ──
  const pct = meta > 0 ? Math.min(current / meta, 1) : 0;
  const barW = COL_W;

  // Caixa de status
  setFill(doc, [22, 22, 26]);
  setStroke(doc, [40, 40, 44]);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, barW, 18, 1.5, 1.5, 'FD');

  // Label esquerdo — atual
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setRgb(doc, TEXT_GRAY);
  doc.text('ACUMULADO', MARGIN + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setRgb(doc, BRAND);
  doc.text(formatBRL(current), MARGIN + 4, y + 12.5);

  // Label direito — meta
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setRgb(doc, TEXT_GRAY);
  doc.text('META', PAGE_W - MARGIN - 4, y + 5.5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setRgb(doc, TEXT_DARK);
  doc.text(formatBRL(meta), PAGE_W - MARGIN - 4, y + 12.5, { align: 'right' });

  // Percentual (centro)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setRgb(doc, pct >= 1 ? GREEN : [244, 244, 245]);
  doc.text(`${Math.round(pct * 100)}%`, PAGE_W / 2, y + 12.5, { align: 'center' });

  y += 21;

  // Trilha de progresso
  setFill(doc, [40, 40, 44]);
  doc.roundedRect(MARGIN, y, barW, 4, 2, 2, 'F');
  if (pct > 0) {
    setFill(doc, pct >= 1 ? GREEN : BRAND);
    doc.roundedRect(MARGIN, y, barW * pct, 4, 2, 2, 'F');
  }
  y += 9;

  // ── Plano de ação combinado ──
  if (missing > 0 && plan.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setRgb(doc, TEXT_GRAY);
    doc.text(
      `Faltam ${formatBRL(missing)}. Sugestão de plano de ação combinado:`,
      MARGIN, y + 5
    );
    y += 10;

    const cardW = (COL_W - (plan.length - 1) * 3) / plan.length;
    plan.forEach((item, idx) => {
      const cx = MARGIN + idx * (cardW + 3);
      setFill(doc, [22, 22, 26]);
      setStroke(doc, [40, 40, 44]);
      doc.setLineWidth(0.2);
      doc.roundedRect(cx, y, cardW, 18, 1.5, 1.5, 'FD');

      // barra colorida topo
      setFill(doc, item.color);
      doc.roundedRect(cx, y, cardW, 2, 0.5, 0.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      setRgb(doc, TEXT_GRAY);
      doc.text(item.key, cx + cardW / 2, y + 7, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setRgb(doc, [244, 244, 245]);
      doc.text(String(item.qty), cx + cardW / 2, y + 14, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      setRgb(doc, TEXT_GRAY);
      doc.text(item.unit, cx + cardW / 2, y + 17.5, { align: 'center' });
    });
    y += 22;
  } else if (meta > 0 && pct >= 1) {
    // Meta atingida
    setFill(doc, [16, 50, 25]);
    setStroke(doc, [34, 100, 50]);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, COL_W, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setRgb(doc, GREEN);
    doc.text('🏆  Meta Atingida!', PAGE_W / 2, y + 8, { align: 'center' });
    y += 16;
  }

  return y;
}

// ─── Página compacta: todos os barbeiros + metas em uma só página ─────────────
function drawMetaSummaryPage(
  doc: jsPDF,
  results: BarberResult[],
  goalMap: Record<string, number>,
  cycle: Cycle | null
): void {
  setFill(doc, BG_WHITE);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Faixa superior
  setFill(doc, BRAND);
  doc.rect(0, 0, PAGE_W, 20, 'F');
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('OWN', MARGIN + 2, 13);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(255, 200, 200);
  doc.text('PRÉVIA', MARGIN + 17, 13);
  const periodo = cycle ? cycle.month_year.split('-').reverse().join('/') : '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(periodo, PAGE_W - MARGIN, 13, { align: 'right' });

  let y = 28;

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  setRgb(doc, TEXT_BLACK);
  doc.text('SIMULADOR DE ', MARGIN + 2, y);
  setRgb(doc, BRAND);
  doc.text('META', MARGIN + 2 + doc.getTextWidth('SIMULADOR DE '), y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setRgb(doc, TEXT_GRAY);
  doc.text('Visão consolidada das metas e planos de ação da equipe', MARGIN + 2, y);
  y += 4;
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  // Cabeçalho da tabela
  // Colunas: [3 acento] [nome 46] [acumulado 28] [meta 28] [falta 26] [barra+% 24] [plano resto]
  const C = {
    name  : MARGIN + 5,
    accum : MARGIN + 54,
    meta  : MARGIN + 82,
    falta : MARGIN + 110,
    bar   : MARGIN + 138,
    plan  : MARGIN + 162,
  };

  setFill(doc, BG_HEADER);
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, COL_W, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  setRgb(doc, TEXT_GRAY);
  doc.text('BARBEIRO',   C.name,  y + 5);
  doc.text('ACUMULADO',  C.accum, y + 5);
  doc.text('META',       C.meta,  y + 5);
  doc.text('FALTA',      C.falta, y + 5);
  doc.text('PROGRESSO',  C.bar,   y + 5);
  doc.text('PLANO SUGERIDO', C.plan, y + 5);
  y += 7;

  const ROW_H = 20;

  // Filtra apenas barbeiros que digitaram meta
  const resultsWithGoal = results.filter(r => goalMap[r.barber.id] && goalMap[r.barber.id] > 0);

  for (let i = 0; i < resultsWithGoal.length; i++) {
    const res = resultsWithGoal[i];
    const meta = goalMap[res.barber.id]; // sempre existe pois filtramos acima
    const current = res.totalCommission;
    const missing = Math.max(0, meta - current);
    const pct = meta > 0 ? Math.min(current / meta, 1) : 0;

    setFill(doc, i % 2 === 0 ? BG_WHITE : BG_SOFT);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.15);
    doc.rect(MARGIN, y, COL_W, ROW_H, 'FD');

    // Acento lateral colorido
    setFill(doc, BRAND);
    doc.rect(MARGIN, y, 3, ROW_H, 'F');

    // Nome + taxa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setRgb(doc, TEXT_BLACK);
    doc.text(res.barber.name, C.name, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setRgb(doc, TEXT_GRAY);
    doc.text(`${Math.round(res.barber.avulso_rate)}% comissão`, C.name, y + 14);

    // Acumulado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setRgb(doc, BRAND);
    doc.text(formatBRL(current), C.accum, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setRgb(doc, TEXT_GRAY);
    doc.text('acumulado', C.accum, y + 14);

    // Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setRgb(doc, TEXT_DARK);
    doc.text(formatBRL(meta), C.meta, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setRgb(doc, TEXT_GRAY);
    doc.text('meta definida', C.meta, y + 14);

    // Falta / OK
    if (missing > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setRgb(doc, AMBER);
      doc.text(formatBRL(missing), C.falta, y + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      setRgb(doc, TEXT_GRAY);
      doc.text('restante', C.falta, y + 14);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setRgb(doc, GREEN);
      doc.text('Meta Atingida!', C.falta, y + 10);
    }

    // Barra de progresso
    const barW2 = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setRgb(doc, pct >= 1 ? GREEN : TEXT_DARK);
    doc.text(`${Math.round(pct * 100)}%`, C.bar + barW2 / 2, y + 7, { align: 'center' });
    setFill(doc, BORDER_CLR);
    doc.roundedRect(C.bar, y + 9, barW2, 3.5, 1, 1, 'F');
    if (pct > 0) {
      setFill(doc, pct >= 1 ? GREEN : BRAND);
      doc.roundedRect(C.bar, y + 9, barW2 * pct, 3.5, 1, 1, 'F');
    }

    // Plano de ação compacto (texto)
    if (missing > 0) {
      const avgSub  = res.subscriptionCount > 0 ? res.subscriptionCommission / res.subscriptionCount : 0;
      const avgAvul = res.avulsoCount       > 0 ? res.avulsoCommission       / res.avulsoCount       : 0;
      const avgExt  = res.extraCount        > 0 ? res.extraCommission        / res.extraCount        : 0;
      const avgProd = res.productCount      > 0 ? res.productCommission      / res.productCount      : 0;
      const avgBeb  = res.bebidaCount       > 0 ? res.bebidaCommission       / res.bebidaCount       : 0;
      const wm: Record<string,number> = { S:10, A:4, E:3, P:2, B:1 };
      const planCats = [
        { k:'S', avg: avgSub,  lbl:'assin.' },
        { k:'A', avg: avgAvul, lbl:'avul.'  },
        { k:'E', avg: avgExt,  lbl:'ext.'   },
        { k:'P', avg: avgProd, lbl:'prod.'  },
        { k:'B', avg: avgBeb,  lbl:'beb.'   },
      ].filter(c => c.avg > 0);
      const tw2 = planCats.reduce((s,c) => s + wm[c.k], 0);
      const planTxt = planCats
        .map(c => `${Math.ceil((missing * (wm[c.k]/tw2)) / c.avg)} ${c.lbl}`)
        .join(' + ');
      const maxPlanW = PAGE_W - MARGIN - C.plan - 2;
      const lines = doc.splitTextToSize(planTxt, maxPlanW);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setRgb(doc, TEXT_DARK);
      doc.text(lines.slice(0, 2), C.plan, y + 9);
    }

    y += ROW_H;
  }

  // Nota de rodapé da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setRgb(doc, TEXT_GRAY);
  doc.text(
    `${resultsWithGoal.length} de ${results.length} profissional(is) com meta definida neste período.`,
    MARGIN, y + 6
  );
}

// ─── Rodapé ───────────────────────────────────────────────────────────────────
function drawFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const dataHora = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    // Linha de rodapé
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    doc.text(`OWN Prévia  •  Gerado em ${dataHora}`, MARGIN, PAGE_H - 6);
    doc.text(`Página ${i} de ${total}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });

    // Faixa vermelha no rodapé
    setFill(doc, BRAND);
    doc.rect(0, PAGE_H - 2, PAGE_W, 2, 'F');
  }
}

// ─── Função principal de exportação ───────────────────────────────────────────
export function exportRankingPdf(
  results: BarberResult[],
  cycle: Cycle | null,
  mode: 'month' | 'year'
) {
  if (results.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = drawHeader(doc, cycle, mode);

  // ── Pódio Geral ──
  y = drawSectionTitle(doc, y, 'PÓDIO GERAL — Comissão Acumulada por Barbeiro', BRAND);
  y = drawPodium(doc, y, results);

  // ── Assinaturas × Serviços Avulsos ──
  const porMinutos   = [...results].sort((a, b) => b.subscriptionMinutes   - a.subscriptionMinutes);
  const porAvulso    = [...results].sort((a, b) => b.avulsoCount           - a.avulsoCount);
  y = drawDualRanking(doc, y,
    {
      title: 'REI DAS ASSINATURAS',
      color: BLUE,
      items: porMinutos.map(r => ({
        name : r.barber.name,
        value: `${r.subscriptionMinutes} min  (${r.subscriptionCount} atendimentos)`
      }))
    },
    {
      title: 'REI DOS SERVIÇOS AVULSOS',
      color: BRAND,
      items: porAvulso.map(r => ({
        name : r.barber.name,
        value: `${r.avulsoCount} atendimentos`
      }))
    }
  );

  // ── Bebidas × Produtos ──
  const porBebida  = [...results].sort((a, b) => b.bebidaCount  - a.bebidaCount);
  const porProduto = [...results].sort((a, b) => b.productCount - a.productCount);
  y = drawDualRanking(doc, y,
    {
      title: 'MESTRE DAS BEBIDAS',
      color: GREEN,
      items: porBebida.map(r => ({ name: r.barber.name, value: `${r.bebidaCount} itens vendidos` }))
    },
    {
      title: 'MESTRE DOS PRODUTOS',
      color: AMBER,
      items: porProduto.map(r => ({ name: r.barber.name, value: `${r.productCount} itens vendidos` }))
    }
  );

  // ── Serviços Extras ──
  const porExtras = [...results].sort((a, b) => b.extraCount - a.extraCount);
  y = drawSubRanking(doc, y, 'MESTRE DOS SERVIÇOS EXTRAS', PURPLE,
    porExtras.map(r => ({ name: r.barber.name, value: `${r.extraCount} serviços realizados` }))
  );

  // ── Conversões de indicações (exibe apenas se houver dados) ──
  const temConversoes = results.some(r => (r.referralConversions || 0) > 0);
  if (temConversoes) {
    const porConversao = [...results]
      .filter(r => (r.referralConversions || 0) > 0)
      .sort((a, b) => (b.referralConversions || 0) - (a.referralConversions || 0));
    y = drawSubRanking(doc, y, 'MESTRE DAS CONVERSÕES DE INDICAÇÕES', CYAN,
      porConversao.map(r => ({ name: r.barber.name, value: `${r.referralConversions} vendas realizadas` }))
    );
  }

  // ── Avaliações de clientes (exibe apenas se houver dados) ──
  const temAvaliacoes = results.some(r => (r.evaluationCount || 0) > 0);
  if (temAvaliacoes) {
    const porAvaliacao = [...results]
      .filter(r => (r.evaluationCount || 0) > 0)
      .sort((a, b) => (b.evaluationRating || 0) - (a.evaluationRating || 0));
    y = drawSubRanking(doc, y, 'REI DO FEEDBACK DE CLIENTES', GOLD,
      porAvaliacao.map(r => ({
        name : r.barber.name,
        value: `${r.evaluationRating?.toFixed(1)} estrelas  (${r.evaluationCount} avaliações)`
      }))
    );
  }

  drawFooters(doc);

  const sufixo = mode === 'year' ? 'anual' : (cycle?.month_year || 'mes');
  doc.save(`OWN_Ranking_${sufixo}.pdf`);
}

// ─── Exportação individual do card do barbeiro ────────────────────────────────
export function exportBarberCardPdf(
  result: BarberResult,
  cycle: Cycle | null,
  historicalResults: any[],
  cycles: Cycle[],
  targetGoal?: number
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Fundo branco ──
  setFill(doc, BG_WHITE);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // ── Faixa superior vermelha ──
  setFill(doc, BRAND);
  doc.rect(0, 0, PAGE_W, 28, 'F');

  // Logo
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('OWN', MARGIN + 2, 13);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(255, 200, 200);
  doc.text('PRÉVIA', MARGIN + 17, 13);

  // Período
  const periodo = cycle ? cycle.month_year.split('-').reverse().join('/') : '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(periodo, PAGE_W - MARGIN, 13, { align: 'right' });

  // Nome do barbeiro (grande, na faixa)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(result.barber.name, MARGIN + 2, 24);

  // Taxa de comissão
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 200, 200);
  doc.text(`Taxa de comissão: ${Math.round(result.barber.avulso_rate)}%`, PAGE_W - MARGIN, 24, { align: 'right' });

  let y = 36;

  // ── Rankings (badges) ──
  const badges = [
    { label: 'Ranking Unidade',  value: result.rankUnit    ? `${result.rankUnit}º lugar`    : '-', color: TEXT_DARK },
    { label: 'Ranking Rede',     value: result.rankNetwork ? `${result.rankNetwork}º lugar`  : '-', color: BRAND    },
    { label: 'Ranking Anual',    value: result.rankAnnual  ? `${result.rankAnnual}º lugar`   : '-', color: GOLD     },
  ];

  const badgeW = (COL_W - 8) / 3;
  badges.forEach((b, i) => {
    const bx = MARGIN + i * (badgeW + 4);
    setFill(doc, BG_SOFT);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, badgeW, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    doc.text(b.label.toUpperCase(), bx + badgeW / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setRgb(doc, b.color);
    doc.text(b.value, bx + badgeW / 2, y + 11.5, { align: 'center' });
  });

  y += 20;

  // ── Divisor ──
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  // ── Total da comissão (destaque) ──
  setFill(doc, [255, 245, 245]);
  setStroke(doc, [220, 180, 180]);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, COL_W, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setRgb(doc, TEXT_GRAY);
  doc.text('COMISSÃO TOTAL ACUMULADA', MARGIN + 6, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setRgb(doc, BRAND);
  doc.text(formatBRL(result.totalCommission), MARGIN + 6, y + 17);

  // Projeção do mês
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setRgb(doc, TEXT_GRAY);
  doc.text('PROJEÇÃO FINAL DO MÊS', PAGE_W - MARGIN - 2, y + 7, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setRgb(doc, TEXT_DARK);
  doc.text(formatBRL(result.projectedCommission), PAGE_W - MARGIN - 2, y + 17, { align: 'right' });

  y += 26;

  // ── Tabela de categorias ──
  const categorias = [
    {
      label  : 'Assinaturas (POT)',
      detalhe: `${result.subscriptionCount} atendimentos  •  ${result.subscriptionMinutes} min`,
      receita: null,
      comis  : result.subscriptionCommission,
      color  : BLUE,
    },
    {
      label  : 'Serviços Avulsos',
      detalhe: `${result.avulsoCount} atendimentos`,
      receita: result.avulsoRevenue,
      comis  : result.avulsoCommission,
      color  : BRAND,
    },
    {
      label  : 'Bebidas',
      detalhe: `${result.bebidaCount} itens vendidos`,
      receita: result.bebidaRevenue,
      comis  : result.bebidaCommission,
      color  : GREEN,
    },
    {
      label  : 'Produtos',
      detalhe: `${result.productCount} itens vendidos`,
      receita: result.productRevenue,
      comis  : result.productCommission,
      color  : AMBER,
    },
    {
      label  : 'Serviços Extras',
      detalhe: `${result.extraCount} serviços realizados`,
      receita: result.extraRevenue,
      comis  : result.extraCommission,
      color  : PURPLE,
    },
  ];

  // Cabeçalho da tabela
  setFill(doc, BG_HEADER);
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, COL_W, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setRgb(doc, TEXT_GRAY);
  doc.text('CATEGORIA',  MARGIN + 6,           y + 5.5);
  doc.text('DETALHES',   MARGIN + 70,           y + 5.5);
  doc.text('FATURADO',   PAGE_W - MARGIN - 36,  y + 5.5, { align: 'right' });
  doc.text('COMISSÃO',   PAGE_W - MARGIN - 2,   y + 5.5, { align: 'right' });
  y += 8;

  const ROW_H = 13;
  categorias.forEach((cat, i) => {
    setFill(doc, i % 2 === 0 ? BG_WHITE : BG_SOFT);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.15);
    doc.rect(MARGIN, y, COL_W, ROW_H, 'FD');

    // Barra colorida lateral
    setFill(doc, cat.color);
    doc.rect(MARGIN, y, 3, ROW_H, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setRgb(doc, TEXT_BLACK);
    doc.text(cat.label, MARGIN + 6, y + 5.5);

    // Detalhe
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setRgb(doc, TEXT_GRAY);
    doc.text(cat.detalhe, MARGIN + 6, y + 10);

    // Faturado
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setRgb(doc, TEXT_DARK);
    doc.text(
      cat.receita !== null ? formatBRL(cat.receita) : '—',
      PAGE_W - MARGIN - 36, y + ROW_H / 2 + 2.5,
      { align: 'right' }
    );

    // Comissão
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setRgb(doc, cat.comis > 0 ? cat.color : TEXT_LIGHT);
    doc.text(formatBRL(cat.comis), PAGE_W - MARGIN - 2, y + ROW_H / 2 + 2.5, { align: 'right' });

    y += ROW_H;
  });

  // Linha total
  setFill(doc, [255, 245, 245]);
  setStroke(doc, [200, 160, 160]);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, y, COL_W, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setRgb(doc, TEXT_BLACK);
  doc.text('TOTAL', MARGIN + 6, y + 6.5);
  doc.setFontSize(10);
  setRgb(doc, BRAND);
  doc.text(formatBRL(result.totalCommission), PAGE_W - MARGIN - 2, y + 6.5, { align: 'right' });
  y += 16;

  // ── Avaliações (se houver) ──
  if ((result.evaluationCount || 0) > 0) {
    setFill(doc, BG_SOFT);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, COL_W, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setRgb(doc, TEXT_GRAY);
    doc.text('AVALIAÇÃO MÉDIA DE CLIENTES', MARGIN + 6, y + 6);
    doc.setFontSize(13);
    setRgb(doc, GOLD);
    doc.text(`${result.evaluationRating?.toFixed(1)} estrelas`, MARGIN + 6, y + 12);
    doc.setFontSize(8);
    setRgb(doc, TEXT_GRAY);
    doc.text(`(baseado em ${result.evaluationCount} avaliações)`, PAGE_W - MARGIN - 2, y + 12, { align: 'right' });
    y += 18;
  }

  // ── Conversões (se houver) ──
  if ((result.referralConversions || 0) > 0) {
    setFill(doc, BG_SOFT);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, COL_W, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setRgb(doc, TEXT_GRAY);
    doc.text('CONVERSÕES DE INDICAÇÕES', MARGIN + 6, y + 6);
    doc.setFontSize(13);
    setRgb(doc, CYAN);
    doc.text(`${result.referralConversions} vendas realizadas`, MARGIN + 6, y + 12);
    y += 18;
  }

  // ── Simulador de Meta ──
  y = drawGoalSimulator(doc, y, result, targetGoal);

  // ── PÁGINA 2: HISTÓRICO COMPARATIVO ──────────────────────────────────────────
  doc.addPage();
  initPage(doc);

  // Faixa superior da página 2
  setFill(doc, BRAND);
  doc.rect(0, 0, PAGE_W, 20, 'F');
  
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('OWN', MARGIN + 2, 13);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(255, 200, 200);
  doc.text('PRÉVIA', MARGIN + 17, 13);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO HISTÓRICO', PAGE_W - MARGIN, 13, { align: 'right' });

  let y2 = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setRgb(doc, TEXT_BLACK);
  doc.text('HISTÓRICO DE ', MARGIN + 2, y2);
  const offset = doc.getTextWidth('HISTÓRICO DE ');
  setRgb(doc, BRAND);
  doc.text('DESEMPENHO', MARGIN + 2 + offset, y2);

  y2 += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setRgb(doc, TEXT_GRAY);
  doc.text(`Evolução dos últimos 6 meses de ${result.barber.name}`, MARGIN + 2, y2);
  
  y2 += 5;
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y2, PAGE_W - MARGIN, y2);
  y2 += 8;

  // Obter últimos 6 meses
  const sortedCycles = [...cycles].sort((a, b) => b.month_year.localeCompare(a.month_year));
  const currentIdx = sortedCycles.findIndex(c => c.id === cycle?.id);
  const last6Cycles = currentIdx !== -1 
    ? sortedCycles.slice(currentIdx, currentIdx + 6) 
    : sortedCycles.slice(0, 6);
  last6Cycles.reverse(); // Ordem cronológica

  // Mapear dados para tabela e gráfico
  const histData = last6Cycles.map(c => {
    const isCurrent = c.id === cycle?.id;
    if (isCurrent) {
      return {
        monthLabel: c.month_year.split('-').reverse().join('/'),
        commission: result.totalCommission,
        minutes: result.subscriptionMinutes,
        avulsos: result.avulsoCount,
        vendas: result.bebidaCount + result.productCount,
        extras: result.extraCount
      };
    } else {
      const hist = historicalResults.find(h => h.cycle_id === c.id && h.barber_id === result.barber.id);
      return {
        monthLabel: c.month_year.split('-').reverse().join('/'),
        commission: hist?.total_commission || 0,
        minutes: hist?.subscription_minutes || 0,
        avulsos: hist?.avulso_count || 0,
        vendas: (hist?.bebida_count || 0) + (hist?.product_count || 0),
        extras: hist?.extra_count || 0
      };
    }
  });

  // ── Tabela Histórica ──
  y2 = drawSectionTitle(doc, y2, 'TABELA DE EVOLUÇÃO MENSAL', BRAND);
  
  // Cabeçalho da tabela
  setFill(doc, BG_HEADER);
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y2, COL_W, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setRgb(doc, TEXT_GRAY);
  doc.text('PERÍODO',     MARGIN + 6,           y2 + 5);
  doc.text('COMISSÃO',    MARGIN + 45,          y2 + 5);
  doc.text('ASSINATURAS', MARGIN + 85,          y2 + 5);
  doc.text('AVULSOS',     MARGIN + 120,         y2 + 5);
  doc.text('VENDAS (ITENS)', MARGIN + 145,      y2 + 5);
  doc.text('EXTRAS',      PAGE_W - MARGIN - 2,  y2 + 5, { align: 'right' });
  y2 += 7;

  const ROW_H2 = 9;
  histData.forEach((row, i) => {
    const isThisMonth = row.monthLabel === (cycle?.month_year.split('-').reverse().join('/') || '');
    setFill(doc, isThisMonth ? [255, 245, 245] : (i % 2 === 0 ? BG_WHITE : BG_SOFT));
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.15);
    doc.rect(MARGIN, y2, COL_W, ROW_H2, 'FD');

    if (isThisMonth) {
      setFill(doc, BRAND);
      doc.rect(MARGIN, y2, 3, ROW_H2, 'F');
    }

    doc.setFont('helvetica', isThisMonth ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    setRgb(doc, isThisMonth ? BRAND : TEXT_BLACK);
    doc.text(row.monthLabel, MARGIN + 6, y2 + 5.5);
    doc.text(formatBRL(row.commission), MARGIN + 45, y2 + 5.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setRgb(doc, TEXT_DARK);
    doc.text(`${row.minutes} min`, MARGIN + 85, y2 + 5.5);
    doc.text(`${row.avulsos} atend.`, MARGIN + 120, y2 + 5.5);
    doc.text(`${row.vendas} itens`, MARGIN + 145, y2 + 5.5);
    doc.text(`${row.extras} serv.`, PAGE_W - MARGIN - 2, y2 + 5.5, { align: 'right' });

    y2 += ROW_H2;
  });

  y2 += 12;

  // ── Gráfico de Comissão ──
  y2 = drawSectionTitle(doc, y2, 'GRÁFICO: EVOLUÇÃO DE COMISSÃO (R$)', BLUE);

  const chartH2 = 45;
  const chartW2 = COL_W;
  
  setFill(doc, BG_SOFT);
  doc.rect(MARGIN, y2, chartW2, chartH2, 'F');
  
  setStroke(doc, BORDER_CLR);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y2 + chartH2, MARGIN + chartW2, y2 + chartH2);

  const maxComm = Math.max(...histData.map(d => d.commission), 1);
  const stepX2 = chartW2 / histData.length;

  histData.forEach((row, i) => {
    const xCenter = MARGIN + (i + 0.5) * stepX2;
    const barW = Math.min(stepX2 * 0.4, 18);
    const hComm = (row.commission / maxComm) * (chartH2 - 12);
    
    const isThisMonth = row.monthLabel === (cycle?.month_year.split('-').reverse().join('/') || '');
    setFill(doc, isThisMonth ? BRAND : [56, 189, 248]);
    doc.rect(xCenter - barW/2, y2 + chartH2 - hComm, barW, hComm, 'F');
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setRgb(doc, isThisMonth ? BRAND : [37, 99, 235]);
    doc.text(formatBRL(row.commission), xCenter, y2 + chartH2 - hComm - 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setRgb(doc, TEXT_GRAY);
    doc.text(row.monthLabel, xCenter, y2 + chartH2 + 5, { align: 'center' });
  });

  drawFooters(doc);

  const nomeSanitizado = result.barber.name.replace(/\s+/g, '_');
  doc.save(`OWN_Barbeiro_${nomeSanitizado}_${periodo || 'relatorio'}.pdf`);
}

// ─── Exportação geral da prévia (página compacta de metas + uma página por barbeiro) ──
export function exportPreviewPdf(
  results: BarberResult[],
  cycle: Cycle | null,
  goalMap: Record<string, number> = {},
  potMetrics?: {
    totalSubscriptions: number;
    subscriberCount: number;
    potRate: number;
    potBaseValue: number;
    totalMinutes: number;
    totalAttendances: number;
    valuePerMinute: number;
  } | null,
  cycles: Cycle[] = []
) {
  if (results.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const periodo = cycle ? cycle.month_year.split('-').reverse().join('/') : '';

  if (potMetrics) {
    setFill(doc, BG_WHITE);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    
    setFill(doc, BRAND);
    doc.rect(0, 0, PAGE_W, 28, 'F');
    
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('OWN', MARGIN + 2, 13);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(255, 200, 200);
    doc.text('PRÉVIA', MARGIN + 17, 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(periodo, PAGE_W - MARGIN, 13, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('MÉTRICAS GLOBAIS (POT)', MARGIN + 2, 24);

    let cy = 40;
    const boxW = (COL_W - 10) / 3;
    const boxH = 26;
    
    // LINHA 1 (3 caixas)
    setFill(doc, BG_SOFT);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, cy, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setRgb(doc, TEXT_GRAY);
    doc.text('FATURAMENTO REDE', MARGIN + 6, cy + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setRgb(doc, TEXT_BLACK);
    doc.text(formatBRL(potMetrics.totalSubscriptions), MARGIN + 6, cy + 18);

    setFill(doc, BG_SOFT);
    doc.roundedRect(MARGIN + boxW + 5, cy, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setRgb(doc, TEXT_GRAY);
    doc.text('TAXA REPASSE (POT)', MARGIN + boxW + 5 + 6, cy + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setRgb(doc, BRAND);
    doc.text(`${(potMetrics.potRate * 100).toFixed(0)}%`, MARGIN + boxW + 5 + 6, cy + 18);

    setFill(doc, [230, 255, 230]);
    setStroke(doc, [180, 230, 180]);
    doc.roundedRect(MARGIN + (boxW + 5) * 2, cy, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setRgb(doc, GREEN);
    doc.text('COMISSÃO BASE POT', MARGIN + (boxW + 5) * 2 + 6, cy + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(formatBRL(potMetrics.potBaseValue), MARGIN + (boxW + 5) * 2 + 6, cy + 18);

    cy += boxH + 5;

    // LINHA 2 (2 caixas centrais)
    const boxW2 = (COL_W - 5) / 2;
    
    setFill(doc, BRAND);
    setStroke(doc, BRAND);
    doc.roundedRect(MARGIN, cy, boxW2, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 200, 200);
    doc.text('VALOR DO MINUTO', MARGIN + 6, cy + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`${potMetrics.valuePerMinute.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 })}/min`, MARGIN + 6, cy + 18);

    setFill(doc, [240, 250, 255]);
    setStroke(doc, [180, 220, 255]);
    doc.roundedRect(MARGIN + boxW2 + 5, cy, boxW2, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setRgb(doc, [6, 148, 162]);
    doc.text('TAXA DE RETORNO', MARGIN + boxW2 + 5 + 6, cy + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${potMetrics.subscriberCount > 0 ? (potMetrics.totalAttendances / potMetrics.subscriberCount).toFixed(2) : '0.00'} vezes/mês`, MARGIN + boxW2 + 5 + 6, cy + 18);
    
    cy += boxH + 15;

    // --- GRÁFICO DE HISTÓRICO ---
    if (cycles && cycles.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      setRgb(doc, TEXT_BLACK);
      doc.text('HISTÓRICO: FATURAMENTO VS ASSINANTES', MARGIN, cy);
      
      cy += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setRgb(doc, TEXT_GRAY);
      doc.text('Comparativo dos últimos 6 meses', MARGIN, cy);
      
      cy += 10;
      
      const chartCycles = [...cycles]
        .sort((a, b) => a.month_year.localeCompare(b.month_year))
        .slice(-6);
        
      const chartH = 45;
      const chartW = COL_W;
      
      setFill(doc, BG_SOFT);
      doc.rect(MARGIN, cy, chartW, chartH, 'F');
      
      setStroke(doc, BORDER_CLR);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, cy + chartH, MARGIN + chartW, cy + chartH);

      const maxFaturamento = Math.max(...chartCycles.map(c => c.subscription_total || 0), 1);
      const maxAssinantes = Math.max(...chartCycles.map(c => c.subscriber_count || 0), 1);

      const N = chartCycles.length;
      const stepX = chartW / N;

      chartCycles.forEach((c, i) => {
        const xCenter = MARGIN + (i + 0.5) * stepX;
        const barW = Math.min(stepX * 0.25, 12);
        
        const hFat = ((c.subscription_total || 0) / maxFaturamento) * (chartH - 10);
        setFill(doc, [56, 189, 248]);
        doc.rect(xCenter - barW - 1, cy + chartH - hFat, barW, hFat, 'F');
        
        doc.setFontSize(6);
        doc.setTextColor(56, 189, 248);
        const fatText = (c.subscription_total || 0) >= 1000 ? `${((c.subscription_total || 0) / 1000).toFixed(1)}k` : `${c.subscription_total || 0}`;
        doc.text(fatText, xCenter - barW - 1 + barW/2, cy + chartH - hFat - 2, { align: 'center' });

        const hAss = ((c.subscriber_count || 0) / maxAssinantes) * (chartH - 10);
        setFill(doc, BRAND);
        doc.rect(xCenter + 1, cy + chartH - hAss, barW, hAss, 'F');
        
        setRgb(doc, BRAND);
        doc.text(`${c.subscriber_count || 0}`, xCenter + 1 + barW/2, cy + chartH - hAss - 2, { align: 'center' });

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        const mesSplit = c.month_year.split('-');
        const mesAno = `${mesSplit[1]}/${mesSplit[0].slice(2)}`;
        doc.text(mesAno, xCenter, cy + chartH + 5, { align: 'center' });
      });

      cy += chartH + 12;
      setFill(doc, [56, 189, 248]);
      doc.rect(MARGIN, cy, 3, 3, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text('Faturamento (R$)', MARGIN + 5, cy + 2.5);

      setFill(doc, BRAND);
      doc.rect(MARGIN + 40, cy, 3, 3, 'F');
      doc.text('Assinantes (Qtd)', MARGIN + 45, cy + 2.5);
    }
    
    // Rodapé da capa
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    const dataHora = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.text(`OWN Prévia  •  Gerado em ${dataHora}`, MARGIN, PAGE_H - 6);
    doc.text(`Métricas Globais`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
    setFill(doc, BRAND);
    doc.rect(0, PAGE_H - 2, PAGE_W, 2, 'F');
  }

  const drawBarberPage = (result: BarberResult, isFirst: boolean) => {
    if (!isFirst || potMetrics) doc.addPage();

    // Fundo branco
    setFill(doc, BG_WHITE);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    // Faixa superior vermelha
    setFill(doc, BRAND);
    doc.rect(0, 0, PAGE_W, 28, 'F');

    // Logo
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('OWN', MARGIN + 2, 13);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(255, 200, 200);
    doc.text('PRÉVIA', MARGIN + 17, 13);

    // Período
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(periodo, PAGE_W - MARGIN, 13, { align: 'right' });

    // Nome do barbeiro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(result.barber.name, MARGIN + 2, 24);

    // Taxa de comissão
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 200, 200);
    doc.text(`Taxa de comissão: ${Math.round(result.barber.avulso_rate)}%`, PAGE_W - MARGIN, 24, { align: 'right' });

    let y = 33;

    // Badges de ranking (compactos)
    const badges = [
      { label: 'Ranking Unidade',  value: result.rankUnit    ? `${result.rankUnit}º lugar`    : '-', color: TEXT_DARK },
      { label: 'Ranking Rede',     value: result.rankNetwork ? `${result.rankNetwork}º lugar`  : '-', color: BRAND    },
      { label: 'Ranking Anual',    value: result.rankAnnual  ? `${result.rankAnnual}º lugar`   : '-', color: GOLD     },
    ];
    const badgeW = (COL_W - 8) / 3;
    badges.forEach((b, i) => {
      const bx = MARGIN + i * (badgeW + 4);
      setFill(doc, BG_SOFT);
      setStroke(doc, BORDER_CLR);
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, y, badgeW, 11, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setRgb(doc, TEXT_GRAY);
      doc.text(b.label.toUpperCase(), bx + badgeW / 2, y + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setRgb(doc, b.color);
      doc.text(b.value, bx + badgeW / 2, y + 9.5, { align: 'center' });
    });
    y += 14;

    // Divisor
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;

    // Destaque financeiro (compacto)
    setFill(doc, [255, 245, 245]);
    setStroke(doc, [220, 180, 180]);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, COL_W, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    doc.text('COMISSÃO TOTAL ACUMULADA', MARGIN + 6, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setRgb(doc, BRAND);
    doc.text(formatBRL(result.totalCommission), MARGIN + 6, y + 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    doc.text('PROJEÇÃO FINAL DO MÊS', PAGE_W - MARGIN - 2, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setRgb(doc, TEXT_DARK);
    doc.text(formatBRL(result.projectedCommission), PAGE_W - MARGIN - 2, y + 13.5, { align: 'right' });
    y += 20;

    // Tabela de categorias
    const categorias = [
      { label: 'Assinaturas (POT)', detalhe: `${result.subscriptionCount} atendimentos  •  ${result.subscriptionMinutes} min`, receita: null,                  comis: result.subscriptionCommission, color: BLUE   },
      { label: 'Serviços Avulsos',  detalhe: `${result.avulsoCount} atendimentos`,                                              receita: result.avulsoRevenue,  comis: result.avulsoCommission,       color: BRAND  },
      { label: 'Bebidas',           detalhe: `${result.bebidaCount} itens vendidos`,                                            receita: result.bebidaRevenue,  comis: result.bebidaCommission,       color: GREEN  },
      { label: 'Produtos',          detalhe: `${result.productCount} itens vendidos`,                                           receita: result.productRevenue, comis: result.productCommission,      color: AMBER  },
      { label: 'Serviços Extras',   detalhe: `${result.extraCount} serviços realizados`,                                        receita: result.extraRevenue,   comis: result.extraCommission,        color: PURPLE },
    ];

    // Cabeçalho da tabela
    setFill(doc, BG_HEADER);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, COL_W, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    doc.text('CATEGORIA',  MARGIN + 6,          y + 5);
    doc.text('DETALHES',   MARGIN + 70,          y + 5);
    doc.text('FATURADO',   PAGE_W - MARGIN - 36, y + 5, { align: 'right' });
    doc.text('COMISSÃO',   PAGE_W - MARGIN - 2,  y + 5, { align: 'right' });
    y += 7;

    const ROW_H = 10;
    categorias.forEach((cat, i) => {
      setFill(doc, i % 2 === 0 ? BG_WHITE : BG_SOFT);
      setStroke(doc, BORDER_CLR);
      doc.setLineWidth(0.15);
      doc.rect(MARGIN, y, COL_W, ROW_H, 'FD');
      setFill(doc, cat.color);
      doc.rect(MARGIN, y, 3, ROW_H, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setRgb(doc, TEXT_BLACK);
      doc.text(cat.label, MARGIN + 6, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setRgb(doc, TEXT_GRAY);
      doc.text(cat.detalhe, MARGIN + 6, y + 8.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setRgb(doc, TEXT_DARK);
      doc.text(cat.receita !== null ? formatBRL(cat.receita) : '—', PAGE_W - MARGIN - 36, y + ROW_H / 2 + 2, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setRgb(doc, cat.comis > 0 ? cat.color : TEXT_LIGHT);
      doc.text(formatBRL(cat.comis), PAGE_W - MARGIN - 2, y + ROW_H / 2 + 2, { align: 'right' });
      y += ROW_H;
    });

    // Linha de total
    setFill(doc, [255, 245, 245]);
    setStroke(doc, [200, 160, 160]);
    doc.setLineWidth(0.4);
    doc.rect(MARGIN, y, COL_W, 9, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setRgb(doc, TEXT_BLACK);
    doc.text('TOTAL', MARGIN + 6, y + 6);
    doc.setFontSize(10);
    setRgb(doc, BRAND);
    doc.text(formatBRL(result.totalCommission), PAGE_W - MARGIN - 2, y + 6, { align: 'right' });
    y += 12;

    // Avaliações (se houver)
    if ((result.evaluationCount || 0) > 0) {
      setFill(doc, BG_SOFT);
      setStroke(doc, BORDER_CLR);
      doc.setLineWidth(0.2);
      doc.roundedRect(MARGIN, y, COL_W, 14, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setRgb(doc, TEXT_GRAY);
      doc.text('AVALIAÇÃO MÉDIA DE CLIENTES', MARGIN + 6, y + 6);
      doc.setFontSize(13);
      setRgb(doc, GOLD);
      doc.text(`${result.evaluationRating?.toFixed(1)} estrelas`, MARGIN + 6, y + 12);
      doc.setFontSize(8);
      setRgb(doc, TEXT_GRAY);
      doc.text(`(baseado em ${result.evaluationCount} avaliações)`, PAGE_W - MARGIN - 2, y + 12, { align: 'right' });
      y += 18;
    }

    // Conversões (se houver)
    if ((result.referralConversions || 0) > 0) {
      setFill(doc, BG_SOFT);
      setStroke(doc, BORDER_CLR);
      doc.setLineWidth(0.2);
      doc.roundedRect(MARGIN, y, COL_W, 14, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setRgb(doc, TEXT_GRAY);
      doc.text('CONVERSÕES DE INDICAÇÕES', MARGIN + 6, y + 6);
      doc.setFontSize(13);
      setRgb(doc, CYAN);
      doc.text(`${result.referralConversions} vendas realizadas`, MARGIN + 6, y + 12);
      y += 18;
    }

    // Simulador de Meta (somente se o barbeiro digitou uma meta)
    y = drawGoalSimulator(doc, y, result, goalMap[result.barber.id]);
  };

  results.forEach((res, i) => drawBarberPage(res, i === 0));

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  const dataHora = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    setStroke(doc, BORDER_CLR);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setRgb(doc, TEXT_GRAY);
    doc.text(`OWN Prévia  •  Gerado em ${dataHora}`, MARGIN, PAGE_H - 6);
    doc.text(`Página ${p} de ${total}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
    setFill(doc, BRAND);
    doc.rect(0, PAGE_H - 2, PAGE_W, 2, 'F');
  }

  doc.save(`OWN_Previa_${periodo || 'relatorio'}.pdf`);
}

