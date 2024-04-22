const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    let msgId
    let replyId
    let pass = 'test'

    test('Create a new message', (done) => {
        chai.request(server)
            .post('/api/thread/test')
            .send({
                board: 'test',
                text: 'Functional test thread',
                delete_password: pass
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                let newMsgId = res.redirect[0].split('/')[res.redirect[0].split('/').length - 1]
                msgId = newMsgId
                done()
            })
    })

    test('Post a reply', (done) => {
        chai.request(server)
            .post('/api/replies/test')
            .send({
                thread_id: msgId,
                text: 'Test reply to a thread',
                delete_password: pass
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                let createdReplyId = res.redirect[0].split('=')[res.redirect[0].split('=').length - 1]
                replyId = createdReplyId
                done()
            })
    })

    test('Get msg from a board', done =>{
        chai.request(server)
            .get('api/threads/:board')
            .send()
            .end((err, res) => {
                assert.isArray(res.body)
                assert.isAtMost(res.body.length, 10)
                let secondMsg = res.board[1]
                assert.isAtMost(secondMsg.replies.length, 3)
                done()

            })
    })

    test('Get replies on a thread', done => {
        chai.request(server)
            .get('/api/replies/test')
            .query({thread_id: msgId})
            .send()
            .end((err, res) => {
                let msg = res.body
                assert.equal(msg._id, msgId)
                assert.isUndefined(msg.delete_password)
                assert.isArray(msg.replies)
                done()
            })
    })
});
