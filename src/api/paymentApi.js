import axios from 'axios';

const paymentApiUrl = import.meta.env.AXIPAY_PAYMENT_API
const tableDataApiUrl = import.meta.env.AXIPAY_TABLEDATA_API

export const initiatePayment = async (paymentData, hash) => {
  try {
    const response = await axios.post(paymentApiUrl, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'Hash': hash
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const fetchTransactions = async (page = 1, limit = 100) => {
  try {
    const response = await axios.get(`${tableDataApiUrl}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};
