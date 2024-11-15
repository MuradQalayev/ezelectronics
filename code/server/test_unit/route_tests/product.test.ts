import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import express, { Router } from "express";
import ErrorHandler from "../../src/helper";
import { body, param, query } from "express-validator";
import ProductController from "../../src/controllers/productController";
import Authenticator from "../../src/routers/auth";
import { Category, Product } from "../../src/components/product";
import { DateError } from "../../src/utilities";
const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let ProductTest = new Product(10.00, "blabla", Category.SMARTPHONE, '11/11/2011', "yoyoyo", 1)

describe("Route unit tests", () => {


    // ********** CREATE A NEW USER ***********
    describe("POST /products", () => {
        test("Creates a product: return code 200", async () => {

            let inputProduct = { model: "blabla", category: "Smartphone", quantity: 1, details: "yoyoyo", sellingPrice: 10.00, arrivalDate: '2011-11-11' }


            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    toDate: () => ({ isLength: () => ({}) }),
                    isISO8601: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

            const response = await request(app).post(baseURL + "/products").send(inputProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(inputProduct.model, inputProduct.category, inputProduct.quantity, inputProduct.details, inputProduct.sellingPrice, "2011-11-11")
            expect(response.status).toBe(200)
        })

        test("Creates a product: expecting an error from the registerproduct function", async () => {

            let inputProduct = { model: "blabla", category: "Smartphone", quantity: 1, details: "yoyoyo", sellingPrice: 10.00, arrivalDate: '2011-11-11' }


            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    toDate: () => ({ isLength: () => ({}) }),
                    isISO8601: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "registerProducts").mockImplementationOnce(() => {
                throw new Error('Test error');
            });

            const response = await request(app).post(baseURL + "/products").send(inputProduct)
            expect(response.status).toBe(503)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(inputProduct.model, inputProduct.category, inputProduct.quantity, inputProduct.details, inputProduct.sellingPrice, "2011-11-11")

        })


    })

    describe("PATCH /products", () => {
        test("Increase in product quantity", async () => {


            let inputProduct = { quantity: 3, changeDate: '2022-12-12' }


            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })


            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    toDate: () => ({ isLength: () => ({}) }),
                    isISO8601: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(1)

            const response = await request(app).patch(baseURL + "/products/blabla").send(inputProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("blabla", inputProduct.quantity, "2022-12-12")
            expect(response.status).toBe(200)
        })
    })
    describe("PATCH /products/:product/sell", () => {
        test("Sellling a product: REducing quantity", async () => {

            let inputProduct = { quantity: 1, SellingDate: "" }


            let ExpectedProduct = { quantity: inputProduct.quantity }

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })


            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    toDate: () => ({ isLength: () => ({}) }),
                    isISO8601: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(1)

            const response = await request(app).patch(baseURL + "/products/blabla/sell").send(inputProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("blabla", inputProduct.quantity, undefined)
            expect(response.body).toEqual(ExpectedProduct)
        })


    })

    describe("GET /products", () => {
        test("It returns an array of prodcuts", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([ProductTest])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
            expect(response.body).toEqual([ProductTest])
        })

        // test("It returns an array of prodcuts: expecting failure", async () => {
        //     jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([ProductTest])
        //     jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        //         return next();
        //     })
        //     jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        //         return next();
        //     })

        //     jest.spyOn(ProductController.prototype, "getProducts").mockImplementation(() => {
        //         return Promise.reject(new Error("Mocked error in getProducts"))
        //       });

        //     const response = await request(app).get(baseURL + "/products")
        //     expect(response.status).toBe(400)
        // })

    })

    describe("DELETE /products", () => {
        test("DELETE All products", async () => {

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)


            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })


            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled()
            expect(response.status).toBe(200)

        })
    })

    describe("DELETE /products/:product", () => {
        test("It deletes a product with a specific model", async () => {

            let statuscode = 200
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).delete(baseURL + "/products/blabla")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("blabla")
            expect(response.status).toBe(200)
        })
    })
})
