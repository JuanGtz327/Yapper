import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_EMAIL = 'test@yapper.com'
const TEST_PASSWORD = 'Test1234!'

async function seed() {
  console.log('Seeding test data...')

  // Create test user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (authError && authError.message !== 'User already registered') {
    console.error('Error creating user:', authError.message)
    process.exit(1)
  }

  const userId = authData?.user?.id
  if (!userId) {
    console.log('User already exists, skipping user creation')
    return
  }

  console.log(`Created user: ${userId}`)

  // Create categories
  const { data: cat1 } = await supabase
    .from('categories')
    .insert({ user_id: userId, name: 'Ropa' })
    .select('id')
    .single()

  const { data: cat2 } = await supabase
    .from('categories')
    .insert({ user_id: userId, name: 'Accesorios' })
    .select('id')
    .single()

  console.log('Created categories')

  // Create products
  const { data: prod1 } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      name: 'Playera Básica',
      category_id: cat1?.id,
      published: true,
      public_description: 'Playera cómoda de algodón',
    })
    .select('id')
    .single()

  const { data: prod2 } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      name: 'Gorra Deportiva',
      category_id: cat2?.id,
      published: true,
      public_description: 'Gorra ajustable',
    })
    .select('id')
    .single()

  console.log('Created products')

  // Create clients
  const { data: _client1 } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: 'Juan Pérez',
      phone: '5512345678',
      address: 'Centro',
    })
    .select('id')
    .single()

  const { data: _client2 } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: 'María García',
      phone: '5598765432',
      address: 'Norte',
    })
    .select('id')
    .single()

  console.log('Created clients')

  console.log('Seed complete!')
  console.log(`Test user: ${TEST_EMAIL} / ${TEST_PASSWORD}`)
}

seed().catch(console.error)
