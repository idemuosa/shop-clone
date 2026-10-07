import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'NGN';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number | string) => string;
  convertPrice: (price: number) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('NGN');

  const convertPrice = (price: number) => {
    return price;
  };

  const formatPrice = (price: number | string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    if (isNaN(numericPrice)) return '₦0.00';

    return `₦${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      symbol: SYMBOLS['NGN']
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
