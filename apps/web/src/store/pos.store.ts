import { create } from 'zustand';
import { OrderType } from '@chhiyapasal/shared-types';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate: number;
  notes?: string;
  discountAmount?: number;
}

interface PosState {
  orderType: OrderType;
  selectedTableId: string | null;
  selectedTableName: string | null;
  selectedCustomerId: string | null;
  selectedCustomerName: string | null;
  customerNameInput: string;
  notes: string;
  cart: CartItem[];

  setOrderType: (type: OrderType) => void;
  setTable: (id: string | null, name: string | null) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setCustomerNameInput: (name: string) => void;
  setNotes: (notes: string) => void;
  addItem: (product: { id: string; name: string; price: number; tax_rate?: number }) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  setItemNotes: (productId: string, notes: string) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getTotalTax: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  orderType: OrderType.DINE_IN,
  selectedTableId: null,
  selectedTableName: null,
  selectedCustomerId: null,
  selectedCustomerName: null,
  customerNameInput: '',
  notes: '',
  cart: [],

  setOrderType: (orderType) => set({ orderType }),
  setTable: (id, name) => set({ selectedTableId: id, selectedTableName: name }),
  setCustomer: (id, name) => set({ selectedCustomerId: id, selectedCustomerName: name, customerNameInput: name || '' }),
  setCustomerNameInput: (customerNameInput) => set({ customerNameInput }),
  setNotes: (notes) => set({ notes }),

  addItem: (product) => {
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
            taxRate: Number(product.tax_rate || 0),
          },
        ],
      };
    });
  },

  updateQuantity: (productId, delta) => {
    set((state) => {
      const updated = state.cart
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
      return { cart: updated };
    });
  },

  removeItem: (productId) => {
    set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) }));
  },

  setItemNotes: (productId, notes) => {
    set((state) => ({
      cart: state.cart.map((i) => (i.productId === productId ? { ...i, notes } : i)),
    }));
  },

  clearCart: () =>
    set({
      cart: [],
      selectedTableId: null,
      selectedTableName: null,
      selectedCustomerId: null,
      selectedCustomerName: null,
      customerNameInput: '',
      notes: '',
    }),

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotalTax: () => {
    return get().cart.reduce((sum, item) => {
      const itemTax = (item.price * item.quantity * item.taxRate) / 100;
      return sum + itemTax;
    }, 0);
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTotalTax();
  },
}));
