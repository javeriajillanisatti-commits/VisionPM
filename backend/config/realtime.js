let ioInstance = null;

const setIO = (io) => { ioInstance = io; };

const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
};

module.exports = { setIO, emitToUser };
