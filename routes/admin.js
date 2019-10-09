const path = require('path');

const express = require('express');

const { body } = require('express-validator');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

//admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', [
        body('title').isString().isLength({ min: 3, max: 50 }).trim().withMessage('Title must be within 3-50 characters'),
        body('price').isFloat().withMessage('Price Must be numeric'),
        body('description').isLength({ min: 3, max: 400 }).trim().withMessage('Description must be within 3-400 characters'),
    ],
    isAuth, adminController.postAddProduct);

// // /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
        body('title').isString().isLength({ min: 3, max: 50 }).trim().withMessage('Title must be within 3-50 characters'),
        body('price').isFloat().withMessage('Price Must be numeric'),
        body('description').isLength({ min: 3, max: 400 }).trim().withMessage('Description must be within 3-400 characters'),
    ],
    isAuth, adminController.postEditProduct);

//router.delete('/product/:productId', isAuth, adminController.deleteProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;