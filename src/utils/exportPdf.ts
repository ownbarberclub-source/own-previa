import jsPDF from 'jspdf';
import { BarberResult, Cycle } from '../types';

const BRAND = [225, 6, 0] as [number, number, number];
const BG_DARK = [24, 24, 27] as [number, number, number];
const BG_CARD = [9, 9, 11] as [number, number, number];
const TEXT_WHITE = [244, 244, 245] as [number, number, number];
const TEXT_MUTED = [113, 113, 122] as [number, number, number];
const TEXT_SUBTLE = [63, 63, 70] as [number, number, number];
const BORDER = [39, 39, 42] as [number, number, number];
const GOLD = [234, 179, 8] as [number, number, number];
const SILVER = [161, 161, 170] as [number, number, number];
const BRONZE = [180, 83, 9] as [number, number, number];
const BLUE = [96, 165, 250] as [number, number, number];
const GREEN = [74, 222, 128] as [number, number, number];
const AMBER = [251, 191, 36] as [number, number, number];
const PURPLE = [192, 132, 252] as [number, number, number];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const COL_W = PAGE_W - MARGIN * 2;

function rgb(doc: jsPDF, color: [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function fillColor(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function strokeColor(doc: jsPDF, color: [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function formatCurrencyPdf(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function checkPageBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - 16) {
    doc.addPage();
    return drawPageBg(doc);
  }
  return y;
}

function drawPageBg(doc: jsPDF): number {
  fillColor(doc, BG_DARK);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  return MARGIN;
}

function drawHeader(doc: jsPDF, cycle: Cycle | null, mode: 'month' | 'year'): number {
  let y = drawPageBg(doc);

  // Red accent bar
  fillColor(doc, BRAND);
  doc.rect(0, 0, 4, PAGE_H, 'F');

  // OWN Logo text
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(18);
  rgb(doc, TEXT_WHITE);
  doc.text('OWN', MARGIN + 2, y + 10);

  doc.setFontSize(18);
  rgb(doc, BRAND);
  doc.text('PRÉVIA', MARGIN + 20, y + 10);

  // Period badge
  const period = mode === 'year' ? 'ACUMULADO DO ANO' : (cycle ? cycle.month_year.split('-').reverse().join('/') : '');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, TEXT_MUTED);
  doc.text(period, PAGE_W - MARGIN, y + 10, { align: 'right' });

  y += 16;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  rgb(doc, TEXT_WHITE);
  doc.text('RANKING DE ', MARGIN + 2, y);
  const titleW = doc.getTextWidth('RANKING DE ');
  rgb(doc, BRAND);
  doc.text('DISPUTA', MARGIN + 2 + titleW, y);

  y += 5;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rgb(doc, TEXT_MUTED);
  doc.text('O placar operacional da barbearia', MARGIN + 2, y);

  y += 6;

  // Divider
  strokeColor(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  y += 8;
  return y;
}

function drawSectionTitle(doc: jsPDF, y: number, title: string, color: [number, number, number]): number {
  y = checkPageBreak(doc, y, 18);
  
  // Card background
  fillColor(doc, BG_CARD);
  strokeColor(doc, BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y - 1, COL_W, 8, 1, 1, 'FD');

  // Accent dot
  fillColor(doc, color);
  doc.circle(MARGIN + 5, y + 3, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  rgb(doc, TEXT_WHITE);
  doc.text(title, MARGIN + 10, y + 4.5);

  return y + 10;
}

function drawPodium(doc: jsPDF, y: number, results: BarberResult[]): number {
  const leader = results[0];
  const rowH = 11;

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    y = checkPageBreak(doc, y, rowH + 2);

    const isFirst = i === 0;
    const rowBg: [number, number, number] = isFirst ? [30, 20, 10] : BG_DARK;

    // Row background
    fillColor(doc, rowBg);
    strokeColor(doc, isFirst ? GOLD : BORDER);
    doc.setLineWidth(isFirst ? 0.4 : 0.2);
    doc.roundedRect(MARGIN, y, COL_W, rowH, 1, 1, 'FD');

    // Rank badge
    const badgeColor: [number, number, number] = i === 0 ? GOLD : i === 1 ? SILVER : i === 2 ? BRONZE : TEXT_SUBTLE;
    fillColor(doc, badgeColor);
    doc.circle(MARGIN + 6, y + rowH / 2, 3.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, [10, 10, 10]);
    const rankLabel = i === 0 ? '1' : String(i + 1);
    doc.text(rankLabel, MARGIN + 6, y + rowH / 2 + 2.5, { align: 'center' });

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    rgb(doc, isFirst ? TEXT_WHITE : [228, 228, 231]);
    doc.text(res.barber.name, MARGIN + 14, y + 4.5);

    // Unit
    if (res.unit_name) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rgb(doc, TEXT_MUTED);
      doc.text(res.unit_name, MARGIN + 14, y + 8.5);
    }

    // Gap behind leader
    if (i > 0) {
      const gap = leader.totalCommission - res.totalCommission;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rgb(doc, TEXT_SUBTLE);
      doc.text(`-${formatCurrencyPdf(gap)}`, PAGE_W - MARGIN - 36, y + 8.5, { align: 'right' });
    }

    // Commission value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    rgb(doc, isFirst ? BRAND : TEXT_WHITE);
    doc.text(formatCurrencyPdf(res.totalCommission), PAGE_W - MARGIN - 2, y + 5.5, { align: 'right' });

    // Progress bar
    const barW = 36;
    const barX = PAGE_W - MARGIN - 2 - barW;
    const barY = y + 8;
    fillColor(doc, BORDER);
    doc.roundedRect(barX, barY, barW, 1.5, 0.5, 0.5, 'F');
    const pct = leader.totalCommission > 0 ? (res.totalCommission / leader.totalCommission) : 0;
    fillColor(doc, isFirst ? BRAND : TEXT_SUBTLE);
    if (pct > 0) doc.roundedRect(barX, barY, barW * pct, 1.5, 0.5, 0.5, 'F');

    y += rowH + 2;
  }

  return y + 4;
}

function drawSubRanking(
  doc: jsPDF,
  y: number,
  title: string,
  color: [number, number, number],
  items: { name: string; value: string; unit?: string }[]
): number {
  y = drawSectionTitle(doc, y, title, color);
  const rowH = 8;

  for (let i = 0; i < Math.min(items.length, 8); i++) {
    const item = items[i];
    y = checkPageBreak(doc, y, rowH + 1);

    const isFirst = i === 0;
    if (isFirst) {
      fillColor(doc, [18, 18, 22]);
      strokeColor(doc, color);
      doc.setLineWidth(0.3);
    } else {
      fillColor(doc, BG_DARK);
      strokeColor(doc, BORDER);
      doc.setLineWidth(0.15);
    }
    doc.roundedRect(MARGIN, y, COL_W, rowH, 0.8, 0.8, 'FD');

    // Position dot
    fillColor(doc, isFirst ? color : TEXT_SUBTLE);
    doc.circle(MARGIN + 4, y + rowH / 2, 1.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    rgb(doc, isFirst ? [0, 0, 0] : [200, 200, 200]);
    doc.text(String(i + 1), MARGIN + 4, y + rowH / 2 + 2, { align: 'center' });

    // Name
    doc.setFont('helvetica', isFirst ? 'bold' : 'normal');
    doc.setFontSize(8);
    rgb(doc, isFirst ? TEXT_WHITE : [161, 161, 170]);
    doc.text(item.name, MARGIN + 9, y + rowH / 2 + 2.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    rgb(doc, color);
    doc.text(item.value + (item.unit ? ' ' + item.unit : ''), PAGE_W - MARGIN - 2, y + rowH / 2 + 2.5, { align: 'right' });

    y += rowH + 1;
  }

  return y + 6;
}

function drawTwoColumnSubRankings(
  doc: jsPDF,
  y: number,
  left: { title: string; color: [number, number, number]; items: { name: string; value: string; unit?: string }[] },
  right: { title: string; color: [number, number, number]; items: { name: string; value: string; unit?: string }[] }
): number {
  y = checkPageBreak(doc, y, 50);
  const halfW = (COL_W - 6) / 2;
  const rowH = 7.5;
  const maxItems = Math.min(Math.max(left.items.length, right.items.length), 6);

  // Left header
  fillColor(doc, BG_CARD);
  strokeColor(doc, BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y - 1, halfW, 8, 1, 1, 'FD');
  fillColor(doc, left.color);
  doc.circle(MARGIN + 5, y + 3, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, TEXT_WHITE);
  doc.text(left.title, MARGIN + 10, y + 4.5);

  // Right header
  const rx = MARGIN + halfW + 6;
  fillColor(doc, BG_CARD);
  strokeColor(doc, BORDER);
  doc.roundedRect(rx, y - 1, halfW, 8, 1, 1, 'FD');
  fillColor(doc, right.color);
  doc.circle(rx + 5, y + 3, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, TEXT_WHITE);
  doc.text(right.title, rx + 10, y + 4.5);

  y += 10;

  for (let i = 0; i < maxItems; i++) {
    const li = left.items[i];
    const ri = right.items[i];
    const isFirst = i === 0;

    // Left row
    if (li) {
      fillColor(doc, isFirst ? [18, 18, 22] : BG_DARK);
      strokeColor(doc, isFirst ? left.color : BORDER);
      doc.setLineWidth(isFirst ? 0.25 : 0.15);
      doc.roundedRect(MARGIN, y, halfW, rowH, 0.8, 0.8, 'FD');
      fillColor(doc, isFirst ? left.color : TEXT_SUBTLE);
      doc.circle(MARGIN + 3.5, y + rowH / 2, 1.5, 'F');
      doc.setFont('helvetica', isFirst ? 'bold' : 'normal');
      doc.setFontSize(7);
      rgb(doc, isFirst ? TEXT_WHITE : [161, 161, 170]);
      doc.text(li.name, MARGIN + 7.5, y + rowH / 2 + 2);
      doc.setFont('helvetica', 'bold');
      rgb(doc, left.color);
      doc.text(li.value, MARGIN + halfW - 2, y + rowH / 2 + 2, { align: 'right' });
    }

    // Right row
    if (ri) {
      fillColor(doc, isFirst ? [18, 18, 22] : BG_DARK);
      strokeColor(doc, isFirst ? right.color : BORDER);
      doc.setLineWidth(isFirst ? 0.25 : 0.15);
      doc.roundedRect(rx, y, halfW, rowH, 0.8, 0.8, 'FD');
      fillColor(doc, isFirst ? right.color : TEXT_SUBTLE);
      doc.circle(rx + 3.5, y + rowH / 2, 1.5, 'F');
      doc.setFont('helvetica', isFirst ? 'bold' : 'normal');
      doc.setFontSize(7);
      rgb(doc, isFirst ? TEXT_WHITE : [161, 161, 170]);
      doc.text(ri.name, rx + 7.5, y + rowH / 2 + 2);
      doc.setFont('helvetica', 'bold');
      rgb(doc, right.color);
      doc.text(ri.value, rx + halfW - 2, y + rowH / 2 + 2, { align: 'right' });
    }

    y += rowH + 1.5;
  }

  return y + 6;
}

function drawFooter(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rgb(doc, TEXT_SUBTLE);
    doc.text(`OWN Prévia • Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, MARGIN + 2, PAGE_H - 6);
    doc.text(`Página ${i}/${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
    // Bottom red accent
    fillColor(doc, BRAND);
    doc.rect(0, PAGE_H - 2, PAGE_W, 2, 'F');
  }
}

export function exportRankingPdf(
  results: BarberResult[],
  cycle: Cycle | null,
  mode: 'month' | 'year'
) {
  if (results.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, cycle, mode);

  // ---- PÓDIO GERAL ----
  y = drawSectionTitle(doc, y, '🏆  PÓDIO GERAL — Comissão Acumulada', BRAND);
  y = drawPodium(doc, y, results);

  // ---- SUB-RANKINGS DUPLOS ----
  // Assinaturas + Avulsos
  const sortedByMinutes = [...results].sort((a, b) => b.subscriptionMinutes - a.subscriptionMinutes);
  const sortedByAvulso = [...results].sort((a, b) => b.avulsoCount - a.avulsoCount);
  y = drawTwoColumnSubRankings(doc, y,
    {
      title: '👑  REI DAS ASSINATURAS',
      color: BLUE,
      items: sortedByMinutes.map(r => ({ name: r.barber.name, value: `${r.subscriptionMinutes} min`, unit: `(${r.subscriptionCount} atend.)` }))
    },
    {
      title: '✂️  REI DOS AVULSOS',
      color: BRAND,
      items: sortedByAvulso.map(r => ({ name: r.barber.name, value: `${r.avulsoCount} atend.` }))
    }
  );

  // Bebidas + Produtos
  const sortedByBebida = [...results].sort((a, b) => b.bebidaCount - a.bebidaCount);
  const sortedByProduct = [...results].sort((a, b) => b.productCount - a.productCount);
  y = drawTwoColumnSubRankings(doc, y,
    {
      title: '🍺  MESTRE DAS BEBIDAS',
      color: GREEN,
      items: sortedByBebida.map(r => ({ name: r.barber.name, value: `${r.bebidaCount} itens` }))
    },
    {
      title: '📦  MESTRE DOS PRODUTOS',
      color: AMBER,
      items: sortedByProduct.map(r => ({ name: r.barber.name, value: `${r.productCount} itens` }))
    }
  );

  // Extras
  const sortedByExtra = [...results].sort((a, b) => b.extraCount - a.extraCount);
  y = drawSubRanking(doc, y, '⚡  MESTRE DOS EXTRAS', PURPLE,
    sortedByExtra.map(r => ({ name: r.barber.name, value: `${r.extraCount} serv.` }))
  );

  // Conversões (if any)
  const hasConversions = results.some(r => (r.referralConversions || 0) > 0);
  if (hasConversions) {
    const sortedByConv = [...results].filter(r => (r.referralConversions || 0) > 0).sort((a, b) => (b.referralConversions || 0) - (a.referralConversions || 0));
    y = drawSubRanking(doc, y, '🚀  MESTRE DE CONVERSÕES', [56, 189, 248],
      sortedByConv.map(r => ({ name: r.barber.name, value: `${r.referralConversions} vendas` }))
    );
  }

  // Avaliações (if any)
  const hasEvals = results.some(r => (r.evaluationCount || 0) > 0);
  if (hasEvals) {
    const sortedByEval = [...results].filter(r => (r.evaluationCount || 0) > 0).sort((a, b) => (b.evaluationRating || 0) - (a.evaluationRating || 0));
    y = drawSubRanking(doc, y, '⭐  REI DO FEEDBACK', GOLD,
      sortedByEval.map(r => ({ name: r.barber.name, value: `${r.evaluationRating?.toFixed(1)} ★`, unit: `(${r.evaluationCount} aval.)` }))
    );
  }

  drawFooter(doc);

  const label = mode === 'year' ? 'anual' : (cycle?.month_year || 'mes');
  doc.save(`OWN_Ranking_${label}.pdf`);
}
