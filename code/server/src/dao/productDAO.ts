import db from '../db/db';
import { Product } from '../components/product';
import * as errors from '../errors/productError';

class ProductDAO {
	/**
	 * Function used to register the arrival of a new product with the same model.
	 * Subsequent arrivals use a different API.
	 * 409 error if the model is already in the database
	 * 400 error  when arrivalDate is after the currentDate
	 */
	registerNewProduct(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			try {
				const sql =
					'INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)';
				db.run(sql, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					resolve();
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that will increase the model quantity by newQuantity amount.
	 * @param model : the model of which we want to increase the quantity
	 * @param newQuantity : the amount of which we want to increase the model's quantity
	 * @param todayDate : a string that represents today date
	 * @returns A Promise that will resolve to true or false depending on the update result
	 */
	increaseProductQuantity(model: string, newQuantity: number): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			try {
				const sql = 'UPDATE products SET quantity = quantity + ? WHERE model = ?';
				db.run(sql, [newQuantity, model], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						return reject(false);
					}
					resolve(true);
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/**
	 * Function that given a model name decreases it's quantity in the db by quantity amount
	 * @param model : the model name of which we want to change quantity
	 * @param quantity : the amount of which we want to decrease the quantity
	 * @returns A Promise that will resolve to either true or false depending from the update result
	 */
	decreaseProductQuantity(model: string, quantity: number): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			try {
				const sql = 'UPDATE products SET quantity = quantity - ? WHERE model = ?';
				db.run(sql, [quantity, model], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					resolve(true);
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that returns true or false depending if a specific model
	 * is already present in the database or not
	 * @param model : the model string we need to search in the database
	 * @returns A Promise that will resolve to true if the product is found, false otherwise
	 */
	productModelExists(model: string): Promise<Product | null> {
		return new Promise<Product | null>((resolve, reject) => {
			try {
				const sql = 'SELECT * FROM products WHERE model = ?';
				db.get(sql, [model], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					if (row) {
						let product: Product = new Product(
							row.sellingPrice,
							row.model,
							row.category,
							row.arrivalDate,
							row.details,
							row.quantity,
						);
						return resolve(product);
					}
					if (!row) {
						return resolve(null);
					}
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that given a model returns the quantity present in the database
	 * @param model : the model of which we want to know the quantity
	 * @returns A Promise that will resolve to a number
	 */
	getProductQuantity(model: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			try {
				const sql = 'SELECT quantity FROM products WHERE model=?';
				db.get(sql, [model], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					if (row) {
						resolve(row.quantity);
					} else {
						reject(new errors.ProductNotFoundError());
					}
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/**
	 * Function that returns the whole products table
	 * @param onlyAvailable : a boolean that selects if we want to retrieve only available products or not
	 * @returns A Promise that will resolve to an array of rows
	 */
	getAllProductsData(onlyAvailable: boolean): Promise<Product[]> {
		return new Promise<Product[]>((resolve, reject) => {
			try {
				let sql: string;
				if (onlyAvailable) {
					sql = 'SELECT * FROM products WHERE quantity > 0';
				} else {
					sql = 'SELECT * FROM products';
				}
				db.all(sql, [], (err: Error | null, rows: any) => {
					if (err) {
						console.log(err);
						return reject(err);
					}
					let products: Product[] = rows.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
					resolve(products);
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/**
	 * Function that returns all the rows of all the products filtering by category
	 * @param onlyAvailable : boolean, selects the retrival of only the available products or every product
	 * @param category : the category to use as a filter
	 * @returns A Promise that will resolve to an array of products rows
	 */
	getAllProductsDataByCategory(onlyAvailable: boolean, category: string): Promise<Product[]> {
		return new Promise<Product[]>((resolve, reject) => {
			try {
				let sql: string;
				if (onlyAvailable) {
					sql = 'SELECT * FROM products WHERE category = ? AND quantity > 0';
				} else {
					sql = 'SELECT * FROM products WHERE category = ?';
				}
				db.all(sql, [category], (err: Error | null, rows: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					let products: Product[] = rows.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
					resolve(products);
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that will return all the columns of the table products
	 * @param onlyAvailable
	 * @param model
	 * @returns A Promise that will resolve to the requested rows
	 */
	getAllProductsDataByModel(onlyAvailable: boolean, model: string): Promise<Product[]> {
		return new Promise<Product[]>((resolve, reject) => {
			try {
				let sql: string;
				if (onlyAvailable) {
					sql = 'SELECT * FROM products WHERE model = ? AND quantity > 0';
				} else {
					sql = 'SELECT * FROM products WHERE model = ?';
				}
				db.all(sql, [model], (err: Error | null, rows: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					let products: Product[] = rows.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
					resolve(products);
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function that deletes all products inside the database
	 * @returns A promise that will resolve to true of false depending from the result of the DELETE
	 */
	deleteAllProducts(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			try {
				const sql = 'DELETE FROM products';
				db.run(sql, [], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						return resolve(false);
					}
					resolve(true);
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/**
	 * Function that deletes a single product record
	 * @param model : a string that represents the product model
	 * @returns A Promise that will return either true or false depening from the result of the DELETE
	 */
	deleteProduct(model: string): Promise<boolean> {
		var deleteProduct = 'DELETE FROM products WHERE model = ?';
		var deleteProductFromUnpaidCart = 'DELETE\
       									  FROM cartsProducts\
       									  WHERE model = ? AND id IN (SELECT id\
       									  FROM carts\
       									  WHERE not(paid))';
		return new Promise<boolean>((resolve, reject) => {
			try {
				db.serialize(function () {
					db.run(deleteProduct, [model], (err: Error | null) => {
						if (err) {
							console.log(err.message);
							return reject(err);
						}
					});
					db.run(deleteProductFromUnpaidCart, [model], (err: Error | null) => {
						if (err) {
							console.log(err.message);
							return reject(err);
						}
						// if we did both of them we are done
						resolve(true);
					});
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}
}

export default ProductDAO;
