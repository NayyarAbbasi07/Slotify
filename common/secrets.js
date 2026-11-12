'use strict';

/**
 * Secrets are read from environment variables only (.env locally, real env vars in deploys).
 * config.json must never contain secrets.
 */

const PLACEHOLDER_PREFIX = 'change-me';
const MIN_JWT_SECRET_LENGTH = 32;

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

function requireJwtSecret(name) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env (see .env.example).`);
  }
  if (value.toLowerCase().startsWith(PLACEHOLDER_PREFIX)) {
    throw new Error(`${name} is still a placeholder. Replace it with a random value (see .env.example).`);
  }
  if (value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_JWT_SECRET_LENGTH} characters.`);
  }
  return value;
}

function getJwtAccessSecret() {
  return requireJwtSecret('JWT_ACCESS_SECRET');
}

function getJwtRefreshSecret() {
  return requireJwtSecret('JWT_REFRESH_SECRET');
}

/** Called at process start (bin/www, bin/worker). Throws with every missing or invalid value listed. */
function assertRequiredSecrets() {
  const problems = [];

  for (const getter of [getJwtAccessSecret, getJwtRefreshSecret]) {
    try {
      getter();
    } catch (err) {
      problems.push(err.message);
    }
  }

  if (!readEnv('DB_PASSWORD')) {
    problems.push('DB_PASSWORD is not set. Add it to .env (see .env.example).');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }
}

module.exports = {
  getJwtAccessSecret,
  getJwtRefreshSecret,
  assertRequiredSecrets,
};
