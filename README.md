# firesnaggle

What's that? You have a website URL. And you need, what, a screenshot (and
the HTML) of said website at mobile width in Firefox? Well, gee golly, no
look no further! Snaggle up with firesnaggle™ today!

This tool is made possible by the fantastic [slimerjs](http://slimerjs.org/)
library.


## Installation

* `npm install`
* `cp settings_local.js.dist settings_local.js`
* `nodemon app.js`
* `./install-packages.sh`


## Deployment

To deploy to stackato:

    stackato push --no-prompt


## Sample Usage

### Get a screenshot

#### `POST`

    curl -X POST 'http://localhost:5000/screenshot'
        -d 'width=320&height=480&delay=5000&url=http://www.mysnuggiestore.com'
        -H 'Accept: image/gif,image/png'

#### `GET`

    curl 'http://localhost:5000/screenshot?width=320&height=480&delay=5000&url=http://www.mysnuggiestore.com'
        -H 'Accept: image/gif,image/png'

#### Render in a browser

Fire up [http://localhost:5000/static/demo.html](http://localhost:5000/static/demo.html)

### Delete a screenshot

#### `DELETE`

    curl -iX DELETE 'http://localhost:5000/screenshot?url=http://www.mysnuggiestore.com'
        -H 'Accept: image/gif,image/png'

### Get the HTML

To get the resulting HTML after the JS has been loaded:

#### `GET`

    curl 'http://localhost:5000/html?delay=5000&url=http://www.mysnuggiestore.com'

#### `DELETE`

    curl -X DELETE 'http://localhost:5000/html?url=http://www.mysnuggiestore.com'

### Get the HTML, page title, and final URL

To get the resulting HTML, page title, and final URL after the JS has been loaded:

#### `GET`

    curl 'http://localhost:5000/json?delay=5000&url=http://www.mysnuggiestore.com'

#### `DELETE`

    curl -X DELETE 'http://localhost:5000/json?url=http://www.mysnuggiestore.com'
