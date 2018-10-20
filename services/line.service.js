require('dotenv').config();
const messageModel = require('../models/message.model');
const setlistModel = require('../models/setlist.model');
const subscriberModel = require('../models/subscriber.model');
const memberModel = require('../models/member.model');
const axios = require('axios');
const moment = require('moment');
const lineSDK = require('@line/bot-sdk')
const _ = require('lodash');

const line = new lineSDK.Client({
  channelAccessToken: process.env.LINE_TOKEN
});

const index = async (message, data) => {
  let reply = await textMessage('Perintah tidak ditemukan, silakan lihat daftar perintah dengan mengetikkan /help');
  
  if (message[0] === '/help') {
    reply = await textMessage(await help());
    return send(reply, data);
  } else if (message[0] === '/jadwal') {
    reply = await jadwal(message, data);
    return send(reply, data);
  } else if (message[0] === '/langganan') {
    // reply = await textMessage('Fitur berlangganan jadwal teater akan segera hadir. Ditunggu, ya!')
    reply = await (langganan(message, data));
    return send(reply, data);
  } else if (message[0] === '/daftar-performer' && message.length === 2) {
    reply = await daftarPerformer(message, data);
    return send(reply, data);
  } else if (message[0] === '/beli') {
    reply = await textMessage('Fitur pembelian tiket akan segera hadir. Ditunggu, ya!');
    return send(reply, data);
  } else if (message[0] === '/daftar-member') {
    reply = await (daftarMember(message, data));
    return true;
  } else if (message[0] === '/batal-langganan') {
    reply = await unsubscribe(message, data);
    return true;
  } else if (message[0] === '/batal-langganan') {
    reply = await unsubscribe(message, data);
    return true;
  } else {
    send(reply, data);
  }

  storeMessage(message, data);
  return true;
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

`/jadwal - melihat jadwal show teater
/daftar-member - melihat daftar member
/batal-langganan - membatalkan langganan jadwal`;

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

        shows = await axios.get(process.env.CRAWLER_ENDPOINT + 'shows/' + encodeURI(message));

        shows = shows.data;

        if (shows.length !== 0) {
          reply = {
            "type": "template",
            "altText": "Jadwal setlist " + setlist.plain().name,
            "template": {
              "type": "carousel",
            }
          };
  
          reply.template.columns = shows.map((show) => {
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
        } else {
          reply = await textMessage('Belum ada jadwal tersedia untuk setlist ini');
        }
        
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
    show = await axios.get(process.env.CRAWLER_ENDPOINT + 'shows/memberlist/' + encodeURI(message));
    show = show.data;

    if (show.members.length != 0) {
      reply = "Daftar performer penampilan setlist "+show.showName.replace(/\b\w/g, function(l){ return l.toUpperCase() })+" pada hari "+moment.unix(show.unixTime).format("dddd, DD MMMM YYYY")+":\n\n"+show.members.join(", ");
    } else {
      reply = "Performer untuk setlist "+show.showName.replace(/\b\w/g, function(l){ return l.toUpperCase() })+" pada hari "+moment.unix(show.unixTime).format("dddd, DD MMMM YYYY")+" belum tersedia";
    }

  } catch (error) {
    console.log(error);
  }

  return await textMessage(reply);
};

const daftarMember = async (message, data) => {
  let reply = await textMessage("Kata kunci tidak ditemukan");

  if (message.length === 1) {

    try {
      reply = {
        "type": "template",
        "altText": "Daftar member",
        "template": {
          "type": "carousel",     
          "imageAspectRatio": "square",
          "imageSize": "cover",   
          "columns": [
            {
              "thumbnailImageUrl": "https://pbs.twimg.com/profile_images/1035377441697488896/y11mGc2-_400x400.jpg",
              "text": "JKT48 Tim J",
              "actions": [
                {
                  "type": "message",
                  "label": "Lihat daftar member",
                  "text": "/daftar-member tim J"
                },
              ]
            },
            {
              "thumbnailImageUrl": "https://pbs.twimg.com/profile_images/1035377570211016704/GPt_PVob_400x400.jpg",
              "text": "JKT48 Tim KIII",
              "actions": [
                {
                  "type": "message",
                  "label": "Lihat daftar member",
                  "text": "/daftar-member tim K3"
                },
              ]
            },
            {
              "thumbnailImageUrl": "https://pbs.twimg.com/profile_images/1035377753724342272/peNrv5mb_400x400.jpg",
              "text": "JKT48 Tim T",
              "actions": [
                {
                  "type": "message",
                  "label": "Lihat daftar member",
                  "text": "/daftar-member tim T"
                },
              ]
            },
            {
              "thumbnailImageUrl": "https://vignette.wikia.nocookie.net/akb48/images/9/93/Screenshot_%28146%29.png",
              "text": "JKT48 Academy",
              "actions": [
                {
                  "type": "message",
                  "label": "Lihat daftar member",
                  "text": "/daftar-member Academy"
                },
              ]
            }
          ]
        }
      };
  
      send(reply, data);
    } catch (error) {
      console.log(error);
      return send(reply, data);
    }

  } else {

    try {
      members = await memberModel.query()
        .filter('team', '=', message[message.length - 1])

      members = await members.run();
    
      batches = _.chunk(members.entities, 10);

      replies = batches.map((batch) => {
        reply = {
          "type": "template",
          "altText": "Daftar member tim " + message[message.length - 1],
          "template": {
            "type": "carousel",
            "imageAspectRatio": "square",
            "imageSize": "cover"
          }
        };

        reply.template.columns = batch.map((member) => {
          return {
            "thumbnailImageUrl": (member.imgURL.split('?')[0]).replace(/_s.jpg/g, ".jpg"),
            "title": member.name,
            "text": "Tim " + member.team,
            "actions": [
              {
                "type": "message",
                "label": "Berlangganan",
                "text": "/langganan member " + member.name
              },
            ]
          }
        });

        return reply;
      });

      send(replies, data);
    } catch (error) {
      console.log(error);
      return send(reply, data)
    }
    
  }

  return true;
};

const langganan = async (message, data) => {
  let reply = "Kata kunci tidak ditemukan";

  if (!(await checkMaxSubscribe(data))) {
    return await textMessage('Anda sudah melebihi batas maksimal berlangganan di kanal room/group/pribadi ini');
  }

  if (message[1] === 'member') {
    message.splice(0, 2);
    message = message.join(" ");

    try {
      // setlist check

      member = await memberModel.findOne({
        "name": message
      });

      const subscriber = new subscriberModel({
        groupId: data.groupId || null,
        userId: data.userId || null,
        roomId: data.roomId || null,
        memberId: member.plain().id
      });

      if (data.roomId || data.groupId) {
        isSubscribed = await subscriberModel.query()
          .filter('roomId', '=', data.roomId || null)
          .filter('groupId', '=', data.groupId || null)
          .filter('memberId', '=', member.plain().id)
      } else {
        isSubscribed = await subscriberModel.query()
          .filter('roomId', '=', data.roomId || null)
          .filter('userId', '=', data.userId || null)
          .filter('groupId', '=', data.groupId || null)
          .filter('memberId', '=', member.plain().id)
      }
      

      isSubscribed = await isSubscribed.run();


      if (isSubscribed.entities.length === 0) {
        try {
          subscriber.save();
          reply = 'Anda telah didaftarkan untuk berlangganan jadwal member ' + member.plain().name;
        } catch (error) {
          console.log(err);
        }
      } else {
        reply = 'Anda sudah berlangganan jadwal member ' + member.plain().name + ' sebelumnya';
      }
    
    } catch (error) {
      if (message === 'japri') {
        reply = 'Astaghfirullah, malah japri :(';
      }
      console.log(error);
    }
  } else {
    message.splice(0, 1);
    message = message.join(" ");

    try {
      // setlist check

      setlist = await setlistModel.findOne({
        "slug": message
      });

      const subscriber = new subscriberModel({
        groupId: data.groupId || null,
        userId: data.userId || null,
        roomId: data.roomId || null,
        setlistId: setlist.plain().id
      });

      if (data.roomId || data.groupId) {
        isSubscribed = await subscriberModel.query()
        .filter('roomId', '=', data.roomId || null)
        .filter('groupId', '=', data.groupId || null)
        .filter('setlistId', '=', setlist.plain().id)
      } else {
        isSubscribed = await subscriberModel.query()
        .filter('roomId', '=', data.roomId || null)
        .filter('userId', '=', data.userId || null)
        .filter('groupId', '=', data.groupId || null)
        .filter('setlistId', '=', setlist.plain().id)
      }

      isSubscribed = await isSubscribed.run();


      if (isSubscribed.entities.length === 0) {
        try {
          subscriber.save();
          reply = 'Anda telah didaftarkan untuk berlangganan jadwal setlist ' + setlist.plain().name;
        } catch (error) {
          console.log(err);
        }
      } else {
        reply = 'Anda sudah berlangganan jadwal setlist ' + setlist.plain().name + ' sebelumnya';
      }
    
    } catch (error) {
      console.log(error);
    }
  }

  return await textMessage(reply);
};

const checkMaxSubscribe = async (data) => {
  if (data.roomId || data.groupId) {
    subscribes = await subscriberModel.query()
      .filter('roomId', '=', data.roomId || null)
      .filter('groupId', '=', data.groupId || null)
  } else {
    subscribes = await subscriberModel.query()
      .filter('roomId', '=', data.roomId || null)
      .filter('userId', '=', data.userId || null)
      .filter('groupId', '=', data.groupId || null)
  }

  subscribes = await subscribes.run();

  if (subscribes.entities.length >= 3) {
    return false;
  }

  return true;
};

const send = async (message, data, push = false) => {
  if (!push) {
    try {
      line.replyMessage(
        data.request.replyToken, 
        message
      )
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      line.pushMessage(
        data, 
        message
      )
    } catch (error) {
      console.log(error);
    }
  }

  return true;
};

const push = async (req) => {
  if (req.body.type === 'setlist') {
    try {
      setlist = await setlistModel.findOne({
        "slug": req.body.showData.showName
      });

      let subscribers = await subscriberModel.query()
        .filter('setlistId', '=', setlist.plain().id)
  
      subscribers = await subscribers.run();
      console.log(subscribers);

      subscribers.entities.forEach(function(subscriber) {
        reply = {
          "type": "template",
          "altText": "Jadwal Baru " + setlist.plain().name,
          "template": {
            "type": "carousel",     
            "imageAspectRatio": "square",
            "imageSize": "cover",   
            "columns": [
              {
                "thumbnailImageUrl": setlist.plain().image,
                "title": '[BARU] ' + setlist.plain().name,
                "text": moment.unix(req.body.showData.unixTime).format("dddd, DD MMMM YYYY") + ', ' + req.body.showData.showTime + '\n' + setlist.plain().description,
                "actions": [
                  {
                    "type": "message",
                    "label": "Daftar Member",
                    "text": "/daftar-performer " + req.body.showData.unixTime
                  },
                ]
              }
            ]
          }
        };
        send(reply, subscriber.groupId || subscriber.roomId || subscriber.userId, true);
      });
    } catch (error) {
      console.log(error)
    }
  } else {
    try {
      setlist = await setlistModel.findOne({
        "slug": req.body.showData.showName
      });

      member = await memberModel.get(req.body.memberId);

      console.log(member);

      let subscribers = await subscriberModel.query()
        .filter('memberId', '=', req.body.memberId)
  
      subscribers = await subscribers.run();

      subscribers.entities.forEach(function(subscriber) {
        reply = {
          "type": "template",
          "altText": "Jadwal Baru " + member.plain().name,
          "template": {
            "type": "carousel",     
            "imageAspectRatio": "square",
            "imageSize": "cover",   
            "columns": [
              {
                "thumbnailImageUrl": (member.imgURL.split('?')[0]).replace(/_s.jpg/g, ".jpg"),
                "title": setlist.plain().name,
                "text": ((req.body.action === 'add')? 'DITAMBAHKAN | ' : "DIHAPUS | ") + moment.unix(req.body.showData.unixTime).format("dddd, DD MMMM YYYY") + ', ' + req.body.showData.showTime + '\n' + setlist.plain().description,
                "actions": [
                  {
                    "type": "message",
                    "label": "Daftar Member",
                    "text": "/daftar-performer " + req.body.showData.unixTime
                  },
                ]
              }
            ]
          }
        };
        send(reply, subscriber.groupId || subscriber.roomId || subscriber.userId, true);
      });
    } catch (error) {
      console.log(error)
    }
  }
  
  return true;
};

const unsubscribe = async (message, data) => {
  if (message.length === 1) {
    if (data.roomId || data.groupId) {
      subscribes = await subscriberModel.query()
        .filter('roomId', '=', data.roomId || null)
        .filter('groupId', '=', data.groupId || null)
    } else {
      subscribes = await subscriberModel.query()
        .filter('roomId', '=', data.roomId || null)
        .filter('userId', '=', data.userId || null)
        .filter('groupId', '=', data.groupId || null)
    }
    
    subscribes = await subscribes.run();

    reply = {
      "type": "template",
      "altText": "Daftar langganan",
      "template": {
        "type": "carousel",     
        "imageAspectRatio": "square",
        "imageSize": "cover",
        "columns": []
      }
    };

    if (subscribes.entities.length !== 0) {
      const a = subscribes.entities.map(async (subscribe) => {
        let temp;
  
        if (subscribe.setlistId) {
          temp = await setlistModel.get(subscribe.setlistId);
        } else {
          temp = await memberModel.get(subscribe.memberId);
        }
        reply.template.columns.push(
          {
            "title": (subscribe.setlistId)? temp.plain().name : temp.name,
            "text": 'Langganan ' + ((subscribe.setlistId)? 'setlist' : 'member'),
            "actions": [
              {
                "type": "message",
                "label": "Batalkan langganan",
                "text": "/batal-langganan " + subscribe.id
              },
            ]
          }
        );
      });
      await Promise.all(a);
    } else {
      reply = await textMessage('Anda belum berlangganan apapun');
    }

    send(reply, data);
  } else {
    let reply = "Kata kunci tidak ditemukan";

    try {
      const response = await subscriberModel.delete(Number(message[1]));
      console.log(response);
      if (response.success) {
        send(await textMessage('Langganan telah dihapus'), data);
      } else {
        send(await textMessage(reply), data);
      }  
    } catch (error) {
      console.log(error);
    }
  }

  return true;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

module.exports = {
  index,
  push
};