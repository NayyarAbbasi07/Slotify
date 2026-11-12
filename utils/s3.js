'use strict';

/** S3 pre-signed URL helpers — wire AWS SDK in media phase */
async function getUploadUrl(_key, _contentType) {
  throw new Error('S3 upload URL not configured yet');
}

module.exports = { getUploadUrl };
