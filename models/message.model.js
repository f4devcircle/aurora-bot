const gstore = require('gstore-node')();
 
const { Schema } = gstore;

const messageSchema = new Schema({
  message: { 
    type: String, 
    required: true 
  },

  replyToken: { 
    type: String, 
    optional: true  
  },

  userId: { 
    type: String, 
    optional: true 
  },

  createdAt: { 
    type: String, 
    default: gstore.defaultValues.NOW, 
    write: false, 
    read: false 
  },
});

module.exports = gstore.model('Message', messageSchema);