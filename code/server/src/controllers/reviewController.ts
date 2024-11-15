import { User } from '../components/user';
import { Product } from '../components/product';
import ReviewDAO from '../dao/reviewDAO';
import ProductDAO from '../dao/productDAO';
import * as prodErrors from '../errors/productError';
import { ProductReview } from '../components/review';

class ReviewController {
	private dao: ReviewDAO;
	private productDao = new ProductDAO();

	constructor() {
		this.dao = new ReviewDAO();
		this.productDao = new ProductDAO();
	}

	/**
	 * Adds a new review for a product
	 * @param model The model of the product to review
	 * @param user The username of the user who made the review
	 * @param score The score assigned to the product, in the range [1, 5]
	 * @param comment The comment made by the user
	 * @returns A Promise that resolves to nothing
	 */
	async addReview(model: string, user: User, score: number, comment: string): Promise<void> {
		let todayDate = new Date().toISOString().slice(0, 10);
		let productData: Product = await this.productDao.productModelExists(model);
		if (productData == null) {
			throw new prodErrors.ProductNotFoundError();
		}
		return this.dao.addReview(model, score, comment, user.username, todayDate);
	}

	/**
	 * Returns all reviews for a product
	 * @param model The model of the product to get reviews from
	 * @returns A Promise that resolves to an array of ProductReview objects
	 */
	async getProductReviews(model: string): Promise<ProductReview[]> {
		let productData: Product = await this.productDao.productModelExists(model);
		if (productData == null) {
			throw new prodErrors.ProductNotFoundError();
		}
		// at this point the model exists, we need to get the reviews
		return this.dao.getProductReviews(model);
	}

	/**
	 * Deletes the review made by a user for a product
	 * @param model The model of the product to delete the review from
	 * @param user The user who made the review to delete
	 * @returns A Promise that resolves to nothing
	 */
	async deleteReview(model: string, user: User): Promise<void> {
		let productData: Product = await this.productDao.productModelExists(model);
		if (productData == null) {
			throw new prodErrors.ProductNotFoundError();
		}
		// 404 if the current user doesn't have a review for that product -> i do it in the function
		return this.dao.deleteReview(model, user.username);
	}

	/**
	 * Deletes all reviews for a product
	 * @param model The model of the product to delete the reviews from
	 * @returns A Promise that resolves to nothing
	 */
	async deleteReviewsOfProduct(model: string): Promise<void> {
		let productData: Product = await this.productDao.productModelExists(model);
		if (productData == null) {
			throw new prodErrors.ProductNotFoundError();
		}

		return this.dao.deleteAllReviews(model);
	}

	/**
	 * Deletes all reviews of all products
	 * @returns A Promise that resolves to nothing
	 */
	async deleteAllReviews(): Promise<void> {
		return this.dao.deleteAllReviews(null);
	}
}

export default ReviewController;
