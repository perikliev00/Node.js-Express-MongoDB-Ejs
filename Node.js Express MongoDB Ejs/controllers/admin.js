const Product = require('../models/product');
const {validationResult} = require('express-validator');
const mongoose = require('mongoose');
const fileHelper = require('../utill/file')


exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product' , {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors:[]
    });
};

exports.postEditProduct = (req,res,next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice= req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const errors = validationResult(req)
    if(!image) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true ,
            product:{
                title:updatedTitle,
                price:updatedPrice,
                description:updatedDesc,
                _id:prodId
            },
            errorMessage: 'Attached file is not and image',
            validationErrors:errors.array()
        });
    }
    if(!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
             pageTitle: 'Edit Product',
             path: '/edit/add-product',
             editing: true,
             hasError: true ,
             product:{
                 title:updatedTitle,
                 price:updatedPrice,
                 description:updatedDesc,
                 _id:prodId
             },
             errorMessage: errors.array()[0].msg,
             validationErrors:errors.array()
         });
 
     }
    Product.findById(prodId)
    .then(product => {  
        console.log(product);  
        console.log(product.userId);    
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/')
        }
        product.title=updatedTitle;
        product.price=updatedPrice;
        product.description=updatedDesc;
        if(image) {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = image.path;
        }
        else if (!image && product.imageUrl) {
            // No new image uploaded, keep the old one
            product.imageUrl = product.imageUrl;
        } 

        else {
             
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/edit/add-product',
            editing: true,
            hasError: true ,
            product:{
                title:updatedTitle,
                price:updatedPrice,
                description:updatedDesc 
            },
            errorMessage: 'Attached file is not and image',
            validationErrors:[]
        });
    }
        product
        .save()
        .then(result => {
            console.log('Updated');
            res.redirect('/admin/products')
        })

    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return next(new Error('Product no found.'))
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({ _id: prodId, userId: req.user._id})
    })
    .then(() => {
        console.log('Product Destroyed');
        res.status(200).json({ messege: 'Succsess' });
    })
    .catch(err => {
        res.status(500).json({ messege: 'Delete products failed.' });
    })
}

exports.getEditProduct = (req,res,next) => {
    const editMode = req.query.edit;
     if(!editMode) {
         return res.redirect('/')
    }
    const prodId=req.params.productId;
    Product.findById(prodId)
        .then(product=> {
        if(!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/edit/add-product',
            editing: editMode,
            product:product,
            hasError:false,
            errorMessage:null,
            validationErrors:[]
        });

    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};

exports.postAddProduct =(req,res,next) => {
    const title=req.body.title;
    const image=req.file;
    const description=req.body.description;
    const price=req.body.price;
    const errors = validationResult(req);
    console.log(image);
    if(!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true ,
            product:{
                title:title,
                price:price,
                description:description 
            },
            errorMessage: 'Attached file is not and image',
            validationErrors:errors.array()
        });
    }

    if(!errors.isEmpty()) {
        console.log(errors.array());
       return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true ,
            product:{
                title:title,
                price:price,
                description:description 
            },
            errorMessage: errors.array()[0].msg,
            validationErrors:errors.array()
        });

    }

    const imageUrl = image.path;

    const product = new Product({
        // _id: new mongoose.Types.ObjectId('670d5899efee8a2d401bb822'),
        title:title,
        price:price,
        description:description,
        imageUrl:imageUrl,
        userId:req.session.user._id,
    });
    product
    .save()
    .then(result => {
        console.log("Created Product");
        res.redirect('/products');
    })
    .catch(err => {
    //     return res.status(500).render('admin/edit-product', {
    //         pageTitle: 'Add Product',
    //         path: '/admin/add-product',
    //         editing: false,
    //         hasError: true ,
    //         product:{
    //             title:title,
    //             imageUrl:imageUrl,
    //             price:price,
    //             description:description 
    //         },
    //         errorMessage: 'Data base operation failed, please try again!',
    //         validationErrors:[]
    //     });

    // })
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
    })
}

exports.getProducts = (req,res,next) => {
    Product.find({userId:req.user._id})
    .then(products => {
        res.render('admin/products', {
            prods: products,
            pageTitle: "Admin Products",
            path: "/admin/products",
        });
     })
     .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};