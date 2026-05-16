const Notification = require("./notification.model");

// GET USER NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    notifications
  });
};

// MARK AS READ
exports.markAsRead = async (req, res) => {
  const { id } = req.params;

  await Notification.findByIdAndUpdate(id, { isRead: true });

  res.json({ success: true });
};

exports.createDummyNotification = async (req, res) => {
  const userId = req.user.id;

  const notification = await Notification.create({
    user: userId,
    message: "⚠ Low marks in DBMS",
    type: "alert"
  });

  res.json({
    success: true,
    notification
  });
};