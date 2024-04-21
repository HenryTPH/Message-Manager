'use strict';
let mongodb = require('mongodb')
let mongoose = require('mongoose')
let httpRequest = require('xmlhttprequest').XMLHttpRequest

module.exports = function (app) {
  let uri = "mongodb+srv://hungtp2912:"+ encodeURIComponent(process.env.PW)+"@cluster0.sgaqi8v.mongodb.net/Message_Manager?retryWrites=true&w=majority&appName=Cluster0";
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true})

  let replySchema = new mongoose.Schema({
    text: {type: String, required: true},
    delete_password: {type: String, required: true},
    created_on: {type: Date, required: true},
    reported: {type: Boolean, required: true}
  })

  let msgSchema = new mongoose.Schema({
    board: {type: String, required: true},
    text: {type: String, required: true},
    created_on: {type: Date, required: true},
    bumped_on: {type: Date, required: true},
    reported: {type: Boolean, default: false},
    delete_password: {type: String, required: true},
    replies: [replySchema]
  })
  let Reply = mongoose.model('Reply', replySchema)
  let Msg = mongoose.model('message', msgSchema)

  app.route('/api/threads/:board')
  .post((req, res) => {
    let data = req.body
    let newMsg = new Msg(data)

    if(!newMsg.board || newMsg.board === '') {
       newMsg.board = req.params.board
    }

    newMsg.created_on = new Date().toUTCString()
    newMsg.bumped_on = new Date().toUTCString()
    newMsg.reported = false
    newMsg.replies = []

    newMsg.save()
          . then((result) => {
            console.log('New Msg created: ', result)
            res.redirect('/b/' + result.board + '/' + result.id).status(200)
          })
          .catch(err => {
            console.error('Error creating message: ', err)
            res.status(500).json({error: 'Error creating new message'})
          })
  })

  .get((req, res) => {
    Msg.find({board: res.params.board})
        .sort({bumped_on: 'desc'})
        .limit(10)
        .select('-delete_password -reported')
        .lean()
        .exec((err, array) => {
          if(!err && array) {
            
          }
        })
  })

  .put((req, res) => {

  })

  .delete((req, res) => {

  })
    
  app.route('/api/replies/:board')
  .post(async (req, res) => {
    let data = req.body
    let newReply = new Reply(data)
    
    newReply.created_on = new Date().toUTCString()
    newReply.reported = false
    console.log('This is new Reply:' + newReply)
    
    Msg.findByIdAndUpdate(
        data.thread_id,
        {$push: {replies: newReply}, bumped_on: new Date().toUTCString()},
        {new: true}
      ).then(updatedMsg => {
        console.log('update msg: ' + updatedMsg)
        console.log('Thread ID: ' + data.thread_id)
        res.redirect('/b/' + updatedMsg.board + '/' + updatedMsg.id + '?new_reply_id=' + newReply.id)
      }).catch(err => {
        console.error(err)
      })    
  })

  .get((req, res) => {

  })

  .put((req, res) => {
    
  })

  .delete((req, res) => {
    
  })

};
