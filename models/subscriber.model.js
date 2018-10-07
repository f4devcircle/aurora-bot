const gstore = require('gstore-node')();
 
const { Schema } = gstore;

const subscriberSchema = new Schema({
  userId: { 
    type: String, 
    required: true  
  },

  groupId: { 
    type: String, 
  },

  setlistId: { 
    type: String, 
  },

  memberId: { 
    type: String, 
  },
});

module.exports = gstore.model('Subscriber', subscriberSchema);