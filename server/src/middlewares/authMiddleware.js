import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for Authorization header starting with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // 3. Cryptographically verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach authenticated user to req.user (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      // 5. Proceed to the next middleware/controller
      return next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // If no token was sent in the headers
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};