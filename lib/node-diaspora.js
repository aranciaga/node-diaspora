var request = require('request'),
	createReadStream = require('fs').createReadStream,
	basename = require('path').basename;


function Diaspora(options){

	if (!options || !options.user || !options.password || !options.pod)
		throw new Error("User, password and pod are necessary.");

	this.username   = options.user;
	this.password   = options.password;
	this.pod        = options.pod;
	this.share_url  = '/status_messages';
	this.image_url  = '/photos';
	this.login_url  = '/users/sign_in';
	this.j          = request.jar();
	this.request    = request.defaults({ jar: this.j });

}

Diaspora.prototype.connect = function(callback){

	var self = this;

	this.getFormData(function(cookie, token){

		self.login(token, function(res, message){

			if(!message) message = "User or password incorrect.";
			if(res=="200 OK") callback(new Error(message), message);
			if(res=="302 Found") callback(null, "Login has been successful.");

		});

	});

}

Diaspora.prototype.login = function(token, callback){

	var self = this;

	this.request.post(this.pod+this.login_url, {
		form:{
			'user[username]': self.username,
			'user[password]': self.password,
			'user[remember_me]': 1,
			'utf8': '✓',
			'authenticity_token': token
		}
	}, function(err, res) {

		// Message example:
		//<div id="flash_alert"><div class="message">Invalid email or password.</div></div>
		var message = res.body.match('id="flash_alert"[^>]*>(.*?)</div>');
		if (message) message = message[1].replace(/<[^>]*>/, '');
		else message = null;
		if(err) throw new Error(err.code);
		callback(res.headers.status, message);

	});

}

Diaspora.prototype.getFormData = function(callback){

	var self = this;

	this.request.get(this.pod+this.login_url, function(err, res){

		if(err) throw new Error(err.code);
		callback(
			res.headers['set-cookie'][0].split(";")[0],
			res.body.match('<input[^>]* name="authenticity_token"[^>]* value="(.*)"')[1]
		);

	});

}

Diaspora.prototype._postStatusMessage = function(cookie, xcsrf_token, msg, aspect, photos, callback){

	var self = this, form = { 'status_message[text]': msg, 'aspect_ids': aspect };

	if ('function' !== typeof callback && 'function' === typeof photos) {
		callback = photos;
		photos = false;
	}

	if (photos) {
		form.photos = photos;
	}

	self.request.post(self.pod+self.share_url, {

		form: form,
		headers: {
			'content-type' :  'application/json',
			'accept'       :  'application/json, text/javascript',
			// 'cookie'       :  cookie, // handle by this.j (request cookie jar)
			'x-csrf-token' :  xcsrf_token
		}
	}, function(err, res) {
		if(err) throw new Error(err.code);
		callback(null, JSON.parse(res.body));
	});


}



Diaspora.prototype.postStatusImage = function(imageFilename, callback){

	var self = this;

	this.getFormData(function(cookie, xcsrf_token){
		self._postStatusImage(cookie, xcsrf_token, imageFilename, callback);
	});
}


Diaspora.prototype._postStatusImage = function(cookie, xcsrf_token, imageFilename, callback){

	var self = this;

	createReadStream(imageFilename)
	.pipe(self.request.post({
		url: self.pod+self.image_url,
		qs: {
			'photo[pending]': true,
			qqfile: basename(imageFilename)
		},
		headers: {
			'content-type' :  'application/octet-stream',
			'accept'       :  'application/json, text/javascript',
			'x-csrf-token' :  xcsrf_token
		}},
		function(err, res) {
			if(err) { throw new Error(err.code); }
			callback(null, JSON.parse(res.body));
		})
	);
}


Diaspora.prototype.postStatusMessage = function(msg, aspect, imageFilename, callback){

	var self = this;

	// Since adding an argument would change our API
	// we're handling the case here with an option image argument
	// and counting on the fact that callback is the only function.
	if ('function' !== typeof callback && 'function' === typeof imageFilename) {
		callback = imageFilename;
		imageFilename = false;
	}

	this.getFormData(function(cookie, xcsrf_token){
		if (imageFilename) {
			self._postStatusImage(cookie, xcsrf_token, imageFilename, function(err, photos) {
				self._postStatusMessage(cookie, xcsrf_token, msg, aspect, photos.data.photo.id, callback);
			});
		} else {
			self._postStatusMessage(cookie, xcsrf_token, msg, aspect, callback);
		}
	});
}


Diaspora.prototype.delete = function(url, callback){

	var self = this;

	this.getFormData(function(cookie, xcsrf_token){

		self.request.del(this.pod+url, {
			headers: {
				'content-type' :  'application/json',
				'accept'       :  'application/json, text/javascript',
				'x-csrf-token' :  xcsrf_token,
				'cookie'       :  cookie
			}
		}, function(err, res) {
			if(err || res.headers.status=="404 Not Found"){

				if(!err) throw new Error("Cannot delete: "+url);
				else     throw new Error(err.code);

			}
		});

	});
}

Diaspora.prototype.get = function(get_url, callback){

	this.request.get(this.pod+get_url+'.json', function(err, res){
		if(err) throw new Error(err.code);
		callback(JSON.parse(res.body));
	});

}


module.exports = Diaspora;
