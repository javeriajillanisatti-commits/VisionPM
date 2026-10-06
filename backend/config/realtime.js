let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;

  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
};

const broadcastDataChanged = (payload = {}) => {
  if (!ioInstance) return;

  ioInstance.emit("data_changed", payload);
};

module.exports = {
  setIO,
  emitToUser,
  broadcastDataChanged,
};