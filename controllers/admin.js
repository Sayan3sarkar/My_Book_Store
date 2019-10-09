const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);
    if (!image) {
        res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Attached File is not an image',
            validationErrors: []
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                // imageUrl: imageUrl,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
    });
    product
        .save() //mongoose method
        .then(result => {
            //console.log('Product Added Successfully', result);
            req.flash('success', 'Product successfully Added!!');
            res.redirect('/admin/products');
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId) //mongoose method
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.description = updatedDesc;
            const errors = validationResult(req);

            return product.save() //mongoose method. Since save() is called on an exisitng object, it performs an update operation
                .then(result => {
                    //console.log('Updated Product:', result);
                    req.flash('success', 'Product successfully Updated!!');
                    res.redirect('/admin/products');
                })
                .catch(err => console.log(err));
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => { //View all Products

    let successMessage = req.flash('success');
    if (successMessage.length > 0) {
        successMessage = successMessage[0];
    } else {
        successMessage = null;
    }

    Product.find({ userId: req.user._id }) //mongoose method
        //.select('title price -_id') //mongoose method which allows us to retrieve only specific fields from a collection
        //.populate('userId') //mongoose method which helps to retrieve entire user data from Product with only userId being passed to Product
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
                successMessage: successMessage
            });
        })
        .catch(err => { //res.redirect('/500')
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// exports.postDeleteProduct = (req, res, next) => {
//     const prodId = req.params.productId;
//     Product.findById(prodId)
//         .then(product => {
//             if (!product) {
//                 return next(new Error('No Product Found'));
//             }
//             fileHelper.deleteFile(product.imageUrl);
//             return Product.deleteOne({ _id: prodId, userId: req.user._id });
//         })
//         /*findByIdAndRemove(prodId)*/ //mongoose method
//         .then(() => {
//             //console.log('Product Destroyed')
//             req.flash('success', 'Product succesfully deleted');
//             res.redirect('/admin/products');
//             // res.status(200).json({ message: 'Success' });
//         })
//         .catch(err => {
//             // res.status(500).json({ message: 'Deleting Product Failed' });
//             const error = new Error(err);
//             error.httpStatusCode = 500;
//             return next(error);
//         });
// };

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            req.flash('success', 'Product succesfully deleted');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};