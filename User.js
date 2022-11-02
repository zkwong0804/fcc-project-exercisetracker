const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema= new Schema({
  username: String
},  {versionKey: false});
const UserModel = mongoose.model('Users', UserSchema);

module.exports = UserModel;