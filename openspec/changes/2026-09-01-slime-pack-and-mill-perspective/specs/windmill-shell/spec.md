# windmill-shell Specification

## MODIFIED Requirements

### Requirement: The ground door is open and the shell is enclosed

The ground door slit SHALL be open: door leaf hinged aside, doorway clear
from porch to lintel, interior floor visible from outside through it. The
wall bands SHALL be derived from one arc pair (`MILL.doorHalf`,
`MILL_BALCONY.phi0`): band 1 (plinth→lintel) is a full cylinder minus the
ground door arc, band 2 (lintel→deck) full, band 3 (deck→deck+lintelH) a
full cylinder minus the balcony doorway arc, crown full. The walkable
heights SHALL match the mesh everywhere: the interior wedge reads
`base + floorH`, the spiral ramp rises monotonically inside its arc, the
landing and the balcony deck both read `base + top` at their radii, and no
walkable position sees a step above `PLAYER.step`. Wall colliders SHALL
leave the door arc clear and cap the balcony-arc colliders at deck height.

#### Scenario: You can see inside through the open door

- **WHEN** the player stands on the porch facing the door
- **THEN** the doorway shows the lit interior floor (open leaf aside, no
  wall face inside the slit) and the walk-in path crosses the threshold
  without a blocking collider

#### Scenario: Heights match the mesh

- **WHEN** `groundHeight` is sampled at the wedge, spiral, landing, and
  deck radii
- **THEN** it reads `base + floorH`, the spiral ramp value, `base + top`,
  and `base + top` respectively (±0.02), keeping every existing climb
  invariant green

### Requirement: Inside the mill the camera stays in the drum at a normal zoom

When the player is inside the mill drum, the camera SHALL remain inside
the wall circle (`rIn − 0.25`) regardless of yaw, pitch, or scroll zoom,
keeping a normal third-person distance (never closer than 2.6 m of
reach, never the cramped interior pinch), with the view occluded by the
walls so the interior is the only thing visible. Entering/leaving SHALL
not pop the camera through the wall.

#### Scenario: Max zoom sweeps keep the camera inside

- **WHEN** the player stands inside the mill with zoom driven to the
  maximum and camYaw sweeps a full circle
- **THEN** the camera's horizontal distance from the mill center never
  exceeds `rIn − 0.2` and its distance to the player stays within
  [1.5, 5.5]
