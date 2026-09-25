export type IconPackId = 'default' | 'minimal' | 'terminal' | 'fantasy' | 'strategy' | 'outline-placeholder';

export interface IconPackDefinition {
  id: IconPackId;
  name: string;
  description: string;
  status: 'ready' | 'placeholder';
  strokeWidth: number;
  cornerStyle: 'round' | 'square';
}

export const iconPacks: IconPackDefinition[] = [
  { id:'default', name:'Default', description:'Equilibrado y amigable.', status:'ready', strokeWidth:1.8, cornerStyle:'round' },
  { id:'minimal', name:'Minimal', description:'Líneas finas y menos detalle.', status:'ready', strokeWidth:1.45, cornerStyle:'round' },
  { id:'terminal', name:'Terminal', description:'Trazo técnico de alto contraste.', status:'ready', strokeWidth:2, cornerStyle:'square' },
  { id:'fantasy', name:'Fantasy', description:'Reservado para símbolos de aventura.', status:'placeholder', strokeWidth:1.8, cornerStyle:'round' },
  { id:'strategy', name:'Strategy', description:'Reservado para mapas y tácticas.', status:'placeholder', strokeWidth:1.8, cornerStyle:'square' },
  { id:'outline-placeholder', name:'Otros packs', description:'Punto de extensión para packs futuros.', status:'placeholder', strokeWidth:1.8, cornerStyle:'round' },
];

export const resolveIconPack = (id:IconPackId) => iconPacks.find(pack=>pack.id===id) ?? iconPacks[0];
