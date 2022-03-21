const Discord = require("discord.js");
const fs = require("file-system");

const {
  NotesManager,
} = require("./api-visunotes/api-VisuNotes-Toulouse3-master/index");
const { client } = require("./utils/client"); // Discord Client

const S2 = require("./logs.json").S2;
const CHANNEL_ID = require("./config.json").ANNONCE_CHANNEL;

const notesUpdater = function () {
  setTimeout(async () => {
    let myManager = new NotesManager(S2.LOGS, S2.PRE, S2.SUF);
    await myManager.loadNotes();

    if (fs.existsSync(`./${S2.LOGS[0]}.json`)) {
      let dataFromJSON = await myManager.JSONtoJS(`./${S2.LOGS[0]}.json`);
      if (!myManager.isEqual(dataFromJSON)) {
        let updateValues = myManager.isDifferent(
          dataFromJSON,
          myManager.getNotes()
        );

        myManager.toJSON();
        let prompt_channel = await client.channels.fetch(CHANNEL_ID);
        if (!prompt_channel) return;

        // Loop all around the new event and prompt them
        for (let i = 0; i < updateValues.length; i++) {
          let diff = updateValues[i];
          if (diff.state === "GRADE_ADDED") {
            let myEmbed = new Discord.MessageEmbed()
              .setTitle(`🆕 | Une nouvelle note est arrivée en ${diff.bloc} !`)
              .setURL("https://notes.info.iut-tlse3.fr/php/visuNotes.php")
              .addField("📝 | Libellé : ", diff.note.getLabel())
              .addField("📇 | Code évaluation : ", diff.note.getCode())
              .setThumbnail(
                "https://cdn.discordapp.com/attachments/579303130886569984/943414025256046622/unknown.png"
              )
              .setTimestamp()
              .setFooter({
                text: "Cliquez sur le titre pour atteindre VisuNote !",
              })
              .setColor("RANDOM");
            prompt_channel.send({ embeds: [myEmbed] });
          }
        }
      }
    } else {
      myManager.toJSON(myManager.getNotes());
    }

    notesUpdater();
  }, 1000 * 5);
};

exports.notesUpdater = notesUpdater;
