const { DataTypes } = require('sequelize');
const { withBaseFields } = require('./base');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    withBaseFields({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      locale: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'en',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Admin users only',
      },
    }),
    {
      tableName: 'users',
    }
  );

  return User;
};
