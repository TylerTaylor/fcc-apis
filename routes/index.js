var express = require('express');
var router = express.Router();

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

module.exports = router;
