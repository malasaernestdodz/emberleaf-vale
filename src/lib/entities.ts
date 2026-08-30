export const FEATURE_VOCAB = [
  'door',
  'ajar-door',
  'interior',
  'balcony',
  'porch',
  'water',
  'seating',
  'interactable',
  'light',
] as const

export type EntityFeature = (typeof FEATURE_VOCAB)[number]
export type EntityKind = 'building' | 'structure' | 'water'

export type EntityDef = {
  id: string
  name: string
  kind: EntityKind
  description: string
  features: EntityFeature[]
}

export const ENTITIES: EntityDef[] = [
  {
    id: 'house',
    name: 'Cottage',
    kind: 'building',
    description:
      'Timber-framed cottage east of the plaza: open front door, walkable interior with bed, bookshelf and stools, climbable roof.',
    features: ['door', 'interior', 'seating', 'interactable'],
  },
  {
    id: 'mansion',
    name: 'Mansion',
    kind: 'building',
    description:
      'Two-storey plaster mansion: door-centered entrance portico, grand-hall interior, stairwell to floor 2, grand bed, back balcony with an ajar double door.',
    features: ['door', 'ajar-door', 'porch', 'interior', 'balcony', 'seating', 'interactable', 'light'],
  },
  {
    id: 'windmill',
    name: 'Windmill',
    kind: 'building',
    description:
      'Hill-top windmill: ajar entrance door, spiral stair to the upper landing, guarded vista balcony with a lookout spot and turning sails.',
    features: ['door', 'ajar-door', 'interior', 'balcony', 'interactable', 'light'],
  },
  {
    id: 'fountain',
    name: 'Fountain',
    kind: 'structure',
    description:
      'Stone plaza fountain: walkable ring basin around a central spire, quest pickups scattered on the surrounding plaza.',
    features: ['water'],
  },
  {
    id: 'well',
    name: 'Well',
    kind: 'structure',
    description:
      'Stone wishing well west of the plaza: walkable rim ring with two raised posts over the water shaft.',
    features: ['water'],
  },
  {
    id: 'pond',
    name: 'Pond',
    kind: 'water',
    description:
      'Fishing pond in the southern meadow: sunken water surface with a rocky bank ring and the fishing spot for the catch quest.',
    features: ['water'],
  },
]

export function entityById(id: string): EntityDef | undefined {
  return ENTITIES.find((e) => e.id === id)
}
