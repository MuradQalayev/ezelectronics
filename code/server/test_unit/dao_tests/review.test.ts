import {
    describe,
    test,
    expect,
    beforeAll,
    afterAll,
    jest,
  } from "@jest/globals";
  
  import ReviewDAO from "../../src/dao/reviewDAO";
  import { ProductReview } from "../../src/components/review"
  import {NoReviewProductError, ExistingReviewError } from "../../src/errors/reviewError";
  import crypto from "crypto";
  import db from "../../src/db/db";
  import { Database } from "sqlite3";
  import { Result } from "express-validator";
  import * as reviewErrors from '../../src/errors/reviewError';

  
  jest.mock("crypto");
  jest.mock("../../src/db/db.ts");

describe("Adds a review", () => {
  test("addReview", async () => {
    const cartDAO = new ReviewDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
      const result = await cartDAO.addReview(
        "model", 3, "comment", "username", "11/11/2012"
      ); 
      //can't really expect anything as both the resolve and the reject return nothing
  });
  test("addReview", async () => {
    const cartDAO = new ReviewDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("UNIQUE constraint failed"));
        return {} as Database;
      });
    try {
      const result = await cartDAO.addReview(
        "model", 3, "comment", "username", "11/11/2012"
      );
    } catch (error) {
      expect(error).toStrictEqual(new reviewErrors.ExistingReviewError());
      
    }
  });


});
describe("Retrieves all reviews of a product", () => {
  test("getProductReviews", async () => {
    const cartDAO = new ReviewDAO();
    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {model:"product1", username:"customer", score: 3, date:"2222-22-22", comment:"It's 2222-22-22!"});
      complete(null, {})
      return {} as Database;
    });
    
      const result = await cartDAO.getProductReviews(
        "model"
      );
    
      mockDBEach.mockRestore();
      expect(result).toEqual([{model:"product1", user:"customer", score: 3, date:"2222-22-22", comment:"It's 2222-22-22!"}])
  });
});

describe("Deletes a review of a product", () => {
  test("deleteReview", async () => {
    const cartDAO = new ReviewDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    try {
      const result = await cartDAO.deleteReview(
        "model", "username"
      );
    } catch (error) {
      expect(error);
    }
    mockDB.mockRestore();
  });

  test("deleteReview", async () => {
    const cartDAO = new ReviewDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({changes: 0}, null);
        return {} as Database;
      });
    try {
      const result = await cartDAO.deleteReview(
        "model", "username"
      );
    } catch (error) {
      expect(error).toStrictEqual(new reviewErrors.NoReviewProductError());
    }
    mockDB.mockRestore();
  });


});

describe("Deletes all reviews", () => {
  test("deleteAllReviews: defined branch", async () => {
    const cartDAO = new ReviewDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    try {
      const result = await cartDAO.deleteAllReviews(
        "model"
      );
    } catch (error) {
      expect(error);
    }
    mockDB.mockRestore();
  });

  test("deleteAllReviews: null branch", async () => {
    const cartDAO = new ReviewDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("no such model?"));
        return {} as Database;
      });
    try {
      const result = await cartDAO.deleteAllReviews(
        null
      );
    } catch (error) {
      expect(error);
    }
    mockDB.mockRestore();
  });

});

//old tests
test("addReview", async () => {
  const cartDAO = new ReviewDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("error adding review"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.addReview(
      "model", 3, "comment", "username", "11/11/2012"
    );
  } catch (error) {
    expect(error);
    
  }
});

test("getProductReviews", async () => {
  const cartDAO = new ReviewDAO();
  const mockDB = jest.spyOn(db, "each").mockImplementation((sql, params, callback) => {
      callback(new Error("no reviews"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.getProductReviews(
      "model"
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("deleteReview", async () => {
  const cartDAO = new ReviewDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("no reviews"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.deleteReview(
      "model", "username"
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("deleteAllReviews", async () => {
  const cartDAO = new ReviewDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("no such model?"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.deleteAllReviews(
      "model"
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});
