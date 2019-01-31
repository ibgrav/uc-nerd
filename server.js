const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http');
const path = require('path');
const fs = require('fs');
const aws = require('aws-sdk');
// aws.config.region = 'us-east-2';
const S3_BUCKET = process.env.S3_BUCKET;
var podChannel = {};

const mongodb = require('mongodb');
let uri = "mongodb://ibgrav:L337sauce@ds155490.mlab.com:55490/uc-nerd";
mongodb.MongoClient.connect(uri, { useNewUrlParser: true }, function(err, client) {
    if(err) console.log(err);
    if(err) throw err;
    let db = client.db('uc-nerd');
    let channel = db.collection('channel');
    
    channel.find({}).toArray(function(err, items) {
        podChannel = items;
        items.forEach(function (item) {
            console.log(item);
        });
        client.close();
    });
});
 

const podData = require('./public/pod.json');
var sPod = podData;

const testData = require('./public/test.json');
var testPod = testData;

var adminAuth = false;

var port = process.env.PORT || 8080;

function rAnd(data) {
    return data.replace('&', '&amp;');
}

var allKeys = [];

function listAllKeys(token, cb) {
    var opts = {
        Bucket: s3bucket
    };
    if (token) opts.ContinuationToken = token;

    s3.listObjectsV2(opts, function (err, data) {
        allKeys = allKeys.concat(data.Contents);

        if (data.IsTruncated)
            listAllKeys(data.NextContinuationToken, cb);
        else
            cb();
    });
}

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
    console.log('sending from index.js');
});

app.get("/db/channel", function (req, res) {
    db.collection("channel").find({}).toArray(function (err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get contacts.");
        } else {
            res.status(200).json(docs);
        }
    });
});

app.get('/test/json', function (req, res, next) {
    res.json(require('./public/test.json'));
});

app.get('/s3-all', function (req, res, next) {
    const s3 = new aws.S3();

    var params = {
        Bucket: S3_BUCKET,
        Delimiter: '',
        Prefix: ''
    }

    s3.listObjects(params, function (err, data) {
        if (err) throw err;
        console.log(data);
        res.send(data);
    });
});

app.get('/sign-s3', (req, res) => {
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.end();
        }
        const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
        };
        res.write(JSON.stringify(returnData));
        res.end();
    });
});

app.get('/pod.rss', function (req, res) {

    var rssBody = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">' +
        '<channel>' +
        '<title>' + sPod.channel.title + '</title>' +
        '<link>' + sPod.channel.link + '</link>' +
        '<language>en-us</language>' +
        '<itunes:subtitle>' + sPod.channel.subtitle + '</itunes:subtitle>' +
        '<itunes:author>' + sPod.channel.author + '</itunes:author>' +
        '<itunes:summary>' + sPod.channel.description + '</itunes:summary>' +
        '<description>' + sPod.channel.description + '</description>' +
        '<itunes:owner>' +
        '<itunes:name>' + sPod.channel.ownerName + '</itunes:name>' +
        '<itunes:email>' + sPod.channel.ownerEmail + '</itunes:email>' +
        '</itunes:owner>' +
        '<itunes:explicit>' + sPod.channel.excplicit + '</itunes:explicit>' +
        '<itunes:image href="' + sPod.channel.image + '" />' +
        '<itunes:category text="' + sPod.channel.category + '"></itunes:category>';

    for (var j = 0; j < sPod.item.length; j++) {
        rssBody += '<item><title>' + sPod.item[j].title + '</title>' +
            '<itunes:summary>' + sPod.item[j].description + '</itunes:summary>' +
            '<description>' + sPod.item[j].description + '</description>' +
            '<link>https://undercovercast.com/?episode=' + j + '</link>' +
            '<enclosure url="' + sPod.item[j].enclosure + '" length="1024"></enclosure>' +
            '<pubDate>' + sPod.item[j].pubDate + '</pubDate>' +
            '<itunes:author>' + sPod.item[j].itunesauthor + '</itunes:author>' +
            '<itunes:duration>' + sPod.item[j].itunesduration + '</itunes:duration>' +
            '<itunes:explicit>' + sPod.item[j].itunesexplicit + '</itunes:explicit>' +
            '<guid>https://undercovercast.com/?episode=' + j + '</guid></item>';
    }

    rssBody += '</channel></rss>';

    res.header('Content-type', 'text/xml').send(rssBody);
});

app.get('/test.rss', function (req, res) {

    var rssBody = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">' +
        '<channel>' +
        '<title>' + testPod.channel.title + '</title>' +
        '<link>' + testPod.channel.link + '</link>' +
        '<language>en-us</language>' +
        '<itunes:subtitle>' + testPod.channel.subtitle + '</itunes:subtitle>' +
        '<itunes:author>' + testPod.channel.author + '</itunes:author>' +
        '<itunes:summary>' + testPod.channel.description + '</itunes:summary>' +
        '<description>' + testPod.channel.description + '</description>' +
        '<itunes:owner>' +
        '<itunes:name>' + testPod.channel.ownerName + '</itunes:name>' +
        '<itunes:email>' + testPod.channel.ownerEmail + '</itunes:email>' +
        '</itunes:owner>' +
        '<itunes:explicit>' + testPod.channel.excplicit + '</itunes:explicit>' +
        '<itunes:image href="' + testPod.channel.image + '" />' +
        '<itunes:category text="' + testPod.channel.category + '"></itunes:category>';

    for (var j = 0; j < testPod.item.length; j++) {
        rssBody += '<item><title>' + testPod.item[j].title + '</title>' +
            '<itunes:summary>' + testPod.item[j].description + '</itunes:summary>' +
            '<description>' + testPod.item[j].description + '</description>' +
            '<link>https://undercovercast.com/?episode=' + j + '</link>' +
            '<enclosure url="' + testPod.item[j].enclosure + '" length="1024"></enclosure>' +
            '<pubDate>' + testPod.item[j].pubDate + '</pubDate>' +
            '<itunes:author>' + testPod.item[j].itunesauthor + '</itunes:author>' +
            '<itunes:duration>' + testPod.item[j].itunesduration + '</itunes:duration>' +
            '<itunes:explicit>' + testPod.item[j].itunesexplicit + '</itunes:explicit>' +
            '<guid>https://undercovercast.com/?episode=' + j + '</guid></item>';
    }

    rssBody += '</channel></rss>';

    res.header('Content-type', 'text/xml').send(rssBody);
});

app.get('/admin', function (req, res) {
    if (adminAuth) {
        res.send('<html><head><title>~ADMIN~ Undercover Nerd</title>' +
            '<meta content="width=device-width, initial-scale=1" name="viewport" />' +
            '<link rel="stylesheet" media="all" href="admin.css">' +
            '</head><body>' +
            '<div id="up-new-btn" class="option-button">new</div>' +
            '<div id="up-new-box" class="form-box">' +
            '<div id="name-suggestion"></div>' +
            '<input id="myFile" class="file-select-btn" type="file" name="myFile" required />' +
            '<div id="myFileGo" class="file-up-btn option-button">go</div></div>' +
            '<div id="up-ex-btn" class="option-button">old</div>' +
            '<div id="up-ex-box" class="form-box">' +
            '<div id="up-ex-select-in"></div>' +
            '<div id="up-ex-select-box">' +
            '<input id="item-title" type="text" placeholder="Title" />' +
            '<input id="item-desc" type="text" placeholder="Description" />' +
            '<input id="item-pubDate" type="text" placeholder="mm/dd/yyyy" />' +
            '<input id="item-author" type="text" placeholder="Author" />' +
            '<input id="item-link" type="text" placeholder="Link" />' +
            '<input id="item-duration" type="text" placeholder="Duration 00:00:00" />' +
            '<select id="item-explicit" placeholder="Explicit">' +
            '<option value="" disabled="" selected="" hidden="hidden">Explicit?</option>' +
            '<option value="yes">Yes</option>' +
            '<option value="no">No</option>' +
            '</select>' +
            '<input id="item-guid" type="text" placeholder="guid (same as link)" />' +
            '<input id="item-enclosure" type="text" placeholder="mp3 URL" />' +
            '<div id="up-ex-submit-btn" class="option-button">></div>' +
            '</div></div>' +
            '<script type="text/javascript" src="admin.js"></script>' +
            '<script>console.log("podChannel: '+ podChannel +'")</script>' +
            '</body></html>');
        adminAuth = false;
    } else {
        res.sendFile(path.join(__dirname + '/public/admin.html'));
    }
});

app.post('/admin/send/pod', function (req, res) {

    // res.send('<style>body {font-size: 20px;background-color:rgb(125,175,150); color:rgb(240,240,240);}</style><div style="width:100%; margin: auto; text-align: center"><br/><br/><br/><br/>' +
    //     'You have successfull uploaded the podcast<br/><br/><br/><br/><div style="text-align: left;font-size:14px;"></div><br/><br/><br/><br/>' +
    //     'See if it works: <br/><br/><audio controls><source src="https://undercovercast.com/pod/' + newFileName + '" type="audio/ogg">' +
    //     'Your browser does not support the audio element.</audio><br/><br/><a href="https://undercovercast.com/admin2.html">Make it live</a></div>');

});

app.get('/admin/send', function (req, res) {
    var item = req.query.item || null;
    var title = req.query.title || null;
    var link = req.query.link || null;
    var subtitle = req.query.subtitle || null;
    var author = req.query.author || null;
    var description = req.query.description || null;
    var ownerName = req.query.ownerName || null;
    var ownerEmail = req.query.ownerEmail || null;
    var explicit = req.query.explicit || null;
    var image = req.query.image || null;
    var category = req.query.category || null;
    var enclosure = req.query.enclosure || null;
    var guid = req.query.guid || null;
    var duration = req.query.duration || null;
    var pubDate = req.query.pubDate || null;
    var newItem = req.query.newItem || null

    if (item && testPod.item[item]) {
        if (description) testPod.item[item].description = description;
        if (enclosure) testPod.item[item].enclosure = enclosure;
        if (guid) testPod.item[item].guid = guid;
        if (author) testPod.item[item].author = author;
        if (duration) testPod.item[item].duration = duration;
        if (explicit) testPod.item[item].explicit = explicit;
        if (description) testPod.item[item].itunessummary = description;
        if (link) testPod.item[item].link = link;
        if (pubDate) testPod.item[item].pubDate = pubDate;
        if (title) testPod.item[item].title = title;
    } else {
        if (title) testPod.channel.title = title;
        if (link) testPod.channel.link = link;
        if (subtitle) testPod.channel.subtitle = subtitle;
        if (author) testPod.channel.author = author;
        if (description) testPod.channel.description = description;
        if (ownerName) testPod.channel.ownerName = ownerName;
        if (ownerEmail) testPod.channel.ownerEmail = ownerEmail;
        if (excplicit) testPod.channel.excplicit = excplicit;
        if (image) testPod.channel.image = image;
        if (category) testPod.channel.category = category;
    }

    if (newItem) {
        testPod.item.push({
            "description": podDescription,
            "enclosure": podEnclosure,
            "guid": podGuid,
            "itunesauthor": podAuthor,
            "itunesduration": podDuration,
            "itunesexplicit": podExcplicit,
            "itunessummary": podDescription,
            "link": podLink,
            "pubDate": podPubDate,
            "title": podTitle
        });
    }

    fs.writeFile('./public/test.json', JSON.stringify(testPod), (err) => {
        if (err) res.redirect('/admin/fail');

        // success case, the file was saved
        setTimeout(function () {
            res.redirect('/admin/success');
        }, 3000);
    });
});

app.get('/admin/success', function (req, res) {
    res.send('<style>body {font-size: 20px;background-color:rgb(125,175,150); color:rgb(240,240,240);}</style><div style="width:100%; margin: auto; text-align: center"><br/><br/><br/><br/>' +
        'You have successfull updated the rss<br/><br/><br/><br/><div style="text-align: left;font-size:14px;">' +
        JSON.stringify(testPod) + '</div><br/><br/><br/><br/>' +
        'View it live: <a href="https://undercovercast.com/test.rss">undercovercast.com/test.rss</a></div>');
});

app.get('/adminGo', function (req, res) {
    var q = req.query.q || null;

    if (q) {
        if (q == '666beast') {
            adminAuth = true;
            res.redirect('/admin');
        } else res.redirect('/admin?r=1');
    }
});

app.use(express.static('public'));

app.listen(port);