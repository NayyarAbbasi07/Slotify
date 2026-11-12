'use strict';

const RoleAuthorizationTypes = Object.freeze({
  Customer: 'CUSTOMER',
  PartnerOwner: 'PARTNER_OWNER',
  Staff: 'STAFF',
  Admin: 'ADMIN',
  Support: 'SUPPORT',
  Finance: 'FINANCE',
});

const AppointmentStatus = Object.freeze({
  PendingPayment: 'PENDING_PAYMENT',
  Requested: 'REQUESTED',
  Accepted: 'ACCEPTED',
  Declined: 'DECLINED',
  Expired: 'EXPIRED',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  NoShow: 'NO_SHOW',
});

const BookingType = Object.freeze({
  Standard: 'STANDARD',
  Home: 'HOME',
  Urgent: 'URGENT',
  Event: 'EVENT',
});

const BusinessType = Object.freeze({
  Barber: 'BARBER',
  Salon: 'SALON',
});

const BusinessStatus = Object.freeze({
  Draft: 'DRAFT',
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Suspended: 'SUSPENDED',
});

const PaymentMethod = Object.freeze({
  Cash: 'CASH',
  Online: 'ONLINE',
});

const PaymentStatus = Object.freeze({
  Initiated: 'INITIATED',
  Succeeded: 'SUCCEEDED',
  Failed: 'FAILED',
  Refunded: 'REFUNDED',
});

module.exports = {
  RoleAuthorizationTypes,
  AppointmentStatus,
  BookingType,
  BusinessType,
  BusinessStatus,
  PaymentMethod,
  PaymentStatus,
};
