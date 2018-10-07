const gstore = require('gstore-node')();
 
const { Schema } = gstore;

const setlistSchema = new Schema({
  groupId: { 
    type: String, 
    required: true 
  },

  userId: { 
    type: String, 
    required: true  
  },

  setlistId: { 
    type: String, 
  },

  memberId: {
    type: String,
  },

  createdAt: { 
    type: String, 
    default: gstore.defaultValues.NOW, 
    write: false, 
    read: false 
  },
});

const listQueryOptions = {
  order : { property: 'description', ascending: true },
};

setlistSchema.queries('list', listQueryOptions);

module.exports = gstore.model('Setlist', setlistSchema);