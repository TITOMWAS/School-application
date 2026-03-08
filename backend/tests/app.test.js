// Simple test file for CI/CD
console.log('Running basic tests...');

// Basic test - just check if the app can be required
const app = require('../src/app');
const paymentGateway = require('../src/utils/paymentGateway');

console.log('All tests passed!');
process.exit(0);

