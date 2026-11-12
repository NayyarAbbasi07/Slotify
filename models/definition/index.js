const { sequelize } = require('../../common/databaseConnection');

const defineUser = require('./user');
const defineUserRole = require('./userRole');
const defineAuthIdentity = require('./authIdentity');
const defineSession = require('./session');
const defineBusiness = require('./business');
const defineAppointment = require('./appointment');
const definePlatformSetting = require('./platformSetting');

const models = {
  User: defineUser(sequelize),
  UserRole: defineUserRole(sequelize),
  AuthIdentity: defineAuthIdentity(sequelize),
  Session: defineSession(sequelize),
  Business: defineBusiness(sequelize),
  Appointment: defineAppointment(sequelize),
  PlatformSetting: definePlatformSetting(sequelize),
};

function applyAssociations() {
  const { User, UserRole, AuthIdentity, Session, Business, Appointment } = models;

  User.hasMany(UserRole, { foreignKey: 'user_id', as: 'roles' });
  UserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(AuthIdentity, { foreignKey: 'user_id', as: 'identities' });
  AuthIdentity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
  Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Business, { foreignKey: 'owner_user_id', as: 'businesses' });
  Business.belongsTo(User, { foreignKey: 'owner_user_id', as: 'owner' });

  User.hasMany(Appointment, { foreignKey: 'customer_id', as: 'appointments' });
  Appointment.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
  Business.hasMany(Appointment, { foreignKey: 'business_id', as: 'appointments' });
  Appointment.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
}

applyAssociations();

module.exports = {
  db: sequelize,
  models,
  sequelize,
};
