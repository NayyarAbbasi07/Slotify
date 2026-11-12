/**
 * @openapi
 * components:
 *   schemas:
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         tokenType:
 *           type: string
 *           example: Bearer
 *         expiresIn:
 *           type: string
 *           example: 15m
 *     AuthUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+923001234567"
 *         email:
 *           type: string
 *           nullable: true
 *         name:
 *           type: string
 *           nullable: true
 *         avatar_url:
 *           type: string
 *           nullable: true
 *         gender:
 *           type: string
 *           nullable: true
 *           enum: [male, female, other, null]
 *         locale:
 *           type: string
 *           enum: [en, ur]
 *         status:
 *           type: string
 *           example: ACTIVE
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [CUSTOMER, PARTNER_OWNER, STAFF, ADMIN, SUPPORT, FINANCE]
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: object
 *
 * /api/requestOtp:
 *   post:
 *     tags: [Auth]
 *     summary: Request phone OTP
 *     description: Sends a 6-digit OTP to a Pakistan mobile number (+92). Max 3 sends per phone / 15 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 pattern: "^\\+923[0-9]{9}$"
 *                 example: "+923001234567"
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               deviceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Invalid phone
 *       429:
 *         description: Rate limit exceeded
 *
 * /api/signupUser:
 *   post:
 *     tags: [Auth]
 *     summary: Signup with phone OTP
 *     description: Creates a new customer or partner account after OTP verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+923001234567"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: "Ali Khan"
 *               email:
 *                 type: string
 *                 format: email
 *               locale:
 *                 type: string
 *                 enum: [en, ur]
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, PARTNER_OWNER]
 *                 default: CUSTOMER
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               deviceId:
 *                 type: string
 *                 format: uuid
 *               appVersion:
 *                 type: string
 *                 example: "1.0.0"
 *     responses:
 *       201:
 *         description: Signup successful — returns user and tokens
 *       400:
 *         description: Validation or OTP error
 *       409:
 *         description: Phone or email already registered
 *
 * /api/loginUser:
 *   post:
 *     tags: [Auth]
 *     summary: Login with phone OTP
 *     description: Authenticates an existing user with phone OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+923001234567"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               deviceId:
 *                 type: string
 *                 format: uuid
 *               appVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful — returns user and tokens
 *       400:
 *         description: Invalid OTP
 *       403:
 *         description: Account blocked or deleted
 *       404:
 *         description: Account not found
 *
 * /api/googleLogin:
 *   post:
 *     tags: [Auth]
 *     summary: Signup or login with Google
 *     description: Verifies Google ID token. Creates account on first use; logs in if identity exists.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, PARTNER_OWNER]
 *                 default: CUSTOMER
 *               locale:
 *                 type: string
 *                 enum: [en, ur]
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               deviceId:
 *                 type: string
 *                 format: uuid
 *               appVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google auth successful
 *       401:
 *         description: Invalid Google token
 *       503:
 *         description: Google Sign-In not configured
 *
 * /api/refreshToken:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Rotates refresh token and issues a new access + refresh pair.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               deviceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Invalid or reused refresh token
 *
 * /api/logoutUser:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current session
 *     description: Revokes the session associated with the refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Invalid refresh token
 *
 * /api/logoutAll:
 *   post:
 *     tags: [Auth]
 *     summary: Logout all devices
 *     description: Revokes every active session for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       401:
 *         description: Missing or invalid access token
 */
module.exports = {};
