import { describe, expect, it } from 'vitest'
import { alternativesPourBuild, categorieObjet, getBuild, getObjet, objets } from './index'

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

describe('categorieObjet', () => {
  it('classe correctement des exemples réels de chaque famille', () => {
    const cas: [string, string][] = [
      ['markoheshkir', 'Arme'], // "Bâton (arme à deux mains)"
      ['deathstalker-mantle', 'Cape'],
      ['amulet-of-bhaal', 'Amulette'],
    ]
    for (const [id, categorieAttendue] of cas) {
      const objet = getObjet(id)
      if (!objet) throw new Error(`objet de référence introuvable : ${id}`)
      expect(categorieObjet(objet)).toBe(categorieAttendue)
    }
  })

  it("reconnaît une arme même quand le mot-clé n'est pas en début de type (régression : correspondance sensible à la casse)", () => {
    // Le champ `type` ne met en majuscule que le premier mot ("Grande massue (arme à deux
    // mains)") — une comparaison sensible à la casse ratait ce genre de cas.
    expect(categorieObjet({ type: 'Grande massue (arme à deux mains)' } as never)).toBe('Arme')
  })

  it('classe chaque objet du catalogue sans jamais planter, et laisse très peu de choses en "Autre"', () => {
    const categories = objets.map((o) => categorieObjet(o))
    expect(categories).toHaveLength(objets.length)
    const nbAutre = categories.filter((c) => c === 'Autre').length
    // Une régression de la reconnaissance de mots-clés fait grimper ce nombre d'un coup — sert
    // d'alarme si la classification se dégrade largement, sans être trop strict sur le chiffre exact.
    expect(nbAutre).toBeLessThan(5)
  })
})
