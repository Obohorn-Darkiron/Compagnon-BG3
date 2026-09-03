import { describe, expect, it } from 'vitest'
import { dedupliquerParIdAffiche, resoudreObjetPourStyle, type ObjetResolu } from './alignementUtils'

// Ces tests couvrent la logique qui a eu le plus de vrais bugs du projet : confusion entre
// alignement 'restreint' (origine/compagnon, jamais un choix moral) et 'sombre' (choix moral, ne
// se remplace qu'en Bienveillant), et affichage en double d'un objet quand un remplacement
// retombe sur quelque chose déjà présent ailleurs. On teste resoudreObjetPourStyle contre de
// vrais objetId du catalogue plutôt que des fixtures : ce sont exactement les cas qui ont buggé.

describe('resoudreObjetPourStyle — objets "restreint" (origine/compagnon)', () => {
  it("n'est jamais remplacé, même en Bienveillant (régression : traité comme 'sombre' par erreur)", () => {
    const resolu = resoudreObjetPourStyle('deathstalker-mantle', 'bienveillant', 'Cape')
    expect(resolu.alternative).toBeUndefined()
    expect(resolu.sansAlternative).toBe(false)
    expect(resolu.idAffiche).toBe('deathstalker-mantle')
    expect(resolu.objet).toBe(resolu.objetOriginal)
  })

  it("reste inchangé quel que soit le style de jeu", () => {
    for (const style of ['sombre', 'neutre', null] as const) {
      const resolu = resoudreObjetPourStyle('deathstalker-mantle', style, 'Cape')
      expect(resolu.alternative).toBeUndefined()
      expect(resolu.sansAlternative).toBe(false)
    }
  })
})

describe('resoudreObjetPourStyle — objets "sombre" (choix moral)', () => {
  it('ne se remplace que si le style est Bienveillant', () => {
    for (const style of ['sombre', 'neutre', null] as const) {
      const resolu = resoudreObjetPourStyle('amulet-of-bhaal', style, 'Amulette')
      expect(resolu.alternative).toBeUndefined()
      expect(resolu.objet).toBe(resolu.objetOriginal)
    }
  })

  it('utilise l’alternative vérifiée en base quand elle existe, marquée comme non-automatique', () => {
    const resolu = resoudreObjetPourStyle('amulet-of-bhaal', 'bienveillant', 'Amulette')
    expect(resolu.alternative?.id).toBe('amulet-of-the-harpers')
    expect(resolu.alternativeAutoTrouvee).toBe(false)
    expect(resolu.sansAlternative).toBe(false)
    expect(resolu.idAffiche).toBe('amulet-of-the-harpers')
  })

  it("cherche une alternative automatique quand aucune n'est vérifiée en base", () => {
    // vicious-battleaxe est un objet 'sombre' sans .alternative curée dans objets.json.
    const resolu = resoudreObjetPourStyle('vicious-battleaxe', 'bienveillant', 'Arme')
    expect(resolu.alternative).toBeDefined()
    expect(resolu.alternative?.alignement).toBe('neutre')
    expect(resolu.alternativeAutoTrouvee).toBe(true)
    expect(resolu.alternative?.id).not.toBe('vicious-battleaxe')
  })

  it("signale l'absence d'alternative sans planter quand aucun objet neutre n'existe à cet emplacement", () => {
    const resolu = resoudreObjetPourStyle('vicious-battleaxe', 'bienveillant', 'Emplacement-inexistant')
    expect(resolu.alternative).toBeUndefined()
    expect(resolu.alternativeAutoTrouvee).toBe(false)
    expect(resolu.sansAlternative).toBe(true)
  })
})

describe('resoudreObjetPourStyle — objets "neutre"', () => {
  it("n'est jamais touché, quel que soit le style", () => {
    for (const style of ['bienveillant', 'sombre', 'neutre', null] as const) {
      const resolu = resoudreObjetPourStyle('markoheshkir', style, 'Arme')
      expect(resolu.alternative).toBeUndefined()
      expect(resolu.objet).toBe(resolu.objetOriginal)
    }
  })
})

describe('resoudreObjetPourStyle — objet introuvable', () => {
  it('ne plante pas et retombe sur l’id brut', () => {
    const resolu = resoudreObjetPourStyle('id-qui-n-existe-pas', 'bienveillant', 'Arme')
    expect(resolu.objetOriginal).toBeUndefined()
    expect(resolu.objet).toBeUndefined()
    expect(resolu.idAffiche).toBe('id-qui-n-existe-pas')
  })
})

function creerEntreeFixture(overrides: Partial<ObjetResolu & { importance: 'Essentiel' | 'Bon' }> = {}) {
  return {
    objetOriginal: undefined,
    objet: undefined,
    alternative: undefined,
    alternativeAutoTrouvee: false,
    sansAlternative: false,
    idAffiche: 'objet-a',
    importance: 'Bon' as const,
    ...overrides,
  }
}

describe('dedupliquerParIdAffiche', () => {
  it('laisse une liste sans doublon inchangée', () => {
    const entrees = [creerEntreeFixture({ idAffiche: 'a' }), creerEntreeFixture({ idAffiche: 'b' })]
    expect(dedupliquerParIdAffiche(entrees)).toHaveLength(2)
  })

  it('fusionne deux entrées qui pointent vers le même objet affiché', () => {
    const entrees = [creerEntreeFixture({ idAffiche: 'x' }), creerEntreeFixture({ idAffiche: 'x' })]
    expect(dedupliquerParIdAffiche(entrees)).toHaveLength(1)
  })

  it('garde la meilleure importance rencontrée entre les doublons', () => {
    const entrees = [
      creerEntreeFixture({ idAffiche: 'x', importance: 'Bon' }),
      creerEntreeFixture({ idAffiche: 'x', importance: 'Essentiel' }),
    ]
    expect(dedupliquerParIdAffiche(entrees)[0].importance).toBe('Essentiel')

    const inverse = [
      creerEntreeFixture({ idAffiche: 'x', importance: 'Essentiel' }),
      creerEntreeFixture({ idAffiche: 'x', importance: 'Bon' }),
    ]
    expect(dedupliquerParIdAffiche(inverse)[0].importance).toBe('Essentiel')
  })

  it('préserve la note de remplacement si une seule des deux entrées en porte une', () => {
    const objetRemplace = { id: 'objet-original' } as ObjetResolu['objetOriginal']
    const objetAlternatif = { id: 'objet-alt' } as ObjetResolu['alternative']
    const entrees = [
      creerEntreeFixture({ idAffiche: 'x' }), // pas de remplacement
      creerEntreeFixture({
        idAffiche: 'x',
        alternative: objetAlternatif,
        alternativeAutoTrouvee: true,
        objetOriginal: objetRemplace,
      }),
    ]
    const [fusionnee] = dedupliquerParIdAffiche(entrees)
    expect(fusionnee.alternative).toBe(objetAlternatif)
    expect(fusionnee.alternativeAutoTrouvee).toBe(true)
    expect(fusionnee.objetOriginal).toBe(objetRemplace)
  })

  it('reste "sans alternative" seulement si les deux entrées fusionnées le sont', () => {
    const uneSeule = [
      creerEntreeFixture({ idAffiche: 'x', sansAlternative: true }),
      creerEntreeFixture({ idAffiche: 'x', sansAlternative: false }),
    ]
    expect(dedupliquerParIdAffiche(uneSeule)[0].sansAlternative).toBe(false)

    const lesDeux = [
      creerEntreeFixture({ idAffiche: 'x', sansAlternative: true }),
      creerEntreeFixture({ idAffiche: 'x', sansAlternative: true }),
    ]
    expect(dedupliquerParIdAffiche(lesDeux)[0].sansAlternative).toBe(true)
  })

  it('conserve l’ordre de première apparition', () => {
    const entrees = [
      creerEntreeFixture({ idAffiche: 'b' }),
      creerEntreeFixture({ idAffiche: 'a' }),
      creerEntreeFixture({ idAffiche: 'b' }),
    ]
    expect(dedupliquerParIdAffiche(entrees).map((e) => e.idAffiche)).toEqual(['b', 'a'])
  })
})
