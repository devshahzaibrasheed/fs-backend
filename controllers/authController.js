const User = require("./../models/userModel");
const { googleStrategy } = require('./../modules/googleStrategy');
const crypto = require("crypto");
const Mailer = require("../utils/emails");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body
    console.log("Access Token", access_token)
    const googleResponse = await googleStrategy.validate(access_token)

    const {
      payload: { family_name, email, picture, given_name },
      userid,
    } = googleResponse

    const found = await User.findOne({email})

    if (found) {
      console.log("Already Signed Up")
      const token = signToken(found._id);
      res.status(200).json({
        message: "SignIn successful",
        token: token,
        user: found
      });
    }
    else{
      const user_body = {
        email: email,
        firstName: given_name,
        lastName: family_name,
        emailVerified: true,
        verificationToken: undefined,
        url: crypto.randomBytes(8).toString("hex"),
        image: picture
      }
      const user = new User(user_body)
      const token = signToken(user._id);
      await user.save({validateBeforeSave: false});

      res.status(200).json({
        message: "SignUp successful",
        token: token,
        user: user
      });
    }

  } catch (error) {
    // console.log(error)
    return res.status(422).json({
      error: error
    });
  }
};

exports.register = async (req, res) => {
  const user = new User(req.body);
  user.url = crypto.randomBytes(8).toString("hex");
  user.verificationToken = crypto.randomBytes(20).toString("hex");
  const token = signToken(user._id);

  try {
    await user.save();
    await Mailer.verificationEmail(user);

    res.status(201).json({
      message: "SignUp successful",
      token: token,
      user: user
    });
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.email === 1
    ) {
      return res.status(422).json({
        error: "Email already exist"
      });
    }

    return res.status(422).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide email and password!" });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (user && user.emailVerified === false){
      return res.status(400).json({ error: "Please verify your email before logging in!" });
    }

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ error: "Incorrect email or password!" });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      message: "Logged In Successfully",
      user,
      token
    });
  } catch (error) {
    return res.status(422).json({ error: error.message });
  }
};

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      currentUser.recentActivity.onlineAt = new Date();
      currentUser.save();
      req.user = currentUser;
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Token is not valid" });
    }
  }

  return res
    .status(401)
    .json({ error: "You are not logged in! Please log in to get access" });
};

exports.currentUser = async (req, res) => {
  res.status(200).json({user: req.user});
};

exports.verify = async (req, res, next) => {
  try {
    const { verification_token } = req.body;
    const user = await User.findOne({ verificationToken: verification_token });

    if (!user) {
      return res.status(404).json({message: "Token not valid"});
    }
 
    user.emailVerified = true;
    user.verificationToken = undefined
    await user.save()

    res.status(200).json({
      message: "Account verified successfully",
    });
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({error: 'User not found'})
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await Mailer.forgetPasswordEmail(user, email, resetToken);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    return res.status(422).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token
    }).select("+password");

    if (!user) {
      return res.status(404).json({ error: "Invalid reset token" });
    }

    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    if (await user.correctPassword(newPassword, user.password)) {
      return res
        .status(400)
        .json({ error: "New password can not be same as current password!" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    await user.save();
    await Mailer.resetPasswordEmail(user);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
};

exports.checkValidity = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      resetPasswordToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (user) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(404).json({ valid: false });
    }
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
};
