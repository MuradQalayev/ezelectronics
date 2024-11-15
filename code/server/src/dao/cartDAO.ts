import db from '../db/db';
import { Cart, ProductInCart } from '../components/cart';
import * as productErrors from '../errors/productError';
import { rejects } from 'assert';
import { Product } from '../components/product';

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

	/**
	 * Function to retrieve the id of the only unpaid cart of the user (if present)
	 * @param username The username of the user of which we want the cartId
	 * @returns A Promise that will resolve to the id of the cart
	 */
	getLastCartId(username: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			try {
				const sql = 'SELECT id FROM carts WHERE customer = ? AND not(paid)';
				db.get(sql, [username], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						reject(err);
					} else if (row) {
						resolve(row.id);
					} else {
						// No cart can have an id of zero
						resolve(0);
					}
				});
			} catch (error) {
				console.log(error.message);
				rejects(error);
			}
		});
	}

	/**
	 * Function that creates a new cart for the user
	 * @param username The username associated to the user
	 * @returns A Promise that will resolve to the id of the cart just created
	 */
	createNewUserCart(username: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			try {
				const sql = 'INSERT INTO carts(customer, paid, paymentDate) VALUES (?, ?, ?)';
				db.run(sql, [username, 0, null], function (err: Error | null) {
					if (err) {
						console.log(err.message);
						return reject(false);
					}
					resolve(this.lastID);
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that checks if a product is already present in the user cart. If yes the product quantity
	 * is increased, if not a new product in cart record is inserted in the database
	 * @param cartId The id of the cart in which we have to manipulate the quantity of products
	 * @param productData The model of the product of which we need to manipulate the quantity
	 * @returns A Promise that will resolve to either true or false depending on the result
	 */
	addProductToCart(cartId: number, productData: Product): Promise<Boolean> {
		// all the different possible query's
		var productInCartAlreadyPresent = 'SELECT * FROM cartsProducts WHERE model = ? AND id = ?';
		var increaseProductQuantity = 'UPDATE cartsProducts SET quantity = quantity + ? WHERE model = ? AND id = ?';
		var addProductToCart = 'INSERT INTO cartsProducts(id, model, quantity, category, sellingPrice) VALUES (?, ?, ?, ?, ?)';

		return new Promise((resolve, reject) => {
			try {
				db.serialize(function () {
					db.get(productInCartAlreadyPresent, [productData.model, cartId], (err: Error | null, row: any) => {
						if (err) {
							console.log(err.message);
							return reject(false);
						} else if (row === undefined) {
							// the product is not already in the cart
							db.serialize(function () {
								db.run(
									addProductToCart,
									[cartId, productData.model, 1, productData.category, productData.sellingPrice],
									(err: Error | null) => {
										if (err) {
											console.log(err.message);
											return reject(false);
										}
									},
								);
							});
						} else {
							// if it's not undefined it means we already have one record for the cart
							db.serialize(function () {
								db.run(increaseProductQuantity, [1, productData.model, cartId], (err: Error | null) => {
									if (err) {
										console.log(err.message);
										return reject(false);
									}
								});
							});
						}
					});
				});
				// at this point we have done everything, we can resolve
				resolve(true);
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that retrieves a user cart and all of the products inside
	 * @param cartId the id of the cart that must be retrieved
	 * @returns A Promise that will resolve to the user cart
	 */
	getCartData(cartId: number): Promise<Cart> {
		var userCart: Cart;
		var retrieveUserCart = 'SELECT customer, paid, paymentDate FROM carts WHERE id = ?';
		var retrieveCartProducts = 'SELECT cartsProducts.model, cartsProducts.quantity, cartsProducts.category, cartsProducts.sellingPrice \
       							    FROM cartsProducts \
       								WHERE cartsProducts.id = ?';
		return new Promise<Cart>((resolve, reject) => {
			try {
				db.serialize(function () {
					db.get(retrieveUserCart, [cartId], (err: Error | null, row: any) => {
						if (err) {
							console.log(err.message);
							return reject(err);
						}
						// if we are here, we have one row -> we are checking if the user has a cart in the controller
						userCart = new Cart(row.customer, row.paid, row.paymentDate, 0, []);
					});
					// we have the cart, let's get the products
					db.each(
						retrieveCartProducts,
						[cartId],
						(err: Error | null, row: any) => {
							// we don't need error handling. i think.
							let productRecord = new ProductInCart(row.model, row.quantity, row.category, row.sellingPrice);
							userCart.products.push(productRecord);
							userCart.total = parseFloat(
								userCart.products.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2),
							);
						},
						err => {
							if (err) {
								console.log(err.message);
								return reject(err);
							}
							if (userCart) {
								resolve(userCart);
							}
						},
					);
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * This function returns true or false depending if we have enough products in the inventory to complete
	 * the sell of a specific cart
	 * @param cartId The id of the cart we are interested to check the quantity on
	 * @returns A Promise that will resolve to either true or false depending on the quantity of products in the inventory
	 */
	isProductQuantityEnough(cartId: number): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			try {
				let getProductQuantity = 'SELECT products.quantity AS prodQuantity, cartsProducts.quantity AS cartQuantity \
         							  FROM cartsProducts INNER JOIN products ON cartsProducts.model = products.model \
         							  WHERE cartsProducts.id = ?';
				db.each(
					getProductQuantity,
					[cartId],
					(err: Error | null, row: any) => {
						if (err) {
							console.log(err.message);
							return reject(false);
						}
						if (row.prodQuantity === 0) {
							return reject(new productErrors.EmptyProductStockError());
						}
						if (row.prodQuantity - row.cartQuantity < 0) {
							return reject(new productErrors.LowProductStockError());
						}
					},
					() => {
						resolve(true);
					},
				);
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function responsible of completing a sell of a cart. We take the id of the cart, we decrement the quantity
	 * of the product stock of the quantity of the item in the cart and we mark the cart as paid with today's date
	 * @param cartId The id that is being paid for
	 * @param todaysDate The date of the payment
	 * @returns A Promise that will resolve to true or false depending from the result of the operations
	 */
	completeSell(cartId: number, todaysDate: string): Promise<Boolean> {
		const decreaseProdQuantity = 'UPDATE products \
    								SET quantity = quantity - (SELECT quantity \
                               								   FROM cartsProducts \
                               								   WHERE cartsProducts.model = products.model AND cartsProducts.id = ?)\
    								WHERE products.model IN (SELECT cartsProducts.model\
                             								 FROM cartsProducts\
                             								 WHERE cartsProducts.id = ?)';
		var markCartAsSold = 'UPDATE carts\
       						  SET paid = 1, paymentDate = ?\
       						  WHERE carts.id = ?';
		return new Promise((resolve, reject) => {
			db.serialize(function () {
				db.run(decreaseProdQuantity, [cartId, cartId], function (err: Error | null) {
					if (this.changes === 0) {
						return reject(false);
					}
					db.serialize(function () {
						db.run(markCartAsSold, [todaysDate, cartId], (err: Error | null) => {
							if (err) {
								console.log(err.message);
								return reject(err);
							}
							resolve(true);
						});
					})
					resolve(true);
				});
			});
		});
	}

	/**
	 * This function given a user username retrieves a list of all the paid carts associated to that username
	 * @param username The username of the user of which we want the history of the carts
	 * @returns A Promise that will resolve to an array (possibly empty) of numbers (the various cart id's)
	 */
	getPastCartsId(username: string): Promise<number[]> {
		var res: number[] = [];
		return new Promise<number[]>((resolve, reject) => {
			let sql = 'SELECT id FROM carts WHERE paid AND customer = ?';
			db.each(
				sql,
				[username],
				(err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					res.push(row.id);
				},
				() => {
					resolve(res);
				},
			);
		});
	}

	/**
	 * This function is used when in a user cart there is only a single product instance, is used to delete
	 * the whole record
	 * @param cartId The id in which the product is contained
	 * @param model The product model of the product of which we need to delete the record
	 * @returns A Promise that will resolve to either true or false depending from the result
	 */
	deleteProductRecordFromCart(cartId: number, model: string): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			let sql = 'DELETE FROM cartsProducts WHERE id = ? AND model = ?';
			db.run(sql, [cartId, model], (err: Error | null) => {
				if (err) {
					console.log(err.message);
					return reject(false);
				}
				resolve(true);
			});
		});
	}

	/**
	 * Function used to delete a product from a cart
	 * @param cartId The cart interested by the operation
	 * @param model The product model of the product we want to delete
	 * @returns A Promise that will resolve to either true or false depending from the result of the operation
	 */
	deleteProductInstanceFromCart(cartId: number, model: string): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			let sql = 'UPDATE cartsProducts SET quantity = quantity - 1 WHERE id = ? AND model = ?';
			db.run(sql, [cartId, model], (err: Error | null) => {
				if (err) {
					console.log(err.message);
					return reject(false);
				}
				resolve(true);
			});
		});
	}

	/**
	 * Function that given a cartId empties it (deletes all the related cartsProducts)
	 * @param cartdId The id of the cart we want to empty
	 * @returns A Promise that will resolve to either true or false depending from the result of the operation
	 */
	emptyCart(cartdId: number): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			let sql = 'DELETE FROM cartsProducts WHERE id = ?';
			db.run(sql, [cartdId], (err: Error | null) => {
				if (err) {
					console.log(err.message);
					return reject(false);
				}
				resolve(true);
			});
		});
	}

	/**
	 * Function used to delete all the carts of all the users
	 * @returns A Promise that will resolve to true or false depending on the operation result
	 */
	deleteAllCarts(): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			// we don't need serialize, they can run in parallel, there's no constraint on the tables
			let sql1 = 'DELETE FROM carts';
			let sql2 = 'DELETE FROM cartsProducts';
			db.run(sql1, [], (err: Error | null) => {
				if (err) {
					console.log(err.message);
					return reject(false);
				}
				resolve(true);
			});
			db.run(sql2, [], (err: Error | null) => {
				if (err) {
					console.log(err.message);
					return reject(false);
				}
				resolve(true);
			});
		});
	}

	/**
	 * Function used to retrieve all the id's of all the carts (paid and unpaid) in the database
	 * @returns A Promise that will resolve to an array (possibly empty) of numbers (the id's)
	 */
	getAllCartIds(): Promise<number[]> {
		var res: number[] = [];
		return new Promise<number[]>((resolve, reject) => {
			try {
				let sql = 'SELECT id FROM carts';
				db.each(sql, [], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						reject(false);
					}
					res.push(row.id);
				},
					() => {
						resolve(res);
					},
				);
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}
}

export default CartDAO;
