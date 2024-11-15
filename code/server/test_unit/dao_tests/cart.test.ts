import {
    describe,
    test,
    expect,
    beforeAll,
    afterAll,
    jest,
  } from "@jest/globals";
  
  import CartDAO from "../../src/dao/cartDAO";
  import { Cart } from "../../src/components/cart"
  import { CartNotFoundError, EmptyCartError, ProductInCartError, WrongUserCartError, ProductNotInCartError} from "../../src/errors/cartError";
  import crypto from "crypto";
  import db from "../../src/db/db";
  import { Database } from "sqlite3";
  import { Result } from "express-validator";
import { Category, Product } from "../../src/components/product";
import * as productErrors from '../../src/errors/productError';


  jest.mock("crypto");
  jest.mock("../../src/db/db.ts");

describe("Cart cart", () => {
  test("getLastCartId", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, {id: 3});
        return {} as Database;
      });

    const result = await cartDAO.getLastCartId("")
    mockDB.mockRestore();
    expect(result).toEqual(3)
  });
  test("getLastCartId (else, // No cart can have an id of zero)", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, {});
        return {} as Database;
      });

    const result = await cartDAO.getLastCartId("")
    mockDB.mockRestore();
    expect(result).toEqual(undefined)
  });
});

describe("Create New Cart", () => {
  test("createNewUserCart expecting success", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call( {lastID: 3}, null);
        return {} as Database;
      });

    const result = await cartDAO.createNewUserCart("")
    mockDB.mockRestore();
    expect(result).toEqual(3)
  });

  test("createNewUserCart expecting error", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call( {lastID: 3}, new Error("error while handling the request"));
        return {} as Database;
      });
      try {
        const result = await cartDAO.createNewUserCart(""
        );
      } catch (error) {
        expect(error).toStrictEqual(false);
      }
      mockDB.mockRestore();
  });

});

describe("Adding product to Cart", () => {
  test("addProductToCart row undefinied", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      //row undefinied
      callback(null, {});
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    const result = await cartDAO.addProductToCart(3, new Product(300, "model", Category.SMARTPHONE, "2011-11-11", null, 2))
    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    mockDBSerialize.mockRestore()
    expect(result).toEqual(true)
  });

  test("addProductToCart", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, {fill: "fill"});
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    const result = await cartDAO.addProductToCart(3, new Product(300, "model", Category.SMARTPHONE, "2011-11-11", null, 2))
    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    mockDBSerialize.mockRestore()
    expect(result).toEqual(true)
  });

  test("addProductToCart: get failing", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("forced failing"),{});
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    try {
    const result = await cartDAO.addProductToCart(3, new Product(300, "model", Category.SMARTPHONE, "2011-11-11", null, 2))
  } catch (error) {
    expect(error).toStrictEqual(false);
  }
    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    mockDBSerialize.mockRestore()
  });


  test("addProductToCart: run1 failing", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call(null, new Error("forced failure"));
      return {} as Database;
    });
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null,undefined);
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    try {
    const result = await cartDAO.addProductToCart(3, new Product(300, "model", Category.SMARTPHONE, "2011-11-11", null, 2))
  } catch (error) {
    expect(error).toStrictEqual(false);
  }
    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    mockDBSerialize.mockRestore()
  });

  test("addProductToCart: run2 failing", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call(null, new Error("forced failure"));
      return {} as Database;
    });
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null,{fill: "fill"});
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    try {
    const result = await cartDAO.addProductToCart(3, new Product(300, "model", Category.SMARTPHONE, "2011-11-11", null, 2))
  } catch (error) {
    expect(error).toStrictEqual(false);
  }
    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    mockDBSerialize.mockRestore()
  });



});




describe("Get Cart Data", () => {
  test("getCartData", async () => {
    const cartDAO = new CartDAO();

    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {});
      complete(null, {})
      return {} as Database;
    });
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      //row undefinied
      callback(null, {customer:"customer", paid: true, paymentDate: "2022-12-12", total: 300});
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    })

    const result = await cartDAO.getCartData(3)
    mockDBEach.mockRestore();
    mockDBGet.mockRestore();
    mockDBSerialize.mockRestore()
    expect(result).toEqual({"customer": "customer", "paid": true, "paymentDate": "2022-12-12", "products": [{"category": undefined, "model": undefined, "price": undefined, "quantity": undefined}], "total": NaN})

    });

    test("getCartData: expecting failure get", async () => {
      const cartDAO = new CartDAO();
  
      const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
        callback(null, {});
        complete(null, {})
        return {} as Database;
      });
      
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        //row undefinied
        callback(new Error("forced failure"), {customer:"customer", paid: true, paymentDate: "2022-12-12", total: 300});
        return {} as Database;
      });
  
      const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
        //despite VScode saying there is an error, the test works correctly
        callback()
      })
  
      try {
        const result = await cartDAO.getCartData(3)
      } catch (error) {
        expect(error).toStrictEqual(new Error("forced failure"));
      }
      mockDBEach.mockRestore();
      mockDBGet.mockRestore();
      mockDBSerialize.mockRestore()  
      });

      test("getCartData: expecting failure each", async () => {
        const cartDAO = new CartDAO();
    
        const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
          callback(null, {});
          complete(new Error("forced failure"), {})
          return {} as Database;
        });
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          //row undefinied
          callback(null, {customer:"customer", paid: true, paymentDate: "2022-12-12", total: 300});
          return {} as Database;
        });
    
        const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
          //despite VScode saying there is an error, the test works correctly
          callback()
        })
    
        try {
          const result = await cartDAO.getCartData(3)
        } catch (error) {
          expect(error).toStrictEqual(new Error("forced failure"));
        }
        mockDBEach.mockRestore();
        mockDBGet.mockRestore();
        mockDBSerialize.mockRestore()  
        });


});

describe("Checking if quantity is > 0", () => {
  test("isProductQuantityEnough: yes", async () => {
    const cartDAO = new CartDAO();
    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {prodQuantity: 6, cartQuantity: 4});
      complete(null, {})
      return {} as Database;
    });

    
      const result = await cartDAO.isProductQuantityEnough(
        1
      );
    mockDBEach.mockRestore();
    expect(result).toBe(true)
  });

  test("isProductQuantityEnough: first failure case", async () => {
    const cartDAO = new CartDAO();
    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {prodQuantity: 0, cartQuantity: 0});
      complete(null, {})
      return {} as Database;
    });

    try {
      const result = await cartDAO.isProductQuantityEnough(3)
    } catch (error) {
      expect(error).toStrictEqual(new productErrors.EmptyProductStockError());
    }
    mockDBEach.mockRestore();
  });

  test("isProductQuantityEnough: second failure case", async () => {
    const cartDAO = new CartDAO();
    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {prodQuantity: 2, cartQuantity: 99});
      complete(null, {})
      return {} as Database;
    });

    try {
      const result = await cartDAO.isProductQuantityEnough(3)
    } catch (error) {
      expect(error).toStrictEqual(new productErrors.LowProductStockError());
    }
    mockDBEach.mockRestore();
  });




});
describe("Checking out the cart", () => {
  test("completeSell", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({changes: 1},null);
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    const result = await cartDAO.completeSell(
      1, "2222-11-11"
    );
    mockDBRun.mockRestore();
    mockDBSerialize.mockRestore();
    expect(result).toBe(true)
  });

  test("completeSell: expecting failure, run1", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({changes: 0},null);
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    try {
      const result = await cartDAO.completeSell(3, "")
    } catch (error) {
      expect(error).toStrictEqual(false);
    }
    mockDBRun.mockRestore();
    mockDBSerialize.mockRestore();
  });


  test("completeSell: expecting failure, run2", async () => {
    const cartDAO = new CartDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({changes: 1},new Error("Forced failure"));
      return {} as Database;
    });

    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

    try {
      const result = await cartDAO.completeSell(3, "")
    } catch (error) {
      expect(error).toStrictEqual(new Error("Forced failure"));
    }
    mockDBRun.mockRestore();
    mockDBSerialize.mockRestore();
  });


});


describe("retrieves a list of all the paid carts of a certain user", () => {
  test("getPastCartsId", async () => {
    const cartDAO = new CartDAO();
    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {id: 4});
      complete(null, {})
      return {} as Database;
    });

      const result = await cartDAO.getPastCartsId(
        ""
      );
    mockDBEach.mockRestore();

    expect(result).toEqual([4])
  });
});

describe("Deletes a product from a cart", () => {
  test("deleteProductRecordFromCart", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
      const result = await cartDAO.deleteProductRecordFromCart(
        1,
        ""
      );
    
    mockDB.mockRestore();

    expect(result).toEqual(true)
  });
});

describe("Deletes a product from a cart (another function)", () => {
  test("deleteProductInstanceFromCart", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
      const result = await cartDAO.deleteProductInstanceFromCart(
        1,
        ""
      );
    
    mockDB.mockRestore();

    expect(result).toEqual(true)
  });
});

describe("Emtpties the whole cart", () => {
  test("emptyCart", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
      const result = await cartDAO.emptyCart(
        1
      );
    
    mockDB.mockRestore();

    expect(result).toEqual(true)
  });
});
  
describe("Deletes all carts", () => {
  test("deleteAllCarts", async () => {
    const cartDAO = new CartDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
      const result = await cartDAO.deleteAllCarts();
    
    mockDB.mockRestore();

    expect(result).toEqual(true)
  });
});


describe("retrieves a list of all the carts", () => {
  test("getAllCartIds", async () => {
    const cartDAO = new CartDAO();
    const mockDBEach = jest.spyOn(db, "each").mockImplementation((sql, params, callback, complete) => {
      callback(null, {id: 4});
      complete(null, {})
      return {} as Database;
    });

      const result = await cartDAO.getAllCartIds(
      );
    mockDBEach.mockRestore();

    expect(result).toEqual([4])
  });
});

//old tests here
test("registerNewProduct", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.getLastCartId(
      "",
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("isProductQuantityEnough", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "each").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.isProductQuantityEnough(
      1
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("getPastCartsId", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "each").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.getPastCartsId(
      ""
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("deleteProductRecordFromCart", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.deleteProductRecordFromCart(
      1,
      ""
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("deleteProductInstanceFromCart", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.deleteProductInstanceFromCart(
      1,
      ""
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("emptyCart", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.emptyCart(
      1
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("deleteAllCarts", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.deleteAllCarts(
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("getAllCartIds", async () => {
  const cartDAO = new CartDAO();
  const mockDB = jest.spyOn(db, "each").mockImplementation((sql, params, callback) => {
      callback(new Error("no such cart"));
      return {} as Database;
    });
  try {
    const result = await cartDAO.getAllCartIds(
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});
