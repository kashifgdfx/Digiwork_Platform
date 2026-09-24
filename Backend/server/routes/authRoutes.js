const router = require("express").Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const connectDB = require("../db");
const { sendPasswordResetEmail } = require("../utils/emailService");

const secret = () =>
  process.env.JWT_SECRET || "tumhara_super_secret_key_yahan_hoga";

const isProduction = () =>
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";

const passwordStrengthRegex = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[^A-Za-z0-9]/,
};

const isStrongPassword = (password) =>
  Object.values(passwordStrengthRegex).every((rule) => rule.test(password));

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateResetToken = () => crypto.randomBytes(32).toString("hex");

const rateLimitMap = new Map();

const checkResetRateLimit = (ip) => {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip) || [];
  const recent = bucket.filter((stamp) => now - stamp < 60 * 60 * 1000);
  if (recent.length >= 5) {
    return false;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  // Single authoritative level — prefer sellerMetrics.level, fall back to top-level field
  level: user.sellerMetrics?.level || user.level || "New Seller",
  rating: user.rating,
  reviewCount: user.reviewCount,
  country: user.country,
  memberSince: user.memberSince,
  responseTime: user.responseTime,
  bio: user.bio,
  phone: user.phone,
  headline: user.headline,
  state: user.state,
  city: user.city,
  timezone: user.timezone,
  languages: user.languages,
  skills: user.skills,
  education: user.education,
  certifications: user.certifications,
  experience: user.experience,
  portfolio: user.portfolio,
  socialLinks: user.socialLinks,
  sellerMetrics: user.sellerMetrics,
  role: user.role,
  accountStatus: user.accountStatus,
  profileCompletion: user.profileCompletion,
});

const authenticatedUser = async (req) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || req.cookies?.token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret());
    await connectDB();
    return User.findOne({ id: payload.userId }).lean();
  } catch {
    return null;
  }
};

router.post("/signup", async (req, res) => {
  try {
    await connectDB();
    const { name, username, email, password, country, bio } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({
        success: false,
        error:
          "Please fill in all required fields (name, username, email, password)",
      });

    if (!isStrongPassword(String(password))) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.",
      });
    }

    if (await User.findOne({ $or: [{ email }, { username }] }))
      return res.status(400).json({
        success: false,
        error: "User with this email or username already exists",
      });
    const user = await User.create({
      id: `user-${Date.now()}`,
      name,
      username,
      email,
      password: await bcrypt.hash(password, 12),
      country: country || "United States",
      bio: bio || "",
      memberSince: String(new Date().getFullYear()),
      role: 'buyer',
    });

    console.log(`[Signup] User created: ${user.email} | id: ${user.id} | db: FiverData.users`);

    // Issue a JWT cookie immediately so the frontend can be auto-logged in
    // without requiring a separate POST /login call.
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username, name: user.name },
      secret(),
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: isProduction() ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    if (user.accountStatus && user.accountStatus !== 'active')
      return res.status(403).json({ success: false, error: 'This account is not active. Please contact support.' });
    const userData = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    };
    const token = jwt.sign(userData, secret(), { expiresIn: "7d" });
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction(),
      sameSite: isProduction() ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("token", token, cookieOptions);
    res.json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    if (!checkResetRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: "Too many password reset attempts. Please try again in 1 hour.",
      });
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required." });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (user) {
      const resetToken = generateResetToken();
      const hashedToken = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = expiresAt;
      await user.save();

      const frontendBaseUrl =
        process.env.FRONTEND_URL ||
        (isProduction()
          ? "https://digiwork-platform.vercel.app"
          : "http://localhost:3000");
      const resetLink = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        name: user.name || user.username,
        resetLink,
        expiresInMinutes: 15,
      });

      if (!emailResult.success) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Password reset link for local testing:", resetLink);
          return res.status(200).json({
            success: true,
            message:
              "Email service is not configured. Reset link generated for local testing.",
            debugResetLink: resetLink,
          });
        }

        return res.status(503).json({
          success: false,
          error:
            "Email service is not configured. Please configure SMTP to send password reset links.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unable to process password reset request.",
    });
  }
});

router.get("/validate-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, valid: false, error: "Token is required." });
    }

    await connectDB();
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    return res.status(200).json({
      success: true,
      valid: Boolean(user),
      message: user ? "Token is valid." : "Token is invalid or expired.",
    });
  } catch (error) {
    console.error("Validate reset token error:", error);
    return res.status(500).json({
      success: false,
      valid: false,
      error: error.message || "Unable to validate reset token.",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};
    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "Reset token is required." });
    }
    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({
          success: false,
          error: "New password and confirmation are required.",
        });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, error: "Passwords do not match." });
    }
    if (!isStrongPassword(String(password))) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.",
      });
    }

    await connectDB();
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unable to reset password.",
    });
  }
});

router.get("/me", async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user)
    return res
      .status(401)
      .json({ success: false, user: null, error: "Unauthorized" });
  return res.json({ success: true, user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: isProduction() ? "none" : "lax",
    path: "/",
  });
  return res.json({ success: true });
});

module.exports = router;
