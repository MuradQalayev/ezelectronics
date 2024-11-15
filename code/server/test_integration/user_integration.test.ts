import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";

/**
 * Base route path for the API
 */
const routePath = "/ezelectronics";

/**
 * Sample users used in the tests
 */
const customer = {
	username: "customer",
	name: "customer",
	surname: "customer",
	password: "customer",
	role: "Customer",
};
const admin = {
	username: "admin",
	name: "admin",
	surname: "admin",
	password: "admin",
	role: "Admin",
};
const newUserData = {
	name: "newName",
	surname: "newSurname",
	address: "newAddress",
	birthdate: "2016-06-09",
};
const newadmin = {
	username: "newadmin",
	name: "admin",
	surname: "admin",
	password: "admin",
	role: "Admin",
};

/**
 * Cookies for the users. We use them to keep users logged in.
 * Creating them once and saving them in a variables outside of the tests will make cookies reusable
 */
let customerCookie: string;
let adminCookie: string;

/**
 * Helper function that creates a new user in the database.
 * Can be used to create a user before the tests or in the tests
 * It's also an implicit test since it checks if the return code is successful
 * @param userInfo Contains the user information of the user to be created
 */
const postUser = async (userInfo: any) => {
	await request(app)
		.post(routePath + "/users")
		.send(userInfo)
		.expect(200);
};

/**
 * Helper function used to login in a user and get the cookie
 * @param userInfo Contains the user information of the user to be logged in
 * @returns
 */
const login = async (userInfo: any) => {
	return new Promise<string>((resolve, reject) => {
		request(app)
			.post(routePath + "/sessions")
			.send(userInfo)
			.expect(200)
			.end((err, res) => {
				if (err) {
					reject(err);
				}
				resolve(res.header["set-cookie"][0]);
			});
	});
};

/**
 * Before all the tests, we clean the database, create an Admin user and log in,
 * and save the cookie in the corresponding variable
 */
// TODO : is it ok to only test it whit admin user? I think yes
beforeAll(async () => {
	cleanup();
	await postUser(admin);
	adminCookie = await login(admin);
});

/**
 * After executing all tests, we clear the testdb
 */
afterAll(() => {
	cleanup();
});

describe("userRoutes integration tests", () => {
	describe("POST /users", () => {
		test("Creating a new user successfully", async () => {
			await request(app)
				.post(routePath + "/users")
				.send(customer)
				.expect(200);
			// Now we check the insertion is successful
			const users = await request(app)
				.get(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			// We expect two users, the admin created by the beforeAll and the customer created in this test
			expect(users.body).toHaveLength(2);
			let customerData = users.body.find(
				(user: any) => user.username === customer.username,
			);
			expect(customerData).toBeDefined();
			expect(customerData.name).toBe(customer.name);
			expect(customerData.surname).toBe(customer.surname);
			expect(customerData.role).toBe(customer.role);
		});

		// Testing the different validation errors
		test("Creating a new user with missing parameters -> 422 validationError", async () => {
			await request(app)
				.post(routePath + "/users")
				.send({
					username: "",
					name: "test",
					surname: "test",
					password: "test",
					role: "Customer",
				})
				.expect(422);
			await request(app)
				.post(`${routePath}/users`)
				.send({
					username: "test",
					name: "",
					surname: "test",
					password: "test",
					role: "Customer",
				})
				.expect(422);
		});

		// Testing a database error
		test("Creating a user that already exists -> 409 UserAlreadyExistsError", async () => {
			await request(app)
				.post(routePath + "/users")
				.send(customer)
				.expect({ error: "The username already exists", status: 409 });
		});
	});

	describe("GET /users", () => {
		test("Retrieving a list of all the users", async () => {
			const users = await request(app)
				.get(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			// we have two users in the db
			expect(users.body).toHaveLength(2);
			let customerData = users.body.find(
				(user: any) => user.username === customer.username,
			);
			expect(customerData).toBeDefined();
			expect(customerData.name).toBe(customer.name);
			expect(customerData.surname).toBe(customer.surname);
			expect(customerData.role).toBe(customer.role);
			let adminData = users.body.find(
				(user: any) => user.username === admin.username,
			);
			expect(adminData).toBeDefined();
			expect(adminData.name).toBe(admin.name);
			expect(adminData.surname).toBe(admin.surname);
			expect(adminData.role).toBe(admin.role);
		});

		test("The user requesting the list is not an admin -> Unauthorized user error 401", async () => {
			customerCookie = await login(customer);
			await request(app)
				.get(routePath + "/users")
				.set("Cookie", customerCookie)
				.expect({ error: "User is not an admin", status: 401 });
			await request(app)
				.get(routePath + "/users")
				.expect({ error: "Unauthenticated user", status: 401 });
		});
	});

	describe("GET /users/roles/:role", () => {
		test("Requesting all the admin users", async () => {
			const admins = await request(app)
				.get(routePath + "/users/roles/Admin")
				.set("Cookie", adminCookie)
				.expect(200);
			// We have only one admin in the database
			expect(admins.body).toHaveLength(1);
			let adminData = admins.body[0];
			expect(adminData.username).toBe(admin.username);
			expect(adminData.name).toBe(admin.name);
			expect(adminData.surname).toBe(admin.surname);
		});

		test("Requesting all the users with invalid role -> validationError 422", async () => {
			await request(app)
				.get(routePath + "/users/roles/InvalidRole")
				.set("Cookie", adminCookie)
				.expect(422);
		});

		test("Requesting all the users with a role but in the db we have none", async () => {
			let result = await request(app)
				.get(routePath + "/users/roles/Manager")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(result.body).toHaveLength(0);
		});
	});

	describe("GET /users/:username", () => {
		test("Retrieving own user data from your username", async () => {
			const admins = await request(app)
				.get(routePath + "/users/admin")
				.set("Cookie", adminCookie)
				.expect(200);
			let adm = admins.body;
			expect(adm.username).toBe(admin.username);
			expect(adm.name).toBe(admin.name);
			expect(adm.surname).toBe(admin.surname);
		});

		test("An admin accessing other user data", async () => {
			const req = await request(app)
				.get(routePath + "/users/customer")
				.set("Cookie", adminCookie)
				.expect(200);
			let customerDate = req.body;
			expect(customerDate.username).toBe(customer.username);
			expect(customerDate.name).toBe(customer.name);
			expect(customerDate.surname).toBe(customer.surname);
		});

		test("A normal user cannot access other users data", async () => {
			customerCookie = await login(customer);
			await request(app)
				.get(routePath + "/users/admin")
				.set("Cookie", customerCookie)
				.expect({
					error: "This operation can be performed only by an admin",
					status: 401,
				});
		});

		test("If the provided username does not exist, we expect a 404", async () => {
			await request(app)
				.get(routePath + "/users/invalidUsername")
				.set("Cookie", adminCookie)
				.expect({ error: "The user does not exist", status: 404 });
		});
	});

	describe("DELETE /users/:username", () => {
		test("Customer trying to delete another user", async () => {
			customerCookie = await login(customer);
			await request(app)
				.delete(routePath + "/users/admin")
				.set("Cookie", customerCookie)
				.expect({
					error: "This operation can be performed only by an admin",
					status: 401,
				});
		});

		// we cannot test the missing username, we would call another route

		test("The username does not exist in the database", async () => {
			await request(app)
				.delete(routePath + "/users/invalidUsername")
				.set("Cookie", adminCookie)
				.expect({ error: "The user does not exist", status: 404 });
		});

		test("Admin user trying to delete another admin user -> 401 error", async () => {
			await postUser(newadmin);
			await login(newadmin);
			await request(app)
				.delete(routePath + "/users/newadmin")
				.set("Cookie", adminCookie)
				.expect({ error: "Admins cannot be deleted", status: 401 });
		});

		test("Admin user deleting a non admin user", async () => {
			await request(app)
				.delete(routePath + "/users/customer")
				.set("Cookie", adminCookie)
				.expect(200);
			// we expect only the two admins user to be in the database
			let users = await request(app)
				.get(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(users.body).toHaveLength(2);
			let adminData = users.body.find(
				(user: any) => user.username === admin.username,
			);
			expect(adminData).toBeDefined();
			expect(adminData.name).toBe(admin.name);
			expect(adminData.surname).toBe(admin.surname);
			expect(adminData.role).toBe(admin.role);
			// creating again the customer we deleted
			await postUser(customer);
			users = await request(app)
				.get(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(users.body).toHaveLength(3);
		});
		// we also need to recreate the users we had
	});

	// we have the patch before the delete just for simplicity
	describe("PATCH /users/:username", () => {
		// the user is not logged in
		test("The user is not logged in", async () => {
			await request(app)
				.patch(routePath + "/users/customer")
				.send(newUserData)
				.expect({ error: "Unauthenticated user", status: 401 });
		});
		// the name field is missing
		test("The name field is missing", async () => {
			await request(app)
				.patch(routePath + "/users/customer")
				.send({
					surname: "newSurname",
					address: "newAddress",
					birthdate: "2016-06-09",
				})
				.set("Cookie", adminCookie)
				.expect(422);
		});
		// the birthdate is in the future
		test("The birthdate is in the future", async () => {
			await request(app)
				.patch(routePath + "/users/customer")
				.send({
					name: "newName",
					surname: "newSurname",
					address: "newAddress",
					birthdate: "2024-07-30",
				})
				.set("Cookie", adminCookie)
				.expect(400);
		});
		// the username is not an existing user
		test("The username is not an existing user", async () => {
			await request(app)
				.patch(routePath + "/users/invalidUsername")
				.send(newUserData)
				.set("Cookie", adminCookie)
				.expect({ error: "The user does not exist", status: 404 });
		});
		// the user is not an admin and tries to modify another user
		test("The user is not an admin and tries to modify another user", async () => {
			customerCookie = await login(customer);
			await request(app)
				.patch(routePath + "/users/admin")
				.send(newUserData)
				.set("Cookie", customerCookie)
				.expect({
					error: "This operation can be performed only by an admin",
					status: 401,
				});
		});
		// the user is an admin and tries to modify another admin
		test("The user is an admin and tries to modify another admin", async () => {
			await request(app)
				.patch(routePath + "/users/newadmin")
				.send(newUserData)
				.set("Cookie", adminCookie)
				.expect({
					error: "You cannot access the information of other users",
					status: 401,
				});
		});
		// a customer modifies its own data
		test("A customer modifies its own data", async () => {
			let user = await request(app)
				.patch(routePath + "/users/customer")
				.send(newUserData)
				.set("Cookie", customerCookie)
				.expect(200);
			expect(user.body.name).toBe(newUserData.name);
			expect(user.body.surname).toBe(newUserData.surname);
			expect(user.body.address).toBe(newUserData.address);
			expect(user.body.birthdate).toBe(newUserData.birthdate);
		});
	});

	describe("DELETE /users", () => {
		test("A normal user trying to delete all users -> 401 error", async () => {
			customerCookie = await login(customer);
			await request(app)
				.delete(routePath + "/users")
				.set("Cookie", customerCookie)
				.expect({ error: "User is not an admin", status: 401 });
		});

		test("An admin user deleting all users", async () => {
			await request(app)
				.delete(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			// we expect only the two admin users to be in the database
			let users = await request(app)
				.get(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(users.body).toHaveLength(2);
			let firstAdminData = users.body.find(
				(user: any) => user.username === admin.username,
			);
			expect(firstAdminData).toBeDefined();
			expect(firstAdminData.name).toBe(admin.name);
			expect(firstAdminData.surname).toBe(admin.surname);
			expect(firstAdminData.role).toBe(admin.role);
			let secondAdminData = users.body.find(
				(user: any) => user.username === newadmin.username,
			);
			expect(secondAdminData).toBeDefined();
			expect(secondAdminData.name).toBe(admin.name);
			expect(secondAdminData.surname).toBe(admin.surname);
			expect(secondAdminData.role).toBe(admin.role);
			// creating again the customer we deleted
			await postUser(customer);
			users = await request(app)
				.get(routePath + "/users")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(users.body).toHaveLength(3);
		});
	});

	describe("POST /sessions", () => {
		// the user is not in the database
		test("The user is not in the database", async () => {
			await request(app)
				.post(routePath + "/sessions")
				.send({ username: "invalidUsername", password: "invalidPassword" })
				.expect({ message: "Incorrect username and/or password" });
		});
		// successful login
		test("Successful login", async () => {
			await request(app)
				.post(routePath + "/sessions")
				.send({ username: "admin", password: "admin" })
				.expect(200);
		});
	});

	// We have the get before the delete for simplicity
	describe("GET /sessions/current", () => {
		// successful retrieval of the logged in user
		test("Successful retrieval of the logged in user", async () => {
			const user = await request(app)
				.get(routePath + "/sessions/current")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(user.body.username).toBe(admin.username);
			expect(user.body.name).toBe(admin.name);
			expect(user.body.surname).toBe(admin.surname);
		});
	});

	describe("DELETE /sessions/current", () => {
		// successful logout
		test("Successful logout", async () => {
			await request(app)
				.delete(routePath + "/sessions/current")
				.set("Cookie", adminCookie)
				.expect(200);
		});
	});
});
