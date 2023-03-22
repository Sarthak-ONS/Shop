const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const { body } = require('express-validator/check')

const router = express.Router();

const isAuth = require('../middleware/is-auth')

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    body('title').isString().isLength({ min: 5 }).trim(),
    body('price').isFloat({ max: 99999 }),
    body('description').isLength({ min: 10, max: 150 }).trim()

], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title', 'Please enter a vallid title').isString().isLength({ min: 5 }).trim(),
    body('price').isFloat({ max: 99999 }).withMessage('Price should me max of $99999'),
    body('description').isLength({ min: 10, max: 150 }).withMessage('Description must be between 10 and 150 chars').trim()

], isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
