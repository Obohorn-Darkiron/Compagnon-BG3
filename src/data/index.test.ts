import { describe, expect, it } from 'vitest'
import { alternativesPourBuild, getBuild } from './index'

describe('alternativesPourBuild', () => {
  it('propose les autres approches de la même sous-classe en priorité', () => {
    const build = getBuild('occultiste-lame-maudite')
    if (!build) throw new Error('build de référence introuvable')
    const alternatives = alternativesPourBuild(build)
    expect(alternatives.some((a) => a.build.id === 'occultiste-lame-ombres')).toBe(true)
    expect(alternatives.every((a) => a.raison === 'Autre approche sur la même sous-classe')).toBe(true)
  })

  it('ne se propose jamais lui-même', () => {
    const build = getBuild('occultiste-lame-maudite')
    if (!build) throw new Error('build de référence introuvable')
    const alternatives = alternativesPourBuild(build)
    expect(alternatives.some((a) => a.build.id === build.id)).toBe(false)
  })

  it("retombe sur une autre sous-classe de la même classe s'il n'y a pas d'alternative directe", () => {
    const build = getBuild('magicien-evocation')
    if (!build) throw new Error('build de référence introuvable')
    const alternatives = alternativesPourBuild(build)
    expect(alternatives.length).toBeGreaterThan(0)
    for (const alt of alternatives) {
      expect(alt.build.classe).toBe('Magicien')
      expect(alt.build.sousClasse).not.toBe(build.sousClasse)
    }
  })

  it('limite les alternatives de repli à 3 maximum', () => {
    const build = getBuild('magicien-evocation')
    if (!build) throw new Error('build de référence introuvable')
    expect(alternativesPourBuild(build).length).toBeLessThanOrEqual(3)
  })
})
