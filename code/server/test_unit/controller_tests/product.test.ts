import { test, expect, jest, describe, afterEach } from "@jest/globals";
import ProductController from "../../src/controllers/productController";
import ProductDAO from "../../src/dao/productDAO";
import { Product, Category } from "../../src/components/product";
import {
  ProductNotFoundError,
  ProductAlreadyExistsError,
  ProductSoldError,
  EmptyProductStockError,
  LowProductStockError,
} from "../../src/errors/productError";
import { resolve } from "path";

jest.mock("../../src/dao/productDAO");

afterEach(() => {
  jest.clearAllMocks();
});

let controller = new ProductController();

describe("POST ezelectronics/products", () => {
  test("registerProducts", async () => {
    let date: Date = new Date();
    jest
      .spyOn(ProductDAO.prototype, "registerNewProduct")
      .mockImplementation(() => {
        return Promise.resolve();
      });
    let fake_date: string = date as unknown as string;
    const response = await controller.registerProducts(
      "aa",
      "asd",
      1,
      null,
      1,
      fake_date,
    );
    let result = date.toISOString().slice(0, 10);
    expect(ProductDAO.prototype.registerNewProduct).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.registerNewProduct).toHaveBeenCalledWith(
      "aa",
      "asd",
      1,
      null,
      1,
      result,
    );
    //Check if the response is true
    expect(200);
  });

  test("changeProductQuantity", async () => {
    let productData: Product = {
      sellingPrice: 123,
      model: "Test Product",
      category: Category.SMARTPHONE,
      arrivalDate: "2023-01-01",
      details: null,
      quantity: 10,
    };

    // Mocking the DAO methods
    jest
      .spyOn(ProductDAO.prototype, "productModelExists")
      .mockResolvedValueOnce(productData);
    jest
      .spyOn(ProductDAO.prototype, "increaseProductQuantity")
      .mockResolvedValueOnce(true);

    const response = await controller.changeProductQuantity(
      "iPhone X",
      20,
      "2023-01-01",
    );

    //let result = date.toISOString().slice(0, 10);
    expect(ProductDAO.prototype.increaseProductQuantity).toHaveBeenCalledTimes(
      1,
    );
    expect(ProductDAO.prototype.increaseProductQuantity).toHaveBeenCalledWith(
      "iPhone X",
      20,
    );
    expect(200);
  });

  test("sellProduct", async () => {
    let date: Date = new Date();
    let productData: Product = {
      sellingPrice: 123,
      model: "Test Product",
      category: Category.SMARTPHONE,
      arrivalDate: "2023-01-01",
      details: null,
      quantity: 40,
    };
    // Mocking the DAO methods
    jest
      .spyOn(ProductDAO.prototype, "productModelExists")
      .mockResolvedValueOnce(productData);
    jest
      .spyOn(ProductDAO.prototype, "decreaseProductQuantity")
      .mockResolvedValueOnce(true);

    let fake_date: string = date as unknown as string;
    const response = await controller.sellProduct("iPhone X", 20, fake_date);

    //let result = date.toISOString().slice(0, 10);
    expect(ProductDAO.prototype.decreaseProductQuantity).toHaveBeenCalledTimes(
      1,
    );
    expect(ProductDAO.prototype.decreaseProductQuantity).toHaveBeenCalledWith(
      "iPhone X",
      20,
    );
    expect(200);
  });

  test("getProducts", async () => {
    const model = "iPhone X";
    const productData: Product = {
      sellingPrice: 123,
      model: "iPhone X",
      category: Category.SMARTPHONE,
      arrivalDate: "2023-01-01",
      details: null,
      quantity: 40,
    };

    jest
      .spyOn(ProductDAO.prototype, "productModelExists")
      .mockResolvedValueOnce(productData);
    jest
      .spyOn(ProductDAO.prototype, "getAllProductsData")
      .mockResolvedValueOnce([productData]);
    const response = await controller.getProducts(
      undefined as any,
      undefined as any,
      undefined as any,
    );

    expect(ProductDAO.prototype.getAllProductsData).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getAllProductsData).toHaveBeenCalledWith(false);
    expect(response).toEqual([productData]);
  });

  test("getAvailableProducts", async () => {
    const model = "iPhone X";
    const productData: Product = {
      sellingPrice: 123,
      model: "iPhone X",
      category: Category.SMARTPHONE,
      arrivalDate: "2023-01-01",
      details: null,
      quantity: 40,
    };

    jest
      .spyOn(ProductDAO.prototype, "productModelExists")
      .mockResolvedValueOnce(productData);
    jest
      .spyOn(ProductDAO.prototype, "getAllProductsData")
      .mockResolvedValueOnce([productData]);
    const response = await controller.getAvailableProducts(
      undefined as any,
      undefined as any,
      undefined as any,
    );

    expect(ProductDAO.prototype.getAllProductsData).toHaveBeenCalledTimes(1);
    expect(response).toEqual([productData]);
  });

  test("deleteAllProducts", async () => {
    jest
      .spyOn(ProductDAO.prototype, "deleteAllProducts")
      .mockResolvedValueOnce(true);
    const response = await controller.deleteAllProducts();
    expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });

  test("delectProduct", async () => {
    const model = "iPhone X";
    const productData: Product = {
      sellingPrice: 123,
      model: "iPhone X",
      category: Category.SMARTPHONE,
      arrivalDate: "2023-01-01",
      details: null,
      quantity: 40,
    };

    jest
      .spyOn(ProductDAO.prototype, "productModelExists")
      .mockResolvedValueOnce(productData);
    const response = await controller.deleteProduct(productData.model);
    expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.deleteProduct).toBeCalledWith(model);
    expect(response).toBe;
  });
});
