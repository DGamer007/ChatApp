const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = event.target.elements.typeMessage.value

    socket.emit('sentMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Delievered')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not Supported by your Browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', position.coords.latitude, position.coords.longitude, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared')
        })
    })
})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render($messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('shareLocation', (message) => {
    const html = Mustache.render($locationTemplate, {
        location: message.location,
        createdAt: moment(message.createdAt).format('hh:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomStatus', ({ room, users }) => {
    const html = Mustache.render($sideBarTemplate, { room, users })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})