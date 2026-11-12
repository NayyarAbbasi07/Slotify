'use strict';

const config = require('../config.json');

/** Paisa helpers — never use floats for money */
function toPaisa(rupees) {
  return Math.round(Number(rupees) * 100);
}

function fromPaisa(paisa) {
  return Number(paisa) / 100;
}

function formatPkr(paisa) {
  const amount = fromPaisa(paisa);
  return `PKR ${amount.toFixed(2)}`;
}

function currencyCode() {
  return config.currency || 'PKR';
}

module.exports = {
  toPaisa,
  fromPaisa,
  formatPkr,
  currencyCode,
};
