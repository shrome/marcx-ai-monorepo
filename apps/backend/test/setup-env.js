// Loads .env.test before all e2e tests run
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.test') });
