import { test, expect, jest, describe, afterEach} from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import { ProductReview } from '../../src/components/review';
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO"
import { Product, Category } from '../../src/components/product';
import { User, Role } from '../../src/components/user';

jest.mock("../../src/dao/productDAO")
jest.mock("../../src/dao/reviewDAO")
jest.mock("../../src/dao/userDAO")

afterEach(()=>{
  jest.clearAllMocks();
});

let controller = new ReviewController();

const testUser: User = {
    username: "test",
    name: "test",
    surname: "test",
    role: Role.MANAGER,
    address: "",
    birthdate: "",
};

const productData: Product = { sellingPrice: 123, 
    model: 'iPhone X', 
    category: Category.SMARTPHONE, 
    arrivalDate: '2023-01-01', 
    details: null, 
    quantity: 40 };

const testReview: ProductReview = {
    model: "iPhone X",
    user: "test",
    score: 10,
    date: "",
    comment: "",
};

describe("ReviewController", () => {
    test("addReview", async() => {
        let todayDate = new Date().toISOString().slice(0, 10);
        jest.spyOn(ProductDAO.prototype, "productModelExists").mockResolvedValueOnce(productData);
        jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce;
        const response = await controller.addReview(productData.model, testUser, 10, "");

        expect(ProductDAO.prototype.productModelExists).toBeCalledTimes(1);
        expect(ReviewDAO.prototype.addReview).toBeCalledWith(productData.model, 10, "", testUser.username,  todayDate );
        expect(response).toBeUndefined;
    });

    test("getProductReview", async() =>{
        jest.spyOn(ProductDAO.prototype, "productModelExists").mockResolvedValueOnce(productData);
        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce([testReview]);
        const response = await controller.deleteReview("iPhone X", testUser);

        expect(ProductDAO.prototype.productModelExists).toBeCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toBeCalledWith(productData.model, testUser.username );
    });

    test("deletReview", async() =>{
        jest.spyOn(ProductDAO.prototype, "productModelExists").mockResolvedValueOnce(productData);
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();
        const response = await controller.deleteReview("iPhone X", testUser);

        expect(ProductDAO.prototype.productModelExists).toBeCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toBeCalledWith(productData.model, testUser.username );
    });

    test("deleteReviewsOfProduct", async()=>{
        jest.spyOn(ProductDAO.prototype, "productModelExists").mockResolvedValueOnce(productData);
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce();
        const response = await controller.deleteReviewsOfProduct("iPhone X");

        expect(ProductDAO.prototype.productModelExists).toBeCalledTimes(1);
        expect(ReviewDAO.prototype.deleteAllReviews).toBeCalledWith(productData.model);
    });

    test("deleteAllReviews", async()=>{
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce();
        const response = await controller.deleteAllReviews();

        expect(ReviewDAO.prototype.deleteAllReviews).toBeCalledTimes(1);
    });
})