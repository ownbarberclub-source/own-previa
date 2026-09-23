const LOCAL_STORAGE_KEY = '@own-previa:item-prices';

/**
 * Obtém o mapa de preços unitários salvos localmente
 */
export function getStoredUnitPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Salva ou atualiza o preço unitário de um item no armazenamento local
 */
export function saveStoredUnitPrice(itemName: string, price: number) {
  try {
    const prices = getStoredUnitPrices();
    prices[itemName.trim().toLowerCase()] = price;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prices));
  } catch (e) {
    console.error("Erro ao salvar preço unitário local:", e);
  }
}

/**
 * Obtém o preço unitário de um item, checando primeiro o objeto cadastrado e depois o cache local
 */
export function getUnitPriceForItem(
  itemName: string, 
  serviceTypes?: Array<{ item_name: string; unit_price?: number }>
): number {
  const normalized = itemName.trim().toLowerCase();
  if (serviceTypes) {
    const found = serviceTypes.find(s => s.item_name.trim().toLowerCase() === normalized);
    if (found && typeof found.unit_price === 'number' && found.unit_price > 0) {
      return found.unit_price;
    }
  }
  const localPrices = getStoredUnitPrices();
  return localPrices[normalized] || 0;
}
