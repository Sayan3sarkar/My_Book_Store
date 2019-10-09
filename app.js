const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const shopController = require('./controllers/shop');

const isAuth = require('./middleware/is-auth');

const errorController = require('./controllers/error');
//const mongoConnect = require('./util/database').mongoConnect;//We don't need to separately setup our database while using mongoose
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const User = require('./models/user');

const fileStorage = multer.diskStorage({ //setting up storage config for file upload
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => { //Allowing only certain types of files to be uploaded

    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const MONGODB_URI = '***';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false })); //Request Body Parsing Middleware

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')); //File Storage Middleware

app.use(express.static(path.join(__dirname, 'public'))); //Static File Declaration middleware, public folder in our case to display css
app.use('/images', express.static(path.join(__dirname, 'images'))); //Server files statically for every request to /images
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
})); //session middleware

app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn; //locals stores data we want to pass in every view we render
    next();
});

app.use((req, res, next) => { //giving request.user all facilities of user model
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
})

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection); //csrf token middleware
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);
app.use(errorController.get500);

app.use((error, req, res, next) => { //Special Error Handling Middleware
    console.log(error);
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
})

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(3000);
    })
    .catch(err => console.log(err));