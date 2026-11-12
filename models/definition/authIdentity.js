const { DataTypes } = require('sequelize');
const { withBaseFields } = require('./base');

module.exports = (sequelize) => {
  const AuthIdentity = sequelize.define(
    'AuthIdentity',
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
      provider: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'phone | google | apple',
      },
      provider_user_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    }),
    {
      tableName: 'auth_identities',
      indexes: [
        {
          unique: true,
          fields: ['provider', 'provider_user_id'],
        },
      ],
    }
  );

  return AuthIdentity;
};
