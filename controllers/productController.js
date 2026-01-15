import Product from "../models/Product.js";
import { isAdmin } from "./userController.js";

export function createProduct(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}

	const product = new Product(req.body);

	product
		.save()
		.then(() => {
			res.json({
				message: "Product created successfully",
			});
		})
		.catch((error) => {
			res.status(500).json({
				message: "Error creating product",
				error: error.message,
			});
		});
}

export function getAllProducts(req, res) {
  // console.log("product fetching");
	if (isAdmin(req)) {
		Product.find()
			.then((products) => {
				res.json(products);
			})
			.catch((error) => {
				res.status(500).json({
					message: "Error fetching products",
					error: error.message,
				});
			});
	} else {
		// Product.find()
    Product.find({ isAvailable: true })
			.then((products) => {
				res.json(products);
			})
			.catch((error) => {
				res.status(500).json({
					message: "Error fetching products",
					error: error.message,
				});
			});
	}
}

export function deleteProduct(req,res){
  if(!isAdmin(req)){
    res.status(403).json({
      message : "Only admin can delete products"
    })
    return
  }

  const productID = req.params.productID //request eke parameters wl dala ewana productID ek gnn kiyala thama methana kiynne

  Product.deleteOne({productID : productID}).then(
    ()=>{
      res.json({
        message : "Product Deleted Successfully"
      })
    }
  )
}

export function updateProduct(req,res){
  if(!isAdmin(req)){
    res.status(403).json({
      message : "Only admins can update products"
    })
    return
  }

  const productID = req.params.productID

  Product.updateOne({productID : productID},req.body).then(
    ()=>{
      res.json({
        message : "Product Updated Successfully"
      })
    }
  )
}

export function getProductByID(req,res){
  const productID = req.params.productID
//Create, Read, Update, Delete
  Product.findOne({productID : productID}).then(
    (product)=>{
      if(product == null){
        res.status(404).json({
          message : "Product Not Found"
        })
      }
      else{
        res.json(product)
      }
    }
  ).catch(
    (error)=>{
      res.status(500).json({
        message : "Error fetching products",
        error : error.message
      })
    }
  )
}

export async function searchProducts(req,res){
  const query = req.params.query

  try{
    const products = await Product.find(
      {
        $or : [
          {productName : {$regex : query, $options : "i"}}, //$regex is for pattern matching, $options "i" is for case insensitive
          {altNames : {$elemMatch : {$regex : query, $options : "i"}}}
        ],
        isAvailable : true
      }
    )

    return res.json(products)

  }catch(error){
    res.status(500).json({
      message : "Error searching products",
      error : error.message
    })
  }
}