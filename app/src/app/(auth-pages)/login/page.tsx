import styles from "./page.module.css";
import { login } from './actions'

export default function LoginPage() {
  return (
    <div className={styles["login-page"]}>
    <form className={styles.loginForm}>
      <h2>Login</h2>

      <input
        type="password"
        placeholder="Password"
        className={styles.input}
      />
      <button formAction={login} className={styles.button}>
        Login
      </button>
    </form>
    </div>
  )
}