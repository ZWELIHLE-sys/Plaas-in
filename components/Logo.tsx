import Image from 'next/image'
import styles from './Logo.module.css'

// Brand mark. Uses the icon PNG inside a white badge so it reads cleanly on the
// dark-green sidebar even though the source image isn't transparent yet.
export function Logo() {
  return (
    <span className={styles.mark}>
      <Image
        src="/images/plaasin-icon.png"
        alt="Plaas-In"
        width={34}
        height={34}
        className={styles.img}
        priority
      />
    </span>
  )
}
