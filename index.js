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
  username: {type: String, required: true}
},{versionKey: false})

const exerciseSchema = new mongoose.Schema({
  id: {type:String, required: true},
  description: {type: String, required: true},
  duration:{type: Number, required: true},
  date: Date
},{versionKey: false})

const User = mongoose.model('User',userSchema);
const Exercise = mongoose.model('exercise',exerciseSchema);

// Mongoose function
const saveUser = (name) => {
  let person = new User({username: name});
  return person.save();
}

const saveExercise = (id,description,duration,date) => {
  let exercise = new Exercise({
    id: id,
    description: description,
    duration: duration,
    date: date
  })
  return exercise.save();
}

const queryByName = (name) => {
  return User.find({username: name});
}

const queryById = (id) => {
  return User.find({_id: id});
}

const queryExercise = (id, from, to, limit) => {
  return Exercise
  .find({id: id})
  .select({_id: 0, id:0})
  .limit(limit);
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
  res.json({username: userInfo.username, _id: userInfo._id}); 
})

// create a new activity
app.post('/api/users/:_id/exercises', async (req,res) => {

  let id = req.body[':_id'] || req.params._id;
  let description = req.body.description;
  let duration = Number(req.body.duration);
  let date;

  if (req.body.date) {
    date = new Date(req.body.date);
  } else {
    date = new Date();
  }

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
      let username = userInfo.username;
      // save data
      
      let exerciseInfo = await saveExercise(id, description, duration, date);
      console.log("save exercise data", exerciseInfo )

      res.json({
        _id: id,
        username: username,
        date: date.toDateString(), 
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

// get method - all users
app.get('/api/users', async (req, res) => {
  let data = await User.find({});
  res.json(data);
})


// get method - exercise data of specific id
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    // query data
    let id = req.params['_id'];
    let from = new Date(req.query.from || -8640000000000000);
    let to = new Date(req.query.to || +8640000000000000);
    let limit = Number(req.query.limit) || Number.MAX_SAFE_INTEGER;

    let username = (await queryById(id))[0].username;
    // if not found
    if (username === undefined) {
      res.json({error: "user not found"});
      return;
    }

    // get additional info

    let exerciseInfo = Exercise.find({id: id})
      .find({date: { $gte: from }, date: { $lte: to}})
      .select({_id: 0, id:0})
      .limit(limit)
      .exec((err, data)=> {
 
        let dataConvert = data.map(n => {
          return Object.assign(
            {},
            {description: n.description},
            {duration: n.duration},
            {date: n.date.toDateString()}
          );
        })

        res.json({
          _id: id,
          username: username,
          count: dataConvert.length,
          log: dataConvert
        })
      })
  } catch(err) {
    res.json(err);
  }
})

// listener

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
