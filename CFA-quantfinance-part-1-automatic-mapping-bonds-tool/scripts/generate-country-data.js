import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.resolve(__dirname, '../app/sample-data.js');
const LOG_FILE = path.resolve(__dirname, 'generate-country-data.log');
const MAX_RETRIES = 3;
const NAV_TIMEOUT = 30000;
const INDICATOR_ALIASES = [
  { keys: ['Inflation Rate', 'Inflation'], field: 'inflationRate', parser: 'percent' },
  { keys: ['Interest Rate', 'Policy Rate', 'Central Bank Rate', 'Central Bank interest rate'], field: 'policyInterestRate', parser: 'percent' },
  { keys: ['Government Debt to GDP', 'Gross government debt (% of GDP)', 'Gross Government Debt (% of GDP)', 'Government debt to GDP', 'Public debt to GDP'], field: 'debtToGdp', parser: 'percent' },
  { keys: ['Foreign Exchange Reserves', 'FX Reserves', 'International Reserves'], field: 'foreignExchangeReserves', parser: 'reserves' },
  { keys: ['Credit Rating', 'Sovereign Rating'], field: 'creditRating', parser: 'rating' },
  { keys: ['Fiscal Balance', 'Government Budget Balance', 'Budget Balance', 'General Government Balance', 'Fiscal Deficit'], field: 'fiscalDeficitToGdp', parser: 'percent' }
];
const RATING_ORDER = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC', 'CC', 'C', 'D'];
const REGION_DEFAULT_RESERVES = {
  Americas: 400,
  Europe: 230,
  Asia: 650,
  'Middle East': 420,
  Africa: 80,
  Oceania: 30
};
const REGION_RISK = {
  Americas: 0.8,
  Europe: 0.6,
  Asia: 0.9,
  'Middle East': 1.2,
  Africa: 1.4,
  Oceania: 0.7
};

const COUNTRIES = [
  { country: 'United States', region: 'Americas', currency: 'USD', bondName: 'US 10Y Treasury' },
  { country: 'Canada', region: 'Americas', currency: 'CAD', bondName: 'Canada 10Y Bond' },
  { country: 'Mexico', region: 'Americas', currency: 'MXN', bondName: 'Mexico 10Y Bond' },
  { country: 'Brazil', region: 'Americas', currency: 'BRL', bondName: 'Brazil 10Y Bond' },
  { country: 'Argentina', region: 'Americas', currency: 'ARS', bondName: 'Argentina 10Y Bond' },
  { country: 'Chile', region: 'Americas', currency: 'CLP', bondName: 'Chile 10Y Bond' },
  { country: 'Colombia', region: 'Americas', currency: 'COP', bondName: 'Colombia 10Y Bond' },
  { country: 'Peru', region: 'Americas', currency: 'PEN', bondName: 'Peru 10Y Bond' },
  { country: 'Uruguay', region: 'Americas', currency: 'UYU', bondName: 'Uruguay 10Y Bond' },
  { country: 'Paraguay', region: 'Americas', currency: 'PYG', bondName: 'Paraguay 10Y Bond' },
  { country: 'Ecuador', region: 'Americas', currency: 'USD', bondName: 'Ecuador 10Y Bond' },
  { country: 'Bolivia', region: 'Americas', currency: 'BOB', bondName: 'Bolivia 10Y Bond' },
  { country: 'Venezuela', region: 'Americas', currency: 'VES', bondName: 'Venezuela 10Y Bond' },
  { country: 'United Kingdom', region: 'Europe', currency: 'GBP', bondName: 'UK 10Y Gilt' },
  { country: 'Germany', region: 'Europe', currency: 'EUR', bondName: 'Germany 10Y Bund' },
  { country: 'France', region: 'Europe', currency: 'EUR', bondName: 'France 10Y OAT' },
  { country: 'Italy', region: 'Europe', currency: 'EUR', bondName: 'Italy 10Y BTP' },
  { country: 'Spain', region: 'Europe', currency: 'EUR', bondName: 'Spain 10Y Bonos' },
  { country: 'Netherlands', region: 'Europe', currency: 'EUR', bondName: 'Netherlands 10Y Bond' },
  { country: 'Belgium', region: 'Europe', currency: 'EUR', bondName: 'Belgium 10Y Bond' },
  { country: 'Switzerland', region: 'Europe', currency: 'CHF', bondName: 'Switzerland 10Y Bond' },
  { country: 'Sweden', region: 'Europe', currency: 'SEK', bondName: 'Sweden 10Y Bond' },
  { country: 'Norway', region: 'Europe', currency: 'NOK', bondName: 'Norway 10Y Bond' },
  { country: 'Denmark', region: 'Europe', currency: 'DKK', bondName: 'Denmark 10Y Bond' },
  { country: 'Finland', region: 'Europe', currency: 'EUR', bondName: 'Finland 10Y Bond' },
  { country: 'Austria', region: 'Europe', currency: 'EUR', bondName: 'Austria 10Y Bond' },
  { country: 'Ireland', region: 'Europe', currency: 'EUR', bondName: 'Ireland 10Y Bond' },
  { country: 'Portugal', region: 'Europe', currency: 'EUR', bondName: 'Portugal 10Y Bond' },
  { country: 'Greece', region: 'Europe', currency: 'EUR', bondName: 'Greece 10Y Bond' },
  { country: 'Poland', region: 'Europe', currency: 'PLN', bondName: 'Poland 10Y Bond' },
  { country: 'Czech Republic', region: 'Europe', currency: 'CZK', bondName: 'Czech Republic 10Y Bond' },
  { country: 'Hungary', region: 'Europe', currency: 'HUF', bondName: 'Hungary 10Y Bond' },
  { country: 'Romania', region: 'Europe', currency: 'RON', bondName: 'Romania 10Y Bond' },
  { country: 'Bulgaria', region: 'Europe', currency: 'BGN', bondName: 'Bulgaria 10Y Bond' },
  { country: 'Slovakia', region: 'Europe', currency: 'EUR', bondName: 'Slovakia 10Y Bond' },
  { country: 'Slovenia', region: 'Europe', currency: 'EUR', bondName: 'Slovenia 10Y Bond' },
  { country: 'Croatia', region: 'Europe', currency: 'HRK', bondName: 'Croatia 10Y Bond' },
  { country: 'Serbia', region: 'Europe', currency: 'RSD', bondName: 'Serbia 10Y Bond' },
  { country: 'Montenegro', region: 'Europe', currency: 'EUR', bondName: 'Montenegro 10Y Bond' },
  { country: 'North Macedonia', region: 'Europe', currency: 'MKD', bondName: 'North Macedonia 10Y Bond' },
  { country: 'China', region: 'Asia', currency: 'CNY', bondName: 'China 10Y Government Bond' },
  { country: 'Japan', region: 'Asia', currency: 'JPY', bondName: 'Japan 10Y JGB' },
  { country: 'South Korea', region: 'Asia', currency: 'KRW', bondName: 'South Korea 10Y Bond' },
  { country: 'India', region: 'Asia', currency: 'INR', bondName: 'India 10Y G-Sec' },
  { country: 'Indonesia', region: 'Asia', currency: 'IDR', bondName: 'Indonesia 10Y Bond' },
  { country: 'Thailand', region: 'Asia', currency: 'THB', bondName: 'Thailand 10Y Bond' },
  { country: 'Vietnam', region: 'Asia', currency: 'VND', bondName: 'Vietnam 10Y Bond' },
  { country: 'Malaysia', region: 'Asia', currency: 'MYR', bondName: 'Malaysia 10Y Bond' },
  { country: 'Singapore', region: 'Asia', currency: 'SGD', bondName: 'Singapore 10Y SGS' },
  { country: 'Philippines', region: 'Asia', currency: 'PHP', bondName: 'Philippines 10Y Bond' },
  { country: 'Pakistan', region: 'Asia', currency: 'PKR', bondName: 'Pakistan 10Y Bond' },
  { country: 'Bangladesh', region: 'Asia', currency: 'BDT', bondName: 'Bangladesh 10Y Bond' },
  { country: 'Sri Lanka', region: 'Asia', currency: 'LKR', bondName: 'Sri Lanka 10Y Bond' },
  { country: 'Nepal', region: 'Asia', currency: 'NPR', bondName: 'Nepal 10Y Bond' },
  { country: 'Mongolia', region: 'Asia', currency: 'MNT', bondName: 'Mongolia 10Y Bond' },
  { country: 'Kazakhstan', region: 'Asia', currency: 'KZT', bondName: 'Kazakhstan 10Y Bond' },
  { country: 'Uzbekistan', region: 'Asia', currency: 'UZS', bondName: 'Uzbekistan 10Y Bond' },
  { country: 'Azerbaijan', region: 'Asia', currency: 'AZN', bondName: 'Azerbaijan 10Y Bond' },
  { country: 'Georgia', region: 'Asia', currency: 'GEL', bondName: 'Georgia 10Y Bond' },
  { country: 'Armenia', region: 'Asia', currency: 'AMD', bondName: 'Armenia 10Y Bond' },
  { country: 'Saudi Arabia', region: 'Middle East', currency: 'SAR', bondName: 'Saudi Arabia 10Y Bond' },
  { country: 'United Arab Emirates', region: 'Middle East', currency: 'AED', bondName: 'UAE 10Y Bond' },
  { country: 'Qatar', region: 'Middle East', currency: 'QAR', bondName: 'Qatar 10Y Bond' },
  { country: 'Kuwait', region: 'Middle East', currency: 'KWD', bondName: 'Kuwait 10Y Bond' },
  { country: 'Bahrain', region: 'Middle East', currency: 'BHD', bondName: 'Bahrain 10Y Bond' },
  { country: 'Oman', region: 'Middle East', currency: 'OMR', bondName: 'Oman 10Y Bond' },
  { country: 'Israel', region: 'Middle East', currency: 'ILS', bondName: 'Israel 10Y Bond' },
  { country: 'Jordan', region: 'Middle East', currency: 'JOD', bondName: 'Jordan 10Y Bond' },
  { country: 'Lebanon', region: 'Middle East', currency: 'LBP', bondName: 'Lebanon 10Y Bond' },
  { country: 'Iraq', region: 'Middle East', currency: 'IQD', bondName: 'Iraq 10Y Bond' },
  { country: 'South Africa', region: 'Africa', currency: 'ZAR', bondName: 'South Africa 10Y Bond' },
  { country: 'Nigeria', region: 'Africa', currency: 'NGN', bondName: 'Nigeria 10Y Bond' },
  { country: 'Egypt', region: 'Africa', currency: 'EGP', bondName: 'Egypt 10Y Bond' },
  { country: 'Morocco', region: 'Africa', currency: 'MAD', bondName: 'Morocco 10Y Bond' },
  { country: 'Algeria', region: 'Africa', currency: 'DZD', bondName: 'Algeria 10Y Bond' },
  { country: 'Tunisia', region: 'Africa', currency: 'TND', bondName: 'Tunisia 10Y Bond' },
  { country: 'Kenya', region: 'Africa', currency: 'KES', bondName: 'Kenya 10Y Bond' },
  { country: 'Ethiopia', region: 'Africa', currency: 'ETB', bondName: 'Ethiopia 10Y Bond' },
  { country: 'Ghana', region: 'Africa', currency: 'GHS', bondName: 'Ghana 10Y Bond' },
  { country: 'Tanzania', region: 'Africa', currency: 'TZS', bondName: 'Tanzania 10Y Bond' },
  { country: 'Uganda', region: 'Africa', currency: 'UGX', bondName: 'Uganda 10Y Bond' },
  { country: 'Angola', region: 'Africa', currency: 'AOA', bondName: 'Angola 10Y Bond' },
  { country: 'Mozambique', region: 'Africa', currency: 'MZN', bondName: 'Mozambique 10Y Bond' },
  { country: 'Senegal', region: 'Africa', currency: 'XOF', bondName: 'Senegal 10Y Bond' },
  { country: 'Cameroon', region: 'Africa', currency: 'XAF', bondName: 'Cameroon 10Y Bond' },
  { country: 'Zambia', region: 'Africa', currency: 'ZMW', bondName: 'Zambia 10Y Bond' },
  { country: 'Zimbabwe', region: 'Africa', currency: 'ZWL', bondName: 'Zimbabwe 10Y Bond' },
  { country: 'Botswana', region: 'Africa', currency: 'BWP', bondName: 'Botswana 10Y Bond' },
  { country: 'Namibia', region: 'Africa', currency: 'NAD', bondName: 'Namibia 10Y Bond' },
  { country: 'Mauritius', region: 'Africa', currency: 'MUR', bondName: 'Mauritius 10Y Bond' },
  { country: 'Madagascar', region: 'Africa', currency: 'MGA', bondName: 'Madagascar 10Y Bond' },
  { country: 'Rwanda', region: 'Africa', currency: 'RWF', bondName: 'Rwanda 10Y Bond' },
  { country: 'Burundi', region: 'Africa', currency: 'BIF', bondName: 'Burundi 10Y Bond' },
  { country: 'Australia', region: 'Oceania', currency: 'AUD', bondName: 'Australia 10Y Bond' },
  { country: 'New Zealand', region: 'Oceania', currency: 'NZD', bondName: 'New Zealand 10Y Bond' },
  { country: 'Papua New Guinea', region: 'Oceania', currency: 'PGK', bondName: 'Papua New Guinea 10Y Bond' },
  { country: 'Fiji', region: 'Oceania', currency: 'FJD', bondName: 'Fiji 10Y Bond' },
  { country: 'Solomon Islands', region: 'Oceania', currency: 'SBD', bondName: 'Solomon Islands 10Y Bond' },
  { country: 'Vanuatu', region: 'Oceania', currency: 'VUV', bondName: 'Vanuatu 10Y Bond' },
  { country: 'Samoa', region: 'Oceania', currency: 'WST', bondName: 'Samoa 10Y Bond' },
  { country: 'Tonga', region: 'Oceania', currency: 'TOP', bondName: 'Tonga 10Y Bond' },
  { country: 'Kiribati', region: 'Oceania', currency: 'AUD', bondName: 'Kiribati 10Y Bond' },
  { country: 'Marshall Islands', region: 'Oceania', currency: 'USD', bondName: 'Marshall Islands 10Y Bond' }
];

function slugifyCountry(country) {
  const specialSlugs = new Map([
    ['United States', 'united-states'],
    ['United Kingdom', 'united-kingdom'],
    ['South Korea', 'south-korea'],
    ['United Arab Emirates', 'united-arab-emirates'],
    ['Czech Republic', 'czech-republic'],
    ['North Macedonia', 'north-macedonia'],
    ['Papua New Guinea', 'papua-new-guinea']
  ]);
  if (specialSlugs.has(country)) {
    return specialSlugs.get(country);
  }
  return country
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[’'‘’]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function logMessage(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  process.stdout.write(line);
  return fs.appendFile(LOG_FILE, line, 'utf8');
}

function parseNumeric(raw, options = {}) {
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.replace(/,|\s|USD|EUR|GBP|JPY|KRW|CNY|SGD|INR|AUD|NZD|CAD|BRL|MXN|CHF|SEK|NOK|DKK|PLN|HUF|RON|BGN|HRK|RSD|MKD|AZN|GEL|AMD|SAR|AED|QAR|KWD|BHD|OMR|ILS|JOD|LBP|IQD|EGP|ZAR|NGN|MXN|ARS|CLP|COP|PEN|UYU|BOB|VES|MAD|DZD|TND|KES|ETB|GHS|TZS|UGX|AOA|MZN|XOF|XAF|ZMW|ZWL|BWP|NAD|MUR|MGA|RWF|BIF|PGK|FJD|SBD|VUV|WST|TOP|PYG|KGS|KZT|UZS|NPR|LKR|BDT|PKR|IDR|THB|VND|MYR|PHP|RUB/gi, '')
    .trim();
  const percent = normalized.includes('%');
  const negative = normalized.includes('(') || /^-/.test(normalized);
  const cleaned = normalized.replace(/[()%]/g, '').trim();
  if (!cleaned) return null;
  const unitMatch = cleaned.match(/([\d.\-]+)\s*([kKmMbBtT])?$/);
  if (!unitMatch) return null;
  let value = parseFloat(unitMatch[1]);
  if (Number.isNaN(value)) return null;
  const unit = (unitMatch[2] || '').toUpperCase();
  if (unit === 'K') value /= 1000;
  if (unit === 'M') value /= 1000;
  if (unit === 'B') value = value;
  if (unit === 'T') value *= 1000;
  if (percent || options.parser === 'percent') {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value * 10) / 10;
}

function parseRating(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  for (const rating of RATING_ORDER) {
    if (normalized.includes(rating)) {
      return rating;
    }
  }
  return null;
}

function chooseFromAliases(label, value, record) {
  const normalizedLabel = label.toLowerCase();
  for (const alias of INDICATOR_ALIASES) {
    for (const key of alias.keys) {
      if (normalizedLabel.includes(key.toLowerCase())) {
        const parsed = alias.parser === 'rating'
          ? parseRating(value)
          : parseNumeric(value, { parser: alias.parser });
        if (parsed == null) break;
        if (alias.field === 'fiscalDeficitToGdp') {
          record.fiscalDeficitToGdp = normalizeFiscalDeficit(parsed);
        } else {
          record[alias.field] = parsed;
        }
        return;
      }
    }
  }
}

function normalizeFiscalDeficit(value) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.max(0, -value);
}

function ratingScore(rating) {
  const index = RATING_ORDER.indexOf(rating);
  return index === -1 ? RATING_ORDER.length : index + 1;
}

function estimateCreditRating(record) {
  if (record.creditRating) return record.creditRating;
  const debt = record.debtToGdp ?? 80;
  const inflation = record.inflationRate ?? 3;
  const deficit = record.fiscalDeficitToGdp ?? 3;
  const reserves = record.foreignExchangeReserves ?? REGION_DEFAULT_RESERVES[record.region];
  const regionRisk = REGION_RISK[record.region] ?? 1;
  const score = Math.max(1, Math.min(18,
    1
    + (debt - 40) * 0.08
    + Math.max(0, inflation - 2) * 0.4
    + Math.max(0, deficit - 2) * 0.6
    + regionRisk * 0.9
    - Math.min(50, reserves) * 0.02
  ));
  if (score < 2.5) return 'AAA';
  if (score < 3.5) return 'AA+';
  if (score < 4.5) return 'AA';
  if (score < 5.5) return 'AA-';
  if (score < 6.5) return 'A+';
  if (score < 7.5) return 'A';
  if (score < 8.5) return 'A-';
  if (score < 9.8) return 'BBB+';
  if (score < 11.2) return 'BBB';
  if (score < 12.6) return 'BBB-';
  if (score < 14.2) return 'BB+';
  if (score < 15.8) return 'BB';
  if (score < 17.5) return 'BB-';
  if (score < 18.8) return 'B+';
  if (score < 20.2) return 'B';
  return 'B-';
}

function estimatePolicyInterestRate(record) {
  if (record.policyInterestRate != null) {
    return record.policyInterestRate;
  }
  const inflation = record.inflationRate ?? 3;
  const debt = record.debtToGdp ?? 80;
  const deficit = record.fiscalDeficitToGdp ?? 3;
  const ratingModifier = ratingScore(record.creditRating) * 0.15;
  const base = inflation * 0.9 + deficit * 0.25 + Math.max(0, debt - 70) * 0.03 + ratingModifier;
  return Math.round(Math.max(0.0, Math.min(25, base)) * 100) / 100;
}

function estimateCdSSpread(record) {
  if (record.cdsSpread != null) return record.cdsSpread;
  const score = ratingScore(record.creditRating);
  const debt = record.debtToGdp;
  const inflation = record.inflationRate;
  const deficit = record.fiscalDeficitToGdp;
  const reserves = record.foreignExchangeReserves;
  const base = 8 + score * 10 + Math.max(0, debt - 50) * 0.3 + Math.max(0, inflation - 2) * 1.0 + Math.max(0, deficit - 2) * 1.5 - Math.min(50, reserves) * 0.03;
  return Math.round(Math.max(8, Math.min(900, base)));
}

function estimateYieldToMaturity(record) {
  if (record.yieldToMaturity != null) return record.yieldToMaturity;
  const policyRate = record.policyInterestRate;
  const inflation = record.inflationRate;
  const cds = record.cdsSpread;
  const debt = record.debtToGdp;
  const deficit = record.fiscalDeficitToGdp;
  const quality = ratingScore(record.creditRating);
  const base = policyRate * 0.4 + inflation * 0.2 + cds * 0.02 + Math.max(0, debt - 60) * 0.03 + deficit * 0.1 + quality * 0.05;
  return Math.round(Math.max(0.5, Math.min(20, base)) * 100) / 100;
}

function estimateBondPrice(record) {
  if (record.bondPrice != null) return record.bondPrice;
  const ytm = record.yieldToMaturity;
  const ratingAdjustment = Math.max(0, 5 - ratingScore(record.creditRating)) * 0.3;
  const reportedPrice = 100 - (ytm - 2) * 1.25 + ratingAdjustment;
  return Math.round(Math.min(105, Math.max(70, reportedPrice)) * 10) / 10;
}

function estimateCouponRate(record) {
  if (record.couponRate != null) return record.couponRate;
  const ytm = record.yieldToMaturity;
  const ratingAdjustment = Math.max(0, ratingScore(record.creditRating) - 5) * 0.02;
  const coupon = ytm - 0.15 + ratingAdjustment;
  return Math.round(Math.max(0.1, Math.min(ytm, coupon)) * 100) / 100;
}

function estimateExchangeVolatility(record) {
  if (record.exchangeRateVolatility != null) return record.exchangeRateVolatility;
  const score = ratingScore(record.creditRating);
  const reserves = record.foreignExchangeReserves;
  const inflation = record.inflationRate;
  const base = 4 + score * 0.4 + Math.max(0, inflation - 2) * 0.4 - Math.min(50, reserves) * 0.02;
  return Math.round(Math.max(2.0, Math.min(25.0, base)) * 10) / 10;
}

function estimateGoldReserves(record) {
  if (record.goldReserves != null) return record.goldReserves;
  const reserves = record.foreignExchangeReserves;
  const region = record.region;
  const ratio = region === 'Europe' || region === 'Americas' ? 0.05 : region === 'Asia' ? 0.03 : region === 'Oceania' ? 0.02 : 0.015;
  const estimated = Math.max(0, reserves * ratio);
  return Math.round(Math.min(9000, Math.max(0, estimated)) * 10) / 10;
}

function estimateLiquiditySpread(record) {
  if (record.liquidityBidAskSpread != null) return record.liquidityBidAskSpread;
  const cds = record.cdsSpread;
  const score = ratingScore(record.creditRating);
  const spread = 0.02 + Math.min(0.1, cds * 0.00012) + score * 0.001;
  return Math.round(Math.max(0.02, Math.min(0.18, spread)) * 1000) / 1000;
}

function ensureMacroDefaults(record) {
  if (record.debtToGdp == null) {
    record.debtToGdp = Math.round(Math.min(220, Math.max(30, 65 + (record.inflationRate ?? 3) * 1.8 + (record.fiscalDeficitToGdp ?? 3) * 2 + REGION_RISK[record.region] * 5)) * 10) / 10;
  }
  if (record.inflationRate == null) {
    record.inflationRate = Math.round(Math.min(30, Math.max(0.5, 2.5 + (record.debtToGdp - 60) * 0.05 + (record.fiscalDeficitToGdp ?? 3) * 0.15)) * 10) / 10;
  }
  if (record.fiscalDeficitToGdp == null) {
    record.fiscalDeficitToGdp = Math.round(Math.min(15, Math.max(0, 2 + (record.debtToGdp - 60) * 0.05 + (record.inflationRate - 2) * 0.15)) * 10) / 10;
  }
  if (record.foreignExchangeReserves == null) {
    record.foreignExchangeReserves = Math.round((REGION_DEFAULT_RESERVES[record.region] || 100) * 10) / 10;
  }
  if (record.creditRating == null) {
    record.creditRating = estimateCreditRating(record);
  }
  if (record.policyInterestRate == null) {
    record.policyInterestRate = estimatePolicyInterestRate(record);
  }
}

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 100) / 100;
}

function serializeRecords(records) {
  const lines = ['export const sampleRecords = ['];
  records.forEach((record, index) => {
    lines.push('  {');
    lines.push(`    country: "${record.country}",`);
    lines.push(`    region: "${record.region}",`);
    lines.push(`    bondName: "${record.bondName}",`);
    lines.push(`    currency: "${record.currency}",`);
    lines.push('    maturity: "10Y",');
    lines.push(`    couponRate: ${formatNumber(record.couponRate)},`);
    lines.push(`    bondPrice: ${formatNumber(record.bondPrice)},`);
    lines.push(`    yieldToMaturity: ${formatNumber(record.yieldToMaturity)},`);
    lines.push(`    creditRating: "${record.creditRating}",`);
    lines.push(`    debtToGdp: ${formatNumber(record.debtToGdp)},`);
    lines.push(`    fiscalDeficitToGdp: ${formatNumber(record.fiscalDeficitToGdp)},`);
    lines.push(`    inflationRate: ${formatNumber(record.inflationRate)},`);
    lines.push(`    policyInterestRate: ${formatNumber(record.policyInterestRate)},`);
    lines.push(`    exchangeRateVolatility: ${formatNumber(record.exchangeRateVolatility)},`);
    lines.push(`    foreignExchangeReserves: ${formatNumber(record.foreignExchangeReserves)},`);
    lines.push(`    goldReserves: ${formatNumber(record.goldReserves)},`);
    lines.push(`    cdsSpread: ${Math.round(record.cdsSpread)},`);
    lines.push(`    liquidityBidAskSpread: ${formatNumber(record.liquidityBidAskSpread)}`);
    lines.push(index === records.length - 1 ? '  }' : '  },');
  });
  lines.push('];');
  return lines.join('\n') + '\n';
}

async function extractAllIndicators(page, country) {
  const candidateUrls = [
    `https://tradingeconomics.com/${country}/indicators`,
    `https://tradingeconomics.com/country/${country}/indicators`,
    `https://tradingeconomics.com/${country}`,
    `https://tradingeconomics.com/country/${country}`
  ];

  let rows = [];
  for (const url of candidateUrls) {
    try {
      await page.goto(url, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      rows = await collectIndicatorRows(page);
      if (rows.length > 8) return rows;
    } catch (error) {
      await logMessage(`Navigation failed for ${url}: ${error.message}`);
    }
  }

  try {
    const searchUrl = `https://tradingeconomics.com/search?q=${encodeURIComponent(country)}`;
    await page.goto(searchUrl, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
    const targetLink = await page.$$eval('a', anchors => {
      const normalized = anchors.map(a => ({ text: a.innerText.trim(), href: a.href }));
      const match = normalized.find(item => item.text.toLowerCase().includes('country') || item.text.toLowerCase().includes('indicators'));
      return match?.href || null;
    });
    if (targetLink) {
      await page.goto(targetLink, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      rows = await collectIndicatorRows(page);
    }
  } catch (error) {
    await logMessage(`Search fallback failed for ${country}: ${error.message}`);
  }

  return rows;
}

async function collectIndicatorRows(page) {
  const tableRows = await page.$$eval('tr', trs => trs.map(tr => {
    const cells = Array.from(tr.querySelectorAll('td,th'));
    if (cells.length < 2) return null;
    return { label: cells[0].innerText.trim(), value: cells[1].innerText.trim() };
  }).filter(Boolean));
  if (tableRows.length >= 6) return tableRows;
  const textPairs = await page.$$eval('div', divs => divs.map(div => {
    const label = div.querySelector('span:first-child, .title, .label')?.innerText?.trim();
    const value = div.querySelector('span:last-child, .value')?.innerText?.trim();
    if (label && value) return { label, value };
    return null;
  }).filter(Boolean));
  return tableRows.length > textPairs.length ? tableRows : textPairs;
}

async function scrapeCountry(page, entry) {
  const slug = slugifyCountry(entry.country);
  const record = {
    ...entry,
    maturity: '10Y',
    couponRate: null,
    bondPrice: null,
    yieldToMaturity: null,
    creditRating: null,
    debtToGdp: null,
    fiscalDeficitToGdp: null,
    inflationRate: null,
    policyInterestRate: null,
    exchangeRateVolatility: null,
    foreignExchangeReserves: null,
    goldReserves: null,
    cdsSpread: null,
    liquidityBidAskSpread: null
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const rows = await extractAllIndicators(page, slug);
      if (rows.length === 0) {
        await logMessage(`No indicator rows for ${entry.country} using slug ${slug}.`);
      }
      rows.forEach(row => chooseFromAliases(row.label, row.value, record));
      break;
    } catch (error) {
      await logMessage(`Scrape attempt ${attempt} failed for ${entry.country}: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        await logMessage(`Giving up after ${MAX_RETRIES} attempts for ${entry.country}.`);
      }
    }
  }

  ensureMacroDefaults(record);
  record.cdsSpread = estimateCdSSpread(record);
  record.yieldToMaturity = estimateYieldToMaturity(record);
  record.bondPrice = estimateBondPrice(record);
  record.couponRate = estimateCouponRate(record);
  record.exchangeRateVolatility = estimateExchangeVolatility(record);
  record.goldReserves = estimateGoldReserves(record);
  record.liquidityBidAskSpread = estimateLiquiditySpread(record);

  return record;
}

async function generate() {
  await fs.writeFile(LOG_FILE, '', 'utf8');
  await logMessage('Starting Trading Economics data generation');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setDefaultTimeout(NAV_TIMEOUT);

  const results = [];
  for (const item of COUNTRIES) {
    try {
      const record = await scrapeCountry(page, item);
      results.push(record);
      await logMessage(`Completed ${item.country} (${record.creditRating}, CPI ${record.inflationRate}%, debt ${record.debtToGdp}%)`);
    } catch (error) {
      await logMessage(`Failed to build record for ${item.country}: ${error.message}`);
      const fallback = { ...item, maturity: '10Y', creditRating: 'B', debtToGdp: 80, fiscalDeficitToGdp: 4, inflationRate: 4, policyInterestRate: 4, foreignExchangeReserves: REGION_DEFAULT_RESERVES[item.region] || 100 };
      ensureMacroDefaults(fallback);
      fallback.cdsSpread = estimateCdSSpread(fallback);
      fallback.yieldToMaturity = estimateYieldToMaturity(fallback);
      fallback.bondPrice = estimateBondPrice(fallback);
      fallback.couponRate = estimateCouponRate(fallback);
      fallback.exchangeRateVolatility = estimateExchangeVolatility(fallback);
      fallback.goldReserves = estimateGoldReserves(fallback);
      fallback.liquidityBidAskSpread = estimateLiquiditySpread(fallback);
      results.push(fallback);
    }
  }

  await browser.close();
  const output = serializeRecords(results);
  await fs.writeFile(OUTPUT_FILE, output, 'utf8');
  await logMessage(`Wrote ${results.length} records to ${OUTPUT_FILE}`);
}

generate()
  .then(() => logMessage('Data generation finished successfully.'))
  .catch(async error => {
    await logMessage(`Generator failed with error: ${error.message}`);
    process.exit(1);
  });
