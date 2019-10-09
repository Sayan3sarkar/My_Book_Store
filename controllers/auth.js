const crypto = require('crypto');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}))

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[0]; //set cookie
    let errorMessage = req.flash('error');
    let successMessage = req.flash('success');
    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }
    if (successMessage.length > 0) {
        successMessage = successMessage[0];
    } else {
        successMessage = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errorMessage,
        successMessage: successMessage,
        oldInput: { email: '', password: '' },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    let successMessage = req.flash('success');

    if (successMessage.length > 0) {
        successMessage = successMessage[0];
    } else {
        successMessage = null;
    }

    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            successMessage: successMessage,
            oldInput: { email: email, password: password },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                //req.flash('error', 'Invalid Credentials.Kindly check your email/password and try again!!!');
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid Credentials.Kindly check your email/password and try again!!!', //errors.array()[0].msg,
                    successMessage: '',
                    oldInput: { email: email, password: password },
                    validationErrors: [] //errors.array()
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            //console.log(err);
                            req.flash('success', 'You have successfully logged in');
                            res.redirect('/');
                        });
                    }
                    //req.flash('error', 'Invalid Credentials.Kindly check your email/password and try again!!!');
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid Credentials.Kindly check your email/password and try again!!!', //errors.array()[0].msg,
                        successMessage: '',
                        oldInput: { email: email, password: password },
                        validationErrors: [] //errors.array()
                    });
                    //res.redirect('/login');
                })
                .catch(err => { //res.redirect('/500')
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch(err => console.log(err));
};

exports.getSignUp = (req, res, next) => {
    let errorMessage = req.flash('error');

    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Sign Up',
        errorMessage: errorMessage,
        oldInput: { email: '', password: '', confirmPassword: '' },
        validationErrors: []
    });
}

exports.postSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Sign Up',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password, confirmPassword: confirmPassword },
            validationErrors: errors.array()
        });
    }
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            req.flash('success', 'Registration Successful!! You can proceed to Login');
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'shop@book-store.com',
                subject: 'Welcome To Node Book store',
                html: '<h1>Congrats, you\'ve successfully registered!!! Check out all the various books we have!!</h1>'
            });
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        //console.log(err);
        //req.flash('success', 'Logged Out Succesfully');
        res.redirect('/login');
    });
};

exports.getReset = (req, res, next) => {
    let errorMessage = req.flash('error');

    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: errorMessage
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Error in Resetting password. Please try again.');
            res.redirect('/login');
        } else {
            const token = buffer.toString('hex');
            User.findOne({ email: req.body.email })
                .then(user => {
                    if (!user) {
                        req.flash('error', 'A user with this email already exists.Kindly a different email address and try again!!!');
                        return res.redirect('/reset');
                    }
                    user.resetToken = token;
                    user.resetTokenExpiration = Date.now() + 3600000; //Expires in 1hr
                    return user.save();
                })
                .then(result => {
                    res.redirect('/');
                    transporter.sendMail({
                        to: req.body.email,
                        from: 'shop@book-store-node.com',
                        subject: 'Password Reset',
                        html: `
                            <p>Your password reset <a href="http://localhost:3000/reset/${token}">link</a>. Please Click it to reset your password!!</p>
                            <p><h3>Note: This Link is valid for 1 hour only</h3></p>
                        `
                    });
                })
                .catch(err => { //res.redirect('/500')
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        }
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }) //Checking for token matching and expirationTime greater than current time
        .then(user => {
            let errorMessage = req.flash('error');
            if (errorMessage.length > 0) {
                errorMessage = errorMessage[0];
            } else {
                errorMessage = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: errorMessage,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            req.flash('success', 'Password Reset Successful. Kindly login with your new password');
            res.redirect('/login');
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}