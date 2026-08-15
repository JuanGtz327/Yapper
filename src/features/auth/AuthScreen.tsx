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
    <main className="grid grid-cols-[minmax(390px,480px)_1fr] min-h-screen bg-[#f8f7f5] max-[750px]:block">
      <section className="flex flex-col justify-center py-[60px] px-[clamp(30px,7vw,92px)] bg-[#fffefa] max-[750px]:min-h-screen max-[750px]:px-7 max-[750px]:py-[35px]">
        <div className="flex items-center gap-[11px] mb-[76px] max-[750px]:mb-[65px]">
          <div className="brand-mark">Y</div>
          <div>
            <strong>Yapper</strong>
            <span> - </span>
            <span>Gestor de ventas</span>
          </div>
        </div>
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
            TU NEGOCIO, MÁS SENCILLO
          </span>
          <h1 className="mt-1 mb-[10px] text-[34px]">
            {isSignUp ? 'Crea tu cuenta' : 'Qué bueno verte'}
          </h1>
          <p className="max-w-[300px] text-muted-foreground text-[13px] leading-[1.6]">
            Gestiona pedidos, productos y clientes desde un solo lugar.
          </p>
        </div>
        <form className="grid gap-4 mt-9" onSubmit={submit}>
          <label>
            <span className="block mb-[7px] text-[#716b72] text-[11px] font-bold">
              Correo electrónico
            </span>
            <div className="flex items-center gap-2">
              <Mail
                size={18}
                className="text-muted-foreground"
                aria-hidden="true"
              />
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
            <span className="block mb-[7px] text-[#716b72] text-[11px] font-bold">
              Contraseña
            </span>
            <div className="flex items-center gap-2">
              <LockKeyhole
                size={18}
                className="text-muted-foreground"
                aria-hidden="true"
              />
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
            <p
              className="px-3 py-[10px] rounded-[7px] text-[#aa6259] bg-[#fff3f0] text-[11px]"
              role="alert"
              aria-live="assertive"
            >
              {message}
            </p>
          )}
          <Button
            variant="primary"
            className="justify-center w-full mt-[6px]"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Comprobando...' : isSignUp ? 'Crear cuenta' : 'Entrar'}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
        <button
          className="mt-[21px] border-0 text-[#6d3c72] bg-transparent text-[12px] font-bold"
          onClick={() => {
            setIsSignUp((current) => !current)
            setMessage('')
          }}
          type="button"
        >
          {isSignUp ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
        </button>
      </section>
      <div className="relative flex flex-col justify-end overflow-hidden pt-[70px] px-[9%] pb-[70px] text-white bg-[#6d3c72] max-[650px]:hidden before:content-[''] before:absolute before:w-[520px] before:h-[520px] before:top-[10%] before:right-[-10%] before:border before:border-white/20 before:rounded-full before:shadow-[0_0_0_35px_rgba(255,255,255,0.04),0_0_0_70px_rgba(255,255,255,0.02)]">
        <span className="absolute top-[14%] right-[24%] text-[#dec6dc] text-[42px]">
          Y
        </span>
        <h2 className="relative text-white text-[clamp(28px,4vw,46px)] leading-[1.1] tracking-[-1.5px]">
          Más tiempo para
          <br />
          hacer crecer tu negocio.
        </h2>
        <p className="relative mt-[18px] text-[#dec6dc] text-[14px]">
          Organiza tus ventas con claridad y sin complicaciones.
        </p>
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
