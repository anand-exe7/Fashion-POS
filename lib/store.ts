/**
 * Local browser-backed data store.
 *
 * Stands in for a database while the shop runs without a backend. Products and
 * completed orders live in localStorage, so the POS panel and the public
 * invoice page — same origin — read and write the same records.
 */

const PRODUCTS_KEY = "dh_products";
const ORDERS_KEY = "dh_orders";

export type StoredProduct = {
  id: string;
  name: string;
  description: string;
  default_price: number;
};

export type StoredOrderItem = {
  snapshot_name: string;
  snapshot_desc: string;
  snapshot_price: number;
  quantity: number;
};

export type StoredOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  source: "ONLINE" | "OFFLINE";
  status: "COMPLETED" | "PENDING";
  subtotal: number;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  discount_amount: number;
  delivery_fee: number;
  grand_total: number;
  cash_received: number;
  created_at: string;
  order_items: StoredOrderItem[];
};

const read = <T>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Could not read "${key}" from local storage`, err);
    return [];
  }
};

const write = <T>(key: string, rows: T[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(rows));
  } catch (err) {
    console.error(`Could not save "${key}" to local storage`, err);
  }
};

const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const getProducts = (): StoredProduct[] =>
  read<StoredProduct>(PRODUCTS_KEY);

export const addProduct = (input: Omit<StoredProduct, "id">): StoredProduct => {
  const product: StoredProduct = { id: newId(), ...input };
  write(PRODUCTS_KEY, [...getProducts(), product]);
  return product;
};

export const updateProduct = (
  id: string,
  input: Omit<StoredProduct, "id">,
): StoredProduct | null => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: StoredProduct = { ...products[index], ...input };
  products[index] = updated;
  write(PRODUCTS_KEY, products);
  return updated;
};

export const deleteProduct = (id: string) => {
  write(
    PRODUCTS_KEY,
    getProducts().filter((p) => p.id !== id),
  );
};

/** Newest first, matching the order history and analytics views. */
export const getOrders = (): StoredOrder[] =>
  read<StoredOrder>(ORDERS_KEY).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

export const getOrder = (id: string): StoredOrder | null =>
  read<StoredOrder>(ORDERS_KEY).find((o) => o.id === id) || null;

export const orderExists = (id: string): boolean =>
  read<StoredOrder>(ORDERS_KEY).some((o) => o.id === id);

export const saveOrder = (order: StoredOrder) => {
  const rest = read<StoredOrder>(ORDERS_KEY).filter((o) => o.id !== order.id);
  write(ORDERS_KEY, [order, ...rest]);
};
