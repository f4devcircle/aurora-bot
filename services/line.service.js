const messageModel = require('../models/message.model');
const setlistModel = require('../models/setlist.model');
const subscriberModel = require('../models/subscriber.model');
const axios = require('axios');
const moment = require('moment');
const index = async (message, data) => {
  let reply = await textMessage('Perintah tidak ditemukan, silakan lihat daftar perintah dengan mengetikkan /help');
  
  if (message[0] === '/help') {
    reply = await textMessage(await help());
  } else if (message[0] === '/jadwal') {
    reply = await jadwal(message, data);
  } else if (message[0] === '/langganan') {
    reply = await textMessage('Fitur berlangganan jadwal teater akan segera hadir. Ditunggu, ya!')
    // reply = await (langganan(message, data));
  } else if (message[0] === '/daftar-performer' && message.length === 2) {
    reply = await daftarPerformer(message, data);
  } else if (message[0] === '/beli') {
    reply = await textMessage('Fitur pembelian tiket akan segera hadir. Ditunggu, ya!')
  }

  storeMessage(message, data);
  return reply;
};

const textMessage = async (message) => {
  return {
    type: 'text',
    text: message
  };
};

const storeMessage = async (message, data) => {
  const storedMessage = new messageModel({
    message: JSON.stringify(message),
    replyToken: data.replyToken,
    userId: data.userId,
    groupId: data.groupId
  });

  try {
    storedMessage.save()
  } catch (error) {
    console.log(err);
  }
};

const help = async () => {
  reply = 

`Untuk memulai, ketik /jadwal`;

  return await reply;
};

const jadwal = async (message, data) => {
  let reply = await textMessage("Kata kunci tidak ditemukan");

  if (message.length === 1) {

    reply = {
      "type": "template",
      "altText": "Daftar setlist teater",
      "template": {
        "type": "carousel",
        "imageAspectRatio": "square",
        "imageSize": "cover"
      }
    };

    setlist = await setlistModel.list();

    reply.template.columns = setlist.entities.map((sl) => {
      return {
        "thumbnailImageUrl": sl.image,
        "title": sl.name,
        "text": sl.description,
        "actions": [
          {
            "type": "message",
            "label": "Jadwal Show",
            "text": "/jadwal " + sl.slug
          },
          {
            "type": "message",
            "label": "Berlangganan",
            "text": "/langganan " + sl.slug
        },
        ]
      }
    })

  } else {
    message.splice(0, 1);
    message = message.join(" ");

    try {
      // setlist check

      setlist = await setlistModel.findOne({
        "slug": message
      });
    
      try {
        setlist = await setlistModel.findOne({
          "slug": message
        });

        shows = await axios.get('http://35.221.65.94:3000/shows/' + encodeURI(message));

        shows = shows.data;

        console.log(shows);

        reply = {
          "type": "template",
          "altText": "Jadwal setlist " + setlist.plain().name,
          "template": {
            "type": "carousel",
          }
        };

        reply.template.columns = shows.map((show) => {
          console.log(show.unixTime);
          return {
            "title": setlist.plain().name,
            "text": moment.unix(show.unixTime).format("dddd, DD MMMM YYYY") + ', ' + show.showTime + '\n' + setlist.plain().description,
            "actions": [
              {
                "type": "message",
                "label": "Daftar Member",
                "text": "/daftar-performer " + show.unixTime
              },
            ]
          }
        });
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }

  }

  return await reply;
};

const daftarPerformer = async (message, data) => {
  let reply = "Kata kunci tidak ditemukan";
  message.splice(0, 1);
  message = message.join(" ");

  try {
    //setlist check
    show = await axios.get('http://35.221.65.94:3000/shows/memberlist/' + encodeURI(message));
    console.log(show);
    show = show.data;

    if (show.members.length != 0) {
      reply = "Daftar performer penampilan setlist "+show.showName.replace(/\b\w/g, function(l){ return l.toUpperCase() })+" pada hari "+moment.unix(show.unixTime).format("dddd, DD MMMM YYYY")+":\n\n"+show.members.join(", ");
    } else {
      reply = "Performer untuk setlist "+show.showName.replace(/\b\w/g, function(l){ return l.toUpperCase() })+" pada hari "+moment.unix(show.unixTime).format("dddd, DD MMMM YYYY")+" belum diperbarui";
    }

  } catch (error) {
    console.log(error);
  }

  return await textMessage(reply);
};

const langganan = async (message, data) => {
  let reply = "Kata kunci tidak ditemukan";
  message.splice(0, 1);
  message = message.join(" ");

  try {
    // setlist check

    setlist = await setlistModel.findOne({
      "slug": message
    });

    const subscriber = new subscriberModel({
      groupId: data.groupId,
      userId: data.userId,
      setlistId: setlist.plain().id,
    });
  
    try {
      subscriber.save()
      reply = 'Anda telah didaftarkan untuk berlangganan jadwal setlist ' + setlist.plain().name;
    } catch (error) {
      console.log(err);
    }
  } catch (error) {
    console.log(error);
  }

  return await textMessage(reply);
};

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

module.exports = index;