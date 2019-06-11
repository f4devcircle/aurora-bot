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

  const responses = {
    '/help': textMessage(await help()),
    '/jadwal': jadwal(message, data),
    '/langganan': langganan(message, data),
    '/daftar-performer': daftarPerformer(message, data),
    '/beli': beli(message, data),
    '/daftar-member': daftarMember(message, data),
    '/batal-langganan': unsubscribe(message, data),
    '/login': login(message, data)
  }

  storeMessage(message, data);

  if (responses[message[0]]) {
    reply = await responses[message[0]];
    send(reply, data);
  } else {
    send(reply, data);
  }
  return true
};

const login = async (message, data) => {
  try {
    const isLoggedIn = (await axios.get(process.env.CRAWLER_ENDPOINT + 'auth/login/' +data.userId)).data.isLoggedIn;
    if (message[1] === 'logout') {
      if (isLoggedIn) {
          await axios.post(process.env.CRAWLER_ENDPOINT + 'auth/logout/' + data.userId);
          return send(await textMessage('Anda telah berhasil keluar dari akun JKT48'), data);
      } else {
        return send(await textMessage('Anda belum login ke akun JKT48'), data);
      }
    } else if (isLoggedIn) {
      return send(await textMessage('Anda sudah login ke akun JKT48 sebelumnya'), data);
    } else {
        if (data.groupId !== undefined || data.roomId !== undefined) {
        reply = {
          "type": "template",
          "altText": "Silakan login ke akun JKT48 anda",
          "template": {
            "type": "carousel",     
            "imageAspectRatio": "square",
            "imageSize": "cover",   
            "columns": [
              {
                "text": "Silakan login terlebih dahulu dengan mengetikan /login melalui japri di akun JKTbot",
                "actions": [
                  {
                    "type": "uri",
                    "label": "Japri JKTbot",
                    "uri": "line://oaMessage/@jktbot/?%2Flogin"
                  },
                ]
              }
            ]
          }
        };
      } else {
        reply = {
          "type": "template",
          "altText": "Silakan login terlebih dahulu",
          "template": {
            "type": "carousel",     
            "imageAspectRatio": "square",
            "imageSize": "cover",   
            "columns": [
              {
                "text": "Silakan login terlebih dahulu di akun JKT48 anda",
                "actions": [
                  {
                    "type": "uri",
                    "label": "Login",
                    "uri": "https://ngidol.club?userId=" + data.userId
                  },
                ]
              }
            ]
          }
        };
      }  
      return send(reply, data);
    }
  } catch (error) {
    console.log(error);
  }
  
};

const beli = async (message, data) => {
  const isLoggedIn = (await axios.get(process.env.CRAWLER_ENDPOINT + 'auth/login/' +data.userId)).data.isLoggedIn;

  if (isLoggedIn) {
    let buying = (await axios.post(process.env.CRAWLER_ENDPOINT + 'buy/' + message[1], {
      lineId: data.userId,
      options: {
        ticketClass: 'GEN',
        ticketType: message[2],
        paymentOption: 'jkt48 points',
        confirm: (message[3] === 'confirm' && message[4] === data.userId)? true : false
      }
    }));

    console.log(buying);
    buying = buying.data;
    const responses = {
      NOT_FOUND: "Jadwal yang ingin dibeli tidak tersedia",
      NOT_AVAILABLE: "Tiket tidak tersedia untuk jadwal ini",
      ALREADY_BOUGHT: "Anda sudah membeli tiket pertunjukan ini sebelumnya",
      NOT_ENOUGH_BALANCE: buying.error.message
    }

    const errType = buying.error.type;
    
    if (buying.error && buying.error.type) {
      return send(await textMessage(responses[errType]), data);
    } else if (buying.error && buying.error.type === 'NEED_TICKET_TYPE' && (message[2] !== 'dewasa' || message[2] !== 'siswa')) {
      reply = {
        "type": "template",
        "altText": "Silakan pilih jenis tiket yang akan dibeli",
        "template": {
          "type": "buttons",
          "text": "Silakan pilih jenis tiket yang akan dibeli",
          "actions": buying.error.options.map(type => {
            return {
              "type": "message",
              "label": type.charAt(0).toUpperCase() + type.slice(1),
              "text": "/beli " + message[1] + " " + type
            }
          })
        }
      };
      console.log(reply.template.actions);
      return send(reply, data);
    } else if (buying.error && buying.error.type === 'NEED_CONFIRMATION') {
      let messages = [];
      messages.push(await textMessage('Apakah anda yakin akan membeli tiket "' + buying.error.purchaseDetails['Nama Acara'] + '" (' + buying.error.purchaseDetails['Show'] + ') seharga "' + buying.error.purchaseDetails['Total Pembayaran'] + '" (' + buying.error.purchaseDetails['Tipe Tiket'] + " - " + buying.error.purchaseDetails['Jenis Tiket'] + ') atas nama "' + buying.error.purchaseDetails['Nama Lengkap'] + '" dengan menggunakan metode pembayaran "' + buying.error.purchaseDetails['Cara Pembayaran'] + '"?'));
      messages.push({
        "type": "template",
        "altText": "Konfirmasi pembelian tiket",
        "template": {
          "type": "buttons",
          "text": "Apakah anda yakin?",
          "actions": [
            {
              "type": "message",
              "label": "Yakin!",
              "text": "/beli " + message[1] + " " + message[2] + " confirm " + data.userId
            }
          ]
        }
      });
      return send(messages, data);
    } else {
      if (buying.success) {
        return send(await textMessage('Pembelian tiket anda berhasil!'), data);
      } else {
        return send(await textMessage('Galat. Silakan coba lagi nanti.'), data);
      }
    }
  } else {
    if (data.groupId !== undefined || data.roomId !== undefined) {
      reply = {
        "type": "template",
        "altText": "Silakan login terlebih dahulu",
        "template": {
          "type": "buttons",
          "text": "Silakan login terlebih dahulu dengan mengetikan /login melalui japri di akun JKTbot",
          "actions": [
            {
              "type": "uri",
              "label": "Japri JKTbot",
              "uri": "line://oaMessage/@jktbot/?%2Flogin"
            },
          ]
        }
      };
    } else {
      reply = {
        "type": "template",
        "altText": "Silakan login terlebih dahulu",
        "template": {
          "type": "buttons",
          "text": "Silakan login terlebih dahulu di akun JKT48 anda",
          "actions": [
            {
              "type": "uri",
              "label": "Login",
              "uri": "https://ngidol.club?userId=" + data.userId
            },
          ]
        }
      };
    }  
    return send(reply, data);
  }
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
  let reply = 

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

   let setlist = await setlistModel.list();

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
      try {
        let setlist = await setlistModel.findOne({
          "slug": message
        });

        let shows = await axios.get(process.env.CRAWLER_ENDPOINT + 'shows/' + encodeURI(message));

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
                {
                  "type": "message",
                  "label": "Beli Tiket",
                  "text": "/beli " + show.unixTime
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
    let show = await axios.get(process.env.CRAWLER_ENDPOINT + 'shows/memberlist/' + encodeURI(message));
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
              "thumbnailImageUrl": "https://storage.googleapis.com/aurora-bot/bot-images/bot-images_academy.png",
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
  
      return send(reply, data);
    } catch (error) {
      console.log(error);
      return send(reply, data);
    }

  } else {

    try {
      let members = await memberModel.query()
        .filter('team', '=', message[message.length - 1])

      members = await members.run();
    
      let batches = _.chunk(members.entities, 10);

      let replies = batches.map((batch) => {
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
  let isSubscribed
  let reply = "Kata kunci tidak ditemukan";

  if (!(await checkMaxSubscribe(data))) {
    return await textMessage('Anda sudah melebihi batas maksimal berlangganan di kanal room/group/pribadi ini');
  }

  if (message[1] === 'member') {
    message.splice(0, 2);
    message = message.join(" ");

    try {
      // setlist check

      let member = await memberModel.findOne({
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
    let isSubscribed
    message.splice(0, 1);
    message = message.join(" ");

    try {
      // setlist check

      let setlist = await setlistModel.findOne({
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
  let subscribes;
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
    let setlist;
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
      let setlist = await setlistModel.findOne({
        "slug": req.body.showData.showName
      });

      let member = await memberModel.get(req.body.memberId);

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
  let subscribes;
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
