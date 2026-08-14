export function Empty({ text }: { text: string }) {
  return (
    <div className="p-[45px] border border-dashed border-border rounded-xl text-muted-foreground text-center text-sm bg-sidebar">
      {text}
    </div>
  )
}
