require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Paystack = require('paystack-node');

const argv = require('minimist')(process.argv.slice(2));
const email = argv.email || argv.e;
const amount = parseFloat(argv.amount || argv.a);
const studentId = argv.studentId || argv.s || 0;
const studentFeeId = argv.studentFeeId || argv.f || 0;
const callbackUrl = 'http://localhost:5173/payment-success.html'; 
if (!email || !amount) {
  console.error('email and amount are required. Example: --email student@school.com --amount 50000');
  process.exit(1);
}

const secretKey = process.env.PAYSTACK_SECRET_KEY;
if (!secretKey) {
  console.error('PAYSTACK_SECRET_KEY not found in .env');
  process.exit(1);
}

const paystack = new Paystack(secretKey);

(async () => {
  try {
    const transactionData = {
      amount: Math.round(amount * 100),
      email,
      reference: `SCH_${Date.now()}_${studentId}_${studentFeeId}`,
      callback_url: callbackUrl,
      metadata: JSON.stringify({
        studentId,
        studentFeeId,
        type: 'school_fee'
      })
    };

    const response = await paystack.initializeTransaction(transactionData);

    const safeResponse = {
      status: response && response.status,
      message: response && response.message,
      data: response && (response.data || response.body)
    };

    console.log('response:', safeResponse);

    let body = response.data || response.body || response;
    let data = body && (body.data || body);

    if ((response.status || (body && body.status) || (data && data.status))) {
      const authUrl = data && data.authorization_url || (data && data.data && data.data.authorization_url);
      const reference = data && data.reference || (data && data.data && data.data.reference) || (body && body.reference);

      console.log('Authorization URL:', authUrl);
      console.log('Reference:', reference);
      process.exit(0);
    }

    console.error('Failed to initialize transaction:', response.message || (body && body.message) || (data && data.message));
    process.exit(2);
  } catch (err) {
    console.error('Error initializing Paystack transaction:', err.message || err);
    process.exit(3);
  }
})();
