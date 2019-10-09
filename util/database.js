const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('***') //shop database gets created on the fly if not exists
        .then(client => {
            console.log('Connected');
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err)
            throw err;
        });
}

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No Database Found';
}
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;