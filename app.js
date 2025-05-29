const Cors=require("cors")
const Bcrypt=require("bcrypt")
const Express=require("express")
const Jwt=require("jsonwebtoken")
const Mongoose=require("mongoose")
const UserModel=require("./models/user")
const titleModel = require("./models/title")
const taskModel = require("./models/task")
let app=Express()
app.use(Express.json())
app.use(Cors())

Mongoose.connect("mongodb+srv://sreerag:sreerag@cluster0.onuj57g.mongodb.net/TODdb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

app.post("/signup",async(req,res)=>{
    let input=req.body
    let hashedpassword=Bcrypt.hashSync(req.body.password,10)
    console.log(hashedpassword)
    req.body.password=hashedpassword
    console.log(input)
    UserModel.find({email:req.body.email}).then((items)=>{
  if(items.length>0){
        res.json({"status":"email is already exist"})
    }
    else{
        let result=new UserModel(input)
         result.save()
        res.json({"status":"success"})
    }
    }).catch((error)=>{

    })
})
app.post("/signin",async(req,res)=>{
    let input=req.body
    let result=UserModel.find({email:req.body.email}).then(
        (items)=>{
        if (items.length>0) {
            const pass=Bcrypt.compareSync(req.body.password,items[0].password)
            if (pass) {
                Jwt.sign({email:req.body.email},"todoapp",{expiresIn:"1d"},
                    (error,token)=>{
                if (error) {
                    res.json({"status":"error","errorMessage":error})
                } else {
                    res.json({"status":"success","token":token,"userId":items[0]._id})
                }
            })
    
            } else {
                res.json({"status":"incorrect password"})
            }
        } else {
            res.json({"status":"invalid email"})
        }
    }).catch()
})
app.post('/addtitle', async (req, res) => {

    const token = req.headers.token;
    if (!token) {
        return res.json({ status: "error", message: "Please log in first" });
    }
    try {
        const decoded = Jwt.verify(token, "todoapp");
        const { title } = req.body;
        if (!title) {
            return res.json({ status: "error", message: "Please enter a title" });
        }
        const user = await UserModel.findOne({ email: decoded.email });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }
        const newTitle = new titleModel({
            userId: user._id,
            title: title,
            completionPercentage: 0 
        });
        await newTitle.save();
        res.json({
            status: "success",
            message: "Title added",
            title: {
                id: newTitle._id,
                title: newTitle.title,
                completionPercentage: newTitle.completionPercentage
            }
        });
    } catch (error) {
        res.json({ status: "error", message: "Something went wrong" });
        console.log("Error in addtitle:", error);
    }
});
app.post('/addtask', async (req, res) => {
    const token = req.headers.token;
    if (!token) {
        return res.json({ status: "error", message: "Please log in first" });
    }

    try {
        const decoded = Jwt.verify(token, "todoapp");
        const {  taskId, description, deadline } = req.body;
        if (!  taskId|| !description || !deadline) {
            return res.json({ status: "error", message: "Please provide category ID, description, and deadline" });
        }
        const user = await UserModel.findOne({ email: decoded.email });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }
        const category = await titleModel.findOne({ _id:taskId, userId: user._id });
        if (!category) {
            return res.json({ status: "error", message: "Category not found" });
        }
        const newTask = new taskModel({
              taskId:taskId,
            userId: user._id,
            description: description,
            deadline: new Date(deadline),
            isCompleted: false
        });
        await newTask.save();
        const tasks = await taskModel.find({ taskId: taskId });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.isCompleted).length;
        const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        category.completionPercentage = percentage;
        category.updatedAt = new Date();
        await category.save();
        res.json({
            status: "success",
            message: "Task added",
            task: {
                id: newTask._id,
                description: newTask.description,
                deadline: newTask.deadline,
                isCompleted: newTask.isCompleted
            }
        });
    } catch (error) {
        res.json({ status: "error", message: "Something went wrong" });
        console.log("Error in addtask:", error);
    }
});

app.get('/api/tasks/:taskId', async (req, res) => {
    const token = req.headers.token;
    if (!token) {
        return res.json({ status: "error", message: "Please log in first" });
    }
    try {
        console.log("GET /api/tasks called with taskId:", req.params.taskId);
        const decoded =Jwt.verify(token, "todoapp"); 
        console.log("Token decoded with email:", decoded.email); 
        const user = await UserModel.findOne({ email: decoded.email });
        if (!user) {
            console.log("User not found for email:", decoded.email);
            return res.json({ status: "error", message: "User not found" });
        }
        console.log("User found with _id:", user._id);
        const taskId = req.params.taskId;
        const category = await titleModel.findOne({ _id: taskId, userId: user._id });
        if (!category) {
            console.log("Title not found for _id:", taskId, "and userId:", user._id); 
            return res.json({ status: "error", message: "Title not found" });
        }
        const tasks = await taskModel.find({ 
            taskId: taskId, 
            userId: user._id 
        }).sort({ deadline: 1 });
        if (!tasks || tasks.length === 0) {
            return res.json({
                status: "success",
                message: "No tasks found",
                tasks: []
            });
        }
        const taskList = tasks.map(task => ({
            id: task._id,
            description: task.description,
            isCompleted: task.isCompleted,
            deadline: task.deadline,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
        }));
        res.json({
            status: "success",
            message: "Tasks fetched",
            tasks: taskList
        });
    } catch (error) {
        res.json({ status: "error", message: "Something went wrong" });
        console.log("Error in tasks:", error);
    }
});
app.get('/titles', async (req, res) => {
  const token = req.headers.token;
  if (!token) return res.json({ status: 'error', message: 'Please log in first' });
  try {
    console.log('Token received:', token);
    const decoded = Jwt.verify(token, 'todoapp'); 
    const user = await UserModel.findOne({ email: decoded.email });
    if (!user) {
      console.log('No user found for email:', decoded.email);
      return res.json({ status: 'error', message: 'User not found' });
    }
    console.log('Fetching titles for userId:', user._id);
    const titles = await titleModel.find({ userId: user._id });
    console.log('Titles found:', titles);
    res.json({
      status: 'success',
      message: 'Titles fetched',
      titles: titles.map(title => ({
        id: title._id,
        title: title.title,
        completionPercentage: title.completionPercentage || 0
      }))
    });
  } catch (error) {
    console.log('Error in /titles:', error.message);
    res.json({ status: 'error', message: 'Cannot fetch titles' });
  }
});
app.post('/tasks/:id/toggle', async (req, res) => {
  const token = req.headers.token;
  if (!token)
     return res.json({ status: 'error', message: 'Please log in first' });
  try {
    const decoded = Jwt.verify(token, 'todoapp');
    const user = await UserModel.findOne({ email: decoded.email });
    if (!user)
         return res.json({ status: 'error', message: 'User not found' });
    const task = await taskModel.findOne({ _id: req.params.id, userId: user._id });
    if (!task)
         return res.json({ status: 'error', message: 'Task not found' });
    task.isCompleted = !task.isCompleted;
    task.updatedAt = new Date();
    await task.save();
    const tasks = await taskModel.find({ taskId: task.taskId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    await titleModel.findByIdAndUpdate(task.taskId, {
      completionPercentage: percentage,
      updatedAt: new Date()
    });
    res.json({
      status: 'success',
      message: 'Task updated',
      task: {
        id: task._id,
        description: task.description,
        isCompleted: task.isCompleted,
        deadline: task.deadline,
        percentage: percentage.toFixed(2)
      }
    });
  } catch (error) {
    console.log('Error in /tasks/:id/toggle:', error.message);
    res.json({ status: 'error', message: 'Cannot update task' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const token = req.headers.token;
  if (!token) return res.json({ status: 'error', message: 'Please log in first' });
  try {
    const decoded = Jwt.verify(token, 'todoapp'); 
    const user = await UserModel.findOne({ email: decoded.email });
    if (!user) return res.json({ status: 'error', message: 'User not found' });
    const task = await taskModel.findOne({ _id: req.params.id, userId: user._id });
    if (!task) return res.json({ status: 'error', message: 'Task not found' });
    const titleId = task.taskId;
    await taskModel.deleteOne({ _id: req.params.id });
    const tasks = await taskModel.find({ taskId: titleId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const percentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0; 
    await titleModel.updateOne({ _id: titleId }, { 
      completionPercentage: percentage.toFixed(2), 
      updatedAt: new Date() 
    });
    res.json({
      status: 'success',
      message: 'Task deleted',
      titleId: titleId,
      completionPercentage: percentage.toFixed(2)
    });
  } catch (error) {
    console.log('Error deleting task:', error.message);
    res.json({ status: 'error', message: 'Cannot delete task' });
  }
});
app.put('/tasks/:id', async (req, res) => {
  const token = req.headers.token;
  if (!token) return res.json({ status: 'error', message: 'Please log in first' });
  const { description, deadline } = req.body;
  if (!description || !deadline) return res.json({ status: 'error', message: 'Description and deadline required' });
  try {
    const decoded = Jwt.verify(token, 'todoapp');
    const user = await UserModel.findOne({ email: decoded.email });
    if (!user) return res.json({ status: 'error', message: 'User not found' });
    const task = await taskModel.findOne({ _id: req.params.id, userId: user._id });
    if (!task) return res.json({ status: 'error', message: 'Task not found' });
    task.description = description;
    task.deadline = new Date(deadline);
    task.updatedAt = new Date();
    await task.save();
    res.json({
      status: 'success',
      message: 'Task updated',
      task: {
        id: task._id,
        description: task.description,
        deadline: task.deadline,
        isCompleted: task.isCompleted
      }
    });
  } catch (error) {
    console.log('Error updating task:', error.message);
    res.json({ status: 'error', message: 'Cannot update task' });
  }
});
app.delete('/titles/:id', async (req, res) => {
  const token = req.headers.token;
  if (!token) return res.json({ status: 'error', message: 'Please log in first' });
  try {
    const decoded =Jwt.verify(token, 'todoapp');
    const user = await UserModel.findOne({ email: decoded.email });
    if (!user) return res.json({ status: 'error', message: 'User not found' });
    const title = await titleModel.findOne({ _id: req.params.id, userId: user._id });
    if (!title) return res.json({ status: 'error', message: 'Title not found' });
    await taskModel.deleteMany({ taskId: req.params.id });
    await titleModel.deleteOne({ _id: req.params.id });
    res.json({
      status: 'success',
      message: 'Title and tasks deleted'
    });
  } catch (error) {
    console.log('Error deleting title:', error.message);
    res.json({ status: 'error', message: 'Cannot delete title' });
  }
});

app.put('/titles/:id', async (req, res) => {
  const token = req.headers.token;
  const { title } = req.body;
  if (!token) return res.json({ status: 'error', message: 'Please log in first' });
  if (!title || title.trim() === '') return res.json({ status: 'error', message: 'Title required' });
  try {
    const decoded = Jwt.verify(token, 'todoapp');
    const user = await UserModel.findOne({ email: decoded.email });
    if (!user) return res.json({ status: 'error', message: 'User not found' });
    const titleDoc = await titleModel.findOne({ _id: req.params.id, userId: user._id });
    if (!titleDoc) return res.json({ status: 'error', message: 'Title not found' });
    titleDoc.title = title.trim();
    titleDoc.updatedAt = new Date();
    await titleDoc.save();
    res.json({
      status: 'success',
      message: 'Title updated',
      title: {
        id: titleDoc._id,
        title: titleDoc.title
      }
    });
  } catch (error) {
    console.log('Error updating title:', error.message);
    res.json({ status: 'error', message: 'Cannot update title' });
  }
});
app.get("/user/:userId", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (user) {
      res.json({ status: "success", user: { name: user.name } });
    } else {
      res.json({ status: "error" });
    }
  } catch (err) {
    res.json({ status: "error", errorMessage: err.message });
  }
});
app.listen(3030,()=>{
    console.log("server start")
})