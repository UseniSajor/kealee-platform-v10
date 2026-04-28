export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-4'
  return (
    <div className={`inline-block ${sz} border-[#E8724B] border-t-transparent rounded-full animate-spin`} />
  )
}
