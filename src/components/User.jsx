import { useContext, useEffect, useState } from "react";
import styles from "./User.module.css";
import { SessionContext } from "../context/SessionContext";
import { supabase } from "../utils/supabase";

export function User() {
  const { session, handleSignOut } = useContext(SessionContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", thumbnail: "", description: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!session) return;
    async function loadProducts() {
      setLoading(true);
      const { data, error } = await supabase.from("product_1v").select();
      if (error) {
        console.error(error);
      } else {
        setProducts(data);
      }
      setLoading(false);
    }
    loadProducts();
  }, [session]);

  async function handleAddOrUpdate(e) {
    e.preventDefault();
    if (!session || !session.user.user_metadata.admin) return;

    try {
      if (editId) {
        const { error } = await supabase.from("product_1v").update({
          title: form.title,
          price: parseFloat(form.price || 0),
          thumbnail: form.thumbnail,
          description: form.description,
        }).eq("id", editId);
        if (error) throw error;
        setProducts((p) => p.map((it) => (it.id === editId ? { ...it, ...form, price: parseFloat(form.price) } : it)));
      } else {
        const { data, error } = await supabase.from("product_1v").insert([
          {
            title: form.title,
            price: parseFloat(form.price || 0),
            thumbnail: form.thumbnail,
            description: form.description,
          },
        ]).select().single();
        if (error) throw error;
        setProducts((p) => [data, ...p]);
      }
      setForm({ title: "", price: "", thumbnail: "", description: "" });
      setEditId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEdit(product) {
    setEditId(product.id);
    setForm({ title: product.title || "", price: String(product.price || ""), thumbnail: product.thumbnail || "", description: product.description || "" });
  }

  async function handleDelete(id) {
    if (!confirm("Remover produto?")) return;
    try {
      const { error } = await supabase.from("product_1v").delete().eq("id", id);
      if (error) throw error;
      setProducts((p) => p.filter((it) => it.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <h1>User not signed in!</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {session.user.user_metadata.admin ? (
        <div>
          <h1>Admin Account</h1>
          <form onSubmit={handleAddOrUpdate} className={styles.adminForm}>
            <input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required />
            <input placeholder="Price" type="number" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} required />
            <input placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e)=>setForm({...form,thumbnail:e.target.value})} />
            <textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
            <button type="submit">{editId ? "Atualizar" : "Inserir"}</button>
            {editId && <button type="button" onClick={()=>{setEditId(null); setForm({ title: "", price: "", thumbnail: "", description: "" })}}>Cancelar</button>}
          </form>

          <h2>Produtos cadastrados</h2>
          {loading ? <p>Carregando...</p> : (
            <ul>
              {products.map((prod) => (
                <li key={prod.id} className={styles.adminItem}>
                  <img src={prod.thumbnail} alt={prod.title} />
                  <div>
                    <strong>{prod.title}</strong>
                    <p>R$ {Number(prod.price).toFixed(2)}</p>
                    <p>{prod.description}</p>
                    <button onClick={()=>handleEdit(prod)}>Editar</button>
                    <button onClick={()=>handleDelete(prod.id)}>Remover</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <h1>User Account</h1>
          <div className={styles.userInfo}>
            <p>
              <strong>Username: </strong>
              {session.user.user_metadata.username}
            </p>
            <p>
              <strong>Email: </strong>
              {session.user.email}
            </p>
            <p>
              <strong>ID: </strong>
              {session.user.id}
            </p>
          </div>
        </div>
      )}

      <button className={styles.button} onClick={handleSignOut}>
        SIGN OUT
      </button>
    </div>
  );
}
