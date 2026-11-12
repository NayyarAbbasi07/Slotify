const { DataTypes } = require('sequelize');
const { withBaseFields } = require('./base');

module.exports = (sequelize) => {
  const Session = sequelize.define(
    'Session',
    withBaseFields({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      device_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      refresh_token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    }),
    {
      tableName: 'sessions',
    }
  );

  return Session;
};
