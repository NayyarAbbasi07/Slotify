'use strict';

function excludeAttributes(extra = []) {
  return ['deleted_at', 'deleted_by', ...extra];
}

module.exports = { excludeAttributes };
