const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

// Properties
const propRouter = express.Router();
const pc = require('../controllers/propertyController');
propRouter.get('/', authenticate, pc.getProperties);
propRouter.get('/public', pc.publicGetProperties); // Marketplace
propRouter.get('/:id', authenticate, pc.getProperty);
propRouter.post('/', authenticate, authorize('landlord', 'admin'), pc.createProperty);
propRouter.put('/:id', authenticate, authorize('landlord', 'admin'), pc.updateProperty);
propRouter.put('/:id/approve', authenticate, authorize('admin'), pc.approveProperty);
propRouter.put('/:id/reject', authenticate, authorize('admin'), pc.rejectProperty);
propRouter.put('/:id/blacklist', authenticate, authorize('admin'), pc.blacklistProperty);
propRouter.delete('/:id', authenticate, authorize('admin'), pc.deleteProperty);



// Units
const unitRouter = express.Router();
const uc = require('../controllers/unitController');
unitRouter.get('/', authenticate, uc.getUnits);
unitRouter.get('/:id', authenticate, uc.getUnit);
unitRouter.post('/', authenticate, authorize('landlord', 'admin'), uc.createUnit);
unitRouter.put('/:id', authenticate, authorize('landlord', 'admin'), uc.updateUnit);
unitRouter.delete('/:id', authenticate, authorize('admin'), uc.deleteUnit);

// Leases
const leaseRouter = express.Router();
const lc = require('../controllers/leaseController');
leaseRouter.get('/', authenticate, lc.getLeases);
leaseRouter.get('/:id', authenticate, lc.getLease);
leaseRouter.post('/', authenticate, authorize('landlord', 'admin'), lc.createLease);
leaseRouter.put('/:id/terminate', authenticate, authorize('landlord', 'admin'), lc.terminateLease);

// Payments
const payRouter = express.Router();
const payc = require('../controllers/paymentController');
payRouter.get('/', authenticate, payc.getPayments);
payRouter.get('/summary', authenticate, payc.getPaymentSummary);
payRouter.get('/arrears', authenticate, payc.getArrears);
payRouter.post('/', authenticate, authorize('landlord', 'admin'), payc.createPayment);

// Maintenance
const maintRouter = express.Router();
const mc = require('../controllers/maintenanceController');
maintRouter.get('/', authenticate, mc.getRequests);
maintRouter.get('/stats', authenticate, mc.getStats);
maintRouter.post('/', authenticate, mc.createRequest);
maintRouter.put('/:id', authenticate, authorize('landlord', 'admin'), mc.updateRequest);

// Dashboard
const dashRouter = express.Router();
const dc = require('../controllers/dashboardController');
dashRouter.get('/', authenticate, dc.getDashboard);

// Users
const userRouter = express.Router();
const uc_user = require('../controllers/userController');
userRouter.get('/', authenticate, uc_user.getUsers);
userRouter.get('/:id', authenticate, uc_user.getUser);
userRouter.put('/:id', authenticate, uc_user.updateUser);
userRouter.put('/landlord/:id/approve', authenticate, authorize('admin'), uc_user.approveLandlord);
userRouter.put('/landlord/:id/blacklist', authenticate, authorize('admin'), uc_user.blacklistLandlord);
userRouter.delete('/:id', authenticate, authorize('admin'), uc_user.deleteUser);


// Reviews
const reviewRouter = express.Router();
const revc = require('../controllers/reviewController');
reviewRouter.get('/:propertyId', revc.getPropertyReviews);
reviewRouter.post('/', authenticate, authorize('tenant'), revc.createReview);
reviewRouter.delete('/:id', authenticate, authorize('admin'), revc.deleteReview);


// Lease Requests
const leaseReqRouter = express.Router();
const lrc = require('../controllers/leaseRequestController');
leaseReqRouter.get('/', authenticate, lrc.getLeaseRequests);
leaseReqRouter.post('/', authenticate, authorize('tenant'), lrc.createLeaseRequest);
leaseReqRouter.put('/:id/status', authenticate, authorize('landlord', 'admin'), lrc.updateLeaseRequestStatus);

// Complaints
const complaintRouter = express.Router();
const compc = require('../controllers/complaintController');
complaintRouter.get('/', authenticate, compc.getComplaints);
complaintRouter.post('/', authenticate, authorize('tenant'), compc.createComplaint);
complaintRouter.put('/:id/resolve', authenticate, authorize('admin', 'landlord'), compc.resolveComplaint);

// Relocation
const relocationRouter = express.Router();
const relc = require('../controllers/relocationController');
relocationRouter.get('/', authenticate, relc.getRelocations);
relocationRouter.post('/', authenticate, authorize('tenant'), relc.createRelocationRequest);
relocationRouter.put('/:id/status', authenticate, authorize('landlord', 'admin'), relc.updateRelocationStatus);

module.exports = { propRouter, unitRouter, leaseRouter, payRouter, maintRouter, dashRouter, userRouter, reviewRouter, leaseReqRouter, complaintRouter, relocationRouter };


