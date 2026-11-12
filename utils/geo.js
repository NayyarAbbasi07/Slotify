'use strict';

/** PostGIS helpers — implement raw SQL in searchService */
function buildPoint(lng, lat) {
  return { type: 'Point', coordinates: [Number(lng), Number(lat)] };
}

module.exports = { buildPoint };
