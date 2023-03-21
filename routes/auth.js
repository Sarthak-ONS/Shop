const express = require('express');
const { check, body } = require('express-validator/check')

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid Email'),
        body('password', 'Please enter atleast 5 chars and a alphanumeric password')
            .isLength({ min: 5 })
        ,
        body('confirmPassword').custom((value, { req }) => {
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