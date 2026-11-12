'use strict';

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../utils/errorHandlers/CustomError');

function notImplemented(name) {
  return async function stub() {
    throw new CustomError(`${name} not implemented yet`, StatusCodes.NOT_IMPLEMENTED);
  };
}

module.exports = {
  userService: {
    getMe: notImplemented('userService.getMe'),
    updateMe: notImplemented('userService.updateMe'),
    deleteAccount: notImplemented('userService.deleteAccount'),
  },
  businessService: {
    addBusiness: notImplemented('businessService.addBusiness'),
    getBusinessById: notImplemented('businessService.getBusinessById'),
  },
  staffService: { addStaff: notImplemented('staffService.addStaff') },
  catalogService: { getCategories: notImplemented('catalogService.getCategories') },
  serviceItemService: { addService: notImplemented('serviceItemService.addService') },
  availabilityService: { getSlots: notImplemented('availabilityService.getSlots') },
  appointmentService: {
    createAppointment: notImplemented('appointmentService.createAppointment'),
    transition: notImplemented('appointmentService.transition'),
  },
  mediaService: { getUploadUrl: notImplemented('mediaService.getUploadUrl') },
  favouriteService: { addFavourite: notImplemented('favouriteService.addFavourite') },
  searchService: { searchBusinesses: notImplemented('searchService.searchBusinesses') },
  reviewService: { addReview: notImplemented('reviewService.addReview') },
  paymentService: { createPaymentIntent: notImplemented('paymentService.createPaymentIntent') },
  walletService: { getWallet: notImplemented('walletService.getWallet') },
  payoutService: { getPayouts: notImplemented('payoutService.getPayouts') },
  loyaltyService: { getLoyalty: notImplemented('loyaltyService.getLoyalty') },
  voucherService: { validateVoucher: notImplemented('voucherService.validateVoucher') },
  featuredService: { getFeaturedPlans: notImplemented('featuredService.getFeaturedPlans') },
  referralService: { getMyReferral: notImplemented('referralService.getMyReferral') },
  chatService: { getMessages: notImplemented('chatService.getMessages') },
  notificationService: {
    getMyNotifications: notImplemented('notificationService.getMyNotifications'),
  },
  disputeService: { addDispute: notImplemented('disputeService.addDispute') },
  adminService: { getDashboardCounts: notImplemented('adminService.getDashboardCounts') },
};
