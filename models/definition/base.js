const { DataTypes } = require('sequelize');

function withBaseFields(fields = {}) {
  return {
    ...fields,
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  };
}

module.exports = { withBaseFields };
