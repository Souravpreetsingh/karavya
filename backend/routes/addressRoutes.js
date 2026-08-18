'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { idParam, addressSchema } = require('../validators/schemas');
const AddressService = require('../services/addressService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => ok(res, { addresses: AddressService.list(req.session.userId) }));

router.post('/', validate(addressSchema), (req, res, next) => {
  try {
    return ok(res, { address: AddressService.create(req.session.userId, req.validated) }, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(idParam, 'params'), validate(addressSchema), (req, res, next) => {
  try {
    return ok(res, { address: AddressService.update(req.session.userId, req.params.id, req.validated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', validate(idParam, 'params'), (req, res, next) => {
  try {
    AddressService.remove(req.session.userId, req.params.id);
    return ok(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/default', validate(idParam, 'params'), (req, res, next) => {
  try {
    AddressService.setDefault(req.session.userId, req.params.id);
    return ok(res, { addresses: AddressService.list(req.session.userId) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;