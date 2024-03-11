require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || '',
  DB_HOST: process.env.DB_HOST || '',
  DB_USERNAME: process.env.DB_USERNAME || '',
  DB_NAME: process.env.DB_NAME || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',
  AWS_REGION: process.env.AWS_REGION || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || ''
};
