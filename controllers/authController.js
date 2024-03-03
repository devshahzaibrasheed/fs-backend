const User = require("./../models/userModel");
const Follow = require("./../models/followModel");
const { googleStrategy } = require('./../modules/googleStrategy');
const crypto = require("crypto");
const Mailer = require("../utils/emails");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const catchAsync = require('./../utils/catchAsync')
const { stringify } = require("querystring");
const axios = require('axios');


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
        image: picture,
        password: ""
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
  user.joinedDate = new Date();
  user.displayName = `${user.firstName} ${user.lastName}`
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

    if (user && user.userStatus === 'banned'){
      return res.status(400).json({ error: "You account is temporarily banned!" });
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
      const currentUser = await User.findById(decoded.id).select("+password");

      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      await User.findOneAndUpdate(
        { _id: currentUser._id },
        { "recentActivity.onlineAt": new Date() }
      );

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
  const user = req.user;

  //number of followers
  const followers_count = await Follow.countDocuments({
    following: user._id
  });

  //number of followings
  const followings_count = await Follow.countDocuments({
    follower: user._id
  });

  const modifiedUser = {
    ...user.toObject(),
    followers_count,
    followings_count
  };

  res.status(200).json({user: modifiedUser});
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

exports.updatePassword = async (req, res) => {
  const user = req.user;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!(await user.correctPassword(currentPassword, user.password))) {
      res.status(400).json({ error: "Current Password is incorrect" });
    } else if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "New Password and Confirm Password fields must match" });
    } else if (currentPassword === newPassword) {
      res.status(400).json({ error: "New password must be different from current password" });
    } else {
      user.password = newPassword;
      await user.save();
      const token = signToken(user._id);
      res.status(200).json({ message: "Your password was successfully updated", token });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.facebookLoginUrl = (req, res,) => {
  const stringifiedParams = stringify({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URL,
    scope: ['email', 'public_profile'].join(','), // comma seperated string
    response_type: 'code',
    auth_type: 'rerequest',
    display: 'popup',
  });
  res.status(200).json({ status: "success", data: { url: `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}` } });
};

exports.facebookLogin = catchAsync(async (req, res)=>{
  try {
    const urlParams = req.query;
    const access_token = await getAccessTokenFromCode(urlParams.code)
    data = await getFacebookUserData(access_token);
    if(data.email) {
      var user = await User.findOne({ email: data.email })
      if (!user){
        var user = await new User({
          emailVerified: true,
          image: req.body.image,
          firstName: data.first_name,
          lastName: data.last_name,
          url: crypto.randomBytes(8).toString("hex"),
          email: data.email,
          verificationToken: undefined
          })
          await user.save({ validateBeforeSave: false });
      }
      const token = signToken(user._id);
      res.status(200).json({
        status: "success",
        token,
        user
      });
    } else {
      res.status(422).json({error: "something went wrong"});
    }
  }
  catch(err){
    res.status(422).json({ error: err.message });
  }
});

async function getAccessTokenFromCode(code) {
  try {
  const response = await axios({
    url: 'https://graph.facebook.com/v4.0/oauth/access_token',
    method: 'get',
    params: {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URL,
      scope: ['email', 'public_profile'].join(','),
      code,
    },
  });
  return response.data.access_token;
  }
  catch(error) {
    console.log(error);
    return 'response.data.access_token;'
  }
};

async function getFacebookUserData(access_token) {
  const response  = await axios({
    url: 'https://graph.facebook.com/me',
    method: 'get',
    params: {
      fields: ['id', 'email', 'first_name', 'last_name'].join(','),
      access_token: access_token,
    },
  });
  return response.data;
};