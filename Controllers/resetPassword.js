
const user = require("../Models/user");
const {mailSender} = require("../Utilities/mailSender");
const bcrypt = require("bcryptjs");
const ResetPasswordLink = require("../mail/templates/ResetPasswordToken")

// checked
exports.forgotpasswordToken = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "enter email in input box",
      });
    }

    const userexisting = await user.findOne({ email: email });
    // console.log(userexisting)
    if (!userexisting) {
      return res.status(401).json({
        success: false,
        message: `user can not be exist in our database with  email : ${email}`,
      });
    }

    // console.log("hi" )
    // const token = crypto.randomBytes(20).toString("hex");
    const token = crypto.randomUUID(20).toString("hex");
    // console.log(token)


      await user.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 3600000,
      },
      { new: true }
    );

    // console.log(hi)

    const url = `https://ktech-silk.vercel.app/update-password/${token}`;

    // console.log(url)

    const hi = await mailSender(
      email,
      "secure link to change your password ",
      `click on these link and change password ${url}`
    );


          //  await mailSender( email , 'secure link to change your password' , ResetPasswordLink( email , url) );

        // try {
        //   console.log("mail sended 1")
        //    await mailSender(
        //     email,
        //     "secure link to change your password",
        //     ResetPasswordLink( email , url)
        //   );
        //   console.log("mail sended")
        // } catch (error) {
        //   return res.status(500).json({
        //     success: false,
        //     message: "Error occurred while sending email",
        //     error: error.message,
        //   });
        // }



    return res.status(200).json({
      success: true,
      message: `email sent successfully to the : ${email}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "there would be some error in sending the email to the user's email to change password",
    });
  }
};

// checked
// actually  reset password after clicking on the link provided to the authorized email
exports.forgotPassword = async (req, res) => {
  try {
    // console.log(req.body)
    const { password, confirmedPassword , token } = req.body 

    if (!password || !confirmedPassword ) {
      return res.status(401).json({
        success: false,
        message: "fill all details carefully ",
      });
    }

    if (password !== confirmedPassword) {
      return res.status(401).json({
        success: false,
        message: "password and confirmedpassword is different",
      });
    }

    const existingUser = await user.findOne({ token: token });

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    if (existingUser.resetPasswordExpires < Date.now()) {
      return res.status(403).json({
        success: false,
        message: "token was expired send link again",
      });
    }


    const hasedPassword = await bcrypt.hash(password , 10)

    const updatedUser = await user.findOneAndUpdate(
      { token: token },
      { password: hasedPassword },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "some error occur on changing the password",
    });
  }
};


