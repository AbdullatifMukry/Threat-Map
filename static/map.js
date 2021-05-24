import Geohash from 'https://cdn.jsdelivr.net/npm/latlon-geohash@2.0.0'

const FPS = 15
const initialOpacity = 1
const initialRadius = 3
const maxRadius = 15

let opacity = initialOpacity
let radius = initialRadius
let points = new Map()
let timers = []

const map = new mapboxgl.Map({
  accessToken: 'pk.eyJ1Ijoia2hhemlkaGVhIiwiYSI6ImNrb3U3bzU4NjA0MnAyb2szY24yMHBubzcifQ.jcErhmGBmsSUhKLbV58Irw',
  container: 'map',
  style: 'mapbox://styles/leaseweb/ckkiepmg40ds717ry6l0htwag',
  center: [0, 0],
  zoom: 1
})

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
})

map.on('load', function () {
  const ws = new WebSocket('ws://localhost:3000/ws')

  ws.onmessage = function (event) {
    addPoint(JSON.parse(event.data))
  }

  ws.onerror = function(error) {
    console.error(error)
  }
})

function animatePoint(timestamp, pointId) {
  timers[pointId] = setTimeout(() => {
    requestAnimationFrame((timestamp) => {
      animatePoint(timestamp, pointId)
    })

    radius = points.get(pointId)[0]
    opacity = points.get(pointId)[1]

    radius += (maxRadius - radius) / FPS
    opacity -= ( .9 / FPS )
    if (opacity < 0) {
        opacity = 0
    }

    map.setPaintProperty('point-' + pointId, 'circle-radius', radius)
    map.setPaintProperty('point-' + pointId, 'circle-opacity', opacity)

    if (opacity <= 0) {
        radius = initialRadius
        opacity = initialOpacity
    }
    points.set(pointId, [ radius, opacity ])
  }, 1000 / FPS)
}

function addPoint(msg) {
  const geohash = Geohash.encode(msg.lat, msg.lng, 7)

  const tbody = document.querySelector('tbody')
  tbody.insertRow(0).innerHTML = '<tr><td class="flash">' + msg.ip + '</td>' +
        '<td class="flash">' + msg.country + '</td>' +
        '<td class="flash">' + msg.city + '</td>' +
        '<td class="flash">' + msg.count + '</td>' +
        '<td class="flash">' + msg.lastSeen + '</td>' +
        '</tr>'

  //Add the point to the map if it is not already on the map
  if (geohash && !points.has(geohash)) {
    points.set(geohash, [ initialRadius, initialOpacity ])

    map.addSource('points-'+geohash, {
      'type': 'geojson',
      'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [ msg.lng, msg.lat ]
          },
          'properties': {
            'description': '<p>IP: ' + msg.ip + '</p>'
          }
      }
    })

    map.addLayer({
      'id': 'point-' + geohash,
      'source': 'points-' + geohash,
      'type': 'circle',
      'paint': {
          'circle-radius': initialRadius,
          'circle-radius-transition': {duration: 0},
          'circle-opacity-transition': {duration: 0},
          'circle-color': '#dd7cbf'
      }
    })

    map.on('mouseenter', 'point-' + geohash, (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const coordinates = e.features[0].geometry.coordinates.slice()
      const description = e.features[0].properties.description
      popup.setLngLat(coordinates).setHTML(description).addTo(map)
    })

    map.on('mouseleave', 'point-' + geohash, () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    })

    animatePoint(0, geohash)
  }
}
