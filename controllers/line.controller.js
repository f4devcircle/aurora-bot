require('dotenv').config();
const lineService = require('../services/line.service');

const index = async (req, res, next) => {
  let request = req.body.events[0];

  if (request.type === 'message' && request.message.type === 'text' && request.message.text.charAt(0) === '/' && request.message.text.split(" ").length < 6) {

    request.message.text = request.message.text.split(" ");
    
    try {
      await lineService.index(request.message.text, {
        replyToken: request.replyToken,
        userId: request.source.userId,
        groupId: request.source.groupId,
        roomId: request.source.roomId,
        request: request
      })
    } catch (error) {
      console.log(error);
    }

    return true;
    
  }

  return false;
};

const push = async (req, res, next) => {
  await lineService.push(req);

  res.json("OK")
}

module.exports = {
  index,
  push
};