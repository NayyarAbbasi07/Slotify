const { DataTypes } = require('sequelize');
const { withBaseFields } = require('./base');
const { AppointmentStatus, BookingType, PaymentMethod, PaymentStatus } = require('../../common/enumFunction');

module.exports = (sequelize) => {
  const Appointment = sequelize.define(
    'Appointment',
    withBaseFields({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      business_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      staff_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: BookingType.Standard,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: AppointmentStatus.Requested,
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      blocked_start_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      blocked_end_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'paisa',
      },
      fees: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      discount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      total: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      commission_rate_bps: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 500,
      },
      commission_amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      payment_method: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: PaymentMethod.Cash,
      },
      payment_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: PaymentStatus.Initiated,
      },
      customer_note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancel_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancelled_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      idempotency_key: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
    }),
    {
      tableName: 'appointments',
    }
  );

  return Appointment;
};
