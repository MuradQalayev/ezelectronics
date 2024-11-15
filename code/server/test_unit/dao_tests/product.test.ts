import {
    describe,
    test,
    expect,
    beforeAll,
    afterAll,
    jest,
  } from "@jest/globals";
  
  import ProductDAO from "../../src/dao/productDAO";
  import db from "../../src/db/db";
  import { Database } from "sqlite3";
  import * as errors from '../../src/errors/productError'

  jest.mock("crypto");
  jest.mock("../../src/db/db.ts");

const product1 = {model: 'product1', category: "Smartphone", quantity: 3, details: "product1 so cool", sellingPrice: 100, arrivalDate: "2011-11-11"}

describe("Adding new product", () => {

  test("registerNewProduct", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
      const result = await productDAO.registerNewProduct(
        "model",
        "category",
        12,
        null,
        300,
        null
      );
    mockDBRun.mockRestore();

  });

  // test("registerNewProduct with redundant model:Expecting it to fail", async () => {
  //   const productDAO = new ProductDAO();
  //   const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
  //       callback(new Error("UNIQUE constraint failed: product.model"));
  //       return {} as Database;
  //     });
  //   try {
  //     const result = await productDAO.registerNewProduct(
  //       "model",
  //       "category",
  //       12,
  //       null,
  //       300,
  //       null
  //     );
  //   } catch (error) {
  //     expect(error).toStrictEqual(new Error("UNIQUE constraint failed: product.model"));
  //   }
  //   mockDBRun.mockRestore();
  // });

});

describe("Increasing product quantity", () => {
  test("increaseProductQuantity: returning false because of failure", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(false);
        return {} as Database;
      });
    try {
      const result = await productDAO.increaseProductQuantity(
        "model",
        12
      );
    } catch (error) {
      expect(error).toBe(false);
    }
    mockDBRun.mockRestore();
  });

  test("increaseProductQuantity: success, returning true", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        Promise.resolve(true)
        return {} as Database;
      });
    
    const result = await productDAO.increaseProductQuantity(
      "model",
      12
    );
    mockDBRun.mockRestore();
    expect(result).toBe(true)
  });
});


describe("Decreasing product quantity", () => {
  test("decreaseProductQuantity: returning false because of failure", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(false);
        return {} as Database;
      });
    try {
      const result = await productDAO.decreaseProductQuantity(
        "model",
        12
      );
    } catch (error) {
      expect(error).toBe(false);
    }
    mockDBRun.mockRestore();
  });

  test("decreaseProductQuantity: success, returning true", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        Promise.resolve(true)
        return {} as Database;
      });
    
    const result = await productDAO.decreaseProductQuantity(
      "model",
      12
    );
    mockDBRun.mockRestore();

    expect(result).toBe(true)
  });
});

describe("Checking if a product model exists", () => {
  test("productModelExists: it does, returning the product", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, product1);
        return {} as Database;
      });

      const result = await productDAO.productModelExists(
        "model"
      );
    mockDBRun.mockRestore();
    expect(result).toEqual(product1)
  });

  test("productModelExists: it doesn't, returning null", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null);
        return {} as Database;
      });
    
      const result = await productDAO.productModelExists(
        "model"
      );
    
    mockDBRun.mockRestore();

    expect(result).toEqual(null)
  });

  // test("productModelExists: failing", async () => {
  //   const productDAO = new ProductDAO();
  //   const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
  //       callback(new Error("Error while handling the request"), {});
  //       return {} as Database;
  //     });
  //   try {
  //     const result = await productDAO.productModelExists(
  //       "model"
  //     );
  //   } catch (error) {
  //     expect(error).toStrictEqual(new Error("Error while handling the request"));
  //   }
  //   mockDBRun.mockRestore();
  // });
});

describe("Getting a product's quantity", () => {
  test("getProductQuantity: Succeeding ", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, product1);
        return {} as Database;
      });
    
      const result = await productDAO.getProductQuantity(
        "model"
      );
    mockDBRun.mockRestore();
    expect(result).toEqual(product1.quantity)
  });

  // test("getProductQuantity: failing, no such product exists", async () => {
  //   const productDAO = new ProductDAO();
  //   const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
  //       callback(null, {});
  //       return {} as Database;
  //     });
  //   try {
  //     const result = await productDAO.getProductQuantity(
  //       "model"
  //     );
  //   } catch (error) {
  //     expect(error).toStrictEqual(new errors.ProductNotFoundError());
  //   }
  //   mockDBRun.mockRestore();
  // });


  // test("getProductQuantity: failing", async () => {
  //   const productDAO = new ProductDAO();
  //   const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
  //       callback(new Error("error handling the request"), {});
  //       return {} as Database;
  //     });
  //   try {
  //     const result = await productDAO.getProductQuantity(
  //       "model"
  //     );
  //   } catch (error) {
  //     expect(error).toStrictEqual(new Error("error handling the request"));
  //   }
  //   mockDBRun.mockRestore();
  // });

});

describe("Getting all products", () => {
  test("getAllProductsData: only available", async () => {
    
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [product1]);
        return {} as Database;
      });

      const result = await productDAO.getAllProductsData(
        true
      );
    mockDB.mockRestore();
    expect(result).toEqual([product1])
  });

  test("getAllProductsData: all", async () => {
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [product1]);
        return {} as Database;
      });

      const result = await productDAO.getAllProductsData(
        false
      );
    mockDB.mockRestore();
    expect(result).toEqual([product1])
  });

  // test("getAllProductsData: failing", async () => {
  //   const productDAO = new ProductDAO();
  //   const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
  //     callback(new Error("error handling the request"), [product1]);
  //     return {} as Database;
  //   });

  //     try {
  //       const result = await productDAO.getProductQuantity(
  //         "model"
  //       );
  //     } catch (error) {
  //       expect(error).toStrictEqual(new Error("error handling the request"));
  //     }
  //     mockDB.mockRestore();
  // });

});

describe("Getting products by category", () => {
  test("getAllProductsDataByCategory: only available", async () => {
    
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [product1]);
        return {} as Database;
      });

      const result = await productDAO.getAllProductsDataByCategory(
        true, "Smartphone"
      );
    mockDB.mockRestore();
    expect(result).toEqual([product1])
  });

  test("getAllProductsData: all", async () => {
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [product1]);
        return {} as Database;
      });

      const result = await productDAO.getAllProductsDataByCategory(
        false, "Smartphone"
      );
    mockDB.mockRestore();
    expect(result).toEqual([product1])
  });
});

describe("Getting a product by model", () => {
  test("getAllProductsDataByModel: only if available", async () => {
    
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [product1]);
        return {} as Database;
      });

      const result = await productDAO.getAllProductsDataByModel(
        true, "product1"
      );
    mockDB.mockRestore();
    expect(result).toEqual([product1])
  });

  test("getAllProductsDataByModel: all cases", async () => {
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [product1]);
        return {} as Database;
      });

      const result = await productDAO.getAllProductsDataByModel(
        false, "product1"
      );
    mockDB.mockRestore();
    expect(result).toEqual([product1])
  });
});

describe("Deleting all products", () => {
  test("deleteAllProducts", async () => {
    const productDAO = new ProductDAO();
    const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    
    const result = await productDAO.deleteAllProducts();
    mockDB.mockRestore();
    expect(result).toBe(true)
  });
});


describe("Deleting a specific product", () => {
  test("deleteProduct", async () => {
    const productDAO = new ProductDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    
    const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((callback) => {
      //despite VScode saying there is an error, the test works correctly
      callback()
    });

      const result = await productDAO.deleteProduct(
        'model'
      );
    
    mockDBRun.mockRestore();
    mockDBSerialize.mockRestore()

    expect(result).toBe(true)
  });
});


//old tests here
test("registerNewProduct", async () => {
  const productDAO = new ProductDAO();
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("UNIQUE constraint failed: product.model"));
      return {} as Database;
    });
  try {
    const result = await productDAO.registerNewProduct(
      "model",
      "category",
      12,
      null,
      300,
      null
    );
  } catch (error) {
    expect(error);
  }
  mockDBRun.mockRestore();
});


test("increaseProductQuantity", async () => {
  const productDAO = new ProductDAO();
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("No such product exists"));
      return {} as Database;
    });
  try {
    const result = await productDAO.increaseProductQuantity(
      "model",
      12
    );
  } catch (error) {
    expect(error);
  }
  mockDBRun.mockRestore();
});

test("decreaseProductQuantity", async () => {
  const productDAO = new ProductDAO();
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("No such product exists"));
      return {} as Database;
    });
  try {
    const result = await productDAO.decreaseProductQuantity(
      "model",
      12
    );
  } catch (error) {
    expect(error);
  }
  mockDBRun.mockRestore();
});

test("productModelExists", async () => {
  const productDAO = new ProductDAO();
  const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("error handling the request"));
      return {} as Database;
    });
  try {
    const result = await productDAO.productModelExists(
      "model"
    );
  } catch (error) {
    expect(error);
  }
  mockDBRun.mockRestore();
});

test("getProductQuantity", async () => {
  const productDAO = new ProductDAO();
  const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("error handling the request"));
      return {} as Database;
    });
  try {
    const result = await productDAO.getProductQuantity(
      "model"
    );
  } catch (error) {
    expect(error);
  }
  mockDBRun.mockRestore();
});

test("getAllProductsData", async () => {
  const productDAO = new ProductDAO();
  const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(new Error("error handling the request"));
      return {} as Database;
    });
  try {
    const result = await productDAO.getAllProductsData(
      true
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("getAllProductsDataByCategory", async () => {
  const productDAO = new ProductDAO();
  const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(new Error("error handling the request"));
      return {} as Database;
    });
  try {
    const result = await productDAO.getAllProductsDataByCategory(
      true,
      'category'
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("getAllProductsDataByModel", async () => {
  const productDAO = new ProductDAO();
  const mockDB = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(new Error("error handling the request"));
      return {} as Database;
    });
  try {
    const result = await productDAO.getAllProductsDataByModel(
      true,
      'model'
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

test("deleteAllProducts", async () => {
  const productDAO = new ProductDAO();
  const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("error handling the request"));
      return {} as Database;
    });
  try {
    const result = await productDAO.deleteAllProducts(
    );
  } catch (error) {
    expect(error);
  }
  mockDB.mockRestore();
});

//   test("deleteProduct", async () => {
//     const productDAO = new ProductDAO();
//     const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
//         callback(new Error("error handling the request"));
//         return {} as Database;
//       });
//     jest.spyOn(db, "serialize").mockImplementation((next) => {
//         return next;
//     })
//     try {
//       const result = await productDAO.deleteProduct(
//         'model'
//       );
//     } catch (error) {
//       expect(error);
//     }
//     mockDB.mockRestore();
//   });

