// productController
import ProductDAO from "../dao/productDAO";
import { Product } from "../components/product";
import * as errors from "../errors/productError";
import { DateError } from "../utilities";

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
	private dao: ProductDAO;

	constructor() {
		this.dao = new ProductDAO();
	}

	/**
	 * Registers a new product concept (model, with quantity defining the number of units available) in the database.
	 * @param model The unique model of the product.
	 * @param category The category of the product.
	 * @param quantity The number of units of the new product.
	 * @param details The optional details of the product.
	 * @param sellingPrice The price at which one unit of the product is sold.
	 * @param arrivalDate The optional date in which the product arrived.
	 * @returns A Promise that resolves to nothing.
	 */
	async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
		let date: string = "";
		let dateParam: Date;

		if (arrivalDate !== undefined) {
			dateParam = new Date(arrivalDate);
			if (dateParam > new Date()) {
				throw new DateError();
			}
		}

		if (await this.dao.productModelExists(model) != null) {
			throw new errors.ProductAlreadyExistsError();
		}

		if (arrivalDate === undefined) {
			// if the date is null, we use the date of today
			date = new Date().toISOString().slice(0, 10);
		} else {
			date = dateParam.toISOString();
			date = date.split('T')[0];
		}
		// we can insert the product at this point
		return this.dao.registerNewProduct(model, category, quantity, details, sellingPrice, date);
	}

	/**
	 * Increases the available quantity of a product through the addition of new units.
	 * @param model The model of the product to increase.
	 * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
	 * @param changeDate The optional date in which the change occurred.
	 * @returns A Promise that resolves to the new available quantity of the product.
	 */
	async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {

		// if present, we need to check if changeDate is not after the current date
		if (changeDate !== undefined) {
			let currentDate = new Date();
			let dateParam: Date = new Date(changeDate);
			if (dateParam > currentDate) {
				throw new DateError();
			}
		}

		// this call will return the 404 error if it's not a product in the database
		let productData: Product = await this.dao.productModelExists(model);
		if (productData === null) {
			throw new errors.ProductNotFoundError();
		}

		let date: Date;
		let changeDateAsDate: Date;
		let arrivalDate: Date = new Date(productData.arrivalDate);;

		// if the date wasn't provided we use the date of today
		if (changeDate === undefined) {
			date = new Date();
		} else {
			// instead if the changeDate was provided, we need to check is compatible -> again if it's there it's a date object, trust me bro :)
			changeDateAsDate = new Date(changeDate);
		}
		if (changeDateAsDate < arrivalDate || date < arrivalDate) {
			// the changeDate cannot be before the arrivalDate of the product
			throw new DateError();
		}

		await this.dao.increaseProductQuantity(model, newQuantity);
		return this.dao.getProductQuantity(model);
	}


	/**
	 * Decreases the available quantity of a product through the sale of units.
	 * @param model The model of the product to sell
	 * @param quantity The number of product units that were sold.
	 * @param sellingDate The optional date in which the sale occurred.
	 * @returns A Promise that resolves to the new available quantity of the product.
	 */
	async sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
		let currentDate = new Date();
		let dateParam: Date;

		// we need to check if the date is after today
		if (sellingDate !== undefined) {
			dateParam = new Date(sellingDate);
			if (dateParam > currentDate) {
				throw new DateError();
			}
		}

		// this will throw a 404 error in case the product is not present
		let productData: Product = await this.dao.productModelExists(model);
		if (productData === null) {
			throw new errors.ProductNotFoundError();
		}
		let date: string;
		// once again, if we have a sellingDate we know it's a date under the hood
		if (sellingDate === undefined) {
			date = new Date().toISOString().slice(0, 10);
		} else {
			// instead if the sellingDate was provided, we need to check is compatible
			let arrivalDate: Date = new Date(productData.arrivalDate);
			if (dateParam < arrivalDate) {
				// the sellingDate cannot be before the arrivalDate of the product
				throw new DateError();
			}
			// if we are here the date is valid
			date = dateParam.toISOString();
			date = date.split('T')[0];
		}

		if (productData.quantity === 0) {
			throw new errors.EmptyProductStockError();
		}

		if ((productData.quantity - quantity) < 0) {
			throw new errors.LowProductStockError()
		}

		// we can sell the product
		await this.dao.decreaseProductQuantity(model, quantity);
		return this.dao.getProductQuantity(model);
	}

	/**
	 * Returns all products in the database, with the option to filter them by category or model.
	 * @param grouping An optional parameter. If present, it can be either "category" or "model".
	 * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
	 * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
	 * @returns A Promise that resolves to an array of Product objects.
	 */
	async getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {

		let productData: Product = await this.dao.productModelExists(model);

		if (grouping === undefined) {
			// we need to retrieve all the products	
			return this.dao.getAllProductsData(false);
		}

		if (grouping === "model") {
			if (productData === null) {
				throw new errors.ProductNotFoundError();
			}
		}

		// grouping is not null, but what is it?
		if (!(category === undefined)) {
			// we need to retrieve only a certain category
			return this.dao.getAllProductsDataByCategory(false, category);
		} else {
			// we need to retrieve only a certain model
			return this.dao.getAllProductsDataByModel(false, model);
		}

	}

	/**
	 * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
	 * @param grouping An optional parameter. If present, it can be either "category" or "model".
	 * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
	 * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
	 * @returns A Promise that resolves to an array of Product objects.
	 */
	async getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {

		let productData: Product = await this.dao.productModelExists(model);

		if (grouping === undefined) {
			// we need to retrieve all the products
			return this.dao.getAllProductsData(true);
		}

		if (grouping === "model") {
			if (productData === null) {
				throw new errors.ProductNotFoundError();
			}
		}

		// grouping is not null, but what is it?
		if (!(category === undefined)) {
			// we need to retrieve only a certain category
			return this.dao.getAllProductsDataByCategory(true, category);
		} else {
			// we need to retrieve only a certain model
			return this.dao.getAllProductsDataByModel(true, model);
		}

	}

	/**
	 * Deletes all products.
	 * @returns A Promise that resolves to `true` if all products have been successfully deleted.
	 */
	async deleteAllProducts(): Promise<Boolean> {
		return this.dao.deleteAllProducts();
	}

	/**
	 * Deletes one product, identified by its model
	 * @param model The model of the product to delete
	 * @returns A Promise that resolves to `true` if the product has been successfully deleted.
	 */
	async deleteProduct(model: string): Promise<Boolean> {
		let productData: Product = await this.dao.productModelExists(model);
		if (productData === null) {
			throw new errors.ProductNotFoundError();
		}
		return this.dao.deleteProduct(model);

	}
}

export default ProductController;
