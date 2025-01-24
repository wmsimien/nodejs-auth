// get User model
const User = require("../models/User");
// get bcrypt
const bcrypt = require("bcryptjs");
// get jwt
const jwt = require("jsonwebtoken");

// register controller
const registerUser = async (req, res) => {
  try {
    // get user info
    const { username, email, password, role } = req.body;
    // check if user is already exist in db
    const checkExistingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exist with same username and/or email.  Please try with different username/email.",
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // create user and save in db
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();

    if (newUser) {
      res.status(201).json({
        success: true,
        message: "User registered successfully.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Unable to registered!  Please try again.",
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!  Please try again.",
    });
  }
};

// login controller
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    // check if user is already exist in db
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist.",
      });
    }

    // check if password is correct or not
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // create token -> Bearer
    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      message: "Logged in successful.",
      accessToken,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!  Please try again.",
    });
  }
};

// change password
const changePassword = async (req, res) => {
  try {
    // get userId
    const userId = req.userInfo.userId;
    // extract old and new password
    const { oldPassword, newPassword } = req.body;
    // find current user
    const user = await User.findById(userId);

    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }

    // check if old password is correct
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is not correct!  Please try again.",
      });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // update user password
    user.password = newHashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!  Please try again.",
    });
  }
};

module.exports = { registerUser, loginUser, changePassword };
