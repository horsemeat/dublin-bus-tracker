var nock = require('nock');
var url = "/en/RTPI/Sources-of-Real-Time-Information/?searchtype=view&searchquery=3656"
var fs = require('fs');
var dublin_html = ""

fs.readFile('test/dublin_bus.html', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  dublin_html = data
});

var bus_response = nock('http://www.dublinbus.ie')
                .get(url)
                .reply(200, dublin_html);

var mocha = require("mocha")
var assert = require("assert")
var func = require('../bus_utils.js')

mocha.describe('Test get all buses', function(){
    func.getAllBuses("3656", "43", function(results) {
         assert.equal(["23:09"], results)
    })
});