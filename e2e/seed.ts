import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_EMAIL = 'test@yapper.com'
const TEST_PASSWORD = 'Test1234!'

async function required<T>(
  operation: Promise<{ data: T | null; error: { message: string } | null }>,
  label: string,
): Promise<T> {
  const { data, error } = await operation
  if (error) throw new Error(`${label}: ${error.message}`)
  if (data === null) throw new Error(`${label}: no data returned`)
  return data
}

async function seed() {
  console.log('Seeding test data...')

  const { data: signedUp, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  let authData = signedUp
  if (signUpError) {
    const { data: signedIn, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
    if (signInError)
      throw new Error(
        `Could not authenticate seed user: ${signInError.message}`,
      )
    authData = signedIn
  }

  const userId = authData.user?.id
  if (!userId || !authData.session) {
    throw new Error('Seed user has no authenticated session')
  }

  console.log(`Using test user: ${userId}`)

  const { data: existingCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .in('name', ['Ropa', 'Accesorios'])
  if (categoriesError)
    throw new Error(`Loading categories: ${categoriesError.message}`)

  const categoryByName = new Map(
    (existingCategories ?? []).map((category) => [category.name, category.id]),
  )
  for (const name of ['Ropa', 'Accesorios']) {
    if (!categoryByName.has(name)) {
      const category = await required(
        supabase
          .from('categories')
          .insert({ user_id: userId, name })
          .select('id, name')
          .single(),
        `Creating category ${name}`,
      )
      categoryByName.set(category.name, category.id)
    }
  }

  console.log('Categories ready')

  await required(
    supabase
      .from('business_settings')
      .upsert({
        user_id: userId,
        business_name: 'Mi Negocio',
        currency: 'MXN',
        low_stock_threshold: 5,
        public_catalog_enabled: true,
        public_slug: 'mi-negocio',
        whatsapp_number: '525512345678',
        public_intro: 'Productos para ti',
      })
      .select('user_id')
      .single(),
    'Creating business settings',
  )

  console.log('Business settings ready')

  const products = [
    {
      name: 'Playera Básica',
      sku: 'E2E-PLAYERA-BASICA',
      category_id: categoryByName.get('Ropa') ?? null,
      description: 'Playera cómoda de algodón',
    },
    {
      name: 'Gorra Deportiva',
      sku: 'E2E-GORRA-DEPORTIVA',
      category_id: categoryByName.get('Accesorios') ?? null,
      description: 'Gorra ajustable',
    },
  ]

  for (const productData of products) {
    let { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('name', productData.name)
      .maybeSingle()
    if (productError)
      throw new Error(
        `Loading product ${productData.name}: ${productError.message}`,
      )
    if (!product) {
      product = await required(
        supabase
          .from('products')
          .insert({
            user_id: userId,
            name: productData.name,
            category_id: productData.category_id,
            published: true,
            public_description: productData.description,
          })
          .select('id')
          .single(),
        `Creating product ${productData.name}`,
      )
    }

    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', product.id)
      .eq('sku', productData.sku)
      .maybeSingle()
    if (variantError)
      throw new Error(
        `Loading variant ${productData.sku}: ${variantError.message}`,
      )
    if (!variant) {
      await required(
        supabase
          .from('product_variants')
          .insert({
            product_id: product.id,
            user_id: userId,
            sku: productData.sku,
            name: 'Única',
            inventory_cost: 80,
            sale_price: 150,
            stock: 25,
            low_stock_threshold: 5,
          })
          .select('id')
          .single(),
        `Creating variant ${productData.sku}`,
      )
    } else {
      await required(
        supabase
          .from('product_variants')
          .update({
            name: 'Única',
            inventory_cost: 80,
            sale_price: 150,
            stock: 1000,
            low_stock_threshold: 5,
          })
          .eq('id', variant.id)
          .select('id')
          .single(),
        `Resetting variant ${productData.sku}`,
      )
    }
  }

  console.log('Products and variants ready')

  for (const client of [
    { name: 'Juan Pérez', phone: '5512345678', address: 'Centro' },
    { name: 'María García', phone: '5598765432', address: 'Norte' },
  ]) {
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('name', client.name)
      .maybeSingle()
    if (clientError)
      throw new Error(`Loading client ${client.name}: ${clientError.message}`)
    if (!existingClient) {
      await required(
        supabase
          .from('clients')
          .insert({ user_id: userId, ...client })
          .select('id')
          .single(),
        `Creating client ${client.name}`,
      )
    }
  }

  console.log('Clients ready')

  console.log('Seed complete!')
  console.log(`Test user: ${TEST_EMAIL} / ${TEST_PASSWORD}`)
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
