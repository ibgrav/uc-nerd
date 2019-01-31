var upNewBtn = document.getElementById('up-new-btn');
var upExBtn = document.getElementById('up-ex-btn');

var upNewBox = document.getElementById('up-new-box');
var upExBox = document.getElementById('up-ex-box');

var upExSubmit = document.getElementById('up-ex-submit-btn');


var testPod = {};

var getJSON = function (url, successHandler, errorHandler) {
    var xhr = typeof XMLHttpRequest != 'undefined' ?
        new XMLHttpRequest() :
        new ActiveXObject('Microsoft.XMLHTTP');
    xhr.open('get', url, true);
    xhr.onreadystatechange = function () {
        var status;
        var data;
        if (xhr.readyState == 4) { // `DONE`
            status = xhr.status;
            if (status == 200) {
                data = JSON.parse(xhr.responseText);
                successHandler && successHandler(data);
            } else {
                errorHandler && errorHandler(status);
            }
        }
    };
    xhr.send();
};

getJSON('/test/json', function (data) {
    console.log('Get success: ', data);
    testPod = data;

    var updateHTML = '';
    updateHTML = '<div class="ex-pod-select-box"><select id="ex-pod-select"><option value="" disabled="" selected="" hidden="hidden">Select Podcast to Edit:</option>';

    for (var i = 0; i < testPod.item.length; i++) {
        updateHTML += '<option value="' + i + '">' + i + ': ' + testPod.item[i].title + '</option>';
    }

    updateHTML += '</select></div>';

    document.getElementById('up-ex-select-in').innerHTML += updateHTML;

    var exPodSelect = document.getElementById('ex-pod-select');
    exPodSelect.addEventListener('change', function () {
        this.classList.add('select-move-up');
        document.getElementById('up-ex-select-box').classList.add('select-move-up');
    });

    var nameSuggestion = 'Should probably be titled: ' + testPod.item.length + '.mp3';

    document.getElementById('name-suggestion').innerHTML = nameSuggestion;
}, function (status) {
    console.log('Something went wrong.');
});

getJSON('/s3-all', function (data) {
    console.log('Get success: ', data);
}, function (status) {
    console.log('Something went wrong.');
});

upNewBtn.onclick = () => {
    document.getElementById('up-new-box').classList.add('expand-form-box');
    document.getElementById('up-ex-box').classList.remove('expand-form-box');
});
upExBtn.onclick = () => {
    document.getElementById('up-new-box').classList.remove('expand-form-box');
    document.getElementById('up-ex-box').classList.add('expand-form-box');
});

document.getElementById("myFile").onclick = () => {
    const files = document.getElementById('myFile').files;
    const file = files[0];
    if (file == null) {
        return alert('No file selected.');
    }
    getSignedRequest(file);
};

function getSignedRequest(file) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                uploadFile(file, response.signedRequest, response.url);
            } else {
                alert('Could not get signed URL.');
            }
        }
    };
    xhr.send();
}

function uploadFile(file, signedRequest, url) {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedRequest);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(url);
            } else {
                alert('Could not upload file.');
            }
        }
    };
    xhr.send(file);
}

upExSubmit.addEventListener('click', function () {
    var item = document.getElementById('ex-pod-select').value;
    var title = document.getElementById('item-title').value;
    var description = document.getElementById('item-desc').value;
    var pubDate = document.getElementById('item-pubDate').value;
    var author = document.getElementById('item-author').value;
    var link = document.getElementById('item-link').value;
    var duration = document.getElementById('item-duration').value;
    var explicit = document.getElementById('item-explicit').value;
    var guid = document.getElementById('item-guid').value;
    var enclosure = document.getElementById('item-enclosure').value;

    window.location.replace('https://undercovercast.com/admin/send?item=' + item + '&title=' + title +
        '&description=' + description + '&pubDate=' + pubDate + '&author=' +
        author + '&link=' + link + '&duration=' + duration + '&explicit=' +
        explicit + '&guid=' + guid + '&enclosure=' + enclosure);
});