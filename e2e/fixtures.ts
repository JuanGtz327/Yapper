import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type TestProduct = {
  name: string
  category: string
  published: boolean
  variants: Array<{
    sku: string
    name: string
    salePrice: number
    inventoryCost: number
    stock: number
  }>
}

export type TestClient = {
  name: string
  phone: string
  zone: string
}

export async function createTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error && error.message !== 'User already registered') throw error
  return data.user
}

export async function deleteTestUser(email: string) {
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u) => u.email === email)
  if (user) {
    await supabase.auth.admin.deleteUser(user.id)
  }
}
