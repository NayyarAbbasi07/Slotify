const { DataTypes } = require('sequelize');
const { withBaseFields } = require('./base');
const { RoleAuthorizationTypes } = require('../../common/enumFunction');

module.exports = (sequelize) => {
  const UserRole = sequelize.define(
    'UserRole',
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
      role: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: RoleAuthorizationTypes.Customer,
      },
    }),
    {
      tableName: 'user_roles',
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'role'],
        },
      ],
    }
  );

  return UserRole;
};
