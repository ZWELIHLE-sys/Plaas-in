import type { Animal } from '@/lib/types'
import styles from './BloodlineTree.module.css'

// Visual family tree built along the dam (mother) line: each animal nests under
// its mother, the sire is shown as a label, and the generation is badged — so the
// owner can see the bloodline deepen across generations at a glance.
export function BloodlineTree({
  animals,
  tagById,
}: {
  animals: Animal[]
  tagById: Record<string, string>
}) {
  const ids = new Set(animals.map((a) => a.id))
  const childrenByMother = new Map<string, Animal[]>()
  for (const a of animals) {
    if (a.mother_id && ids.has(a.mother_id)) {
      const arr = childrenByMother.get(a.mother_id) ?? []
      arr.push(a)
      childrenByMother.set(a.mother_id, arr)
    }
  }

  // Roots = dams that head a line: they have offspring but no mother on record.
  const roots = animals.filter(
    (a) => childrenByMother.has(a.id) && (!a.mother_id || !ids.has(a.mother_id)),
  )

  if (roots.length === 0) {
    return (
      <p className={styles.empty}>
        No bloodline yet — record a birth from a registered mother to grow the tree.
      </p>
    )
  }

  return (
    <div className={styles.tree}>
      {roots.map((r) => (
        <TreeNode key={r.id} animal={r} childrenByMother={childrenByMother} tagById={tagById} />
      ))}
    </div>
  )
}

function TreeNode({
  animal,
  childrenByMother,
  tagById,
}: {
  animal: Animal
  childrenByMother: Map<string, Animal[]>
  tagById: Record<string, string>
}) {
  const kids = childrenByMother.get(animal.id) ?? []
  const sire = animal.father_id ? tagById[animal.father_id] : null
  const meta = [animal.species, animal.gender, sire ? `sire ${sire}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={styles.node}>
      <div className={styles.row}>
        <span className={styles.tag}>{animal.animal_id ?? '—'}</span>
        <span className={styles.gen}>Gen {animal.generation ?? 1}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {kids.length > 0 && (
        <div className={styles.children}>
          {kids.map((k) => (
            <TreeNode key={k.id} animal={k} childrenByMother={childrenByMother} tagById={tagById} />
          ))}
        </div>
      )}
    </div>
  )
}
