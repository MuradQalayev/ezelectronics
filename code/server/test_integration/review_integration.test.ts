import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category } from "../src/components/product"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer", surname: "customer", password: "customer", role: "Customer" }

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let managerCookie: string
let customerCookie2: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(routePath+'/users')
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(routePath+'/sessions')
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

const postProduct = async (productInfo: any, mycookie: any) => {
    await request(app)
        .post(routePath+'/products')
        .send(productInfo)
        .set("Cookie", mycookie)
        .expect(200)
}


//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    cleanup()
    await postUser(admin)
    await postUser(customer)
    await postUser(manager)
    await postUser(customer2)

    adminCookie = await login(admin)
    customerCookie = await login(customer)
    managerCookie = await login(manager)
    customerCookie2 = await login(customer2)

    await postProduct(product1, adminCookie)
    await postProduct(product2, adminCookie)
})

//After executing tests, we remove everything from our test database
afterAll(() => {
    cleanup()
})


const product1 = {model: 'product1', category: "Smartphone", quantity: 3, details: "product1 so cool", sellingPrice: 100, arrivalDate: "2011-11-11"}
const product2 = {model: 'product2', category: "Laptop", quantity: 2, details: "product2 is ok", sellingPrice: 100}
const product3 = {model: 'product3', category: "Laptop", quantity: 1, details: "product3 not so cool", sellingPrice: 100, arrivalDate: "2066-11-11"}

describe("Product routes integration tests", () => {

    describe("POST /reviews/:model", () => {
        test("It should add a review of a product, expecting code 200", async () => {
            await request(app)
            .post(routePath+'/reviews/product1')
            .send({'score': 3, "comment": "so cool"})
            .set("Cookie", customerCookie)
            .expect(200)
        })

        test("adding a review to a product that doesn't exist, expecting  eroor code 404", async () => {
            await request(app)
            .post(routePath+'/reviews/product123')
            .send({'score': 3, "comment": "so cool"})
            .set("Cookie", customerCookie)
            .expect(404)
        })

    })

    describe("GET /reviews/:model", () => {
        test("It retrives all reviews of a product, expecting code 200", async () => {
            let review = await request(app)
            .get(routePath+'/reviews/product1')
            .set("Cookie", customerCookie)
            .expect(200)

            let rvw = review.body[0]
            expect(rvw.model).toBe("product1")
            expect(rvw.score).toBe(3)
        })

        test("retrieving reviews of a product that doesn't exist, expecting eroor code 404", async () => {
            let review = await request(app)
            .get(routePath+'/reviews/product123')
            .set("Cookie", customerCookie)
            .expect(404)
        })

    })

    describe("DELETE /reviews/:model", () => {
        test("It deletes a user's review of a product, expecting code 200", async () => {
            await request(app)
            .delete(routePath+'/reviews/product1')
            .set("Cookie", customerCookie)
            .expect(200)
        })

        test("deleting a review of a product that doesn't exist, expecting eroor code 404", async () => {
            let review = await request(app)
            .delete(routePath+'/reviews/product123')
            .set("Cookie", customerCookie)
            .expect(404)
        })
    })

    describe("DELETE /reviews/:model/all", () => {
        test("It deletes all reviews of a product, expecting code 200", async () => {
            await request(app)
            .delete(routePath+'/reviews/product1/all')
            .set("Cookie", adminCookie)
            .expect(200)
        })

        test("deleting reviews of a product that doesn't exist, expecting eroor code 404", async () => {
            let review = await request(app)
            .delete(routePath+'/reviews/product123/all')
            .set("Cookie", adminCookie)
            .expect(404)
        })

    })

    describe("DELETE /reviews", () => {
        test("It deletes all reviews of every product, expecting code 200", async () => {
            await request(app)
            .delete(routePath+'/reviews')
            .set("Cookie", adminCookie)
            .expect(200)
        })
    })


})
