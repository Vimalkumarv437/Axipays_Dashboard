export const maskCardNumber = (cardNumber) => {
  const sanitized = cardNumber.replace(/\s+/g, '');
  if (sanitized.length < 10) return cardNumber;
  
  const first6 = sanitized.substring(0, 6);
  const last4 = sanitized.substring(sanitized.length - 4);
  const middleMaskLength = sanitized.length - 10;
  
  return `${first6}${'*'.repeat(middleMaskLength)}${last4}`;
};

export const maskCvv = (cvv) => {
  return '*'.repeat(cvv.length);
};
