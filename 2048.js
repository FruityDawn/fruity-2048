const Discord = require("discord.js");
const config = require("./config"); 
const Game = require("./game.js")
const version = "1.00";

var cmd = config.prefix;

const client = new Discord.Client();

var currentGames = new Map();
var overrideCurrent = new Set();

// emojis
const left = config.left;
const right = config.right;
const up = config.up;
const down = config.down;

const directions = [left, right, up, down];

var edit = config.edit; // edit previous boards or send new ones
var manualcmds = config.disableManualCmds; // allow manual commands (like !left)

client.on("ready", () => {
  console.log("Fruity2048 " + version + " loaded!");
});

client.on("message", (message) => {

  // no bots
  if (message.author.bot) {
  	return;
  }

  // create new game
  if (message.content.startsWith(cmd + "2048 new")) {
    if (currentGames.get(message.author.id)) {
      // if user has a current game, make sure they want to override
      if (!overrideCurrent.has(message.author.id)) {
        overrideCurrent.add(message.author.id);
        message.reply("You already have a game in progress!\n"
                    + "Type the command again if you are sure you want to override it,\n"
                    + "or type !2048 continue to resume playing.");
        return;
      }
    }

    overrideCurrent.delete(message.author.id);

    // make game
    currentGames.set(message.author.id, new Game(message.author));
    let g = currentGames.get(message.author.id);
    message.channel.send(g.drawBoard())
      .then(m => {
        g.setMsg(m);
        reactAll(m);
      })
      .catch(console.error);
  
    return;
  }

  // user has sent another message that isn't !2048 new again
  overrideCurrent.delete(message.author.id);


  // help
  if (message.content.startsWith(cmd + "2048 help")) {
    message.channel.send("`2048 by FruityDawn`\n"
                       + "Use !2048 new to start a new game!");
  }

  // continue (resend game)
  if (message.content.startsWith(cmd + "2048 continue")) {
    let g = currentGames.get(message.author.id);
    if (g != null) {
      message.channel.send(g.drawBoard())
      .then(m => {
        g.setMsg(m);
        reactAll(m);
      })
      .catch(console.error);   
    } else {
      message.reply("No game to continue.\n"
                  + "Use !2048 new to start one!");
    }
    return;
  }

  // ignore manual commands if they are disabled
  if (manualcmds) {
    return;
  }

  /* movement */
  if(message.content.startsWith(cmd + "left")) {
    var g = currentGames.get(message.author.id);
    if (g != null) {
      tryLeft(g, message.channel);
    }
    return;
  }

  if(message.content.startsWith(cmd + "right")) {
    var g = currentGames.get(message.author.id);
    if (g != null) {
      tryRight(g, message.channel);
    }
    return;
  }

  if(message.content.startsWith(cmd + "up")) {
    var g = currentGames.get(message.author.id);
    if (g != null) {
      tryUp(g, message.channel);
    }
    return;
  }

  if(message.content.startsWith(cmd + "down")) {
    var g = currentGames.get(message.author.id);
    if (g != null) {
      tryDown(g, message.channel);
    }
    return;
  }

}); // end client on message

/* reaction controls */
client.on("messageReactionAdd", (reaction, user) => {

  // no bots
  if (user.bot) {
    return;
  }

  let g = currentGames.get(user.id);

  if (g) {
    if (reaction.message.id == g.msg.id) {

      if (directions.includes(reaction.emoji.name)) {

        if (reaction.emoji.name == left) {
          tryLeft(g, reaction.message.channel);
        }

        if (reaction.emoji.name == down) {
          tryDown(g, reaction.message.channel);
        }

        if (reaction.emoji.name == up) {
          tryUp(g, reaction.message.channel);
        }

        if (reaction.emoji.name == right) {
          tryRight(g, reaction.message.channel);
        }

      // try remove reactions
      if (edit) {
          try {
            reaction.remove(user);
          } catch (e) {
            console.log("Need manage messages permission");
         }
      }
     
      }
    }
  }

}); // end client on react

// 0: left 1: right 2: up 3: down
/* movement functions */
function tryLeft(g, channel) {
  if (g.possibleNext.includes(0)) {
    g.left();
    handleAfterMovement(g, channel);
  }
  return;
}

function tryRight(g, channel) {
  if (g.possibleNext.includes(1)) {
    g.right();
    handleAfterMovement(g, channel);
  }
  return;
}

function tryUp(g, channel) {
  if (g.possibleNext.includes(2)) {
    g.up();
    handleAfterMovement(g, channel);
  }
  return;
}

function tryDown(g, channel) {
  if (g.possibleNext.includes(3)) {
    g.down();
    handleAfterMovement(g, channel);
  }
  return;
}

function handleAfterMovement(g, channel) {
  if (edit & g.msg.channel == channel) {
      g.msg.edit(g.drawBoard());
  } else {
        channel.send(g.drawBoard())
          .then(m => {
                g.setMsg(m);
                reactAll(m);
                })
          .catch(console.error);
    }

  // check game status
  if (g.win) {
    channel.send("You win <@" + g.user.id + ">!");
    currentGames.delete(g.user.id);
  }

  if (g.lose) {
    channel.send("You lose <@" + g.user.id + ">!");
    currentGames.delete(g.user.id);
  }
}

function reactAll(message) {
  try {
    // apologies... no async in this version of node
    // keeps reactions in same order
    // i'm not sure if the catch will work this way, but
    // i really don't want to write 4 of them...
    message.react(left)
      .then (x => {
            message.react(down)
              .then (x => {
                message.react(up)
                  .then (x => {
                    message.react(right)
                  });
              });
      });

  } catch (e) {
    console.log("Can't react to messages")
  }
}

client.login(config.token);