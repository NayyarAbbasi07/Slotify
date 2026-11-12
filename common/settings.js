'use strict';

/**
 * In-memory settings cache placeholder.
 * Load from platform_settings table once that model is wired.
 */
let cache = {
  commission_bps: 500,
  slot_interval_min: 15,
  standard_response_sla_min: 30,
  urgent_response_sla_min: 10,
  payment_window_min: 15,
  cancel_free_hours: 3,
  reliability_start: 100,
};

async function loadSettings() {
  return { ...cache };
}

async function getSetting(key, fallback = null) {
  if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
  return fallback;
}

function setSettingsLocal(partial) {
  cache = { ...cache, ...partial };
}

module.exports = {
  loadSettings,
  getSetting,
  setSettingsLocal,
};
