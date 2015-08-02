# node-diaspora
NodeJS wrapper for Diaspora v1.0 API

## Installation

To install node-diaspora, you can do it using NPM

  $ npm install node-diaspora

## Examples


Starter application

```
var Diaspora = require('node-diaspora');


var diasp = new Diaspora({
  user    : 'USER',
  password: 'PASSWORD',
  pod     : 'https://examplepod.com'
});

diasp.connect(function(err, suc){

  // CODE HERE


});

```

# Get stream

```
diasp.get('/stream', function(call){
  console.log(call);
});
```

# Post a status message
Replace :aspect with a aspect of Diaspora: Example: Work, public, all_aspects

```
diasp.postStatusMessage('Testing this new library', ':aspect', function(err, res){

});
```

You can also post an image with your status message.
Replace :image with the image file path.

```
diasp.postStatusMessage('Testing this new library', ':aspect', ':image', function(err, res){

});
```


# Get Activity

```
diasp.get('/activity', function(call){
  console.log(call);
});
```

# Get photos

```
diasp.get('/people/:profileid/photos', function(call){
  console.log(call);
});
```

# Get contacts

```
diasp.get('/contacts', function(call){
  console.log(call);
});
```

# Get post info and comments

```
diasp.get('/posts/:postid', function(call){
  console.log(call);
});
```

# Get tag posts

```
diasp.get('/tags/:tag', function(call){
  console.log(call);
});
```


# Delete post

```
diasp.delete('/posts/:postid', function(call){
  console.log(call);
});
```

## Bug reports
---

  * https://github.com/rainbowintheshell/node-diaspora/issues
  * rainbowtupperware at openmailbox dot org
