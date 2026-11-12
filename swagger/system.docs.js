/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Liveness probe
 *     responses:
 *       200:
 *         description: OK
 * /api/ready:
 *   get:
 *     tags: [System]
 *     summary: Readiness probe (DB)
 *     responses:
 *       200:
 *         description: Ready
 * /api/getAppConfig:
 *   get:
 *     tags: [System]
 *     summary: App min versions and feature flags
 *     responses:
 *       200:
 *         description: Config
 */
module.exports = {};
