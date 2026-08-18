import { describe, expect, it } from 'vitest'
import { creerBuildFixture } from '../../test/fixtures'
import { calculerPlansCarac, noteBonusPermanent } from './bonusPermanentsUtils'

// Build avec deux augmentations de +2 Charisme (niv 4 et niv 12), départ 14 → cible 18.
const buildCharisme = creerBuildFixture({
  caracDepart: { FOR: 8, DEX: 14, CON: 14, INT: 8, SAG: 10, CHA: 14 },
  dons: ['+2 Charisme (niv 4)', '+2 Charisme (niv 12)'],
})

describe('calculerPlansCarac', () => {
  it('ne calcule rien sans bonus permanent', () => {
    expect(calculerPlansCarac(buildCharisme, {})).toEqual([])
  })

  it('avec +3 Charisme permanent, libère le niveau 12 et laisse un demi-don au niveau 4', () => {
    const [plan] = calculerPlansCarac(buildCharisme, { CHA: 3 })
    expect(plan.stat).toBe('CHA')
    expect(plan.depart).toBe(14)
    expect(plan.totalASI).toBe(4)
    expect(plan.cible).toBe(18)
    expect(plan.pointsRestants).toBe(1)
    expect(plan.niveauxLibres).toEqual([12])
    expect(plan.niveauDemiDon).toBe(4)
  })

  it('avec +4 Charisme permanent (>= tout le total prévu), les deux niveaux sont libres', () => {
    const [plan] = calculerPlansCarac(buildCharisme, { CHA: 4 })
    expect(plan.pointsRestants).toBe(0)
    expect([...plan.niveauxLibres].sort((a, b) => a - b)).toEqual([4, 12])
    expect(plan.niveauDemiDon).toBeNull()
  })

  it('un bonus permanent sur une autre caractéristique ne modifie rien', () => {
    expect(calculerPlansCarac(buildCharisme, { FOR: 2 })).toEqual([])
  })
})

describe('noteBonusPermanent', () => {
  it('ne dit rien avant que le premier palier concerné soit atteint', () => {
    expect(noteBonusPermanent(buildCharisme, { CHA: 3 }, 1)).toBeNull()
  })

  it('suggère Résilient au niveau du demi-don', () => {
    const note = noteBonusPermanent(buildCharisme, { CHA: 3 }, 4)
    expect(note).toContain('Résilient')
  })

  it('signale le palier entièrement libre', () => {
    const note = noteBonusPermanent(buildCharisme, { CHA: 3 }, 12)
    expect(note).toContain('entièrement libre')
  })

  it('avertit rétrospectivement si le niveau actuel a dépassé un palier libéré', () => {
    const note = noteBonusPermanent(buildCharisme, { CHA: 3 }, 20)
    expect(note).toContain('Tu es déjà niveau 20')
  })
})
