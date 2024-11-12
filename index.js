const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//mongoose configuration
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: [],
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  // const {username} = req.body;
  try {
    const user = new User(req.body);
    await user.save();
    // console.log(user.username)
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const getUsers = await User.find({});

    let users = [];
    getUsers.forEach((user) => {
      users.push({ _id: user._id, username: user.username });
    });
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  let newData = {
    description: description,
    duration: Number(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
  };

  try {
    const getUser = await User.findById(_id);
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $push: { log: newData } },
      { new: true, runValidaors: true }
    );
    if (updatedUser) {
      res.json({
        _id,
        username: getUser.username,
        date: newData.date,
        duration: newData.duration,
        description: newData.description,
      });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/api/users/:_id/logs',async(req,res)=>{
  const {_id} = req.params;
  
  const {from,to,limit} = req.query;
  
  try{
    const getData = await User.findById(_id);
    // console.log(getData.log)
      let logs = getData.log;
      console.log(new Date(logs[0].date).getTime())
        
      
      if(from){
        const fromDate = new Date(from);
        
        console.log(`from Date : ${fromDate}`)
        logs = logs.filter(log => new Date(log.date) >= fromDate )
        console.log(logs)
      }
      if(to){
        const toDate = new Date(to);
        logs = logs.filter(log => new Date(log.date) <= toDate)
      }
      if(limit){
        logs = logs.slice(0,Number(limit))
      }
      res.status(200).json({
        _id,
        username:getData.username,
        count:logs.length,
        log:logs,

      })
    
  }catch(error){
    res.status(400).send(error)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
