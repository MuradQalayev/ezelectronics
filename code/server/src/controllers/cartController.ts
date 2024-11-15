import ProductDAO from '../dao/productDAO';
import { Product } from '../components/product';
import { User } from '../components/user';
import CartDAO from '../dao/cartDAO';
import * as prodErrors from '../errors/productError';
import { Cart, ProductInCart } from '../components/cart';
import { CartNotFoundError, ProductNotInCartError } from '../errors/cartError';
import { EmptyCartError } from '../errors/cartError';

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
	private dao: CartDAO;
	private productDao: ProductDAO;

	constructor() {
		this.dao = new CartDAO();
		this.productDao = new ProductDAO();
	}

	/**
	 * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
	 * If the product is not in the cart, it should be added with a quantity of 1.
	 * If there is no current unpaid cart in the database, then a new cart should be created.
	 * @param user - The user to whom the product should be added.
	 * @param productId - The model of the product to add.
	 * @returns A Promise that resolves to `true` if the product was successfully added.
	 */
	async addToCart(user: User, product: string): Promise<Boolean> {
		// random init
		let cartId: number = 0;
		// We try to retrieve product data
		let productData: Product = await this.productDao.productModelExists(product);

		if (productData == null) {
			throw new prodErrors.ProductNotFoundError();
		}

		if (productData.quantity === 0) {
			throw new prodErrors.EmptyProductStockError();
		}

		cartId = await this.dao.getLastCartId(user.username);
		if (cartId > 0) {
			// The fact that we have an ID it means the user has a cart, we can simply add the product
			return this.dao.addProductToCart(cartId, productData);
		} else {
			// The user doesn't have a cart, we create it & add the product record
			cartId = await this.dao.createNewUserCart(user.username);
			return this.dao.addProductToCart(cartId, productData);
		}

	}

	/**
	 * Retrieves the current cart for a specific user.
	 * @param user - The user for whom to retrieve the cart.
	 * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
	 */
	async getCart(user: User): Promise<Cart> {
		let cartId: number = await this.dao.getLastCartId(user.username);
		if (cartId > 0) {
			// we have cart information's
			return this.dao.getCartData(cartId);
		} else {
			// we need to return empty cart
			return new Cart(user.username, false, null, 0, []);
		}
	}

	/**
	 * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
	 * @param user - The user whose cart should be checked out.
	 * @returns A Promise that resolves to `true` if the cart was successfully checked out.
	 *
	 */
	async checkoutCart(user: User): Promise<Boolean> {
		let todayDate = new Date().toISOString().slice(0, 10);
		let cartId: number = await this.dao.getLastCartId(user.username);
		// if we have no information on the user cart we have an id of 0
		if (cartId === 0) {
			throw new CartNotFoundError();
		}
		// if we are here we have a cart but is it empty?
		let userCart: Cart = await this.dao.getCartData(cartId);
		// if the cart is empty
		if (userCart.products.length === 0) {
			throw new EmptyCartError();
		}
		// ok now we have to try to decrease quantities
		if (await this.dao.isProductQuantityEnough(cartId)) {
			// here we decrease quantity
			return this.dao.completeSell(cartId, todayDate);
		}
		return false;
	}

	/**
	 * Retrieves all paid carts for a specific customer.
	 * @param user - The customer for whom to retrieve the carts.
	 * @returns A Promise that resolves to an array of carts belonging to the customer.
	 * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
	 */
	async getCustomerCarts(user: User): Promise<Cart[]> {
		let pastCartsId: number[] = await this.dao.getPastCartsId(user.username);
		let customerCarts: Cart[] = await Promise.all(
			pastCartsId.map(async (cartId: number) => {
				return await this.dao.getCartData(cartId);
			}),
		);

		return customerCarts;
	}

	/**
	 * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
	 * @param user The user who owns the cart.
	 * @param product The model of the product to remove.
	 * @returns A Promise that resolves to `true` if the product was successfully removed.
	 */
	async removeProductFromCart(user: User, product: string): Promise<Boolean> {
		let productData: Product = await this.productDao.productModelExists(product);
		if (productData == null) {
			throw new prodErrors.ProductNotFoundError();
		}

		let cartId: number = await this.dao.getLastCartId(user.username);
		// if we have no information on the user cart we have an id of 0
		if (cartId === 0) {
			throw new CartNotFoundError();
		}
		// if we are here we have a cart but is it empty?
		let userCart: Cart = await this.dao.getCartData(cartId);

		// 404 error if the product model is not in the cart
		let productPresent: ProductInCart = userCart.products.find(productInCart => productData.model === productInCart.model);
		if (productPresent === undefined) {
			throw new ProductNotInCartError();
		}

		// if the cart is empty -> This was my first check but apparently someone decided
		// that it's better to first check if the product is in the cart
		// Like why? If the cart is empty that for sure i don't have a product in it
		if (userCart.products.length === 0) {
			throw new EmptyCartError();
		}

		// at this point we can delete it
		// we need to either delete the whole record or decrement by one
		if (productPresent.quantity === 1) {
			// delete the whole record
			return this.dao.deleteProductRecordFromCart(cartId, productData.model);
		} else {
			// decrement by 1
			return this.dao.deleteProductInstanceFromCart(cartId, productData.model);
		}
	}

	/**
	 * Removes all products from the current cart.
	 * @param user - The user who owns the cart.
	 * @returns A Promise that resolves to `true` if the cart was successfully cleared.
	 */
	async clearCart(user: User): Promise<Boolean> {
		let cartId: number = await this.dao.getLastCartId(user.username);
		// if we have no information on the user cart we have an id of 0
		if (cartId === 0) {
			throw new CartNotFoundError();
		}
		// there is an unpaid cart, let's empty it
		return this.dao.emptyCart(cartId);
	}

	/**
	 * Deletes all carts of all users.
	 * @returns A Promise that resolves to `true` if all carts were successfully deleted.
	 */
	async deleteAllCarts(): Promise<Boolean> {
		return this.dao.deleteAllCarts();
	}

	/**
	 * Retrieves all carts in the database.
	 * @returns A Promise that resolves to an array of carts.
	 */
	async getAllCarts(): Promise<Cart[]> {
		// we need to get all carts of all users, no validation
		let cartsId: number[] = await this.dao.getAllCartIds();
		let carPromises: Promise<Cart>[] = cartsId.map(cartId => this.dao.getCartData(cartId));

		let result: Cart[] = await Promise.all(carPromises);
		return result;
	}
}

export default CartController;
