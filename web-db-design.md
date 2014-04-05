Web database design concept
====================
SimpleDB Databases:

userdb = <username> : {
	password: (SHA1)
	defaultPrivacy: "public",
	email: "someEmail@some.com",
	fullname: "Joe Someone",
	lastLogin: "LastUpdateCheck",
	birthday: "",
	interests: "",
	affiliation: ""
}

postdb = <hash()> : {
	type: "status/image/share/wall",
	text: "TEXT",
	author: username,
	replies: <NUMBER>,
	likes: <NUMBER>,
	time: "00000001029292",
	pic: "Picture URL" (if status then is author's avatar, otherwise it is the thumbnail image)
	privacy: "public/friends/private",
	target: (Optional) username (for wall posts)
}

likedb = <username + ":" + postdbhash> : {
	time: <TIME>,
	author: <USER>,
	type: "LIKE"
}

replydb = <r + "_" + replyid()> : {
	parent : <postid>
	avatar: "" 
	text: ""
	author: 
	time: TIME
}

notifydb = <"notify_user" + ":" + nId> : {
	notification: {},
	owner: username,
	time: "00000001029292"<TIME>
}

frienddb = <username1 + ":" + username2> : {
	from: user
	to: user
}

recommenddb = <username1 + ":" + username2> : {
	user: username2,
	to: username1,
	order: <NUMERIC_VALUE>
}
