const User = require("./../models/userModel");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  const user = new User(req.body);
  user.url = crypto.randomBytes(8).toString("hex");
  const token = signToken(user._id);

  try {
    await user.save();

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
