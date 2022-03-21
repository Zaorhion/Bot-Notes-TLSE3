const Discord = require("discord.js"); // Discord API

const { client } = require("./utils/client"); // Bot Info

const { notesUpdater } = require("./notesUpdater"); // AutoAnnouncement
const Calcultator = require("./calculator"); // Calculator
const NotesManager = require("./api-visunotes/api-VisuNotes-Toulouse3-master/NotesManager"); //API

const { PAS_LE_TOKEN } = require("./config.json");
const coeff = require("./notes.json");

client.on("ready", async () => {
  console.log(`Well connected to ${client.user.client.user.client.user.tag}`); // Optimised CONNEXION
  notesUpdater(); // Launch the auto anoucement system
});

// Basic command Handler
client.on("messageCreate", async (msg) => {
  // Command Name
  if (msg.content.startsWith("!getNotes")) {
    let args = msg.content.split(" ");
    let username, passwd;
    // No args Error Handler
    if (!args[1]) return msg.reply("Merci d'entrer votre username !");
    if (!args[2]) return msg.reply("Merci d'entre votre password !");
    username = args[1];
    passwd = args[2];

    // New Connexion with the API
    let newBloc = new NotesManager([username, passwd], "BFTZ", "-E");
    // Load all the notes from the account
    let retour = await newBloc.loadNotes().catch((err) => {
      return err;
    });
    // Login Error Handler
    if (retour === "LOGIN_FAILED") return msg.reply("Connexion échouée");
    // Load all the Notes
    let newNotes = await newBloc.getNotes();
    // Calculator with the notes objects
    let myResult = new Calcultator(newNotes);

    // Display the result of the Calculator
    let embedSubjects = new Discord.MessageEmbed()
      .setTitle("Mon récapitulatif des moyennes par matières : ")
      .setColor("DARK_AQUA");
    let endMoyennes = myResult.getMoyennes();
    for (let i = 0; i < endMoyennes.length; i++) {
      embedSubjects.addField(newNotes[i].label, endMoyennes[i] + "/20");
    }

    let embedBlocs = new Discord.MessageEmbed()
      .setTitle("Mon récapitulatif des notes de Blocs : ")
      .setColor("DARK_RED");
    let endBloc = myResult.getFinalBlocs();
    for (let i = 0; i < endBloc.length; i++) {
      // Emote Display
      let emotes = ["🔴", "🟠", "🟢"];
      let emote = "";
      if (endBloc[i] >= 10) emote = emotes[2];
      if (endBloc[i] < 10 && endBloc[i] > 8) emote = emotes[1];
      if (endBloc[i] < 8) emote = emotes[1];

      embedBlocs.addField(
        `[${i + 1}] Blocs ${coeff.coeffBlocsWithoutSAE[i].name}`,
        `[${emote}] ` + endBloc[i] + "/20"
      );
    }
    // Send the note Embeds
    msg.channel.send({ embeds: [embedSubjects, embedBlocs] });
  }
});

// Login
client.login(PAS_LE_TOKEN);
