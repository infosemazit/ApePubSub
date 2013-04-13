Ape.registerHookCmd("CONNECT", function(params, cmd){
	//IMPORTANT! create channels property
	cmd.user.channels = {};
	
	if(!params) return 1;
	
	if(params.user){
		var user = params.user;
		if(typeof user.name == "string"){
			//Check for valid name
			if(user.name.length > APS.option.userNameMaxLength || APS.option.userNameRegex.test(user.name)) return ["006", "BAD_NAME"];
			//Check if name is unique
			if(Ape.getUserByName(user.name)) return ["007", "NAME_USED"];
		}
		
		//Add public user properties
		cmd.user.prop(user);
	}
	
	return 1;
});
