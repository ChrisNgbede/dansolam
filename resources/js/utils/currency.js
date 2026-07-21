export const getCurrencySymbol = () => {
  // If stored in localStorage, retrieve it synchronously
  return localStorage.getItem('fairqueen_currency_symbol') || '₦';
};

export const formatPrice = (amount) => {
  const sym = getCurrencySymbol();
  return sym + parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};
