const Discord = require('discord.js');
const { Client, RichEmbed } = require('discord.js');
const client = new Discord.Client();
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");
require("firebase/messaging");
require("firebase/functions");
var trm
var testChannel;
var generalChannel;

var config = {
    apiKey: "AIzaSyAGEocA--QwvzGX2zdy5j_iX6xRvpV9irg",
    authDomain: "harpbot.firebaseapp.com",
    databaseURL: "https://harpbot.firebaseio.com/",
    storageBucket: "harpbot.appspot.com"
  };
 firebase.initializeApp(config);

 var database = firebase.database();

function writeUserData(userId, name, jointime) {
  	firebase.database().ref('users/' + userId).set({
    	username: name,
    	joinTime: jointime,
    	totalTime: 0
  	});
  	testChannel.send("Data for new user " + name + " set. Details: " + name + " / " + jointime);
}

function startTimeCount (userID) {
	var currentTime = new Date();
	firebase.database().ref('/users/' + userID).once('value').then(function(snapshot) {
  		var username = (snapshot.val() && snapshot.val().username) || 'nonexist';
  		if (username == "nonexist") {
  			writeUserData(userID, trm.members.get(userID).user.username, Date.parse(currentTime));
  		} else {
  			var userRef = firebase.database().ref('users/' + userID);
			userRef.update({ joinTime: Date.parse(currentTime)} );
			testChannel.send("Updated jointime for user " + trm.members.get(userID).nickname + " at " + currentTime + " (" + Date.parse(currentTime) + ").");
		}
	});
	
};

function endTimeCount (userID) {
	firebase.database().ref('/users/' + userID).once('value').then(function(snapshot) {
  		var username = (snapshot.val() && snapshot.val().username) || 'nonexist';
  		var joinTime = (snapshot.val() && snapshot.val().joinTime) || 0;
  		var totalTime = (snapshot.val() && snapshot.val().totalTime) || 0;
  		if (username == "nonexist") {
  			writeUserData(userID, trm.members.get(userID).user.username);
  		}
  		if (joinTime != 0) {
  			var currentTime = new Date();
			var timeToAdd = Date.parse(currentTime) - joinTime;
			var newTotalTime = timeToAdd + totalTime;
			var userRef = firebase.database().ref('users/' + userID);
			userRef.update({ totalTime: newTotalTime, joinTime: 0});
			testChannel.send("Updated total time for user " + trm.members.get(userID).nickname + " adding " + timeToAdd + ". Now " + newTotalTime + ".");
  		} else {
  			testChannel.send("Total time for user " + trm.members.get(userID).nickname + " not updated as jointime was 0.");
  		}
	});
};

client.on('ready', () => {
  	console.log(`Logged in as ${client.user.tag}!`);
  	trm = client.guilds.get("330334624687325185")
  	testChannel = trm.channels.get("386041022800723969");
  	generalChannel = trm.channels.get("501367471043772416");
  	firebase.database().ref('/users').once('value').then(function(snapshot) {
  		var currentTime = new Date()
  		snapshot.forEach(function(userSnapshot) {
  			var userRef = firebase.database().ref('users/' + userSnapshot.key);
  			if (trm.members.get(userSnapshot.key).voiceChannel && !trm.members.get(userSnapshot.key).deaf && trm.members.get(userSnapshot.key).voiceChannelID != "347376453459116032") {
  				userRef.update({ joinTime: Date.parse(currentTime) });
  				testChannel.send("Bot init: Jointime for user " + trm.members.get(userSnapshot.key).nickname + " set to " + currentTime + " (" + Date.parse(currentTime) + ").");
  			} else {
  				userRef.update({ joinTime: 0 });
  				testChannel.send("Bot init: Jointime for user " + trm.members.get(userSnapshot.key).nickname + " set to 0");
  			}
  		});
	});
  });

client.on('message', msg => {
  if (msg.content.startsWith("!")) {
    var params = msg.content.substring(1).split(" ");
    var cmd = params[0];
    switch (cmd) {
    	case "info":
    		const embed = new RichEmbed()
    		.setAuthor("harpbot", "https://i.imgur.com/s2TGDT7g.jpg")
    		.setColor('RED')
    		.setDescription("i am a HARPBOT noobs");
    		msg.channel.send(embed);
    		break;
    	case 'game':
    		if (!msg.member.roles.has("453205099725062144")) {
  				msg.channel.send("not cabinet la noob nice try");
  				return;
  			}
  			else {
  				if (!msg.member.voiceChannel) {
  					msg.channel.send("can u get in channel first autistic kid");
  				} else {
  					var channelUsersCount = msg.member.voiceChannel.members.array().length;
  					if (params[1] == null) {
  						msg.channel.send("hi " + msg.member.nickname + " can u actually specify a game u fuck"); 	
  					} else if (params[1] == "ow") {
  						msg.channel.send("<@&453191462918684672> " + msg.member.nickname + " wants to play OVERWATCH now autism got " + channelUsersCount + " person(s) inside come now"); 
  					} else if (params[1] == "mc") {
  						msg.channel.send("<@&502508844690178058> " + msg.member.nickname + " wants to play BLOCKGAME now autism got " + channelUsersCount + " person(s) inside come now");  
  					}
  				}		
  			}
  			break;
  		case 'time':
  			firebase.database().ref('/users/' + msg.author.id).once('value').then(function(snapshot) {
  				var totalTime = (snapshot.val() && snapshot.val().totalTime) || 0;
  				var hours = Math.floor(totalTime / 3600000);
  				var minutes = Math.floor((totalTime - hours * 3600000)/60000);
  				var seconds = (totalTime % 60000)/1000;
  				msg.channel.send("The total time " + msg.member.nickname + " has spent in voice channels is " + hours + " hours, " + minutes + " minutes and " + seconds + " seconds.");
  			});
  			break;
  		//beyond here are admin/legacy commands
  		case 'setupdb':
			writeUserData(msg.author.id, msg.author.username);
			break;
		case 'readdb':
			firebase.database().ref('/users/' + params[1]).once('value').then(function(snapshot) {
  				var username = (snapshot.val() && snapshot.val().username) || 'nonexist';
  				console.log(username);
			});
			break;
		case 'whatsthedate':
			var dateee = new Date();
			msg.channel.send(Date.parse(dateee));
			break;
    }
  }
});

client.on("voiceStateUpdate", function (oldMember, newMember) {
	var vcid = newMember.voiceChannelID;
	var vcidOld = oldMember.voiceChannelID;
	if (!vcidOld || oldMember.deaf == true && newMember.deaf == false || vcidOld == "347376453459116032" && vcid != "347376453459116032") {
		if (newMember.deaf == true || vcid == "347376453459116032" || !vcid) return;
		startTimeCount(newMember.id);
		generalChannel.send(newMember.nickname + " has joined the voice channel.", {tts: true});
	}
	if (!vcid || oldMember.deaf == false && newMember.deaf == true || vcidOld != "347376453459116032" && vcid == "347376453459116032") {	
		if (vcidOld == "347376453459116032") return;
		endTimeCount(newMember.id);
		generalChannel.send(newMember.nickname + " has ragequit the voice channel.", {tts: true});
	}
});

client.login('Mzg2MDM5NDU0Mjk4NTM3OTg0.DisJXQ.A9J-jAESLo16K3Zs1uDhGdjM2sE');