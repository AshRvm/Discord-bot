const Discord = require("discord.js");
const {
    prefix,
    token,
} = require("./config.json");
const ytdl = require('ytdl-core');

const client = new Discord.Client();
const queue = new Map();
const scoreboard = new Map();
const session = new Object();
var songCount = 0;

client.on("ready", () => {
    console.log("Connected as " + client.user.tag);

    // custom : playing with " "
    client.user.setActivity("MONKE", {type: "PLAYING"})

    // client.guilds.cache.forEach((guild) => {
    //     console.log(guild.name);
    //     guild.channels.cache.forEach((channel) => {
    //         console.log(` - ${channel.name} ${channel.type} ${channel.id}`);
    //         // general text: 855354764086738947
    //         // general voice: 855354764086738948
    //         // test_voice: 861338306213969961
    //         // test_text1: 861338248876916797
    //         // test_text2: 861640261674074163
    //     })
    // })

    let generalChannel = client.channels.cache.get("799531519051038760");
    
    // const attachment = new Discord.MessageAttachment("fubuki(7).jpg");
    // generalChannel.send("Hello World !");
    // generalChannel.send(attachment);

    // generalChannel.send("Hello world !", {files: ["./fubuki(6).gif"]})

    // animeNakame contest channels id 799531519051038760
    // animeNakama vc id 799531675314946109
    let vc = client.channels.cache.get("799531675314946109");
    for(const [memberID, member] of vc.members){
        // console.log(`${member.user.tag}`);
        scoreboard.set(member.displayName, 0);
    }
})

client.on("message", async recievedMessage => {
    if(recievedMessage.author == client.user) return;
    if(!recievedMessage.content.startsWith(prefix)) return;
    // recievedMessage.channel.send("Message recieved, " + recievedMessage.author.toString() + ": " + recievedMessage.content);

    const serverQueue = queue.get(recievedMessage.guild.id);

    if(recievedMessage.content.startsWith(`${prefix}play`)){
        execute(recievedMessage, serverQueue);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}help`)){
        help(recievedMessage);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}startSession`)){
        createSession(recievedMessage, session);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}endSession`)){
        deleteSession(recievedMessage, session);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}sb`)){
        showScoreboard(recievedMessage);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}updatesb`)){
        updateScoreboard(recievedMessage);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}add`)){
        updateScoreboard(recievedMessage);
        addPoints(recievedMessage, session);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}bonus`)){
        addBonus(recievedMessage);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}cancelGacha`)){
        sellTicket(recievedMessage, session);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}settings`)){
        displaySettings(recievedMessage, session);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}gacha`)){
        gacha(recievedMessage, session);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}disconnect`)){
        disconnect(recievedMessage, serverQueue);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}skip`)){
        skip(recievedMessage, serverQueue);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}current`)){
        current(recievedMessage, serverQueue);
        return;
    }else if(recievedMessage.content.startsWith(`${prefix}queue`)){
        showQueue(recievedMessage, serverQueue);
        return;
    }else{
        recievedMessage.channel.send("Invalid command, please try again");
        return;
    }
})

//***************************************************FUNCTIONS****************************************************************//

var getRandomInteger = function(max){
	return Math.floor(Math.random() * max);
}

function help(message){
    const channel = message.channel;
    var sessionText = "**?startSession** **<r>** **<e>** **<m>** **<h>** **gacha**(optional) to create a new session \nr => number of songs per round\ne => easy round points\nm => medium round points\nh => hard round points\nExample: ?startSession 2 1 2 3 gacha\n\n";
    var gacha = "Gacha odds: **1%** for **h**, **9%** for **m**, **20%** for **e**, **69%** for **(-e)**, **1%** for **score reset**\nCan be sold for **e** points\nThese points will be added along with the normal round points\nExample:   ?add ?<p1> ?<p2>\n\t\t\t\t\t?gacha ?<p1>\n\n";
    var play = "**?play** **<song_link>** to add a song to the playlist (Can't add entire playlists as a whole)\n";
    var skip = "**?skip** to skip to the next song\n\n";
    var current = "**?current** for the name of currently playing song\n\n";
    var queue = "**?queue** for the playlist of songs\n\n";
    var gachaAdd = "**?gacha** **?<player name>** for gacha roll\n";
    var gachaSell = "**?cancelGacha** **?<player name>** for avoiding the gacha roll ~~like a pussy~~ and gain **e** points\n\n";
    var add = "**?add** **<player name1>**(optional) **?<player name2>**(optional) for awarding points\nIf **no one guessed** the song, please enter **?add**\n\n";
    var bonus = "**?bonus** **?<player name>** **?<points>** to award extra points besides the normal round points, like for rounds with VA/seasons or bonus round in between the normal rounds\n\n";
    var settings = "**?settings** to view the point allocation of this session and whether gacha is included or not\n\n";
    var sb = "**?sb** to display the scoreboard\n";
    // var usb = "**?updatesb** ~~serves no purpose now~~\n\n";
    var note1 = "**NOTE1** Please check in advance whether the song can be played or not\n\n";
    var note2 = "**NOTE2** The counter used to keep track of the points system is the **?add** command, (i.e) after **<r>** ?add commands, the points awarded will be increased\n\n"
    var note3 = "**NOTE3** The songs are looped and will only move to the next song with the **?skip** command. If no other song is in the queue, the ?skip command replays the currently playing song\n\n";
    var note4 = "**NOTE4** The last song will loop if no other songs are added before it ends. Can be stopped with the **?disconnect** command\n\n";
    var note5 = "**NOTE5** New players joining the voice channel will automatically be added to the scoreboard. (Done with the ?add command, but don't worry about it)" 
    channel.send(sessionText + gacha + play + skip + current + queue + gachaAdd + gachaSell + add + bonus + settings + sb + note1 + note2 + note3 + note4 + note5);
}

async function execute(recievedMessage, serverQueue){
    updateScoreboard(recievedMessage);
    const args = recievedMessage.content.split(" ");

    const voiceChannel = recievedMessage.member.voice.channel;
    if(!voiceChannel) return recievedMessage.channel.send("You need to be in a voice channel to play music!");

    const permissions = voiceChannel.permissionsFor(recievedMessage.client.user);
    if(!permissions.has("CONNECT") || !permissions.has("SPEAK")){
        return recievedMessage.channel.send("I need permission to join and speak in the vc!");
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    };

    if(!serverQueue){
        const queueConstruct = {
            textChannel: recievedMessage.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            skip: false
        };

        queue.set(recievedMessage.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try{
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(recievedMessage.guild, queueConstruct.songs[0]);
        }catch(err){
            console.log(err);
            queue.delete(recievedMessage.guild.id);
            return recievedMessage.channel.send(err);
        }

    }else{
        serverQueue.songs.push(song);
        return recievedMessage.channel.send(`${song.title} has been added!`);
    }
}

function createSession(message, session){
    const voiceChannel = message.member.voice.channel;
    const args = message.content.split(" ");
    const diffPoints = {
        easy: parseInt(args[2]),
        med: parseInt(args[3]),
        hard: parseInt(args[4])
    };
    // console.log(session);
    if(!session.points){
        session.points = diffPoints;
        session.currentPoint = diffPoints.easy;
        session.songsPerRound = parseInt(args[1]);
        if(args[5] == "gacha") session.gacha = true;
        songCount = 0;
        displaySettings(message, session);
    }else{
        message.channel.send(`A session is already in progress. To view details, please enter ${prefix}settings.`);
    }
    // message.channel.send(`points are: ${session.points.easy},${session.points.med},${session.points.hard}`);
    return;
}

function deleteSession(message, session){
    delete session.points;
    message.channel.send("The current session has ended");
    return;
}

function updateScoreboard(message){
    if(!message.member.voice.channel) return message.channel.send("You need to be in a voice channel to view the scoreboard")
    else{
        for(const [memberID,member]  of message.member.voice.channel.members){

            if(!scoreboard.has(member.displayName)){
                scoreboard.set(member.displayName, 0);
                // message.channel.send(`Added ${member.displayName}`);
            }
        }
        scoreboard.delete("Sukon");
    }
}

function addPoints(message, session){
    const args = message.content.split(`${prefix}`);
    const name2 = args[3];
    if(name2 != undefined) var name1 = args[2].slice(0,-1);
    else var name1 = args[2];
    const points = session.currentPoint;
    // console.log(`This is name1: ${name1}blah`);
    // console.log(`This is name2: ${name2}blah`);
    
    if(name2 != undefined){
        if(!scoreboard.has(name1) || !scoreboard.has(name2)) return message.channel.send("Invlid names, please check again, or try updating scoreboard");
        scoreboard.set(name1, scoreboard.get(name1) + points);
        scoreboard.set(name2, scoreboard.get(name2) + points);
    }else if(name1 != undefined){
        if(!scoreboard.has(name1)) return message.channel.send("Invalid name, please try again");
        scoreboard.set(name1, scoreboard.get(name1) + points);
    }
    
    songCount++;
    if(songCount == session.songsPerRound) session.currentPoint = session.points.med;
    if(songCount == session.songsPerRound * 2) session.currentPoint = session.points.hard;
}

function addBonus(message){
    const args = message.content.split(`${prefix}`);
    var name = args[2].slice(0,-1);
    const points = args[3];
    // console.log(`name: ${name}blah`);
    if(!scoreboard.has(name)) return message.channel.send("Invalid name, please try again");
    if(!points) return message.channel.send("Please enter the bonus points to be awarded as well");
    scoreboard.set(name, scoreboard.get(name) + parseInt(points));
}

function sellTicket(message, session){
    const args = message.content.split(`${prefix}`);
    const name = args[2];
    if(!name) return message.channel.send("Please enter a name");
    if(!scoreboard.get(name)) return message.channel.send("Please enter a valid name");
    scoreboard.set(name, scoreboard.get(name) + session.points.easy);
}

function displaySettings(message, session){
    if(!session.points) return message.channel.send("No session in progress");
    message.channel.send(`Number of songs per round: ${session.songsPerRound}`);
    message.channel.send(`Points for easy round: ${session.points.easy}`);
    message.channel.send(`Points for medium round: ${session.points.med}`);
    message.channel.send(`Points for hard round: ${session.points.hard}`);
    if(!session.gacha) message.channel.send(`Gacha not included`);
    else message.channel.send(`Gacha included`);
}

function gacha(message, session){
    if(!session.gacha) return message.channel.send("Gacha is not included in this session");
    session.gache = true;
    const args = message.content.split(`${prefix}`);
    const name = args[2];
    if(!scoreboard.has(name)) return message.channel.send("Invalid name, please try again");
    const randomNum = getRandomInteger(100);
    var bonus = 0;
    if(randomNum == 0){
        bonus = session.points.hard;
        message.channel.send(`Congratulations! ${name} won ${bonus} points!`);
    }else if(randomNum == 99){
        bonus = -scoreboard.get(name);
        message.channel.send(`LMAO! ${name} just lost all his points kekw!`);
    }else if(randomNum%10 == 0){
        bonus = session.points.med;
        message.channel.send(`Congratulations! ${name} won ${bonus} points!`);
    }else if((randomNum%10 == 3) || (randomNum%10 == 7)){
        bonus = session.points.easy;
        message.channel.send(`Congratulations! ${name} won ${bonus} points!`);
    }else{
        bonus = -session.points.easy;
        message.channel.send(`HeHe boi! ${name} just lost ${-bonus} points!`);
    }
    scoreboard.set(name, scoreboard.get(name) + bonus);
}

function showScoreboard(message){
    if(scoreboard.size != 0){
        for(const [member, score] of scoreboard){
            message.channel.send(`${member}: ${score}`)
        }
    }else{
        message.channel.send("Scoreboard not created yet");
    }
}

function disconnect(message, serverQueue){
    serverQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
}

function skip(message, serverQueue) {
    if(!message.member.voice.channel) return message.channel.send("You have to be in a voice channel to stop the music!");
    if(!serverQueue) return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
    serverQueue.skip = true;
}

function current(message, serverQueue){
    if(!message.member.voice.channel) return message.channel.send("You have to be in voice channel");
    if(!serverQueue) return message.channel.send("Playlist not created yet");
    if(!serverQueue.songs[0]) return message.channel.send("No song playing now");
    return message.channel.send(`${serverQueue.songs[0].title}`);
}

function showQueue(message, serverQueue){
    if(!message.member.voice.channel) return message.channel.send("You have to be in voice channel");
    if(!serverQueue) return message.channel.send("No song playing now");
    for(const song of serverQueue.songs){
        message.channel.send(`${song.title}`);
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if(!song) return;
  
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            if((serverQueue.songs[1] != undefined) && (serverQueue.skip == true)){
                serverQueue.songs.shift();
                serverQueue.skip = false;
            }
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        // serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

// function processCommand(recievedMessage){
//     let fullCommand = recievedMessage.content.substr(1);
//     let splitCommand = fullCommand.split(" ");
//     let primaryCommand = splitCommand[0];
//     let arguments = splitCommand.slice(1);

//     if(primaryCommand == "help"){
//         recievedMessage.channel.send("un momento");
//     }
// }

client.login(token);
