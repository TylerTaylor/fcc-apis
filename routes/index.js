var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: 'uploads/'});

var mongoose = require('mongoose');
var imageSearchDb = process.env.MONGOLAB_IMGDB_URI
var imageConn = mongoose.createConnection(imageSearchDb);

var Schema = mongoose.Schema;
var https = require('https')

var recentSearchSchema = new Schema({
  term: String,
  when: String
})

var RecentSearch = imageConn.model('RecentSearch', recentSearchSchema)

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: "Ty's FCC APIs" });
});

/* GET whoami API */
router.get('/whoami', (req, res) => {
  // get the IP address, language and operating system for this browser
  var osInfo = req.headers['user-agent']
  osInfo = osInfo.split(/[\(\)]/)[1] // search for words in parentheses

  var ip = req.ip
  // var ip = req.headers['']
  // we only need the first part of the language, before the comma
  var language = req.headers['accept-language'].split(',')[0].trim()

  var data = {
    "ipaddress": ip,
    "language": "en-US",
    "software": osInfo
  }

  res.json(data)
})

/* GET timestamp index */
router.get('/timestamp', (req, res) => {
  res.render('timestamp');
});

/* GET timestamp API */
router.get('/timestamp/:time', (req, res) => {

  function unixToNatural(unix) {
    var date = new Date(unix * 1000)
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December']

    var month = months[date.getMonth()]
    var day = date.getDate()
    var year = date.getFullYear()

    var result = month + ' ' + day + ', ' + year
    return result
  }

  if (!isNaN(req.params.time)) {
    var result = unixToNatural(req.params.time)
    var data = { unix: req.params.time, natural: result }
    res.json(data)
  } else {
    var natural = new Date(req.params.time)
    if(!isNaN(natural)) {
      var unix = natural / 1000
      var data = { unix: unix, natural: req.params.time }
      res.json(data)
    } else {
      res.json({ unix: null, natural: null })
    }
  }
})

/* GET fileMetadata index */
router.get('/fileMetadata', (req, res) => {
  res.render('fileMetadata', { title: "Ty's FCC APIs" });
});

/* GET fileMetadata API */
router.post('/fileMetadata/upload', upload.single('file'), (req, res) => {
  return res.json(req.file)
})

/* IMAGE SEARCH */
var baseUrl = "https://www.googleapis.com/customsearch/v1?"
var cx = process.env.CSE_CX
var key = process.env.CSE_KEY
var apiUrl = baseUrl + "cx=" + cx + "&key=" + key + "&q="

const request = require('request')

router.get('/imagesearch', (req, res) => {
  res.render('imagesearch', { title: 'Image Search Abstraction Layer'})
})

router.get('/imagesearch/latest', (req, res) => {
  RecentSearch.find({}, {_id: 0, __v: 0}, (err, data) => {
    res.json(data)
  })
})

router.get('/imagesearch/:query*', (req, res) => {
  var queryParam = req.params.query
  var { offset } = req.query

  var saveSearchTerm = new RecentSearch({
    term: queryParam,
    when: new Date()
  })

  saveSearchTerm.save()

  if (offset) {
    var query = apiUrl + queryParam + "&searchType=image&start=" + offset
    sendRequest(query)
  } else {
    var query = apiUrl + queryParam + "&searchType=image"
    sendRequest(query)
  }

  function sendRequest(query) {
    request(query, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let queryResults = JSON.parse(body)
        let results = []
        queryResults = queryResults['items']

        for (var i=0; i < queryResults.length; i++) {
          let obj = {
            url: queryResults[i]['link'],
            snippet: queryResults[i]['snippet'],
            thumbnail: queryResults[i]['image']['thumbnailLink'],
            context: queryResults[i]['image']['contextLink']
          }
          results.push(obj)
        }

        res.json(results)
      } else {
        console.log("Got an error: ", error, ", status code: ", response.statusCode)
      }
    })
  }
})


module.exports = router;
