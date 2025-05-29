const Mongoose=require("mongoose")
const taskschema=Mongoose.Schema({
    taskId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'title', 
        required: true
    },
    userId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    deadline: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})
var taskModel=Mongoose.model("task",taskschema)
module.exports=taskModel