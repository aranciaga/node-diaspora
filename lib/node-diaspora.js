var request = require('request');


function Diaspora(options){

	if (!options || !options.user || !options.password || !options.pod)
		throw new Error("User, password and pod are necessary.");
	
	this.username   = options.user;
	this.password   = options.password;
	this.pod        = options.pod;
	this.share_url = '/status_messages';
	this.login_url  = '/users/sign_in';
	this.j       = request.jar();
	this.request = request.defaults({ jar: this.j });

}

Diaspora.prototype.connect = function(callback){

	var self = this;

	this.getFormData(function(cookie, token){

		self.login(token, function(res){

			if(res=="200 OK") throw new Error("User or password incorrect.");
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

		if(err) throw new Error(err.code);
		callback(res.headers.status);

	});

}

Diaspora.prototype.getFormData = function(callback){

	var self = this;

	this.request.get(this.pod+this.login_url, function(err, res){

		if(err) throw new Error(err.code);
		callback(res.headers['set-cookie'][0].split(";")[0], res.body.match('<input name="authenticity_token" type="hidden" value="(.*)" />')[1]);

	});

}

Diaspora.prototype.postStatusMessage = function(msg, aspect, callback){

	var self = this;

	this.getFormData(function(cookie, xcsrf_token){
		
		self.request.post(self.pod+self.share_url, {

			form:{ 'status_message[text]': msg, 'aspect_ids': aspect },
			headers: {
				'content-type' :  'application/json',
				'accept'       :  'application/json, text/javascript',
				'x-csrf-token' :  xcsrf_token,
				'cookie'       :  cookie
			}
		}, function(err, res) {
			if(err) throw new Error(err.code);
			callback(null, "The status message has been posted.");
		});

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