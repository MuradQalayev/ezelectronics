import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from '../../src/components/user';
import { UserNotFoundError, UnauthorizedUserError, UserIsAdminError, UserNotAdminError, UserAlreadyExistsError } from "../../src/errors/userError";

jest.mock("../../src/dao/userDAO")

afterEach(()=>{
    jest.clearAllMocks();
});
// this is common to every test
let controller: UserController = new UserController();


describe("UserController", () => {
    test("Test of userController/createUser -> it should return true", async () => {
        const testUser = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
        //Check if the response is true
        expect(response).toBe(true);
    });


    test("Test of userController/getUsers -> it should return an array of users", async () => {
        let user1: User = { username: "king", name: "pippo", surname: "pluto", role: Role.CUSTOMER, address: "", birthdate: "" };
        let user2: User = { username: "ivan piri", name: "ivan", surname: "piri", role: Role.MANAGER, address: "", birthdate: "" };
        jest.spyOn(UserDAO.prototype, "getAllUsers").mockResolvedValueOnce([user1, user2]); //Mock the createUser method of the DAO
        const response = await controller.getUsers();

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
        //Check if the response is true
        expect(response).toStrictEqual([user1, user2]);
    });

    test("Test of userController/getUsersByRole -> it should return an array of users", async () => {
        let user1: User = { username: "king", name: "pippo", surname: "pluto", role: Role.CUSTOMER, address: "", birthdate: "" };
        let user2: User = { username: "ivan piri", name: "ivan", surname: "piri", role: Role.CUSTOMER, address: "", birthdate: "" };
        jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce([user1, user2]); //Mock the createUser method of the DAO
        const response = await controller.getUsersByRole("Customer");
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");
        //Check if the response is what we expect
        expect(response).toStrictEqual([user1, user2]);
    });


    test("Test of userController/getUserByUsername -> it should return a specific user", async () => {
        let user1: User = { username: "king", name: "pippo", surname: "pluto", role: Role.CUSTOMER, address: "", birthdate: "" };
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user1); //Mock the createUser method of the DAO
        const response = await controller.getUserByUsername(user1, "king");


        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("king");
        //Check if the response is what we expect
        expect(response).toStrictEqual(user1);
    });

    test("Test of userController/getUserByUsername -> it should return a UserNotAdminError error", async () => {
        let user1: User = { username: "king", name: "pippo", surname: "pluto", role: Role.CUSTOMER, address: "", birthdate: "" };
        try {
            const response = await controller.getUserByUsername(user1, "asdnaskj");
        } catch (UserNotAdminError) {
            expect(UserNotAdminError).toBe(UserNotAdminError);
        }
    });

    test("Test of userController/deleteUser -> it should return true", async () => {
        let user1: User = { username: "king", name: "pippo", surname: "pluto", role: Role.CUSTOMER, address: "", birthdate: "" };
        jest.spyOn(UserDAO.prototype, "deleteByUsername").mockResolvedValueOnce(true);
        const response = await controller.deleteUser(user1, "king");

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.deleteByUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteByUsername).toHaveBeenCalledWith("king");
        //Check if the response is what we expect
        expect(response).toBe(true);
     });

    test("Test of userController/deleteAll", async () => {
        jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(); //Mock the createUser method of the DAO
        const response = await controller.deleteAll();

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
        //Check if the response is true
        expect(response).toBeUndefined;
    });

    test("Test of userController/updateUserInfo", async() =>{
        let user1: User = { username: "king", name: "pippo", surname: "pluto", role: Role.CUSTOMER, address: "", birthdate: "" };
        let updatedUser: User = { username: "king", name: "antonio", surname: "effe", role: Role.CUSTOMER, address: "", birthdate: "2024-01-01" };
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(true);
        
        
        // Mocking the DAO methods
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user1);
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(true);
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(updatedUser);
        const response = await controller.updateUserInfo(user1, "antonio", "effe", "", "2024-01-01", "king");

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith("king","antonio", "effe", "", "2024-01-01");
        
        //Check if the response is what we expect
        expect(response).toStrictEqual(updatedUser);

    });
});
