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
    image: {type: String},
    email: {
      type: String,
      unique: [true, "Email already exists"],
      index: true,
      lowercase: true,
      required: [true, "Email is required!"],
      validate: [validator.isEmail, "Please provide a valid email"]
    },
    emailVerified: {
      type: Boolean,
      default: false,
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
    resetPasswordToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ["user", "admin", "employee"],
      default: "user",
    },
    userStatus: {
      type: String,
      enum: ["active", "inactive", "pending", "banned"],
      default: "active",
    },
    plan: {
      type: String,
      enum: ["basic", "pro_monthly", "pro_annually"],
      default: "basic",
    },
    url: {
      type: String
    },
    verificationToken: {
      type: String
    },
    activityStatus: {
      type: Boolean,
      default: true
    },
    recentActivity: {
      onlineAt: {
        type: Date
      }
    },
    banner: String,
    country: String,
    phone: String,
    dateOfBirth: Date,
    joinedDate: Date,
    gender: {
      type: String,
      enum: ['male', 'female']
    },
    address: String,
    state: String,
    zipCode: String,
    timezone: String,
    currency: String,
    bio: String,
    displayName: String,
    verifiedAt: Date,
    subscribedAt: Date,
    useRealName: {
      type: Boolean,
      default: true
    },
    idVerified: {
      type: Boolean,
      default: false
    },
    tabSettings: {
      feed: {
        type: Boolean,
        default: true
      },
      exclusives: {
        type: Boolean,
        default: false
      },
      podcasts: {
        type: Boolean,
        default: false
      },
      links: {
        type: Boolean,
        default: false
      },
      appointments: {
        type: Boolean,
        default: false
      },
      products: {
        type: Boolean,
        default: false
      },
      courses: {
        type: Boolean,
        default: false
      },
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
