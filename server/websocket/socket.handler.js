module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("🔌 New websocket client connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("🔌 Websocket client disconnected:", socket.id);
        });
    });
};
