import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { supabase } from '../../lib/supabase.ts'

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) setMessage(getAuthErrorMessage(result.error.message))
      else if (isSignUp)
        setMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.')
    } catch {
      setMessage(
        'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">Y</div>
          <div>
            <strong>Yapper</strong>
            <span> - </span>
            <span>Gestor de ventas</span>
          </div>
        </div>
        <div className="auth-copy">
          <span className="eyebrow">TU NEGOCIO, MÁS SENCILLO</span>
          <h1>{isSignUp ? 'Crea tu cuenta' : 'Qué bueno verte'}</h1>
          <p>Gestiona pedidos, productos y clientes desde un solo lugar.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>Correo electrónico</span>
            <div className="auth-input">
              <Mail size={18} aria-hidden="true" />
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
            </div>
          </label>
          <label>
            <span>Contraseña</span>
            <div className="auth-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
            </div>
          </label>
          {message && (
            <p className="auth-message" role="alert" aria-live="assertive">
              {message}
            </p>
          )}
          <Button
            variant="primary"
            className="auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Comprobando...' : isSignUp ? 'Crear cuenta' : 'Entrar'}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setIsSignUp((current) => !current)
            setMessage('')
          }}
          type="button"
        >
          {isSignUp ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
        </button>
      </section>
      <div className="auth-aside">
        <span>Y</span>
        <h2>
          Más tiempo para
          <br />
          hacer crecer tu negocio.
        </h2>
        <p>Organiza tus ventas con claridad y sin complicaciones.</p>
      </div>
    </main>
  )
}

function getAuthErrorMessage(message: string) {
  if (message.includes('over_email_send_rate_limit')) {
    return 'Supabase alcanzó el límite temporal de correos. Espera un rato antes de volver a registrarte o desactiva la confirmación de correo durante las pruebas.'
  }
  if (message.toLowerCase().includes('user already registered')) {
    return 'Este correo ya tiene una cuenta. Intenta iniciar sesión.'
  }
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'El correo o la contraseña no son correctos.'
  }
  return 'No pudimos completar el acceso. Revisa los datos e inténtalo de nuevo.'
}
