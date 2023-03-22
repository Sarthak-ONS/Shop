const express = require('express');
const { check, body } = require('express-validator/check')

const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user')

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (!user) {
                    console.log('User yhi ni mila, route validator m');
                    return Promise.reject('No account found.')
                }
                return true;
            })
        })
    , body('password', 'Please enter atleast 5 chars and a alphanumeric password')
        .isLength({ min: 5 })
        //.isAlphanumeric()
    ,

], authController.postLogin);

router.post('/signup',
    [
        check('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please enter a valid Email')
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail already exists, Please login or use another mail.')
                    }
                    return true;
                })
            })
        ,
        body('password', 'Please enter atleast 5 chars and a alphanumeric password').trim()
            .isLength({ min: 5 })
        //.isAlphanumeric()
        ,
        body('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error(
                    'Passwords do not match'
                )
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/reset/:token', authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)

module.exports = router;