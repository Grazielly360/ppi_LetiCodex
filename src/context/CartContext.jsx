import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../utils/supabase";
import { SessionContext } from "./SessionContext";

export const CartContext = createContext({
  products: [],
  loading: false,
  error: null,
  cart: [],
  addToCart: () => {},
  updateQtyCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProductsSupabase() {
      const { data, error } = await supabase.from("product_1v").select();
      if (error) {
        setError(`Fetching products failed! ${error.message}`);
      } else {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProductsSupabase();
    // State to manage products API
    // var category = "smartphones";
    // var limit = 10;
    // var apiUrl = `https://dummyjson.com/products/category/${category}?limit=${limit}&select=id,thumbnail,title,price,description`;

    // async function fetchProducts() {
    //   try {
    //     const response = await fetch(apiUrl);
    //     const data = await response.json();
    //     setProducts(data.products);
    //   } catch (error) {
    //     setError(error);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchProducts();
  }, []);

  // State to manage the cart
  const [cart, setCart] = useState([]);

  // Access session from SessionContext
  const { session } = useContext(SessionContext);

  // Load cart for authenticated user or from localStorage for guests
  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      if (session && session.user) {
        try {
          const { data, error } = await supabase
            .from("cart")
            .select("*")
            .eq("user_id", session.user.id);
          if (error) {
            console.error("Error loading cart:", error.message);
          } else if (mounted) {
            // Map supabase rows into cart item shape
            const mapped = data.map((row) => ({
              id: row.product_id,
              title: row.title,
              price: row.price,
              thumbnail: row.thumbnail,
              quantity: row.quantity,
            }));
            setCart(mapped);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        // Guest: load from localStorage
        const guest = localStorage.getItem("cart_guest");
        if (guest && mounted) {
          try {
            setCart(JSON.parse(guest));
          } catch (err) {
            setCart([]);
          }
        } else if (mounted) {
          setCart([]);
        }
      }
    }

    loadCart();

    return () => {
      mounted = false;
    };
  }, [session]);

  function addToCart(product) {
    const existingProduct = cart.find((item) => item.id === product.id);
    if (session && session.user) {
      // persist in Supabase
      (async () => {
        try {
          const { data: existing } = await supabase
            .from("cart")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("product_id", product.id)
            .maybeSingle();

          if (existing) {
            const newQty = existing.quantity + 1;
            await supabase
              .from("cart")
              .update({ quantity: newQty })
              .eq("id", existing.id);
            setCart((prev) =>
              prev.map((it) =>
                it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
              )
            );
          } else {
            await supabase.from("cart").insert([
              {
                user_id: session.user.id,
                product_id: product.id,
                title: product.title || "",
                price: product.price || 0,
                thumbnail: product.thumbnail || "",
                quantity: 1,
              },
            ]);
            setCart((prev) => [...prev, { ...product, quantity: 1 }]);
          }
        } catch (err) {
          console.error("addToCart supabase error:", err);
        }
      })();
    } else {
      // Guest/localStorage
      if (existingProduct) {
        updateQtyCart(product.id, existingProduct.quantity + 1);
      } else {
        const next = [...cart, { ...product, quantity: 1 }];
        setCart(next);
        localStorage.setItem("cart_guest", JSON.stringify(next));
      }
    }
  }

  function removeFromCart(productId) {
    if (session && session.user) {
      (async () => {
        try {
          await supabase
            .from("cart")
            .delete()
            .eq("user_id", session.user.id)
            .eq("product_id", productId);
          setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
        } catch (err) {
          console.error("removeFromCart error:", err);
        }
      })();
    } else {
      const next = cart.filter((item) => item.id !== productId);
      setCart(next);
      localStorage.setItem("cart_guest", JSON.stringify(next));
    }
  }

  function updateQtyCart(productId, quantity) {
    if (session && session.user) {
      (async () => {
        try {
          // update supabase
          await supabase
            .from("cart")
            .update({ quantity })
            .eq("user_id", session.user.id)
            .eq("product_id", productId);
          setCart((prev) =>
            prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
          );
        } catch (err) {
          console.error("updateQtyCart error:", err);
        }
      })();
    } else {
      const next = cart.map((item) => (item.id === productId ? { ...item, quantity } : item));
      setCart(next);
      localStorage.setItem("cart_guest", JSON.stringify(next));
    }
  }

  function clearCart() {
    if (session && session.user) {
      (async () => {
        try {
          await supabase.from("cart").delete().eq("user_id", session.user.id);
          setCart([]);
        } catch (err) {
          console.error("clearCart error:", err);
        }
      })();
    } else {
      setCart([]);
      localStorage.removeItem("cart_guest");
    }
  }

  const context = {
    products: products,
    loading: loading,
    error: error,
    cart: cart,
    addToCart: addToCart,
    updateQtyCart: updateQtyCart,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    // Cart & products
    products: products,
    loading: loading,
    error: error,
    cart: cart,
    addToCart: addToCart,
    updateQtyCart: updateQtyCart,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
  };

  return (
    <CartContext.Provider value={context}>{children}</CartContext.Provider>
  );
}
