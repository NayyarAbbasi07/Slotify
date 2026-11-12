require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDatabase, sequelize } = require('../common/databaseConnection');
const { models } = require('../models/definition');
const { RoleAuthorizationTypes } = require('../common/enumFunction');

const { User, UserRole, AuthIdentity } = models;

const FULL_ACCESS_ROLES = [
  RoleAuthorizationTypes.Admin,
  RoleAuthorizationTypes.Support,
  RoleAuthorizationTypes.Finance,
  RoleAuthorizationTypes.Customer,
  RoleAuthorizationTypes.PartnerOwner,
];

(async () => {
  try {
    await connectDatabase();

    // All values come from the environment. Nothing is hard-coded here.
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const name = (process.env.ADMIN_NAME || 'Admin').trim();
    const tempPassword = process.env.ADMIN_TEMP_PASSWORD || '';
    if (!email || tempPassword.length < 12) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_TEMP_PASSWORD (min 12 characters) in the environment.');
    }
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({
        name,
        status: 'ACTIVE',
        password_hash: passwordHash,
      });
      console.log('Updated existing user:', user.id);
    } else {
      user = await User.create({
        name,
        email,
        status: 'ACTIVE',
        locale: 'en',
        password_hash: passwordHash,
      });
      console.log('Created user:', user.id);
    }

    for (const role of FULL_ACCESS_ROLES) {
      const existing = await UserRole.findOne({
        where: { user_id: user.id, role },
      });
      if (!existing) {
        await UserRole.create({
          user_id: user.id,
          role,
          created_by: user.id,
        });
      }
    }

    // Link email identity for future Google / email login
    const identity = await AuthIdentity.findOne({
      where: { provider: 'email', provider_user_id: email },
    });
    if (!identity) {
      await AuthIdentity.create({
        user_id: user.id,
        provider: 'email',
        provider_user_id: email,
        email,
        created_by: user.id,
      });
    }

    const roles = await UserRole.findAll({ where: { user_id: user.id } });

    console.log('\n--- User ready ---');
    console.log('id:', user.id);
    console.log('name:', user.name);
    console.log('email:', user.email);
    console.log('roles:', roles.map((r) => r.role).join(', '));
    console.log('temp password: set from ADMIN_TEMP_PASSWORD (not printed)');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
