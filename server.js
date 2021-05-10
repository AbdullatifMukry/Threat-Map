const path = require('path')
const express = require('express')
const app = express()
const port = 3000
const Axios = require('axios')

const API_ID = 'e48d139b485b45213ac025747d0774ecf261f617309635862aabb7daf1ada37f'
const API_KEY = 'b7d06c09b0a65ff657bd8c4c2587b4b7141ac1da9d61bac46880be4e93641358'
const axios = Axios.create({
  baseURL: 'https://honeydb.io/api/',
  headers: {
    'X-HoneyDb-ApiId': API_ID,
    'X-HoneyDb-ApiKey': API_KEY
  },
})

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  axios.get('bad-hosts').then((response) => {
    console.log(response.data)
  })
})
