import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";

import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import { Role, User } from "../../src/components/user"
import { UserAlreadyExistsError , UserNotFoundError} from "../../src/errors/userError";
import crypto from "crypto";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { Result } from "express-validator";

jest.mock("crypto");
jest.mock("../../src/db/db.ts");

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")


describe("Create User", () => {
  
  test("createUser: expecting an error", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("UNIQUE constraint failed: users.username"));
        return {} as Database;
      });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return Buffer.from("salt");
      });
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });
    try {
      const result = await userDAO.createUser(
        "username",
        "name",
        "surname",
        "password",
        "role",
      );
    } catch (error) {
      expect(error).toStrictEqual(new UserAlreadyExistsError());
    }
    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });

  test("createUser: expecting success", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        Promise.resolve(true);
        return {} as Database;
      });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return Buffer.from("salt");
      });
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });
    
      const result = await userDAO.createUser(
        "username",
        "name",
        "surname",
        "password",
        "role",
      );
     
    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();

    expect(result).toBe(true)
  });
  
});

describe("Getting a user by his username", () => {
  test("getUserByUsername: expecting success", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, {"address": "Malta", "birthdate": "2010-11-11", "name": "name", "role": "Customer", "surname": "surname", "username": "username"});
        return {} as Database;
      });
  
    let result
    try {
      result = await userDAO.getUserByUsername(
        "username"
      );
    } catch (error) {
      expect(error).toStrictEqual(new UserNotFoundError());
    }
    mockDBGet.mockRestore();
    
    expect(result).toEqual(new User('username', 'name', 'surname', Role.CUSTOMER, 'Malta', '2010-11-11'))
  });

  test("getUserByUsername", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new UserNotFoundError(), {});
        return {} as Database;
      });
  
    try {
      const result = await userDAO.getUserByUsername(
        "admin"
      );
    } catch (error) {
      expect(error).toStrictEqual(new UserNotFoundError());
    }
    mockDBGet.mockRestore();
  });
});



describe("Getting a list of users with a specific role", () => {
  test("getUsersByRole: expecting success", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
        callback(null, {"address": "Malta", "birthdate": "2010-11-11", "name": "name", "role": "Customer", "surname": "surname", "username": "username"});
        Promise.resolve( new User('username', 'name', 'surname', Role.CUSTOMER, 'Malta', '2010-11-11'))
        complete(null, {})
        return {} as Database;
      });
  
    const result = await userDAO.getUsersByRole(
        "customer"
      );
    
    mockDBGet.mockRestore();
    
    expect(result).toEqual([new User('username', 'name', 'surname', Role.CUSTOMER, 'Malta', '2010-11-11')])
  });

  test("getUsersByRole using invalid role: expecting an error", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
        callback(new Error("No users with such roles"), {});
        complete(null, {})
        return {} as Database;
      });
  
      try {
        const result = await userDAO.getUsersByRole(
          "blabla"
        );
      } catch (error) {
        expect(error).toStrictEqual(new Error("No users with such roles"));
      }
  });


});

describe("Getting a list of all users ", () => {
  test("getAllUsers: expecting success", async () => {
    const userDAO = new UserDAO();
      const mockDBGet = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
          callback(null, {"address": "Malta", "birthdate": "2010-11-11", "name": "name", "role": "Customer", "surname": "surname", "username": "username"});
          Promise.resolve( new User('username', 'name', 'surname', Role.CUSTOMER, 'Malta', '2010-11-11'))
          complete(null, {})
          return {} as Database;
        });
    
      const result = await userDAO.getAllUsers(
        );
      
      mockDBGet.mockRestore();
      
      expect(result).toEqual([new User('username', 'name', 'surname', Role.CUSTOMER, 'Malta', '2010-11-11')])
  });

  test("getAllUsers: expecting failure", async () => {
    const userDAO = new UserDAO();
      const mockDBGet = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
          callback(new Error("forced failure"), {"address": "Malta", "birthdate": "2010-11-11", "name": "name", "role": "Customer", "surname": "surname", "username": "username"});
          Promise.resolve( new User('username', 'name', 'surname', Role.CUSTOMER, 'Malta', '2010-11-11'))
          complete(null, {})
          return {} as Database;
        });
    
        try {
          const result = await userDAO.getAllUsers()
        } catch (error) {
          expect(error).toStrictEqual(new Error("forced failure"));
        }
      
      mockDBGet.mockRestore();
  });


});
describe("Deleting all users ", () => {
  test("deleteAll: expecting success", async () => {
    const userDAO = new UserDAO();
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
          callback(null);
          Promise.resolve();
          return {} as Database;
        });
      
        const result = await userDAO.deleteAll(
        );
      mockDBRun.mockRestore();

      expect(result).toBe(undefined)
  });
  test("deleteAll: expecting failure", async () => {
    const userDAO = new UserDAO();
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
          callback(new Error("forced failure"));
          Promise.resolve();
          return {} as Database;
        });
      
        
        try {
          const result = await userDAO.deleteAll()
        } catch (error) {
          expect(error).toStrictEqual(new Error("forced failure"));
        }
      mockDBRun.mockRestore();

  });
});

describe("Deleting all users ", () => {
  test("deleteByUsername: expecting success", async () => {
    const userDAO = new UserDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({changes: 1},null);
        Promise.resolve(true)
        return {} as Database;
      });


    let result
    try {
      result = await userDAO.deleteByUsername(
        "username",
      );
    } catch (error) {
      expect(error);
    }
    mockDB.mockRestore();

    expect(result).toBe(true)
  });

  test("deleteByUsername: expecting failure", async () => {
    const userDAO = new UserDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({changes: 1},new Error("forced failure"));
        Promise.resolve(true)
        return {} as Database;
      });


    let result
    try {
      result = await userDAO.deleteByUsername(
        "username",
      );
    } catch (error) {
      expect(error).toStrictEqual(new Error("forced failure"));
    }
    mockDB.mockRestore();
  });


});


describe("Update User", () => {
  
  test("updateUserInfo that doesn;t exist: expecting an error", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new UserNotFoundError());
        return {} as Database;
      });
    
    try {
      const result = await userDAO.updateUserInfo(
        "username",
        "name",
        "surname",
        "password",
        "role",
      );
    } catch (error) {
      expect(error).toStrictEqual(new UserNotFoundError());
    }
    mockDBRun.mockRestore();

  });

  test("updateUserInfo: expecting success", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        Promise.resolve(true);
        return {} as Database;
      });
      const result = await userDAO.updateUserInfo(
        "username",
        "name",
        "surname",
        "password",
        "role",
      );
    mockDBRun.mockRestore();

    expect(result).toBe(true)
  });
  
});

//old tests here
test("createUser", async () => {
  const userDAO = new UserDAO();
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("UNIQUE constraint failed: users.username"));
      return {} as Database;
    });
  const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
      return Buffer.from("salt");
    });
  const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
      return Buffer.from("hashedPassword");
    });
  try {
    const result = await userDAO.createUser(
      "username",
      "name",
      "surname",
      "password",
      "role",
    );
  } catch (error) {
    expect(error).toStrictEqual(new UserAlreadyExistsError());
  }
  mockRandomBytes.mockRestore();
  mockDBRun.mockRestore();
  mockScrypt.mockRestore();
});

test("getUserByUsername", async () => {
  const userDAO = new UserDAO();
  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
 
  try {
    const result = await userDAO.getUserByUsername(
      "username"
    );
  } catch (error) {
    expect(error).toStrictEqual(new UserNotFoundError());
  }
  mockDBGet.mockRestore();
});

test("getUserByUsername", async () => {
  const userDAO = new UserDAO();
  const mockDBGet = jest.spyOn(db, "each").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
 
  try {
    const result = await userDAO.getUsersByRole(
      "admin"
    );
  } catch (error) {
    expect(error);
  }
  mockDBGet.mockRestore();
});



test("Test di get all users", async () => {
  const userDAO = new UserDAO();
  jest.spyOn(UserDAO.prototype, "getAllUsers")
  const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback) => {
    callback(null);
    return {} as Database;
  });
  try {
      const result = await userDAO.getAllUsers();} catch (error) {
      expect(error);
    }
    mockDBEach.mockRestore();
});

test("Delete all users", async () => {
  const userDAO = new UserDAO();
  jest.spyOn(UserDAO.prototype, "deleteAll")
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(null);
    return {} as Database;
  });
  try {
      const result = await userDAO.deleteAll();} catch (error) {
      expect(error);
    }
    mockDB.mockRestore();
});


test("updateUserInfo", async () => {
  const userDAO = new UserDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
 
  try {
    const result = await userDAO.updateUserInfo(
      "username",
      "name",
      "surname",
      "password",
      "role",
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});
