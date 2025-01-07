const express=require('express');
const path=require('path');
const bodyParser=require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const multer = require('multer');
const csrf = require('csurf')
const flash = require('connect-flash')


const errorControler = require('./controllers/error');
const User=require('./models/user')

const MONGODB_URI = '';

const app=express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,'images');
    },
    filename:(req,file,cb) => {
        const timestamp = Date.now(); // Get current timestamp
        console.log(timestamp)
        cb(null, `${timestamp}-${file.originalname}`);
    }
})

const fileFilter = (req,file,cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype ==='image/jpeg') {
        cb(null,true);
    } else {
        cb(null,false);
    }
};

app.set('view engine','ejs');
app.set('views','views')

const routesAdmin=require('./Routes/admin');
const routesShop=require('./Routes/shop');
const routesAuth=require('./Routes/auth');
const { error } = require('console');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage , fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname,'public')))
app.use('/images',express.static(path.join(__dirname,'images')))

app.use(
    session({ secret: 'my secret', resave: false, saveUninitialized: false,store:store })
)
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next()
})

app.use((req,res,next) => {
    // throw new Error('Error');
    if(!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id)
        .then(user => {
            if(!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => { 
            next(new Error(err))     
})
});

app.use(routesShop);
app.use('/admin',routesAdmin);
app.use(routesAuth);
app.get('/500', errorControler.get500);
app.use(errorControler.get404);
app.use((error, req, res, next) => {
    // res.redirect('/500'); 
    res.status(500).render('500', { 
        pageTitle: 'Error',
        path: '/500',
        isAuthenticated:req.session.isLoggedIn

    })
})

mongoose
.connect(MONGODB_URI)
.then(result => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
})