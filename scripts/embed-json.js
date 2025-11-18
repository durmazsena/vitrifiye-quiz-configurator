// Script to embed JSON files into the bundle
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const shopifyData = JSON.parse(readFileSync(join(__dirname, '../data/shopify-products.json'), 'utf-8'));
const exportedProducts = JSON.parse(readFileSync(join(__dirname, '../exported-products.json'), 'utf-8'));

const embeddedData = `
// Auto-generated: Embedded JSON data for Netlify Functions
export const embeddedShopifyData = ${JSON.stringify(shopifyData)};
export const embeddedExportedProducts = ${JSON.stringify(exportedProducts)};
`;

writeFileSync(join(__dirname, '../server/db-data.ts'), embeddedData, 'utf-8');
console.log('✅ Embedded JSON data generated');

