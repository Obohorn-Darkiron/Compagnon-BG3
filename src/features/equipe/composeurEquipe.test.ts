import { describe, expect, it } from 'vitest'
import { creerBuildFixture } from '../../test/fixtures'
import { composerEquipe, detecterSynergies, genererConseilsRace } from './composeurEquipe'

describe('detecterSynergies', () => {
  it('détecte le combo Sculpteur de sorts + mêlée', () => {
    const evocation = creerBuildFixture({ id: 'magicien-evocation', nom: 'Magicien Évocation', roles: ['degatsDistance'] })
    const guerrier = creerBuildFixture({ id: 'guerrier-x', nom: 'Guerrier X', roles: ['degatsMelee'] })
    const synergies = detecterSynergies([evocation, guerrier])
    expect(synergies.map((s) => s.label)).toContain('Zone de dégâts sans risque pour les alliés')
  })

  it("n'affiche chaque règle qu'une seule fois même si plusieurs paires la déclenchent", () => {
    const evocation = creerBuildFixture({ id: 'magicien-evocation', nom: 'Magicien Évocation', roles: ['degatsDistance'] })
    const melee1 = creerBuildFixture({ id: 'melee-1', nom: 'Mêlée 1', roles: ['degatsMelee'] })
    const melee2 = creerBuildFixture({ id: 'melee-2', nom: 'Mêlée 2', roles: ['degatsMelee'] })
    const melee3 = creerBuildFixture({ id: 'melee-3', nom: 'Mêlée 3', roles: ['degatsMelee'] })
    const synergies = detecterSynergies([evocation, melee1, melee2, melee3])
    const occurrences = synergies.filter((s) => s.label === 'Zone de dégâts sans risque pour les alliés')
    expect(occurrences).toHaveLength(1)
  })

  it('détecte le combo Ténèbres + mêlée uniquement si le lanceur de Ténèbres est un Occultiste et le mêlée non', () => {
    const occultiste = creerBuildFixture({
      id: 'occultiste-x',
      classe: 'Occultiste',
      sortsCles: ['Ténèbres'],
      roles: ['controle'],
    })
    const melee = creerBuildFixture({ id: 'melee-x', classe: 'Guerrier', roles: ['degatsMelee'] })
    const synergies = detecterSynergies([occultiste, melee])
    expect(synergies.map((s) => s.label)).toContain('Obscurité totale à exploiter')
  })

  it('ne détecte pas le combo Ténèbres si personne ne joue en mêlée', () => {
    const occultiste = creerBuildFixture({
      id: 'occultiste-x',
      classe: 'Occultiste',
      sortsCles: ['Ténèbres'],
      roles: ['controle'],
    })
    const distance = creerBuildFixture({ id: 'distance-x', classe: 'Magicien', roles: ['degatsDistance'] })
    const synergies = detecterSynergies([occultiste, distance])
    expect(synergies.map((s) => s.label)).not.toContain('Obscurité totale à exploiter')
  })
})

describe('genererConseilsRace', () => {
  it('propose Demi-Orc pour un profil de mêlée à Force modérée', () => {
    const melee = creerBuildFixture({
      id: 'melee-x',
      nom: 'Mon Guerrier',
      roles: ['degatsMelee'],
      caracDepart: { FOR: 14, DEX: 16, CON: 14, INT: 8, SAG: 10, CHA: 8 },
    })
    const conseils = genererConseilsRace([melee])
    expect(conseils.some((c) => c.label.includes('Demi-Orc'))).toBe(true)
    expect(conseils.find((c) => c.label.includes('Demi-Orc'))?.description).toContain('Mon Guerrier')
  })

  it('propose Nain (Duergar) plutôt que Demi-Orc pour un profil de mêlée à haute Force', () => {
    const bourrin = creerBuildFixture({ id: 'bourrin-x', nom: 'Mon Bourrin', roles: ['degatsMelee'] })
    const conseils = genererConseilsRace([bourrin])
    expect(conseils.some((c) => c.label.includes('Duergar'))).toBe(true)
    expect(conseils.some((c) => c.label.includes('Demi-Orc'))).toBe(false)
  })

  it('propose Gnome pour un lanceur de sorts orienté contrôle', () => {
    const controleur = creerBuildFixture({
      id: 'controleur-x',
      nom: 'Mon Enchanteur',
      roles: ['controle'],
      sortsCles: ['Immobilisation de personne'],
    })
    const conseils = genererConseilsRace([controleur])
    expect(conseils.some((c) => c.label.includes('Gnome'))).toBe(true)
  })

  it('ne propose jamais deux fois le même conseil même si plusieurs builds y correspondent', () => {
    const melee1 = creerBuildFixture({ id: 'melee-1', roles: ['degatsMelee'] })
    const melee2 = creerBuildFixture({ id: 'melee-2', roles: ['degatsMelee'] })
    const conseils = genererConseilsRace([melee1, melee2])
    const duergar = conseils.filter((c) => c.label.includes('Duergar'))
    expect(duergar).toHaveLength(1)
  })

  it('propose Halfelin pour un profil Tireur d\'élite à distance', () => {
    const archer = creerBuildFixture({
      id: 'archer-x',
      nom: 'Mon Archer',
      roles: ['degatsDistance'],
      dons: ["Tireur d'élite (niv 4)"],
    })
    const conseils = genererConseilsRace([archer])
    expect(conseils.some((c) => c.label.includes('Halfelin'))).toBe(true)
  })

  it('propose Githyanki pour un Magicien', () => {
    const magicien = creerBuildFixture({ id: 'magicien-x', nom: 'Mon Magicien', classe: 'Magicien', roles: ['degatsDistance'] })
    const conseils = genererConseilsRace([magicien])
    expect(conseils.some((c) => c.label.includes('Githyanki'))).toBe(true)
  })

  it('propose Drakéide pour un Ensorceleur feu', () => {
    const pyromage = creerBuildFixture({
      id: 'ensorceleur-feu-x',
      nom: 'Mon Pyromage',
      classe: 'Ensorceleur',
      roles: ['degatsDistance'],
    })
    const conseils = genererConseilsRace([pyromage])
    expect(conseils.some((c) => c.label.includes('Drakéide'))).toBe(true)
  })
})

describe('composerEquipe — répartition joueurs/compagnons', () => {
  const optionsBase = {
    genre: 'equilibre' as const,
    preferenceSoin: 'peu-importe' as const,
    styleCombat: 'peu-importe' as const,
    multiclassage: 'peu-importe' as const,
  }

  it('en groupe complet (4 joueurs), personne ne devient un compagnon', () => {
    const resultat = composerEquipe({ ...optionsBase, nbJoueurs: 4 })
    expect(resultat.slots.every((s) => s.typeSlot === 'perso')).toBe(true)
    expect(resultat.slots.every((s) => !s.compagnon)).toBe(true)
  })

  it('en solo (1 joueur), exactement 1 emplacement reste "à créer" et 3 deviennent des compagnons', () => {
    const resultat = composerEquipe({ ...optionsBase, nbJoueurs: 1 })
    const persos = resultat.slots.filter((s) => s.typeSlot === 'perso')
    const compagnons = resultat.slots.filter((s) => s.typeSlot === 'compagnon')
    expect(persos).toHaveLength(1)
    expect(compagnons).toHaveLength(3)
    for (const slot of compagnons) {
      expect(slot.compagnon).toBeDefined()
    }
  })

  it('un rôle Paladin recrute Minthara sans reclassage plutôt qu\'un compagnon arbitraire (régression)', () => {
    const resultat = composerEquipe({
      ...optionsBase,
      classesAInclure: ['Occultiste', 'Barde', 'Paladin', 'Roublard'],
      nbJoueurs: 1,
    })
    const slotPaladin = resultat.slots.find((s) => s.build.classe === 'Paladin')
    expect(slotPaladin).toBeDefined()
    if (slotPaladin?.compagnon) {
      expect(slotPaladin.compagnon.classeDefaut).toBe('Paladin')
      expect(slotPaladin.compagnon.reclassageNecessaire).toBe(false)
    }
  })

  it('un personnage déjà existant (builsFixes) ne devient jamais un compagnon', () => {
    const dejaLa = composerEquipe({ ...optionsBase, nbJoueurs: 4 }).slots[0].build
    const resultat = composerEquipe({ ...optionsBase, builsFixes: [dejaLa], nbJoueurs: 1 })
    const slotExistant = resultat.slots.find((s) => s.dejaExistant)
    expect(slotExistant?.typeSlot).toBe('perso')
    expect(slotExistant?.compagnon).toBeUndefined()
  })

  it('ne propose jamais deux fois la même classe', () => {
    const resultat = composerEquipe({ ...optionsBase, nbJoueurs: 4 })
    const classes = resultat.slots.map((s) => s.build.classe)
    expect(new Set(classes).size).toBe(classes.length)
  })
})
