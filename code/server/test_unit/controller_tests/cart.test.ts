import { test, expect, jest, describe, afterEach} from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import { Cart, ProductInCart } from '../../src/components/cart';
import CartDAO from "../../src/dao/cartDAO";
import { User, Role } from '../../src/components/user';
import ProductDAO from "../../src/dao/productDAO"
import { Product, Category } from '../../src/components/product';

jest.mock("../../src/dao/cartDAO")
jest.mock("../../src/dao/productDAO")
jest.mock("../../src/dao/userDAO")

afterEach(()=>{
    jest.clearAllMocks();
});

// this is common to every test
let controller: CartController = new CartController();

const testUser: User = {
    username: "test",
    name: "test",
    surname: "test",
    role: Role.MANAGER,
    address: "",
    birthdate: "",
};

const productData: Product = { sellingPrice: 123, 
    model: 'iPhone X', 
    category: Category.SMARTPHONE, 
    arrivalDate: '2023-01-01', 
    details: null, 
    quantity: 40 };

const testProdInCart: ProductInCart = {
    model: "iPhone X",
    quantity: 10,
    category: Category.SMARTPHONE,
    price: 120,
};
    
const testCart: Cart = {
    customer: "",
    paid: true,
    paymentDate: "",
    total: 1000,
    products: [testProdInCart],
};


describe("CartController", () => {
    test("addToCart", async () => {
        jest.spyOn(ProductDAO.prototype, 'productModelExists').mockResolvedValueOnce(productData);
        jest.spyOn(CartDAO.prototype, "addProductToCart").mockResolvedValueOnce(true);
        const response = await controller.addToCart(testUser, productData.model)

        expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    });

    test("getCart", async() =>{
        jest.spyOn(CartDAO.prototype, "getLastCartId").mockResolvedValueOnce(12);
        const response = await controller.getCart(testUser)
        
        expect(CartDAO.prototype.getLastCartId).toHaveBeenCalledTimes(1);
        expect(response).toBe;
    });

    test('checkoutCart', async() => {
        jest.spyOn(CartDAO.prototype, 'getLastCartId').mockResolvedValueOnce(123);
        
        
        jest.spyOn(CartDAO.prototype, 'isProductQuantityEnough').mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, 'getCartData').mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, 'completeSell').mockResolvedValueOnce(true);
        const response = await controller.checkoutCart(testUser);
        expect(CartDAO.prototype.completeSell).toHaveBeenCalledTimes(1);
        expect(response).toBeUndefined;
    });

    test("getCustomerCarts", async() =>{
        jest.spyOn(CartDAO.prototype, 'getPastCartsId').mockResolvedValueOnce([1]);
        jest.spyOn(CartDAO.prototype, 'getCartData').mockResolvedValueOnce(testCart);
        const response = await controller.getCustomerCarts(testUser);

        expect(CartDAO.prototype.getCartData).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getPastCartsId).toHaveBeenCalledWith(testUser.username);
        expect(response).toEqual([testCart]);
    });

    test("removeProductFromCart", async() =>{
        jest.spyOn(ProductDAO.prototype, 'productModelExists').mockResolvedValueOnce(productData);
        jest.spyOn(CartDAO.prototype, 'getLastCartId').mockResolvedValueOnce(123);
        jest.spyOn(CartDAO.prototype, 'getCartData').mockResolvedValueOnce(testCart);
        jest.spyOn(CartDAO.prototype, 'deleteProductInstanceFromCart').mockResolvedValueOnce(true);
        const response = await controller.removeProductFromCart(testUser, "iPhone X");

        expect(CartDAO.prototype.getCartData).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.productModelExists).toHaveBeenCalledWith('iPhone X');
        expect(CartDAO.prototype.getLastCartId).toHaveBeenCalledWith(testUser.username);
        expect(CartDAO.prototype.getCartData).toHaveBeenCalledWith(123);
        expect(CartDAO.prototype.deleteProductInstanceFromCart).toHaveBeenCalledWith(123, 'iPhone X');
    })

    test("clearCart", async() => {
        jest.spyOn(CartDAO.prototype, 'getLastCartId').mockResolvedValueOnce(123);
        jest.spyOn(CartDAO.prototype, 'emptyCart').mockResolvedValueOnce(true);
        const response = await controller.clearCart(testUser);
        
        expect(CartDAO.prototype.getLastCartId).toBeCalledTimes(1)
        expect(CartDAO.prototype.getLastCartId).toBeCalledWith(testUser.username);
        expect(response).toBe(true);
    });

    test("deleteAllCarts", async() => {
        jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockResolvedValueOnce(true);
        const response = await controller.deleteAllCarts();

        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    });

    test("getAllCarts", async() => {
        jest.spyOn(CartDAO.prototype, 'getAllCartIds').mockResolvedValueOnce([123]);
        jest.spyOn(CartDAO.prototype, 'getCartData').mockResolvedValueOnce(testCart);
        const response = await controller.getAllCarts();

        expect(CartDAO.prototype.getAllCartIds).toHaveBeenCalledTimes(1);
        expect(response).toEqual([testCart]);
    });
    
});