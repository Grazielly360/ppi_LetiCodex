import styles from "./Cadastro.module.css";
import { useState } from "react";
import { onRegister } from "react";

export function Cadastro({ onRegister }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (onRegister) onRegister({ nome, email, senha });
  }

  return (
    <div className={styles.container}>
      <h2>Cadastro de Usuário</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nome:
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
        </label>
        <label>
          E-mail:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha:
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
        </label>
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
}