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
