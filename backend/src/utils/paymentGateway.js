const Paystack = require('paystack-node');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const getPaystackInstance = () => {
  const secretKey = env.paystack.secretKey;
  
  if (!secretKey) {
    throw new ApiError(500, 'Paystack secret key not configured');
  }
  
  return new Paystack(secretKey);
};

const initializePayment = async ({ email, amount, studentId, studentFeeId, callbackUrl }) => {
  try {
    const paystack = getPaystackInstance();
    
    const transactionData = {
      amount: Math.round(amount * 100),
      email,
      reference: `SCH_${Date.now()}_${studentId}_${studentFeeId}`,
      // Don't set callback_url - Paystack will show its own success page
      metadata: JSON.stringify({
        studentId,
        studentFeeId,
        type: 'school_fee'
      })
    };
    
    // Only add callback_url if explicitly provided
    if (callbackUrl) {
      transactionData.callback_url = callbackUrl;
    }
    
    const response = await paystack.initializeTransaction(transactionData);
    
    if (response.status) {
      return {
        success: true,
        reference: response.data.reference,
        authorizationUrl: response.data.authorization_url,
        accessCode: response.data.access_code,
        amount: response.data.amount,
        currency: response.data.currency
      };
    }
    
    throw new ApiError(400, response.message || 'Failed to initialize payment');
  } catch (error) {
    console.error('Paystack initialize error:', error);
    throw new ApiError(500, error.message || 'Payment initialization failed');
  }
};

const chargeMobileMoney = async ({ email, phoneNumber, amount, studentId, studentFeeId }) => {
  try {
    const paystack = getPaystackInstance();
    
    let formattedPhone = phoneNumber.replace(/^\+/, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    const metadata = {
      studentId,
      studentFeeId,
      type: 'school_fee',
      phoneNumber: formattedPhone
    };
    
    const initializeData = {
      amount: Math.round(amount * 100),
      email,
      phone: formattedPhone,
      reference: `SCH_${Date.now()}_${studentId}_${studentFeeId}`,
      currency: 'KES',
      metadata: JSON.stringify(metadata),
    };
    
    const response = await paystack.initializeTransaction(initializeData);
    
    const responseBody = response.body || response.data;
    const status = response.status || (responseBody && responseBody.status);
    const message = response.message || (responseBody && responseBody.message);
    const data = response.data || responseBody;
    
    if (status) {
      return {
        success: true,
        reference: data.reference,
        status: data.status,
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        message: message || 'Payment initialized. Redirect user to authorization_url to complete payment.',
        requiresApproval: true
      };
    }
    
    throw new ApiError(400, message || 'Failed to initialize payment');
  } catch (error) {
    console.error('Paystack mobile money charge error:', error);
    throw new ApiError(500, error.message || 'Payment initialization failed');
  }
};

const verifyTransaction = async (reference) => {
  try {
    const paystack = getPaystackInstance();
    const response = await paystack.verifyTransaction({ reference });

    const body = response.data || response.body || response;
    const data = body && (body.data || body);

    const status = response.status || (body && body.status) || (data && data.status);

    if (status && data && data.status === 'success') {
      return {
        success: true,
        verified: true,
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        status: data.status,
        customer: {
          email: data.customer && data.customer.email,
          phone: data.customer && data.customer.phone
        },
        metadata: data.metadata
      };
    }

    return {
      success: true,
      verified: false,
      status: data && data.status,
      message: 'Transaction not successful'
    };
  } catch (error) {
    console.error('Paystack verify error:', error);
    throw new ApiError(500, error.message || 'Transaction verification failed');
  }
};

const createPaymentLink = async ({ title, description, amount, studentId, studentFeeId }) => {
  try {
    const paystack = getPaystackInstance();
    
    const response = await paystack.createPaymentPage({
      title,
      description,
      amount: Math.round(amount * 100),
      currency: 'KES',
      metadata: {
        studentId,
        studentFeeId,
        type: 'school_fee'
      }
    });
    
    if (response.status) {
      return {
        success: true,
        pageId: response.data.id,
        pageUrl: response.data.page_url,
        slug: response.data.slug
      };
    }
    
    throw new ApiError(400, response.message || 'Failed to create payment page');
  } catch (error) {
    console.error('Paystack create page error:', error);
    throw new ApiError(500, error.message || 'Failed to create payment page');
  }
};

const listTransactions = async ({ perPage = 50, page = 1, from, to }) => {
  try {
    const paystack = getPaystackInstance();
    const response = await paystack.listTransactions({
      perPage,
      page,
      from,
      to
    });
    
    if (response.status) {
      return {
        success: true,
        transactions: response.data.map(t => ({
          id: t.id,
          reference: t.reference,
          amount: t.amount / 100,
          status: t.status,
          createdAt: t.created_at,
          customer: {
            email: t.customer.email,
            phone: t.customer.phone
          }
        })),
        meta: response.meta
      };
    }
    
    throw new ApiError(400, response.message || 'Failed to list transactions');
  } catch (error) {
    console.error('Paystack list error:', error);
    throw new ApiError(500, error.message || 'Failed to list transactions');
  }
};

const handleWebhook = async (event, payload) => {
  const { event: eventType, data } = payload;
  
  switch (eventType) {
    case 'charge.success':
      return {
        event: 'payment_success',
        reference: data.reference,
        amount: data.amount / 100,
        status: data.status,
        customer: {
          email: data.customer.email,
          phone: data.customer.phone
        },
        metadata: data.metadata
      };
      
    case 'charge.failed':
      return {
        event: 'payment_failed',
        reference: data.reference,
        status: data.status,
        customer: {
          email: data.customer.email,
          phone: data.customer.phone
        }
      };
      
    case 'transfer.success':
      return { event: 'transfer_success', data };
      
    default:
      return { event: eventType, data };
  }
};

const refundTransaction = async ({ transactionId, amount }) => {
  try {
    const paystack = getPaystackInstance();
    const response = await paystack.refundTransaction({
      transaction: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    
    if (response.status) {
      return {
        success: true,
        refunded: true,
        amount: response.data.amount / 100,
        status: response.data.status
      };
    }
    
    throw new ApiError(400, response.message || 'Refund failed');
  } catch (error) {
    console.error('Paystack refund error:', error);
    throw new ApiError(500, error.message || 'Refund failed');
  }
};

module.exports = {
  initializePayment,
  chargeMobileMoney,
  verifyTransaction,
  createPaymentLink,
  listTransactions,
  handleWebhook,
  refundTransaction
};

