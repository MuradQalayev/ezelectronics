import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")



describe("Route unit tests", () => {


    // ********** CREATE A NEW USER ***********
    describe("POST /users", () => {
        test("Creates a user: return code 200", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: "Manager" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)

            const response = await request(app).post(baseURL + "/users").send(inputUser)
            expect(response.status).toBe(200)
            expect(UserController.prototype.createUser).toHaveBeenCalled()
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role)
        })


        test("LOGS IN", async () => {
            const inputUser = { username: "admin", password: "admin" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(testAdmin)

            const response = await request(app).post(baseURL + "/sessions").send(inputUser)
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.login).toHaveBeenCalled()
            expect(response.body).toEqual(testAdmin)

        })
    })


    // **************** GET ALL USER ********************
    describe("GET /users", () => {
        test("It returns an array of users", async () => {
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual([testAdmin, testCustomer])
        })
        test("It should fail if the user is not an Admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(401)
        })
    })


    // **************** GET USERs BY ROLE ********************
    describe("GET /users/roles/:role", () => {
        test("It returns an array of users with a specific role", async () => {
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testAdmin])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            const response = await request(app).get(baseURL + "/users/roles/Admin")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin")
            expect(response.body).toEqual([testAdmin])
        })

        test("It should fail if the role is not valid", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).get(baseURL + "/users/roles/Invalid")
            expect(response.status).toBe(422)
        })
    })

    // **************** GET USER by username ********************
    describe("GET /users/:username", () => {
        test("It returns a user with a specific username", async () => {

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValue(testAdmin)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).get(baseURL + "/users/admin")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
            // undefined because we aren't actually logged in and the function needs the logged in user 
            // to know if the latter is able to get any user or just itself
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(undefined, "admin")
            expect(response.body).toEqual(testAdmin)
        })
    })

    // **************** DELETE USER by username ********************
    describe("DELETE /users/:username", () => {
        test("It deletes a user with a specific username", async () => {

            let statuscode = 200
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).delete(baseURL + "/users/customer")
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
            // undefined because we aren't actually logged in and the function needs the logged in user 
            // to know if the latter is able to get any user or just itself
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, "customer")
            expect(response.status).toBe(200)
        })
    })

    // **************** DELETE ALL USER ********************
    describe("DELETE /users", () => {
        test("DELETE All users", async () => {

            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce()


            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })


            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteAll).toHaveBeenCalled()
        })
    })

    describe("PATCH /users", () => {
        test("It modifies info of the logged in user", async () => {

            let UpdatedTest = new User("admin", "bouga", "saray", Role.ADMIN, "nouga", "2012-11-11")
            let UpdatedInfo = { name: "bouga", surname: "saray", role: "Admin", address: "nouga", birthdate: "2012-11-11" }
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(UpdatedTest)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    notEmpty: () => ({ isLength: () => ({}) }),
                    isISO8601: () => ({ isLength: () => ({}) }),
                    toDate: () => ({ isLength: () => ({}) }),
                    custom: () => ({ isLength: () => ({}) })

                })),
            }))


            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/users/admin").send(UpdatedTest)
            expect(response.status).toBe(200)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalled()
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(undefined, UpdatedInfo.name, UpdatedInfo.surname, UpdatedInfo.address, "2012-11-11", UpdatedTest.username)
            expect(response.body).toEqual(UpdatedTest)

        })
    })

    describe("DELETE /sessions/current", () => {
        test("Logging out", async () => {
            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(false)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/sessions/current")
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.logout).toHaveBeenCalled()
        })
    })

    describe("GET /users/current", () => {
        test("Gets current user", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/users/current")
            expect(response.status).toBe(200)
        })
    })

})