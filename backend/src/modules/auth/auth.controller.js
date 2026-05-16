const User = require("./auth.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../../config/email");
const StudentRequest = require("../studentRequest/studentRequest.model");



// Generate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });
};

// SIGNUP (Student only)

exports.signupUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (role && role !== "student") {
            return res.status(400).json({
                message: "Only student can signup"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user = await User.create({
            fullName,
            email,
            password,
            role: "student"
        });

        // 🔥 FIX: MOVE HERE
        await StudentRequest.create({
            student: user._id
        });

        res.status(201).json({
            success: true,
            message: "Signup successful"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// LOGIN
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

       const user = await User.findOne({ email });

           

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PROFILE
exports.getProfile = async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password incorrect"
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            message: "Password updated"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔐 Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // ✉️ Send email
    await transporter.sendMail({
      from: `"Student System (No Reply)" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.fullName},</p>
        <p>You requested to reset your password.</p>

        <a href="${resetUrl}" 
           style="padding:10px 20px; background:#6c63ff; color:white; text-decoration:none;">
          Reset Password
        </a>

        <p>This link expires in 10 minutes.</p>
        <p>If you didn’t request this, ignore this email.</p>

        <hr/>
        <small>This is a no-reply email. Please do not reply.</small>
      `
    });

    res.json({
      success: true,
      message: "Reset link sent to your email"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =======================================
// RESET PASSWORD
// =======================================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};