const gstore = require('gstore-node')();
 
const { Schema } = gstore;

const memberSchema = new Schema({
  imgURL: { 
    type: String, 
    required: true 
  },

  name: { 
    type: String, 
    required: true  
  },

  team: { 
    type: String, 
    required: true 
  },
});

module.exports = gstore.model('Member', memberSchema);