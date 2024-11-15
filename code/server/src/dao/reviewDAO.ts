import db from '../db/db';
import * as reviewErrors from '../errors/reviewError';
import { ProductReview } from '../components/review';

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

	/**
	 * This function adds a review to a product with the provided date
	 * @param model The model of the product which is being reviewed
	 * @param score The score of the review
	 * @param comment The comment written in the review
	 * @param username The username of the author of the review
	 * @param todayDate The date of today
	 * @returns A Promise that will not resolve to anything
	 */
	addReview(model: string, score: number, comment: string, username: string, todayDate: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let sql = 'INSERT INTO reviews VALUES (?, ?, ?, ?, ?)';
			db.run(sql, [model, score, comment, username, todayDate], (err: Error | null) => {
				if (err) {
					console.log(err.message);
					if (err.message.includes('UNIQUE constraint failed')) {
						return reject(new reviewErrors.ExistingReviewError());
					}
					return reject();
				}
				resolve();
			});
		});
	}

	/**
	 * Function that retrieves all the reviews of one product
	 * @param model The product model of which we want the reviews
	 * @returns A Promise that will resolve to a (possibly empty) array of reviews of products
	 */
	getProductReviews(model: string): Promise<ProductReview[]> {
		var productReviews: ProductReview[] = [];
		return new Promise<ProductReview[]>((resolve, reject) => {
			try {
				let sql = 'SELECT * FROM reviews WHERE model = ?';
				db.each(sql, [model], (err: Error | null, row: any) => {
					if (err) {
						console.log(err);
						return reject(err);
					}
					let review: ProductReview = new ProductReview(row.model, row.username, row.score, row.date, row.comment);
					productReviews.push(review);
				},
					() => {
						resolve(productReviews);
					},
				);
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Function used to delete a specific review made by a specific username
	 * @param model The model for which the review exists
	 * @param username The username of the author of the review
	 * @returns A Promise that will resolve to nothing
	 */
	deleteReview(model: string, username: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let sql = 'DELETE FROM reviews WHERE username = ? AND model = ?';
			db.run(sql, [username, model], function (err: Error | null) {
				if (err) {
					console.log(err.message);
					return reject(err);
				}
				if (this.changes === 0) {
					return reject(new reviewErrors.NoReviewProductError());
				}
				resolve();
			});
		});
	}

	/**
	 * A function used to delete all the reviews either of all the products or only of
	 * a specific one
	 * @param model The optional parameter indicating the product model of which we want
	 * to delete the reviews
	 * @returns A Promise that will resolve to nothing
	 */
	deleteAllReviews(model: string | null): Promise<void> {
		if (model === null) {
			// we need to delete all reviews of all products
			return new Promise<void>((resolve, reject) => {
				let sql = 'DELETE FROM reviews';
				db.run(sql, [], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					resolve();
				});
			});
		} else {
			// we need to delete reviews of a specific product
			return new Promise<void>((resolve, reject) => {
				let sql = 'DELETE FROM reviews WHERE model = ?';
				db.run(sql, [model], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					resolve();
				});
			});
		}
	}
}

export default ReviewDAO;
