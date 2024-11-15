import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import ReviewController from "../../src/controllers/reviewController"
import Authenticator from "../../src/routers/auth"
import { ProductReview } from "../../src/components/review"
import ErrorHandler from "../../src/helper"
const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/reviewController")
jest.mock("../../src/routers/auth")

let ReviewTest = new ProductReview('boubou', 'ouga', 3, "", "wow so cool")

describe("Route review unit routing tests", () => {


    
    describe("POST /reviews/:model", () => {
        test("Creates a review: return code 200", async () => {
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                })),
            }))

            let InputReview = {score: 3, comment: "wow so  good"}
            const response = await request(app).post(baseURL + "/reviews/boubou").send(InputReview)
            expect(response.status).toBe(200)
            expect(ReviewController.prototype.addReview).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("boubou", undefined, InputReview.score, InputReview.comment)
        })
    })
    describe("GET /reviews/:model", () => {
        test("It returns an array of reviews", async () => {
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([ReviewTest])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }))

            const response = await request(app).get(baseURL + "/reviews/boubou")
            expect(response.status).toBe(200)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled()
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith("boubou")
            expect(response.body).toEqual([ReviewTest])
        })
    })

     // **************** DELETE review  ********************
     describe("DELETE /reviews/:model", () => {
        test("It deletes a review of a product", async () => {

            let statuscode = 200
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }))
            const response = await request(app).delete(baseURL + "/reviews/boubou")
            expect(response.status).toBe(200)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith('boubou', undefined)

        })
    })

     // **************** DELETE ALL REVIEWS of a product ********************
    describe("DELETE /reviews/:product/all", () => {
        test("DELETE All reviews of a product", async () => {

            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }))

            const response = await request(app).delete(baseURL + "/reviews/boubou/all")
            expect(response.status).toBe(200)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("boubou")

        })
    })    

         // **************** DELETE ALL REVIEWS********************
         describe("DELETE /reviews/", () => {
            test("DELETE All reviews of a product", async () => {
    
                jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce()
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return next();
                })
                jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                    return next();
                })
    
                const response = await request(app).delete(baseURL + "/reviews")
                expect(response.status).toBe(200)
                expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled()
            })
        })    

})
