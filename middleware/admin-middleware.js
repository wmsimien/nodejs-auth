const isAdminUser = (req, res, next) => {
  // console.log("in admin middle: ", req.userInfo);
  if (req.userInfo.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied!  Admin rights required.",
    });
  }
  next();
};

module.exports = isAdminUser;
