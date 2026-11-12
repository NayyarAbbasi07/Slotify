const { DataTypes } = require('sequelize');
const { withBaseFields } = require('./base');
const { BusinessType, BusinessStatus } = require('../../common/enumFunction');

module.exports = (sequelize) => {
  const Business = sequelize.define(
    'Business',
    withBaseFields({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      owner_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: BusinessType.Barber,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(220),
        allowNull: true,
        unique: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      area: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      timezone: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: 'Asia/Karachi',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: BusinessStatus.Draft,
      },
      rating_avg: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
      },
      rating_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_featured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      commission_rate_bps: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    }),
    {
      tableName: 'businesses',
    }
  );

  return Business;
};
