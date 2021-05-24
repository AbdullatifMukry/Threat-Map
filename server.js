const path = require('path')
const express = require('express')
const geoip = require('geo-from-ip')
const Axios = require('axios')

const app = express()
require('express-ws')(app)
const port = process.env.PORT || 3000
app.use('/static', express.static(__dirname + '/static'));

const API_ID = 'e48d139b485b45213ac025747d0774ecf261f617309635862aabb7daf1ada37f'
const API_KEY = 'b7d06c09b0a65ff657bd8c4c2587b4b7141ac1da9d61bac46880be4e93641358'
const axios = Axios.create({
  baseURL: 'https://honeydb.io/api/',
  headers: {
    'X-HoneyDb-ApiId': API_ID,
    'X-HoneyDb-ApiKey': API_KEY
  },
})

let badHosts = []

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})

app.ws('/ws', function(ws, req) {
  ws.on('message', (msg) => {
    console.log(msg)
  })

  const interval = setInterval(() => {
    if (badHosts.length > 0) {
        const badHost = badHosts.pop(0)
        // console.log(badHost)
        const info = geoip.allData(badHost.remote_host)
        origin = {
          ip: badHost.remote_host,
          count: badHost.count,
          lastSeen: badHost.last_seen,
          country: info?.code?.country,
          city: info?.city,
          lat: info?.location?.latitude,
          lng: info?.location?.longitude,
        }
        ws.send(JSON.stringify(origin))
    }
  }, 500)

  ws.on('close', () => clearInterval(interval))
})

app.listen(port, () => {
  console.log(`Listening on ${port}`)
  axios.get('bad-hosts').then((response) => {
    console.log(`${response.data.length} bad hosts`)
    badHosts = response.data.sort(function(a, b) {
      const x = parseInt(a.count)
      const y = parseInt(b.count)
      return ((x < y) ? -1 : ((x > y) ? 1 : 0))
  })
  })
})
