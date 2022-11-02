const mongoose = require('mongoose');
const ExerciseSchema = new mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: Date
}, {versionKey: false});

const ExerciseModel = mongoose.model('Exercises', ExerciseSchema);

module.exports = ExerciseModel;