import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../utils/supabase";
import { SessionContext } from "./SessionContext";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const { session } = useContext(SessionContext);

  // Função para carregar os produtos
  async function refreshProducts() {
    setLoading(true);
    const { data, error } = await supabase.from("product_1v").select();
    if (error) {
      setError(`Erro ao carregar produtos: ${error.message}`);
    } else {
      setProducts(data); // Atualiza os produtos no estado
    }
    setLoading(false);

    if (session && session.user) {
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("*, product_1v(*)")
        .eq("user_id", session.user.id);

      if (cartError) {
        console.error("Error loading cart:", cartError.message);
      } else {
        const mapped = cartData.map((row) => ({
          id: row.product_id,
          title: row.product_1v?.title || "",
          price: row.product_1v?.price || 0,
          thumbnail: row.product_1v?.thumbnail || "",
          quantity: row.quantity,
        }));
        setCart(mapped);
      }
    }
  }

  // Carregar produtos e carrinho apenas uma vez
  useEffect(() => {
    // Verifica se a session já foi carregada antes de fazer qualquer coisa
    if (session) {
      refreshProducts();
    }
  }, [session]); // Chama apenas quando a session mudar

  // Função para adicionar produto ao carrinho
  function addToCart(product) {
    const existingProduct = cart.find((item) => item.id === product.id);
    if (session && session.user) {
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
      if (existingProduct) {
        updateQtyCart(product.id, existingProduct.quantity + 1);
      } else {
        const next = [...cart, { ...product, quantity: 1 }];
        setCart(next);
        localStorage.setItem("cart_guest", JSON.stringify(next));
      }
    }
  }

  // Remover produto do carrinho
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

  // Atualizar quantidade no carrinho
  function updateQtyCart(productId, quantity) {
    if (session && session.user) {
      (async () => {
        try {
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

  // Limpar carrinho
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
    refreshProducts: refreshProducts,
  };

  return (
    <CartContext.Provider value={context}>{children}</CartContext.Provider>
  );
}
