import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

/**
 * Base route path for the API
 */
const routePath = "/ezelectronics"

/**
 * Sample users used in the tests
 */
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }

/**
 * Sample products used in the tests
 */
const product1 = { model: 'product1', category: "Smartphone", quantity: 3, details: "product1 so cool", sellingPrice: 100, arrivalDate: "2011-11-11" }
const product2 = { model: 'product2', category: "Laptop", quantity: 2, details: "product2 is ok", sellingPrice: 100 }
const product4 = { model: 'product4', category: "Laptop", quantity: 1, details: "product4 not so cool", sellingPrice: 100, arrivalDate: "2023-05-11" }

/**
 * Cookies for the users. We use them to keep users logged in.
 * Creating them once and saving them in a variables outside of the tests will make cookies reusable
 */
let customerCookie: string
let adminCookie: string
let managerCookie: string
let customerCookie2: string

/**
 * Helper function that creates a new user in the database.
 * Can be used to create a user before the tests or in the tests
 * It's also an implicit test since it checks if the return code is successful
 * @param userInfo Contains the user information of the user to be created
 */
const postUser = async (userInfo: any) => {
    await request(app)
        .post(routePath + '/users')
        .send(userInfo)
        .expect(200)
}

/**
 * Helper function used to login in a user and get the cookie
 * @param userInfo Contains the user information of the user to be logged in
 * @returns 
 */
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(routePath + '/sessions')
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

/**
 * Helper function that creates a new product in the database
 * @param productInfo Contains the product information of the product to be created
 * @param mycookie The cookie of the admin that creates the product
 */
const postProduct = async (productInfo: any, userCookie: any) => {
    await request(app)
        .post(routePath + '/products')
        .send(productInfo)
        .set("Cookie", userCookie)
        .expect(200)
}


/**
 * Before all the tests, we clean the database, create an Admin user and log in, 
 * and save the cookie in the corresponding variable
 */
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
    await postProduct(product4, adminCookie)
})

/**
 * After executing all tests, we clear the testdb
 */
afterAll(() => {
    cleanup()
})


describe("Cart routes integration tests", () => {

    describe("GET /carts", () => {
        test("Successful retrieval of the empty customer cart", async () => {
            const cart = await request(app).get(routePath + '/carts').set("Cookie", customerCookie).expect(200)
            let customerCart = cart.body
            expect(customerCart.customer).toBe("customer")
            // why lowercase false? Because i did a mess when creating the database, sorry
            expect(customerCart.paid).toBe(false)
            expect(customerCart.products.length).toBe(0)
        })

        test("Successful retrieval of the customer cart", async () => {
            // we need to add a product to the cart
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            // and now we can check the cart
            const cart = await request(app).get(routePath + '/carts').set("Cookie", customerCookie).expect(200)
            let customerCart = cart.body
            expect(customerCart.customer).toBe("customer")
            expect(customerCart.paid).toBeFalsy()
            expect(customerCart.products.length).toBe(1)
            expect(customerCart.products[0].model).toBe("product1")
            // and now we can empty the cart
            await request(app).delete(routePath + '/carts/current').set("Cookie", customerCookie).expect(200)
        })
    })

    describe("POST /carts", () => {
        test("Adding a product to the cart, expecting code 200", async () => {
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            await request(app).post(routePath + '/carts').send({ 'model': "product2" }).set("Cookie", customerCookie).expect(200)
            // then we check the customer cart
            const cart = await request(app).get(routePath + '/carts').set("Cookie", customerCookie).expect(200)
            let customerCart = cart.body
            expect(customerCart.customer).toBe("customer")
            expect(customerCart.paid).toBeFalsy()
            expect(customerCart.products.length).toBe(2)
            expect(customerCart.products[0].model).toBe("product1")
            expect(customerCart.products[1].model).toBe("product2")
        })

        test("Adding a non-existing product to the cart, expecting code 404", async () => {
            await request(app).post(routePath + '/carts').send({ 'model': "product123" }).set("Cookie", customerCookie).expect({ error: 'Product not found', status: 404 })
        })

        test("Adding a sold out product to the cart, expecting code 409", async () => {
            await request(app).patch(routePath + '/products/product4/sell').send({ quantity: 1 }).set("Cookie", adminCookie).expect(200)
            await request(app).post(routePath + '/carts').send({ 'model': "product4" }).set("Cookie", customerCookie).expect(409)
        })
    })

    describe("PATCH /carts", () => {
        // checking out a cart that doesn't exists, the user has no cart
        test("Checking out a cart that doesn't exists", async () => {
            await request(app).patch(routePath + '/carts').set("Cookie", customerCookie2).expect({ error: 'Cart not found', status: 404 })
        })

        test("Checking out a cart, expecting code 200", async () => {
            await request(app).post(routePath + '/carts').send({ 'model': "product2" }).set("Cookie", customerCookie2).expect(200)
            await request(app).patch(routePath + '/carts').set("Cookie", customerCookie2).expect(200)
        })

        test("Checking out as non-customer, expecting code 401", async () => {
            await request(app).patch(routePath + '/carts').set("Cookie", adminCookie).expect({ error: 'User is not a customer', status: 401 })
        })

        // add a product to the cart then remove it and try to checkout
        test("Checking out an empty cart, expecting code 404", async () => {
            // removing all the products inside the cart
            await request(app).delete(routePath + '/carts/products/product1').set("Cookie", customerCookie).expect(200)
            await request(app).delete(routePath + '/carts/products/product2').set("Cookie", customerCookie).expect(200)
            // try to checkout the empty cart
            await request(app).patch(routePath + '/carts').set("Cookie", customerCookie).expect({ error: 'Cart is empty', status: 400 })
        })
    })

    describe("GET /carts/history", () => {
        test("Getting the history of the customer carts, expecting code 200", async () => {
            // we add a product to the cart and than checkout
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            await request(app).patch(routePath + '/carts').set("Cookie", customerCookie).expect(200)
            // we now do the same thing just to have two of them
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            await request(app).patch(routePath + '/carts').set("Cookie", customerCookie).expect(200)
            const carts = await request(app).get(routePath + '/carts/history').set("Cookie", customerCookie).expect(200)
            // we now check the data
            carts.body.forEach((cart: any) => {
                expect(cart.customer).toBe("customer");
                expect(cart.paid).toBe(1);
            });
        })

        test("Getting the history of the customer carts as non-customer, expecting code 401", async () => {
            await request(app).get(routePath + '/carts/history').set("Cookie", adminCookie).expect({ error: 'User is not a customer', status: 401 })
        })
    })

    describe("DELETE /carts/products/:model", () => {
        test("Removing a non-existing product from the cart, expecting code 404", async () => {
            await request(app).delete(routePath + '/carts/products/product123').set("Cookie", customerCookie).expect({ error: 'Product not found', status: 404 })
        })

        test("Removing a product from a cart that doesn't exists, expecting code 400", async () => {
            await request(app).delete(routePath + '/carts/products/product1').set("Cookie", customerCookie).expect({ error: 'Cart not found', status: 404 })
        })

        test("Removing a product from a cart that's empty", async () => {
            // add a product to the cart
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            // remove the product
            await request(app).delete(routePath + '/carts/products/product1').set("Cookie", customerCookie).expect(200)
            // try to remove the product again
            await request(app).delete(routePath + '/carts/products/product1').set("Cookie", customerCookie).expect({ error: 'Product not in cart', status: 404 })
        })

        test("Removing a product that is not in the user cart", async () => {
            // add a product
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            // remove a non existing product
            await request(app).delete(routePath + '/carts/products/product2').set("Cookie", customerCookie).expect({ error: 'Product not in cart', status: 404 })
        })

        test("Removing a product from the cart, expecting code 200", async () => {
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            await request(app).delete(routePath + '/carts/products/product1').set("Cookie", customerCookie).expect(200)
        })

    })

    describe("DELETE /carts/current", () => {
        test("Resetting a cart that doesn't exists", async () => {
            await request(app).delete(routePath + '/carts/current').set("Cookie", customerCookie2).expect({ error: 'Cart not found', status: 404 })
        })

        test("Resetting the cart, expecting code 200", async () => {
            // ad a product to the cart
            await request(app).post(routePath + '/carts').send({ 'model': "product1" }).set("Cookie", customerCookie).expect(200)
            await request(app).delete(routePath + '/carts/current').set("Cookie", customerCookie).expect(200)
        })
    })

    describe("GET /carts/all", () => {
        test("Getting all carts as non-manager, expecting code 401", async () => {
            await request(app).get(routePath + '/carts/all').set("Cookie", customerCookie).expect({ error: 'User is not an admin or manager', status: 401 })
        })

        test("Getting all carts, expecting code 200", async () => {
            const carts = await request(app).get(routePath + '/carts/all').set("Cookie", managerCookie).expect(200)
            carts.body.forEach((cart: any) => {
                expect(cart.customer).toContain("customer");
                // i cannot check for a specific value
                expect(cart.paid).toBeDefined();
            });
        })
    })

    describe("DELETE /carts", () => {
        test("Deleting all carts as non-manager, expecting code 401", async () => {
            await request(app).delete(routePath + '/carts').set("Cookie", customerCookie).expect({ error: 'User is not an admin or manager', status: 401 })
        })

        test("Deleting all carts, expecting code 200", async () => {
            await request(app).delete(routePath + '/carts').set("Cookie", managerCookie).expect(200)
        })
    })

    describe("GET /carts/all", () => {
        test("Getting all carts as non-manager, expecting code 401", async () => {
            await request(app).get(routePath + '/carts/all').set("Cookie", customerCookie).expect({ error: 'User is not an admin or manager', status: 401 })
        })

        test("Getting all carts, expecting code 200", async () => {
            const carts = await request(app).get(routePath + '/carts/all').set("Cookie", managerCookie).expect(200)
            carts.body.forEach((cart: any) => {
                expect(cart.customer).toContain("customer");
                // i cannot check for a specific value
                expect(cart.paid).toBeDefined();
            });
        })
    })
})