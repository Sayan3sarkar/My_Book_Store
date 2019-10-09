const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://Sayan_pursuit:wzqlyCVN5HR35mHT@cluster0-kdxgg.mongodb.net/shop?retryWrites=true&w=majority') //shop database gets created on the fly if not exists
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