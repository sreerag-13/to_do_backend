const Mongoose= require("mongoose")
const titleschema=Mongoose.Schema({
    userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true, 
  },
  completionPercentage: {
    type: Number,
    default: 0, 
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

})
var titleModel=Mongoose.model("title",titleschema)
module.exports=titleModel