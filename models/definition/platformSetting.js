const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlatformSetting = sequelize.define(
    'PlatformSetting',
    {
      key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'platform_settings',
      paranoid: false,
      underscored: true,
    }
  );

  return PlatformSetting;
};
