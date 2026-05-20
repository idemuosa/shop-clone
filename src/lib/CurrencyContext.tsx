import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'NGN' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number | string) => string;
  convertPrice: (price: number) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const RATES: Record<Currency, number> = {
  USD: 1,
  NGN: 1500, // Approximate Naira rate
  EUR: 0.93, // Approximate Euro rate
  GBP: 0.79, // Approximate Pound rate
};

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  NGN: '₦',
  EUR: '€',
  GBP: '£',
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const convertPrice = (price: number) => {
    return price * RATES[currency];
  };

  const formatPrice = (price: number | string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    if (isNaN(numericPrice)) return '$0.00';

    const converted = convertPrice(numericPrice);
    return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      symbol: SYMBOLS[currency]
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
