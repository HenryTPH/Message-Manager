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
            res.redirect('/b/' + result.board + '/' + result.id)
          })
          .catch(err => {
            console.error('Error creating message: ', err)
            res.status(500).json({error: 'Error creating new message'})
          })
  })

  .get((req, res) => {
    Msg.find({board: req.params.board})
        .sort({bumped_on: 'desc'})
        .limit(10)
        .select('-delete_password -reported')
        .lean()
        .then(result => {
          result.forEach(rs => {
            rs['replycount'] = rs.replies.length
            
            // Sort the result by created date
            rs.replies.sort((rep1, rep2) => {
              return rep2.created_on - rep1.created_on
            })
            // Only display 3 recent replies
            rs.replies = rs.replies.slice(0,3)
            // Eliminate reported and delete_password field in replies
            rs.replies.forEach(rep => {
              delete rep.delete_password
              delete rep.reported
            });
          })
          return res.json(result)
        }).catch(err => {
          console.error(err)
        })
  })

  .put((req, res) => {
    Msg.findByIdAndUpdate(
      req.body.thread_id,
      {reported: true},
      {new: true}
    ).then(rs => {
      if(rs) return res.json('success')
    })
  })

  .delete((req, res) => {
    let data = req.body
    Msg.findById(data.thread_id)
      .then(result => {
        if(!result) return res.json('Not found')
        if(result.delete_password === data.delete_password){
          Msg.findByIdAndDelete(data.thread_id)
            .then(result => {
              if(result) return res.json('success')
            })
        } else {
          res.json('incorrect password')
        }
      }).catch(err => {
        console.error(err)
      })
  })
    
  app.route('/api/replies/:board')
  .post(async (req, res) => {
    let data = req.body
    let newReply = new Reply(data)
    
    newReply.created_on = new Date().toUTCString()
    newReply.reported = false
    
    Msg.findByIdAndUpdate(
        data.thread_id,
        {$push: {replies: newReply}, bumped_on: new Date().toUTCString()},
        {new: true}
      ).then(updatedMsg => {
        res.redirect('/b/' + updatedMsg.board + '/' + updatedMsg.id + '?new_reply_id=' + newReply.id)
      }).catch(err => {
        console.error(err)
      })    
  })

  .get((req, res) => {
    let threadId = req.query.thread_id
    Msg.findById(threadId, '-delete_password -reported')
      .then((result) =>  {
        
        result.replies.sort((rep1, rep2) => {
          return rep2.created_on - rep1.created_on
        })
        
        result.replies.forEach(rs => {
          rs.delete_password = undefined
          rs.reported = undefined
        })
        return res.json(result)
      }).catch(err =>{
        console.error(err)
      })
  })

  .put((req, res) => {
    let data = req.body
    Msg.findById(data.thread_id)
      .then(result => {
        if(!result) return res.json('Thread Not Found')
        result.replies.forEach(rep => {
          if(rep.id === data.reply_id){
            rep.reported = true            
          }
        })
        result.save().then(rs =>{
          return res.json('reported')
        })
      })
  })

  .delete((req, res) => {
    let data = req.body
    Msg.findById(data.thread_id)
      .then(result => {
        if(!result) return res.json('Not found!')
        result.replies.forEach(rep => {
          if(rep.id === data.reply_id){
            if(rep.delete_password === data.delete_password){
              rep.text = '[deleted]'
            } else {
              return res.json('incorrect password ')
            }
          } 
        })
        result.save().then(result => {
          if(result) return res.json('success')
        })
      })
  })

};
