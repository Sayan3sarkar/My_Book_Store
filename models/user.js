const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, //ref created a relation indicating that productId created will be related to the Product Model
            quantity: { type: Number, required: true }
        }]
    },
    resetToken: String,
    resetTokenExpiration: Date
})

userSchema.methods.addToCart = function(product) { //Schema.methods allows us to define our own methods, i.e. addToCart in our case
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString(); //since product being passed to cart is fetched from database
        //thus, product._id is not a string but === checks for equality
        // of value as well as type. So we convert both sides to String
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) { //If Item exists in cart
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity; //Just increase quantity of item in cart
    } else {
        updatedCartItems.push({
            productId: product._id, //Automatically converted to mongodb.ObjectId(product._id) by mongoose
            quantity: newQuantity
        }); //Item does not exist in cart. Push whole item to cart
    }
    const updatedCart = { items: updatedCartItems };
    this.cart = updatedCart;
    return this.save(); //mongoose method. Adds new product to cart or updates count of existing product in cart
}

userSchema.methods.deleteItemFromCart = function(productId) { //Schema.methods allows us to define our own methods, i.e. deleteItemFromCart in our case
    const updatedCartItems = this.cart.items.filter(item => item.productId.toString() !== productId.toString());
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('User', userSchema); //In DB, mongoose will take the model name(User), pluralise it and convert it to lower case i.e, collection created is named 'users'

//----------------------------- MongoDB Approach ---------------------------------------------------

// const mongodb = require('mongodb');
// //const getDb = require('../util/database').getDb;

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart; //{items: []}
//         this._id = id;
//     }

//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this)
//     }

//     addToCart(product) {
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString(); //since product being passed to cart is fetched from database
//             //thus, product._id is not a string but === checks for equality
//             // of value as well as type. So we convert both sides to String
//         });
//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];

//         if (cartProductIndex >= 0) { //If Item exists in cart
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity; //Just increase quantity of item in cart
//         } else {
//             updatedCartItems.push({ productId: new mongodb.ObjectID(product._id), quantity: newQuantity }); //Item does not exist in cart. Push whole item to cart
//         }
//         const updatedCart = { items: updatedCartItems };
//         const db = getDb();
//         return db.collection('users').updateOne({ _id: new mongodb.ObjectID(this._id) }, { $set: { cart: updatedCart } });
//     }

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(i => { //returns id of all products in cart
//             return i.productId;
//         })
//         return db.collection('products').find({ _id: { $in: productIds } }).toArray() //returns details of all products present in cart
//             .then(products => {
//                 return products.map(p => {
//                     return {...p,
//                         quantity: this.cart.items.find(i => {
//                             return i.productId.toString() === p._id.toString();
//                         }).quantity
//                     };
//                 });
//             })
//             .catch(err => console.log(err));
//     }

//     deleteItemFromCart(productId) {
//         const db = getDb();
//         const updatedCartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString();
//         });
//         return db
//             .collection('users')
//             .updateOne({ _id: new mongodb.ObjectID(this._id) }, {
//                 $set: { cart: { items: updatedCartItems } }
//             });
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({ _id: new mongodb.ObjectID(userId) });
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart().then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: new mongodb.ObjectID(this._id),
//                         name: this.name
//                     }
//                 };
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = { items: [] };
//                 return db
//                     .collection('users')
//                     .updateOne({ _id: new mongodb.ObjectID(this._id) }, {
//                         $set: { cart: { items: [] } }
//                     });
//             })
//             .catch(err => console.log(err));
//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({ 'user._id': new mongodb.ObjectID(this._id) })
//             .toArray();
//     }
// }

// module.exports = User;