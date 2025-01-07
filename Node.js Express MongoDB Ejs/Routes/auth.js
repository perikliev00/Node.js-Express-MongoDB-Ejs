const express=require('express');
const { check,body } = require('express-validator');
const router=express.Router();
const authController = require('../controllers/auth');
const User = require('../models/user');
const bcrypt = require('bcryptjs')

router.get('/login' ,authController.getLogin);

router.get('/signup' , authController.getSignup);

router.post('/login' , [
    body('email','Email or password is incorect')
    .isEmail()
    .normalizeEmail()
    .custom((value , { req }) => {
        return User.findOne( {email:value} )
        .then(userDoc => {
            if(!userDoc) {
            return Promise.reject('E-Mail is not correct ,please  a different one.')
            }
            // return userDoc
    })
    }),
    body('password', 'Wrong password')
    .notEmpty()
    .trim()
    .custom((value, {req}) => {
        return User.findOne( {email:req.body.email} )
        .then(userDoc => {
            if(!userDoc) {
            return Promise.reject('E-Mail or password is not correct ,please  a different one.')
            }
             return bcrypt
                 .compare(req.body.password, userDoc.password)
                 .then(doMatch => {
                     if(!doMatch) {
                         return Promise.reject('Password is not correct.')
                     }
                 })
    }) 
}),
    body('confirmPassword','Password field is empthy')
    .notEmpty()
    .custom((value , { req }) => {
        if(value !== req.body.password) {
            throw new Error('Password dont match')
        }
        return true
    })
] ,authController.postLogin);

router.post('/signup', 
    [check('email','Please enter valid email.')
        .isEmail()
        .withMessage('Please enter valid email.')
        .custom((value, { req })=> {
        return User.findOne( {email:value} )
        .then(userDoc => {
            if(userDoc) {
            return Promise.reject('E-Mail exists alredy, please pick a different one.')
            }
    })
})
    ,
    body(
        'password',
        'Please enter a password with only numbers and text and at least 5 charectars'
    )
    .isLength({min:5})
    .isAlphanumeric()
    ,
    body('confirmPassword')
    .custom((value, { req }) => {
        console.log(value);
        console.log(req.body.password)
        if(value !== req.body.password) {
            throw new Error('Passwords have to match.');
        }
        return true
    })   
],authController.postSignup)

router.post('/logout' ,authController.postLogout);

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports=router;