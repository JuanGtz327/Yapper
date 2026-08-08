import {
  BarChart3,
  Boxes,
  ClipboardList,
  ShoppingBag,
  Users,
} from 'lucide-react'

export type Page =
  | 'Inicio'
  | 'Pedidos'
  | 'Almacén'
  | 'Clientes'
  | 'Tienda'
  | 'Estadísticas'
  | 'Ajustes'

export type Modal = 'client' | 'order' | 'categories' | 'optionTypes' | null

export const navItems = [
  { label: 'Inicio', icon: BarChart3 },
  { label: 'Pedidos', icon: ClipboardList },
  { label: 'Almacén', icon: Boxes },
  { label: 'Clientes', icon: Users },
  { label: 'Tienda', icon: ShoppingBag },
  { label: 'Estadísticas', icon: BarChart3 },
] satisfies Array<{ label: Page; icon: typeof BarChart3 }>
