const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const geoip = require('geo-from-ip');
const NodeGeocoder = require('node-geocoder');
const Axios = require('axios');

// Cities of the world
const cities = require('./data/cities.json');
const { connected } = require('process');

const port = process.env.PORT || 3000;
const app = express();
const httpServer = http.Server(app);
const io = socketIO(httpServer);


const API_ID = 'e48d139b485b45213ac025747d0774ecf261f617309635862aabb7daf1ada37f';
const API_KEY = 'b7d06c09b0a65ff657bd8c4c2587b4b7141ac1da9d61bac46880be4e93641358';
const axios = Axios.create({
  baseURL: 'https://honeydb.io/api/',
  headers: {
    'X-HoneyDb-ApiId': API_ID,
    'X-HoneyDb-ApiKey': API_KEY
  },
});

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
});

let badHosts = [];
let nodes = [];

httpServer.on('listening', () => {
  axios.get('bad-hosts').then((response) => {
    console.log(`${response.data.length} bad hosts`)
    badHosts = response.data
  })
  axios.get('nodes').then((response) => {
    console.log(`${response.data.length} nodes`)
    nodes = response.data
  })
});

// Helper function
function rndRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../client') });
});

io.on('connection', socket => {

  console.log('websocket connection established');

  const l = cities.length;

  const emitData = async () => {
    let origin, dest

    const hostIndex = rndRange(0, badHosts.length);
    if (hostIndex) {
      const badHost = badHosts[hostIndex];
      const info = geoip.allData(badHost.remote_host);
      origin = {
        country: info.code.country,
        name: info.city,
        lat: info.location.latitude,
        lng: info.location.longitude
      };
      // console.log(origin);
    }

    let nodeIndex = -1;
    while (nodeIndex == -1 || nodes[nodeIndex]?.country == 'Private IP') {
      nodeIndex = rndRange(0, nodes.length);
      console.log(nodeIndex)
    }
    if (nodeIndex) {
      const node = nodes[nodeIndex];
      const info = await geocoder.geocode(`country + ${node.country}`);
      // console.log(info)
      if (info) {
        dest = {
          country: info[0].countryCode,
          name: info[0].city,
          lat: info[0].latitude,
          lng: info[0].longitude
        }
     }
    }

    // console.log(dest)
    // dest = cities[0]
    // console.log(dest)
    if (origin && dest) {
      io.emit('cyber-attack', {
        origin: origin,
        dest: dest
      });
    }
    setTimeout(emitData, rndRange(250, 1500));
  };

  emitData();

});

httpServer.listen(port, () => {
  console.log(`listening on port ${port}`);
});
