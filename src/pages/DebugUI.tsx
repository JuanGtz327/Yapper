import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Spinner } from '@/components/ui/Spinner'
import { Empty } from '@/components/ui/Empty'
import { Stat } from '@/components/ui/Stat'
import { PanelHeading } from '@/components/ui/PanelHeading'
import { QuickAction } from '@/components/ui/QuickAction'
import { CustomSelect } from '@/components/ui/CustomSelect'
import {
  Palette,
  SquareStack,
  ImageIcon,
  Box,
  ToggleLeft,
} from 'lucide-react'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-border rounded-xl p-5 bg-sidebar">
      <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </section>
  )
}

export default function DebugUI() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectValue, setSelectValue] = useState('')

  return (
    <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Debug UI</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todos los componentes de UI en sus variantes para verificacion visual.
        </p>
      </header>

      <div className="grid gap-6">
        {/* Typography */}
        <Section title="Typography">
          <div className="grid gap-3">
            <div className="flex items-baseline gap-4">
              <span className="text-xs text-muted-foreground w-20">text-xs</span>
              <span className="text-xs">The quick brown fox (11px)</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-xs text-muted-foreground w-20">text-sm</span>
              <span className="text-sm">The quick brown fox (13px)</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-xs text-muted-foreground w-20">text-base</span>
              <span className="text-base">The quick brown fox (15px)</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-xs text-muted-foreground w-20">Weights</span>
              <span className="text-sm font-normal">Normal</span>
              <span className="text-sm font-semibold">Semibold</span>
              <span className="text-sm font-bold">Bold</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-xs text-muted-foreground w-20">Colors</span>
              <span className="text-sm text-foreground">Foreground (ink)</span>
              <span className="text-sm text-muted-foreground">Muted</span>
              <span className="text-sm text-primary">Primary (plum)</span>
            </div>
          </div>
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <div className="grid grid-cols-6 gap-3">
            {[
              { name: 'primary', class: 'bg-primary' },
              { name: 'primary-fg', class: 'bg-primary text-primary-foreground' },
              { name: 'secondary', class: 'bg-secondary' },
              { name: 'muted', class: 'bg-muted' },
              { name: 'destructive', class: 'bg-destructive' },
              { name: 'border', class: 'bg-border' },
              { name: 'background', class: 'bg-background border border-border' },
              { name: 'sidebar', class: 'bg-sidebar border border-border' },
              { name: 'card', class: 'bg-card border border-border' },
              { name: 'accent', class: 'bg-accent' },
              { name: 'input', class: 'bg-input' },
              { name: 'ring', class: 'bg-ring' },
            ].map((c) => (
              <div key={c.name} className="text-center">
                <div className={`w-full h-10 rounded-lg ${c.class}`} />
                <span className="text-xs text-muted-foreground mt-1 block">{c.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="grid gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Variants (md)</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sizes</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">With icons</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" icon={<Palette size={16} />}>Icon Left</Button>
                <Button variant="secondary" icon={<Box size={16} />}>With Icon</Button>
                <Button variant="danger" icon={<ToggleLeft size={16} />}>Danger Icon</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Disabled</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled>Primary</Button>
                <Button variant="secondary" disabled>Secondary</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Icon only</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" icon={<Palette size={18} />} />
                <Button variant="secondary" icon={<Box size={18} />} />
                <Button variant="danger" icon={<ToggleLeft size={18} />} />
                <Button variant="ghost" icon={<SquareStack size={18} />} />
              </div>
            </div>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <div className="grid gap-4 max-w-sm">
            <div className="grid gap-1.5">
              <Label>Default</Label>
              <Input placeholder="Escribe algo..." />
            </div>
            <div className="grid gap-1.5">
              <Label>Disabled</Label>
              <Input placeholder="Deshabilitado" disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>CustomSelect</Label>
              <CustomSelect
                value={selectValue}
                options={[
                  { value: 'opt1', label: 'Opcion 1' },
                  { value: 'opt2', label: 'Opcion 2' },
                  { value: 'opt3', label: 'Opcion 3' },
                ]}
                onChange={setSelectValue}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>shadcn Select</Label>
              <Select value={selectValue} onValueChange={(v) => v && setSelectValue(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opt1">Opcion 1</SelectItem>
                  <SelectItem value="opt2">Opcion 2</SelectItem>
                  <SelectItem value="opt3">Opcion 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card content goes here.</p>
              </CardContent>
            </Card>
            <Stat label="Ventas totales" value="$12,345" detail="+12% vs mes anterior" positive />
            <Stat label="Productos" value="48" detail="3 con stock bajo" />
            <Stat label="Pedidos" value="156" detail="Este mes" />
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        {/* Panel Heading */}
        <Section title="Panel Heading">
          <PanelHeading
            title="Seccion de ejemplo"
            subtitle="Descripcion de la seccion"
            action="Ver todo"
            onAction={() => {}}
          />
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-3 gap-3">
            <QuickAction
              icon={<Palette size={18} />}
              color="peach"
              title="Nuevo pedido"
              detail="Crear pedido"
              onClick={() => {}}
            />
            <QuickAction
              icon={<ImageIcon size={18} />}
              color="mint"
              title="Ver catalogo"
              detail="Tienda publica"
              onClick={() => {}}
            />
            <QuickAction
              icon={<SquareStack size={18} />}
              color="lavender"
              title="Estadisticas"
              detail="Ver reportes"
              onClick={() => {}}
            />
          </div>
        </Section>

        {/* Empty / Spinner */}
        <Section title="Empty & Spinner">
          <div className="grid gap-4">
            <Empty text="No hay elementos para mostrar" />
            <div className="flex items-center gap-2">
              <Spinner label="Cargando" />
              <span className="text-sm text-muted-foreground">Cargando datos...</span>
            </div>
          </div>
        </Section>

        {/* Modals */}
        <Section title="Modals">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Abrir Dialog
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Abrir ConfirmModal
            </Button>
          </div>
          {dialogOpen && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Dialog de ejemplo</DialogTitle>
                  <DialogDescription>
                    Este es un dialog shadcn con formato consistente.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Contenido del dialog aqui. Ancho consistente: max-w-lg.
                </p>
                <DialogFooter>
                  <Button variant="primary" onClick={() => setDialogOpen(false)}>
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {confirmOpen && (
            <ConfirmModal
              title="Confirmar accion"
              message="Estas seguro de que deseas realizar esta accion? Esta accion no se puede deshacer."
              danger
              onConfirm={() => {}}
              onClose={() => setConfirmOpen(false)}
            />
          )}
        </Section>

        {/* Spacing */}
        <Section title="Spacing & Radius">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-sm mx-auto" />
              <span className="text-xs text-muted-foreground mt-1 block">rounded-sm</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-md mx-auto" />
              <span className="text-xs text-muted-foreground mt-1 block">rounded-md</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-lg mx-auto" />
              <span className="text-xs text-muted-foreground mt-1 block">rounded-lg</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto" />
              <span className="text-xs text-muted-foreground mt-1 block">rounded-full</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
