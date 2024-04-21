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
});
