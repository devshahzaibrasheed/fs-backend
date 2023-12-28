const { ses } = require("../modules/aws");

exports.forgetPasswordEmail = async (user, email, resetToken) => {
  const emailParams = {
    Destination: {
      ToAddresses: [email.toLowerCase()]
    },
    Message: {
      Body: {
        Html: {
          Data: `<p>Hi ${user.firstName},</p>
              <p>We've received a password reset request for your FrontShare account.</p>
              <p>If you didn't make this request, please contact our support team right away at info@frontshare.com</p>
              <p>If you need to reset your password, please click the button below to proceed.</p>
              <button style="background-color:#725574; border:none; color:white; padding: 15px 32px; text-align:center; text-decoration:none; display:inline-block; font-size: 16px; margin: 4px 2px; cursor:pointer;">
              <a href="${process.env.BASE_URL}?reset_password=${resetToken}" style="color:white; text-decoration:none;">Click here to reset your password</a>
              </button>
              <p>Thanks,</p>
              <p>The FrontShare Team</p>`
        }
      },
      Subject: {
        Data: "FrontShare Password Reset"
      }
    },
    Source: process.env.EMAIL_FROM
  };
  await ses.sendEmail(emailParams).promise();
};

exports.resetPasswordEmail = async (user) => {
  const emailParams = {
    Destination: {
      ToAddresses: [user.email.toLowerCase()]
    },
    Message: {
      Body: {
        Html: {
          Data: `${user.firstName} ${user.lastName},<br><br>
              Your password has been recently updated.<br><br>
              If you did not request this password reset, please contact us immediately by replying to this message.<br><br>
              Best regards,<br>
              The FrontShare Team`
        }
      },
      Subject: {
        Data: "Password reset successful"
      }
    },
    Source: process.env.EMAIL_FROM
  };
  await ses.sendEmail(emailParams).promise();
};

exports.verificationEmail = async (user) => {
  console.log(process.env.EMAIL_FROM)
  const emailParams = {
    Destination: {
      ToAddresses: [user.email.toLowerCase()]
    },
    Message: {
      Body: {
        Html: {
          Data: `Hey ${user.firstName} ${user.lastName},<br><br>
              Welcome to FrontShare<br><br>
              To continue access to your Frontshare account, click on the button below to verify your email.<br><br>
              <button style="background-color:#725574; border:none; color:white; padding: 15px 32px; text-align:center; text-decoration:none; display:inline-block; font-size: 16px; margin: 4px 2px; cursor:pointer;">
              <a href="${process.env.BASE_URL}/auth/verify-email?verification_token=${user.verificationToken}" style="color:white; text-decoration:none;">Click here to verify your email</a>.
              </button>
              <p>Thanks,</p>
              <p>The FrontShare Team</p>`
        }
      },
      Subject: {
        Data: "FrontShare Email Verification"
      }
    },
    Source: process.env.EMAIL_FROM
  };
  await ses.sendEmail(emailParams).promise();
};