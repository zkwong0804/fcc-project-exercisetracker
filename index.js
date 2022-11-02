const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const User = require('./User');
const Exercise = require('./Exercise');
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({extended: false}));
let s = process.env;
console.log(`MONGO CONNECTIONSTRING: ${process.env.MONGO_CONNECTIONSTRING}`);
mongoose.connect(process.env.MONGO_CONNECTIONSTRING);

// POST : /api/users

function getAllUsersHandler(req, res) {
  console.log('Get all users')
  User.find({}, function(err, docs) {
    if (err) {
      handleError(err);
      return;
    }

    res.json(docs);
  });
}

function addUserHandler(req, res) {
  const username = req.body.username;
  const user = new User({username});
  console.log('Add following user:')
  console.log(user);
  
  user.save()
    .then(docs => res.json(docs))
    .catch(err => {
      handleError(err);
    });
}

function addExerciseToUserByIdHandler(req, res) {
  console.log('POST: addExerciseToUserByIdHandler')
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;
  if (!userId || !description || !duration) {
    handleError('Invalid id, description or duration', res);
    return;
  }

  if (date) {
    date = (new Date(date)).toDateString();
  } else {
    date = (new Date()).toDateString();
  }

  User.findById(userId, function(err, doc) {
    let user = doc;
    if (err) {
      handleError(err, res);
    }

    const exercise = new Exercise({
      username: user.username,
      description,
      duration,
      date
    });

    exercise.save()
      .then(ex => {
        let userJson = user.toJSON();
        userJson.description = ex.description;
        userJson.duration = ex.duration;
        userJson.date = ex.date.toDateString();
        res.json(userJson);
      })
      .catch(err => handleError(err, res));

  });
}

function getExerciseLogsHandler(req, res) {
  const userId = req.params._id;
  let from =  req.query.from;
  let to = req.query.to;
  const limit = Number(req.query.limit);

  if (from) {
    from = new Date(from);
  }

  if (to) {
    to = new Date(to);
  }

  if (!userId) {
    handleError('_id cannot be empty', res);
    return;
  }



  User.findById(userId).exec()
    .then(doc => {
      const user = doc;
      let exerciseQuery = Exercise.find({username: user.username}).select('-_id -username');
      // from exist
      if (from && !isNaN(from)) {
        exerciseQuery = exerciseQuery.where('date').gte(from);
      }
      // to exist
      if (to && !isNaN(to)) {
        exerciseQuery = exerciseQuery.where('date').lte(to);
      }
      // limit exist
      if (!isNaN(limit) && limit > 0) {
        exerciseQuery = exerciseQuery.limit(limit);
      }

      //exec query
      exerciseQuery
        .exec()
          .then(doc2 => {
            let exercises = doc2;
            exercises = exercises.map(x => {
              x._doc.date = x._doc.date.toDateString("en-us", {timeZone: "Asia/Kuala_Lumpur"});
              return x;
            });
            let userJson = user.toJSON();
            userJson.count = exercises.length
            userJson.log = exercises;
            res.json(userJson);
          })
          .catch(err => handleError(err, res));
    })
    .catch(err => handleError(err, res));

}

function handleError(err, res) {
  console.error(err);
  res.send(err);
}

app.route('/api/users')
  .get(getAllUsersHandler)
  .post(addUserHandler);

app.route('/api/users/:_id?/exercises')
  .post(addExerciseToUserByIdHandler);

app.route('/api/users/:_id?/logs')
  .get(getExerciseLogsHandler)




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
