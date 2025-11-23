import { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import styles from "./Cadastro.module.css";

export default function Cadastro() {
  const { signUp, sessionError } = useContext(CartContext);
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const ok = await signUp(email, senha, nome);

    if (ok) {
      navigate("/login"); // ou a página que quiser
    }
  }

  return (
    <div className={styles.container}>
      <h2>Cadastro</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Nome:
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>

        <label>
          E-mail:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha:
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>

        {sessionError && (
          <p className={styles.error}>{sessionError}</p>
        )}

        <button type="submit">Cadastrar</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        Já tem conta? <a href="/login">Entrar</a>
      </p>
    </div>
  );
}
