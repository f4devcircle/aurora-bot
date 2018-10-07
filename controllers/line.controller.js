require('dotenv').config();
const lineSDK = require('@line/bot-sdk')
const lineService = require('../services/line.service');

const line = new lineSDK.Client({
  channelAccessToken: process.env.LINE_TOKEN
});

const index = async (req, res, next) => {
  let request = req.body.events[0];

  if (request.type === 'message' && request.message.type === 'text' && request.message.text.charAt(0) === '/' && request.message.text.split(" ").length < 6) {
    request.message.text = request.message.text.split(" ");
    
    try {
      line.replyMessage(
        request.replyToken, 
        await lineService(request.message.text, {
          replyToken: request.replyToken,
          userId: request.source.userId,
          groupId: request.groupId
        }))
    } catch (error) {
      console.log(error);
    }

    return true;
  }

  return false;
};

module.exports = {
  index
};