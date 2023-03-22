const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');
const crypto = require('crypto');

const transporter = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}))

exports.getLogin = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  console.log(req.flash('error'));
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInputs: { email: '', password: '' },
    validationErrors: []
  });
};



exports.getSignup = (req, res, next) => {

  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: { email: "", password: "", confirmPassword: "" },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      oldInputs: { email, password }
    });
  }
  User.findOne({ email })
    .then(user => {
      bcrypt.compare(password, user.password).then(
        doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/')
            })

          }
          req.flash('error', 'Invalid email or Password')
          return res.redirect('/login')
        }
      )
        .catch(err => {
          console.log(err);
          res.redirect('/login')
        })
    })
    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
};

exports.postSignup = (req, res, next) => {

  const { email, password, confirmPassword } = req.body;

  const errors = validationResult(req);

  console.log(errors.array());

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      validationErrors: errors.array()
    });
  }


  if (!email | !password) {
    req.flash('error', 'Invalid Credentials')
    return res.redirect('/signup')
  }

  return bcrypt.hash(password, 12).then(hashedPassword => {
    const user = new User({
      email, password: hashedPassword, cart: {
        items: []
      }
    })
    return user.save();
  })
    .then(result => {
      res.redirect('/login')
      return transporter.sendMail({
        to: email,
        from: 'herculesproject7@gmail.com',
        subject: 'Successfully registered in Shop',
        html: '<h1>You signed up successfully.'
      })
    })

    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {

  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  })
};

exports.postReset = (req, res, next) => {

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset')
    }

    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save()
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'herculesproject7@gmail.com',
          subject: 'Password Reset',
          html: `
          <p>You requested a password reset</p>
          <p>Click the link below to set a new password</p>

          <br>
          <br>

          <a href="http://localhost:3000/reset/${token}">Click to Reset</a>
          `
        })
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  })
};

exports.getNewPassword = (req, res, next) => {

  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      let message = req.flash('error')
      if (message.length > 0) {
        message = message[0]
      } else {
        message = null
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
        name: user.name,
        email: user.email,
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.postNewPassword = (req, res, next) => {
  const { password, userId, passwordToken } = req.body;

  console.log(req.body.password, req.body.userId, req.body.passwordToken);

  let resetUser

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user
      return bcrypt.hash(password, 12)
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetTokenExpiration = undefined;
      return resetUser.save()
    })
    .then(result => {
      transporter.sendMail({
        to: resetUser.email,
        from: 'herculesproject7@gmail.com',
        subject: 'Password Reset Successfully',
        html: `
        <p>${resetUser.name}</p>
        <br> you have changed your password!
        <br>
        `
      })
      return res.redirect('/login')


    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
