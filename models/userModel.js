const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide your first name"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide your last name"],
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      index: true,
      lowercase: true,
      required: [true, "Email is required!"],
      validate: [validator.isEmail, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
      match: [
        /^(?=.*[!@#\$%])(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Password must be 8 characters long with atleast one capital, one digit and one symbol(!@#$%).",
      ],
      select: false,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    userType: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },
    userStatus: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    url: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.correctPassword = function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
