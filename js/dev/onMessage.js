APE.prototype.onMessage = function(data){
	//var data = data;
	try { 
		data = JSON.parse(data)
	}catch(e){
		this.check();
	}
	
	var cmd, args, pipe;
	for(var i in data){
		cmd = data[i].raw;
		args = data[i].data;
		pipe = null;
		clearTimeout(this.poller);
		
		this.log('>>>> ', cmd , " <<<< ", args);

		switch(cmd){
			case 'LOGIN':
				this.state = 1;
				this.user.sessid = args.sessid;
				this.session_id = args.sessid;
				this.trigger('ready');
				this.poll();
			break;
			case 'CHANNEL':
				pipe = new APE.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				var user;
				
				//import users from channel to client
				for(var i = 0; i < u.length; i++){
					user = this.pipes[u[i].pubid]
					if(!user){
						user = new APE.user(u[i], this);
						this.pipes[user.pubid] = user;
					}

					user.channels[pipe.pubid] = pipe;
					pipe.users[user.pubid] = user;
					
					//No Need to trigger this event
					//this.trigger('join', [user, pipe]);
				}
				
				//Add events from queue
				if(pipe.name in this.events._queue){
					var queue = this.events._queue[pipe.name];
					var ev, fn;
					for(var i in queue){
						ev = queue[i][0];
						fn = queue[i][1];
						
						pipe.on(ev,fn);
					}
				}
				
				pipe.trigger('joined',this.user, pipe);
				this.trigger('newChannel', pipe);
				
			break;
			case "PUBDATA":
				var user = this.pipes[args.from.pubid];
				pipe = this.pipes[args.pipe.pubid];
				
				pipe.trigger(args.type, [args.content, user, pipe]);
			break;
			case 'JOIN':
				var user = this.pipes[args.user.pubid];
				pipe = this.pipes[args.pipe.pubid];

				if(!user){
					user = new APE.user(args.user, this);
					this.pipes[user.pubid] = user;
				}
				
				//Add user's own pipe to channels list
				user.channels[pipe.pubid] = user;
				
				pipe.trigger('join', [user, pipe]);
			break;
			case 'LEFT':
				pipe = this.pipes[args.pipe.pubid];
				var u = this.pipes[args.user.pubid];
				delete u.channels[pipe.pubid];
				for(var i in u.channels){
					if(u.channels.hasOwnProperty(i)) delete this.pipes[args.user.pubid];
					break;
				}
				pipe.trigger('left', [u, pipe]);
			break;
			case 'IDENT':
				this.user = new APE.user(args.user, this);
				this.user.sessid = this.session_id;
				this.pipes[this.user.pubid] = this.user;
				
				this.poll();
			break;
			case 'ERR' :
				if(this.transport.id == 0 && cmd == 'ERR' &&(args.code > 100 || args.code == "001")) this.check();
				else if(cmd == 'ERR' && args.code < 100) clearTimeout(this.poller);
			break;
		}

		if(this.transport.id == 0 && cmd != 'ERR' && this.transport.state == 1){
			this.check();
		}

		//this.trigger('message', [cmd, args, pipe]);
	}
}
