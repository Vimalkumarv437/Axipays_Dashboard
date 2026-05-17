import CryptoJS from 'crypto-js';

export const generateHash = (cardNumber, email, secretKey) => {
  const sanitizedCard = cardNumber.replace(/\s+/g, '');
  
  if (sanitizedCard.length < 10) return null;
  
  const first6 = sanitizedCard.substring(0, 6);
  const last4 = sanitizedCard.substring(sanitizedCard.length - 4);
  const combinedCard = first6 + last4;
  
  const reverseString = (str) => str.split('').reverse().join('');
  
  const reversedCard = reverseString(combinedCard);
  const reversedEmail = reverseString(email);
  
  const message = `${reversedEmail}AXIPAYS${reversedCard}`.toUpperCase();
  
  const hash = CryptoJS.HmacSHA256(message, secretKey);
  const hexHash = CryptoJS.enc.Hex.stringify(hash).toUpperCase();
  
  return hexHash;
};
