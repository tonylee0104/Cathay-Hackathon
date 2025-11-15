import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');
  const exchangeRate = 7.8; // 1 USD = 7.8 HKD

  const formatCurrency = (amount, options = {}) => {
    const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
    
    if (currency === 'HKD') {
      const converted = amount * exchangeRate;
      return `HKD $${converted.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits })}`;
    }
    
    return `USD $${amount.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits })}`;
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'HKD' : 'USD');
  };

  return (
    <CurrencyContext.Provider value={{ currency, formatCurrency, toggleCurrency, exchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}