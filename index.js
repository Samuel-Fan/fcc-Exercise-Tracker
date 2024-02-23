const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(console.log("connect success!"))
  .catch(err => console.log(err));

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Mongodb setting
const userSchema = new mongoose.Schema({
  name: {type: String, required: true}
})

const exerciseSchema = new mongoose.Schema({
  _id: {type:String, required: true},
  description: {type: String, required: true},
  duration:{type: Number, required: true},
  date: String
})

const User = mongoose.model('User',userSchema);
const Exercise = mongoose.model('exercise',exerciseSchema);

// Mongoose function
const saveUser = (name) => {
  let person = new User({name: name});
  return person.save();
}

const saveExercise = (id,description,duration,date) => {
  let exercise = new Exercise({
    _id: id,
    description: description,
    duration: duration,
    date: date
  })
  return exercise.save();
}

const queryByName = (name) => {
  return User.find({name: name});
}

const queryById = (id) => {
  return User.find({_id: id});
}

// API
// create a new user
app.post('/api/users', async (req, res) => {
  let user = req.body.username;
  let userInfo = (await queryByName(user))[0];

  if (userInfo === undefined) {
    userInfo = await saveUser(user);
    console.log("save user data", userInfo);
  } 
  res.json({username: userInfo.name, _id: userInfo._id}); 
})

// create a new sport
app.post('/api/users/:_id/exercises', async (req,res) => {
  let id = req.body[':_id'];
  let description = req.body.description;
  let duration = req.body.duration;
  let date;
  if (req.body.date) {
    date = new Date(req.body.date);
  } else {
    date = new Date();
  }
  // check if description and duration exsit?
  //if (!description && !duration) {
  //  res.json({error: })
  //}
  // check _id format to avoid search error
  
  let regex = /[a-z0-9]{23}/i
  if (!regex.test(id)) {
    res.json({error: "user not found"});
    return;
  }

  try {
    // find username by id 
    let userInfo = (await queryById(id))[0];

    // if user found
    if (userInfo !== undefined) {
      let username = userInfo.name;
      let dateString = date.toDateString();
      // save data
      let exerciseInfo = await saveExercise(id, description, duration, date);
      console.log("save exercise data", exerciseInfo )

      res.json({
        _id: id,
        username: username,
        date: dateString, 
        duration: duration,
        description: description
      });
    } else {
      res.json({error: "user not found"});
    }
  } catch (err) {
    res.json(err);
  }
})

// listener

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
