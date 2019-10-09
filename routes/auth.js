const express = require('express');

const { check, body } = require('express-validator');

const router = express.Router();

const authController = require('../controllers/auth');

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.post('/login', [
    body('email').isEmail().withMessage('Please Enter a Valid Email'),

    body('password', 'Password must be within 8-15 characters and must be alphanumeric') //can also be done with check
    .isLength({ min: 8, max: 15 })
    .isAlphanumeric()
    .trim(),
], authController.postLogin);

router.get('/signup', authController.getSignUp);

router.post(
    '/signup', [
        check('email')
        .isEmail()
        .withMessage('Please Enter a valid email')
        .normalizeEmail()
        .custom((value, { req }) => { //Async Validation
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('A user with this email already exists.Kindly a different email address and try again!!!');
                    }
                })
        }),

        body('password', 'Password must be within 8-15 characters and must be alphanumeric') //can also be done with check
        .isLength({ min: 8, max: 15 })
        .isAlphanumeric()
        .trim(),

        body('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords are not the same. Re-Enter!!');
            }
            return true;
        })
    ],
    authController.postSignUp
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;