import { describe, expect, it } from 'vitest'
import { creerBuildFixture } from '../../test/fixtures'
import { genererAnalyseComparative } from './comparaisonUtils'

describe('genererAnalyseComparative', () => {
  it('croise forces/faiblesses/rôles/éléments réels (Ensorceleur Foudre vs Feu)', () => {
    const foudre = creerBuildFixture({
      id: 'ensorceleur-foudre',
      nom: 'Ensorceleur Foudre',
      roles: ['controle', 'degatsDistance'],
      elements: ['foudre', 'tonnerre'],
      forces: ['Dégâts de zone énormes', 'Excellente portée', 'Contrôle via renversement/étourdissement'],
      faiblesses: ['Fragile en mêlée', 'Dépend des emplacements de haut niveau'],
    })
    const feu = creerBuildFixture({
      id: 'ensorceleur-feu-draconique-rouge',
      nom: 'Ensorceleur Feu (Lignée draconique rouge)',
      roles: ['degatsDistance'],
      elements: ['feu'],
      forces: ['Simple et robuste', 'Gros dégâts de feu constants', 'Classe unique, pas de rotation compliquée'],
      faiblesses: ['Ennemis résistants/immunisés au feu', 'Fragile en mêlée'],
    })

    const analyse = genererAnalyseComparative(foudre, feu).join(' ')

    // Noms tronqués (pas le nom complet avec la parenthèse, sinon illisible)
    expect(analyse).toContain('Ensorceleur Foudre')
    expect(analyse).toContain('Ensorceleur Feu')
    expect(analyse).not.toContain('Lignée draconique rouge')

    // Rôle unique à Foudre relevé
    expect(analyse).toContain('contrôle')
    // Forces uniques des deux côtés citées
    expect(analyse).toMatch(/portée|zone/)
    expect(analyse).toContain('rotation compliquée')
    // Faiblesse partagée citée une seule fois
    expect(analyse.match(/fragile en mêlée/gi)?.length).toBe(1)
    // Risque de résistance élémentaire (mono vs bi-élément)
    expect(analyse).toMatch(/résistances|immunités/)
  })

  it('cite les points communs (pas juste les différences) quand les deux partagent une force ou une faiblesse', () => {
    const a = creerBuildFixture({ id: 'a', nom: 'Build A', forces: ['X'], faiblesses: ['Y'] })
    const b = creerBuildFixture({ id: 'b', nom: 'Build B', forces: ['X'], faiblesses: ['Y'] })
    const analyse = genererAnalyseComparative(a, b).join(' ')
    expect(analyse).toContain('Les deux partagent x.')
    expect(analyse).toContain('même limite : y.')
  })

  it('repli neutre si vraiment rien à comparer (rôles/forces/faiblesses/éléments identiques et vides)', () => {
    const a = creerBuildFixture({ id: 'a', nom: 'Build A' })
    const b = creerBuildFixture({ id: 'b', nom: 'Build B' })
    const analyse = genererAnalyseComparative(a, b)
    expect(analyse).toHaveLength(1)
    expect(analyse[0]).toContain('profil très proche')
  })

  it('gère deux rôles totalement disjoints sans rôle commun', () => {
    const a = creerBuildFixture({ id: 'a', nom: 'Build A', roles: ['tank'] })
    const b = creerBuildFixture({ id: 'b', nom: 'Build B', roles: ['soin'] })
    const analyse = genererAnalyseComparative(a, b).join(' ')
    expect(analyse).toContain("n'occupent pas le même rôle")
    expect(analyse).toContain('tank')
    expect(analyse).toContain('soin')
  })

  it("ne génère pas de paragraphe éléments si aucun des deux n'a de dégâts élémentaires", () => {
    const a = creerBuildFixture({ id: 'a', nom: 'Build A', elements: [] })
    const b = creerBuildFixture({ id: 'b', nom: 'Build B', elements: [] })
    const analyse = genererAnalyseComparative(a, b).join(' ')
    expect(analyse).not.toContain('dégâts élémentaires')
  })

  it("signale l'absence de dégâts élémentaires d'un côté quand l'autre en a", () => {
    const a = creerBuildFixture({ id: 'a', nom: 'Build A', elements: [], forces: ['X'] })
    const b = creerBuildFixture({ id: 'b', nom: 'Build B', elements: ['feu'], forces: ['X'] })
    const analyse = genererAnalyseComparative(a, b).join(' ')
    expect(analyse).toContain("n'inflige pas de dégâts élémentaires marqués")
  })

  it('retombe sur le nom complet des deux côtés si le nom tronqué est identique (collision)', () => {
    const a = creerBuildFixture({
      id: 'a',
      nom: 'Ensorceleur Feu (Lignée draconique rouge)',
      forces: ['Simple'],
    })
    const b = creerBuildFixture({
      id: 'b',
      nom: 'Ensorceleur Feu — Sorlock (dip Occultiste)',
      forces: ['Tanky'],
    })
    const analyse = genererAnalyseComparative(a, b).join(' ')
    expect(analyse).toContain('Lignée draconique rouge')
    expect(analyse).toContain('Sorlock')
  })
})
