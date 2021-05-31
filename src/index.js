const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const public_dir_path = path.join(__dirname, '../public')

app.use(express.json())
app.use(express.static(public_dir_path))

io.on('connection', (socket) => {

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, username: options.username, room: options.room })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage(`Welcome ${user.username}`))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined.`))
        io.to(user.room).emit('roomStatus', { room: user.room, users: getUsersInRoom(user.room) })

        callback()
    })

    socket.on('sentMessage', (text, callback) => {
        const user = getUser(socket.id)
        if (user) {
            const filter = new Filter()

            if (filter.isProfane(text)) {
                return callback('Not Allowed')
            }
            io.to(user.room).emit('message', generateMessage(text, user.username))
            callback()
        }
    })

    socket.on('sendLocation', (latitude, longitude, callback) => {
        const user = getUser(socket.id)
        if (user) {
            io.to(user.room).emit('shareLocation', generateLocation(latitude, longitude, user.username))

            callback()
        }
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left the room.`))
            io.to(user.room).emit('roomStatus', { room: user.room, users: getUsersInRoom(user.room) })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up and running on PORT: ${port}`)
})