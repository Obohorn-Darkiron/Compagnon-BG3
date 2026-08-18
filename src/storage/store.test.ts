import { beforeEach, describe, expect, it } from 'vitest'
import { saveStore } from './store'

beforeEach(() => {
  saveStore.reinitialiser()
})

describe('campagnes', () => {
  it('crée une campagne avec une liste de compagnons recrutés vide', () => {
    const id = saveStore.creerCampagne('Ma campagne')
    const campagne = saveStore.getSnapshot().campagnes.find((c) => c.id === id)
    expect(campagne?.compagnonsRecrutes).toEqual([])
  })

  it('la première campagne créée devient automatiquement active', () => {
    const id = saveStore.creerCampagne('Ma campagne')
    expect(saveStore.getSnapshot().campagneActiveId).toBe(id)
  })

  it('supprimer la campagne active bascule sur une autre campagne existante', () => {
    const idA = saveStore.creerCampagne('A')
    const idB = saveStore.creerCampagne('B')
    saveStore.definirCampagneActive(idB)
    saveStore.supprimerCampagne(idB)
    expect(saveStore.getSnapshot().campagneActiveId).toBe(idA)
  })

  it('supprimer la dernière campagne ramène à un état vide', () => {
    const id = saveStore.creerCampagne('Seule')
    saveStore.supprimerCampagne(id)
    expect(saveStore.getSnapshot().campagnes).toHaveLength(0)
    expect(saveStore.getSnapshot().campagneActiveId).toBeNull()
  })

  it('les personnages restent isolés entre deux campagnes', () => {
    const idA = saveStore.creerCampagne('A')
    const idB = saveStore.creerCampagne('B')
    saveStore.creerPersonnage(idA, 'Perso A')
    const snapshot = saveStore.getSnapshot()
    const campagneA = snapshot.campagnes.find((c) => c.id === idA)
    const campagneB = snapshot.campagnes.find((c) => c.id === idB)
    expect(campagneA?.personnages).toHaveLength(1)
    expect(campagneB?.personnages).toHaveLength(0)
  })
})

describe('basculerCompagnonRecrute', () => {
  it('ajoute puis retire un compagnon de la liste des recrutés', () => {
    const id = saveStore.creerCampagne('Ma campagne')
    saveStore.basculerCompagnonRecrute(id, 'Shadowheart')
    expect(saveStore.getSnapshot().campagnes[0].compagnonsRecrutes).toEqual(['Shadowheart'])

    saveStore.basculerCompagnonRecrute(id, 'Shadowheart')
    expect(saveStore.getSnapshot().campagnes[0].compagnonsRecrutes).toEqual([])
  })

  it("n'affecte pas les autres campagnes", () => {
    const idA = saveStore.creerCampagne('A')
    const idB = saveStore.creerCampagne('B')
    saveStore.basculerCompagnonRecrute(idA, 'Astarion')
    const snapshot = saveStore.getSnapshot()
    expect(snapshot.campagnes.find((c) => c.id === idA)?.compagnonsRecrutes).toEqual(['Astarion'])
    expect(snapshot.campagnes.find((c) => c.id === idB)?.compagnonsRecrutes).toEqual([])
  })
})

describe('importerJson — rétrocompatibilité', () => {
  it('accepte une sauvegarde ancienne sans compagnonsRecrutes ni race/sousRace', () => {
    const ancienneSauvegarde = JSON.stringify({
      saveVersion: 1,
      campagneActiveId: 'c1',
      campagnes: [
        {
          id: 'c1',
          nom: 'Vieille campagne',
          personnages: [{ id: 'p1', nom: 'Vieux perso', classe: 'Guerrier', niveau: 3 }],
        },
      ],
    })

    const resultat = saveStore.importerJson(ancienneSauvegarde)
    expect(resultat.ok).toBe(true)

    const snapshot = saveStore.getSnapshot()
    expect(snapshot.campagnes[0].compagnonsRecrutes).toEqual([])
    expect(snapshot.campagnes[0].personnages[0].race).toBeNull()
    expect(snapshot.campagnes[0].personnages[0].sousRace).toBeNull()
    expect(snapshot.campagnes[0].personnages[0].niveau).toBe(3)
  })

  it('refuse un fichier qui ne ressemble pas à une sauvegarde', () => {
    const resultat = saveStore.importerJson(JSON.stringify({ pasUneSauvegarde: true }))
    expect(resultat.ok).toBe(false)
  })

  it('refuse un JSON invalide', () => {
    const resultat = saveStore.importerJson('{ pas du json valide')
    expect(resultat.ok).toBe(false)
  })
})
